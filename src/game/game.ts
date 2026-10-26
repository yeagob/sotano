// The game loop: ties together the stacked dungeon, player, intentions, loose cubes, bombs,
// doors, pickups, projections (enemies), items and rendering. Rule of thumb for this file:
// anything an item might want to change reads a stat or emits an event (docs/architecture/ITEMS.md §3).

import * as THREE from 'three';
import { sfx, sfx2, sfx3, unlockAudio } from '../audio/sfx';
import { BlastQueue } from '../combat/blasts';
import { intentFromStats, Intents } from '../combat/intents';
import { ENEMY_BUDGET, ENEMY_BY_ID } from '../content/enemies';
import { ITEM_BY_ID, ITEMS } from '../content/items';
import { AIR, MAT, mat, MATERIALS } from '../content/materials';
import { ROOM_D, ROOM_H, ROOM_TEMPLATES, ROOM_W } from '../content/rooms';
import { SYNERGIES } from '../content/synergies';
import { blockDamage, type DamageKind } from '../core/damage';
import { fx } from '../core/fx';
import { RunRandom } from '../core/rng';
import { decodeSeed, encodeSeed, formatSeed, GEN_VERSION, randomRoot } from '../core/seed';
import { ROOM_CLEAR } from '../content/tables/rewards';
import { StatSheet } from '../core/stats';
import type { Enemy } from '../enemies/types';
import { Doors, type Door } from '../entities/doors';
import { Enemies } from '../entities/enemies';
import { Pickups } from '../entities/pickups';
import { Player } from '../entities/player';
import { Input } from '../input/input';
import { Inventory } from '../items/inventory';
import { ItemPools } from '../items/pool';
import type { ItemApi } from '../items/types';
import { validateCatalogue, validateItem } from '../items/validate';
import { DEBRIS_SIZE, DebrisSystem } from '../physics/debris';
import { raycastVoxels, type VoxelHit } from '../physics/raycast';
import { boxHits } from '../physics/voxel-collide';
import { buildAtlas } from '../render/atlas';
import { ChunkRenderer } from '../render/chunks';
import { CrackView, DebrisView } from '../render/debris-view';
import { Hands } from '../render/hands';
import { Particles } from '../render/particles';
import {
  bandOf, carveFloor, cellOf, createDungeonWorld, FLOORS, openHole, planDungeon, ROOM_ID_STRIDE, SURFACE_Y,
  type DungeonPlan,
  type FloorResult, type RoomInfo,
} from '../world/floor';
import type { VoxelWorld } from '../world/world';
import { ActorRegistry, ContactGate, HALF_HEART, halfHeartsFor, type Actor } from '../entities/actors';
import { createBus, type Cause, type GameBus, type Owner, type PickupKind } from './events';
import { Hud } from './hud';

const IS_TOUCH = matchMedia('(pointer: coarse)').matches;

// safety layer 1 at startup: report catalogue problems, and keep invalid items out of the pools
const CATALOGUE_ERRORS = validateCatalogue(ITEMS, SYNERGIES);
for (const e of CATALOGUE_ERRORS) console.error('[items]', e);
const PLAYABLE_ITEMS = ITEMS.filter(i => validateItem(i).length === 0);

const MAX_CUBES = IS_TOUCH ? 1000 : 2000;
const DUNGEON_FOG = new THREE.Color(0x15110e);
const SKY = new THREE.Color(0x8ec5ee);
const COUNTER_CAP = 99;
const SPAWN_GAP = 0.45;
const HOLE_DELAY = 1.5;
/** Damage points a blast deals to every actor in range (8 = one heart to the player). */
const BLAST_ACTOR_DAMAGE = 2 * HALF_HEART;

interface Blast { x: number; y: number; z: number; radius: number; damage: number; actorDamage: number; source: string; owner: Owner; cause: Cause }

interface RoomState { cleared: boolean; started: boolean; queue: string[]; next: number; sealed: boolean }

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
  /** All of the run's randomness, derived from its root (docs/architecture/RNG.md). */
  rng!: RunRandom;
  dungeon!: DungeonPlan;
  pools!: ItemPools;
  /** The run's 32-bit root seed and its shareable code ("ABCDEFGH"). */
  seed = 0;
  seedCode = '';
  /** Floor the player is on now (by height), and the deepest one reached. */
  depth = 1;
  maxDepth = 1;
  world!: VoxelWorld;
  floors = new Map<number, FloorResult>();
  rooms = new Map<number, RoomInfo>();
  debris!: DebrisSystem;
  doors!: Doors;
  pickups!: Pickups;
  enemies!: Enemies;
  room = -1;
  visited = new Set<number>();
  /** Keep simulating while the mouse isn't captured (for automated tests). */
  simulateUnlocked = false;

  private activated = new Set<number>();
  private roomState = new Map<number, RoomState>();
  private holes = new Map<number, number>();   // floor → seconds until its hole opens
  private groundBand = 1;
  private atlas = buildAtlas();
  private chunks!: ChunkRenderer;
  private debrisView: DebrisView;
  private cracks: CrackView;
  private particles: Particles;
  private intents: Intents;
  private api: ItemApi;
  private time = 0;
  /** Every actor of the run (the player and projections), one id space. */
  readonly actors = new ActorRegistry();
  private contacts = new ContactGate();
  /** Queued explosions (chain safety: a few per frame, chains capped). */
  private blasts = new BlastQueue<Blast>();
  /** Bombs set off by a blast carry its chain to their own explosion. */
  private bombCause = new Map<number, Cause>();
  private fpsAcc = 0; private fpsN = 0; fps = 0;
  private fogColor = new THREE.Color();

  constructor(canvas: HTMLCanvasElement, seed?: string) {
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
    this.particles = new Particles(this.scene, 900);
    this.debrisView = new DebrisView(this.scene, this.atlas, MAX_CUBES);
    this.cracks = new CrackView(this.scene);
    this.intents = new Intents(this.scene, {
      solid: (x, y, z) => this.solid(x, y, z),
      tier: (x, y, z) => mat(this.world.get(x, y, z)).tier,
      hitBlock: (hit, t) => this.intentHitsBlock(hit, t.mining),
      debrisAt: (x, y, z, r) => this.debrisAt(x, y, z, r),
      hitDebris: (i, v, t) => {
        const k = t.knock * 6 / Math.max(1, v.length());
        this.debris.push(i, v.x * k, v.y * k + 1, v.z * k);
      },
      enemyAt: (x, y, z, r) => this.enemies.at(x, y, z, r),
      hitEnemy: (uid, v, t) => {
        const e = this.enemies.get(uid);
        const l = Math.hypot(v.x, v.z) || 1;
        if (e) this.damageActor(e, t.damage, 'intent', 'intent', this.player.id, v.x / l, v.z / l);
      },
      splash: (p, color, big) => this.particles.burst(p.x, p.y, p.z, color, big ? 10 : 5, big ? 3 : 2, 0.06),
    });
    this.api = this.makeApi();
    this.inventory = new Inventory(ITEM_BY_ID, SYNERGIES, this.stats, () => this.bus, () => this.api,
      (id, copy) => this.rng.fork('item', id, copy));
    document.addEventListener('mousedown', unlockAudio);
    addEventListener('keydown', unlockAudio);
    addEventListener('resize', () => this.resize());
    this.resize();
    this.newRun(seed);
  }

  // ───────────────────────── runs and floors ─────────────────────────

  /**
   * Starts a new run: a fresh dungeon, items, counters and pools; floor 1.
   * `seed`: a seed code ("ABCD-EFGH"), a numeric root (tests), or nothing for a fresh random run.
   * Everything structural (all floor plans, rock themes, pedestal items) is decided here.
   */
  newRun(seed?: string | number) {
    let root: number | null = typeof seed === 'number' ? seed >>> 0 : typeof seed === 'string' ? decodeSeed(seed) : null;
    const invalid = typeof seed === 'string' && root === null;
    root ??= randomRoot();
    this.seed = root;
    this.seedCode = encodeSeed(root);
    this.rng = new RunRandom(root);
    this.hud.setSeed(this.seedLabel);
    this.dungeon = planDungeon(this.rng);
    this.pools = new ItemPools(PLAYABLE_ITEMS);
    // reserve every pedestal of every floor now, in (floor, room) order
    const slots: { key: string; pool: 'treasure' | 'vault' }[] = [];
    this.dungeon.plans.forEach((plan, i) => {
      for (const r of plan.rooms) if (r.type === 'treasure' || r.type === 'vault')
        slots.push({ key: String((i + 1) * ROOM_ID_STRIDE + r.id), pool: r.type });
    });
    this.pools.reserve(slots, this.rng.fork('reserve'));
    this.chunks?.dispose();
    this.doors?.dispose();
    this.pickups?.dispose();
    this.enemies?.dispose();
    this.world = createDungeonWorld(this.rng, this.dungeon);
    this.chunks = new ChunkRenderer(this.world, this.scene, this.atlas, 48);
    this.debris = new DebrisSystem(MAX_CUBES, (x, y, z) => this.solid(x, y, z), (i, x, y, z, s) => this.onDebrisImpact(i, x, y, z, s));
    this.debris.onFuse = (i, x, y, z) => {
      const chain = this.bombCause.get(i);
      this.bombCause.delete(i);
      this.blasts.current = chain ?? null;
      this.explode(x, y, z, this.stats.get('bombRadius'), this.stats.get('bombDamage'), 'bomb', this.player.id);
      this.blasts.current = null;
    };
    this.blasts.clear(); this.bombCause.clear();
    this.doors = new Doors(this.scene);
    this.pickups = new Pickups(this.scene);
    this.enemies = new Enemies(this.scene, this.enemyHost());
    this.floors.clear(); this.rooms.clear(); this.activated.clear(); this.roomState.clear(); this.holes.clear();
    this.bus = createBus();
    this.inventory.restore([]);
    const p = this.player;
    p.hand = []; p.keys = 0; p.bombs = 1; p.hp = this.stats.get('maxHearts') * 2; p.dead = false; p.invulnT = 0;
    // actors: one id space per run, the player first
    this.actors.reset();
    this.contacts.clear();
    p.id = this.actors.newId();
    p.room = -1;
    this.actors.add(p);
    this.carve(1);
    this.activate(1);
    this.carve(2);
    p.spawnAt(...this.floors.get(1)!.spawn);
    p.yaw = 0; p.pitch = 0;
    this.depth = this.maxDepth = this.groundBand = 1;
    this.room = -1;
    this.visited = new Set();
    this.hud.hideDeath();
    this.hud.dismissBanner();
    this.hud.setItems(this.inventory.items.map(i => i.def));
    this.hud.setFloor(this.floors.get(1)!, 1);
    this.bus.emit('floorEnter', { depth: 1 });
    this.hud.toast(invalid ? `"${seed}" isn't a valid seed: new run ${this.seedLabel}` : `Floor 1 · seed ${this.seedLabel}`);
  }

  /** "ABCD EFGH · v1": what the player shares to replay this run. */
  get seedLabel() {
    return `${formatSeed(this.seedCode)} · v${GEN_VERSION}`;
  }

  /** Carves floor k into the world (one floor ahead of the player), from the run's plan. */
  private carve(k: number) {
    if (k > FLOORS || this.floors.has(k)) return;
    const f = carveFloor(this.world, this.rng, k, this.dungeon.plans[k - 1], {
      templates: ROOM_TEMPLATES,
      pedestalItem: room => this.pools.reservedFor(String(room)) ?? null,
      enemies: ENEMY_BUDGET,
    });
    this.floors.set(k, f);
    for (const r of f.rooms) {
      this.rooms.set(r.id, r);
      this.roomState.set(r.id, { cleared: !r.enemies.length, started: false, queue: [...r.enemies], next: 0, sealed: false });
    }
  }

  /** Activates floor k: its doors, pedestals and keys appear ("the next floor loads"). */
  private activate(k: number) {
    const f = this.floors.get(k);
    if (!f || this.activated.has(k)) return;
    this.activated.add(k);
    this.doors.add(f.doors);
    for (const p of f.pedestals) {
      // the reserved item, unless the player already got it some other way: then a runtime draw
      let id = p.item;
      if (id && (this.inventory.has(id) || this.pools.isTaken(id))) {
        id = this.pools.drawRuntime(this.rooms.get(p.room)?.type === 'vault' ? 'vault' : 'treasure', this.rng.stream('loot'));
      }
      this.pickups.add('item', p.x + 0.5, p.y, p.z + 0.5, p.room, id ? ITEM_BY_ID.get(id) ?? null : null);
    }
    for (const kp of f.keys) this.pickups.add('key', kp.x + 0.5, kp.y + 0.5, kp.z + 0.5, kp.room);
  }

  /** Down a floor (console shortcut): open the hole and drop the player into it. */
  nextFloor() {
    const f = this.floors.get(this.depth);
    if (!f?.hole) return;
    this.activate(this.depth + 1);
    openHole(this.world, f.hole);
    this.player.spawnAt(f.hole.x + 1, f.hole.yTop + 1, f.hole.z + 1);
  }

  /** World voxels plus closed doors. */
  solid(x: number, y: number, z: number) {
    return this.world.solid(x, y, z) || this.doors.solidAt(x, y, z);
  }

  roomAt(x: number, y: number, z: number): RoomInfo | null {
    const f = this.floors.get(bandOf(y));
    if (!f) return null;
    const [gx, gz] = cellOf(x, z);
    if (gx < 0 || gz < 0 || gx >= f.plan.w || gz >= f.plan.h) return null;
    const i = f.plan.grid[gx + gz * f.plan.w];
    return i < 0 ? null : f.rooms[i];
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
      rng: () => this.rng.stream('drops'), // replaced per item copy by the inventory
      materialAt: (x, y, z) => this.world.get(x, y, z),
      damageBlock: (x, y, z, a, kind, src) => this.damageBlock(x, y, z, a, kind, src),
      explode: (x, y, z, r, d, src) => this.explode(x, y, z, r, d, src, this.player.id),
      spawnDebris: (m, x, y, z, vx, vy, vz) => { this.debris.spawn(m, x, y, z, vx, vy, vz); },
      toast: text => this.hud.toast(text),
      defer: fn => this.bus.defer(fn),
      heal: (n, src = 'item') => this.heal(n, src),
      damagePlayer: (n, src = 'item') => this.damagePlayer(n, 'item', src, this.player.id),
      player: () => this.player.id,
      isPlayer: id => id === this.player.id,
      collect: (kind, n) => this.collect(kind, n),
      counts: () => ({ keys: this.player.keys, bombs: this.player.bombs, hp: this.player.hp, maxHp: this.stats.get('maxHearts') * 2 }),
      spawnPickup: (kind, x, y, z) => { this.pickups.add(kind, x, y, z, this.room, null, 0.3); },
    };
  }

  /** Gives an item (pedestal or console) with the full pickup feedback. */
  give(id: string) {
    const r = this.inventory.gain(id);
    if (!r) { console.warn('Unknown item:', id, '· available:', ITEMS.map(i => i.id)); return; }
    this.pools.remove(id);
    const def = r.instance.def;
    this.bus.emit('itemGained', { id, uid: r.instance.uid });
    this.clampHealth();
    this.hud.setItems(this.inventory.items.map(i => i.def));
    this.hud.itemBanner(def, r.changes, r.newSynergies);
    this.hud.flash(def.color);
    this.hands.holdUp(def);
    const b = this.player.body;
    this.particles.burst(b.x, b.y + 1.6, b.z, def.color, 30, 4, 0.08);
    this.particles.burst(b.x, b.y + 1.6, b.z, 0xfff3c4, 16, 3, 0.06);
    sfx2.item();
  }

  // ───────────────────────── health ─────────────────────────

  private clampHealth() {
    this.player.hp = Math.min(this.player.hp, this.stats.get('maxHearts') * 2);
  }

  /** Hurts the player by half-hearts (console, items): `damageActor` in points. */
  damagePlayer(halfHearts: number, kind: DamageKind, source: string, owner: Owner): boolean {
    return this.damageActor(this.player, halfHearts * HALF_HEART, kind, source, owner);
  }

  /**
   * The one damage pipeline for every actor (docs/architecture/ACTORS.md §3): `amount` in damage
   * points through `actorDamage`. Projections lose HP and are knocked back along (kx, kz); the
   * player loses half-hearts (4 points each, rounded up, at least one) and gets invulnerability.
   * Returns true if the hit landed.
   */
  damageActor(t: Actor, amount: number, kind: DamageKind, source: string, owner: Owner, kx = 0, kz = 0): boolean {
    const p = this.player;
    if (!t.alive || t.spawning > 0 || amount <= 0) return false;
    if (t === p && p.invulnT > 0) return false;
    const ev = this.bus.emit('actorDamage', {
      target: t.id, targetKind: t.kind, def: t.def, amount, kind, source, owner,
      knockback: t === p ? 0 : 3, cause: this.blasts.current ?? undefined,
    });
    if (ev.cancelled || ev.amount <= 0) return false;
    if (t !== p) {
      this.enemies.hurt(t as Enemy, ev.amount, kx * ev.knockback, kz * ev.knockback);
      return true;
    }
    p.hp -= halfHeartsFor(ev.amount);
    p.invulnT = this.stats.get('invuln');
    this.hud.hurt();
    sfx3.hurt();
    if (p.hp <= 0) {
      const d = this.bus.emit('death', { source });
      if (d.cancelled) { p.hp = Math.max(1, p.hp); return true; }
      p.hp = 0;
      p.dead = true;
      this.bus.emit('actorDeath', { target: p.id, targetKind: 'player', def: 'player', x: p.body.x, y: p.body.y, z: p.body.z, drops: [] });
      sfx3.death();
      this.hud.showDeath(this.maxDepth, this.inventory.items.map(i => i.def), source);
    }
    return true;
  }

  heal(amount: number, source: string) {
    const ev = this.bus.emit('heal', { amount, source });
    if (ev.cancelled || ev.amount <= 0) return;
    this.player.hp = Math.min(this.stats.get('maxHearts') * 2, this.player.hp + Math.ceil(ev.amount));
    sfx3.heal();
  }

  /** Adds keys, bombs or hearts through `pickupCollect`. Returns false if refused. */
  collect(kind: PickupKind, amount: number): boolean {
    const ev = this.bus.emit('pickupCollect', { kind, amount });
    if (ev.cancelled) return false;
    const p = this.player;
    if (kind === 'key') { p.keys = Math.min(COUNTER_CAP, p.keys + ev.amount); sfx2.key(); }
    else if (kind === 'bomb') { p.bombs = Math.min(COUNTER_CAP, p.bombs + ev.amount); sfx3.bombPickup(); }
    else this.heal(ev.amount, 'pickup');
    return true;
  }

  // ───────────────────────── enemies ─────────────────────────

  private enemyHost() {
    return {
      solid: (x: number, y: number, z: number) => this.solid(x, y, z),
      worldVersion: () => this.world.version,
      player: () => { const b = this.player.body; return { x: b.x, y: b.y, z: b.z, hw: b.hw, h: b.h }; },
      room: (id: number) => this.rooms.get(id)!,
      contact: (e: Enemy) => this.contact(e, this.player),
      projectileHit: (dmg: number, thrower: number) => { this.damageActor(this.player, dmg, 'projectile', 'judgement', thrower); },
      projectileBlock: (x: number, y: number, z: number) => {
        const id = this.world.get(x, y, z);
        return id !== AIR && mat(id).tier === 0 && this.damageBlock(x, y, z, 999, 'crush', 'judgement');
      },
      burst: (e: Enemy, r: number) => this.explode(e.body.x, e.body.y + 0.5, e.body.z, r, 30, `enemy:${e.def}`, e.id, BLAST_ACTOR_DAMAGE),
      died: (e: Enemy) => this.onEnemyDeath(e),
      particles: (x: number, y: number, z: number, c: number, n: number, s: number, size: number) => this.particles.burst(x, y, z, c, n, s, size),
    };
  }

  /**
   * A projection touches an actor: one exchange per pair every 0.5 s (`ContactGate`), and none
   * while the player is invulnerable, so contact effects (and their random rolls) never run per frame.
   */
  private contact(a: Enemy, t: Actor) {
    if (!a.alive || a.spawning > 0 || !t.alive || t.spawning > 0) return;
    if (t === this.player && this.player.invulnT > 0) return;
    if (!this.contacts.ready(a.id, t.id, this.time)) return;
    const ev = this.bus.emit('contact', {
      attacker: a.id, attackerDef: a.def, target: t.id, targetKind: t.kind, toTarget: a.contactDamage, toAttacker: 0,
    });
    if (ev.cancelled) return;
    if (ev.toTarget > 0) this.damageActor(t, ev.toTarget, 'contact', a.def, a.id);
    if (ev.toAttacker > 0) this.damageActor(a, ev.toAttacker, 'contact', 'contact', t.id);
  }

  private onEnemyDeath(e: Enemy) {
    this.bus.off(null, `actor:${e.id}`); // reserved for actor-owned hooks
    this.actors.remove(e.id);
    this.contacts.forget(e.id);
    const rng = this.rng.stream('drops');
    const drops = (Object.entries(e.spec.drops ?? {}) as [PickupKind, number][]).filter(([, p]) => rng.chance(p)).map(([k]) => k);
    const b = e.body;
    const ev = this.bus.emit('actorDeath', { target: e.id, targetKind: 'projection', def: e.def, x: b.x, y: b.y, z: b.z, drops });
    for (const k of ev.drops) this.pickups.add(k, b.x, b.y + 0.6, b.z, e.room, null, 0.3);
    sfx3.dissolve();
  }

  /** Room combat: seal when the player is fully inside, materialise the queue at the centre,
   *  open the doors when every projection of the room is gone. */
  private updateCombat(dt: number) {
    const b = this.player.body;
    for (const [id, st] of this.roomState) {
      if (st.cleared) continue;
      const r = this.rooms.get(id)!;
      const inside = b.x - b.hw > r.x0 && b.x + b.hw < r.x0 + ROOM_W && b.z - b.hw > r.z0 && b.z + b.hw < r.z0 + ROOM_D
        && b.y > r.y0 - 1 && b.y < r.y0 + ROOM_H;
      if (inside && !st.sealed) {
        st.sealed = true;
        this.doors.seal(id, true);
        if (!st.started) { st.started = true; st.next = 0.5; sfx3.seal(); }
      }
      if (!st.started) continue;
      if (st.queue.length) {
        st.next -= dt;
        if (st.next <= 0) { st.next = SPAWN_GAP; this.spawnEnemy(st.queue.shift()!, r); }
        continue;
      }
      // a room only clears once queued blasts (e.g. a last Panic's burst) have gone off
      if (this.enemies.aliveIn(id) === 0 && this.blasts.pending === 0) {
        st.cleared = true;
        this.doors.seal(id, false);
        // Isaac-style clear reward, pre-rolled per room: the room's own fork gives one uniform
        // number, and luck only reweights the table against it (same seed + same luck = same reward)
        const r0 = this.rooms.get(id)!;
        const u = this.rng.fork('floor', r0.floor, 'room', id % ROOM_ID_STRIDE, 'clear').next();
        const reward = ROOM_CLEAR.pickU(u, { floor: r0.floor, luck: this.stats.get('luck') });
        const drops: PickupKind[] = reward ? [reward] : [];
        const ev = this.bus.emit('roomClear', { room: id, drops });
        for (const k of ev.drops) this.pickups.add(k, r.x0 + 6.5, r.y0 + 1, r.z0 + 3.5, id, null, 0.3);
        this.hud.toast('Room clear');
        sfx3.clear();
      } else if (!inside && st.sealed) {
        // the player dug their way out: keep the doors shut until it's cleared, reseal on return
        st.sealed = false;
      }
    }
  }

  /** Materialise one projection at the room's centre column, on the first free height. */
  private spawnEnemy(defId: string, r: RoomInfo) {
    const def = ENEMY_BY_ID.get(defId);
    if (!def) return;
    let x = r.x0 + 6.5, z = r.z0 + 3.5;
    // if the player is standing on the centre (arrived by falling or digging), step aside
    const b = this.player.body;
    const dx = x - b.x, dz = z - b.z, d = Math.hypot(dx, dz);
    if (d < 1.8) { x += (d > 0.01 ? dx / d : 1) * 2; z += (d > 0.01 ? dz / d : 0) * 1.5; }
    let y = r.y0;
    while (y < r.y0 + 3 && this.solid(Math.floor(x), y, Math.floor(z))) y++;
    const id = this.actors.newId();
    const ev = this.bus.emit('enemySpawn', { id, def: defId, hp: def.hp, speed: def.speed, contactDamage: def.contactDamage, tags: new Set(), x, y, z });
    if (ev.cancelled) return;
    this.actors.add(this.enemies.spawn(def, id, r.id, ev.x, ev.y, ev.z, ev.hp, ev.speed, ev.contactDamage, ev.tags));
    sfx3.spawn();
  }

  // ───────────────────────── blocks ─────────────────────────

  /** Damages a block through the shared pipeline (`amount` is block damage, before armor). Returns true if it breaks. */
  damageBlock(x: number, y: number, z: number, amount: number, kind: DamageKind, source: string): boolean {
    const id = this.world.get(x, y, z);
    if (id === AIR) return false;
    const m = mat(id);
    const ev = this.bus.emit('blockDamage', { x, y, z, material: id, amount: blockDamage(amount, m), kind, source });
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
      // launch direction is cosmetic (variable dt means debris never replays anyway)
      this.debris.spawn(id, x + 0.5, y + 0.5, z + 0.5, fx.spread(0.75), fx.range(1, 2), fx.spread(0.75));
    }
    sfx.break(Math.min(3, mat(id).tier));
    this.rollLoot(x, y, z, id, source);
    // digging into the next floor's band activates it
    if (bandOf(y) > this.maxDepth) this.activate(bandOf(y));
    return true;
  }

  /**
   * Broken blocks give nothing but the block itself (owner decision: keys, items and other
   * rewards live in chests, Minecraft-style). The `blockLoot` event still fires with no drops,
   * so an item can add some.
   */
  private rollLoot(x: number, y: number, z: number, material: number, source: string) {
    const ev = this.bus.emit('blockLoot', { x, y, z, material, source, drops: [] });
    for (const k of ev.drops) {
      this.pickups.add(k, x + 0.5, y + 0.1, z + 0.5, this.room, null, 0.4);
      this.particles.burst(x + 0.5, y + 0.5, z + 0.5, k === 'key' ? 0xf2c84b : k === 'bomb' ? 0xffb347 : 0xe0303c, 14, 2.5, 0.07);
    }
  }

  /**
   * Queues an explosion. It runs from `runBlasts()` (a few per frame, outside any other event),
   * so chains never recurse. A blast queued while another runs joins its chain (`gen + 1`).
   */
  explode(x: number, y: number, z: number, radius: number, damage: number, source: string, owner: Owner = 'world', actorDamage = BLAST_ACTOR_DAMAGE) {
    this.blasts.push({ x, y, z, radius, damage, actorDamage, source, owner });
  }

  /** One explosion: damages blocks in a sphere, hurts actors and throws cubes. Items can resize it via `explosion`. */
  private blast({ x, y, z, radius, damage, actorDamage, source, owner, cause }: Blast) {
    const ev = this.bus.emit('explosion', { x, y, z, radius, damage, actorDamage, source, owner, cause });
    if (ev.cancelled) return;
    const r = ev.radius, ri = Math.ceil(r);
    for (let dz = -ri; dz <= ri; dz++) for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
      const bx = Math.floor(x) + dx, by = Math.floor(y) + dy, bz = Math.floor(z) + dz;
      const d = Math.hypot(bx + 0.5 - x, by + 0.5 - y, bz + 0.5 - z);
      if (d > r) continue;
      this.damageBlock(bx, by, bz, ev.damage * (1 - 0.5 * d / r), 'explosion', `explosion:${source}`);
    }
    for (let i = 0; i < this.debris.max; i++) {
      if (!this.debris.isAlive(i)) continue;
      const i3 = i * 3;
      const ox = this.debris.pos[i3] - x, oy = this.debris.pos[i3 + 1] - y, oz = this.debris.pos[i3 + 2] - z;
      const d = Math.hypot(ox, oy, oz);
      if (d > r * 1.8 || d < 1e-3) continue;
      const k = 9 * (1 - d / (r * 1.8)) / d;
      this.debris.push(i, ox * k, oy * k + 3, oz * k);
      // bombs caught in a blast go off almost at once
      if (this.debris.isBomb(i) && d < r) {
        this.debris.fuse[i] = Math.min(this.debris.fuse[i], 0.12);
        this.bombCause.set(i, cause);
      }
    }
    // every actor in range, whatever its side (friendly fire, like bombs on the player)
    for (const a of [...this.actors.all()]) {
      const ab = a.body, ox = ab.x - x, oz = ab.z - z, d = Math.hypot(ox, ab.y + ab.h / 2 - y, oz);
      if (d < r + 0.4) this.damageActor(a, ev.actorDamage, 'explosion', source, owner, ox / (d || 1) * 2, oz / (d || 1) * 2);
    }
    this.particles.burst(x, y, z, 0xffa040, 50, 8, 0.15);
    this.particles.burst(x, y, z, 0xfff3c4, 20, 5, 0.1);
    this.particles.burst(x, y, z, 0x555555, 24, 4, 0.22);
    this.hud.shake(0.35);
    sfx2.boom();
  }

  private intentHitsBlock(hit: VoxelHit, mining: number) {
    const id = this.world.get(hit.x, hit.y, hit.z);
    if (id === AIR) return false; // a door
    const broke = this.damageBlock(hit.x, hit.y, hit.z, mining, 'intent', 'intent');
    if (!broke) sfx.hit(Math.min(3, isFinite(mat(id).tier) ? mat(id).tier : 3));
    return broke;
  }

  // ───────────────────────── loose cubes and bombs ─────────────────────────

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
      const bomb = d.isBomb(i);
      const ev = this.bus.emit('touchCube', {
        cube: i, material: d.material[i], held: p.hand.length, carry, bomb,
        action: !bomb && p.hand.length < carry ? 'pickup' : 'kick',
      });
      if (ev.cancelled || ev.action === 'ignore') continue;
      if (ev.action === 'pickup' && !bomb) {
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

  /** E: drop a bomb (a breakthrough) at your feet. */
  private placeBomb() {
    const p = this.player;
    if (p.bombs <= 0) { sfx.denied(); this.hud.toast('No bombs'); return; }
    const ev = this.bus.emit('bombPlace', { fuse: 1.8 });
    if (ev.cancelled) return;
    p.bombs--;
    const f = p.forward;
    const l = Math.hypot(f.x, f.z) || 1;
    const b = p.body;
    const cube = this.debris.spawn(MAT.bomb, b.x + (f.x / l) * 0.6, b.y + 0.5, b.z + (f.z / l) * 0.6, b.vx * 0.5, 0, b.vz * 0.5);
    this.debris.fuse[cube] = Math.max(0.1, ev.fuse);
    this.bombCause.delete(cube); // the slot may have held an old bomb that despawned unlit
    this.debris.cooldown[cube] = 0.8;
    sfx3.fuse();
  }

  // ───────────────────────── player actions ─────────────────────────

  private fire() {
    const p = this.player;
    if (!this.input.fireHeld || p.fireCooldown > 0 || this.hands.holding) return;
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
      if (!ev.cancelled && ev.crush) this.damageBlock(x, y, z, 1e6, 'crush', 'contact');
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
      if (p.taken || p.delay > 0) continue;
      const horiz = Math.hypot(p.x - b.x, p.z - b.z);
      const dy = b.y - p.y;
      if (p.type === 'item') {
        if (p.item && horiz < 1.1 && dy > -1.3 && dy < 1.6) {
          // the item floats over a 1-block pedestal: reachable standing next to it or on top
          const id = p.item.id;
          this.pickups.take(p);
          this.give(id);
        }
        continue;
      }
      if (horiz > 0.8 || dy < -1.2 || dy > 1.2) continue;
      // hearts stay on the floor while you're at full health, like in Isaac
      if (p.type === 'heart' && this.player.hp >= this.stats.get('maxHearts') * 2) continue;
      if (this.collect(p.type, p.type === 'heart' ? 2 : 1)) {
        this.pickups.take(p);
        this.particles.burst(p.x, p.y + 0.3, p.z, p.type === 'key' ? 0xf2c84b : p.type === 'bomb' ? 0xffb347 : 0xe0303c, 10, 2, 0.06);
      }
    }
  }

  /** Floors, rooms and the way down. */
  private trackPlace(dt: number) {
    const b = this.player.body;
    const band = Math.max(1, bandOf(b.y));
    this.depth = band;
    if (band > this.maxDepth) {
      this.maxDepth = band;
      this.activate(band);
      this.carve(band + 1);
      this.bus.clearDeferred();
        this.bus.emit('floorEnter', { depth: band });
      this.hud.setFloor(this.floors.get(band)!, band);
      this.hud.toast(`Floor ${band}`);
      this.visited = new Set();
    }
    const r = this.roomAt(b.x, b.y + 0.1, b.z);
    if (r && r.id !== this.room) {
      this.room = r.id;
      const first = !this.visited.has(r.id);
      this.visited.add(r.id);
      this.bus.emit('roomEnter', { room: r.id, type: r.type, firstVisit: first });
      this.hud.setRoom(this.floors.get(r.floor)!, r.id, this.visited);
      // the boss room: the next floor loads, and (no boss yet) the way down opens shortly
      const f = this.floors.get(r.floor)!;
      if (r.type === 'boss' && f.hole && !this.holes.has(r.floor)) {
        this.activate(r.floor + 1);
        this.holes.set(r.floor, HOLE_DELAY);
      }
    }
    for (const [k, t] of this.holes) {
      if (t <= 0) continue;
      const left = t - dt;
      this.holes.set(k, left);
      if (left <= 0) {
        const hole = this.floors.get(k)!.hole!;
        openHole(this.world, hole);
        this.particles.burst(hole.x + 1, hole.yTop + 1, hole.z + 1, 0x8a7a6a, 40, 4, 0.15);
        this.hud.shake(0.5);
        this.hud.toast('A way down opens');
        sfx3.rumble();
      }
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
    const inp = this.input;
    if (inp.pressed.has('KeyR') && (this.player.dead || inp.locked || this.simulateUnlocked)) {
      this.newRun(); // every new run gets a fresh seed
    }
    // an information banner stays until clicked; that click only dismisses it
    if (this.hud.bannerOpen && inp.clicked) {
      this.hud.dismissBanner();
      inp.fireHeld = false;
      inp.placePressed = false;
    }
    if (inp.pressed.has('Tab') || inp.pressed.has('KeyI')) this.hud.toggleInventory(this);
    const running = (inp.locked || this.simulateUnlocked) && !this.player.dead && !this.hud.inventoryOpen;
    if (running) this.simulate(dt);
    this.chunks.update();
    const p = this.player, e = p.eye;
    this.chunks.setVisibleRange(e.y - 22, e.y + 22);

    // camera with a little walking bob and explosion shake
    const bob = Math.sin(p.walkPhase * 3.2) * 0.035;
    const sh = this.hud.shakeAmount();
    this.camera.position.set(e.x + fx.spread(sh / 2), e.y + bob + fx.spread(sh / 2), e.z + fx.spread(sh / 2));
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
    this.hud.update(this, running, dt);
    inp.endFrame();
  }

  private simulate(dt: number) {
    this.time += dt;
    const inp = this.input;
    const solid = (x: number, y: number, z: number) => this.solid(x, y, z);
    const b = this.player.body;
    this.player.update(dt, inp, this.stats.all, solid, {
      jump: v => { const ev = this.bus.emit('jump', { velocity: v }); return ev.cancelled ? null : ev.velocity; },
      land: fall => {
        const cause = Math.max(1, bandOf(b.y)) !== this.groundBand ? 'descent' : 'fall';
        this.bus.emit('land', { fallSpeed: fall, cause });
      },
    });
    if (b.onGround) this.groundBand = Math.max(1, bandOf(b.y));
    this.clampHealth();
    this.touchBlocks();
    this.fire();
    this.tryPlace();
    if (inp.pressed.has('KeyQ')) this.throwTop();
    if (inp.pressed.has('KeyE')) this.placeBomb();
    this.doors.update(dt, b.x, b.y, b.z, b.hw, b.h, d => this.requestDoor(d));
    this.debris.update(dt);
    this.touchDebris();
    this.touchPickups();
    this.intents.update(dt);
    this.enemies.update(dt);
    this.blasts.run(b => this.blast(b));
    this.bus.flush();
    this.trackPlace(dt);
    this.updateCombat(dt);
    this.pickups.update(dt, solid);
    this.particles.update(dt);
    this.debrisView.update(this.debris, this.time);
    this.cracks.update(this.world);
    const hand = this.player.hand;
    this.hands.update(dt, this.player.walkPhase, this.player.top, hand.length > 1 ? hand[hand.length - 2] : 0);
  }

  /** What the debug HUD shows. */
  get debug() {
    const r = this.room >= 0 ? this.rooms.get(this.room) : undefined;
    return {
      fps: this.fps,
      tris: this.chunks.triangles,
      debris: this.debris.count,
      intents: this.intents.count,
      enemies: this.enemies.list.length,
      damaged: this.world.damaged.size,
      pos: [this.player.body.x, this.player.body.y, this.player.body.z].map(v => v.toFixed(1)).join(' '),
      held: this.player.hand.length ? this.player.hand.map(m => MATERIALS[m].name).join(', ') : '—',
      room: r ? `${r.id} (${r.type}, ${r.template})` : '—',
    };
  }
}
