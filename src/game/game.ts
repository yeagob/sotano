// The game loop: ties together the stacked dungeon, player, intentions, loose cubes, bombs,
// doors, pickups, projections (enemies), items and rendering. Rule of thumb for this file:
// anything an item might want to change reads a stat or emits an event (docs/architecture/ITEMS.md §3).

import * as THREE from 'three';
import { sfx, sfx2, sfx3, unlockAudio } from '../audio/sfx';
import { BlastQueue } from '../combat/blasts';
import { intentFromStats, Intents } from '../combat/intents';
import { createWeapon, type Weapon, type WeaponHost } from '../combat/weapons';
import { ENEMY_BUDGET, ENEMY_BY_ID, pickWave, waveBudget } from '../content/enemies';
import { ITEM_BY_ID, ITEMS } from '../content/items';
import { AIR, MAT, mat, MATERIALS } from '../content/materials';
import {
  DEFAULT_AFFINITY, ELEMENTS, elemDef, elemKind, fluidHeight, isFalling, type ElementDef, type ElementKey,
} from '../content/elements';
import { ROOM_D, ROOM_H, ROOM_TEMPLATES, ROOM_W } from '../content/rooms';
import { SYNERGIES } from '../content/synergies';
import { pal } from '../content/palette';
import { LEVELS } from '../content/levels';
import { blockDamage, cubeDamage, type DamageKind } from '../core/damage';
import { fx } from '../core/fx';
import { RunRandom } from '../core/rng';
import { decodeSeed, encodeSeed, formatSeed, GEN_VERSION, randomRoot } from '../core/seed';
import { ROOM_CLEAR } from '../content/tables/rewards';
import { StatSheet } from '../core/stats';
import type { Enemy } from '../enemies/types';
import { Doors, type Door } from '../entities/doors';
import { Enemies } from '../entities/enemies';
import { Pickups } from '../entities/pickups';
import { EYE, Player, type PlayerMedium } from '../entities/player';
import { Input } from '../input/input';
import { Inventory } from '../items/inventory';
import { ItemPools } from '../items/pool';
import type { HostApi } from '../items/types';
import { validateCatalogue, validateItem } from '../items/validate';
import { DEBRIS_SIZE, DebrisSystem } from '../physics/debris';
import { raycastVoxels, type VoxelHit } from '../physics/raycast';
import { boxHits } from '../physics/voxel-collide';
import { buildAtlas } from '../render/atlas';
import { ChunkRenderer } from '../render/chunks';
import { CrackView, DebrisView } from '../render/debris-view';
import { Hands } from '../render/hands';
import { Particles } from '../render/particles';
import { isLesson, Tablets } from '../render/tablets';
import { onLocaleChange } from '../i18n';
import {
  bandOf, carveFloor, cellOf, createDungeonWorld, depthOf, FIRST_FLOOR, LAST_FLOOR, openHole, pedestalSlots, planDungeon, ROOM_ID_STRIDE, SURFACE_Y,
  type DungeonPlan,
  type ChestSpec, type FloorResult, type RoomInfo,
} from '../world/floor';
import { CHEST_CONTENTS } from '../content/tables/chests';
import type { VoxelWorld } from '../world/world';
import { ElementSim } from '../world/elements';
import { ActorRegistry, ContactGate, HALF_HEART, HEART, hostile, type Actor, type Faction } from '../entities/actors';
import { createBus, type Cause, type GameBus, type Owner, type PickupKind, type WeaponId } from './events';
import { Hud } from './hud';

const IS_TOUCH = matchMedia('(pointer: coarse)').matches;

// safety layer 1 at startup: report catalogue problems, and keep invalid items out of the pools
const CATALOGUE_ERRORS = validateCatalogue(ITEMS, SYNERGIES);
for (const e of CATALOGUE_ERRORS) console.error('[items]', e);
const PLAYABLE_ITEMS = ITEMS.filter(i => validateItem(i).length === 0);

const MAX_CUBES = IS_TOUCH ? 1000 : 2000;
const DUNGEON_FOG = new THREE.Color(pal('fog.f1'));
/** The fog of each underground floor (its level's), blended to the sky near the surface. */
const LEVEL_FOG = LEVELS.map(l => new THREE.Color(pal(l.fog)));
const SKY = new THREE.Color(pal('sky.day'));
/** Pickup colours for bursts: the key's gold, the seed's ember, life's red. */
const PICKUP_FX = { key: pal('light.gold'), bomb: pal('light.ember'), heart: pal('life.heart') } as const;
const COUNTER_CAP = 99;
const SPAWN_GAP = 0.45;
/** Seconds after entering a boss room until the boss counts as overcome (no bosses yet). */
const HOLE_DELAY = 1.5;
/** Seconds of the fade to black before a new run (R). The fade back waits for the world's meshes. */
const RESTART_FADE = 0.45;
const RESTART_HOLD_MAX = 2;
/** Per frame: at most this many block-break sounds and particle bursts (a great cut breaks dozens). */
const BREAK_SFX_PER_FRAME = 4;
const BREAK_FX_PER_FRAME = 24;
/** Loose cubes a single weapon strike may leave behind; the rest of its cuts vanish as dust. */
const STRIKE_DEBRIS: Record<WeaponId, number> = { intent: 0, blade: 16, beam: 24, greatcut: 24 };
/** Damage points a blast deals to every actor in range (8 = one heart to the player). */
const BLAST_ACTOR_DAMAGE = 2 * HALF_HEART;

/** Element effects per frame at most (particles, sounds): a big fire or a flood never floods the screen. */
const ELEMENT_FX_PER_FRAME = 10;
const ELEMENT_SFX_PER_FRAME = 2;
/** Seconds between element hits on a projection (the player has its invulnerability). */
const ELEMENT_HIT_GAP = 0.5;
/** Seconds between drowning hits once breath runs out. */
const DROWN_GAP = 1.5;
/** Breath refills this many times faster than it drains. */
const BREATH_REFILL = 4;

/** A loose cube must fly at least this fast (blocks/s) to hurt a projection it hits. */
const CUBE_HIT_SPEED = 4;

interface Blast { x: number; y: number; z: number; radius: number; damage: number; actorDamage: number; source: string; owner: Owner; cause: Cause }

interface RoomState { cleared: boolean; started: boolean; queue: string[]; next: number; sealed: boolean }

/** A challenge room: every time you walk in, three waves (harder each wave and each visit). */
interface ChallengeState { entries: number; wave: number; active: boolean; queue: string[]; next: number; wasInside: boolean }
const CHALLENGE_WAVES = 3;
const WAVE_GAP = 1.4;

/** A boss room once entered: the boss's practice and the way down appear when `t` runs out;
 *  the floor only gives way while nobody stands on the hole. */
interface BossState { t: number; revealed: boolean; open: boolean; warned: boolean; dust: number }

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
  maxDepth = FIRST_FLOOR;
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
  private challenges = new Map<number, ChallengeState>();
  /** Every chest of the activated floors (the blocks themselves live in the world). */
  private chests: { spec: ChestSpec; opened: boolean; refused: boolean }[] = [];
  private bosses = new Map<number, BossState>();   // floor → its boss room's state
  /** R: > 0 while fading to black; then the new run stays dark until its meshes are ready. */
  private restartT = 0;
  private revealT = -1;
  private groundBand = FIRST_FLOOR;
  private atlas = buildAtlas();
  private chunks!: ChunkRenderer;
  private debrisView: DebrisView;
  private cracks: CrackView;
  private particles: Particles;
  private intents: Intents;
  private api: HostApi;
  private time = 0;
  /** Every actor of the run (the player and projections), one id space. */
  readonly actors = new ActorRegistry();
  private contacts = new ContactGate();
  /** Queued explosions (chain safety: a few per frame, chains capped). */
  private blasts = new BlastQueue<Blast>();
  /** Bombs set off by a blast carry its chain to their own explosion. */
  private bombCause = new Map<number, Cause>();
  private fpsAcc = 0; private fpsN = 0; fps = 0;
  /** The weapon replacing the intention, if any (docs/architecture/WEAPONS.md). */
  private weapon: Weapon | null = null;
  private weaponId: WeaponId = 'intent';
  private weaponHost: WeaponHost;
  private strikeDebris = 0;
  private breakSfx = 0;
  private breakFx = 0;
  private fogColor = new THREE.Color();
  /** The tutorial's lessons, carved into the roots' walls. */
  private tablets!: Tablets;
  /** Fire, water and lava (docs/architecture/ELEMENTS.md §9). */
  elements!: ElementSim;
  private elemFx = 0;
  private elemSfx = 0;
  private drownT = 0;
  /** Elements the player's body was in last frame (for elementEnter / elementLeave). */
  private playerIn = new Set<ElementKey>();
  private playerMedium: PlayerMedium = { feet: null, head: null };

  constructor(canvas: HTMLCanvasElement, seed?: string) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.autoClear = false;
    this.input = new Input(canvas);
    this.hands = new Hands(1);
    this.scene.fog = new THREE.Fog(DUNGEON_FOG, 6, 34);
    this.scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
    const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
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
        this.hitCube(i, v.x * k, v.y * k + 1, v.z * k);
      },
      // the player's intentions pass through allies
      enemyAt: (x, y, z, r) => this.enemies.at(x, y, z, r, e => hostile(this.player.faction, e.faction)),
      hitEnemy: (uid, v, t) => {
        const e = this.enemies.get(uid);
        const l = Math.hypot(v.x, v.z) || 1;
        if (e) this.damageActor(e, t.damage, 'intent', 'intent', this.player.id, v.x / l, v.z / l);
      },
      splash: (p, color, big) => this.particles.burst(p.x, p.y, p.z, color, big ? 10 : 5, big ? 3 : 2, 0.06),
      elementAt: (x, y, z) => this.elementAt(x, y, z)?.key ?? null,
      quenched: p => this.elementFx('hiss', Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)),
    });
    this.api = this.makeApi();
    this.weaponHost = this.makeWeaponHost();
    this.inventory = new Inventory(ITEM_BY_ID, SYNERGIES, this.stats, () => this.bus, () => this.api,
      (id, copy) => this.rng.fork('item', id, copy));
    document.addEventListener('mousedown', unlockAudio);
    addEventListener('keydown', unlockAudio);
    addEventListener('resize', () => this.resize());
    onLocaleChange(() => this.tablets?.redraw());
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
    // reserve every pedestal of every floor now (boss rooms included), in (floor, room) order
    this.pools.reserve(pedestalSlots(this.dungeon), this.rng.fork('reserve'));
    this.chunks?.dispose();
    this.doors?.dispose();
    this.pickups?.dispose();
    this.enemies?.dispose();
    this.tablets?.dispose();
    this.tablets = new Tablets(this.scene);
    this.world = createDungeonWorld(this.rng, this.dungeon);
    this.elements = new ElementSim(this.world, {
      seed: this.rng.fork('elements').u32(),
      blocked: (x, y, z) => this.solid(x, y, z),
      ignite: (x, y, z, material, by) => this.ignite(x, y, z, material, by),
      react: (x, y, z, r, result) => {
        const ev = this.bus.emit('materialReact', { x, y, z, reaction: r.id, result });
        if (ev.cancelled) return null;
        // a hook may swap the result, but only for a real material (or nothing)
        return Number.isInteger(ev.result) && ev.result >= 0 && ev.result < MATERIALS.length ? ev.result : result;
      },
      fx: (kind, x, y, z) => this.elementFx(kind, x, y, z),
    });
    this.playerIn.clear(); this.drownT = 0;
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
    this.floors.clear(); this.rooms.clear(); this.activated.clear(); this.roomState.clear(); this.challenges.clear(); this.bosses.clear(); this.chests = [];
    this.bus = createBus();
    this.inventory.restore([]);
    this.syncWeapon();
    const p = this.player;
    p.hand = []; p.keys = 0; p.bombs = 1; p.hp = this.maxHp; p.dead = false; p.invulnT = 0; p.breath = this.stats.get('breath');
    // actors: one id space per run, the player first
    this.actors.reset();
    this.contacts.clear();
    p.id = this.actors.newId();
    p.room = -1;
    this.actors.add(p);
    // the run starts among the roots (floor 0, the tutorial)
    this.carve(FIRST_FLOOR);
    this.activate(FIRST_FLOOR);
    this.carve(FIRST_FLOOR + 1);
    p.spawnAt(...this.floors.get(FIRST_FLOOR)!.spawn);
    p.yaw = 0; p.pitch = 0;
    this.depth = this.maxDepth = this.groundBand = FIRST_FLOOR;
    this.room = -1;
    this.visited = new Set();
    this.hud.hideDeath();
    this.hud.dismissBanner();
    this.hud.setItems(this.inventory.items.map(i => i.def));
    this.hud.setFloor(this.floors.get(FIRST_FLOOR)!, FIRST_FLOOR);
    this.bus.emit('floorEnter', { depth: FIRST_FLOOR });
    this.hud.toast(invalid ? 'toast.seedInvalid' : 'toast.newRun', { input: String(seed ?? ''), seed: this.seedLabel });
  }

  /** "ABCD EFGH · v1": what the player shares to replay this run. */
  get seedLabel() {
    return `${formatSeed(this.seedCode)} · v${GEN_VERSION}`;
  }

  /** Carves floor k into the world (one floor ahead of the player), from the run's plan. */
  private carve(k: number) {
    if (k > LAST_FLOOR || this.floors.has(k)) return;
    const f = carveFloor(this.world, this.rng, k, this.dungeon.plans[k], {
      templates: ROOM_TEMPLATES,
      pedestalItem: room => this.pools.reservedFor(String(room)) ?? null,
      enemies: ENEMY_BUDGET,
    });
    this.floors.set(k, f);
    // template elements (pools, braziers) are stable sources, but a decor crate may sit next to a flame
    for (const r of f.rooms) this.elements.wakeBox(r.x0 - 1, r.y0 - 3, r.z0 - 1, r.x0 + ROOM_W, r.y0 + r.height, r.z0 + ROOM_D);
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
    // the boss's pedestal stays bare until the boss is overcome (revealBossItem)
    for (const p of f.pedestals) if (!p.boss && !p.chest) this.placePedestalItem(p);
    for (const spec of f.chests) this.chests.push({ spec, opened: false, refused: false });
    for (const kp of f.keys) this.pickups.add('key', kp.x + 0.5, kp.y + 0.5, kp.z + 0.5, kp.room);
    // the tutorial is carved into the walls of its rooms (never an overlay)
    for (const r of f.rooms) {
      const lesson = ROOM_TEMPLATES.find(q => q.id === r.template)?.lesson;
      if (lesson && isLesson(lesson)) this.tablets.add(lesson, r.x0, r.y0, r.z0);
    }
  }

  /** Puts a pedestal's practice in the world: the reserved one, unless the player already got it
   *  some other way (then a runtime draw from the room's pool). */
  private placePedestalItem(p: { room: number; x: number; y: number; z: number; item: string | null }) {
    let id = p.item;
    if (id && (this.inventory.has(id) || this.pools.isTaken(id))) {
      const type = this.rooms.get(p.room)?.type;
      id = this.pools.drawRuntime(type === 'vault' || type === 'boss' ? type : 'treasure', this.rng.stream('loot'));
    }
    const def = id ? ITEM_BY_ID.get(id) ?? null : null;
    this.pickups.add('item', p.x + 0.5, p.y, p.z + 0.5, p.room, def);
    return def;
  }

  /** Down a floor (console shortcut): open the hole and drop the player into it. */
  nextFloor() {
    const f = this.floors.get(this.depth);
    if (!f?.hole) return;
    this.activate(this.depth + 1);
    const st = this.bosses.get(this.depth);
    if (st) st.open = true;
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

  private makeApi(): HostApi {
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
      message: (owner, id, params) => this.hud.effectToast(owner, id, params),
      defer: fn => this.bus.defer(fn),
      heal: (n, src = 'item') => this.heal(n * HALF_HEART, src),
      damagePlayer: (n, src = 'item') => this.damagePlayer(n, 'item', src, this.player.id),
      player: () => this.player.id,
      isPlayer: id => id === this.player.id,
      collect: (kind, n) => this.collect(kind, n),
      counts: () => ({ keys: this.player.keys, bombs: this.player.bombs, hp: this.player.hp, maxHp: this.maxHp }),
      spawnPickup: (kind, x, y, z) => { this.pickups.add(kind, x, y, z, this.room, null, 0.3); },
    };
  }

  /** What weapons may do: everything through the shared damage pipeline (docs/architecture/WEAPONS.md). */
  private makeWeaponHost(): WeaponHost {
    const p = this.player;
    return {
      stats: () => this.stats.all,
      eye: () => p.eye,
      forward: () => p.forward,
      casting: () => this.input.fireHeld && !this.hands.holding,
      strike: (weapon, damage, mining, reach) => {
        const ev = this.bus.emit('strike', { weapon, damage, mining, reach, color: pal('light.hot'), tags: new Set() });
        if (ev.cancelled) return null;
        this.strikeDebris = STRIKE_DEBRIS[weapon];
        return { damage: ev.damage, mining: ev.mining, reach: ev.reach };
      },
      solid: (x, y, z) => this.solid(x, y, z),
      breakable: (x, y, z) => { const id = this.world.get(x, y, z); return id !== AIR && isFinite(mat(id).hp); },
      // a clean cut: far more than any block's HP, so armor never saves it (hooks still may)
      cut: (x, y, z, source) => { this.damageBlock(x, y, z, 1e6, 'cut', source, this.strikeDebris-- > 0); },
      burn: (x, y, z, amount, source) => this.damageBlock(x, y, z, amount, 'beam', source),
      targets: () => this.enemies.list
        .filter(e => e.alive && e.spawning <= 0 && hostile(p.faction, e.faction))
        .map(e => ({ id: e.id, x: e.body.x, y: e.body.y, z: e.body.z, hw: e.body.hw, h: e.body.h })),
      hit: (id, damage, kx, kz, source) => {
        const e = this.enemies.get(id);
        if (e) this.damageActor(e, damage, source === 'beam' ? 'beam' : 'cut', source, p.id, kx, kz);
      },
      clearProjectiles: inside => { this.enemies.clearProjectiles(p.faction, inside); },
      clearCubes: inside => {
        const d = this.debris;
        let fxLeft = 6;
        for (let i = 0; i < d.max; i++) {
          if (!d.isAlive(i)) continue;
          const i3 = i * 3, x = d.pos[i3], y = d.pos[i3 + 1], z = d.pos[i3 + 2];
          if (!inside(x, y, z)) continue;
          if (d.isBomb(i)) { d.fuse[i] = Math.min(d.fuse[i], 0.05); continue; }
          if (fxLeft-- > 0) this.particles.burst(x, y, z, mat(d.material[i]).colors[0], 8, 3, 0.08);
          d.remove(i);
        }
      },
      particles: (x, y, z, c, n, s, size) => this.particles.burst(x, y, z, c, n, s, size),
      shake: s => this.hud.shake(s),
      swingHands: () => this.hands.fire(),
      chargeHands: k => this.hands.charge(k),
      sound: name => sfx2[name](),
    };
  }

  /** The inventory decides the weapon; swapping drops any charge or strike in progress. */
  private syncWeapon() {
    const id = this.inventory.weapon;
    if (id === this.weaponId) return;
    this.weapon?.dispose();
    this.weaponId = id;
    this.weapon = createWeapon(id, this.scene, this.weaponHost);
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
    this.particles.burst(b.x, b.y + 1.6, b.z, pal('light.core'), 16, 3, 0.06);
    sfx2.item();
  }

  // ───────────────────────── health ─────────────────────────

  private clampHealth() {
    this.player.hp = Math.min(this.player.hp, this.maxHp);
  }

  /** The player's maximum health in points (heart containers × HEART). */
  get maxHp() { return Math.floor(this.stats.get('maxHearts')) * HEART; }

  /** Hurts the player by half-hearts (console, items): `damageActor` in points. */
  damagePlayer(halfHearts: number, kind: DamageKind, source: string, owner: Owner): boolean {
    return this.damageActor(this.player, halfHearts * HALF_HEART, kind, source, owner);
  }

  /**
   * The one damage pipeline for every actor (docs/architecture/ACTORS.md §3): `amount` in damage
   * points through `actorDamage`. Projections lose HP and are knocked back along (kx, kz); the
   * player loses exactly those points (shown as quarter hearts) and gets invulnerability.
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
    p.hp = Math.max(0, p.hp - ev.amount);
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

  /** Heals the player by `amount` damage points (HALF_HEART = half a heart) through `heal`. */
  heal(amount: number, source: string) {
    const ev = this.bus.emit('heal', { amount, source });
    if (ev.cancelled || ev.amount <= 0) return;
    this.player.hp = Math.min(this.maxHp, this.player.hp + ev.amount);
    sfx3.heal();
  }

  /** Adds keys, bombs or hearts through `pickupCollect`. Returns false if refused. */
  collect(kind: PickupKind, amount: number): boolean {
    const ev = this.bus.emit('pickupCollect', { kind, amount });
    if (ev.cancelled) return false;
    const p = this.player;
    if (kind === 'key') { p.keys = Math.min(COUNTER_CAP, p.keys + ev.amount); sfx2.key(); }
    else if (kind === 'bomb') { p.bombs = Math.min(COUNTER_CAP, p.bombs + ev.amount); sfx3.bombPickup(); }
    else this.heal(ev.amount * HALF_HEART, 'pickup'); // hearts are counted in half-hearts
    return true;
  }

  // ───────────────────────── enemies ─────────────────────────

  private enemyHost() {
    return {
      solid: (x: number, y: number, z: number) => this.solid(x, y, z),
      worldVersion: () => this.world.version,
      actors: () => this.actors.all(),
      actor: (id: number) => this.actors.get(id),
      room: (id: number) => this.rooms.get(id)!,
      elemVersion: () => this.world.elemVersion,
      hazard: (e: Enemy, x: number, y: number, z: number) => {
        const d = elemDef(this.world.elemAt(x, y, z)) ?? elemDef(this.world.elemAt(x, y + 1, z));
        return d ? this.affinity(e, d.key).path : null;
      },
      contact: (e: Enemy, t: Actor) => this.contact(e, t),
      projectileHit: (t: Actor, dmg: number, thrower: number) => { this.damageActor(t, dmg, 'projectile', 'judgement', thrower); },
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

  /** Moves an actor to another side (e.g. a projection that becomes part of the self). */
  setFaction(a: Actor, faction: Faction, source: string) {
    if (a.faction === faction) return;
    const from = a.faction;
    a.faction = faction;
    if (a.kind === 'projection') (a as Enemy).targetId = -1; // look again with new eyes
    this.bus.emit('factionChange', { target: a.id, targetKind: a.kind, def: a.def, from, to: faction, source });
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
        && b.y > r.y0 - 3 && b.y < r.y0 + r.height;
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
      if (this.enemies.blockingIn(id) === 0 && this.blasts.pending === 0) {
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
        this.hud.toast('toast.roomClear');
        if (this.room >= 0) this.hud.setRoom(this.floors.get(r.floor)!, this.room, this.visited, this.clearedRooms());
        sfx3.clear();
      } else if (!inside && st.sealed) {
        // the player dug their way out: keep the doors shut until it's cleared, reseal on return
        st.sealed = false;
      }
    }
  }

  /**
   * Challenge rooms (Isaac's, for farming): walking in seals the doors and starts three waves, each
   * harder than the last and every visit harder than the one before; each wave cleared drops a
   * reward rolled on the room's own fork (wave and visit in the path). Leave and come back as often
   * as you like.
   */
  private updateChallenges(dt: number) {
    const b = this.player.body;
    for (const r of this.rooms.values()) {
      if (r.type !== 'challenge') continue;
      let st = this.challenges.get(r.id);
      if (!st) this.challenges.set(r.id, st = { entries: 0, wave: 0, active: false, queue: [], next: 0, wasInside: false });
      const inside = b.x - b.hw > r.x0 && b.x + b.hw < r.x0 + ROOM_W && b.z - b.hw > r.z0 && b.z + b.hw < r.z0 + ROOM_D
        && b.y > r.y0 - 3 && b.y < r.y0 + r.height;
      if (!st.active && inside && !st.wasInside) {
        st.entries++; st.wave = 0; st.active = true; st.next = 0.8;
        this.doors.seal(r.id, true);
        sfx3.seal();
        this.nextWave(r, st);
      }
      st.wasInside = inside;
      if (!st.active) continue;
      if (st.queue.length) {
        st.next -= dt;
        if (st.next <= 0) { st.next = SPAWN_GAP; this.spawnEnemy(st.queue.shift()!, r); }
        continue;
      }
      if (this.enemies.blockingIn(r.id) > 0 || this.blasts.pending > 0) continue;
      // a wave is down: its reward, then the next wave or the end
      const u = this.rng.fork('floor', r.floor, 'room', r.id % ROOM_ID_STRIDE, 'challenge', st.entries, st.wave).next();
      const reward = ROOM_CLEAR.pickU(u, { floor: r.floor, luck: this.stats.get('luck') + st.wave });
      const ev = this.bus.emit('roomClear', { room: r.id, drops: reward ? [reward] : [] });
      for (const k of ev.drops) this.pickups.add(k, r.x0 + 6.5, r.y0 + 1, r.z0 + 3.5, r.id, null, 0.3);
      if (st.wave < CHALLENGE_WAVES) { this.nextWave(r, st); st.next = WAVE_GAP; sfx3.clear(); continue; }
      st.active = false;
      this.doors.seal(r.id, false);
      this.roomState.get(r.id)!.cleared = true;
      this.hud.toast('toast.challengeDone');
      if (this.room >= 0) this.hud.setRoom(this.floors.get(r.floor)!, this.room, this.visited, this.clearedRooms());
      sfx3.reveal();
    }
  }

  private nextWave(r: RoomInfo, st: ChallengeState) {
    st.wave++;
    const rng = this.rng.fork('floor', r.floor, 'room', r.id % ROOM_ID_STRIDE, 'wave', st.entries, st.wave);
    st.queue = pickWave(rng, r.floor, waveBudget(r.floor, st.wave, st.entries - 1));
    this.hud.toast('toast.challengeWave', { n: st.wave });
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
    // never inside fire, lava or a pool: the nearest dry tile of the room instead
    if (this.world.elemAt(Math.floor(x), r.y0, Math.floor(z)) || this.world.elemAt(Math.floor(x), r.y0 - 1, Math.floor(z))) {
      let best: [number, number] | null = null, bd = Infinity;
      for (let row = 0; row < ROOM_D; row++) for (let col = 0; col < ROOM_W; col++) {
        const cx = r.x0 + col, cz = r.z0 + row;
        if (this.solid(cx, r.y0, cz) || !this.solid(cx, r.y0 - 1, cz) || this.world.elemAt(cx, r.y0, cz)) continue;
        const dd = Math.hypot(cx + 0.5 - x, cz + 0.5 - z);
        if (dd < bd) { bd = dd; best = [cx + 0.5, cz + 0.5]; }
      }
      if (best) [x, z] = best;
    }
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
  damageBlock(x: number, y: number, z: number, amount: number, kind: DamageKind, source: string, debris = true): boolean {
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
    return this.breakBlock(x, y, z, kind, source, debris);
  }

  /** `debris = false` starts the event with no loose cube (hooks may still ask for one). */
  breakBlock(x: number, y: number, z: number, kind: DamageKind, source: string, debris = true): boolean {
    const id = this.world.get(x, y, z);
    const ev = this.bus.emit('blockBreak', { x, y, z, material: id, kind, source, spawnDebris: debris });
    if (ev.cancelled) return false;
    this.world.set(x, y, z, AIR);
    this.debris.wake(x, y, z);
    if (this.breakFx++ < BREAK_FX_PER_FRAME) this.particles.burst(x + 0.5, y + 0.5, z + 0.5, mat(id).colors[0], 10, 3.5, 0.09);
    if (ev.spawnDebris) {
      // launch direction is cosmetic (variable dt means debris never replays anyway)
      this.debris.spawn(id, x + 0.5, y + 0.5, z + 0.5, fx.spread(1.6), fx.range(1, 2.8), fx.spread(1.6));
    }
    if (this.breakSfx++ < BREAK_SFX_PER_FRAME) sfx.break(Math.min(3, mat(id).tier));
    // what burns away leaves nothing, not even loot an item would add (no burning loot farms)
    if (kind !== 'fire') this.rollLoot(x, y, z, id, source);
    // digging into the next floor's band activates it
    if (depthOf(y) > this.maxDepth) this.activate(depthOf(y));
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
      this.particles.burst(x + 0.5, y + 0.5, z + 0.5, PICKUP_FX[k], 14, 2.5, 0.07);
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
    this.blastDoors(x, y, z, r, source);
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
    // a breakthrough: white-hot core, ember sparks, ash (docs/art/DECISIONS.md §7.4)
    this.particles.burst(x, y, z, pal('light.ember'), 40, 8, 0.15);
    this.particles.burst(x, y, z, pal('light.core'), 20, 5, 0.1);
    this.particles.burst(x, y, z, pal('ink.ash'), 24, 4, 0.22);
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

  /** A shot hits a loose block: it shatters, or a bomb is only pushed (see `DebrisSystem.hit`). */
  private hitCube(i: number, vx: number, vy: number, vz: number) {
    const d = this.debris, i3 = i * 3;
    if (!d.hit(i, vx, vy, vz)) return;
    const x = d.pos[i3], y = d.pos[i3 + 1], z = d.pos[i3 + 2], m = d.material[i];
    d.remove(i);
    this.particles.burst(x, y, z, mat(m).colors[0], 14, 3.5, 0.1);
    sfx.break(Math.min(3, mat(m).tier));
  }

  /**
   * A loose cube flying into a projection hurts it, harder the harder the material (a thrown
   * obsidian hits like two intentions; dirt barely bruises) and the faster it flies. The cube
   * bounces back, so it never hits twice in one pass. Bombs don't: they have their own blast.
   */
  private cubeStrikes() {
    const d = this.debris;
    for (const e of this.enemies.list) {
      if (!e.alive || e.spawning > 0 || !hostile(this.player.faction, e.faction)) continue;
      const b = e.body;
      for (let i = 0; i < d.max; i++) {
        if (!d.isAlive(i) || d.isResting(i) || d.isBomb(i)) continue;
        const i3 = i * 3, vx = d.vel[i3], vy = d.vel[i3 + 1], vz = d.vel[i3 + 2];
        const speed = Math.hypot(vx, vy, vz);
        if (speed < CUBE_HIT_SPEED) continue;
        const cx = d.pos[i3], cy = d.pos[i3 + 1], cz = d.pos[i3 + 2], r = DEBRIS_SIZE / 2;
        if (Math.abs(cx - b.x) > b.hw + r || Math.abs(cz - b.z) > b.hw + r || cy + r < b.y || cy - r > b.y + b.h) continue;
        const dmg = cubeDamage(d.material[i], speed);
        const l = Math.hypot(vx, vz) || 1;
        this.damageActor(e, dmg, 'kick', 'cube', this.player.id, vx / l, vz / l);
        d.launch(i, -vx * 0.25 + fx.spread(1), Math.abs(vy) * 0.3 + 1.5, -vz * 0.25 + fx.spread(1));
        this.particles.burst(cx, cy, cz, mat(d.material[i]).colors[0], 8, 2.5, 0.07);
        sfx.kick();
      }
    }
  }

  /** Enemies shove the loose blocks they walk into. Bombs are only ever moved by your own shots. */
  private shoveCubes() {
    const d = this.debris;
    for (const e of this.enemies.list) {
      const b = e.body;
      for (let i = 0; i < d.max; i++) {
        if (!d.isAlive(i) || d.isBomb(i)) continue;
        const i3 = i * 3, dx = d.pos[i3] - b.x, dz = d.pos[i3 + 2] - b.z, cy = d.pos[i3 + 1];
        const horiz = Math.hypot(dx, dz);
        if (horiz > b.hw + DEBRIS_SIZE / 2 + 0.1 || cy < b.y - 0.5 || cy > b.y + b.h) continue;
        const nx = horiz > 0.01 ? dx / horiz : 1, nz = horiz > 0.01 ? dz / horiz : 0;
        // a steady shove, not an impulse every frame: only speed up to walking pace away from the enemy
        const along = d.vel[i3] * nx + d.vel[i3 + 2] * nz;
        if (along < 3.5) d.push(i, nx * (3.5 - along), d.isResting(i) ? 1.5 : 0, nz * (3.5 - along));
      }
    }
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
    if (p.bombs <= 0) { sfx.denied(); this.hud.toast('toast.noBombs'); return; }
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

  // ───────────────────────── elements ─────────────────────────

  /** Fire or lava sets a flammable block alight (`ignite`): it burns away, leaving a flame. */
  private ignite(x: number, y: number, z: number, material: number, by: 'fire' | 'lava'): boolean {
    const ev = this.bus.emit('ignite', { x, y, z, material, by });
    if (ev.cancelled) return false;
    return this.breakBlock(x, y, z, 'fire', by, false);
  }

  /** Particles and sounds of the elements, budgeted per frame. */
  private elementFx(kind: 'steam' | 'hiss' | 'catch' | 'out', x: number, y: number, z: number) {
    if (this.elemFx++ >= ELEMENT_FX_PER_FRAME) return;
    const cx = x + 0.5, cy = y + 0.6, cz = z + 0.5, sound = this.elemSfx++ < ELEMENT_SFX_PER_FRAME;
    if (kind === 'steam' || kind === 'hiss') {
      this.particles.burst(cx, cy, cz, pal('el.water.foam'), kind === 'steam' ? 14 : 6, 2.2, 0.12);
      if (sound) sfx3.hiss(kind === 'steam');
    } else if (kind === 'catch') {
      this.particles.burst(cx, cy, cz, pal('el.fire.hi'), 10, 2.5, 0.07);
      this.particles.burst(cx, cy, cz, pal('el.ember.hot'), 6, 3.5, 0.05);
      if (sound) sfx3.catch();
    } else {
      this.particles.burst(cx, y + 0.3, cz, pal('el.smoke'), 6, 1.2, 0.14);
    }
  }

  /** How a projection treats an element: its definition's senses over the defaults. */
  private affinity(e: Enemy, key: ElementKey) {
    return { ...DEFAULT_AFFINITY[key], ...e.spec.elements?.[key] };
  }

  /** The element at a point, counting a fluid only below its surface. */
  elementAt(x: number, y: number, z: number): ElementDef | null {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const b = this.world.elemAt(ix, iy, iz), d = elemDef(b);
    if (!d) return null;
    if (d.fluid && !isFalling(b) && elemKind(this.world.elemAt(ix, iy + 1, iz)) !== elemKind(b) && y - iy > fluidHeight(b)) return null;
    return d;
  }

  /** The elements touching an actor's body: at its feet, its middle and its head (or eyes). */
  private bodyMedium(b: { x: number; y: number; z: number; h: number }, eye: number): PlayerMedium & { mid: ElementDef | null } {
    return { feet: this.elementAt(b.x, b.y + 0.1, b.z), mid: this.elementAt(b.x, b.y + b.h * 0.5, b.z), head: this.elementAt(b.x, b.y + eye, b.z) };
  }

  /** The player in the elements: wading, swimming, breath, burns; enter/leave events. */
  private playerElements(dt: number) {
    const p = this.player, b = p.body;
    const m = this.bodyMedium(b, EYE);
    this.playerMedium = m;
    this.actorEnterLeave(p.id, 'player', 'player', this.playerIn, m);
    // the hottest thing touching you hurts (the invulnerability window paces it)
    const hot = [m.feet, m.mid, m.head].filter((d): d is ElementDef => !!d && d.harm > 0).sort((a, c) => c.harm - a.harm)[0];
    if (hot) this.damageActor(p, hot.harm, 'fire', hot.key, 'world');
    // breath: drains with your head under water, refills fast at the surface
    const max = this.stats.get('breath');
    if (m.head?.breath) {
      p.breath = Math.max(0, p.breath - dt);
      if (p.breath <= 0) {
        this.drownT -= dt;
        if (this.drownT <= 0) {
          this.drownT = DROWN_GAP;
          sfx3.gulp();
          this.particles.burst(b.x, b.y + EYE, b.z, pal('el.water.foam'), 8, 1.5, 0.05);
          this.damageActor(p, HALF_HEART, 'drown', 'drown', 'world');
        }
      }
    } else {
      p.breath = Math.min(max, p.breath + dt * BREATH_REFILL);
      this.drownT = 0;
    }
  }

  /** Emits elementEnter / elementLeave as the player's body goes in and out of elements. */
  private actorEnterLeave(id: number, kind: 'player' | 'projection', def: string, inside: Set<ElementKey>, m: PlayerMedium & { mid: ElementDef | null }) {
    const now = new Set<ElementKey>();
    for (const d of [m.feet, m.mid, m.head]) if (d) now.add(d.key);
    for (const key of now) if (!inside.has(key)) {
      inside.add(key);
      this.bus.emit('elementEnter', { target: id, targetKind: kind, def, element: key, depth: m.head?.key === key ? 'head' : 'feet' });
      if (kind === 'player' && key === 'water') {
        const b = this.player.body;
        this.particles.burst(b.x, b.y + 0.4, b.z, pal('el.water.foam'), 16, 3, 0.08);
        sfx3.splash();
      }
    }
    for (const key of [...inside]) if (!now.has(key)) {
      inside.delete(key);
      this.bus.emit('elementLeave', { target: id, targetKind: kind, def, element: key });
    }
  }

  /** Projections in the elements: their senses set their speed, element hits (paced), and reactions on entering. */
  private enemyElements(dt: number) {
    for (const e of this.enemies.list) {
      if (!e.alive || e.spawning > 0) continue;
      const m = this.bodyMedium(e.body, e.body.h * 0.8);
      const d = m.mid ?? m.feet ?? m.head;
      e.elemT = Math.max(0, e.elemT - dt);
      const was = e.inElement;
      e.inElement = d?.key ?? null;
      if (!d) {
        e.elemSpeed = 1;
        if (was) this.bus.emit('elementLeave', { target: e.id, targetKind: 'projection', def: e.def, element: was });
        continue;
      }
      const a = this.affinity(e, d.key);
      e.elemSpeed = a.speed;
      if (was !== d.key) {
        if (was) this.bus.emit('elementLeave', { target: e.id, targetKind: 'projection', def: e.def, element: was });
        this.bus.emit('elementEnter', { target: e.id, targetKind: 'projection', def: e.def, element: d.key, depth: m.head ? 'head' : 'feet' });
        e.spec.elements?.[d.key]?.enter?.(e);
        if (d.key === 'water') this.particles.burst(e.body.x, e.body.y + 0.3, e.body.z, pal('el.water.foam'), 8, 2, 0.06);
      }
      if (d.harm > 0 && a.harm > 0 && e.elemT <= 0) {
        e.elemT = ELEMENT_HIT_GAP;
        this.damageActor(e, d.harm * a.harm, 'fire', d.key, 'world');
      }
    }
  }

  /** Loose cubes in the elements: lava consumes them, fire burns the flammable ones, water drags
   *  them and floats the ones that float (wood). */
  private debrisElements(dt: number) {
    const d = this.debris;
    const drag = Math.exp(-3 * dt);
    for (let i = 0; i < d.max; i++) {
      if (!d.isAlive(i)) continue;
      const i3 = i * 3, x = d.pos[i3], y = d.pos[i3 + 1], z = d.pos[i3 + 2];
      const b = this.world.elemAt(Math.floor(x), Math.floor(y), Math.floor(z));
      if (!b) continue;
      const k = ELEMENTS[elemKind(b)]!.key, m = d.material[i];
      if (k === 'lava' || (k === 'fire' && mat(m).flammable)) {
        // a breakthrough in the fire goes off at once
        if (d.isBomb(i)) { d.fuse[i] = Math.min(d.fuse[i], 0.05); continue; }
        // old pain can't melt a core belief
        if (k === 'lava' && m === MAT.obsidian) continue;
        d.remove(i);
        this.elementFx('catch', Math.floor(x), Math.floor(y), Math.floor(z));
        continue;
      }
      if (k === 'water') {
        d.vel[i3] *= drag; d.vel[i3 + 2] *= drag;
        // wood rises to the surface; everything else sinks slowly
        if (mat(m).flammable) d.push(i, 0, (3.2 - d.vel[i3 + 1]) * (1 - drag), 0);
        else if (d.vel[i3 + 1] < -2) d.vel[i3 + 1] *= drag;
      }
    }
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

  /**
   * The player's head hit a ceiling at `speed` blocks/s: `headBump` decides, per block above, whether
   * it breaks (it starts as "tier ≤ the headbutt stat"). Breaking keeps a little of the jump, so
   * you pop up into the gap. Returns the upward speed to keep (0 = stop).
   */
  private headBump(speed: number): number {
    const b = this.player.body, hb = this.stats.get('headbutt');
    const y = Math.floor(b.y + b.h + 0.01);
    let broke = false;
    for (let z = Math.floor(b.z - b.hw + 1e-3); z <= Math.floor(b.z + b.hw - 1e-3); z++)
      for (let x = Math.floor(b.x - b.hw + 1e-3); x <= Math.floor(b.x + b.hw - 1e-3); x++) {
        const id = this.world.get(x, y, z);
        if (id === AIR) continue;
        const ev = this.bus.emit('headBump', { x, y, z, material: id, speed, breaks: mat(id).tier <= hb });
        if (!ev.cancelled && ev.breaks && this.damageBlock(x, y, z, 1e6, 'crush', 'head')) broke = true;
      }
    if (!broke) return 0;
    this.hud.shake(0.12);
    sfx.headbutt();
    return speed * 0.45;
  }

  // ───────────────────────── dungeon ─────────────────────────

  private requestDoor(d: Door): boolean {
    const ev = this.bus.emit('doorOpen', { door: d.id, locked: d.locked, needsKey: d.locked });
    if (ev.cancelled) return false;
    if (ev.needsKey) {
      if (this.player.keys <= 0) { this.hud.toast('toast.locked'); sfx.denied(); return false; }
      this.player.keys--;
      this.hud.toast('toast.unlocked');
      sfx2.unlock();
    }
    if (d.locked) this.doors.unlock(d);
    // doors of open rooms rise on their own: only the ones near you are heard
    const b = this.player.body;
    if (Math.hypot(d.cx - b.x, d.cz - b.z) < 9 && Math.abs(d.y0 - b.y) < 4) sfx2.door();
    return true;
  }

  /** A blast that reaches a door blows it apart for good (`doorBreak`): Isaac's bombed doors. */
  private blastDoors(x: number, y: number, z: number, r: number, source: string) {
    for (const d of this.doors.list) {
      if (d.broken) continue;
      // distance from the blast to the nearest point of the doorway
      const nx = Math.max(d.x0, Math.min(d.x1 + 1, x)), ny = Math.max(d.y0, Math.min(d.y1 + 1, y)), nz = Math.max(d.z0, Math.min(d.z1 + 1, z));
      if (Math.hypot(nx - x, ny - y, nz - z) > r) continue;
      const ev = this.bus.emit('doorBreak', { door: d.id, locked: d.locked, source });
      if (ev.cancelled) continue;
      this.doors.break(d);
      this.particles.burst(d.cx, d.cy, d.cz, mat(MAT.crate).colors[0], 30, 6, 0.14);
      this.particles.burst(d.cx, d.cy, d.cz, pal('ink.ash'), 16, 3, 0.2);
      sfx.break(2);
    }
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
      if (p.type === 'heart' && this.player.hp >= this.maxHp) continue;
      if (this.collect(p.type, p.type === 'heart' ? 2 : 1)) {
        this.pickups.take(p);
        this.particles.burst(p.x, p.y + 0.3, p.z, PICKUP_FX[p.type], 10, 2, 0.06);
      }
    }
  }

  /** Walking up to a closed chest opens it, spending its keys (some cost none). */
  private touchChests() {
    const b = this.player.body;
    for (const c of this.chests) {
      if (c.opened) continue;
      const s = c.spec, dist = Math.hypot(b.x - (s.x + 0.5), b.z - (s.z + 0.5));
      if (dist > 3) c.refused = false;
      if (c.refused || dist > 1.5 || b.y < s.y - 1.2 || b.y > s.y + 2.2) continue;
      const ev = this.bus.emit('chestOpen', { x: s.x, y: s.y, z: s.z, cost: s.keys });
      const cost = Math.max(0, Math.floor(ev.cost));
      if (ev.cancelled || this.player.keys < cost) {
        c.refused = true;
        this.hud.toast('toast.chestLocked', { n: cost });
        sfx.denied();
        continue;
      }
      this.player.keys -= cost;
      this.openChest(c, cost);
    }
  }

  /** The chest block turns into its open twin and gives what it kept: the practice reserved for it, or loot. */
  private openChest(c: { spec: ChestSpec; opened: boolean }, cost: number) {
    c.opened = true;
    const s = c.spec;
    this.world.set(s.x, s.y, s.z, MAT.chestopen);
    const cx = s.x + 0.5, cz = s.z + 0.5;
    this.particles.burst(cx, s.y + 1, cz, pal('light.gold'), 24, 3, 0.08);
    this.particles.burst(cx, s.y + 1, cz, pal('brass.base'), 10, 2, 0.06);
    this.hud.shake(0.08);
    if (cost > 0) { this.hud.toast('toast.chestUnlocked', { n: cost }); sfx2.unlock(); } else sfx2.key();
    if (s.item) { this.placePedestalItem({ room: s.room, x: s.x, y: s.y + 1, z: s.z, item: s.item }); return; }
    const rng = this.rng.stream('loot'), floor = depthOf(s.y), luck = this.stats.get('luck');
    const n = 1 + (rng.chance(0.4) ? 1 : 0) + (rng.chance(0.15) ? 1 : 0);
    const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < n; i++) {
      const what = CHEST_CONTENTS.roll(rng, { floor, luck }) ?? 'key';
      // loot lies beside the chest, on a free tile (the chest itself is solid ground too)
      const free = dirs.filter(([dx, dz]) => !this.solid(s.x + dx, s.y, s.z + dz));
      const [dx, dz] = free.length ? free[(i + Math.floor(rng.next() * free.length)) % free.length] : [0, 0];
      const x = cx + dx * 0.9, z = cz + dz * 0.9;
      if (what === 'item') {
        const def = ITEM_BY_ID.get(this.pools.drawRuntime('treasure', rng)) ?? null;
        this.pickups.add('item', free.length ? x : cx, s.y + 1, free.length ? z : cz, s.room, def, 0.3);
      } else this.pickups.add(what, x, s.y + 1.2, z, s.room, null, 0.4);
    }
  }

  /** Floors, rooms and the way down. */
  private trackPlace(dt: number) {
    const b = this.player.body;
    const band = depthOf(b.y);
    this.depth = band;
    if (band > this.maxDepth) {
      this.maxDepth = band;
      this.activate(band);
      this.carve(band + 1);
      this.bus.clearDeferred();
        this.bus.emit('floorEnter', { depth: band });
      this.hud.setFloor(this.floors.get(band)!, band);
      this.hud.toast('toast.floor', { n: band });
      this.visited = new Set();
    }
    const r = this.roomAt(b.x, b.y + 0.1, b.z);
    if (r && r.id !== this.room) {
      this.room = r.id;
      this.player.room = r.id;
      const first = !this.visited.has(r.id);
      this.visited.add(r.id);
      this.bus.emit('roomEnter', { room: r.id, type: r.type, firstVisit: first });
      this.hud.setRoom(this.floors.get(r.floor)!, r.id, this.visited, this.clearedRooms());
      // the boss room: the next floor loads, and (no boss yet) the boss counts as overcome shortly
      if (r.type === 'boss' && !this.bosses.has(r.floor)) {
        this.activate(r.floor + 1);
        this.bosses.set(r.floor, { t: HOLE_DELAY, revealed: false, open: !this.floors.get(r.floor)!.hole, warned: false, dust: 0 });
      }
    }
    for (const [k, st] of this.bosses) this.updateBoss(k, st, dt);
  }

  /**
   * A boss room after its boss is overcome: the practice appears on the pedestal and the floor
   * cracks (real crack stages as a telegraph) until it opens. It never opens under the player:
   * it waits, trickling dust, until they step off the hole (owner rule).
   */
  private updateBoss(k: number, st: BossState, dt: number) {
    if (st.revealed && st.open) return;
    const f = this.floors.get(k)!, hole = f.hole;
    st.t -= dt;
    if (hole && !st.open) this.crackHole(hole, Math.min(1, 1 - st.t / HOLE_DELAY));
    if (st.t > 0) return;
    if (!st.revealed) { st.revealed = true; this.revealBossItem(f); }
    if (!hole || st.open) return;
    if (this.standsOnHole(hole)) {
      if (!st.warned) { st.warned = true; this.hud.toast('toast.holeWait'); sfx3.rumble(); }
      st.dust -= dt;
      if (st.dust <= 0) {
        st.dust = 0.25;
        this.particles.burst(hole.x + 1, hole.yTop + 1.05, hole.z + 1, pal('limestone.dark'), 6, 1.2, 0.06);
      }
      return;
    }
    st.open = true;
    openHole(this.world, hole);
    this.particles.burst(hole.x + 1, hole.yTop + 1, hole.z + 1, pal('limestone.dark'), 40, 4, 0.15);
    this.hud.shake(0.5);
    this.hud.toast('toast.wayDown');
    sfx3.rumble();
  }

  /** The hole's top blocks show real crack stages as `p` goes 0 → 1 (the floor is about to give way). */
  private crackHole(hole: NonNullable<FloorResult['hole']>, p: number) {
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
      const x = hole.x + dx, z = hole.z + dz, id = this.world.get(x, hole.yTop, z);
      if (id === AIR) continue;
      const max = mat(id).hp, i = this.world.idx(x, hole.yTop, z);
      this.world.damaged.set(i, Math.min(this.world.damaged.get(i) ?? max, max * (1 - 0.95 * Math.max(0.05, p))));
    }
  }

  /** Is the player standing (or hovering) over the 2×2 hole? */
  private standsOnHole(hole: NonNullable<FloorResult['hole']>) {
    const b = this.player.body;
    return b.x + b.hw > hole.x && b.x - b.hw < hole.x + 2 && b.z + b.hw > hole.z && b.z - b.hw < hole.z + 2
      && b.y >= hole.yTop && b.y < hole.yTop + 1 + ROOM_H;
  }

  /** The boss's practice appears on its pedestal, with light and a chime. */
  private revealBossItem(f: FloorResult) {
    const p = f.pedestals.find(q => q.boss);
    if (!p) return;
    const def = this.placePedestalItem(p);
    const x = p.x + 0.5, y = p.y + 0.6, z = p.z + 0.5;
    this.particles.burst(x, y, z, def?.color ?? pal('light.gold'), 28, 3, 0.08);
    this.particles.burst(x, y, z, pal('light.core'), 14, 2, 0.06);
    sfx3.reveal();
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
    if (inp.pressed.has('KeyR') && !this.transitioning && (this.player.dead || inp.locked || this.simulateUnlocked)) {
      // every new run gets a fresh seed, behind a short fade to black
      this.restartT = RESTART_FADE;
      this.hud.fadeOut(RESTART_FADE);
      sfx3.restart();
    }
    if (this.restartT > 0) {
      this.restartT -= dt;
      if (this.restartT <= 0) { this.newRun(); this.revealT = 0; }
    } else if (this.revealT >= 0) {
      // stay dark until the new world is meshed, so it never pops in
      this.revealT += dt;
      if (!this.chunks.busy || this.revealT > RESTART_HOLD_MAX) { this.revealT = -1; this.hud.fadeIn(); }
    }
    // an information banner stays until clicked; that click only dismisses it
    if (this.hud.bannerOpen && inp.clicked) {
      this.hud.dismissBanner();
      inp.fireHeld = false;
      inp.placePressed = false;
    }
    if (inp.pressed.has('Tab') || inp.pressed.has('KeyI')) this.hud.toggleInventory(this);
    const running = (inp.locked || this.simulateUnlocked) && !this.player.dead && !this.hud.inventoryOpen && !this.transitioning;
    if (running) this.simulate(dt);
    this.chunks.update();
    const p = this.player, e = p.eye;
    this.chunks.setVisibleRange(e.y - 22, e.y + 22);

    // camera with a little walking bob and explosion shake
    const bob = Math.sin(p.walkPhase * 3.2) * 0.035;
    const sh = this.hud.shakeAmount();
    this.camera.position.set(e.x + fx.spread(sh / 2), e.y + bob + fx.spread(sh / 2), e.z + fx.spread(sh / 2));
    this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ');

    // fog: dark dungeon below, sky above; the element your eyes are in closes it in
    const k = THREE.MathUtils.smoothstep(e.y, SURFACE_Y - 3, SURFACE_Y + 2);
    this.fogColor.copy(LEVEL_FOG[Math.min(LAST_FLOOR, depthOf(e.y))] ?? DUNGEON_FOG).lerp(SKY, k);
    const fog = this.scene.fog as THREE.Fog;
    const under = this.world ? this.elementAt(e.x, e.y, e.z) : null;
    if (under?.fog) {
      this.fogColor.setHex(pal(under.fog.color));
      fog.near = 0; fog.far = under.fog.far;
    } else { fog.near = 6 + k * 30; fog.far = 34 + k * 80; }
    fog.color.copy(this.fogColor);
    this.chunks.animate(this.time);
    this.renderer.setClearColor(this.fogColor);

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.hands.scene, this.hands.camera);

    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 0.5) { this.fps = Math.round(this.fpsN / this.fpsAcc); this.fpsAcc = 0; this.fpsN = 0; }
    this.hud.update(this, running || this.transitioning, dt);
    inp.endFrame();
  }

  private simulate(dt: number) {
    this.time += dt;
    this.breakSfx = this.breakFx = this.elemFx = this.elemSfx = 0;
    const inp = this.input;
    const solid = (x: number, y: number, z: number) => this.solid(x, y, z);
    const b = this.player.body;
    this.player.update(dt, inp, this.stats.all, solid, {
      jump: v => { const ev = this.bus.emit('jump', { velocity: v }); return ev.cancelled ? null : ev.velocity; },
      land: fall => {
        const cause = bandOf(b.y) !== this.groundBand ? 'descent' : 'fall';
        this.bus.emit('land', { fallSpeed: fall, cause });
      },
      bump: speed => this.headBump(speed),
    }, this.playerMedium);
    if (b.onGround) this.groundBand = bandOf(b.y);
    this.clampHealth();
    this.touchBlocks();
    this.syncWeapon();
    if (this.weapon) this.weapon.update(dt);
    else this.fire();
    this.tryPlace();
    if (inp.pressed.has('KeyQ')) this.throwTop();
    if (inp.pressed.has('KeyE')) this.placeBomb();
    this.doors.update(dt, b.x, b.y, b.z, b.hw, b.h, d => this.requestDoor(d));
    this.debris.update(dt);
    this.elements.update(dt);
    this.debrisElements(dt);
    this.playerElements(dt);
    this.touchDebris();
    this.cubeStrikes();
    this.shoveCubes();
    this.touchPickups();
    this.touchChests();
    this.intents.update(dt);
    this.enemyElements(dt);
    this.enemies.update(dt);
    this.blasts.run(b => this.blast(b));
    this.bus.flush();
    this.trackPlace(dt);
    this.updateCombat(dt);
    this.updateChallenges(dt);
    this.pickups.update(dt, solid);
    this.particles.update(dt);
    this.debrisView.update(this.debris, this.time);
    this.cracks.update(this.world);
    const hand = this.player.hand;
    this.hands.update(dt, this.player.walkPhase, this.player.top, hand.length > 1 ? hand[hand.length - 2] : 0);
  }

  /** Rooms whose projections are all released (the minimap lights them). */
  private clearedRooms() {
    const out = new Set<number>();
    for (const [id, st] of this.roomState) if (st.cleared && this.visited.has(id)) out.add(id);
    return out;
  }

  /** Fading between runs (R): the world is frozen and the screen goes dark. */
  get transitioning() { return this.restartT > 0 || this.revealT >= 0; }

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
      elements: `${this.elements.pending} active · ${this.elements.lastWork}/tick`,
      pos: [this.player.body.x, this.player.body.y, this.player.body.z].map(v => v.toFixed(1)).join(' '),
      held: this.player.hand.length ? this.player.hand.map(m => MATERIALS[m].name).join(', ') : '—',
      room: r ? `${r.id} (${r.type}, ${r.template})` : '—',
    };
  }
}
