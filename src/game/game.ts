// The game loop: ties together the generated floor, player, intentions, loose cubes, doors,
// pickups, items and rendering. Rule of thumb for this file: anything an item might want to
// change reads a stat or emits an event (docs/ITEMS.md §3).

import * as THREE from 'three';
import { sfx, sfx2, unlockAudio } from '../audio/sfx';
import { intentFromStats, Intents } from '../combat/intents';
import { ITEM_BY_ID, ITEMS } from '../content/items';
import { AIR, mat, MATERIALS } from '../content/materials';
import { ROOM_TEMPLATES } from '../content/rooms';
import { SYNERGIES } from '../content/synergies';
import { blockDamage, type DamageKind } from '../core/damage';
import { RunRng } from '../core/rng';
import { StatSheet } from '../core/stats';
import { Doors, type Door } from '../entities/doors';
import { Pickups } from '../entities/pickups';
import { Player } from '../entities/player';
import { Input } from '../input/input';
import { Inventory } from '../items/inventory';
import { ItemPools } from '../items/pool';
import type { ItemApi } from '../items/types';
import { DEBRIS_SIZE, DebrisSystem } from '../physics/debris';
import { raycastVoxels, type VoxelHit } from '../physics/raycast';
import { boxHits } from '../physics/voxel-collide';
import { buildAtlas } from '../render/atlas';
import { ChunkRenderer } from '../render/chunks';
import { CrackView, DebrisView } from '../render/debris-view';
import { Hands } from '../render/hands';
import { Particles } from '../render/particles';
import { buildFloor, cellOf, SURFACE_Y, type FloorResult } from '../world/floor';
import type { VoxelWorld } from '../world/world';
import { createBus, type GameBus } from './events';
import { Hud } from './hud';

const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
const MAX_CUBES = IS_TOUCH ? 1000 : 2000;
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
  readonly inventory: Inventory;
  bus: GameBus = createBus();
  rng!: RunRng;
  pools!: ItemPools;
  seed: number;
  depth = 1;
  floor!: FloorResult;
  world!: VoxelWorld;
  debris!: DebrisSystem;
  doors!: Doors;
  pickups!: Pickups;
  room = -1;
  visited = new Set<number>();
  /** Keep simulating while the mouse isn't captured (for automated tests). */
  simulateUnlocked = false;

  private atlas = buildAtlas();
  private chunks!: ChunkRenderer;
  private debrisView: DebrisView;
  private cracks: CrackView;
  private particles: Particles;
  private intents: Intents;
  private api: ItemApi;
  private time = 0;
  private fpsAcc = 0; private fpsN = 0; fps = 0;
  private fogColor = new THREE.Color();
  private descending = 0;

  constructor(canvas: HTMLCanvasElement, seed: number) {
    this.seed = seed;
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
    this.debrisView = new DebrisView(this.scene, this.atlas, MAX_CUBES);
    this.cracks = new CrackView(this.scene);
    this.intents = new Intents(this.scene, {
      solid: (x, y, z) => this.solid(x, y, z),
      tier: (x, y, z) => mat(this.world.get(x, y, z)).tier,
      hitBlock: (hit, t) => this.intentHitsBlock(hit, t.damage, t.mining),
      debrisAt: (x, y, z, r) => this.debrisAt(x, y, z, r),
      hitDebris: (i, v, t) => {
        const k = (0.25 + t.damage * 0.06) * 6 / Math.max(1, v.length());
        this.debris.push(i, v.x * k, v.y * k + 1, v.z * k);
      },
      splash: (p, color, big) => this.particles.burst(p.x, p.y, p.z, color, big ? 10 : 5, big ? 3 : 2, 0.06),
    });
    this.api = this.makeApi();
    this.inventory = new Inventory(ITEM_BY_ID, SYNERGIES, this.stats, () => this.bus, () => this.api);
    document.addEventListener('mousedown', unlockAudio);
    addEventListener('keydown', unlockAudio);
    addEventListener('resize', () => this.resize());
    this.resize();
    this.newRun(seed);
  }

  // ───────────────────────── runs and floors ─────────────────────────

  /** Starts a new run: fresh items, keys and pools, floor 1. */
  newRun(seed = this.seed) {
    this.seed = seed;
    this.rng = new RunRng(seed);
    this.pools = new ItemPools(ITEMS, this.rng.get('loot'));
    this.inventory.restore([]);
    this.player.hand = [];
    this.player.keys = 0;
    this.depth = 1;
    this.buildLevel();
    this.hud.setItems(this.inventory.items.map(i => i.def));
    this.hud.toast(`Seed ${seed}`);
  }

  /** Down the trapdoor: same run, same items, a new floor. */
  nextFloor() {
    this.depth++;
    this.buildLevel();
    this.hud.toast(`Floor ${this.depth}`);
  }

  private buildLevel() {
    this.chunks?.dispose();
    this.doors?.dispose();
    this.pickups?.dispose();
    this.floor = buildFloor(this.rng, this.depth, ROOM_TEMPLATES);
    this.world = this.floor.world;
    this.chunks = new ChunkRenderer(this.world, this.scene, this.atlas, 64);
    this.debris = new DebrisSystem(MAX_CUBES, (x, y, z) => this.solid(x, y, z), (i, x, y, z, s) => this.onDebrisImpact(i, x, y, z, s));
    this.doors = new Doors(this.scene, this.floor.doors);
    this.pickups = new Pickups(this.scene);
    for (const p of this.floor.pedestals) {
      const type = this.floor.rooms[p.room].type;
      const id = this.pools.draw(type === 'vault' ? 'vault' : 'treasure');
      this.pickups.add('item', p.x + 0.5, p.y, p.z + 0.5, p.room, id, id ? ITEM_BY_ID.get(id)!.color : 0xffffff);
    }
    for (const k of this.floor.keys) this.pickups.add('key', k.x + 0.5, k.y, k.z + 0.5, k.room);
    const t = this.floor.trapdoor;
    if (t) this.pickups.add('trapdoor', t.x + 0.5, t.y + 0.01, t.z + 0.5, t.room);

    // a fresh bus per floor: drops every hook and pending chain reaction from the last one
    this.bus = createBus();
    this.inventory.rebuild();
    this.player.spawnAt(...this.floor.spawn);
    this.player.yaw = 0; this.player.pitch = 0;
    this.visited = new Set();
    this.room = -1;
    this.bus.emit('floorEnter', { depth: this.depth });
    this.hud.setFloor(this.floor, this.depth);
  }

  /** World voxels plus closed doors. */
  solid(x: number, y: number, z: number) {
    return this.world.solid(x, y, z) || this.doors.solidAt(x, y, z);
  }

  // ───────────────────────── items ─────────────────────────

  private makeApi(): ItemApi {
    const game = this;
    return {
      get bus() { return game.bus; },
      stats: () => this.stats.all,
      has: id => this.inventory.has(id),
      hasTag: tag => this.inventory.hasTag(tag),
      held: () => this.player.hand,
      rng: () => this.rng.get('items'),
      materialAt: (x, y, z) => this.world.get(x, y, z),
      damageBlock: (x, y, z, a, kind, src) => this.damageBlock(x, y, z, a, 1, kind, src),
      explode: (x, y, z, r, d, src) => this.explode(x, y, z, r, d, src),
      spawnDebris: (m, x, y, z, vx, vy, vz) => { this.debris.spawn(m, x, y, z, vx, vy, vz); },
      toast: text => this.hud.toast(text),
      defer: fn => this.bus.defer(fn),
    };
  }

  /** Gives an item (pedestal or console) and shows what it changed. */
  give(id: string) {
    const r = this.inventory.gain(id);
    if (!r) { console.warn('Unknown item:', id, '· available:', ITEMS.map(i => i.id)); return; }
    this.pools.remove(id);
    this.bus.emit('itemGained', { id, uid: r.instance.uid });
    this.hud.setItems(this.inventory.items.map(i => i.def));
    this.hud.itemBanner(r.instance.def, r.changes, r.newSynergies);
    sfx2.item();
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
    return this.breakBlock(x, y, z, kind, source);
  }

  breakBlock(x: number, y: number, z: number, kind: DamageKind, source: string): boolean {
    const id = this.world.get(x, y, z);
    const ev = this.bus.emit('blockBreak', { x, y, z, material: id, kind, source, spawnDebris: true });
    if (ev.cancelled) return false;
    this.world.set(x, y, z, AIR);
    this.debris.wake(x, y, z);
    this.particles.burst(x + 0.5, y + 0.5, z + 0.5, mat(id).colors[0], 10, 3.5, 0.09);
    if (ev.spawnDebris) {
      const r = () => (Math.random() - 0.5) * 1.5;
      this.debris.spawn(id, x + 0.5, y + 0.5, z + 0.5, r(), 1 + Math.random(), r());
    }
    sfx.break(Math.min(3, mat(id).tier));
    return true;
  }

  /** Damages every block in a sphere and throws nearby cubes. Items can resize it via `explosion`. */
  explode(x: number, y: number, z: number, radius: number, damage: number, source: string) {
    const ev = this.bus.emit('explosion', { x, y, z, radius, damage, source });
    if (ev.cancelled) return;
    const r = ev.radius, ri = Math.ceil(r);
    for (let dz = -ri; dz <= ri; dz++) for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
      const bx = Math.floor(x) + dx, by = Math.floor(y) + dy, bz = Math.floor(z) + dz;
      const d = Math.hypot(bx + 0.5 - x, by + 0.5 - y, bz + 0.5 - z);
      if (d > r) continue;
      this.damageBlock(bx, by, bz, ev.damage * (1 - 0.5 * d / r), 1, 'explosion', `explosion:${source}`);
    }
    for (let i = 0; i < this.debris.max; i++) {
      if (!this.debris.isAlive(i)) continue;
      const i3 = i * 3;
      const ox = this.debris.pos[i3] - x, oy = this.debris.pos[i3 + 1] - y, oz = this.debris.pos[i3 + 2] - z;
      const d = Math.hypot(ox, oy, oz);
      if (d > r * 1.8 || d < 1e-3) continue;
      const k = 9 * (1 - d / (r * 1.8)) / d;
      this.debris.push(i, ox * k, oy * k + 3, oz * k);
    }
    this.particles.burst(x, y, z, 0xffa040, 40, 7, 0.14);
    this.particles.burst(x, y, z, 0x555555, 20, 4, 0.2);
    sfx2.boom();
  }

  private intentHitsBlock(hit: VoxelHit, damage: number, mining: number) {
    const id = this.world.get(hit.x, hit.y, hit.z);
    if (id === AIR) return false; // a door
    const broke = this.damageBlock(hit.x, hit.y, hit.z, damage, mining, 'intent', 'intent');
    if (!broke) sfx.hit(Math.min(3, isFinite(mat(id).tier) ? mat(id).tier : 3));
    return broke;
  }

  // ───────────────────────── loose cubes ─────────────────────────

  private debrisAt(x: number, y: number, z: number, r: number): number {
    const reach = DEBRIS_SIZE / 2 + r;
    const d = this.debris;
    for (let i = 0; i < d.max; i++) {
      if (!d.isAlive(i)) continue;
      const i3 = i * 3;
      if (Math.abs(d.pos[i3] - x) < reach && Math.abs(d.pos[i3 + 1] - y) < reach && Math.abs(d.pos[i3 + 2] - z) < reach) return i;
    }
    return -1;
  }

  private onDebrisImpact(i: number, x: number, y: number, z: number, speed: number) {
    const tags = this.debris.tags[i];
    if (!tags) return;
    const ev = this.bus.emit('debrisImpact', { cube: i, x, y, z, material: this.debris.material[i], speed, tags, keepTags: false });
    if (!ev.keepTags) this.debris.tags[i] = null;
  }

  /** Walking into a cube: the core suggests pickup (room in hand) or kick; items may change it. */
  private touchDebris() {
    const p = this.player, b = p.body, d = this.debris;
    const carry = Math.floor(this.stats.get('carry'));
    for (let i = 0; i < d.max; i++) {
      if (!d.isAlive(i) || d.cooldown[i] > 0) continue;
      const i3 = i * 3;
      const dx = d.pos[i3] - b.x, dz = d.pos[i3 + 2] - b.z, cy = d.pos[i3 + 1];
      const horiz = Math.hypot(dx, dz);
      if (horiz > b.hw + DEBRIS_SIZE / 2 + 0.35 || cy < b.y - 0.6 || cy > b.y + b.h) continue;
      const ev = this.bus.emit('touchCube', {
        cube: i, material: d.material[i], held: p.hand.length, carry,
        action: p.hand.length < carry ? 'pickup' : 'kick',
      });
      if (ev.cancelled || ev.action === 'ignore') continue;
      if (ev.action === 'pickup') {
        p.hand.push(d.material[i]);
        d.remove(i);
        sfx.pickup();
        continue;
      }
      const speed = Math.hypot(b.vx, b.vz);
      let kx = horiz > 0.01 ? dx / horiz : -Math.sin(p.yaw), kz = horiz > 0.01 ? dz / horiz : -Math.cos(p.yaw);
      // blend with your running direction so the kick goes "forward"
      if (speed > 0.5) { kx = kx * 0.5 + (b.vx / speed) * 0.5; kz = kz * 0.5 + (b.vz / speed) * 0.5; }
      const kl = Math.hypot(kx, kz) || 1;
      const kick = this.bus.emit('kick', {
        cube: i, material: d.material[i], speed: (4.5 + speed * 1.3) * this.stats.get('kick'), lift: 3.2,
        tags: new Set(d.tags[i] ?? []),
      });
      if (kick.cancelled) continue;
      d.launch(i, (kx / kl) * kick.speed, kick.lift, (kz / kl) * kick.speed);
      d.tags[i] = kick.tags.size ? kick.tags : null;
      d.cooldown[i] = 0.45;
      sfx.kick();
    }
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

  /** Right click: place the top block on the face you look at; with nowhere to place it, throw it. */
  private tryPlace() {
    const p = this.player;
    if (!this.input.placePressed) return;
    if (!p.hand.length) { sfx.denied(); return; }
    const e = p.eye, d = p.forward;
    const hit = raycastVoxels((x, y, z) => this.solid(x, y, z), e.x, e.y, e.z, d.x, d.y, d.z, this.stats.get('reach'));
    const x = hit ? hit.x + hit.nx : 0, y = hit ? hit.y + hit.ny : 0, z = hit ? hit.z + hit.nz : 0;
    const b = p.body;
    const ok = hit && (hit.nx || hit.ny || hit.nz) && this.world.inside(x, y, z) && !this.solid(x, y, z)
      && !this.doors.inDoorway(x, y, z)
      && !boxHits((xx, yy, zz) => xx === x && yy === y && zz === z, b.x, b.y, b.z, b.hw, b.h);
    if (!ok) { this.throwTop(); return; }
    const ev = this.bus.emit('blockPlace', { x, y, z, material: p.top });
    if (ev.cancelled) return;
    this.world.set(x, y, z, ev.material);
    this.debris.clearCell(x, y, z);
    const m = p.hand.pop()!;
    this.bus.emit('drop', { material: m, how: 'place' });
    this.hands.placed();
    sfx.place();
  }

  /** Throws the top block of your hand (Q, or right click with nowhere to place). */
  private throwTop() {
    const p = this.player;
    if (!p.hand.length) { sfx.denied(); return; }
    const e = p.eye.addScaledVector(p.forward, 0.7), dir = p.forward;
    if (this.solid(Math.floor(e.x), Math.floor(e.y), Math.floor(e.z))) { sfx.denied(); return; }
    const m = p.top;
    const cube = this.debris.spawn(m, e.x, e.y, e.z);
    const ev = this.bus.emit('throw', { cube, material: m, speed: 9 * this.stats.get('throw'), lift: 2, tags: new Set() });
    if (ev.cancelled) { this.debris.remove(cube); return; }
    this.debris.launch(cube, dir.x * ev.speed + p.body.vx, dir.y * ev.speed + ev.lift, dir.z * ev.speed + p.body.vz);
    this.debris.tags[cube] = ev.tags.size ? ev.tags : null;
    this.debris.cooldown[cube] = 0.6;
    p.hand.pop();
    this.bus.emit('drop', { material: m, how: 'throw' });
    this.hands.placed();
    sfx.kick();
  }

  /** Walking into solid blocks: `touchBlock` decides whether they shatter (the `crush` stat). */
  private touchBlocks() {
    const p = this.player, b = p.body;
    if (Math.hypot(p.wishX, p.wishZ) < 0.1) return;
    const crush = this.stats.get('crush');
    const fx = b.x + p.wishX * (b.hw + 0.12), fz = b.z + p.wishZ * (b.hw + 0.12);
    const seen = new Set<number>();
    for (const oy of [0.1, 1.0, 1.7]) {
      const x = Math.floor(fx), y = Math.floor(b.y + oy), z = Math.floor(fz);
      const id = this.world.get(x, y, z);
      if (id === AIR) continue;
      const k = this.world.idx(x, y, z);
      if (seen.has(k)) continue;
      seen.add(k);
      const ev = this.bus.emit('touchBlock', { x, y, z, material: id, crush: mat(id).tier <= crush });
      if (!ev.cancelled && ev.crush) this.damageBlock(x, y, z, 1e6, 1, 'crush', 'contact');
    }
  }

  // ───────────────────────── dungeon ─────────────────────────

  private requestDoor(d: Door): boolean {
    const ev = this.bus.emit('doorOpen', { door: d.id, locked: d.locked, needsKey: d.locked });
    if (ev.cancelled) return false;
    if (ev.needsKey) {
      if (this.player.keys <= 0) { this.hud.toast('Locked: you need a key'); sfx.denied(); return false; }
      this.player.keys--;
      this.hud.toast('Unlocked');
      sfx2.unlock();
    }
    if (d.locked) this.doors.unlock(d);
    sfx2.door();
    return true;
  }

  private touchPickups() {
    const b = this.player.body;
    for (const p of this.pickups.list) {
      if (p.taken) continue;
      const horiz = Math.hypot(p.x - b.x, p.z - b.z);
      const dy = b.y - p.y;
      if (p.kind === 'key' && horiz < 0.9 && Math.abs(dy) < 1.2) {
        this.pickups.take(p);
        this.player.keys++;
        this.bus.emit('keyPickup', { count: this.player.keys });
        this.hud.toast('Key');
        sfx2.key();
      } else if (p.kind === 'item' && p.item && horiz < 1.1 && dy > -1.3 && dy < 1.6) {
        // the item floats over a 1-block pedestal: reachable standing next to it or on top
        const id = p.item;
        this.pickups.take(p);
        this.give(id);
      } else if (p.kind === 'trapdoor' && horiz < 0.7 && b.onGround && Math.abs(dy) < 0.3 && !this.descending) {
        this.descending = 0.6;
        sfx2.descend();
      }
    }
  }

  private trackRoom() {
    const [gx, gz] = cellOf(this.player.body.x, this.player.body.z);
    const plan = this.floor.plan;
    if (gx < 0 || gz < 0 || gx >= plan.w || gz >= plan.h) return;
    const id = plan.grid[gx + gz * plan.w];
    if (id < 0 || id === this.room) return;
    this.room = id;
    const first = !this.visited.has(id);
    this.visited.add(id);
    this.bus.emit('roomEnter', { room: id, type: this.floor.rooms[id].type, firstVisit: first });
    this.hud.setRoom(this.floor, id, this.visited);
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
    const inp = this.input;
    const running = inp.locked || this.simulateUnlocked;
    if (running) this.simulate(dt);
    this.chunks.update();

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
    if (inp.pressed.has('Tab') || inp.pressed.has('KeyI')) this.hud.toggleStats();
    this.hud.update(this, running);
    inp.endFrame();
  }

  private simulate(dt: number) {
    this.time += dt;
    const inp = this.input;
    if (inp.pressed.has('KeyR')) { this.newRun(this.seed + 1 + Math.floor(Math.random() * 1000)); return; }
    if (this.descending > 0) {
      this.descending -= dt;
      if (this.descending <= 0) { this.descending = 0; this.nextFloor(); return; }
    }
    const solid = (x: number, y: number, z: number) => this.solid(x, y, z);
    this.player.update(dt, inp, this.stats.all, solid, {
      jump: v => { const ev = this.bus.emit('jump', { velocity: v }); return ev.cancelled ? null : ev.velocity; },
      land: fall => { this.bus.emit('land', { fallSpeed: fall }); },
    });
    this.touchBlocks();
    this.fire();
    this.tryPlace();
    if (inp.pressed.has('KeyQ')) this.throwTop();
    const b = this.player.body;
    this.doors.update(dt, b.x, b.y, b.z, b.hw, b.h, d => this.requestDoor(d));
    this.debris.update(dt);
    this.touchDebris();
    this.touchPickups();
    this.intents.update(dt);
    this.bus.flush();
    this.trackRoom();
    this.pickups.update(dt);
    this.particles.update(dt);
    this.debrisView.update(this.debris, this.time);
    this.cracks.update(this.world);
    this.hands.update(dt, this.player.walkPhase, this.player.top);
  }

  /** What the debug HUD shows. */
  get debug() {
    return {
      fps: this.fps,
      tris: this.chunks.triangles,
      debris: this.debris.count,
      intents: this.intents.count,
      damaged: this.world.damaged.size,
      pos: [this.player.body.x, this.player.body.y, this.player.body.z].map(v => v.toFixed(1)).join(' '),
      held: this.player.hand.length ? this.player.hand.map(m => MATERIALS[m].name).join(', ') : '—',
      room: this.room >= 0 ? `${this.room} (${this.floor.rooms[this.room].type}, ${this.floor.rooms[this.room].template})` : '—',
    };
  }
}
