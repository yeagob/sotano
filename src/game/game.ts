// The game loop: ties together the stacked dungeon, player, intentions, loose cubes, bombs,
// doors, pickups, projections (enemies), items and rendering. Rule of thumb for this file:
// anything an item might want to change reads a stat or emits an event (docs/architecture/ITEMS.md §3).

import * as THREE from 'three';
import { easeMaster, setMasterTarget, sfx, sfx2, sfx3, spatial, unlockAudio } from '../audio/sfx';
import { BlastQueue } from '../combat/blasts';
import { allyHeal, convertedHp, intentDamage, meetsIntention, relapseHp, resolveHit, type Polarity } from '../combat/polarity';
import { intentFromStats, Intents } from '../combat/intents';
import { createWeapon, type Weapon, type WeaponHost } from '../combat/weapons';
import { ENEMY_BUDGET, ENEMY_BY_ID, pickWave, waveBudget } from '../content/enemies';
import { bossFor, bossHp } from '../content/bosses';
import { enemyText, materialName, partText } from '../i18n/content';
import {gatherMoteColor, gatherMotesDue, OMEN_BREACH, OMEN_BREACH_COLOR, OMEN_GATHER, pickSpawnCell, SLAM_SHAKE, slamMotesPerDoor, spawnBlocked, splitWaves,
  type Cell, type Omen, waveDue } from './omens';
import { ITEM_BY_ID, ITEMS } from '../content/items';
import { AIR, MAT, mat, MATERIALS } from '../content/materials';
import {
  DEFAULT_AFFINITY, ELEMENTS, EL_FIRE, EL_WATER, elemDef, elemKind, fluidHeight, isFalling, type ElementDef, type ElementKey,
} from '../content/elements';
import { ROOM_H, ROOM_TEMPLATES } from '../content/rooms';
import { rollParts } from '../content/parts';
import { carriedDef, flaskRooms, isFlask, POTIONS, type PotionId } from '../content/potions';
import { tollIndex } from './toll';
import { cellOverlap, PLACE_NUDGE_CLEAR, PLACE_NUDGE_MAX, type CellOverlap } from './placement';
import { SYNERGIES } from '../content/synergies';
import { pal } from '../content/palette';
import { LEVELS, level, tollOf } from '../content/levels';
import { blockDamage, cubeDamage, type DamageKind } from '../core/damage';
import { fx, seedFx } from '../core/fx';
import { hash3, RunRandom } from '../core/rng';
import { decodeSeed, encodeSeed, formatSeed, GEN_VERSION, randomRoot } from '../core/seed';
import { ROOM_CLEAR } from '../content/tables/rewards';
import { StatSheet } from '../core/stats';
import type { Enemy } from '../enemies/types';
import type { FieldEffect } from '../enemies/attacks';
import { Doors, type Door } from '../entities/doors';
import { Enemies } from '../entities/enemies';
import { Pickups, type Pickup } from '../entities/pickups';
import { Chests, type ChestView } from '../entities/chests';
import { Alembics } from '../entities/alembics';
import { Kitchens } from '../entities/kitchens';
import { COOKS, cook as kitchenCook, mealOf, newKitchen, type Kitchen } from './kitchen';
import { EYE, Player, type Carried, type PlayerMedium } from '../entities/player';
import { Input, activeDevice, onDeviceChange } from '../input/input';
import { controlParams } from '../input/labels';
import { TouchControls } from '../input/touch';
import { Inventory } from '../items/inventory';
import { ItemPools } from '../items/pool';
import type { HostApi, ItemDef } from '../items/types';
import { validateCatalogue, validateItem } from '../items/validate';
import { DEBRIS_SIZE, DebrisSystem } from '../physics/debris';
import { raycastVoxels, type VoxelHit } from '../physics/raycast';
import { BREWS, BULB, brew as labBrew, feed as labFeed, newAlembic, tickLabs, type Alembic } from './alembic';
import { PotionEffects } from './potion-effects';
import { boxHits, type Body } from '../physics/voxel-collide';
import { buildAtlas } from '../render/atlas';
import { ChunkRenderer } from '../render/chunks';
import { CrackView, CutHalves, DebrisView } from '../render/debris-view';
import { Hands } from '../render/hands';
import { Particles } from '../render/particles';
import { isLesson, Tablets } from '../render/tablets';
import { onLocaleChange, t, type MessageKey } from '../i18n';
import {
  BAND, bandOf, carveFloor, cellOf, createDungeonWorld, inRoomSpace, depthOf, DOOR_FRAME, FIRST_FLOOR, floorY, LAST_FLOOR, openHole, pedestalSlots, planDungeon, ROOM_ID_STRIDE, SKY_LIMIT, SURFACE, SURFACE_Y,
  type DungeonPlan,
  type ChestSpec, type FloorResult, type RoomInfo,
} from '../world/floor';
import { CHUNK, type VoxelWorld } from '../world/world';
import { ElementSim } from '../world/elements';
import { GiantTree, TREE_STORIES, TREE_ZONES } from '../world/tree';
import { ambientCreatures, CREATURE_BY_ID } from '../content/creatures';
import { ROOTED_HP, rootedChance } from '../content/rooted';
import { PRESENCE_BY_ID, PRESENCE_TALK, presenceReaction, pushedOut, rewardFor, TALK_REACH, unlocksPresence, answerDue, type PresenceId } from '../content/presences';
import { pickMission, rewardBand } from '../content/presences/missions';
import boundaryDef, { SANCTUARY_RADIUS } from '../content/presences/boundary';
import { CHEST_CONTENTS, CHEST_RARE } from '../content/tables/chests';
import { rollCrate } from '../content/tables/crates';
import { ActorRegistry, ContactGate, HALF_HEART, HEART, QUARTER_HEART, hostile, type Actor, type Faction } from '../entities/actors';
import { createBus, WEAPONS_KEEPING_SHOT, type Cause, type GameBus, type IntentSpec, type Owner, type PickupKind, type WeaponId } from './events';
import { Hud } from './hud';
import { carveSandbox, type SandboxRoom, type Scenario } from '../sandbox/scenario';

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
/** The cosmos above the tree. */
const NIGHT = new THREE.Color(pal('ui.night'));
/** Seconds of stillness in silence before you are carried up to heaven. */
const SILENCE_STILL = 3;
const REST_TIME = 3;

/** A dome of faint stars, shown as you climb into the night above the tree (never warm light). */
function makeStars(): THREE.Points {
  const n = 600, pos = new Float32Array(n * 3);
  let s = 1;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, h = 0.15 + r() * 0.85, d = 400;
    pos.set([Math.cos(a) * Math.sqrt(1 - h * h) * d, h * d, Math.sin(a) * Math.sqrt(1 - h * h) * d], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: pal('bone.dim'), size: 1.6, sizeAttenuation: false, transparent: true, fog: false, depthWrite: false }));
  m.frustumCulled = false;
  m.visible = false;
  return m;
}
/** Pickup colours for bursts: the key's gold, the seed's ember, life's red. */
const PICKUP_FX = { key: pal('light.gold'), bomb: pal('light.ember'), heart: pal('life.heart') } as const;
const PART_DROP_DELAY = 0.6;
const COUNTER_CAP = 99;
/** The sandbox's fixed step (seconds). */
export const SANDBOX_DT = 1 / 60;
const SPAWN_GAP = 0.45;
/** Seconds after entering a boss room until the boss counts as overcome (no bosses yet). */
const HOLE_DELAY = 1.5;
const BOSS_WAKE = 1.2;
/** Seconds of the fade to black before a new run (R). The fade back waits for the world's meshes. */
const RESTART_FADE = 0.45;
const DEATH_GRACE = 1.2;
const RESTART_HOLD_MAX = 2;
/** Per frame: at most this many block-break sounds and particle bursts (a great cut breaks dozens). */
const BREAK_SFX_PER_FRAME = 4;
const BREAK_FX_PER_FRAME = 24;
/** Good intentions in a row that find nothing to mend on one block before the polarity hint shows. */
const POLARITY_HINT_HITS = 3;
/** Loose cubes a single weapon strike may leave behind; the rest of its cuts vanish as dust. */
const STRIKE_DEBRIS: Record<WeaponId, number> = { intent: 0, blade: 16, beam: 24, greatcut: 24 };
/** Cubes a single blade swing shows cut in two; the rest of the rubble in reach turns to dust. */
const SLICED_CUBES_PER_STRIKE = 24;
/** Seconds between contact wear ticks (the `crush` stat is damage per second). */
const CONTACT_TICK = 0.25;
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

/** An intention's touch on an actor: its polarity, and whether this touch may warm the target (once per stroke). */
interface IntentTouch { polarity: Polarity; warm: boolean }

interface Blast { x: number; y: number; z: number; radius: number; damage: number; actorDamage: number; source: string; owner: Owner; cause: Cause }

/** A normal room: its roster in waves (BESTIARY §2.4). `wave` is -1 until the first one starts. */
interface RoomState {
  cleared: boolean; started: boolean; sealed: boolean;
  waves: string[][]; wave: number;
  /** The current wave's projections still to announce, the gap to the next, and the breath before the next wave. */
  queue: string[]; next: number; breath: number; armed: boolean; waveT: number;
}

/** A challenge room: every time you walk in, three waves (harder each wave and each visit). */
interface ChallengeState { entries: number; wave: number; active: boolean; queue: string[]; next: number; wasInside: boolean }
const CHALLENGE_WAVES = 3;
const WAVE_GAP = 1.4;
/** The breath between two waves of a normal room (BESTIARY §2.4). */
const BREATH = 1.5;

interface BossRoom { room: number; wake: number; spawned: boolean; defeated: boolean; t: number; open: boolean; warned: boolean; dust: number; asked: boolean }

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(75, 1, 0.05, 200);
  readonly input: Input;
  readonly hud = new Hud();
  readonly hands: Hands;
  readonly player = new Player();
  readonly stats = new StatSheet();
  readonly potions = new PotionEffects(this.stats);
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
  /** The laboratories' alembics, by the world index of their block (game/alembic.ts). */
  private labs = new Map<number, Alembic>();
  /** The kitchens, by the world index of their block (game/kitchen.ts). */
  private kitchens = new Map<number, Kitchen>();
  rooms = new Map<number, RoomInfo>();
  debris!: DebrisSystem;
  doors!: Doors;
  pickups!: Pickups;
  enemies!: Enemies;
  room = -1;
  visited = new Set<number>();
  /** Keep simulating while the mouse isn't captured (for automated tests). */
  simulateUnlocked = false;
  private deadT = 0;
  readonly touch: TouchControls;
  /** The scenario this world was built from, or null in a normal run (docs/architecture/SANDBOX.md). */
  sandbox: Scenario | null = null;
  /** Sandbox: the world only moves through `step()` (the console steps it). */
  paused = false;
  private presenceReplies = new Map<number, number>();

  private activated = new Set<number>();
  private roomState = new Map<number, RoomState>();
  private challenges = new Map<number, ChallengeState>();
  /** Omens open now: projections announcing themselves at a spawn point (BESTIARY §2.3). */
  private omens: Omen[] = [];
  /** Per room: how many spawns it has announced, so each spawn point roll has its own seed path. */
  private spawnSeq = new Map<number, number>();
  /** Per live projection: the spawn count of its omen, the seed path of its parts. */
  private projectionSeq = new Map<number, number>();
  private camDir = new THREE.Vector3();
  /** Every chest of the activated floors (the blocks themselves live in the world). */
  private chests: { spec: ChestSpec; opened: boolean; refused: boolean; view: ChestView }[] = [];
  private chestViews!: Chests;
  private alembicViews!: Alembics;
  private kitchenViews!: Kitchens;
  private boundaryRing = new Map<number, [number, number, number][]>();
  private iceWalls = new Map<number, [number, number, number][]>();
  private spits: { t: number; run: () => void }[] = [];
  private bossRooms = new Map<number, BossRoom>();   // floor → its boss room's state
  private bossUsed = new Set<string>();
  /** R: > 0 while fading to black; then the new run stays dark until its meshes are ready. */
  private restartT = 0;
  private revealT = -1;
  private groundBand = FIRST_FLOOR;
  private atlas = buildAtlas();
  private chunks!: ChunkRenderer;
  private debrisView: DebrisView;
  private cutHalves: CutHalves;
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
  /** The loaded intention's polarity (BESTIARY §1.1); F switches it. */
  private polarity: Polarity = 'positive';
  get polarityNow() { return this.polarity; }
  /** The stroke in progress (a swing, a beam or a great cut): its polarity, and the targets it has
   *  already warmed, so a beam warms a projection once, not on every tick. */
  private stroke: { polarity: Polarity; warmed: Set<number>; intent: IntentSpec | null } = { polarity: 'positive', warmed: new Set(), intent: null };
  /** Bombs set off by a blast carry its chain to their own explosion. */
  private bombCause = new Map<number, Cause>();
  private fpsAcc = 0; private fpsN = 0; fps = 0;
  /** The weapon replacing the intention, if any (docs/architecture/WEAPONS.md). */
  private weapon: Weapon | null = null;
  private weaponId: WeaponId = 'intent';
  private weaponHost: WeaponHost;
  private strikeDebris = 0;
  /** Seconds the player has been pressing against blocks since the last contact tick. */
  private contactT = 0;
  /** The polarity hint has been shown this run. */
  private polarityHinted = false;
  /** The block the last good intentions hit, and how many in a row found nothing to mend there. */
  private idleGood = { block: -1, hits: 0 };
  private breakSfx = 0;
  private breakFx = 0;
  private fogColor = new THREE.Color();
  /** The giant tree above the surface (L5) and whether its chunks were sent to be meshed. */
  tree!: GiantTree;
  private story = NaN;
  /** The loop (L4): silence once visited opens the sky's top; seconds standing still in it. */
  private silenceSeen = false;
  private stillT = 0;
  /** The star pad you arrived on (re-armed once you step off it). */
  private padLock = -1;
  /** What the HUD says about where you are (a floor, or a level of the tree). */
  private zone = '';
  private stars: THREE.Points;
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
    this.touch = new TouchControls(this.input);
    this.hands = new Hands(1);
    this.scene.fog = new THREE.Fog(DUNGEON_FOG, 6, 34);
    this.scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
    const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
    sun.position.set(0.4, 1, 0.3);
    this.scene.add(sun);
    this.particles = new Particles(this.scene, 900);
    this.stars = makeStars();
    this.scene.add(this.stars);
    this.debrisView = new DebrisView(this.scene, this.atlas, MAX_CUBES);
    this.cutHalves = new CutHalves(this.scene, this.atlas);
    this.cracks = new CrackView(this.scene);
    this.intents = new Intents(this.scene, {
      solid: (x, y, z) => this.solid(x, y, z),
      tier: (x, y, z) => mat(this.world.get(x, y, z)).tier,
      hitBlock: (hit, t) => this.intentHitsBlock(hit, t.mining, t.polarity),
      debrisAt: (x, y, z, r) => this.debrisAt(x, y, z, r),
      hitDebris: (i, v, t) => {
        const k = t.knock * 6 / Math.max(1, v.length());
        this.hitCube(i, v.x * k, v.y * k + 1, v.z * k);
      },
      enemyAt: (x, y, z, r, polarity) => this.enemies.at(x, y, z, r, e => this.meets(e, polarity)),
      mirrorAxis: id => (this.enemies.get(id)?.def === 'hall-of-mirrors' ? 'z' : null),
      touched: (x, _y, z, polarity) => this.hearPresences(x, z, polarity),
      hitEnemy: (uid, v, t) => {
        const l = Math.hypot(v.x, v.z) || 1;
        this.intentTouch(uid, t.damage, v.x / l, v.z / l, 'intent', 'intent', t.polarity, true);
      },
      splash: (p, color, big) => this.particles.burst(p.x, p.y, p.z, color, big ? 10 : 5, big ? 3 : 2, 0.06),
      elementAt: (x, y, z) => this.elementAt(x, y, z)?.key ?? null,
      quenched: p => this.elementFx('hiss', Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)),
      hit: (kind, target, p, n, v, spec) => this.intentHit(kind, target, p, n, v, spec),
      nearestBlock: (p, r) => this.nearestSolid(p, r),
    });
    this.api = this.makeApi();
    this.weaponHost = this.makeWeaponHost();
    this.inventory = new Inventory(ITEM_BY_ID, SYNERGIES, this.stats, () => this.bus, () => this.api,
      (id, copy) => this.rng.fork('item', id, copy));
    document.addEventListener('mousedown', unlockAudio);
    addEventListener('keydown', unlockAudio);
    addEventListener('resize', () => this.resize());
    onLocaleChange(() => this.tablets?.redraw());
    onDeviceChange(() => this.tablets?.redraw());
    this.input.onPadChange = on => this.hud.toast(on ? 'toast.padConnected' : 'toast.padDisconnected');
    this.hud.rumble = (strength, ms) => this.input.rumble(strength, ms);
    this.hud.onAct = act => this.act(act);
    this.input.onBlur = () => this.touch.clear();
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
    this.begin(root, null);
    this.hud.toast(invalid ? 'toast.seedInvalid' : 'toast.newRun', { input: String(seed ?? ''), seed: this.seedLabel });
  }

  /**
   * The sandbox (docs/architecture/SANDBOX.md): the run's rock, but a single sealed room built from
   * the scenario on its floor's band, with its items, hand and projections. Everything else runs
   * unchanged. Cosmetic randomness is seeded too, so the same scenario stepped the same way replays.
   */
  newSandbox(s: Scenario) {
    this.begin((s.seed ?? 1) >>> 0, s);
  }

  private begin(root: number, sandbox: Scenario | null) {
    this.sandbox = sandbox;
    seedFx(sandbox ? root : null);
    this.seed = root;
    this.seedCode = encodeSeed(root);
    this.rng = new RunRandom(root);
    this.hud.setSeed(this.seedLabel);
    this.polarity = 'positive';
    this.polarityHinted = false;
    this.idleGood = { block: -1, hits: 0 };
    this.hud.setPolarity(this.polarity);
    this.dungeon = planDungeon(this.rng);
    this.pools = new ItemPools(PLAYABLE_ITEMS);
    // reserve every pedestal of every floor now (boss rooms included), in (floor, room) order
    this.pools.reserve(pedestalSlots(this.dungeon), this.rng.fork('reserve'));
    this.chunks?.dispose();
    this.doors?.dispose();
    this.pickups?.dispose();
    this.chestViews?.dispose();
    this.alembicViews?.dispose();
    this.kitchenViews?.dispose();
    this.enemies?.dispose();
    this.tablets?.dispose();
    this.tablets = new Tablets(this.scene);
    this.world = createDungeonWorld(this.rng, this.dungeon);
    const box = sandbox ? carveSandbox(this.world, this.rng, sandbox) : null;
    // the giant tree grows once per run above the surface, from its own fork (docs/architecture/RNG.md)
    this.tree = new GiantTree(this.world, SURFACE_Y, i => this.rng.fork('tree', i));
    this.story = NaN; this.silenceSeen = false; this.stillT = 0; this.padLock = -1; this.zone = ''; this.presenceReplies.clear();
    setMasterTarget(0.35);
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
    this.chestViews = new Chests(this.scene);
    this.alembicViews = new Alembics(this.scene);
    this.kitchenViews = new Kitchens(this.scene);
    this.enemies = new Enemies(this.scene, this.enemyHost());
    this.potions.clear();
    this.floors.clear(); this.labs.clear(); this.kitchens.clear(); this.rooms.clear(); this.activated.clear(); this.roomState.clear(); this.challenges.clear(); this.omens = []; this.spawnSeq.clear(); this.projectionSeq.clear(); this.bossRooms.clear(); this.bossUsed.clear(); this.chests = []; this.spits = [];
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
    // the run starts among the roots (floor 0, the tutorial); a sandbox on its own floor
    const k = box ? box.floor.floor : FIRST_FLOOR;
    if (box) {
      this.addFloor(box.floor);
      // what the scenario placed was set before the simulation existed: every cell of the room looks once
      const r = box.room;
      for (let z = r.z0 - 1; z <= r.z0 + r.d; z++) for (let y = r.y0 - 3; y <= r.y0 + r.height; y++)
        for (let x = r.x0 - 1; x <= r.x0 + r.w; x++) this.elements.wake(x, y, z);
    } else this.carve(FIRST_FLOOR);
    this.activate(k);
    this.carve(FIRST_FLOOR + 1);
    p.spawnAt(...this.floors.get(k)!.spawn);
    p.yaw = 0; p.pitch = 0;
    this.stream();
    this.depth = this.maxDepth = this.groundBand = k;
    this.room = -1;
    this.visited = new Set();
    this.hud.hideDeath();
    this.hud.dismissBanner();
    this.hud.setItems(this.inventory.items.map(i => i.def));
    this.hud.setFloor(this.floors.get(k)!, k);
    this.bus.emit('floorEnter', { depth: k });
    if (box && sandbox) this.furnish(box, sandbox);
  }

  /** The sandbox room's contents: practices (quietly, no banners), hand, keys, counters and projections. */
  private furnish(box: SandboxRoom, s: Scenario) {
    for (const id of s.items ?? []) this.grant(id);
    const p = this.player;
    p.hand = (s.hand ?? []).map(k => MAT[k]);
    p.bombs = p.keys = COUNTER_CAP;
    p.hp = this.maxHp;
    if (s.god) p.invulnT = 1e9;
    for (const [x, y, z] of box.keys) this.pickups.add('key', x + 0.5, y + 0.5, z + 0.5, box.room.id);
    const [ox, oy, oz] = box.origin;
    for (const e of s.enemies ?? []) this.sandboxSpawn(e.def, ox + e.at[0] + 0.5, oy + e.at[1], oz + e.at[2] + 0.5, e.faction);
  }

  /** Gains a practice without its banner (the sandbox and the lab). */
  grant(id: string) {
    const r = this.inventory.gain(id);
    if (!r) return false;
    this.pools.remove(id);
    this.bus.emit('itemGained', { id, uid: r.instance.uid });
    this.clampHealth();
    this.hud.setItems(this.inventory.items.map(i => i.def));
    return true;
  }

  /** A projection (or a creature) at a world position in the sandbox room, out at once (no omen). */
  sandboxSpawn(defId: string, x: number, y: number, z: number, faction?: Faction) {
    const r = this.rooms.get(this.floors.get(this.depth)?.rooms[0]?.id ?? -1);
    if (!r) return null;
    const creature = CREATURE_BY_ID.get(defId);
    if (creature) {
      const e = this.enemies.spawn(creature, this.actors.newId(), r.id, x, y, z, creature.hp, creature.speed, 0, new Set(['creature']));
      e.faction = 'neutral';
      e.spawning = 0;
      this.actors.add(e);
      return e;
    }
    const seq = this.spawnSeq.get(r.id) ?? 0;
    this.spawnSeq.set(r.id, seq + 1);
    const e = this.spawnEnemy(defId, r, seq, x, y, z);
    if (e) { e.spawning = 0; if (faction) this.setFaction(e, faction, 'sandbox'); }
    return e;
  }

  /** Advances the world by one fixed step without input from the mouse (the lab, the paused sandbox). */
  step(dt = SANDBOX_DT) {
    this.simulate(dt);
    this.input.endFrame();
  }

  /** "ABCD EFGH · v1": what the player shares to replay this run. */
  get seedLabel() {
    return `${formatSeed(this.seedCode)} · v${GEN_VERSION}`;
  }

  /** Carves floor k into the world (one floor ahead of the player), from the run's plan. */
  private carve(k: number) {
    if (k > LAST_FLOOR || this.floors.has(k)) return;
    if (this.sandbox) return;
    const f = carveFloor(this.world, this.rng, k, this.dungeon.plans[k], {
      templates: ROOM_TEMPLATES,
      pedestalItem: room => this.pools.reservedFor(String(room)) ?? null,
      enemies: ENEMY_BUDGET,
    });
    f.boss = bossFor(k, this.rng.fork('floor', k, 'boss'), this.bossUsed);
    if (f.boss) this.bossUsed.add(f.boss);
    this.addFloor(f);
  }

  /** Registers a carved floor: its rooms and their combat state. */
  private addFloor(f: FloorResult) {
    this.floors.set(f.floor, f);
    if (f.laboratory) {
      const { x, y, z } = f.laboratory, lab = newAlembic();
      this.labs.set(this.world.idx(x, y, z), lab);
      this.alembicViews.add(x, y, z);
    }
    if (f.kitchen) {
      const { x, y, z } = f.kitchen;
      this.kitchens.set(this.world.idx(x, y, z), newKitchen());
      this.kitchenViews.add(x, y, z);
    }
    // template elements (pools, braziers) are stable sources, but a decor crate may sit next to a flame
    for (const r of f.rooms) this.elements.wakeBox(r.x0 - 1, r.y0 - 3, r.z0 - 1, r.x0 + r.w, r.y0 + r.height, r.z0 + r.d);
    for (const r of f.rooms) {
      this.rooms.set(r.id, r);
      this.roomState.set(r.id, {
        cleared: !r.enemies.length, started: false, sealed: false,
        waves: splitWaves(r.enemies), wave: -1, queue: [], next: 0, breath: 0, armed: false, waveT: 0,
      });
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
    for (const spec of f.chests) {
      const face = this.chestFacing(spec);
      this.chests.push({ spec, opened: false, refused: false, view: this.chestViews.add(spec, face.angle, face.tight) });
    }
    for (const kp of f.keys) this.pickups.add('key', kp.x + 0.5, kp.y + 0.5, kp.z + 0.5, kp.room);
    for (const bp of f.bombs) this.pickups.add('bomb', bp.x + 0.5, bp.y + 0.5, bp.z + 0.5, bp.room);
    // the roots are home to peaceful creatures: they wander, they never fight (L6)
    for (const c of this.sandbox ? [] : ambientCreatures(f, this.rng.fork('floor', k, 'creatures'))) {
      const def = CREATURE_BY_ID.get(c.def)!;
      const e = this.enemies.spawn(def, this.actors.newId(), c.room, c.x, c.y, c.z, def.hp, def.speed, 0, new Set(['creature']));
      e.faction = 'neutral';
      e.spawning = 0;
      this.actors.add(e);
    }
    for (const r of this.sandbox ? [] : f.rooms) {
      if (!r.presence) continue;
      if (r.presence === 'boundary') {
        const e = this.enemies.spawn(boundaryDef, this.actors.newId(), r.id, r.x0 + 6.5, r.y0 + 1, r.z0 + 3.5, boundaryDef.hp, boundaryDef.speed, 0, new Set(['boundary']));
        e.faction = 'neutral';
        e.spawning = 0;
        this.actors.add(e);
        const ring: [number, number, number][] = [];
        for (let dz = -SANCTUARY_RADIUS; dz <= SANCTUARY_RADIUS; dz++) for (let dx = -SANCTUARY_RADIUS; dx <= SANCTUARY_RADIUS; dx++) {
          const x = r.x0 + 6 + dx, z = r.z0 + 3 + dz;
          if (Math.max(Math.abs(dx), Math.abs(dz)) === SANCTUARY_RADIUS && this.solid(x, r.y0, z)) ring.push([x, r.y0, z]);
        }
        this.boundaryRing.set(e.id, ring);
        continue;
      }
      const def = PRESENCE_BY_ID.get(r.presence)!;
      const e = this.enemies.spawn(def, this.actors.newId(), r.id, r.hx + 6.5, r.y0 + 1, r.hz + 3.5, def.hp, def.speed, 0, new Set(['presence']));
      e.faction = 'neutral';
      e.spawning = 0;
      this.actors.add(e);
    }
    // the tutorial is carved into the walls of its rooms (never an overlay)
    for (const r of f.rooms) {
      const tpl = ROOM_TEMPLATES.find(q => q.id === r.template);
      const lesson = tpl?.lesson, second = tpl?.lesson2;
      if (lesson && isLesson(lesson)) this.tablets.add(lesson, r.hx, r.y0, r.hz, second && isLesson(second) ? second : lesson);
    }
  }

  /** Puts a pedestal's practice in the world: the reserved one, unless the player already got it
   *  some other way (then a runtime draw from the room's pool). */
  private placePedestalItem(p: { room: number; x: number; y: number; z: number; item: string | null }) {
    const def = this.pedestalDef(p);
    this.pickups.add('item', p.x + 0.5, p.y, p.z + 0.5, p.room, def);
    return def;
  }

  private pedestalDef(p: { room: number; item: string | null }) {
    let id = p.item;
    if (id && (this.inventory.has(id) || this.pools.isTaken(id))) {
      const type = this.rooms.get(p.room)?.type;
      id = this.pools.drawRuntime(type === 'vault' || type === 'boss' ? type : 'treasure', this.rng.stream('loot'));
    }
    return id ? ITEM_BY_ID.get(id) ?? null : null;
  }

  private chestFacing(s: ChestSpec) {
    const r = this.rooms.get(s.room), cx = s.x + 0.5, cz = s.z + 0.5;
    let tx = r ? r.x0 + r.w / 2 : cx, tz = r ? r.z0 + r.d / 2 : cz + 1;
    if (Math.hypot(tx - cx, tz - cz) < 1.5) {
      let best = Infinity;
      for (const d of this.doors.list) {
        const dist = Math.hypot(d.cx - cx, d.cz - cz);
        if (d.rooms.includes(s.room) && dist < best) { best = dist; tx = d.cx; tz = d.cz; }
      }
    }
    const dx = tx - cx, dz = tz - cz, len = Math.hypot(dx, dz) || 1;
    const free = (x: number, z: number) => !this.solid(x, s.y, z) && !this.solid(x, s.y + 1, z);
    let best = { angle: 0, tight: true }, score = -Infinity;
    for (const [fx, fz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const back = free(s.x - fx, s.z - fz), front = free(s.x + fx, s.z + fz);
      const sc = (back ? 4 : 0) + (front ? 2 : 0) + (fx * dx + fz * dz) / len;
      if (sc > score) { score = sc; best = { angle: Math.atan2(fx, fz), tight: !back }; }
    }
    return best;
  }

  /** Down a floor (console shortcut): open the hole and drop the player into it. */
  nextFloor() {
    const f = this.floors.get(this.depth);
    if (!f?.hole) return;
    this.activate(this.depth + 1);
    const st = this.bossRooms.get(this.depth);
    if (st) { st.defeated = true; st.open = true; }
    openHole(this.world, f.hole);
    this.player.spawnAt(f.hole.x + f.hole.size / 2, f.hole.yTop + 1, f.hole.z + f.hole.size / 2);
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
    // the room whose space holds the cell (a room may spread into empty cells the map never shows)
    const i = f.space[gx + gz * f.plan.w];
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
      held: () => this.player.hand.filter((c): c is number => typeof c === 'number'),
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
      pulse: (x, y, z, r, d, k, c, src) => this.pulse(x, y, z, r, d, k, c, src),
      arc: (x, y, z, to, d, src, pol) => this.arc(x, y, z, to, d, src, pol),
      nearestProjection: (x, y, z, r, except) => this.nearestProjection(x, y, z, r, except),
      actorAt: id => { const a = this.actors.get(id); return a ? { x: a.body.x, y: a.body.y + a.body.h / 2, z: a.body.z } : null; },
      shove: (id, dx, dz, s) => this.shove(id, dx, dz, s),
      freeze: (id, s) => this.affectProjection(id, 'frozen', s),
      frighten: (id, s) => this.affectProjection(id, 'fear', s),
      igniteArea: (x, y, z, r) => this.igniteArea(x, y, z, r),
      launch: (spec, x, y, z, dx, dy, dz) => this.intents.fire(spec, new THREE.Vector3(x, y, z), new THREE.Vector3(dx, dy, dz), new THREE.Vector3()),
      tagFlying: (x, y, z, r, tag, except) => { for (const s of this.intents.flying(new THREE.Vector3(x, y, z), r, except)) s.tags.add(tag); },
      tagCube: (cube, tag) => this.tagCube(cube, tag),
    };
  }

  /** What weapons may do: everything through the shared damage pipeline (docs/architecture/WEAPONS.md). */
  private makeWeaponHost(): WeaponHost {
    const p = this.player;
    return {
      stats: () => this.stats.all,
      eye: () => p.eye,
      forward: () => p.forward,
      casting: () => this.input.held('cast') && !this.hands.holding,
      strike: (weapon, damage, mining, reach) => {
        const ev = this.bus.emit('strike', { weapon, damage, mining, reach, color: pal('light.hot'), tags: new Set(), polarity: this.polarity });
        if (ev.cancelled) return null;
        const intent = { ...intentFromStats(this.stats.all, this.polarity), damage: ev.damage, mining: ev.mining, tags: new Set(ev.tags) };
        this.stroke = { polarity: this.polarity, warmed: new Set(), intent };
        this.strikeDebris = STRIKE_DEBRIS[weapon];
        return { damage: ev.damage, mining: ev.mining, reach: ev.reach, tags: ev.tags };
      },
      solid: (x, y, z) => this.solid(x, y, z),
      // a positive stroke only reaches blocks it can mend: the damaged ones
      breakable: (x, y, z) => {
        const id = this.world.get(x, y, z);
        if (id === AIR || !isFinite(mat(id).hp)) return false;
        return this.stroke.polarity === 'negative' || this.world.damaged.has(this.world.idx(x, y, z));
      },
      // a clean cut: far more than any block's HP, so armor never saves it (hooks still may)
      cut: (x, y, z, source) => {
        if (this.stroke.polarity === 'positive') this.repairBlock(x, y, z, 1e6);
        else this.damageBlock(x, y, z, 1e6, 'cut', source, this.strikeDebris-- > 0);
      },
      burn: (x, y, z, amount, source) => {
        if (this.stroke.polarity === 'positive') { this.repairBlock(x, y, z, amount); return false; }
        return this.damageBlock(x, y, z, amount, 'beam', source);
      },
      targets: () => this.enemies.list
        .filter(e => e.alive && e.spawning <= 0 && this.meets(e, this.stroke.polarity))
        .map(e => ({ id: e.id, x: e.body.x, y: e.body.y, z: e.body.z, hw: e.body.hw, h: e.body.h })),
      hit: (id, damage, kx, kz, source) => {
        const warm = !this.stroke.warmed.has(id);
        this.stroke.warmed.add(id);
        this.intentTouch(id, damage, kx, kz, source === 'beam' ? 'beam' : 'cut', source, this.stroke.polarity, warm);
        if (warm && source !== 'blade' && this.stroke.intent) this.strokeHit(id, kx, kz, this.stroke.intent);
      },
      clearProjectiles: inside => { this.enemies.clearProjectiles(p.faction, inside); },
      clearCubes: inside => this.clearCubesIn(inside),
      sliceCubes: (inside, along, across) => this.clearCubesIn(inside, { along, across }),
      particles: (x, y, z, c, n, s, size) => this.particles.burst(x, y, z, c, n, s, size),
      shake: s => this.hud.shake(s),
      swingHands: () => this.hands.fire(),
      chargeHands: k => this.hands.charge(k),
      sound: name => sfx2[name](),
    };
  }

  /**
   * Destroys the loose cubes for which `inside` is true (bombs in reach go off). With a `slash`, the
   * first few are shown cut in two along it, Beat Saber style; the rest turn to dust.
   */
  private clearCubesIn(inside: (x: number, y: number, z: number) => boolean, slash?: { along: THREE.Vector3; across: THREE.Vector3 }) {
    const d = this.debris;
    let fxLeft = 6, slices = SLICED_CUBES_PER_STRIKE;
    for (let i = 0; i < d.max; i++) {
      if (!d.isAlive(i)) continue;
      const i3 = i * 3, x = d.pos[i3], y = d.pos[i3 + 1], z = d.pos[i3 + 2];
      if (!inside(x, y, z)) continue;
      if (d.isBomb(i)) { d.fuse[i] = Math.min(d.fuse[i], 0.05); continue; }
      if (slash && slices-- > 0) {
        this.cutHalves.cut(d.material[i], new THREE.Vector3(x, y, z), slash.along, slash.across, this.player.forward, 3.2 + fx.range(0, 1.2));
        if (fxLeft-- > 0) this.particles.burst(x, y, z, pal('light.hot'), 4, 2, 0.05);
      } else if (fxLeft-- > 0) this.particles.burst(x, y, z, mat(d.material[i]).colors[0], 8, 3, 0.08);
      d.remove(i);
    }
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
  damageActor(t: Actor, amount: number, kind: DamageKind, source: string, owner: Owner, kx = 0, kz = 0, intent?: IntentTouch): boolean {
    const p = this.player;
    if (!t.alive || t.spawning > 0 || amount <= 0) return false;
    if (t === p && p.invulnT > 0) return false;
    if (t.kind === 'projection' && kind === 'explosion' && (t as Enemy).spec.kind === 'creature') { t.body.vx += kx; t.body.vz += kz; return false; }
    const ev = this.bus.emit('actorDamage', {
      target: t.id, targetKind: t.kind, def: t.def, amount, kind, source, owner,
      knockback: t === p ? 0 : 3, cause: this.blasts.current ?? undefined, polarity: intent?.polarity ?? null,
    });
    if (ev.cancelled) return false;
    if (t !== p) return this.hurtEnemy(t as Enemy, ev.amount, kx * ev.knockback, kz * ev.knockback, intent);
    if (ev.amount <= 0) return false;
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
      smash: (e: Enemy, x: number, y: number, z: number, tier: number, damage: number) => {
        const id = this.world.get(x, y, z);
        if (id === AIR || !isFinite(mat(id).tier) || mat(id).tier > tier) return false;
        this.damageBlock(x, y, z, damage, 'crush', `enemy:${e.def}`);
        return true;
      },
      burst: (e: Enemy, r: number) => this.explode(e.body.x, e.body.y + 0.5, e.body.z, r, 30, `enemy:${e.def}`, e.id, BLAST_ACTOR_DAMAGE),
      died: (e: Enemy) => this.onEnemyDeath(e),
      pickupsIn: (room: number) => this.pickups.list.filter(p => !p.taken && p.room === room && (p.type === 'key' || p.type === 'bomb' || p.type === 'heart'))
        .map(p => ({ kind: p.type as PickupKind, x: p.x, y: p.y, z: p.z, take: () => this.pickups.take(p) })),
      particles: (x: number, y: number, z: number, c: number, n: number, s: number, size: number) => this.particles.burst(x, y, z, c, n, s, size),
      hurtActor: (t: Actor, amount: number, cause: string, owner: number) => { this.damageActor(t, amount, 'projectile', cause, owner); },
      affectActor: (t: Actor, effect: FieldEffect, seconds: number) => this.affectActor(t, effect, seconds),
      arena: (e: Enemy, what: string) => this.bossArena(e, what),
      summon: (e: Enemy, ids: string[]) => this.summonFor(e, ids),
      cue: (kind: string, x: number, y: number, z: number) => spatial.cue(kind, x, y, z),
      quake: (x: number, y: number, z: number, power: number) => this.quake(x, y, z, power),
      drop: (e: Enemy, x: number, y: number, z: number) => {
        const r = this.rooms.get(e.room);
        if (r) this.shed(this.debris.spawn(MAT[level(r.floor).palette.wall], x, y, z, 0, -2, 0));
      },
    };
  }

  /**
   * A heavy impact (a boss lands, hits a wall): the screen shakes by how close you are and the floor
   * at the point spits chips of its own material (DECISIONS §7.3: never more than 60 per event).
   */
  private quake(x: number, y: number, z: number, power: number) {
    const p = this.player.body, d = Math.hypot(p.x - x, p.z - z);
    this.hud.shake(power * Math.max(0.2, Math.min(1, 1 - d / 16)));
    const under = this.world.get(Math.floor(x), Math.floor(y) - 1, Math.floor(z));
    if (under !== AIR) this.particles.burstRamp(x, y + 0.1, z, mat(under).colors, Math.min(40, Math.round(10 + power * 40)), 3.5, 0.1);
    spatial.cue('quake', x, y, z);
  }

  /** Stones come loose all over the arena (a boss phase): every shadow marked, a beat apart. */
  private rockfallRoom(e: Enemy, r: RoomInfo) {
    for (let k = 0; k < 12; k++) {
      const x = r.x0 + 1 + hash3(e.id, k, 1, 0x51) * (r.w - 2), z = r.z0 + 1 + hash3(e.id, k, 2, 0x51) * (r.d - 2);
      if (!inRoomSpace(r, x, z) || this.solid(Math.floor(x), r.y0, Math.floor(z))) continue;
      this.enemies.rockfall(e, x, r.y0, z, 1.3 + k * 0.12, 8);
    }
  }

  private affectActor(t: Actor, effect: FieldEffect, seconds: number) {
    if (t !== this.player || effect === 'sting') return;
    if (effect === 'slow') this.player.slowT = Math.max(this.player.slowT, seconds);
    else {
      if (this.player.muteT <= 0) this.hud.toast('toast.muted');
      this.player.muteT = Math.max(this.player.muteT, seconds);
    }
  }

  private bossArena(e: Enemy, what: string) {
    const r = this.rooms.get(e.room);
    if (!r) return;
    if (what === 'ice') { this.raiseIce(e, r); return; }
    this.hud.toast(`boss.${e.def}.phase.${e.stage}` as MessageKey);
    switch (what) {
      case 'walls': this.raiseWalls(r); break;
      case 'flood': this.roomElement(r, EL_WATER, 3); break;
      case 'drain': this.roomElement(r, EL_WATER, 0); break;
      case 'fire': this.roomElement(r, EL_FIRE, 8); break;
      case 'spill': this.spillCubes(e, r); break;
      case 'drop': this.dropOnPlayer(r); break;
      case 'rockfall': this.rockfallRoom(e, r); break;
      case 'puddle': this.roomElement(r, EL_WATER, 1); break;
    }
  }

  private roomElement(r: RoomInfo, kind: number, level: number) {
    const p = this.player.body;
    for (let z = r.z0; z < r.z0 + r.d; z++) for (let x = r.x0; x < r.x0 + r.w; x++) {
      if (!inRoomSpace(r, x + 0.5, z + 0.5)) continue;
      const y = r.y0;
      const here = this.world.elemAt(x, y, z);
      if (level === 0) { if (elemKind(here) === kind) this.world.setElemByte(x, y, z, 0); continue; }
      if (this.solid(x, y, z) || !this.solid(x, y - 1, z) || Math.hypot(x + 0.5 - p.x, z + 0.5 - p.z) < 3) continue;
      this.world.setElem(x, y, z, kind, level);
    }
    this.elements.wakeBox(r.x0 - 1, r.y0 - 2, r.z0 - 1, r.x0 + r.w, r.y0 + r.height, r.z0 + r.d);
  }

  private spillCubes(e: Enemy, r: RoomInfo) {
    const id = MAT[level(r.floor).palette.floor];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + e.id, s = 2 + (k % 3);
      this.shed(this.debris.spawn(id, e.body.x, e.body.y + 1.5, e.body.z, Math.cos(a) * s, 3 + (k % 4), Math.sin(a) * s));
    }
  }

  private dropOnPlayer(r: RoomInfo) {
    const p = this.player.body;
    this.debris.spawn(MAT[level(r.floor).palette.wall], p.x, r.y0 + r.height - 1, p.z, 0, -2, 0);
  }

  private raiseIce(e: Enemy, r: RoomInfo) {
    const x = r.x0 + Math.floor(r.w / 2), p = this.player.body;
    const cells: [number, number, number][] = [];
    for (let z = r.z0; z < r.z0 + r.d; z++) for (let y = r.y0; y < r.y0 + 2; y++) {
      if (!inRoomSpace(r, x + 0.5, z + 0.5) || this.world.get(x, y, z) !== AIR || (Math.floor(p.x) === x && Math.floor(p.z) === z)) continue;
      this.world.set(x, y, z, MAT.ice);
      cells.push([x, y, z]);
    }
    this.iceWalls.set(e.id, cells);
    this.particles.burst(x + 0.5, r.y0 + 1, r.z0 + r.d / 2, pal('cold.white'), 14, 2, 0.05);
  }

  private raiseWalls(r: RoomInfo) {
    const id = MAT[level(r.floor).palette.wall];
    const x = r.x0 + Math.floor(r.w / 2), p = this.player.body;
    for (let z = r.z0; z < r.z0 + r.d; z++) {
      if (z < r.z0 + 3 || !inRoomSpace(r, x + 0.5, z + 0.5)) continue;
      for (let y = r.y0; y < r.y0 + 2; y++) {
        if (this.world.get(x, y, z) !== AIR || (Math.floor(p.x) === x && Math.floor(p.z) === z)) continue;
        this.world.set(x, y, z, id);
      }
    }
  }

  private summonFor(e: Enemy, ids: string[]) {
    const r = this.rooms.get(e.room);
    if (r) for (const id of ids) this.announce(id, r);
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
    if (a.faction === faction || a.faction === 'neutral') return;
    const from = a.faction;
    a.faction = faction;
    if (a.kind === 'projection') (a as Enemy).targetId = -1; // look again with new eyes
    this.bus.emit('factionChange', { target: a.id, targetKind: a.kind, def: a.def, from, to: faction, source });
  }

  /** Whether an intention of this polarity meets an actor (docs/reviews/polarity.md, ruling 6):
   *  hostile projections always; allies when it is negative (it harms them) or when they are hurt
   *  (a positive one heals them). A healthy ally lets positive intentions pass. */
  private meets(e: Enemy, polarity: Polarity) {
    return meetsIntention(e.faction, e.hp, e.maxHp, polarity, e.spec.responds);
  }

  /**
   * An intention (a shot, or a stroke of a held weapon) touches an actor. A positive one heals an
   * ally and halves its damage against a projection; a negative one hits an ally at full damage.
   * The rules are in combat/polarity.ts. `warm` is false for the repeat ticks of a beam.
   */
  private intentTouch(id: number, damage: number, kx: number, kz: number, kind: DamageKind, source: string, polarity: Polarity, warm: boolean) {
    const e = this.enemies.get(id);
    if (!e) return;
    if (e.faction !== 'projection' && polarity === 'positive') {
      const heal = allyHeal(damage, e.hp, e.maxHp);
      const b = e.body;
      e.hp += heal;
      this.particles.burst(b.x, b.y + b.h * 0.6, b.z, pal('light.gold'), 4, 1, 0.05);
      if (heal > 0 && e.spec.kind === 'creature' && e.hp >= e.maxHp && !e.tags.has('gifted')) {
        e.tags.add('gifted');
        this.pickups.add('heart', b.x, b.y + 0.6, b.z, e.room, null, 0.3);
      }
      return;
    }
    this.damageActor(e, intentDamage(polarity, damage), kind, source, this.player.id, kx, kz, { polarity, warm });
  }

  /**
   * An enemy takes `amount` after the `actorDamage` hooks. Without an intention it is plain damage.
   * With one, the rules of combat/polarity.ts decide (`resolveHit`): warmth, relapse, the ceiling
   * of positive intentions, and conversion.
   */
  private hurtEnemy(e: Enemy, amount: number, kx: number, kz: number, intent?: IntentTouch): boolean {
    if (!intent) {
      if (amount <= 0) return false;
      this.enemies.hurt(e, amount, kx, kz);
      if (e.alive) this.splitOnHit(e);
      return true;
    }
    const r = resolveHit({ polarity: intent.polarity, warm: intent.warm, faction: e.faction, hp: e.hp, maxHp: e.maxHp, warmth: e.warmth }, amount);
    e.warmth = r.warmth;
    if (r.relapse) { this.relapse(e, kx, kz); return true; }
    if (r.dealt > 0) this.enemies.hurt(e, r.dealt, kx, kz); // at zero it dissolves: a release
    if (r.convert && e.alive) this.convert(e);
    else if (e.alive && r.dealt > 0) this.splitOnHit(e);
    return true;
  }

  private splitOnHit(e: Enemy) {
    const r = this.rooms.get(e.room);
    if (!r || !e.spec.splitOnHit || !e.spec.split || e.hp <= 0) return;
    const b = e.body, seq = this.projectionSeq.get(e.id) ?? 0;
    const share = Math.max(1, Math.round(e.hp / e.spec.split.length));
    this.particles.burst(b.x, b.y + b.h * 0.6, b.z, pal('cold.body'), 6, 1.2, 0.05);
    this.enemies.dissolve(e);
    this.bus.off(null, `actor:${e.id}`);
    this.actors.remove(e.id);
    this.contacts.forget(e.id);
    this.projectionSeq.delete(e.id);
    e.spec.split.forEach((id, i) => {
      const child = this.spawnEnemy(id, r, seq, b.x + (i ? 0.7 : -0.7), b.y, b.z);
      if (child) { child.hp = share; child.maxHp = share; }
    });
  }

  /** A projection's warmth is full: it turns to your side (not destroyed). */
  private convert(e: Enemy) {
    e.hp = convertedHp(e.hp, e.maxHp);
    this.setFaction(e, 'self', 'polarity');
    const floor = this.rooms.get(e.room)?.floor;
    if (e.spec.kind === 'boss' && floor !== undefined) this.bossDown(floor);
    const b = e.body;
    this.particles.burst(b.x, b.y + b.h * 0.6, b.z, pal('light.gold'), 16, 2.2, 0.06);
    sfx3.converted();
    this.hud.toast('toast.converted');
  }

  /**
   * An ally at zero under a negative intention turns hostile again, with half its health. Not
   * resealed: a room that is cleared stays cleared (docs/reviews/polarity.md, ruling 5).
   */
  private relapse(e: Enemy, kx: number, kz: number) {
    e.hp = relapseHp(e.maxHp);
    e.warmth = 0;
    e.flash = 0.15;
    e.body.vx += kx; e.body.vz += kz;
    this.setFaction(e, 'projection', 'polarity');
    const b = e.body;
    this.particles.burst(b.x, b.y + b.h * 0.6, b.z, pal('cold.body'), 12, 2, 0.06);
    sfx3.relapsed();
    this.hud.toast('toast.relapsed');
  }

  /** F: the loaded intention switches between positive (it mends) and negative (it harms). */
  private togglePolarity() {
    const from = this.polarity;
    this.polarityHinted = true;
    this.polarity = from === 'positive' ? 'negative' : 'positive';
    this.hud.setPolarity(this.polarity);
    this.bus.emit('polarityChange', { from, to: this.polarity });
    this.hud.toast(this.polarity === 'positive' ? 'toast.polarityPositive' : 'toast.polarityNegative');
    sfx3.polarity(this.polarity === 'negative');
  }

  private onEnemyDeath(e: Enemy) {
    const ice = this.iceWalls.get(e.id);
    if (ice) {
      for (const [x, y, z] of ice) if (this.world.get(x, y, z) === MAT.ice) this.world.set(x, y, z, AIR);
      this.iceWalls.delete(e.id);
    }
    this.bus.off(null, `actor:${e.id}`); // reserved for actor-owned hooks
    this.actors.remove(e.id);
    this.contacts.forget(e.id);
    const rng = this.rng.stream('drops');
    const drops = (Object.entries(e.spec.drops ?? {}) as [PickupKind, number][]).filter(([, p]) => rng.chance(p)).map(([k]) => k);
    const b = e.body;
    const ev = this.bus.emit('actorDeath', { target: e.id, targetKind: 'projection', def: e.def, x: b.x, y: b.y, z: b.z, drops });
    for (const k of ev.drops) this.pickups.add(k, b.x, b.y + 0.6, b.z, e.room, null, 0.3);
    const stolen = this.enemies.takeCarried(e.id);
    if (stolen.length) for (const k of [...stolen, this.rng.stream('drops').pick(stolen)]) this.pickups.add(k, b.x, b.y + 0.6, b.z, e.room, null, 0.3);
    const floor = this.rooms.get(e.room)?.floor;
    const seq = this.projectionSeq.get(e.id) ?? 0;
    this.projectionSeq.delete(e.id);
    if (floor !== undefined && e.spec.kind === 'boss') this.bossDown(floor);
    if (e.spec.split && !e.spec.splitOnHit) { const r = this.rooms.get(e.room); if (r) for (const id of e.spec.split) this.announce(id, r); }
    if (floor !== undefined) {
      const parts = rollParts(this.rng.fork('floor', floor, 'room', e.room % ROOM_ID_STRIDE, 'part', seq), e.def);
      if (e.tags.has('rooted')) parts.push(...rollParts(this.rng.fork('floor', floor, 'room', e.room % ROOM_ID_STRIDE, 'part', seq, 'rooted'), e.def));
      for (const part of parts) this.pickups.add('part', b.x, b.y + 0.6, b.z, e.room, null, 0.3, part);
    }
    sfx3.dissolve();
  }

  /** Room combat: seal when the player is fully inside, announce the roster wave by wave at spawn
   *  points, open the doors when every projection of the room is gone (BESTIARY §2). */
  private updateCombat(dt: number) {
    const b = this.player.body;
    for (const [id, st] of this.roomState) {
      if (st.cleared) continue;
      const r = this.rooms.get(id)!;
      // inside its open space (a tunnel dug through the rock of an irregular room is not the room)
      const inside = b.x - b.hw > r.x0 && b.x + b.hw < r.x0 + r.w && b.z - b.hw > r.z0 && b.z + b.hw < r.z0 + r.d
        && inRoomSpace(r, b.x, b.z) && b.y > r.y0 - 3 && b.y < r.y0 + r.height;
      if (inside && !st.sealed) {
        st.sealed = true;
        this.doors.seal(id, true);
        this.enemies.hideRoom(id, true);
        if (!st.started) { st.started = true; st.breath = 0.5; st.armed = true; this.slamDoors(id); }
      }
      if (!st.started) continue;
      const remaining = this.enemies.blockingIn(id);
      const lastWave = st.wave + 1 >= st.waves.length;
      // the next wave opens once the last one is nearly down, after a breath (a swell says more are coming)
      if (st.wave >= 0) st.waveT += dt;
      if (!lastWave && st.queue.length === 0 && this.omensIn(id) === 0 && waveDue(st.wave, remaining, st.waveT)) {
        if (!st.armed) { st.armed = true; st.breath = BREATH; spatial.swell(); }
        st.breath -= dt;
        if (st.breath <= 0) { st.armed = false; st.wave++; st.waveT = 0; st.queue = [...st.waves[st.wave]]; st.next = 0; }
      }
      if (st.queue.length) {
        st.next -= dt;
        if (st.next <= 0) { st.next = SPAWN_GAP; this.announce(st.queue.shift()!, r); }
        continue;
      }
      // a room only clears once its last wave is down and queued blasts (e.g. a last Panic's burst) have gone off
      if (lastWave && remaining === 0 && this.omensIn(id) === 0 && this.blasts.pending === 0) {
        st.cleared = true;
        this.doors.seal(id, false);
        this.enemies.hideRoom(id, false);
        // Isaac-style clear reward, pre-rolled per room: the room's own fork gives one uniform
        // number, and luck only reweights the table against it (same seed + same luck = same reward)
        const r0 = this.rooms.get(id)!;
        const u = this.rng.fork('floor', r0.floor, 'room', id % ROOM_ID_STRIDE, 'clear').next();
        const reward = ROOM_CLEAR.pickU(u, { floor: r0.floor, luck: this.stats.get('luck') });
        const drops: PickupKind[] = reward ? [reward] : [];
        const ev = this.bus.emit('roomClear', { room: id, drops });
        for (const k of ev.drops) this.pickups.add(k, r.hx + 6.5, r.y0 + 1, r.hz + 3.5, id, null, 0.3);
        this.hud.toast('toast.roomClear');
        this.potionsEnded(this.potions.roomCleared());
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
      // inside its open space (a tunnel dug through the rock of an irregular room is not the room)
      const inside = b.x - b.hw > r.x0 && b.x + b.hw < r.x0 + r.w && b.z - b.hw > r.z0 && b.z + b.hw < r.z0 + r.d
        && inRoomSpace(r, b.x, b.z) && b.y > r.y0 - 3 && b.y < r.y0 + r.height;
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
        if (st.next <= 0) { st.next = SPAWN_GAP; this.announce(st.queue.shift()!, r); }
        continue;
      }
      if (this.enemies.blockingIn(r.id) > 0 || this.omensIn(r.id) > 0 || this.blasts.pending > 0) continue;
      // a wave is down: its reward, then the next wave or the end
      const u = this.rng.fork('floor', r.floor, 'room', r.id % ROOM_ID_STRIDE, 'challenge', st.entries, st.wave).next();
      const reward = ROOM_CLEAR.pickU(u, { floor: r.floor, luck: this.stats.get('luck') + st.wave });
      const ev = this.bus.emit('roomClear', { room: r.id, drops: reward ? [reward] : [] });
      for (const k of ev.drops) this.pickups.add(k, r.hx + 6.5, r.y0 + 1, r.hz + 3.5, r.id, null, 0.3);
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

  /** Opens an omen for one projection at a spawn point of the room (BESTIARY §2.2–§2.3). */
  private announce(defId: string, r: RoomInfo) {
    const def = ENEMY_BY_ID.get(defId);
    if (!def) return;
    const seq = this.spawnSeq.get(r.id) ?? 0;
    this.spawnSeq.set(r.id, seq + 1);
    const spot = this.spawnSpot(r, seq);
    this.omens.push({ def: defId, room: r.id, seq, x: spot.x, y: spot.y, z: spot.z, t: 0, breached: false, emitted: 0 });
    spatial.omenHum(spot.x, spot.y + 0.5, spot.z, 'floor');
  }

  /** A seeded spawn point among the room's standable floor cells (never by a door, away from the player). */
  private spawnSpot(r: RoomInfo, seq: number): { x: number; y: number; z: number } {
    const cells: Cell[] = [];
    for (let row = 0; row < r.d; row++) for (let col = 0; col < r.w; col++) {
      const cx = r.x0 + col, cz = r.z0 + row;
      if (!this.solid(cx, r.y0 - 1, cz) || this.solid(cx, r.y0, cz) || this.solid(cx, r.y0 + 1, cz)) continue;
      if (this.world.elemAt(cx, r.y0, cz) || this.world.elemAt(cx, r.y0 - 1, cz)) continue;
      cells.push({ x: cx + 0.5, z: cz + 0.5 });
    }
    const doors: Cell[] = this.doors.list.filter(d => d.rooms.includes(r.id)).map(d => ({ x: d.cx, z: d.cz }));
    const b = this.player.body;
    const rng = this.rng.fork('floor', r.floor, 'room', r.id % ROOM_ID_STRIDE, 'spawn', seq);
    const cell = pickSpawnCell(cells, doors, { x: b.x, z: b.z }, rng) ?? { x: r.hx + 6.5, z: r.hz + 3.5 };
    let y = r.y0;
    while (y < r.y0 + 3 && this.solid(Math.floor(cell.x), y, Math.floor(cell.z))) y++;
    return { x: cell.x, y, z: cell.z };
  }

  /** How many omens of a room are still open (its projections are not out yet). */
  private omensIn(room: number): number {
    let n = 0;
    for (const o of this.omens) if (o.room === room) n++;
    return n;
  }

  /** Advances the open omens: motes gather, the crack opens, and the projection breaches out. */
  private updateOmens(dt: number) {
    for (let i = this.omens.length - 1; i >= 0; i--) {
      const o = this.omens[i];
      o.t += dt;
      if (o.t < OMEN_GATHER) {
        // 72 motes accelerate through the gather, none born in its last 0.3 s (DECISIONS §7.3)
        const n = gatherMotesDue(o);
        if (n > 0) this.particles.gather(o.x, o.y + 0.8, o.z, pal(gatherMoteColor(o.t)), n, 3, OMEN_GATHER - o.t, 0.08, o.y);
        continue;
      }
      if (!o.breached && this.spawnHeld(o)) { o.t = OMEN_GATHER; continue; }
      if (!o.breached) {
        o.breached = true;
        spatial.breach(o.x, o.y + 0.5, o.z);
        this.particles.burst(o.x, o.y + 0.5, o.z, pal(OMEN_BREACH_COLOR), 10, 1.5, 0.05, true);
      }
      if (o.t < OMEN_GATHER + OMEN_BREACH) continue;
      if (this.spawnHeld(o)) { o.t = OMEN_GATHER + OMEN_BREACH; continue; }
      this.omens.splice(i, 1);
      const r = this.rooms.get(o.room);
      if (r) this.spawnEnemy(o.def, r, o.seq, o.x, o.y, o.z);
    }
  }

  /**
   * The doors of a sealed room slam shut, each with its own sound, dust and a gentle nudge. The dust is
   * chipped from the door's own frame ramp at its threshold (DECISIONS §7.3: ≤ 12 per door, ≤ 60 per event).
   */
  private slamDoors(room: number) {
    const doors = this.doors.list.filter(d => d.rooms.includes(room));
    const motes = slamMotesPerDoor(doors.length);
    for (const d of doors) {
      spatial.slam(d.cx, d.cy, d.cz);
      const threshold = d.cy - (d.y1 - d.y0 + 1) / 2 + 0.2;
      this.particles.burstRamp(d.cx, threshold, d.cz, mat(DOOR_FRAME[d.kind]).colors, motes, 2.5, 0.12);
    }
    this.hud.shake(SLAM_SHAKE);
  }

  private spawnHeld(o: Omen): boolean {
    return spawnBlocked({ x: o.x, z: o.z }, { x: this.player.body.x, z: this.player.body.z });
  }

  /** Materialise one projection where its omen breached. */
  private spawnEnemy(defId: string, r: RoomInfo, seq: number, x: number, y: number, z: number) {
    const def = ENEMY_BY_ID.get(defId);
    if (!def) return null;
    const id = this.actors.newId();
    const rooted = def.kind !== 'boss' && this.rng.fork('floor', r.floor, 'room', r.id % ROOM_ID_STRIDE, 'rooted', seq).chance(rootedChance(r.floor));
    const hp = def.kind === 'boss' ? bossHp(r.floor) : rooted ? Math.round(def.hp * ROOTED_HP) : def.hp;
    const tags = new Set(def.asleep ? ['asleep'] : []);
    if (rooted) tags.add('rooted');
    const ev = this.bus.emit('enemySpawn', { id, def: defId, hp, speed: def.speed, contactDamage: def.contactDamage, tags, x, y, z });
    if (ev.cancelled) return null;
    this.projectionSeq.set(id, seq);
    const e = this.enemies.spawn(def, id, r.id, ev.x, ev.y, ev.z, ev.hp, ev.speed, ev.contactDamage, ev.tags);
    this.actors.add(e);
    return e;
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
      const i = this.debris.spawn(id, x + 0.5, y + 0.5, z + 0.5, fx.spread(1.6), fx.range(1, 2.8), fx.spread(1.6));
      // rubble a projection breaks loose does not hurt it (a charging boss must not beat itself)
      if (source.startsWith('enemy:')) this.shed(i);
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
   * rewards live in chests, Minecraft-style), with one exception: a crate sometimes gives a key,
   * a heart or a small bomb (issue #6, `rollCrate`). The `blockLoot` event fires with those drops,
   * so an item can add more.
   */
  private rollLoot(x: number, y: number, z: number, material: number, source: string) {
    const drops: PickupKind[] = [];
    if (material === MAT.crate) {
      const drop = rollCrate(this.rng.stream('drops'), { floor: depthOf(y), luck: this.stats.get('luck') });
      if (drop) drops.push(drop);
    }
    const ev = this.bus.emit('blockLoot', { x, y, z, material, source, drops });
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

  /** A positive intention mends a damaged block and never breaks one; a negative one damages it. */
  private intentHitsBlock(hit: VoxelHit, mining: number, polarity: Polarity) {
    const id = this.world.get(hit.x, hit.y, hit.z);
    if (id === AIR) return false; // a door
    if (id === MAT.alembic) { this.hitLab(hit.x, hit.y, hit.z, polarity); return false; }
    if (id === MAT.kitchen) return false;   // unbreakable, and an intention does nothing to it
    if (polarity === 'positive') {
      const block = this.world.idx(hit.x, hit.y, hit.z);
      if (this.repairBlock(hit.x, hit.y, hit.z, mining)) this.idleGood = { block: -1, hits: 0 };
      else {
        this.idleGood = { block, hits: this.idleGood.block === block ? this.idleGood.hits + 1 : 1 };
        if (this.idleGood.hits >= POLARITY_HINT_HITS && !this.polarityHinted) {
          this.polarityHinted = true;
          this.hud.toast('toast.polarityHint', controlParams(activeDevice()));
        }
      }
      return false;
    }
    const broke = this.damageBlock(hit.x, hit.y, hit.z, mining, 'intent', 'intent');
    if (!broke) sfx.hit(Math.min(3, isFinite(mat(id).tier) ? mat(id).tier : 3));
    return broke;
  }

  private strokeHit(id: number, kx: number, kz: number, intent: IntentSpec) {
    const e = this.enemies.get(id);
    if (!e) return;
    const b = e.body;
    this.bus.emit('intentHit', { kind: 'actor', target: id, x: b.x, y: b.y + b.h / 2, z: b.z, nx: 0, ny: 0, nz: 0, vx: kx, vy: 0, vz: kz, intent });
  }

  private intentHit(kind: 'actor' | 'cube' | 'block', target: number, p: THREE.Vector3, n: THREE.Vector3, v: THREE.Vector3, intent: IntentSpec) {
    this.bus.emit('intentHit', { kind, target, x: p.x, y: p.y, z: p.z, nx: n.x, ny: n.y, nz: n.z, vx: v.x, vy: v.y, vz: v.z, intent });
  }

  private nearestSolid(p: THREE.Vector3, r: number): THREE.Vector3 | null {
    let best: THREE.Vector3 | null = null, bd = Infinity;
    for (let x = Math.floor(p.x - r); x <= Math.floor(p.x + r); x++)
      for (let y = Math.floor(p.y - r); y <= Math.floor(p.y + r); y++)
        for (let z = Math.floor(p.z - r); z <= Math.floor(p.z + r); z++) {
          if (!this.solid(x, y, z)) continue;
          const c = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
          const d = c.distanceToSquared(p);
          if (d < bd) { bd = d; best = c; }
        }
    return best;
  }

  private pulse(x: number, y: number, z: number, radius: number, damage: number, knock: number, color: number, source: string) {
    const p = this.player;
    for (const a of [...this.actors.all()]) {
      if (a.kind !== 'projection' || a.faction !== 'projection' || !a.alive || a.spawning > 0) continue;
      const b = a.body;
      const dx = b.x - x, dy = b.y + b.h / 2 - y, dz = b.z - z;
      if (Math.hypot(dx, dy, dz) > radius) continue;
      const l = Math.hypot(dx, dz) || 1;
      this.damageActor(a, damage, 'item', source, p.id, dx / l * knock / 3, dz / l * knock / 3);
    }
    this.particles.burst(x, y, z, color, 24, radius * 2, 0.07);
    spatial.cue('ring', x, y, z);
    this.hud.shake(0.1);
  }

  private arc(x: number, y: number, z: number, to: number, damage: number, source: string, polarity: Polarity) {
    const t = this.enemies.get(to);
    if (!t) return;
    this.bolt(x, y, z, t.body);
    const dx = t.body.x - x, dz = t.body.z - z, l = Math.hypot(dx, dz) || 1;
    this.intentTouch(to, damage, dx / l, dz / l, 'item', source, polarity, false);
  }

  private bolt(ax: number, ay: number, az: number, b: Body) {
    const bx = b.x, by = b.y + b.h / 2, bz = b.z;
    for (let k = 1; k < 6; k++) {
      const t = k / 6, j = () => (fx.random() - 0.5) * 0.4;
      this.particles.burst(ax + (bx - ax) * t + j(), ay + (by - ay) * t + j(), az + (bz - az) * t + j(), pal('light.core'), 2, 0.6, 0.06);
    }
    spatial.cue('bolt', bx, by, bz);
  }

  private nearestProjection(x: number, y: number, z: number, radius: number, except: readonly number[]) {
    let best: { id: number; x: number; y: number; z: number } | null = null, bd = radius;
    for (const a of this.actors.all()) {
      if (a.kind !== 'projection' || a.faction !== 'projection' || !a.alive || a.spawning > 0 || except.includes(a.id)) continue;
      const cx = a.body.x, cy = a.body.y + a.body.h / 2, cz = a.body.z;
      const d = Math.hypot(cx - x, cy - y, cz - z);
      if (d < bd) { bd = d; best = { id: a.id, x: cx, y: cy, z: cz }; }
    }
    return best;
  }

  private shove(id: number, dx: number, dz: number, speed: number) {
    const e = this.enemies.get(id);
    const l = Math.hypot(dx, dz);
    if (!e || e.faction !== 'projection' || !l) return;
    e.body.vx += dx / l * speed;
    e.body.vz += dz / l * speed;
  }

  private affectProjection(id: number, field: 'frozen' | 'fear', seconds: number) {
    const e = this.enemies.get(id);
    if (!e || e.faction !== 'projection') return;
    e[field] = Math.max(e[field], seconds);
    const b = e.body;
    this.particles.burst(b.x, b.y + b.h * 0.6, b.z, pal('cold.body'), 10, 1.4, 0.06);
    spatial.cue(field === 'frozen' ? 'field' : 'chirp', b.x, b.y, b.z);
  }

  private igniteArea(x: number, y: number, z: number, r: number) {
    for (let dz = -r; dz <= r; dz++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy + dz * dz > r * r) continue;
      const id = this.world.get(x + dx, y + dy, z + dz);
      if (id !== AIR && mat(id).flammable) this.ignite(x + dx, y + dy, z + dz, id, 'fire');
    }
  }

  private tagCube(cube: number, tag: string) {
    const tags = this.debris.tags[cube] ?? new Set<string>();
    tags.add(tag);
    this.debris.tags[cube] = tags;
  }

  /** Restores `amount` of a damaged block's HP (a positive intention's touch); false if there was nothing to mend. */
  private repairBlock(x: number, y: number, z: number, amount: number): boolean {
    const id = this.world.get(x, y, z);
    if (id === AIR) return false;
    const full = mat(id).hp, i = this.world.idx(x, y, z), hp = this.world.damaged.get(i);
    if (hp === undefined || !isFinite(full)) return false;
    const next = Math.min(full, hp + amount);
    if (next >= full - 1e-6) this.world.damaged.delete(i); else this.world.damaged.set(i, next);
    if (this.breakFx++ < BREAK_FX_PER_FRAME) this.particles.burst(x + 0.5, y + 0.5, z + 0.5, pal('light.gold'), 4, 1.2, 0.06);
    if (this.breakSfx++ < BREAK_SFX_PER_FRAME) sfx.mend();
    return true;
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
  /** A cube a boss sheds (its spill, its stones) flies harmless to projections until it first lands
   *  or you send it on: otherwise a boss would be beaten by its own rubble. */
  private shed(i: number) {
    this.debris.tags[i] = new Set(['shed']);
  }

  private cubeStrikes() {
    const d = this.debris;
    for (const e of this.enemies.list) {
      if (!e.alive || e.spawning > 0 || !hostile(this.player.faction, e.faction)) continue;
      const b = e.body;
      for (let i = 0; i < d.max; i++) {
        if (!d.isAlive(i) || d.isResting(i) || d.isBomb(i) || d.tags[i]?.has('shed')) continue;
        const i3 = i * 3, vx = d.vel[i3], vy = d.vel[i3 + 1], vz = d.vel[i3 + 2];
        const speed = Math.hypot(vx, vy, vz);
        if (speed < CUBE_HIT_SPEED) continue;
        const cx = d.pos[i3], cy = d.pos[i3 + 1], cz = d.pos[i3 + 2], r = DEBRIS_SIZE / 2;
        if (Math.abs(cx - b.x) > b.hw + r || Math.abs(cz - b.z) > b.hw + r || cy + r < b.y || cy - r > b.y + b.h) continue;
        // only a cube coming at the body hits it: one the projection itself shoves or runs through
        // flies away from it, however fast (a charging boss must not be beaten by its own rubble)
        const nx = b.x - cx, ny = b.y + b.h / 2 - cy, nz = b.z - cz, nl = Math.hypot(nx, ny, nz) || 1;
        if ((vx * nx + vy * ny + vz * nz) / nl < CUBE_HIT_SPEED) continue;
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
    // a boss's shed rubble just lands: its mark goes, and nothing (no item) hears about it
    if (tags.size === 1 && tags.has('shed')) { this.debris.tags[i] = null; return; }
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
    this.playerMedium = { ...m, slippery: !!mat(this.world.get(Math.floor(b.x), Math.floor(b.y - 0.05), Math.floor(b.z))).slippery };
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
    if (!this.input.held('cast') || p.fireCooldown > 0 || this.hands.holding || p.muteT > 0) return;
    const ev = this.bus.emit('fire', { intent: intentFromStats(this.stats.all, this.polarity) });
    if (ev.cancelled) return;
    p.fireCooldown = 1 / this.stats.get('fireRate');
    const dir = p.forward;
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
    const from = p.eye.addScaledVector(right, 0.18).add(new THREE.Vector3(0, -0.12, 0)).addScaledVector(dir, 0.3);
    this.intents.fire(ev.intent, from, dir, new THREE.Vector3(p.body.vx, 0, p.body.vz));
    this.enemies.mirror(p.body.x, p.body.z, 16, dir.x, dir.y, dir.z);
    this.hands.fire();
    sfx.shoot();
  }

  /** Right click on the alembic: the top of the hand goes into its bulb (game/alembic.ts). */
  private feedLab(x: number, y: number, z: number) {
    const a = this.labs.get(this.world.idx(x, y, z));
    const p = this.player;
    if (!a) { sfx.denied(); return; }
    if (isFlask(p.hand.at(-1)!)) { sfx.denied(); this.hud.toast('lab.refused'); return; }
    const r = labFeed(a, p.hand.at(-1)!);
    if (r !== 'fed') {
      sfx.denied();
      this.hud.toast(r === 'cold' ? 'lab.cold' : 'lab.full');
      return;
    }
    p.hand.pop();
    this.hands.placed();
    sfx.place();
    this.hud.toast('lab.fed', { n: a.bulb.length, total: BULB });
  }

  /** Right click on the kitchen: the part on top of the hand is cooked into a meal (game/kitchen.ts). */
  private cookAt(x: number, y: number, z: number) {
    const k = this.kitchens.get(this.world.idx(x, y, z));
    const p = this.player, top = p.hand.at(-1);
    if (!k || top === undefined) { sfx.denied(); return; }
    if (typeof top === 'number' || isFlask(top)) { sfx.denied(); this.hud.toast('kitchen.refused'); return; }
    if (!kitchenCook(k)) { sfx.denied(); this.hud.toast('kitchen.out'); return; }
    p.hand.pop();   // the part leaves the hand first, so the meal always has its place
    p.hand.push({ potion: mealOf(top.kind) });
    this.hands.placed();
    this.particles.burst(x + 0.5, y + 1, z + 0.5, pal('light.gold'), 16, 2, 0.06);
    sfx.place();
    this.hud.toastDrinkHint('kitchen.cooked', { left: COOKS - k.cooks, total: COOKS });
  }

  /** An intention on the alembic: a brew, a boil, or nothing (game/alembic.ts). */
  private hitLab(x: number, y: number, z: number, polarity: Polarity) {
    const a = this.labs.get(this.world.idx(x, y, z));
    if (!a) return;
    const { result: r, flask } = labBrew(a, polarity, this.bus, x, y, z);
    if (r === 'brew' && flask) {
      this.particles.burst(x + 0.5, y + 1, z + 0.5, pal('light.gold'), 30, 3, 0.07);
      sfx3.reveal();
      this.pickups.add('flask', x + 0.5, y + 1, z + 0.5, this.room, null, PART_DROP_DELAY, flask);
      this.hud.toastDrinkHint('lab.brewed', { left: BREWS - a.brews, total: BREWS });
    } else if (r === 'boil') {
      this.particles.burst(x + 0.5, y + 1, z + 0.5, pal('ink.ash'), 24, 2, 0.1);
      sfx.hit(3);
      this.hud.toast('lab.boiled');
    } else if (r === 'cold') this.hud.toast('lab.cold');
  }

  /** Drink: the top of the hand, when it is a flask, is drunk at once and its potion heals (content/potions.ts). */
  private drink() {
    const p = this.player, top = p.hand.at(-1);
    if (!top || !isFlask(top)) { sfx.denied(); return; }
    const def = POTIONS[top.potion];
    const rooms = flaskRooms(top);
    p.hand.pop();
    this.hands.placed();
    if (def.heal) this.heal(def.heal, `potion.${top.potion}`);
    this.potions.drink(top);
    this.bus.emit('drink', { potion: top.potion, rooms });
    this.particles.burst(p.body.x, p.body.y + 1.2, p.body.z, pal(def.liquid), 16, 1.2, 0.05);
    sfx.pickup();
    this.hud.toast('potion.drunk', { name: t(def.name), effect: t(def.effect, { rooms }) });
  }

  private potionsEnded(ended: readonly PotionId[]) {
    for (const id of ended) this.hud.toast('potion.ended', { name: t(POTIONS[id].name) });
  }

  /** Right click: place the top block on the face you look at; with nowhere to place it, throw it. */
  private tryPlace() {
    const p = this.player;
    if (!this.input.hit('place')) return;
    if (!p.hand.length) { sfx.denied(); return; }
    // a touch tap places on the block under the finger; a tap that finds nothing is refused, never thrown
    const tap = this.input.hitBy('place') === 'touch' ? this.input.touchTap : null;
    const e = this.camera.position, d = tap ? this.tapDirection(tap) : p.forward;
    const hit = raycastVoxels((x, y, z) => this.solid(x, y, z), e.x, e.y, e.z, d.x, d.y, d.z, this.stats.get('reach'));
    if (hit && this.world.get(hit.x, hit.y, hit.z) === MAT.alembic) { this.feedLab(hit.x, hit.y, hit.z); return; }
    if (hit && this.world.get(hit.x, hit.y, hit.z) === MAT.kitchen) { this.cookAt(hit.x, hit.y, hit.z); return; }
    const x = hit ? hit.x + hit.nx : 0, y = hit ? hit.y + hit.ny : 0, z = hit ? hit.z + hit.nz : 0;
    const ok = hit && (hit.nx || hit.ny || hit.nz) && this.world.inside(x, y, z) && !this.solid(x, y, z)
      && !this.doors.inDoorway(x, y, z);
    // a face in reach whose cell cannot take a block (a doorway, the world's edge) is refused like a
    // blocked placement, never thrown: only aiming at nothing throws the block
    if (!ok) { if (tap || hit) sfx.denied(); else this.throwTop(); return; }
    // the body reaching into the cell: a quarter of a block or less is nudged out and the block goes
    // down; deeper, the block waits in hand until the player steps clear (never thrown, never a jump)
    // the push is worked out now but applied only once the placement goes through (an item may cancel it)
    const over = cellOverlap(p.body, x, y, z);
    const push: [number, number] | null = over ? this.nudgeTarget(over) : [0, 0];
    if (over && (over.depth > PLACE_NUDGE_MAX || !push)) { sfx.denied(); return; }
    const top = p.hand.at(-1)!;
    if (typeof top !== 'number') {
      this.pickups.add(isFlask(top) ? 'flask' : 'part', x + 0.5, y, z + 0.5, this.room, null, PART_DROP_DELAY, top);
      this.nudge(push!);
      p.hand.pop();
      this.hands.placed();
      sfx.place();
      return;
    }
    const ev = this.bus.emit('blockPlace', { x, y, z, material: p.top });
    if (ev.cancelled) return;
    this.world.set(x, y, z, ev.material);
    this.debris.clearCell(x, y, z);
    this.nudge(push!);
    p.hand.pop();
    this.bus.emit('drop', { material: top, how: 'place' });
    this.hands.placed();
    sfx.place();
  }

  /** The shift that takes the player out of the cell it is placing into; null when a wall is in the way. */
  private nudgeTarget(over: CellOverlap): [number, number] | null {
    const b = this.player.body;
    const push = over.depth + PLACE_NUDGE_CLEAR;
    const dx = over.axis === 0 ? over.dir * push : 0, dz = over.axis === 2 ? over.dir * push : 0;
    if (boxHits((xx, yy, zz) => this.solid(xx, yy, zz), b.x + dx, b.y, b.z + dz, b.hw, b.h)) return null;
    return [dx, dz];
  }

  /** Applies a shift from nudgeTarget once the placement is certain. */
  private nudge([dx, dz]: [number, number]) {
    const b = this.player.body;
    b.x += dx; b.z += dz;
  }

  /** The ray through a tapped pixel, as the camera sees it. */
  private tapDirection(tap: { x: number; y: number }) {
    const ndc = new THREE.Vector3(tap.x / innerWidth * 2 - 1, 1 - tap.y / innerHeight * 2, 0.5).unproject(this.camera);
    return ndc.sub(this.camera.position).normalize();
  }

  /** Throws the top block of your hand (Q, or right click with nowhere to place). */
  private throwTop() {
    const p = this.player;
    if (!p.hand.length) { sfx.denied(); return; }
    const e = p.eye.addScaledVector(p.forward, 0.7), dir = p.forward;
    if (this.solid(Math.floor(e.x), Math.floor(e.y), Math.floor(e.z))) { sfx.denied(); return; }
    const top = p.hand.at(-1)!;
    if (typeof top !== 'number') {
      const part = this.pickups.add(isFlask(top) ? 'flask' : 'part', e.x, e.y, e.z, this.room, null, PART_DROP_DELAY, top);
      const speed = 9 * this.stats.get('throw');
      this.pickups.launch(part, dir.x * speed + p.body.vx, dir.y * speed + 2, dir.z * speed + p.body.vz);
      p.hand.pop();
      this.hands.placed();
      sfx.kick();
      return;
    }
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

  /**
   * Walking into solid blocks wears them down (the `crush` stat is the block damage per second of
   * contact; armor still counts). Every block around you that you press against takes it, at feet,
   * waist and head height, never the ones below. Each tick `touchBlock` can still veto or add.
   */
  private touchBlocks(dt: number) {
    const p = this.player, b = p.body;
    const crush = this.stats.get('crush');
    if (crush <= 0 || Math.hypot(p.wishX, p.wishZ) < 0.1) { this.contactT = 0; return; }
    this.contactT += dt;
    if (this.contactT < CONTACT_TICK) return;
    this.contactT -= CONTACT_TICK;
    const reach = b.hw + 0.12, sx = Math.sign(p.wishX), sz = Math.sign(p.wishZ);
    const spots: [number, number][] = [[b.x + p.wishX * reach, b.z + p.wishZ * reach]];
    if (sx) spots.push([b.x + sx * reach, b.z]);
    if (sz) spots.push([b.x, b.z + sz * reach]);
    const seen = new Set<number>();
    for (const [fx, fz] of spots) for (const oy of [0.1, 1.0, 1.7]) {
      const x = Math.floor(fx), y = Math.floor(b.y + oy), z = Math.floor(fz);
      const id = this.world.get(x, y, z);
      if (id === AIR) continue;
      const k = this.world.idx(x, y, z);
      if (seen.has(k)) continue;
      seen.add(k);
      const ev = this.bus.emit('touchBlock', { x, y, z, material: id, crush: true });
      if (ev.cancelled || !ev.crush) continue;
      if (!this.damageBlock(x, y, z, crush * CONTACT_TICK, 'crush', 'contact')) {
        if (this.breakFx++ < BREAK_FX_PER_FRAME) this.particles.burst(x + 0.5, y + 0.5, z + 0.5, mat(id).colors[0], 3, 1.5, 0.06);
        if (this.breakSfx++ < BREAK_SFX_PER_FRAME) sfx.hit(Math.min(3, isFinite(mat(id).tier) ? mat(id).tier : 3));
      }
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
    if (ev.needsKey && this.potions.lockDiscount() > 0) {
      this.questioned();
    } else if (ev.needsKey) {
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
      if (p.type === 'part' || p.type === 'flask') {
        const carried = p.carried;
        if (carried && p.delay <= 0 && this.player.hand.length < Math.floor(this.stats.get('carry'))) {
          this.pickups.take(p);
          this.player.hand.push(carried);
          this.hands.holdUp(carriedDef(carried));
          if (typeof carried === 'object') {
            if (isFlask(carried)) this.hud.toastDrinkHint('hand.took', { item: this.carriedName(carried) });
            else this.hud.toast('hand.took', { item: this.carriedName(carried) });
          }
          sfx.pickup();
        }
        continue;
      }
      // hearts stay on the floor while you're at full health, like in Isaac
      if (p.type === 'heart' && this.player.hp >= this.maxHp) continue;
      if (this.collect(p.type, p.type === 'heart' ? 2 : 1)) {
        this.pickups.take(p);
        this.particles.burst(p.x, p.y + 0.3, p.z, PICKUP_FX[p.type], 10, 2, 0.06);
      }
    }
  }

  /** Walking up to a closed chest opens it, spending its keys (some cost none). A guarded chest is not
   *  opened here: its Boundary asks for a mission first (see askGuard). */
  private touchChests() {
    const b = this.player.body;
    for (const c of this.chests) {
      if (c.opened || c.spec.guard) continue;
      const s = c.spec, dist = Math.hypot(b.x - (s.x + 0.5), b.z - (s.z + 0.5));
      if (dist > 3) c.refused = false;
      if (c.refused || dist > 1.5 || b.y < s.y - 1.2 || b.y > s.y + 2.2) continue;
      const ev = this.bus.emit('chestOpen', { x: s.x, y: s.y, z: s.z, cost: s.keys });
      const asked = Math.max(0, Math.floor(ev.cost));
      const question = asked > 0 && !ev.cancelled && this.potions.lockDiscount() > 0 && this.player.keys >= asked - 1;
      const cost = question ? asked - 1 : asked;
      if (ev.cancelled || this.player.keys < cost) {
        c.refused = true;
        this.hud.toast('toast.chestLocked', { n: cost });
        sfx.denied();
        continue;
      }
      this.player.keys -= cost;
      if (question) this.questioned();
      this.openChest(c, cost);
    }
  }

  /** Walking up to the Boundary of a vault asks one real-world mission for the chest it keeps. Not yet
   *  waits until the player steps three blocks away from the Boundary. */
  private touchGuards() {
    if (this.hud.tollOpen || this.hud.guardOpen || this.hud.bannerOpen) return;
    const b = this.player.body;
    for (const e of this.enemies.list) {
      if (!e.alive || !e.tags.has('boundary')) continue;
      const dist = Math.hypot(e.body.x - b.x, e.body.z - b.z);
      const near = dist <= TALK_REACH && Math.abs(e.body.y - b.y) <= 2;
      const c = this.chests.find(q => q.spec.guard && !q.opened && q.spec.room === e.room);
      if (!c) continue;
      if (dist > 3) c.refused = false;
      if (c.refused || !near) continue;
      const mission = pickMission(this.rng.stream('guard'));
      const asked = performance.now();
      this.hud.openGuard(this, mission, yes => this.answerGuard(c, asked, yes));
      return;
    }
  }

  /** "Have you done it?": yes or no, the reward spawns from the chest and the Boundary leaves. A yes draws
   *  tier 1 or 2 inside the window and tier 3 or 4 after it; a no draws tier 1 or 2. */
  private answerGuard(c: { spec: ChestSpec; opened: boolean; refused: boolean; view: ChestView }, asked: number, yes: boolean) {
    if (c.opened) return;
    const [lo, hi] = rewardBand(yes, performance.now() - asked);
    const def = ITEM_BY_ID.get(this.pools.drawRuntime('treasure', this.rng.stream('loot'), [lo, hi])) ?? null;
    this.openChest(c, 0, def ?? undefined);
    this.releaseBoundary(c.spec.room);
  }

  /** The Boundary of a vault leaves once its mission is answered yes. */
  private releaseBoundary(room: number) {
    for (const e of [...this.enemies.list]) {
      if (!e.alive || !e.tags.has('boundary') || e.room !== room) continue;
      this.particles.burst(e.body.x, e.body.y + 1.5, e.body.z, pal('light.gold'), 16, 2, 0.06);
      this.enemies.dissolve(e);
      this.bus.off(null, `actor:${e.id}`);
      this.actors.remove(e.id);
      this.contacts.forget(e.id);
      this.boundaryRing.delete(e.id);
    }
  }

  private questioned() {
    const id = this.potions.spendLock();
    if (!id) return;
    this.hud.toast('potion.questioned', { name: t(POTIONS[id].name) });
    sfx2.unlock();
  }

  private openChest(c: { spec: ChestSpec; opened: boolean; view: ChestView }, cost: number, reward?: ItemDef) {
    c.opened = true;
    const s = c.spec;
    this.world.set(s.x, s.y, s.z, MAT.chestopen);
    const lead = this.chestViews.open(c.view);
    const cx = s.x + 0.5, cz = s.z + 0.5;
    this.particles.burst(cx, s.y + 0.5, cz, pal('brass.base'), 10, 2, 0.06);
    this.hud.shake(0.08);
    if (cost > 0) { this.hud.toast('toast.chestUnlocked', { n: cost }); sfx2.unlock(); } else sfx2.key();
    sfx3.creak();
    const b = this.player.body;
    const len = Math.hypot(b.x - cx, b.z - cz) || 1, ax = (b.x - cx) / len, az = (b.z - cz) / len;
    const out: { type: PickupKind | 'item'; def: ItemDef | null }[] = [];
    if (s.item) out.push({ type: 'item', def: this.pedestalDef(s) });
    else if (reward) out.push({ type: 'item', def: reward });
    else {
      const rng = this.rng.stream('loot'), floor = depthOf(s.y), luck = this.stats.get('luck');
      const n = 1 + (rng.chance(0.4) ? 1 : 0) + (rng.chance(0.15) ? 1 : 0);
      let practice = false;
      for (let i = 0; i < n; i++) {
        const what = CHEST_CONTENTS.roll(rng, { floor, luck }) ?? 'key';
        const def = what === 'item' && !practice ? ITEM_BY_ID.get(this.pools.drawRuntime('treasure', rng)) ?? null : null;
        if (def) { practice = true; out.push({ type: 'item', def }); }
        else out.push({ type: what === 'item' ? 'key' : what, def: null });
      }
      if (!practice && rng.chance(CHEST_RARE)) {
        const def = ITEM_BY_ID.get(this.pools.drawRuntime('treasure', rng)) ?? null;
        if (def) out.push({ type: 'item', def });
      }
    }
    out.forEach((o, i) => this.spits.push({ t: lead + i * 0.16, run: () => {
      const spread = out.length > 1 ? (i / (out.length - 1) - 0.5) * 1.1 : 0;
      const dx = ax * Math.cos(spread) - az * Math.sin(spread), dz = az * Math.cos(spread) + ax * Math.sin(spread);
      const p: Pickup = this.pickups.add(o.type, cx, s.y + 1.02, cz, s.room, o.def, 0.6);
      const speed = (o.type === 'item' ? 1.7 : 1.5) / 0.68;
      this.pickups.launch(p, dx * speed, 6.5, dz * speed);
      this.particles.burst(cx, s.y + 1, cz, pal('light.gold'), o.type === 'item' ? 22 : 10, 2.5, 0.07);
      if (o.type === 'item') sfx3.reveal(); else sfx3.spit();
    } }));
  }

  private updateSpits(dt: number) {
    for (const q of this.spits) { q.t -= dt; if (q.t <= 0) q.run(); }
    this.spits = this.spits.filter(q => q.t > 0);
  }

  /** Somewhere new without walking there (a star pad, heaven, silence): find room to stand, then
   *  let the HUD, the fog and the floor bookkeeping catch up (review L4–L6 points 3 and 5). */
  private teleport(x: number, y: number, z: number) {
    const fx0 = Math.floor(x), fz0 = Math.floor(z);
    let fy = Math.floor(y);
    for (let i = 0; i < 24 && (this.solid(fx0, fy, fz0) || this.solid(fx0, fy + 1, fz0)); i++) fy++;
    if (this.solid(fx0, fy, fz0) || this.solid(fx0, fy + 1, fz0)) { this.world.set(fx0, fy, fz0, AIR); this.world.set(fx0, fy + 1, fz0, AIR); }
    this.player.spawnAt(fx0 + 0.5, fy, fz0 + 0.5);
    this.groundBand = bandOf(fy);
    this.room = -1;
    this.zone = '';
  }

  /**
   * The world's loop (L4): in silence, under the frozen bottom, everything goes quiet; stand still
   * there and you are carried up to heaven, above the tree, falling slowly onto its leaves. Once
   * you have known silence, the top of the sky takes you back down to it. And the stars of the
   * tree: each pad carries you to the next star of its constellation.
   */
  private updateRest(dt: number) {
    const b = this.player.body;
    const still = b.onGround && Math.hypot(b.vx, b.vz) < 0.15;
    for (const e of this.enemies.list) {
      if (!e.alive || e.hidden || e.def !== 'mossling' || e.tags.has('rested')) continue;
      e.clock = still && Math.hypot(e.body.x - b.x, e.body.z - b.z) < 2.5 ? e.clock + dt : 0;
      if (e.clock < REST_TIME) continue;
      e.tags.add('rested');
      this.heal(QUARTER_HEART, 'mossling');
      this.particles.burst(e.body.x, e.body.y + 0.4, e.body.z, pal('living.glow'), 10, 1.4, 0.05);
    }
  }

  private updateBoundaries() {
    const b = this.player.body;
    for (const e of this.enemies.list) {
      if (!e.alive || !e.tags.has('boundary')) continue;
      const rm = this.rooms.get(e.room);
      const inside = !!rm && b.x > rm.x0 && b.x < rm.x0 + rm.w && b.z > rm.z0 && b.z < rm.z0 + rm.d;
      const broken = (this.boundaryRing.get(e.id) ?? []).some(([x, y, z]) => !this.solid(x, y, z));
      const faction = broken && inside ? 'projection' : 'neutral';
      if (e.faction !== faction) e.faction = faction;
    }
  }

  private hearPresences(x: number, z: number, polarity: Polarity) {
    for (const e of this.enemies.list) {
      if (!e.alive || !e.tags.has('presence') || !e.tags.has('met')) continue;
      const reaction = presenceReaction(polarity, Math.hypot(e.body.x - x, e.body.z - z));
      if (reaction === 'lift') e.tags.delete('silent');
      if (reaction !== 'silence' || e.tags.has('silent')) continue;
      e.tags.add('silent');
      if (!e.tags.has('spoke')) {
        e.tags.add('spoke');
        this.hud.presenceCard(PRESENCE_TALK[e.def as PresenceId].name, [PRESENCE_TALK[e.def as PresenceId].silent]);
      }
    }
  }

  private updatePresences() {
    const b = this.player.body;
    for (const e of this.enemies.list) {
      if (!e.alive || e.hidden || !e.tags.has('presence') || e.tags.has('met') || e.tags.has('silent')) continue;
      const near = Math.hypot(e.body.x - b.x, e.body.z - b.z) <= TALK_REACH && Math.abs(e.body.y - b.y) <= 2;
      if (!near) { e.tags.delete('answering'); continue; }
      const id = e.def as PresenceId, talk = PRESENCE_TALK[id];
      const top = this.player.hand.at(-1);
      if (!unlocksPresence(id, top)) {
        if (e.tags.has('answering')) continue;
        const now = performance.now();
        if (!e.tags.has('hinted')) {
          e.tags.add('hinted');
          e.tags.add('answering');
          this.presenceReplies.set(e.id, now);
          this.hud.presenceCard(talk.name, [talk.hint]);
          return;
        }
        if (!answerDue(this.presenceReplies.get(e.id), now)) continue;
        e.tags.add('answering');
        this.presenceReplies.set(e.id, now);
        if (top === undefined) this.hud.presenceCard(talk.name, ['presence.empty']);
        else this.hud.presenceCard(talk.name, ['presence.wrong'], { item: this.carriedName(top) });
        return;
      }
      // the offer is accepted: the part leaves the hand (the hand dips, the part's colour leaves with it)
      const part = this.player.hand.pop();
      this.hands.placed();
      const color = typeof part === 'object' && !isFlask(part) ? part.color : pal('bone.dim');
      const eye = this.player.eye, fwd = this.player.forward;
      this.particles.burst(eye.x + fwd.x * 0.6, eye.y - 0.4, eye.z + fwd.z * 0.6, color, 10, 1.2, 0.05);
      e.tags.add('met');
      if (talk.heals) this.listenerReward(e, id);
      this.particles.burst(e.body.x, e.body.y + 1.2, e.body.z, pal('light.gold'), 8, 1.2, 0.05);
      this.hud.presenceCard(talk.name, talk.lines);
      return;
    }
  }

  /** The Listener's reward for its part (rewardFor): a quarter heart when hurt; at full health a heart
   *  leaves the Listener in an arc and waits on the floor until the player is hurt. */
  private listenerReward(e: Enemy, source: string) {
    if (rewardFor(this.player.hp, this.maxHp) === 'heal') { this.heal(QUARTER_HEART, source); return; }
    const b = this.player.body;
    const dx = b.x - e.body.x, dz = b.z - e.body.z, d = Math.hypot(dx, dz) || 1;
    const heart = this.pickups.add('heart', e.body.x, e.body.y + 1.6, e.body.z, e.room, null, 0.3);
    this.pickups.launch(heart, dx / d * 2.5, 3, dz / d * 2.5);
  }

  private pushPresences() {
    const b = this.player.body;
    for (const e of this.enemies.list) {
      if (!e.alive || e.hidden || !(e.tags.has('presence') || e.tags.has('boundary'))) continue;
      if (b.y + b.h <= e.body.y || b.y >= e.body.y + e.spec.size[1]) continue;
      const at = pushedOut(b.x, b.z, e.body.x, e.body.z, e.spec.size[0] / 2 + b.hw);
      if (at && !boxHits((x, y, z) => this.solid(x, y, z), at.x, b.y, at.z, b.hw, b.h)) { b.x = at.x; b.z = at.z; }
    }
  }

  private carriedName(c: Carried): string {
    if (typeof c === 'number') return materialName(c);
    if (isFlask(c)) return t(POTIONS[c.potion].name);
    return partText(c).name;
  }

  private updateLoop(dt: number) {
    tickLabs(this.labs.values(), dt);
    this.updateRest(dt);
    this.updatePresences();
    this.touchGuards();
    this.pushPresences();
    this.updateBoundaries();
    const p = this.player, b = p.body, last = this.floors.get(LAST_FLOOR)?.silence;
    const inSilence = !!last && b.x >= last.x0 && b.x <= last.x1 + 1 && b.z >= last.z0 && b.z <= last.z1 + 1 && b.y >= last.y0 - 0.5 && b.y <= last.y1 + 1;
    setMasterTarget(inSilence ? 0 : 0.35);
    if (inSilence) {
      if (!this.silenceSeen) { this.silenceSeen = true; this.hud.toast('toast.silence'); }
      const still = Math.hypot(b.vx, b.vz) < 0.15 && Math.abs(b.vy) < 0.2;
      this.stillT = still ? this.stillT + dt : 0;
      if (this.stillT >= SILENCE_STILL) {
        this.stillT = 0;
        p.float = true;
        this.teleport(this.tree.cx + 0.5, SURFACE_Y + SKY_LIMIT - 3, this.tree.cz + 0.5);
        this.particles.burst(b.x, b.y + 1, b.z, pal('bone.paper'), 24, 2, 0.08);
        this.hud.toast('toast.heaven');
        sfx3.reveal();
      }
    } else this.stillT = 0;
    // the top of the sky, once silence is known, opens down into it (it loops)
    if (last && this.silenceSeen && b.y > SURFACE_Y + SKY_LIMIT - 1.5) {
      this.teleport((last.x0 + last.x1) / 2 + 2, last.y0, (last.z0 + last.z1) / 2 + 2);
      sfx3.rumble();
    }
    // star pads: step on one and you are on the next star of its constellation
    const fx0 = Math.floor(b.x), fy = Math.floor(b.y + 0.05), fz0 = Math.floor(b.z);
    const pad = b.onGround ? this.tree.pads.findIndex(q => q.x === fx0 && q.y === fy && q.z === fz0) : -1;
    if (pad < 0) this.padLock = -1;
    else if (pad !== this.padLock) {
      const to = this.tree.pads[this.tree.pads[pad].to];
      this.padLock = this.tree.pads[pad].to;
      this.particles.burst(b.x, b.y + 0.5, b.z, pal('bone.paper'), 16, 2.5, 0.07);
      this.teleport(to.x + 0.5, to.y, to.z + 0.5);
      sfx2.charged();
    }
    // what the HUD calls this place: a floor below, a level of the tree above, silence at the bottom
    const zone = inSilence ? 'silence' : bandOf(b.y) !== SURFACE ? '' : TREE_STORIES[Math.max(0, this.tree.storyAt(b.y))].zone;
    if (zone !== this.zone) {
      this.zone = zone;
      if (zone) this.hud.setZone(zone);
      else if (this.floors.get(this.depth)) this.hud.setFloor(this.floors.get(this.depth)!, this.depth);
    }
  }

  private stream() {
    const s = this.storyOf(this.player.eye.y);
    if (s === this.story) return;
    this.story = s;
    for (const n of [s - 1, s, s + 1]) {
      const i = -n - 1;
      if (i < 0 || i >= TREE_STORIES.length || this.tree.isGrown(i)) continue;
      this.tree.grow(i);
      const [y0, y1] = this.tree.range(i);
      for (let y = y0; y <= y1 + CHUNK; y += CHUNK) for (let z = 0; z < this.world.sz + CHUNK; z += CHUNK) for (let x = 0; x < this.world.sx + CHUNK; x += CHUNK)
        this.world.markDirty(Math.min(x, this.world.sx - 1), Math.min(y, y1), Math.min(z, this.world.sz - 1));
      this.world.version++;
    }
    this.chunks.setLoadedRange(this.storyRange(s + 1)[0], this.storyRange(s - 1)[1]);
  }

  private storyOf(y: number) {
    const band = bandOf(y);
    return band !== SURFACE ? band : -1 - Math.max(0, this.tree.storyAt(y));
  }

  private storyRange(s: number): [number, number] {
    if (s < 0) return this.tree.range(Math.min(-s - 1, TREE_STORIES.length - 1));
    if (s > LAST_FLOOR) return [0, floorY(LAST_FLOOR) - 3];
    return [floorY(s) - 2, floorY(s) - 2 + BAND - 1];
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
      this.potionsEnded(this.potions.floorEntered());
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
      if (r.type === 'boss' && !this.bossRooms.has(r.floor)) {
        this.activate(r.floor + 1);
        this.enterBossRoom(r);
      }
    }
    for (const [k, st] of this.bossRooms) this.updateBossRoom(k, st, dt);
  }

  private enterBossRoom(r: RoomInfo) {
    const f = this.floors.get(r.floor)!;
    const st: BossRoom = { room: r.id, wake: BOSS_WAKE, spawned: false, defeated: false, t: HOLE_DELAY, open: !f.hole, warned: false, dust: 0, asked: false };
    this.bossRooms.set(r.floor, st);
    if (!f.boss) { st.spawned = true; st.defeated = true; return; }
    this.doors.seal(r.id, true);
    this.slamDoors(r.id);
    sfx3.seal();
  }

  private summonBoss(f: FloorResult, r: RoomInfo) {
    const at = this.spawnSpot(r, 0);
    this.omens.push({ def: f.boss!, room: r.id, seq: 0, x: at.x, y: at.y, z: at.z, t: 0, breached: false, emitted: 0 });
    spatial.omenHum(at.x, at.y + 0.5, at.z, 'floor');
  }

  private bossDown(floor: number) {
    const st = this.bossRooms.get(floor);
    if (!st || st.defeated) return;
    st.defeated = true;
    st.t = HOLE_DELAY;
    this.doors.seal(st.room, false);
    this.roomState.get(st.room)!.cleared = true;
    this.revealBossItem(this.floors.get(floor)!);
    this.hud.toast('toast.bossDown');
    this.hud.shake(0.6);
    sfx3.clear();
  }

  /**
   */
  private updateBossRoom(k: number, st: BossRoom, dt: number) {
    const f = this.floors.get(k)!;
    if (!st.spawned) {
      st.wake -= dt;
      if (st.wake <= 0) { st.spawned = true; this.summonBoss(f, this.rooms.get(st.room)!); }
      return;
    }
    const boss = this.enemies.list.find(e => e.alive && e.spec.kind === 'boss' && e.room === st.room);
    this.hud.bossBar(boss && this.room === st.room ? { name: enemyText(boss.spec).name, ratio: boss.hp / boss.maxHp } : null);
    if (!st.defeated || st.open) return;
    const hole = f.hole;
    st.t -= dt;
    if (hole) this.crackHole(hole, Math.min(1, 1 - st.t / HOLE_DELAY));
    if (st.t > 0 || !hole) return;
    if (tollOf(k)) {
      if (!this.standsOnHole(hole)) st.asked = false;
      else if (!st.asked) { st.asked = true; this.hud.openToll(this, k); }
      return;
    }
    if (this.standsOnHole(hole)) {
      if (!st.warned) { st.warned = true; this.hud.toast('toast.holeWait'); sfx3.rumble(); }
      st.dust -= dt;
      if (st.dust <= 0) {
        st.dust = 0.25;
        this.particles.burst(hole.x + hole.size / 2, hole.yTop + 1.05, hole.z + hole.size / 2, pal('limestone.dark'), 6, 1.2, 0.06);
      }
      return;
    }
    st.open = true;
    openHole(this.world, hole);
    this.particles.burst(hole.x + hole.size / 2, hole.yTop + 1, hole.z + hole.size / 2, pal('limestone.dark'), 40, 4, 0.15);
    this.hud.shake(0.5);
    this.hud.toast('toast.wayDown');
    sfx3.rumble();
  }

  payToll(k: number, ids: readonly string[]): boolean {
    const toll = tollOf(k), f = this.floors.get(k), st = this.bossRooms.get(k);
    const p = this.player;
    if (!toll || !f?.hole || !st || p.dead || new Set(ids).size !== ids.length || ids.length !== toll.count) return false;
    const hearts = Math.ceil(p.hp / HEART);
    const hands: number[] = [], items: string[] = [];
    let keys = 0, bombs = 0, paid = 0;
    for (const id of ids) {
      const [kind, at] = id.split(':'), i = tollIndex(at);
      if (i === null) return false;
      if (kind === 'item' ? !toll.practices : toll.practices) return false;
      if (kind === 'hand') { if (!(i < p.hand.length)) return false; hands.push(i); }
      else if (kind === 'key') { if (!(i < p.keys)) return false; keys++; }
      else if (kind === 'bomb') { if (!(i < p.bombs)) return false; bombs++; }
      else if (kind === 'heart') { if (!(i < hearts)) return false; paid++; }
      else if (kind === 'item') { const held = this.inventory.items[i]; if (!held) return false; items.push(held.def.id); }
      else return false;
    }
    for (const i of hands.sort((a, b) => b - a)) p.hand.splice(i, 1);
    p.keys -= keys;
    p.bombs -= bombs;
    for (const id of items) this.inventory.lose(id);
    if (items.length) this.hud.setItems(this.inventory.items.map(i => i.def));
    if (paid) { p.invulnT = 0; this.damageActor(p, paid * HEART, 'toll', 'toll', p.id); }
    if (p.dead) return true;
    st.open = true;
    openHole(this.world, f.hole);
    const h = f.hole;
    this.particles.burst(h.x + h.size / 2, h.yTop + 1, h.z + h.size / 2, pal('limestone.dark'), 40, 4, 0.15);
    this.hud.shake(0.5);
    this.hud.toast('toast.wayDown');
    sfx3.rumble();
    return true;
  }

  /** The hole's top blocks show real crack stages as `p` goes 0 → 1 (the floor is about to give way). */
  private crackHole(hole: NonNullable<FloorResult['hole']>, p: number) {
    for (let dz = 0; dz < hole.size; dz++) for (let dx = 0; dx < hole.size; dx++) {
      const x = hole.x + dx, z = hole.z + dz, id = this.world.get(x, hole.yTop, z);
      if (id === AIR) continue;
      const max = mat(id).hp, i = this.world.idx(x, hole.yTop, z);
      this.world.damaged.set(i, Math.min(this.world.damaged.get(i) ?? max, max * (1 - 0.95 * Math.max(0.05, p))));
    }
  }

  /** Is the player standing (or hovering) over the 2×2 hole? */
  private standsOnHole(hole: NonNullable<FloorResult['hole']>) {
    const b = this.player.body;
    return b.x + b.hw > hole.x && b.x - b.hw < hole.x + hole.size && b.z + b.hw > hole.z && b.z - b.hw < hole.z + hole.size
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
    inp.poll(dt);
    this.deadT = this.player.dead ? this.deadT + dt : 0;
    const playing = inp.playing || this.simulateUnlocked;
    const ctx = this.player.dead ? 'dead' : this.hud.screenOpen ? 'inventory' : this.hud.tollOpen || this.hud.guardOpen ? 'toll' : !playing ? 'paused' : this.hud.bannerOpen ? 'prompt' : 'play';
    const restartBy = inp.hitBy('restart');
    const live = ctx === 'play' || ctx === 'prompt';
    if (restartBy === 'keyboard' ? live || ctx === 'dead' : restartBy && (ctx === 'paused' || ctx === 'dead')) this.requestRestart();
    else if (ctx === 'dead' && this.deadT > DEATH_GRACE && inp.hit('confirm')) this.requestRestart();
    if (ctx === 'paused' && (inp.hit('confirm') || (inp.hitBy('pause') ?? 'keyboard') !== 'keyboard')) inp.resume();
    else if (live && inp.hit('pause')) inp.release();
    if (this.restartT > 0) {
      this.restartT -= dt;
      if (this.restartT <= 0) { if (this.sandbox) this.newSandbox(this.sandbox); else this.newRun(); this.revealT = 0; }
    } else if (this.revealT >= 0) {
      // stay dark until the new world is meshed, so it never pops in
      this.revealT += dt;
      if (!this.chunks.busy || this.revealT > RESTART_HOLD_MAX) { this.revealT = -1; this.hud.fadeIn(); }
    }
    // an information banner stays until clicked; that click only dismisses it
    if (ctx === 'prompt' && inp.hit('confirm')) {
      this.hud.dismissBanner();
      inp.suppress('cast', 'place', 'jump', 'throw', 'bomb', 'polarity', 'confirm');
    }
    if (live || ctx === 'paused' || ctx === 'inventory') {
      const by = inp.hitBy('inventory');
      if (by) this.hud.screenKey(this, by);
    }
    if (ctx === 'inventory') {
      if (inp.hit('back')) this.hud.closeScreen(this);
      else { const n = inp.navigate(); if (n.x || n.y) this.hud.moveSelection(n.x, n.y); }
    }
    if (ctx === 'toll') {
      if (inp.hit('back')) this.hud.closeToll(this);
      else {
        const n = inp.navigate();
        if (n.x || n.y) this.hud.moveSelection(n.x, n.y);
        if (inp.hit('confirm')) this.hud.confirmToll(this);
      }
    }
    this.touch.update(this, ctx);
    const running = playing && !this.player.dead && !this.hud.screenOpen && !this.hud.tollOpen && !this.hud.guardOpen && !this.transitioning;
    // the sandbox moves in fixed steps, one per frame, so a session can be replayed
    if (running && !this.paused) this.simulate(this.sandbox ? SANDBOX_DT : dt);
    this.stream();
    this.chunks.update();
    const p = this.player, e = p.eye;
    const sky = e.y > SURFACE_Y - 4;
    this.chunks.setVisibleRange(e.y - (sky ? 60 : 22), e.y + (sky ? 120 : 22));
    this.stars.position.set(e.x, 0, e.z);

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
    // up the tree the sky turns to night and the stars come out (the cosmos); silence is dark
    const night = THREE.MathUtils.smoothstep(e.y, SURFACE_Y + TREE_ZONES.branches, SURFACE_Y + TREE_ZONES.heaven);
    if (night > 0) { this.fogColor.lerp(NIGHT, night); fog.far = 34 + k * 80 + night * 60; }
    this.stars.visible = night > 0.05;
    (this.stars.material as THREE.PointsMaterial).opacity = night;
    const deep = this.floors.get(LAST_FLOOR)?.silence;
    if (deep && e.y < deep.y1 + 2) { this.fogColor.setHex(pal('ink.void')); fog.near = 0; fog.far = 14; }
    fog.color.copy(this.fogColor);
    easeMaster(dt);
    this.chunks.animate(this.time);
    this.renderer.setClearColor(this.fogColor);

    this.camera.getWorldDirection(this.camDir);
    spatial.listener(this.camera.position.x, this.camera.position.y, this.camera.position.z, this.camDir.x, this.camDir.z);
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
      land: (fall, x, y, z) => {
        const cause = bandOf(b.y) !== this.groundBand ? 'descent' : 'fall';
        this.bus.emit('land', { fallSpeed: fall, cause, x, y, z });
      },
      bump: speed => this.headBump(speed),
    }, this.playerMedium);
    if (b.onGround) this.groundBand = bandOf(b.y);
    this.clampHealth();
    this.touchBlocks(dt);
    this.syncWeapon();
    if (this.weapon) this.weapon.update(dt);
    if (!this.weapon || WEAPONS_KEEPING_SHOT.has(this.weaponId)) this.fire();
    this.tryPlace();
    if (inp.hit('throw')) this.throwTop();
    if (inp.hit('drink')) this.drink();
    if (inp.hit('bomb')) this.placeBomb();
    if (inp.hit('polarity')) this.togglePolarity();
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
    this.updateLoop(dt);
    this.updateOmens(dt);
    this.updateCombat(dt);
    this.updateChallenges(dt);
    this.updateSpits(dt);
    this.pickups.update(dt, solid);
    this.chestViews.update(dt, this.player.keys);
    this.particles.update(dt);
    this.debrisView.update(this.debris);
    this.cutHalves.update(dt);
    this.cracks.update(this.world);
    const hand = this.player.hand;
    this.hands.update(dt, this.player.walkPhase, hand.at(-1) ?? 0, hand.at(-2) ?? 0);
  }

  requestRestart() {
    if (this.transitioning) return;
    this.restartT = RESTART_FADE;
    this.hud.fadeOut(RESTART_FADE);
    sfx3.restart();
  }

  act(act: string) {
    if (act === 'restart' && (this.player.dead || !this.input.playing || this.hud.screenOpen)) this.requestRestart();
    else if (act === 'resume' && !this.player.dead) {
      if (this.hud.screenOpen) this.hud.closeScreen(this);
      else this.input.resume();
    }
    else if (act === 'inventory' && this.hud.screenOpen) this.hud.closeScreen(this);
    else if (act === 'tab-menu') this.hud.openScreen(this, 'menu');
    else if (act === 'tab-items') this.hud.openScreen(this, 'items');
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
      held: this.player.hand.length ? this.player.hand.map(c => typeof c === 'number' ? MATERIALS[c].name : isFlask(c) ? c.potion : c.name).join(', ') : '—',
      room: r ? `${r.id} (${r.type}, ${r.template})` : '—',
    };
  }
}
