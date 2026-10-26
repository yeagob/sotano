// M0 game loop: ties together world, player, intentions, loose blocks, items and rendering.

import * as THREE from 'three';
import { sfx, unlockAudio } from '../audio/sfx';
import { intentFromStats, Intents } from '../combat/intents';
import { ITEM_BY_ID, ITEMS, type ItemDef } from '../content/items';
import { AIR, mat, MATERIALS } from '../content/materials';
import { ROOM_TEMPLATES } from '../content/rooms';
import { blockDamage, type DamageKind } from '../core/damage';
import { RunRng } from '../core/rng';
import { StatSheet } from '../core/stats';
import { Player } from '../entities/player';
import { Input } from '../input/input';
import { DebrisSystem, DEBRIS_SIZE } from '../physics/debris';
import { raycastVoxels, type VoxelHit } from '../physics/raycast';
import { boxHits } from '../physics/voxel-collide';
import { buildAtlas } from '../render/atlas';
import { ChunkRenderer } from '../render/chunks';
import { CrackView, DebrisView } from '../render/debris-view';
import { Hands } from '../render/hands';
import { Particles } from '../render/particles';
import { generateM0, SURFACE_Y } from '../world/gen';
import type { VoxelWorld } from '../world/world';
import { createBus, type GameBus } from './events';
import { Hud } from './hud';

const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
const DUNGEON_FOG = new THREE.Color(0x15110e);
const SKY = new THREE.Color(0x8ec5ee);

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(75, 1, 0.05, 200);
  readonly input: Input;
  readonly hud = new Hud();
  readonly hands: Hands;
  readonly player = new Player();
  readonly stats = new StatSheet();
  bus: GameBus = createBus();
  rng!: RunRng;
  world!: VoxelWorld;
  debris!: DebrisSystem;
  items: ItemDef[] = [];
  template = '';

  private atlas = buildAtlas();
  private chunks!: ChunkRenderer;
  private debrisView: DebrisView;
  private cracks: CrackView;
  private particles: Particles;
  private intents: Intents;
  private time = 0;
  private fpsAcc = 0; private fpsN = 0; fps = 0;
  private fogColor = new THREE.Color();

  constructor(canvas: HTMLCanvasElement, readonly seed: number) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.autoClear = false;
    this.input = new Input(canvas);
    this.hands = new Hands(1);
    this.scene.fog = new THREE.Fog(DUNGEON_FOG, 6, 34);
    this.scene.add(new THREE.HemisphereLight(0xfff0dd, 0x302824, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(0.4, 1, 0.3);
    this.scene.add(sun);
    this.particles = new Particles(this.scene);
    this.debrisView = new DebrisView(this.scene, 160);
    this.cracks = new CrackView(this.scene);
    this.intents = new Intents(this.scene, {
      solid: (x, y, z) => this.world.solid(x, y, z),
      soft: (x, y, z) => mat(this.world.get(x, y, z)).tier === 0,
      hitBlock: (hit, t) => this.intentHitsBlock(hit, t.damage, t.mining),
      debris: () => this.debris.items,
      splash: (p, color, big) => this.particles.burst(p.x, p.y, p.z, color, big ? 10 : 5, big ? 3 : 2, 0.06),
    });
    canvas.addEventListener('mousedown', unlockAudio);
    addEventListener('keydown', unlockAudio);
    addEventListener('resize', () => this.resize());
    this.resize();
    this.newRun();
  }

  /** Starts (or restarts) a run with the given seed. */
  newRun(seed = this.seed) {
    this.rng = new RunRng(seed);
    const gen = generateM0(seed, this.rng.get('rooms'), ROOM_TEMPLATES);
    this.world = gen.world;
    this.template = gen.template;
    this.chunks?.dispose();
    this.debris?.world.free();
    this.chunks = new ChunkRenderer(this.world, this.scene, this.atlas, 64);
    this.debris = new DebrisSystem(this.world, IS_TOUCH ? 60 : 150);
    this.player.spawnAt(...gen.spawn);
    this.player.yaw = 0; this.player.pitch = 0; this.player.held = 0;
    // reinstall the items you had on a fresh bus
    this.bus = createBus();
    const keep = this.items.map(i => i.id);
    this.items = [];
    this.stats.clear();
    keep.forEach(id => this.give(id, true));
    this.hud.toast(`Room "${this.template}" · seed ${seed}`);
  }

  // ───────────────────────── items ─────────────────────────

  give(id: string, silent = false) {
    const def = ITEM_BY_ID.get(id);
    if (!def) { console.warn('Unknown item:', id, '· available:', ITEMS.map(i => i.id)); return; }
    const source = `item:${id}:${this.items.length}`;
    for (const m of def.stats ?? []) this.stats.add({ ...m, source });
    def.install?.({
      bus: this.bus, source,
      damageBlock: (x, y, z, a, kind, src) => { this.damageBlock(x, y, z, a, 1, kind, src); },
      materialAt: (x, y, z) => this.world.get(x, y, z),
    });
    this.items.push(def);
    this.hud.setItems(this.items);
    if (!silent) this.hud.banner(def.name, def.description);
  }

  // ───────────────────────── blocks ─────────────────────────

  /** Damages a block through the shared pipeline. Returns true if it breaks. */
  damageBlock(x: number, y: number, z: number, amount: number, mining: number, kind: DamageKind, source: string): boolean {
    const id = this.world.get(x, y, z);
    if (id === AIR) return false;
    const m = mat(id);
    const ev = this.bus.emit('blockDamage', { x, y, z, material: id, amount: blockDamage(amount, mining, m), kind, source });
    if (ev.cancelled || ev.amount <= 0) return false;
    const hp = this.world.hp(x, y, z) - ev.amount;
    if (hp > 1e-6) {
      this.world.damaged.set(this.world.idx(x, y, z), hp);
      return false;
    }
    this.breakBlock(x, y, z, kind);
    return true;
  }

  breakBlock(x: number, y: number, z: number, kind: DamageKind) {
    const id = this.world.get(x, y, z);
    const ev = this.bus.emit('blockBreak', { x, y, z, material: id, kind, spawnDebris: true });
    if (ev.cancelled) return;
    this.world.set(x, y, z, AIR);
    this.debris.setVoxel(x, y, z, false);
    const c = mat(id).colors[0];
    this.particles.burst(x + 0.5, y + 0.5, z + 0.5, c, 14, 3.5, 0.09);
    if (ev.spawnDebris) {
      const r = () => (Math.random() - 0.5) * 1.5;
      this.debris.spawn(id, x + 0.5, y + 0.5, z + 0.5, r(), 1 + Math.random(), r());
    }
    sfx.break(Math.min(3, mat(id).tier));
  }

  private intentHitsBlock(hit: VoxelHit, damage: number, mining: number) {
    const id = this.world.get(hit.x, hit.y, hit.z);
    const broke = this.damageBlock(hit.x, hit.y, hit.z, damage, mining, 'intent', 'intent');
    if (!broke) sfx.hit(Math.min(3, isFinite(mat(id).tier) ? mat(id).tier : 3));
    return broke;
  }

  // ───────────────────────── player actions ─────────────────────────

  private fire() {
    const p = this.player;
    if (!this.input.fireHeld || p.fireCooldown > 0) return;
    const ev = this.bus.emit('fire', { intent: intentFromStats(this.stats.all) });
    if (ev.cancelled) return;
    p.fireCooldown = 1 / this.stats.get('fireRate');
    const dir = p.forward;
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const from = p.eye.addScaledVector(right, 0.18).add(new THREE.Vector3(0, -0.12, 0)).addScaledVector(dir, 0.3);
    this.intents.fire(ev.intent, from, dir, new THREE.Vector3(p.body.vx, 0, p.body.vz));
    this.hands.fire();
    sfx.shoot();
  }

  private tryPlace() {
    const p = this.player;
    if (!this.input.placePressed) return;
    if (!p.held) { sfx.denied(); return; }
    const e = p.eye, d = p.forward;
    const hit = raycastVoxels((x, y, z) => this.world.solid(x, y, z), e.x, e.y, e.z, d.x, d.y, d.z, this.stats.get('reach'));
    if (!hit || (hit.nx === 0 && hit.ny === 0 && hit.nz === 0)) { sfx.denied(); return; }
    const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
    const b = p.body;
    const blocksPlayer = boxHits((xx, yy, zz) => xx === x && yy === y && zz === z, b.x, b.y, b.z, b.hw, b.h);
    if (!this.world.inside(x, y, z) || this.world.solid(x, y, z) || blocksPlayer) { sfx.denied(); return; }
    const ev = this.bus.emit('blockPlace', { x, y, z, material: p.held });
    if (ev.cancelled) return;
    this.world.set(x, y, z, p.held);
    this.debris.setVoxel(x, y, z, true);
    this.debris.clearCell(x, y, z);
    p.held = 0;
    this.hands.placed();
    sfx.place();
  }

  /** Q: throw the block you are holding. */
  private tryThrow() {
    const p = this.player;
    if (!this.input.pressed.has('KeyQ') || !p.held) return;
    const e = p.eye.addScaledVector(p.forward, 0.7), v = p.forward.multiplyScalar(9);
    if (this.world.solid(Math.floor(e.x), Math.floor(e.y), Math.floor(e.z))) { sfx.denied(); return; }
    const d = this.debris.spawn(p.held, e.x, e.y, e.z, v.x + p.body.vx, v.y + 2, v.z + p.body.vz);
    d.cooldown = 0.6;
    p.held = 0;
    sfx.kick();
  }

  /** Walking over a cube: pick it up if your hand is free, otherwise kick it. */
  private touchDebris() {
    const p = this.player, b = p.body;
    for (const d of [...this.debris.items]) {
      if (d.cooldown > 0) continue;
      const t = d.body.translation();
      const dx = t.x - b.x, dz = t.z - b.z;
      const horiz = Math.hypot(dx, dz);
      if (horiz > b.hw + DEBRIS_SIZE / 2 + 0.35 || t.y < b.y - 0.6 || t.y > b.y + b.h) continue;
      if (!p.held) {
        p.held = d.material;
        this.debris.remove(d);
        this.bus.emit('pickup', { material: d.material });
        sfx.pickup();
        continue;
      }
      const speed = Math.hypot(b.vx, b.vz);
      let kx = horiz > 0.01 ? dx / horiz : -Math.sin(p.yaw), kz = horiz > 0.01 ? dz / horiz : -Math.cos(p.yaw);
      // blend with your running direction so the kick goes "forward"
      if (speed > 0.5) { kx = kx * 0.5 + (b.vx / speed) * 0.5; kz = kz * 0.5 + (b.vz / speed) * 0.5; }
      const kl = Math.hypot(kx, kz) || 1;
      const ev = this.bus.emit('kick', { material: d.material, speed: 4.5 + speed * 1.3 });
      if (ev.cancelled) continue;
      d.body.setLinvel({ x: (kx / kl) * ev.speed, y: 3.2, z: (kz / kl) * ev.speed }, true);
      d.body.setAngvel({ x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10, z: (Math.random() - 0.5) * 10 }, true);
      d.cooldown = 0.45;
      sfx.kick();
    }
  }

  // ───────────────────────── loop ─────────────────────────

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.hands.camera.aspect = w / h; this.hands.camera.updateProjectionMatrix();
  }

  frame(dt: number) {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    const inp = this.input;
    if (inp.pressed.has('KeyR')) this.newRun(this.seed + Math.floor(Math.random() * 1000));
    const solid = (x: number, y: number, z: number) => this.world.solid(x, y, z);
    this.player.update(dt, inp, this.stats.all, solid);
    this.fire();
    this.tryPlace();
    this.tryThrow();
    this.debris.update(dt);
    this.touchDebris();
    this.intents.update(dt);
    this.bus.flush();
    this.particles.update(dt);
    this.chunks.update();
    this.debrisView.update(this.debris, this.time);
    this.cracks.update(this.world);
    this.hands.update(dt, this.player.walkPhase, this.player.held);

    // camera with a little walking bob
    const p = this.player, e = p.eye;
    const bob = Math.sin(p.walkPhase * 3.2) * 0.035;
    this.camera.position.set(e.x, e.y + bob, e.z);
    this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ');

    // fog: dark dungeon below, sky above
    const k = THREE.MathUtils.smoothstep(e.y, SURFACE_Y - 3, SURFACE_Y + 2);
    this.fogColor.copy(DUNGEON_FOG).lerp(SKY, k);
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(this.fogColor);
    fog.near = 6 + k * 30; fog.far = 34 + k * 80;
    this.renderer.setClearColor(this.fogColor);

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.hands.scene, this.hands.camera);

    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 0.5) { this.fps = Math.round(this.fpsN / this.fpsAcc); this.fpsAcc = 0; this.fpsN = 0; }
    this.hud.update(this, inp.locked);
    inp.endFrame();
  }

  /** What the debug HUD shows. */
  get debug() {
    return {
      fps: this.fps,
      tris: this.chunks.triangles,
      debris: this.debris.items.length,
      intents: this.intents.count,
      damaged: this.world.damaged.size,
      pos: [this.player.body.x, this.player.body.y, this.player.body.z].map(v => v.toFixed(1)).join(' '),
      held: this.player.held ? MATERIALS[this.player.held].name : '—',
    };
  }
}
