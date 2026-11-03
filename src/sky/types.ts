// The sky realm's contracts (docs/architecture/SKY.md). Every shared type of the realm lives here,
// with the constructor of every subsystem as an interface, so the packages of SKY.md §16 build in
// parallel against one shape. Changed only through the coordinator (§16.1, rule 1).

import type * as THREE from 'three';
import type { Polarity } from '../combat/polarity';
import type { Rng } from '../core/rng';
import type { DamageKind } from '../core/damage';
import type { Hazards } from '../enemies/attacks';
import type { ModelPart } from '../enemies/types';
import type { Actor, ActorRegistry } from '../entities/actors';
import type { Enemies } from '../entities/enemies';
import type { Pickups } from '../entities/pickups';
import type { Carried } from '../entities/player';
import type { GameBus, WeaponId } from '../game/events';
import type { Params } from '../i18n';
import type { MessageKey } from '../i18n/locales/en';
import type { DebrisSystem } from '../physics/debris';
import type { Body } from '../physics/voxel-collide';
import type { ChunkRenderer } from '../render/chunks';
import type { ElementSim } from '../world/elements';
import type { VoxelSpace } from '../world/space';

export interface Vec3 { x: number; y: number; z: number }
export type Pos = Readonly<Vec3>;
export type Cell = [number, number, number];
export interface Box { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number }
/** A deterministic fork of the run's randomness (`RunRandom.fork`, docs/architecture/RNG.md). */
export type Fork = (...path: (string | number)[]) => Rng;

// ───────────────────────── realms (§2) ─────────────────────────

export type RealmKind = 'dungeon' | 'sky';

/** The systems that belong to one world. Swapping them is how the game changes worlds. */
export interface RealmSet {
  kind: RealmKind;
  /** Every scene object of this world hangs here. */
  root: THREE.Group;
  world: VoxelSpace;
  chunks: ChunkRenderer;
  elements: ElementSim;
  debris: DebrisSystem;
  pickups: Pickups;
  /** The sky's is an empty instance: every `this.enemies` call stays harmless. */
  enemies: Enemies;
}
export type SkyRealmSet = RealmSet & { kind: 'sky'; world: SkyWorldApi };

export interface RealmHost {
  /** Writes the six swapped fields of the game. */
  install(set: RealmSet): void;
  current(): RealmSet;
  /** Intentions in flight, particles, blasts, hazards. */
  clearTransient(): void;
  /** Installs (sky) or removes (dungeon) the sky's bus hooks, owner tag 'sky'. */
  hooks(kind: RealmKind): void;
}
/** Returns the new stash (the set that was active). */
export type SwapRealm = (host: RealmHost, stash: RealmSet, dungeonRoot: THREE.Group, skyRoot: THREE.Group) => RealmSet;

export interface Travel { to: RealmKind; at: Cell; float: boolean }

/** The heights where a passage starts (§2.4). */
export interface SkyBounds {
  /** Dungeon world: rising past this y opens the realm (SURFACE_Y + SKY_LIMIT − 1.5). */
  top: number;
  /** Sky realm: falling below this y off the arrival deck goes down to the crown (SKY_FLOOR_OUT). */
  floorOut: number;
  /** Where each passage lands. */
  deck: Cell;
  crown: Cell;
}

export interface RealmGateHost {
  /** 0 clear → 1 black. */
  fade(k: number): void;
  /** Runs the swap and the teleport of a travel, at full black. */
  pass(t: Travel): void;
  /** False while the new world's chunks are still meshing. */
  ready(): boolean;
}
export interface RealmGateApi {
  start(t: Travel): void;
  update(dt: number): void;
  /** The game freezes the world while busy (joins `transitioning`). */
  readonly busy: boolean;
}
export interface RealmGateCtor {
  new (host: RealmGateHost): RealmGateApi;
  /** Pure: which travel, if any, the player's position asks for this frame. */
  check(realm: RealmKind, pos: Pos, pad: { up: boolean } | null, sky: SkyBounds): Travel | null;
}

// ───────────────────────── the formula world (§3) ─────────────────────────

export type Shape =
  | { k: 'box'; x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; m: number; tag?: number }
  /** A disc (r0 0), a tube, a slab with a hole. */
  | { k: 'ring'; cx: number; cz: number; r0: number; r1: number; y0: number; y1: number; m: number; tag?: number }
  /** A branch, a segment, a channel bed. */
  | { k: 'run'; ax: number; ay: number; az: number; bx: number; by: number; bz: number; w: number; h: number; m: number; tag?: number }
  /** A spiral stair or a thorn tree's steps. */
  | { k: 'helix'; cx: number; cz: number; r: number; w: number; y0: number; y1: number; rise: number; m: number }
  /** A staggered strip (the straight-up routes). */
  | { k: 'ledges'; x0: number; z0: number; axis: 'x' | 'z'; y0: number; y1: number; m: number }
  /** Clouds, leaves, meteor fragments: the surface is a fixed hash3 of the cell, nothing is drawn. */
  | { k: 'blob'; cx: number; cy: number; cz: number; rx: number; ry: number; rz: number; seed: number; m: number; tag?: number }
  /** A template element (the waterhole). */
  | { k: 'elem'; x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; byte: number };
export type ShapeKind = Shape['k'];

export interface SkyLayout {
  /** In order: the last shape that covers a cell wins (an air shape carves an opening). */
  readonly shapes: readonly Shape[];
  /** Numeric chunk key → shape ids. */
  readonly index: ReadonlyMap<number, Uint32Array>;
  /** Which platform a cell belongs to (fading, holding), 0 none. */
  tagAt(x: number, y: number, z: number): number;
}

/** Decided by who writes, never guessed from the cell (§3.4). */
export const enum ExceptionKind { Broken = 1, Replaced = 2, Placed = 3, Transient = 4, Story = 5 }

export interface SkyWorldStats {
  shapes: number;
  /** Spatial index entries. */
  index: number;
  exceptions: number;
  byKind: Record<ExceptionKind, number>;
  elemEdits: number;
  cached: number;
  bytes: number;
}

export interface SkyWorldApi extends VoxelSpace {
  readonly layout: SkyLayout;
  /** The formula alone, ignoring exceptions. */
  base(x: number, y: number, z: number): number;
  /** True only while the game places a block for the player (R2 sets it around tryPlace). */
  placing: boolean;
  kindAt(i: number): ExceptionKind | 0;
  /** Refuses placed cells (false). `until` is the host time it returns to the formula. */
  setTransient(x: number, y: number, z: number, m: number, until: number, owner: number): boolean;
  /** A permanent change the game makes (a way up opens). */
  setStory(x: number, y: number, z: number, m: number): void;
  /** Back to the formula. */
  restore(i: number): void;
  /** Returns every transient cell whose time has come (the min-heap). */
  expire(now: number): void;
  /** An original cell left its formula value: regrowth listens. */
  onBroken: ((i: number) => void) | null;
  /** Placed cells → air; returns them for the loose cubes. */
  knockTower(cells: readonly number[]): number[];
  stats(): SkyWorldStats;
  emptyChunk(cx: number, cy: number, cz: number): boolean;
}
export type SkyWorldCtor = new (layout: SkyLayout, opts?: { cacheChunks?: number }) => SkyWorldApi;

// ───────────────────────── the floor graph (§5.6) ─────────────────────────

export type PlaceKind = 'ground' | 'top' | 'ledge' | 'branch' | 'thick' | 'segment' | 'terrace' | 'bed' | 'bank' | 'paddock' | 'seat' | 'nest' | 'spawn' | 'route' | 'gate';
/** A walkable area: (x, y, z) is the cell on its walking surface nearest its centre, w × d its extent. */
export interface Place { id: number; kind: PlaceKind; x: number; y: number; z: number; w: number; d: number; tag: number }
export type Move = 'walk' | 'step' | 'jump' | 'drop' | 'climb' | 'build';
export interface Link { a: number; b: number; move: Move }
export interface FloorGraph { places: Place[]; links: Link[] }

// ───────────────────────── the sky tree and its floors (§7) ─────────────────────────

export type Animal = 'panda' | 'koala' | 'elephant' | 'lion' | 'horse';
export const ANIMALS: readonly Animal[] = ['panda', 'koala', 'elephant', 'lion', 'horse'];
export type FloorIndex = 1 | 2 | 3 | 4 | 5;

/** A platform the hindrances may act on as a whole. */
export interface PlatformTag {
  tag: number;
  /** The place it is, −1 for none. */
  place: number;
  /** Never fades and never opens: routes, nests, thick branches, hitching posts. */
  fixed: boolean;
}
/** One of the elephant's channel beds: one wide, steps of one, from its head down. */
export interface Channel { id: number; head: Cell; bed: Cell[]; nest: number }

export interface SkyFloorPlan {
  index: FloorIndex; animal: Animal; y0: number; y1: number;
  shapes: Shape[]; graph: FloorGraph;
  /** Where the deity rests (the horse: its paddocks). */
  seat: Place;
  spawns: Place[]; nests: Place[];
  /** The vertical route, bottom to top (laws 3.5, 3.9). */
  route: Place[];
  /** The way-up opening in the slab above. */
  gate: { x: number; z: number; r: number };
  platforms: PlatformTag[];
  extra?: { channels?: Channel[]; rim?: Box; mast?: Place[]; paddocks?: Place[] };
}
export interface SkyFloorGen {
  animal: Animal; index: FloorIndex;
  /** The B6 radius and height of its document. */
  radius: number; height: number;
  /** `o` is the hall's ground centre. Shapes only, integers only, no fx, no three.js. */
  generate(rng: Rng, o: Vec3): SkyFloorPlan;
}

/** One storey of the trunk: 0 the arrival deck, 1–5 the guardian floors. */
export interface SkyHall { floor: 0 | FloorIndex; y0: number; y1: number; radius: number }
export interface SkyTreePlan {
  shapes: Shape[];
  halls: readonly SkyHall[];
  /** Where the player lands from the crown. */
  deck: Place;
  door: Place;
  /** The way up over each floor, index n − 1; heartwood until `openGate(n)`. */
  gates: readonly { x: number; y: number; z: number; r: number }[];
  /** The trunk's outer radius at a height (the outside watch reads it). */
  trunkRadius(y: number): number;
}

// ───────────────────────── Totality (§8) ─────────────────────────

export type StratumId = 0 | 1 | 2;
export interface Stratum {
  id: StratumId;
  name: 'lower' | 'mid' | 'upper';
  y0: number; y1: number;
  /** The materials its platforms are made of. */
  materials: readonly number[];
  /** Platform sizes, low to high (3 → 1). */
  sizes: readonly number[];
}
export interface Hop {
  from: number; to: number;
  /** The rise and the horizontal gap, edge to edge. */
  dy: number; gap: number;
  kind: 'climb' | 'rest';
}
export interface TotalityPlan {
  strata: readonly Stratum[];
  shapes: Shape[];
  /** Bottom to top; `platforms[0]` stands on the crown. */
  platforms: Place[];
  hops: Hop[];
  /** Place ids, every sixth platform. */
  checkpoints: number[];
  /** The sealed gate of light, before the last checkpoint. */
  threshold: { x: number; y: number; z: number; r: number };
}

/** Everything SkyRealm holds about the realm's shape (§3.3, B3). */
export interface SkyPlans {
  layout: SkyLayout;
  tree: SkyTreePlan;
  floors: readonly SkyFloorPlan[];
  totality: TotalityPlan;
}

// ───────────────────────── sky creatures (§5) ─────────────────────────

/** An Actor of kind 'sky' (ActorKind gains 'sky' in C0). */
export interface SkyActor extends Omit<Actor, 'kind'> {
  readonly kind: 'sky';
  readonly role: 'deity' | 'minion';
  readonly animal: Animal;
  /** Faction 'neutral' while wild, 'self' once turned. */
  side: 'wild' | 'ally';
  /** The machine's state and its clock. */
  state: string; t: number;
  /** Positive hits landed. */
  hits: number;
  /** Left the floor (never dead). */
  parked: boolean;
}

export type Stage = 0 | 1 | 2;
/** Telegraph seconds by floor (index n − 1); no telegraph is ever shorter than MIN_TELEGRAPH. */
export const TELEGRAPH = [1.4, 1.2, 1.1, 1.0, 0.9] as const;
export const MIN_TELEGRAPH = 0.8;
/** Spirit, the outline of the hearts: special attacks drain it; at zero the player goes underground. Provisional. */
export const SPIRIT_MAX = 100;
/** Seconds a deity's capture holds the player. Provisional. */
export const CAPTURE_TIME = 3;
export type CoreState = 'Idle' | 'Watching' | 'Attacking' | 'Recovering' | 'Hurt' | 'Rallying';

/** Three channels at once (docs/art/DECISIONS.md §8.5): a named part to its extreme pose, a sound. */
export interface TelegraphSpec { tell: string; pose: string; cue: SkyCue }

export interface AttackDef {
  id: string;
  /** The first stage it is used in. */
  stage: Stage;
  telegraph: TelegraphSpec;
  /** Runs a hindrance through `ctx.hinder`, after the telegraph. */
  act(ctx: DeityCtx): void;
}

/** A state of the machine, by name. Replaces a core state of that name or extends the table. */
export interface CustomState {
  name: string;
  replaces?: CoreState;
  /** Entered once only (the koala's Asleep). */
  once?: boolean;
  enter?(ctx: DeityCtx): void;
  tick?(ctx: DeityCtx, dt: number): void;
  exit?(ctx: DeityCtx): void;
  /** The state to go to now, or null to stay. */
  next(ctx: DeityCtx): string | null;
}

/** The rest beat, Memory, facing the roar, gentling: optional hooks into the machine. */
export interface DeityRule {
  id: string;
  tick?(ctx: DeityCtx, dt: number): void;
  /** Hits one positive touch is worth (the horse's Gentled: 2), 1 when absent. */
  worth?(ctx: DeityCtx, hit: PositiveHit): number;
  /** Extra seconds before the next attack (the panda's rest beat). */
  delay?(ctx: DeityCtx): number;
  /** Where the attack aims instead of the player (the elephant's Memory). */
  aim?(ctx: DeityCtx): Vec3 | null;
  /** A factor on an attack's reach (facing the lion's roar: 0.5). */
  scale?(ctx: DeityCtx, attack: AttackDef): number;
}

/** What an ally minion does at its deity, and how much it may add. */
export interface AllyAtDeity {
  act: 'sit' | 'hug' | 'trumpet' | 'rub' | 'graze';
  /** Seconds per hit it adds. */
  every: number;
  /** The most hits allies may add on this floor. */
  cap: number;
  /** The horse's floor: allies bring calm instead of hits. */
  calm?: boolean;
}

export interface WonOutcome {
  toast: MessageKey | null;
  /** Plays the outcome of the document's section 6. */
  play(ctx: DeityCtx): void;
  /** An item id given as a pickup on the seat (the horse: 'triple-jump'). */
  gift?: string;
}

/** Named parts animate (tell, core, lids, ears, mane, trunk, legs). */
export type Parts = ReadonlyMap<string, THREE.Object3D>;

export interface DeityModel {
  body: readonly ModelPart[];
  /** About 2.2 times the body's width. */
  head: readonly ModelPart[];
  hw: number; h: number;
  /** The animal's sign of progress at hits / target. */
  progress(parts: Parts, ratio: number): void;
}
export interface MinionModel {
  parts: readonly ModelPart[];
  hw: number; h: number;
  /** The soft reaction to a positive hit, and the happy motion when it turns (ratio 1). */
  react(parts: Parts, ratio: number): void;
}

export interface DeityDef {
  animal: Animal; floor: FloorIndex;
  /** The target: 24, 30, 36, 42, 48. */
  hits: number;
  /** TELEGRAPH[floor − 1]. */
  telegraph: number;
  recover: number;
  /** By stage. */
  rest: readonly [number, number, number];
  /** Watching starts within this distance (or the document's other trigger, as a custom state). */
  sight: number;
  /** Levitation over the seat; null for the horse (it walks). */
  hover: number | null;
  teleport: boolean;
  /** True while hits do not count (koala Clinging, the elephant's rim). */
  guard?(d: SkyActor, ctx: DeityCtx): boolean;
  attacks: readonly AttackDef[];
  states?: readonly CustomState[];
  rules?: readonly DeityRule[];
  ally: AllyAtDeity;
  knock: 'nudge' | 'hug' | 'sweep' | 'paw' | 'kick';
  won: WonOutcome;
  model: DeityModel;
}

export interface DeityCtx {
  readonly host: SkyHost;
  readonly deity: SkyActor;
  readonly def: DeityDef;
  readonly plan: SkyFloorPlan;
  /** fork('sky', 'floor', n, 'creature', seq). */
  readonly rng: Rng;
  readonly stage: Stage;
  readonly minions: readonly SkyActor[];
  /** Starts a hindrance with its full telegraph; returns its run id. */
  hinder<K extends HindranceId>(id: K, p: HindranceParams[K], source?: number): number;
  go(state: string): void;
  /** Seconds the player has stood still. */
  still(): number;
  /** Horizontal distance to the player. */
  distance(): number;
  /** A place of the plan far from the player (teleport far: never within 12). */
  far(min: number): Place | null;
}

export interface Gait {
  id: string;
  /** Moves the minion toward a place this tick; true once it is there. */
  step(m: SkyActor, ctx: MinionCtx, to: Place, dt: number): boolean;
}
/** True: it acted this tick (the first rule that acts wins). */
export type MinionRule = (m: SkyActor, ctx: MinionCtx) => boolean;

export interface SpawnRule {
  where: 'clumps' | 'clusters' | 'waterhole' | 'shade' | 'gate';
  /** Seconds of warning before one appears. */
  warning: number;
  /** Seconds between spawns while below `max`. */
  every: number;
  /** Clusters spawn asleep. */
  asleep?: boolean;
}

export type AllyHelpKind = 'hold' | 'clear' | 'carry' | 'help';
export interface AllyHelp { kind: AllyHelpKind; rule: MinionRule }

export interface MinionDef {
  animal: Animal;
  /** 4/3, 6/6, 5/3, 6/4, 5/3. */
  max: number; wildMax: number;
  spawn: SpawnRule;
  /** 3, 3, 5, 4, 4. */
  hitsToTurn: number;
  gait: Gait;
  /** The B5 behaviour rules, in order. */
  rules: readonly MinionRule[];
  ally: readonly AllyHelp[];
  model: MinionModel;
}

export interface MinionCtx {
  readonly host: SkyHost;
  readonly def: MinionDef;
  readonly plan: SkyFloorPlan;
  readonly rng: Rng;
  readonly deity: SkyActor | null;
  /** The other minions of the floor. */
  readonly others: readonly SkyActor[];
  hinder<K extends HindranceId>(id: K, p: HindranceParams[K], source?: number): number;
  /** Moves with the minion's gait (or `gait`); true once at the place. */
  moveTo(m: SkyActor, to: Place, gait?: Gait): boolean;
  /** Cells no hindrance may change while `owner` holds them. */
  protect(cells: readonly number[], owner: number): void;
  release(owner: number): void;
  go(m: SkyActor, state: string): void;
}

export interface SkyCreaturesApi extends TouchProvider {
  spawnDeity(def: DeityDef, plan: SkyFloorPlan): SkyActor;
  spawnMinion(def: MinionDef, plan: SkyFloorPlan, at: Place): SkyActor;
  /** Only the creatures of the player's floor move. */
  update(dt: number, floor: number): void;
  all(): readonly SkyActor[];
  /** Fired once per deity, when it is won. */
  onWon: ((d: SkyActor, floor: FloorIndex) => void) | null;
  dispose(): void;
}
/** What the creature systems share inside the realm (composed by SkyRealm). */
export interface CreatureDeps {
  actors: ActorRegistry;
  runner: HindranceRunnerApi;
  effects: SkyEffectsApi;
  puff: PuffApi;
  knock: TowerKnockApi;
}
export type SkyCreaturesCtor = new (root: THREE.Group, host: SkyHost, deps: CreatureDeps) => SkyCreaturesApi;

export interface DeityApi {
  readonly actor: SkyActor;
  readonly def: DeityDef;
  readonly stage: Stage;
  readonly won: boolean;
  update(dt: number): void;
  touch(polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind): void;
  onWon: ((d: SkyActor) => void) | null;
}
export type DeityCtor = new (actor: SkyActor, def: DeityDef, plan: SkyFloorPlan, deps: CreatureDeps, host: SkyHost, rng: Rng) => DeityApi;

export interface MinionApi {
  readonly actor: SkyActor;
  readonly def: MinionDef;
  update(dt: number, deity: DeityApi | null, others: readonly SkyActor[]): void;
  touch(polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind): void;
}
export type MinionCtor = new (actor: SkyActor, def: MinionDef, plan: SkyFloorPlan, deps: CreatureDeps, host: SkyHost, rng: Rng) => MinionApi;

/** Law 3.3: every touch that is not positive goes out in a small puff. */
export interface PuffApi {
  at(p: Vec3): void;
  /** The first puff of a run shows `toast.skyPuff`. */
  readonly shown: boolean;
}
export type PuffCtor = new (host: SkyHost) => PuffApi;

/** §5.3, law 3.9: a deity (or the Sun's wind) takes a tower down, after its warning. */
export interface TowerKnockApi {
  start(by: SkyActor | 'sun', tower: Tower): void;
  update(dt: number): void;
  readonly busy: boolean;
}
export type TowerKnockCtor = new (host: SkyHost, effects: SkyEffectsApi) => TowerKnockApi;

export interface SkyHitMarksApi {
  /** A gold mark where a hit landed, in the creature's local frame. */
  add(local: Vec3): void;
  clear(): void;
  dispose(): void;
}
export type HitMarksCtor = new (parent: THREE.Object3D, max: number) => SkyHitMarksApi;

export interface CreatureViewApi {
  add(a: SkyActor, model: DeityModel | MinionModel): void;
  remove(id: number): void;
  parts(id: number): Parts | null;
  update(dt: number, actors: readonly SkyActor[]): void;
  dispose(): void;
}
export type CreatureViewCtor = new (root: THREE.Object3D) => CreatureViewApi;

// ───────────────────────── hindrances (§6) ─────────────────────────

export type HindranceId = 'knockback' | 'wind' | 'opening-holes' | 'fading-platforms' | 'dense-ground' | 'cube-cage' | 'water-currents' | 'paralysis';
export const HINDRANCE_IDS: readonly HindranceId[] = ['knockback', 'wind', 'opening-holes', 'fading-platforms', 'dense-ground', 'cube-cage', 'water-currents', 'paralysis'];

export interface KnockbackParams { from: Vec3; shape: 'ring' | 'line' | 'cone'; radius: number; dir?: Vec3; strength: number }
export interface WindParams { from: Vec3; to: Vec3; radius: number; strength: number; seconds: number }
/** Voxel indices of original cells. */
export interface OpeningHolesParams { cells: readonly number[]; seconds: number }
export interface FadingPlatformsParams { tags: readonly number[]; cells?: readonly number[]; seconds: number }
export interface DenseGroundParams { cells: readonly number[]; seconds: number; slow: number }
export interface CubeCageParams { around: Vec3; seconds: number }
export interface WaterCurrentsParams { channel: Channel; seconds: number; push: number }
export interface ParalysisParams { from: Vec3; speed: number; radius: number; hold: number }
export interface HindranceParams {
  'knockback': KnockbackParams;
  'wind': WindParams;
  'opening-holes': OpeningHolesParams;
  'fading-platforms': FadingPlatformsParams;
  'dense-ground': DenseGroundParams;
  'cube-cage': CubeCageParams;
  'water-currents': WaterCurrentsParams;
  'paralysis': ParalysisParams;
}

/** What the player sees and hears, for the full length. */
export interface Telegraph {
  readonly at: Vec3;
  update(dt: number, left: number): void;
  end(): void;
}
/** What it does. Pushes, slows or holds; never damages; always ends. */
export interface Effect {
  readonly at: Vec3;
  /** False once it has ended. */
  update(dt: number): boolean;
  end(): void;
}

/** A positive intention or weapon stroke that ends in the sky (seam 13 and the creature touch). */
export interface PositiveHit {
  x: number; y: number; z: number;
  /** The voxel index it hit, −1 for none. */
  cell: number;
  /** The actor it touched, −1 for none. */
  actor: number;
  weapon: WeaponId;
  /** False on a beam's repeat ticks: a beam counts once per stroke. */
  warm: boolean;
}

export interface HindranceCtx {
  readonly host: SkyHost;
  readonly effects: SkyEffectsApi;
  readonly hazards: Hazards;
  time(): number;
}

export interface Hindrance<P> {
  id: HindranceId;
  telegraph(ctx: HindranceCtx, p: P, seconds: number): Telegraph;
  effect(ctx: HindranceCtx, p: P): Effect;
  /** A positive intention at the right place: true when it answered. */
  answer?(ctx: HindranceCtx, e: Effect | Telegraph, hit: PositiveHit): boolean;
}

export interface ActiveHindrance { run: number; id: HindranceId; source: number; phase: 'telegraph' | 'effect'; left: number }

export interface HindranceRunnerApi {
  /** Telegraph first, always (law 3.6); never shorter than MIN_TELEGRAPH. Returns the run id. */
  start<P>(h: Hindrance<P>, p: P, telegraph: number, source: number): number;
  update(dt: number): void;
  /** Offered every positive intention that ends in the sky. */
  positiveHit(hit: PositiveHit): boolean;
  active(): readonly ActiveHindrance[];
  stop(run: number): void;
  clear(): void;
}
export type HindranceRunnerCtor = new (ctx: HindranceCtx) => HindranceRunnerApi;

/** The only way an effect touches the world and the player: never a placed block, never a
 *  protected cell, never a drop without its warning, never damage, and everything ends. */
export interface SkyEffectsApi {
  push(vx: number, vy: number, vz: number): void;
  slow(f: number, s: number): void;
  hold(s: number): void;
  /** A solid block between the two points (shelter from a push or a gust). */
  shelter(from: Vec3, to: Vec3): boolean;
  /** Not placed and not protected. */
  mayChange(i: number): boolean;
  /** Transient swap of the cells it may change; returns the ones changed. */
  transient(cells: readonly number[], m: number, seconds: number, owner: number): number[];
  /** Ends the owner's transient cells now. */
  restore(owner: number): void;
  protect(cells: readonly number[], owner: number): void;
  release(owner: number): void;
  isProtected(i: number): boolean;
  /** Timed source water the owner holds and removes itself; returns the cells it filled. */
  water(cells: readonly number[], owner: number): number[];
  dry(owner: number): void;
  update(dt: number): void;
}
export type SkyEffectsCtor = new (host: SkyHost) => SkyEffectsApi;

// ───────────────────────── laws (§4) ─────────────────────────

/** A player standing on a placed cell 3 or more above the formula ground (law 3.9). */
export interface Tower {
  /** Placed cells under the player, top down. */
  cells: number[];
  /** Feet above the formula ground under the column. */
  height: number;
  /** The feet's cell. */
  at: Cell;
}
export type TowerUnder = (world: SkyWorldApi, body: Body) => Tower | null;

export type CellTest = (x: number, y: number, z: number) => boolean;

export interface RegrowthApi {
  update(dt: number): void;
  /** Cells waiting to return. */
  readonly pending: number;
  dispose(): void;
}
/** `occupied`: a player, sky creature or loose cube stands in the cell. */
export type RegrowthCtor = new (world: SkyWorldApi, host: SkyHost, occupied: CellTest) => RegrowthApi;

export interface OwnershipApi {
  /** The blockDamage hook that protects placed cells, owner 'sky'. */
  install(bus: GameBus): void;
  /** Law 3.2: a positive hit on a placed cell removes it for good. True when it did. */
  positiveHit(hit: PositiveHit): boolean;
}
export type OwnershipCtor = new (world: SkyWorldApi, host: SkyHost) => OwnershipApi;

/** The actorDamage hook that cancels every damage to the player, owner 'sky'. */
export type InstallNoHarm = (bus: GameBus) => void;

export interface NestsApi {
  update(dt: number): void;
  /** Loose cubes in the nest now. */
  count(place: number): number;
  dispose(): void;
}
export type NestsCtor = new (host: SkyHost, places: readonly Place[], material: number) => NestsApi;

export interface UpdraftApi {
  update(dt: number): void;
  readonly checkpoint: Place | null;
  readonly carrying: boolean;
}
export type UpdraftCtor = new (host: SkyHost, checkpoints: readonly Place[]) => UpdraftApi;

export interface OutsideWatchApi { update(dt: number): void }
/** `knock` asks the guardian of the floor at that height to take the tower down. */
export type OutsideWatchCtor = new (host: SkyHost, tree: SkyTreePlan, knock: (tower: Tower, floor: FloorIndex) => void) => OutsideWatchApi;

// ───────────────────────── the realm's systems ─────────────────────────

export type SkyPlace = 'deck' | 'hall' | 'void' | 'totality';

export interface AtmosphereSample {
  fog: number; clear: number;
  near: number; far: number;
  /** 0 → 1. */
  stars: number;
}

export interface ThresholdApi { update(dt: number): void; readonly touched: boolean }
export type ThresholdCtor = new (host: SkyHost, plan: TotalityPlan) => ThresholdApi;

export interface SkyViewApi { update(eye: Vec3, dt: number): void; dispose(): void }
export type SkyViewCtor = new (root: THREE.Object3D) => SkyViewApi;

/** The game builds the sky's set on the layout (SkyWorld, its renderer, elements, debris, pickups, an empty Enemies). */
export type SkySetFactory = (layout: SkyLayout) => SkyRealmSet;

export interface SkyRealmApi {
  readonly set: SkyRealmSet;
  readonly plans: SkyPlans;
  /** The gate check, regrowth, nests, the tower and outside watch, hindrances, creatures, the updraft, the place label. */
  update(dt: number): void;
  stream(eye: Vec3): void;
  atmosphere(eye: Vec3, fogColor: THREE.Color, fog: THREE.Fog, stars: THREE.Object3D): void;
  /** Installs the laws' hooks, owner 'sky' (removed by `bus.off(null, 'sky')`). */
  install(bus: GameBus): void;
  /** A cell to stand in near `at`. */
  placeAt(at: Cell): Cell;
  /** Seam 13: true when the sky took the positive hit on a block. */
  positiveHitsBlock(hit: PositiveHit): boolean;
  /** 0 the deck, 1–5 a guardian floor, 6 Totality. */
  floorAt(y: number): number;
  readonly creatures: SkyCreaturesApi | null;
  dispose(): void;
}
export interface SkyRealmCtor { create(host: SkyHost, root: THREE.Group, makeSet: SkySetFactory): SkyRealmApi }

// ───────────────────────── the host (§5.2) ─────────────────────────

export type SkyFx = 'puff' | 'shimmer' | 'hit' | 'gold' | 'motes' | 'updraft' | 'gate' | 'pop' | 'bounce';

export type CoreCue = 'puff' | 'shimmer' | 'regrow' | 'hit' | 'gate' | 'updraft' | 'pop' | 'gold' | 'grumble';
export type TotalityCue = 'hum' | 'refuse';
export type EntityCue = 'drone' | 'tink' | 'chord';
/** An animal's part names its own sounds, one per telegraph of its document. */
export type SkyCue = `core.${CoreCue}` | `${Animal}.${string}` | `totality.${TotalityCue}` | `entity.${EntityCue}`;
export type SkyAudioPartName = 'core' | Animal | 'totality' | 'entity';
export interface SkySoundPart {
  /** `name` is the cue after its part's prefix. */
  play(name: string, x: number, y: number, z: number): void;
  ambience?(place: SkyPlace, dt: number): void;
}

export interface SkyPlayer {
  body: Body; eye: Vec3; aim: Vec3; hand: readonly Carried[];
  push(vx: number, vy: number, vz: number): void;
  slow(f: number, s: number): void;
  hold(s: number): void;
  carry(to: Vec3, s: number): void;
}

/** A practice's id (ItemDef.id). */
export type ItemId = string;

/** The only door from src/sky/ into the game. Health is never taken in the sky (owner, 2026-11-03). */
export interface SkyHost {
  time(): number;
  player(): SkyPlayer;
  world(): SkyWorldApi;
  debris(): DebrisSystem;
  hazards(): Hazards;
  fork(...path: (string | number)[]): Rng;
  /** Puff, shimmer, hit mark, telegraph motes. */
  fx(kind: SkyFx, x: number, y: number, z: number, n?: number): void;
  cue(kind: SkyCue, x: number, y: number, z: number): void;
  toast(key: MessageKey, params?: Params): void;
  card(name: MessageKey, lines: readonly MessageKey[]): void;
  /** The boss bar shows a deity's hits in gold. */
  bar(b: { name: MessageKey; ratio: number } | null): void;
  /** The HUD's place label. */
  place(key: MessageKey): void;
  /** A pickup in the sky's Pickups. */
  gift(itemId: string, x: number, y: number, z: number): void;
  travel(t: Travel): void;
  /** Special attacks drain spirit, never health. */
  drainSpirit(amount: number): void;
  spirit(): number;
  /** A capture takes one practice the player holds, at random, for the rest of the run. */
  takeRandomPractice(): ItemId | null;
  /** Spirit at zero: the game picks one floor of `floors` with `rng`, sends the player there and refills spirit to SPIRIT_MAX. */
  sendUnderground(floors: readonly number[], rng: Rng): void;
}

// ───────────────────────── touch routing (§5.7) ─────────────────────────

export interface TouchTarget { id: number; x: number; y: number; z: number; hw: number; h: number }
export interface TouchProvider {
  owns(id: number): boolean;
  /** −1 none. */
  at(x: number, y: number, z: number, r: number): number;
  targets(): readonly TouchTarget[];
  touch(id: number, polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind): void;
}

// ───────────────────────── the endgame (§10.1) ─────────────────────────

export interface EncounterHost {
  card(name: MessageKey, lines: readonly MessageKey[]): void;
  rumble(seconds: number): void;
  toast(key: MessageKey): void;
  openStairs(): void;
  saveMeta(): void;
  holdStill(on: boolean): void;
}
export interface EncounterApi {
  update(dt: number, player: Pos, entity: Pos): void;
  /** The card was dismissed. */
  dismiss(): void;
  /** From the turn until the staircase's first flight. */
  readonly holdsStill: boolean;
  readonly met: boolean;
}
export type EncounterCtor = new (host: EncounterHost) => EncounterApi;

export interface EntityHost {
  /** The bounce: a tink, cold motes, a shimmer on the spikes. */
  bounce(x: number, y: number, z: number): void;
}
export interface SpikedEntityApi extends TouchProvider {
  readonly id: number;
  readonly body: Body;
  /** Radians; it turns toward the player at the revelation. */
  facing: number;
}
export type SpikedEntityCtor = new (id: number, at: Vec3, host: EntityHost) => SpikedEntityApi;

export interface EntityViewApi { sync(e: SpikedEntityApi, dt: number): void; shimmer(): void; dispose(): void }
export type EntityViewCtor = new (root: THREE.Object3D) => EntityViewApi;
