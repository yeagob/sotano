// The game loop: ties together the stacked dungeon, player, intentions, loose cubes, bombs,
// doors, pickups, projections (enemies), items and rendering. Rule of thumb for this file:
// anything an item might want to change reads a stat or emits an event (docs/architecture/ITEMS.md §3).

import * as THREE from 'three';
import { easeMaster, setMasterTarget, sfx, sfx2, sfx3, spatial, unlockAudio } from '../audio/sfx';
import { BlastQueue } from '../combat/blasts';
import { allyHeal, convertedHp, intentDamage, meetsIntention, relapseHp, resolveHit, type Polarity } from '../combat/polarity';
import { intentFromStats, Intents } from '../combat/intents';
import { createWeapon, type Weapon, type WeaponHost } from '../combat/weapons';
import { Missiles, MISSILE_RANGE, MISSILE_SPEED, muzzleBlocked } from '../combat/missiles';
import { TouchRouter } from '../combat/touch-router';
import { ENEMY_BUDGET, ENEMY_BY_ID, pickWave, waveBudget } from '../content/enemies';
import { BOSS_BY_ID, bossFor, bossHp } from '../content/bosses';
import { enemyText, materialName, partText } from '../i18n/content';
import {gatherMoteColor, gatherMotesDue, OMEN_BREACH, OMEN_BREACH_COLOR, OMEN_GATHER, pickSpawnCell, SLAM_SHAKE, slamMotesPerDoor, spawnBlocked, splitWaves,
  type Cell, type Omen, waveDue } from './omens';
import { ITEM_BY_ID, ITEMS } from '../content/items';
import { AIR, MAT, mat, MATERIALS } from '../content/materials';
import {
  DEFAULT_AFFINITY, ELEMENTS, EL_FIRE, EL_LAVA, EL_WATER, elemDef, elemKind, elemLevel, fluidHeight, isFalling, type ElementDef, type ElementKey,
} from '../content/elements';
import { ROOM_H, ROOM_TEMPLATES } from '../content/rooms';
import { rollParts } from '../content/parts';
import { carriedDef, flaskRooms, isFlask, POTIONS, type PotionId } from '../content/potions';
import { heartTollPlan, tollIndex } from './toll';
import { defaultMeta, noStore, type LoadedMeta, type MetaStore } from './meta';
import { debugRootsPage, openRoots, roomKeyOf, type RootsKeeper, type WallSink } from './roots-keeper';
import { mastery as achievedMastery, type Payload } from './achievements';
import { AchievementKeeper, cardKeys, noticeMillis, sittingPayload, tollMayOpen, type AchievementNotice } from './achievement-keeper';
import { HeightWatch } from './height-watch';
import { drawRootsItems, drawRootsPractice, redrawRootsSite, rootsFork, rootsSites, type RootsSite } from './roots-draws';
import { offerPedestal, rollChestContents } from './chest-draws';
import { STILLNESS_TAG } from '../content/bosses/shadow';
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
import { Pickups, PICKUP_GRAVITY, type Pickup } from '../entities/pickups';
import { Chests, OPEN_TIME, type ChestView } from '../entities/chests';
import { ejectAngle, throwReach, type Ground } from '../entities/eject';
import { Alembics } from '../entities/alembics';
import { Kitchens } from '../entities/kitchens';
import { COOKS, cook as kitchenCook, mealOf, newKitchen, type Kitchen } from './kitchen';
import { EYE, Player, type Carried, type PlayerMedium } from '../entities/player';
import { Input, activeDevice, onDeviceChange } from '../input/input';
import { DOUBLE_TAP_MS } from '../input/bindings';
import { PolarityHint } from './polarity-hint';
import { controlParams } from '../input/labels';
import { TouchControls } from '../input/touch';
import { FullscreenButton } from '../input/fullscreen-button';
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
import { LOVE_BLAST, MISSILE_TRAIL, MissileView } from '../render/missile-view';
import { Hands } from '../render/hands';
import { Particles } from '../render/particles';
import { currentVoice, panelImages, Tablets } from '../render/tablets';
import { PageStone } from '../render/page-stone';
import { loadBook } from '../content/book';
import { onLocaleChange, t, type MessageKey } from '../i18n';
import {
  BAND, bandOf, carveFloor, cellOf, createDungeonWorld, inRoomSpace, depthOf, DOOR_FRAME, FIRST_FLOOR, floorY, LAST_FLOOR, openHole, pedestalSlots, planDungeon, ROOM_ID_STRIDE, SKY_LIMIT, SURFACE, SURFACE_Y,
  type DungeonPlan,
  type ChestSpec, type FloorResult, type RoomInfo,
} from '../world/floor';
import type { VoxelSpace } from '../world/space';
import { CHUNK, type VoxelWorld } from '../world/world';
import { ElementSim } from '../world/elements';
import { GiantTree, TREE_STORIES, TREE_ZONES } from '../world/tree';
import { ambientCreatures, CREATURE_BY_ID } from '../content/creatures';
import { ROOTED_HP, rootedChance } from '../content/rooted';
import { PRESENCE_BY_ID, PRESENCE_TALK, leavesAfterOffer, presenceReaction, pushedOut, TALK_REACH, findPresenceOffer, answerDue, unlocksPresence, type PresenceId } from '../content/presences';
import { rewardBand, type Outcome, type SequenceId } from '../content/presences/meditations';
import { clampLevel, CRATE_CHANCE_CAP, rootsRewards } from '../content/tables/roots-mastery';
import boundaryDef, { SANCTUARY_RADIUS } from '../content/presences/boundary';
import { crateChanceInBand, floorCrateChance, rollCrate } from '../content/tables/crates';
import { floorHeartChances, heartChancesOnBand, rollHeart } from '../content/tables/hearts';
import { claimCreatureGrowthGift, rollCreatureGrowthHeart, rollListenerGift } from '../content/tables/heart-gifts';
import { HEART_FX, type HeartKind } from '../content/heart-art';
import { GROWTH_MAX, growsUnder } from '../entities/growth';
import { BERSERK_DAMAGE, BERSERK_JUMP, BERSERK_RANGE, BERSERK_SPEED, BLOOD_BUDGET, BLOOD_SECONDS, BLOOD_SLOT_SOURCE, berserk, hasHeartRoom, isLayer, landHit, STAR_SECONDS, tickBlood, type LayerKind } from '../entities/hearts';
import { setEcho, sfxHeart, starTheme } from '../audio/sfx';
import { applyFov, FOV_DEFAULT, loadSettings, saveSettings, stepFov } from './settings';
import { ActorRegistry, ContactGate, HALF_HEART, HEART, QUARTER_HEART, hostile, type Actor, type Faction } from '../entities/actors';
import { createBus, WEAPONS_KEEPING_SHOT, type Cause, type GameBus, type IntentSpec, type Owner, type PickupKind, type WeaponId } from './events';
import { attachDevlog, carriedName, cell, devlog } from '../debug/devlog';
import { Hud } from './hud';
import { carveSandbox, carriedFromId, type SandboxRoom, type Scenario } from '../sandbox/scenario';
import { playSkyCue } from '../audio/sky';
import { swapRealm } from '../sky/realm';
import { RealmGate, SKY_FLOOR_OUT } from '../sky/gate';
import { SkyRealm } from '../sky/sky-realm';
import { SPIRIT_MAX, type Cell as SkyCell, type RealmGateHost, type RealmHost, type RealmKind, type RealmSet, type SkyBounds, type SkyHost, type SkyLayout, type SkyPlayer, type SkyRealmSet, type SkyFx, type SkyWorldApi, type Travel } from '../sky/types';
import { SkyWorld } from '../sky/world/sky-world';
import type { Rng } from '../core/rng';

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
/** Above this height the dungeon's sky opens into the sky realm (docs/architecture/SKY.md §2.4). */
const SKY_TOP = SURFACE_Y + SKY_LIMIT - 1.5;
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

/** The save record and the store it is written through (main.ts gives the browser's; the sandbox and the tests give none). */
export interface GameSave { readonly meta: LoadedMeta; readonly store: MetaStore }

interface BossRoom { room: number; wake: number; spawned: boolean; defeated: boolean; t: number; open: boolean; warned: boolean; dust: number; asked: boolean }

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(FOV_DEFAULT, 1, 0.05, 200);
  private fovNow = FOV_DEFAULT;
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
  /** The active world (docs/architecture/SKY.md §2.1): the dungeon's for now, the sky's once realms swap. */
  world!: VoxelSpace;
  /** Always the dungeon's world [M10]: every dungeon-only caller takes it, so none can be handed the sky. */
  dw!: VoxelWorld;
  /** The world the player is in (docs/architecture/SKY.md §2.1). Below the crown it is the dungeon. */
  private realm: RealmKind = 'dungeon';
  /** The inactive world's set: the dungeon's while in the sky, the sky's below. Null until the sky is first reached. */
  private stash: RealmSet | null = null;
  private sky: SkyRealm | null = null;
  /** Every non-projection actor an intention, stroke or blast can reach (SKY.md §5.7): the sky's creatures while the sky is active. */
  private readonly router = new TouchRouter();
  private readonly dungeonRoot = new THREE.Group();
  private readonly skyRoot = new THREE.Group();
  private gate!: RealmGate;
  /** The sky's spirit (SkyHost.spirit): special attacks drain it; at zero the player goes underground. */
  private spirit = SPIRIT_MAX;
  /** Captures so far in this run: the seed path of each practice taken. */
  private captures = 0;
  /** The floor the next passage down lands on (SkyHost.sendUnderground), carved when the passage runs. */
  private underground: number | null = null;
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
  private pendingPresenceOffer: { id: PresenceId; enemyId: number; index: number; carried: Carried } | null = null;

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
  /** The sky's spirit, and whether the player is in the sky: the HUD's outline shows only there (SKY.md §5.2). */
  get spiritNow() { return this.spirit; }
  get inSky() { return this.realm === 'sky'; }
  /** The stroke in progress (a swing, a beam or a great cut): its polarity, and the targets it has
   *  already warmed, so a beam warms a projection once, not on every tick. */
  private stroke: { polarity: Polarity; warmed: Set<number>; intent: IntentSpec | null; weapon: WeaponId } = { polarity: 'positive', warmed: new Set(), intent: null, weapon: 'intent' };
  /** Bombs set off by a blast carry its chain to their own explosion. */
  private bombCause = new Map<number, Cause>();
  /** Bombs in flight, launched by a double tap with the `missile` stat (Dr. Launcher). */
  private missiles = new Missiles();
  private missileView: MissileView;
  /** Game time of the last press of the fire control, for the double tap. */
  private lastCastTap = -Infinity;
  /** The double-tap hint has been shown this run. */
  private missileHinted = false;
  private fpsAcc = 0; private fpsN = 0; fps = 0;
  /** The weapon replacing the intention, if any (docs/architecture/WEAPONS.md). */
  private weapon: Weapon | null = null;
  private weaponId: WeaponId = 'intent';
  private weaponHost: WeaponHost;
  private strikeDebris = 0;
  /** Seconds the player has been pressing against blocks since the last contact tick. */
  private contactT = 0;
  private polarityHint = new PolarityHint();
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
  /** The Roots' wall panels (tablets.ts), and the page stone of the start room (page-stone.ts). */
  private tablets!: Tablets;
  private pageStone!: PageStone;
  /** The save record (meta.ts). It is written through `metaStore` when a run advances the Roots' page; achievements (D2) save the same way. */
  private readonly meta: LoadedMeta;
  private readonly metaStore: MetaStore;
  /** The achievements of the session (achievement-keeper.ts): they track on the run's bus, and their cards queue here. */
  private readonly keeper: AchievementKeeper;
  /** Warns once a run when the player's height is not a finite number (height-watch.ts). */
  private readonly heightWatch = new HeightWatch();
  /** The Roots' mastery level this run started with (REWARDS §6): read once at run start, never during the run. */
  private runMastery = 0;
  /** Debug (S.mastery): the level the next runs start with, in memory only. Null reads the save. */
  private debugMastery: number | null = null;
  /** Floor 0's Roots pedestals (extra practices and the altar): each site, the item it shows and its pickup (roots-draws.ts). */
  private rootsSpots: { site: RootsSite; item: string | null; again: number; pickup: Pickup | null }[] = [];
  /** Every item the Roots drew this run (pedestals, chests, the Sanctuary): the Roots never offer one of them twice. */
  private rootsDrawn = new Set<string>();
  /** The Sanctuary sittings' draws of each Roots chest, one fork per chest, kept across a "not now" (roots-draws.ts). */
  private rootsGuards = new Map<string, Rng>();
  /** How many floor-0 hearts had their kind rolled this run: each roll takes its own fork (`rootsFork(…'heart', n)`). */
  private rootsHearts = 0;
  /** Debug (S.roots): the page the next runs start on, in memory only; null reads the save (roots-keeper.ts `startPage`). */
  private debugRootsPage: number | null = null;
  /** The Roots' walls of this run (roots-keeper.ts); undefined in the sandbox. */
  private roots: RootsKeeper | undefined;
  /** Each Roots room's box and the view frustum: the walls turn only out of sight (PAGES §3). */
  private rootsBoxes = new Map<string, THREE.Box3>();
  private readonly frustum = new THREE.Frustum();
  private readonly frustumM = new THREE.Matrix4();
  /** The shown page's pictures are loading: the run's start fade waits for them (PANELS §8). */
  private wallsLoading = false;
  private wallsToken = 0;
  /** The page stone's block (x, y, z) and whether it was broken this run: the stone goes until the next run (PAGES §4). */
  private stoneBlock: [number, number, number] | undefined;
  private stoneGone = false;
  private readonly walls: WallSink = {
    show: (room, side, panel, page) => this.tablets.show(room, side, panel, page),
    stone: page => this.setStone(page),
  };
  /** Fire, water and lava (docs/architecture/ELEMENTS.md §9). */
  elements!: ElementSim;
  private elemFx = 0;
  private elemSfx = 0;
  private drownT = 0;
  /** Elements the player's body was in last frame (for elementEnter / elementLeave). */
  private playerIn = new Set<ElementKey>();
  private playerMedium: PlayerMedium = { feet: null, head: null };

  /** `save`: the record and its store (main.ts). Without it the game plays on a fresh record in memory that is never written. */
  constructor(canvas: HTMLCanvasElement, seed?: string, save?: GameSave) {
    this.meta = save?.meta ?? defaultMeta();
    this.metaStore = save?.store ?? noStore;
    this.keeper = new AchievementKeeper(this.meta, this.metaStore);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.autoClear = false;
    this.input = new Input(canvas);
    this.touch = new TouchControls(this.input);
    // the phone's way back to fullscreen after it was left (#161); its failures use the shared toast
    new FullscreenButton(this.input, key => this.hud.toast(key));
    this.hands = new Hands(1);
    this.scene.fog = new THREE.Fog(DUNGEON_FOG, 6, 34);
    // each world's scene objects hang under its own group; only the active one is visible (SKY.md §2.3)
    this.scene.add(this.dungeonRoot, this.skyRoot);
    this.skyRoot.visible = false;
    this.gate = new RealmGate(this.realmGateHost());
    this.scene.add(new THREE.HemisphereLight(pal('light.core'), pal('rock.f1.outline'), 2.0));
    const sun = new THREE.DirectionalLight(pal('sky.albedo'), 1.0);
    sun.position.set(0.4, 1, 0.3);
    this.scene.add(sun);
    this.particles = new Particles(this.scene, 900);
    this.stars = makeStars();
    this.scene.add(this.stars);
    this.debrisView = new DebrisView(this.scene, this.atlas, MAX_CUBES);
    this.missileView = new MissileView(this.scene);
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
      enemyAt: (x, y, z, r, polarity) => {
        const routed = this.router.at(x, y, z, r);
        return routed >= 0 ? routed : this.enemies.at(x, y, z, r, e => this.meets(e, polarity));
      },
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
    this.hud.onFov = fov => this.setFov(fov);
    this.fovNow = applyFov(this.camera, loadSettings().fov);
    this.hud.setFov(this.fovNow);
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
    this.endRoots();
    this.leaveSky();
    this.spirit = SPIRIT_MAX; this.captures = 0; this.underground = null;
    this.sandbox = sandbox;
    // the sandbox and the lab unlock nothing and write nothing (ACHIEVEMENTS §2); their Roots are level 0
    this.keeper.live = sandbox === null;
    this.heightWatch.reset();
    this.runMastery = sandbox ? 0 : clampLevel(this.debugMastery ?? achievedMastery(this.meta));
    seedFx(sandbox ? root : null);
    this.seed = root;
    this.seedCode = encodeSeed(root);
    this.rng = new RunRandom(root);
    this.hud.setSeed(this.seedLabel);
    this.polarity = 'positive';
    this.polarityHint.reset();
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
    this.tablets = new Tablets(this.dungeonRoot);
    this.pageStone?.dispose();
    this.pageStone = new PageStone(this.dungeonRoot);
    this.stoneGone = false; this.stoneBlock = undefined;
    // the walls exist before floor 0 is carved: the page the run starts on decides its layout (EASY-LAYOUT §7)
    this.roots = openRoots(sandbox !== null, {
      record: this.meta,
      store: this.metaStore,
      book: () => loadBook(currentVoice().lang),
      images: panelImages,
      inView: room => this.rootsInView(room),
      startPage: this.debugRootsPage ?? undefined,
    });
    this.dw = createDungeonWorld(this.rng, this.dungeon);
    this.world = this.dw;
    const box = sandbox ? carveSandbox(this.dw, this.rng, sandbox) : null;
    // the giant tree grows once per run above the surface, from its own fork (docs/architecture/RNG.md)
    this.tree = new GiantTree(this.dw, SURFACE_Y, i => this.rng.fork('tree', i));
    this.story = NaN; this.silenceSeen = false; this.stillT = 0; this.padLock = -1; this.zone = ''; this.presenceReplies.clear();
    this.pendingPresenceOffer = null;
    this.input.modal = false;
    setMasterTarget(0.35);
    this.elements = this.elementSim(this.world, this.rng.fork('elements').u32());
    this.playerIn.clear(); this.drownT = 0;
    this.chunks = new ChunkRenderer(this.world, this.dungeonRoot, this.atlas, 48);
    this.debris = this.newDebris();
    this.blasts.clear(); this.bombCause.clear();
    this.missiles.clear(); this.lastCastTap = -Infinity; this.missileHinted = false;
    this.doors = new Doors(this.dungeonRoot);
    this.pickups = new Pickups(this.dungeonRoot);
    // a random heart's kind reads the chances of its band: floor 0 halves the star heart, the surface keeps its numbers (REWARDS §3)
    // a heart's kind on floor 0 takes its own fork, so the Roots' crates never move the hearts stream the floors below read
    this.pickups.heartKind = y => rollHeart(
      bandOf(y) === FIRST_FLOOR ? rootsFork(this.rng, 'heart', this.rootsHearts++) : this.rng.stream('hearts'),
      heartChancesOnBand(bandOf(y), floorHeartChances(this.rng, depthOf(y))), Math.max(0, depthOf(y)),
    );
    this.chestViews = new Chests(this.dungeonRoot);
    this.alembicViews = new Alembics(this.dungeonRoot);
    this.kitchenViews = new Kitchens(this.dungeonRoot);
    this.enemies = new Enemies(this.dungeonRoot, this.enemyHost());
    this.potions.clear();
    this.floors.clear(); this.labs.clear(); this.kitchens.clear(); this.rooms.clear(); this.activated.clear(); this.roomState.clear(); this.challenges.clear(); this.omens = []; this.spawnSeq.clear(); this.projectionSeq.clear(); this.bossRooms.clear(); this.bossUsed.clear(); this.chests = []; this.spits = [];
    this.bus = createBus();
    attachDevlog(this.bus);
    this.listenAchievements();
    this.inventory.restore([]);
    this.stats.removeSource('toll');
    this.syncWeapon();
    const p = this.player;
    p.hand = []; p.keys = 0; p.bombs = 1; p.layers = []; p.starT = 0; p.blood = null; this.setBerserk(false); this.stats.removeSource(BLOOD_SLOT_SOURCE); p.hp = this.maxHp; p.dead = false; p.invulnT = 0; p.breath = this.stats.get('breath');
    p.clearStates();
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
    // the Roots' practices are drawn now, after every pedestal of every floor has been reserved (REWARDS §4); they never
    // mark an item taken (roots-draws.ts)
    const roots0 = this.floors.get(FIRST_FLOOR);
    this.rootsDrawn = new Set();
    this.rootsGuards.clear();
    this.rootsHearts = 0;
    const rootsItems = roots0 ? drawRootsItems(this.pools, this.rng, roots0, this.runMastery, this.rootsDrawn) : new Map<string, string>();
    this.rootsSpots = roots0 ? rootsSites(roots0, this.runMastery).map(site => ({ site, item: rootsItems.get(site.key) ?? null, again: 0, pickup: null })) : [];
    this.activate(k);
    this.carve(FIRST_FLOOR + 1);
    p.spawnAt(...this.floors.get(k)!.spawn);
    p.yaw = 0; p.pitch = 0;
    this.stream();
    this.depth = this.maxDepth = this.groundBand = k;
    this.room = -1;
    this.visited = new Set();
    this.hud.hideDeath();
    this.hud.closePresenceOffer();
    this.hud.dismissBanner();
    this.hud.setItems(this.inventory.items.map(i => i.def));
    this.hud.setFloor(this.floors.get(k)!, k);
    this.bus.emit('floorEnter', { depth: k });
    if (this.roots) this.hangRoots(this.roots);
    if (box && sandbox) this.furnish(box, sandbox);
  }

  /** The sandbox room's contents: practices (quietly, no banners), hand, keys, counters and projections. */
  private furnish(box: SandboxRoom, s: Scenario) {
    for (const id of s.items ?? []) this.grant(id);
    const p = this.player;
    p.hand = (s.hand ?? []).map(carriedFromId);
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
    this.reofferRoots(id);
    this.bus.emit('itemGained', { id, uid: r.instance.uid });
    this.clampHealth();
    this.hud.setItems(this.inventory.items.map(i => i.def));
    return true;
  }

  /** A projection (or a creature) at a world position in the sandbox room, out at once (no omen). */
  sandboxSpawn(defId: string, x: number, y: number, z: number, faction?: Faction) {
    const r = this.rooms.get(this.floors.get(this.depth)?.rooms[0]?.id ?? -1);
    if (!r) return null;
    // the Boundary as a vault places it (updateBoundaries reads its tag), without the Sanctuary's ring: a sandbox has no chest
    if (defId === boundaryDef.id) {
      const e = this.enemies.spawn(boundaryDef, this.actors.newId(), r.id, x, y, z, boundaryDef.hp, boundaryDef.speed, 0, new Set(['boundary']));
      e.faction = 'neutral';
      e.spawning = 0;
      this.actors.add(e);
      return e;
    }
    const presence = PRESENCE_BY_ID.get(defId);
    if (presence) {
      const e = this.enemies.spawn(presence, this.actors.newId(), r.id, x, y, z, presence.hp, presence.speed, 0, new Set(['presence']));
      e.faction = 'neutral';
      e.spawning = 0;
      this.actors.add(e);
      return e;
    }
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
    // the boss is drawn first: its room is large unless it asks for a small one (issue #131)
    const boss = bossFor(k, this.rng.fork('floor', k, 'boss'), this.bossUsed);
    const f = carveFloor(this.dw, this.rng, k, this.dungeon.plans[k], {
      templates: ROOM_TEMPLATES,
      pedestalItem: room => this.pools.reservedFor(String(room)) ?? null,
      enemies: ENEMY_BUDGET,
      bossSmallRoom: !!(boss && BOSS_BY_ID.get(boss)?.smallRoom),
      // the Roots' layout, read once at run start (EASY-LAYOUT §7); only floor 0 reads it
      easyRoots: k === FIRST_FLOOR && (this.roots?.easyRoots ?? false),
      // the Roots' mastery level, read once at run start (REWARDS §4-§6); only floor 0 reads it
      mastery: this.runMastery,
    });
    f.boss = boss;
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

  /**
   * The Roots' walls of this run: each room's box for the out-of-sight guard, the mounts of the run's layout, the page
   * stone and the shown page's panels. The start fade waits for the shown page's pictures (PANELS §8).
   */
  private hangRoots(keeper: RootsKeeper) {
    const floor = this.floors.get(FIRST_FLOOR);
    if (!floor) return;
    this.rootsBoxes.clear();
    for (const r of floor.rooms) {
      const key = roomKeyOf(r);
      this.tablets.mountRoom(key, r.hx, r.y0, r.hz, keeper.variant);
      this.rootsBoxes.set(key, new THREE.Box3(
        new THREE.Vector3(r.x0 - 1, r.y0 - 1, r.z0 - 1),
        new THREE.Vector3(r.x0 + r.w + 1, r.y0 + r.height + 1, r.z0 + r.d + 1),
      ));
      if (key === keeper.start) {
        this.pageStone.mount(r.hx, r.y0, r.hz);
        // the wall block behind the stone: the stone is its face (pageStoneMount sits 0.015 in front of z0)
        this.stoneBlock = [r.hx + 6, r.y0 + 2, r.hz - 1];
      }
    }
    const token = ++this.wallsToken;
    this.wallsLoading = true;
    void keeper.preload().then(() => { if (token === this.wallsToken) this.wallsLoading = false; });
    keeper.update(this.walls);
  }

  /** Each frame: the view frustum for the out-of-sight guard, the rooms' panels and the stone where the book turns them. */
  private updateRoots() {
    const keeper = this.roots;
    if (!keeper) return;
    this.camera.updateMatrixWorld();
    this.frustumM.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.frustumM);
    keeper.update(this.walls);
    const b = this.stoneBlock;
    if (b && !this.stoneGone && !this.solid(b[0], b[1], b[2])) {
      this.stoneGone = true;
      this.pageStone.hide();
    }
  }

  private rootsInView(room: string): boolean {
    const box = this.rootsBoxes.get(room);
    return box !== undefined && this.frustum.intersectsBox(box);
  }

  private setStone(page: number | null) {
    if (this.stoneGone) return;
    if (page === null) this.pageStone.hide();
    else this.pageStone.show(page, 'book');
  }

  /**
   * A run ends (death, R, a new run, a new seed; PAGES §1): the Roots' page advances at most once per run. When it does,
   * the record is saved at once (roots-keeper.ts) and `pageReached` is emitted on the bus, where the achievement keeper
   * tracks it (achievement-keeper.ts). A run that started on the debug page advances nothing.
   */
  private endRoots() {
    const page = this.roots?.endRun();
    if (page !== undefined) this.bus.emit('pageReached', { page });
  }

  /**
   * Debug (the console's S.roots): the page the next run starts on, in memory, or null to read the save again. It is an
   * override, not the save: the record is never changed, and a run started on it advances nothing (roots-keeper.ts).
   */
  setRootsPage(page: number | null) {
    this.debugRootsPage = debugRootsPage(page);
  }

  /**
   * Debug (the console's S.meta.reset, SAVE §4): forgets the Roots' progress in the save and in this tab. The run under way
   * advances nothing when it ends. Returns false, and changes nothing, in the sandbox and on a newer build's record.
   */
  forgetRoots(): boolean {
    if (!this.keeper.reset()) return false;
    this.roots?.forget();
    return true;
  }

  /** Debug (the console's S.mastery): the mastery level the next runs start with, in memory only; the save is not written. Returns it. */
  setMastery(level: number): number {
    this.debugMastery = clampLevel(level);
    return this.debugMastery;
  }

  /** The Roots' mastery level the current run was carved with (REWARDS §6). */
  get rootsMastery(): number { return this.runMastery; }

  /** The achievements listen to the events of their catalogue on this run's bus (ACHIEVEMENTS §2). */
  private listenAchievements() {
    const source = 'achievements';
    this.bus.on('bossOvercome', { priority: 300, source, fn: p => this.achieved('bossOvercome', p) });
    this.bus.on('meditationComplete', { priority: 300, source, fn: p => this.achieved('meditationComplete', p) });
    this.bus.on('brew', { priority: 300, source, fn: p => this.achieved('brew', p) });
    this.bus.on('cook', { priority: 300, source, fn: p => this.achieved('cook', p) });
    this.bus.on('pageReached', { priority: 300, source, fn: p => this.achieved('pageReached', p) });
  }

  /** One event to the tracker: an unlock is saved at once and queued as its card (achievement-keeper.ts). */
  private achieved(event: string, payload: object) {
    this.keeper.track(event, { ...payload } as Payload, Date.now());
  }

  /**
   * Shows the next achievement card at a calm moment: playing, in no window, not in a sealed room with projections, and
   * the walls and the passage settled (ACHIEVEMENTS §4). One card at a time; the next waits for the player to confirm it.
   */
  private showAchievement(ctx: string) {
    if (ctx !== 'play' || this.keeper.pending === 0 || !this.keeper.live || this.hud.achievementOpen) return;
    if (this.transitioning || this.gate.busy || this.restartT > 0 || this.revealT >= 0) return;
    const rs = this.roomState.get(this.room);
    if (rs?.sealed && !rs.cleared) return;
    const n = this.keeper.peek();
    if (n) this.presentAchievement(n);
  }

  private presentAchievement(n: AchievementNotice) {
    const c = cardKeys(n);
    // the notice is not blocking: it leaves by its timer (5 s, 7 s for a long text), and only then leaves the queue;
    // a notice cut off by another window stays queued (ACHIEVEMENTS §4)
    this.hud.achievementNotice(c, n.level, noticeMillis(t(c.desc)), () => this.keeper.confirm(n));
    const b = this.player.body;
    this.particles.burst(b.x, b.y + 1.6, b.z, pal('light.gold'), 28, 2.6, 0.06);
    sfx3.achievement();
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
      if (!this.sandbox && spec.meditation) {
        const e = this.enemies.spawn(boundaryDef, this.actors.newId(), spec.room, spec.x + 0.5, spec.y + 1, spec.z + 0.5, boundaryDef.hp, boundaryDef.speed, 0, new Set(['boundary']));
        e.faction = 'neutral';
        e.spawning = 0;
        this.actors.add(e);
      }
    }
    for (const kp of f.keys) this.pickups.add('key', kp.x + 0.5, kp.y + 0.5, kp.z + 0.5, kp.room);
    for (const bp of f.bombs) this.pickups.add('bomb', bp.x + 0.5, bp.y + 0.5, bp.z + 0.5, bp.room);
    // the Roots (REWARDS §4-5): the extra practices and the altar float over their pedestals, the loose hearts lie with their kinds
    if (k === FIRST_FLOOR) this.placeRootsSpots();
    for (const h of f.hearts) this.pickups.add('heart', h.x + 0.5, h.y + 0.5, h.z + 0.5, h.room, null, 0, null, h.kind);
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
  }

  /** Puts a pedestal's practice in the world: the reserved one, unless the player already got it
   *  some other way (then a runtime draw from the room's pool). */
  private placePedestalItem(p: { room: number; x: number; y: number; z: number; item: string | null }) {
    const def = this.pedestalDef(p);
    this.pickups.add('item', p.x + 0.5, p.y, p.z + 0.5, p.room, def);
    return def;
  }

  private pedestalDef(p: { room: number; item: string | null }) {
    const id = offerPedestal(p.item, id => this.inventory.has(id) || this.pools.isTaken(id), () => {
      const type = this.rooms.get(p.room)?.type;
      return this.pools.drawRuntime(type === 'vault' || type === 'boss' ? type : 'treasure', this.rng.stream('loot'));
    });
    return id ? ITEM_BY_ID.get(id) ?? null : null;
  }

  /** Floor 0's Roots pedestals (extra practices and the altar) hold their practices from the moment floor 0 activates. */
  private placeRootsSpots() {
    for (const r of this.rootsSpots) {
      const s = r.site.spot;
      const def = r.item ? ITEM_BY_ID.get(r.item) ?? null : null;
      if (def) r.pickup = this.pickups.add('item', s.x + 0.5, s.y, s.z + 0.5, s.room, def);
    }
  }

  /**
   * The player got `id` from somewhere: a Roots pedestal still showing it draws another practice, so no pedestal offers
   * an item its player already holds (REWARDS §4). The taken pedestal's own pickup is not one of these.
   */
  private reofferRoots(id: string) {
    for (const r of this.rootsSpots) {
      if (!r.pickup || r.pickup.taken || r.item !== id) continue;
      const s = r.site.spot;
      this.pickups.take(r.pickup);
      r.item = redrawRootsSite(this.pools, this.rng, r.site, ++r.again, this.rootsDrawn);
      const def = ITEM_BY_ID.get(r.item) ?? null;
      r.pickup = def ? this.pickups.add('item', s.x + 0.5, s.y, s.z + 0.5, s.room, def) : null;
    }
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
    openHole(this.dw, f.hole);
    this.player.spawnAt(f.hole.x + f.hole.size / 2, f.hole.yTop + 1, f.hole.z + f.hole.size / 2);
  }

  /** World voxels plus closed doors. */
  solid(x: number, y: number, z: number) {
    return this.world.solid(x, y, z) || (this.below && this.doors.solidAt(x, y, z));
  }

  roomAt(x: number, y: number, z: number): RoomInfo | null {
    if (!this.below) return null;
    const f = this.floors.get(bandOf(y));
    if (!f) return null;
    const [gx, gz] = cellOf(x, z);
    if (gx < 0 || gz < 0 || gx >= f.plan.w || gz >= f.plan.h) return null;
    // the room whose space holds the cell (a room may spread into empty cells the map never shows)
    const i = f.space[gx + gz * f.plan.w];
    return i < 0 ? null : f.rooms[i];
  }

  // ───────────────────────── realms (docs/architecture/SKY.md §2) ─────────────────────────

  /** True in the dungeon's world, below the crown. Every dungeon-only rule is guarded by it (SKY.md §2.5a). */
  private get below() { return this.realm === 'dungeon'; }

  /** The swap's view of the game's fields (SKY.md §2.1). */
  private realmHost(): RealmHost {
    return {
      install: set => {
        this.realm = set.kind;
        this.world = set.world; this.chunks = set.chunks; this.elements = set.elements;
        this.debris = set.debris; this.pickups = set.pickups; this.enemies = set.enemies;
        this.actors.setRealm(set.kind);
      },
      current: (): RealmSet => ({
        kind: this.realm, root: this.below ? this.dungeonRoot : this.skyRoot,
        world: this.world, chunks: this.chunks, elements: this.elements, debris: this.debris, pickups: this.pickups, enemies: this.enemies,
      }),
      // runs before install: the fields still hold the world being left
      clearTransient: () => {
        this.intents.clear(); this.particles.clear(); this.blasts.clear(); this.enemies.clearHazards(); this.missiles.clear();
        // the sky's hindrances run only in the sky: they end as it is left
        if (this.realm === 'sky') this.sky?.leave();
      },
      hooks: kind => {
        const creatures = this.sky?.creatures;
        if (kind === 'sky') { this.sky?.install(this.bus); if (creatures) this.router.add(creatures); }
        else { this.bus.off(null, 'sky'); if (creatures) this.router.remove(creatures); }
      },
    };
  }

  private realmGateHost(): RealmGateHost {
    return {
      fade: k => this.hud.fadeLevel(k),
      pass: t => this.passRealm(t),
      ready: () => !this.chunks.busy,
    };
  }

  /** The sky, built the first time the run reaches it (SKY.md §2.1: lazily, from its own forks). */
  private skyRealm(): SkyRealm {
    if (!this.sky) this.sky = SkyRealm.create(this.makeSkyHost(), this.skyRoot, layout => this.makeSkySet(layout));
    return this.sky;
  }

  /** The sky's set on its layout: its own world, chunk renderer, elements, loose cubes, pickups and an empty projection system. */
  private makeSkySet(layout: SkyLayout): SkyRealmSet {
    const world = new SkyWorld(layout);
    return {
      kind: 'sky', root: this.skyRoot, world,
      chunks: new ChunkRenderer(world, this.skyRoot, this.atlas, 48),
      elements: this.elementSim(world, this.rng.fork('sky', 'elements').u32()),
      debris: this.newDebris(),
      pickups: new Pickups(this.skyRoot),
      enemies: new Enemies(this.skyRoot, this.enemyHost()),
    };
  }

  /** Loose cubes of a world: a bomb fuse in the sky works as it does below. */
  private newDebris(): DebrisSystem {
    const debris = new DebrisSystem(MAX_CUBES, (x, y, z) => this.solid(x, y, z), (i, x, y, z, s) => this.onDebrisImpact(i, x, y, z, s));
    debris.onFuse = (i, x, y, z, love) => {
      const chain = this.bombCause.get(i);
      this.bombCause.delete(i);
      // a white bomb (placed at positive polarity) goes off as a love explosion (DECISIONS §7.8)
      if (love) { this.loveBlast(x, y, z); return; }
      this.blasts.current = chain ?? null;
      this.explode(x, y, z, this.stats.get('bombRadius'), this.stats.get('bombDamage'), 'bomb', this.player.id);
      this.blasts.current = null;
    };
    return debris;
  }

  /** The element simulation of a world, with the game's hooks (the same rules in both worlds). */
  private elementSim(world: VoxelSpace, seed: number): ElementSim {
    return new ElementSim(world, {
      seed,
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
  }

  /** The one door from the sky into the game (SKY.md §5.2). No verb here takes health. */
  private makeSkyHost(): SkyHost {
    const p = this.player;
    const player: SkyPlayer = {
      get body() { return p.body; },
      get eye() { return p.eye; },
      get aim() { return p.forward; },
      get hand() { return p.hand; },
      push: (vx, vy, vz) => p.push(vx, vy, vz),
      // the player's own slow factor applies; the sky gives the time only (provisional)
      slow: (_f, s) => { p.slowT = Math.max(p.slowT, s); },
      hold: s => p.hold(s),
      carry: (to, s) => p.carry(to, s),
      get held() { return p.heldT > 0; },
    };
    return {
      time: () => this.time,
      player: () => player,
      actors: () => this.actors,
      world: () => this.sky!.set.world,
      // the sky's own loose cubes, whichever world is active (the sky's nests and blocks are its own)
      debris: () => this.sky!.set.debris,
      hazards: () => this.enemies.hazardField,
      fork: (...path) => this.rng.fork(...path),
      fx: (kind, x, y, z, n) => this.skyFx(kind, x, y, z, n),
      cue: (kind, x, y, z) => playSkyCue(kind, x, y, z),
      enterUnity: () => this.sky?.enterUnity(),
      toast: (key, params) => this.hud.toast(key, params),
      card: (name, lines) => this.hud.presenceCard(name, lines),
      bar: b => this.hud.bossBar(b ? { name: t(b.name), ratio: b.ratio } : null),
      place: key => this.hud.placeLabel(key),
      gift: (itemId, x, y, z) => { this.ejectReward(this.pickups.add('item', x, y, z, this.room, ITEM_BY_ID.get(itemId) ?? null), 1.5, 3); },
      travel: tr => this.gate.start(tr),
      drainSpirit: n => { this.spirit = Math.max(0, this.spirit - n); },
      spirit: () => this.spirit,
      refillSpirit: () => this.refillSpirit(),
      takeRandomPractice: () => this.takePractice(),
      sendUnderground: (floors, rng) => this.sendUnderground(floors, rng),
    };
  }

  /** The sky's effects as the game's particles (placeholders until the sky's art rulings name them). */
  private skyFx(kind: SkyFx, x: number, y: number, z: number, n = 6) {
    switch (kind) {
      case 'puff': this.particles.burst(x, y, z, pal('sky.deck.haze'), n, 1.2, 0.08, true); break;
      case 'shimmer': this.particles.burst(x, y, z, pal('light.core'), n, 0.8, 0.06, true); break;
      case 'hit': this.particles.burst(x, y, z, pal('light.gold'), n, 2.5, 0.08); break;
      case 'gold': this.particles.burst(x, y, z, pal('light.gold'), n, 2, 0.07); break;
      case 'motes': this.particles.burst(x, y, z, pal('bone.dim'), n, 0.8, 0.05, true); break;
      case 'updraft': this.particles.burst(x, y, z, pal('sky.day'), n, 3, 0.06, true); break;
      case 'gate': this.particles.burst(x, y, z, pal('light.gold'), n, 4, 0.1); break;
      case 'pop': this.particles.burst(x, y, z, pal('bone.paper'), n, 2, 0.08); break;
      case 'bounce': this.particles.burst(x, y, z, pal('bone.dim'), n, 2.5, 0.05); break;
    }
  }

  /** The sky's bounds for the passages (SKY.md §2.4): the top of the dungeon's sky, the deck, the floor, the crown. */
  private skyBounds(): SkyBounds {
    const d = this.skyRealm().plans.tree.deck;
    return {
      top: SKY_TOP, floorOut: SKY_FLOOR_OUT,
      deck: [d.x, d.y, d.z],
      crown: [this.tree.cx, SURFACE_Y + SKY_LIMIT - 3, this.tree.cz],
    };
  }

  /** A capture takes one practice the player holds, at random, for the rest of the run (SKY.md §19, provisional). */
  private takePractice(): string | null {
    const held = this.inventory.items;
    if (!held.length) return null;
    const id = held[this.rng.fork('sky', 'capture', this.captures++).int(0, held.length - 1)].def.id;
    this.inventory.lose(id);
    this.hud.setItems(this.inventory.items.map(i => i.def));
    return id;
  }

  /** Spirit at zero: one of the floors is picked and the player goes there; spirit refills at the teleport, in passRealm (SKY.md §5.2). False while the gate is busy: SpiritLaw asks again. */
  private sendUnderground(floors: readonly number[], rng: Rng): boolean {
    if (!floors.length || this.gate.busy) return false;
    this.underground = floors[rng.int(0, floors.length - 1)];
    this.gate.start({ to: 'dungeon', at: this.skyBounds().crown, float: true });
    return true;
  }

  /** Spirit back to full (a won deity, the test bench). */
  refillSpirit() { this.spirit = SPIRIT_MAX; }

  /**
   * `?test` (debug/test-bench.ts): stands the player in floor k's start room, skipping the floors and tolls above it.
   * It takes the capture's landing path (undergroundSpawn): from the sky through the gate's fade, as a spirit fall does.
   * False when there is no such floor, in the sandbox, or while a passage is under way.
   */
  debugFloor(k: number): boolean {
    if (!Number.isInteger(k) || k < FIRST_FLOOR || k > LAST_FLOOR || this.sandbox || this.gate.busy) return false;
    if (!this.below) {
      this.underground = k;
      this.gate.start({ to: 'dungeon', at: this.skyBounds().crown, float: true });
      return true;
    }
    const at = this.undergroundSpawn(k);
    if (!at) return false;
    this.carve(k + 1);
    this.teleport(at[0], at[1], at[2]);
    // trackPlace announces a new deepest floor; a floor already reached gets its map back here
    if (k <= this.maxDepth) { this.visited = new Set(); this.hud.setFloor(this.floors.get(k)!, k); }
    return true;
  }

  /** `?sky` (main.ts): the run starts on the sky's deck, as if the built tree had been climbed. */
  debugSky() {
    if (this.below) this.gate.start({ to: 'sky', at: this.skyBounds().deck, float: true });
  }

  /** Falling below the deck's floor goes down to the crown (SKY.md §2.4). The sky's own update runs after this. */
  private skyGate() {
    const travel = RealmGate.check('sky', this.player.body, null, this.skyBounds());
    if (travel) this.gate.start(travel);
  }

  /** The gate's passage, at full black: the world is swapped, then the player is placed in the new one. */
  private passRealm(t: Travel) {
    if (t.to === this.realm) return;
    const incoming = t.to === 'sky' ? this.skyRealm().set : this.stash!;
    this.stash = swapRealm(this.realmHost(), incoming, this.dungeonRoot, this.skyRoot);
    this.player.float = t.float;
    // a capture's landing is carved and activated only now, with the dungeon installed (never into the sky's fields)
    const landing = t.to === 'dungeon' && this.underground !== null ? this.undergroundSpawn(this.underground) : null;
    // spirit refills at the teleport, so the HUD reads 0 through the gate's fade (SKY.md §5.2)
    if (this.underground !== null) this.spirit = SPIRIT_MAX;
    this.underground = null;
    const at = landing ?? t.at;
    this.teleport(at[0], at[1], at[2]);
    this.hud.setMinimap(t.to === 'dungeon');
    // the HUD names this place again on the next frame (updateLoop writes the zone label when it differs)
    if (t.to === 'dungeon') this.zone = 'sky';
    this.hud.toast(t.to === 'sky' ? 'toast.skyEnter' : 'toast.skyLeave');
    sfx3.rumble();
  }

  /** Carves and activates the floor a capture sends the player to; its spawn cell, or null when there is none. */
  private undergroundSpawn(k: number): SkyCell | null {
    this.carve(k);
    this.activate(k);
    const f = this.floors.get(k);
    if (!f) return null;
    const [x, y, z] = f.spawn;
    return [Math.floor(x), Math.floor(y), Math.floor(z)];
  }

  /** A new run starts in the dungeon: the gate stops, the sky is set aside and its set disposed (SKY.md §2.1). */
  private leaveSky() {
    this.gate.cancel();
    // a run from the dungeon shows its minimap (passRealm hides it in the sky); begin() comes here too
    this.hud.setMinimap(true);
    if (!this.sky) return;
    if (this.realm === 'sky') this.stash = swapRealm(this.realmHost(), this.stash!, this.dungeonRoot, this.skyRoot);
    this.sky.dispose();
    this.disposeSet(this.sky.set);
    this.sky = null;
    this.stash = null;
  }

  private disposeSet(set: RealmSet) {
    set.chunks.dispose();
    set.pickups.dispose();
    set.enemies.dispose();
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
      spawnPickup: (kind, x, y, z) => { this.ejectReward(this.pickups.add(kind, x, y, z, this.room, null, 0.3), 3.2, 4); },
      pulse: (x, y, z, r, d, k, c, src) => this.pulse(x, y, z, r, d, k, c, src),
      arc: (x, y, z, to, d, src, pol) => this.arc(x, y, z, to, d, src, pol),
      nearestProjection: (x, y, z, r, except) => this.nearestProjection(x, y, z, r, except),
      actorAt: id => { const a = this.actors.get(id); return a ? { x: a.body.x, y: a.body.y + a.body.h / 2, z: a.body.z } : null; },
      shove: (id, dx, dz, s) => this.shove(id, dx, dz, s),
      freeze: (id, s) => this.affectProjection(id, 'frozen', s),
      frighten: (id, s) => this.affectProjection(id, 'fear', s),
      igniteArea: (x, y, z, r) => this.igniteArea(x, y, z, r),
      launch: (spec, x, y, z, dx, dy, dz) => this.intents.fire(spec, new THREE.Vector3(x, y, z), new THREE.Vector3(dx, dy, dz), new THREE.Vector3()),
      intentsHere: () => this.intents.within(p => this.roomAt(p.x, p.y, p.z)?.id === this.room),
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
        this.stroke = { polarity: this.polarity, warmed: new Set(), intent, weapon };
        this.strikeDebris = STRIKE_DEBRIS[weapon];
        return { damage: ev.damage, mining: ev.mining, reach: ev.reach, tags: ev.tags };
      },
      solid: (x, y, z) => this.solid(x, y, z),
      // a positive stroke only reaches blocks it can mend: the damaged ones
      breakable: (x, y, z) => {
        const id = this.world.get(x, y, z);
        if (id === AIR || !isFinite(mat(id).hp)) return false;
        if (this.stroke.polarity === 'negative') return true;
        // law 3.2: a positive stroke that takes a placed block removes it, as a positive shot does
        if (this.skyPositiveBlock(x, y, z, this.stroke.weapon)) return true;
        return this.world.damaged.has(this.world.idx(x, y, z));
      },
      // a clean cut: far more than any block's HP, so armor never saves it (hooks still may)
      cut: (x, y, z, source) => {
        if (this.stroke.polarity === 'positive') { if (!this.skyPositiveBlock(x, y, z, this.stroke.weapon)) this.repairBlock(x, y, z, 1e6); }
        else this.damageBlock(x, y, z, 1e6, 'cut', source, this.strikeDebris-- > 0);
      },
      burn: (x, y, z, amount, source) => {
        if (this.stroke.polarity === 'positive') {
          if (this.skyPositiveBlock(x, y, z, this.stroke.weapon)) return true;
          this.repairBlock(x, y, z, amount);
          return false;
        }
        return this.damageBlock(x, y, z, amount, 'beam', source);
      },
      // a stroke that reaches the alembic brews at it, exactly as a shot does (intentHitsBlock)
      answer: (x, y, z) => { if (this.world.get(x, y, z) === MAT.alembic) this.hitLab(x, y, z, this.stroke.polarity); },
      targets: () => [
        ...this.router.targets(),
        ...this.enemies.list
          .filter(e => e.alive && e.spawning <= 0 && this.meets(e, this.stroke.polarity))
          .map(e => ({ id: e.id, x: e.body.x, y: e.body.y, z: e.body.z, hw: e.body.hw, h: e.body.h })),
      ],
      hit: (id, damage, kx, kz, source) => {
        const warm = !this.stroke.warmed.has(id);
        this.stroke.warmed.add(id);
        this.intentTouch(id, damage, kx, kz, source === 'beam' ? 'beam' : 'cut', source, this.stroke.polarity, warm);
        // a routed actor takes the stroke through the router alone: no projection effects reach it
        if (warm && source !== 'blade' && this.stroke.intent && !this.router.owns(id)) this.strokeHit(id, kx, kz, this.stroke.intent);
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
    this.reofferRoots(id);
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
    // a sky actor has no health the dungeon can take, and no Enemies entry to hurt (SKY.md §5.2)
    if (t.kind === 'sky') return false;
    if (!t.alive || t.spawning > 0 || amount <= 0) return false;
    if (t === p && p.invulnT > 0) return false;
    if (t === p && p.starT > 0 && kind !== 'toll') return false;
    if (t.kind === 'projection' && kind === 'explosion' && (t as Enemy).spec.kind === 'creature') { t.body.vx += kx; t.body.vz += kz; return false; }
    const ev = this.bus.emit('actorDamage', {
      target: t.id, targetKind: t.kind, def: t.def, amount, kind, source, owner,
      knockback: t === p ? 0 : 3, cause: this.blasts.current ?? undefined, polarity: intent?.polarity ?? null,
    });
    if (ev.cancelled) return false;
    if (t !== p) return this.hurtEnemy(t as Enemy, ev.amount, kx * ev.knockback, kz * ev.knockback, intent);
    if (ev.amount <= 0) return false;
    if (p.blood) { p.blood = null; sfxHeart.bloodEnd(); this.hud.toast('heart.bloodBroken'); }
    const hit = landHit(p.layers, ev.amount, kind !== 'toll');
    if (hit.halved) { sfxHeart.stoneHit(); this.particles.burst(p.body.x, p.body.y + 1.2, p.body.z, pal(HEART_FX.stone), 10, 2.5, 0.07); }
    for (const k of hit.lost) this.heartLost(k);
    p.hp = Math.max(0, p.hp - hit.rest);
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
      this.endRoots();
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

  collectHeart(kind: HeartKind): boolean {
    const p = this.player;
    // a blood heart at full health opens one heart slot and fills it (#146); below full it heals over time
    const slot = kind === 'blood' && p.hp >= this.maxHp;
    if (kind === 'red' && p.hp >= this.maxHp) return false;
    if ((isLayer(kind) || slot) && !hasHeartRoom(this.stats.get('maxHearts'), p.layers)) return false;
    if (kind === 'red') return this.collect('heart', 2);
    const ev = this.bus.emit('pickupCollect', { kind: 'heart', amount: 2, heart: kind });
    if (ev.cancelled) return false;
    const pts = Math.max(0, ev.amount) * HALF_HEART;
    if (isLayer(kind)) {
      p.layers.push({ kind, hp: Math.min(HEART, pts) });
      if (kind === 'blue') sfxHeart.blue();
      else if (kind === 'black') sfxHeart.black();
      else if (kind === 'stone') sfxHeart.stone();
    } else if (slot) {
      this.stats.add({ stat: 'maxHearts', layer: 'add', value: 1, source: BLOOD_SLOT_SOURCE });
      p.hp = this.maxHp;
      sfxHeart.blood();
    } else if (kind === 'blood') {
      p.blood = { left: BLOOD_BUDGET, t: BLOOD_SECONDS };
      sfxHeart.blood();
    } else {
      this.heal(pts, 'pickup');
      p.starT = STAR_SECONDS;
      sfxHeart.star();
    }
    this.hud.toast(slot ? 'heart.bloodSlot' : `heart.${kind}`);
    const b = p.body;
    this.particles.burst(b.x, b.y + 1.2, b.z, pal(HEART_FX[kind]), 24, 3, 0.07);
    return true;
  }

  private heartLost(kind: LayerKind) {
    const b = this.player.body;
    this.bus.emit('heartLost', { heart: kind });
    this.particles.burst(b.x, b.y + 1.3, b.z, pal(HEART_FX[kind]), 30, 4, 0.08);
    sfxHeart.layerLost();
    this.hud.toast(`heart.${kind}Lost`);
  }

  private berserkOn = false;

  private setBerserk(on: boolean) {
    if (on === this.berserkOn) return;
    this.berserkOn = on;
    this.stats.removeSource('berserk');
    if (on) for (const [stat, value] of [['damage', BERSERK_DAMAGE], ['moveSpeed', BERSERK_SPEED], ['jump', BERSERK_JUMP], ['range', BERSERK_RANGE]] as const)
      this.stats.add({ stat, layer: 'mul', value, source: 'berserk' });
    setEcho(on);
    this.hud.setBerserk(on);
    this.bus.emit('berserkChange', { on });
    const b = this.player.body;
    if (on) {
      sfxHeart.berserk();
      this.hud.shake(0.35);
      this.particles.burst(b.x, b.y + 1, b.z, pal(HEART_FX.berserker), 60, 6, 0.1);
    } else if (!this.player.dead) {
      sfxHeart.berserkEnd();
      this.hud.toast('berserk.off');
    }
  }

  get berserk() { return this.berserkOn; }

  private updateHearts(dt: number) {
    const p = this.player;
    if (p.starT > 0) {
      p.starT = Math.max(0, p.starT - dt);
      if (p.starT === 0) { sfxHeart.starEnd(); this.hud.toast('heart.starEnd'); }
    }
    starTheme(p.starT > 0 && !p.dead);
    if (p.blood) {
      const r = tickBlood(p.blood, dt, p.hp, this.maxHp);
      if (r.heal > 0) p.hp = Math.min(this.maxHp, p.hp + r.heal);
      if (r.done) { p.blood = null; sfxHeart.bloodEnd(); }
    }
    const on = (berserk(p.layers) || this.potions.active.some(a => POTIONS[a.potion].berserk)) && !p.dead;
    if (on !== this.berserkOn) this.setBerserk(on);
    if (on) this.berserkTread();
  }

  private berserkTread() {
    const p = this.player, b = p.body, cells: [number, number, number][] = [];
    if (b.onGround) for (const dx of [-b.hw, b.hw]) for (const dz of [-b.hw, b.hw]) cells.push([Math.floor(b.x + dx), Math.floor(b.y - 0.05), Math.floor(b.z + dz)]);
    const l = Math.hypot(p.wishX, p.wishZ);
    if (l > 0.1) {
      const fx = Math.floor(b.x + p.wishX / l * (b.hw + 0.25)), fz = Math.floor(b.z + p.wishZ / l * (b.hw + 0.25));
      cells.push([fx, Math.floor(b.y + 0.1), fz], [fx, Math.floor(b.y + 1.1), fz]);
    }
    for (const [x, y, z] of cells) if (this.looseBlock(x, y, z)) {
      this.damageBlock(x, y, z, 999, 'crush', 'berserker');
      this.particles.burst(x + 0.5, y + 0.5, z + 0.5, pal(HEART_FX.berserker), 8, 3, 0.07);
    }
  }

  looseBlock(x: number, y: number, z: number): boolean {
    const id = this.world.get(x, y, z);
    if (id === AIR || !Number.isFinite(mat(id).hp)) return false;
    let n = 0;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (this.world.get(x + dx, y + dy, z + dz) !== AIR) n++;
    return n === 1;
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
      reflects: (t: Actor, x: number, y: number, z: number) => {
        if (t !== this.player || !this.berserkOn) return false;
        sfxHeart.reflect();
        this.particles.burst(x, y, z, pal(HEART_FX.berserker), 10, 3, 0.06);
        return true;
      },
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
    if (this.router.owns(id)) { this.router.touchBody(id, polarity, warm, kind); return; }
    const e = this.enemies.get(id);
    if (!e) return;
    if (e.faction !== 'projection' && polarity === 'positive') {
      // a warm love shot grows a friendly creature (issue #51, #102); a beam's repeat ticks do not
      const oldScale = e.scale;
      if (warm && growsUnder(e)) this.enemies.grow(e);
      const heal = allyHeal(damage, e.hp, e.maxHp);
      const b = e.body;
      e.hp += heal;
      this.particles.burst(b.x, b.y + b.h * 0.6, b.z, pal('light.gold'), 4, 1, 0.05);
      if (warm && growsUnder(e) && oldScale < GROWTH_MAX && e.scale >= GROWTH_MAX && claimCreatureGrowthGift(e.tags)) this.dropCreatureGrowthGift(e);
      return;
    }
    // a warm negative shot takes a grown friendly creature one step back down (#102); it still harms it as before
    if (warm && e.faction !== 'projection' && growsUnder(e) && e.scale > 1 && this.meets(e, polarity)) {
      this.enemies.shrink(e);
      const b = e.body;
      this.particles.burst(b.x, b.y + b.h * 0.6, b.z, pal('mat.dirt.base'), 4, 1, 0.05);
    }
    this.damageActor(e, intentDamage(polarity, damage), kind, source, this.player.id, kx, kz, { polarity, warm });
  }

  private dropCreatureGrowthGift(e: Enemy) {
    const heart = rollCreatureGrowthHeart(this.rng.stream('gifts'));
    if (!heart) return;
    const b = e.body;
    this.particles.burst(b.x, b.y + b.h * 0.6, b.z, pal('light.gold'), 18, 2, 0.07);
    sfx3.reveal();
    this.launchGiftPickups(e, [{ type: 'heart', heart }]);
  }

  private launchGiftPickups(e: Enemy, rewards: ({ type: 'item'; item: ItemDef } | { type: 'heart'; heart: HeartKind })[]) {
    const b = e.body, player = this.player.body;
    const base = Math.atan2(b.z - player.z, b.x - player.x);
    rewards.forEach((reward, i) => {
      const angle = base + (i - (rewards.length - 1) / 2) * 0.6;
      const x = b.x + Math.cos(angle) * 0.45, z = b.z + Math.sin(angle) * 0.45;
      const pickup = reward.type === 'item'
        ? this.pickups.add('item', x, b.y + 1.02, z, e.room, reward.item, 0.3)
        : this.pickups.add('heart', x, b.y + 1.02, z, e.room, null, 0.3, null, reward.heart);
      this.ejectReward(pickup, 1.5, 3);
    });
  }

  /**
   * Dispenses a reward away from the player (issue #156). Every reward source calls this (or `ejectRewards`)
   * after it adds its pickup: the reward is launched straight away from the player, turned by `offset` (a spread
   * for several rewards from one source), onto the nearest throw whose whole flight is clear and that lands on ground with no element in
   * it (`ejectAngle`). Its delay keeps it from being collected where it appears. `speed` and `lift` set the throw.
   */
  private ejectReward(p: Pickup, speed: number, lift: number, offset = 0) {
    // what the world holds at a cell, for the throw's whole path (eject.ts decides what a clear throw is)
    const ground: Ground = {
      solid: (x, y, z) => this.solid(x, y, z),
      element: (x, y, z) => this.elementAt(x + 0.5, y + 0.5, z + 0.5) !== null,
    };
    const reach = throwReach(speed, lift, PICKUP_GRAVITY);
    const a = ejectAngle(p, this.player.body, ground, Math.floor(p.y), reach, offset);
    this.pickups.launch(p, Math.cos(a) * speed, lift, Math.sin(a) * speed);
  }

  /** `ejectReward` for a batch from one source: the batch fans out so the rewards do not land on one spot. */
  private ejectRewards(ps: Pickup[], speed: number, lift: number) {
    ps.forEach((p, i) => this.ejectReward(p, speed, lift, ps.length > 1 ? (i / (ps.length - 1) - 0.5) * 1.1 : 0));
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
    if (e.spec.kind === 'boss' && floor !== undefined) this.bossDown(floor, 'converted');
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
    this.polarityHint.learned();
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
    const dropped: Pickup[] = ev.drops.map(k => this.pickups.add(k, b.x, b.y + 0.6, b.z, e.room, null, 0.3));
    const stolen = this.enemies.takeCarried(e.id);
    if (stolen.length) for (const k of [...stolen, this.rng.stream('drops').pick(stolen)]) dropped.push(this.pickups.add(k, b.x, b.y + 0.6, b.z, e.room, null, 0.3));
    const floor = this.rooms.get(e.room)?.floor;
    const seq = this.projectionSeq.get(e.id) ?? 0;
    this.projectionSeq.delete(e.id);
    // the Shadow's stillness ending is a turning to your side, not a destruction (ACHIEVEMENTS §1)
    if (floor !== undefined && e.spec.kind === 'boss') this.bossDown(floor, e.tags.has(STILLNESS_TAG) ? 'stillness' : 'destroyed');
    if (e.spec.split && !e.spec.splitOnHit) { const r = this.rooms.get(e.room); if (r) for (const id of e.spec.split) this.announce(id, r); }
    if (floor !== undefined) {
      const parts = rollParts(this.rng.fork('floor', floor, 'room', e.room % ROOM_ID_STRIDE, 'part', seq), e.def);
      if (e.tags.has('rooted')) parts.push(...rollParts(this.rng.fork('floor', floor, 'room', e.room % ROOM_ID_STRIDE, 'part', seq, 'rooted'), e.def));
      for (const part of parts) dropped.push(this.pickups.add('part', b.x, b.y + 0.6, b.z, e.room, null, 0.3, part));
    }
    this.ejectRewards(dropped, 3.2, 4);
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
        this.ejectRewards(ev.drops.map(k => this.pickups.add(k, r.hx + 6.5, r.y0 + 1, r.hz + 3.5, id, null, 0.3)), 3.2, 4);
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
      this.ejectRewards(ev.drops.map(k => this.pickups.add(k, r.hx + 6.5, r.y0 + 1, r.hz + 3.5, r.id, null, 0.3)), 3.2, 4);
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
    // the mountains outside the array are a formula: nothing breaks them (issue #10)
    if (id === AIR || !this.world.inside(x, y, z)) return false;
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
    if (!this.world.inside(x, y, z)) return false;
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
    // dungeon only: no loot and no floor activation in the sky (SKY.md §2.5a)
    if (this.below) {
      // what burns away leaves nothing, not even loot an item would add (no burning loot farms)
      if (kind !== 'fire') this.rollLoot(x, y, z, id, source);
      // digging into the next floor's band activates it
      if (depthOf(y) > this.maxDepth) this.activate(depthOf(y));
    }
    return true;
  }

  /**
   * Broken blocks give nothing but the block itself (owner decision: keys, items and other
   * rewards live in chests, Minecraft-style), with one exception: a crate sometimes gives a key,
   * a heart or a small bomb (issue #6, `rollCrate`; its chance is the floor's, issue #48). The `blockLoot` event fires with those drops,
   * so an item can add more.
   */
  private rollLoot(x: number, y: number, z: number, material: number, source: string) {
    const drops: PickupKind[] = [];
    if (material === MAT.crate) {
      const floor = depthOf(y);
      // only a crate inside floor 0's band reads the Roots' factor (REWARDS §3); the surface and every other floor keep their chance
      const chance = crateChanceInBand(floorCrateChance(this.rng, floor), bandOf(y), rootsRewards(this.runMastery).crateFactor, CRATE_CHANCE_CAP);
      // a crate on floor 0 takes its own fork by cell: the Roots' factor changes how many draws it makes, and the drops
      // stream is the floors' (REWARDS §3, RNG.md)
      const drop = rollCrate(bandOf(y) === FIRST_FLOOR ? rootsFork(this.rng, 'crate', x, y, z) : this.rng.stream('drops'), chance, { floor, luck: this.stats.get('luck') });
      if (drop) drops.push(drop);
    }
    const ev = this.bus.emit('blockLoot', { x, y, z, material, source, drops });
    this.ejectRewards(ev.drops.map(k => this.pickups.add(k, x + 0.5, y + 0.1, z + 0.5, this.room, null, 0.4)), 2.6, 3.5);
    for (const k of ev.drops) this.particles.burst(x + 0.5, y + 0.5, z + 0.5, PICKUP_FX[k], 14, 2.5, 0.07);
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
    if (this.below) this.blastDoors(x, y, z, r, source);
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
    // a routed creature in range takes one puff (law 3.3); projections and the rest are below
    this.router.blast({ x, y, z }, r, 'negative', true, 'explosion');
    // every actor in range, whatever its side (friendly fire, like bombs on the player)
    for (const a of [...this.actors.all()]) {
      if (a.kind === 'sky') continue;
      const ab = a.body, ox = ab.x - x, oz = ab.z - z, d = Math.hypot(ox, ab.y + ab.h / 2 - y, oz);
      if (d < r + 0.4) this.damageActor(a, ev.actorDamage, 'explosion', source, owner, ox / (d || 1) * 2, oz / (d || 1) * 2);
    }
    // a bomb: white-hot core, ember sparks, ash (docs/art/DECISIONS.md §7.4)
    this.particles.burst(x, y, z, pal('light.ember'), 40, 8, 0.15);
    this.particles.burst(x, y, z, pal('light.core'), 20, 5, 0.1);
    this.particles.burst(x, y, z, pal('ink.ash'), 24, 4, 0.22);
    this.hud.shake(0.35);
    sfx2.boom();
  }

  /**
   * Law 3.2 (seam 13): a positive hit, from a shot or a weapon stroke, on a block the player placed in
   * the sky removes it for good. True when it did. The dungeon and an unplaced block take no part.
   */
  private skyPositiveBlock(x: number, y: number, z: number, weapon: WeaponId): boolean {
    return this.realm === 'sky' && !!this.sky?.positiveHitsBlock({ x, y, z, cell: this.world.idx(x, y, z), actor: -1, weapon, warm: true });
  }

  /** A positive intention mends a damaged block and never breaks one; a negative one damages it. */
  private intentHitsBlock(hit: VoxelHit, mining: number, polarity: Polarity) {
    const id = this.world.get(hit.x, hit.y, hit.z);
    if (id === AIR) return false; // a door
    if (id === MAT.alembic) { this.hitLab(hit.x, hit.y, hit.z, polarity); return false; }
    if (id === MAT.kitchen) return false;   // unbreakable, and an intention does nothing to it
    if (polarity === 'positive') {
      if (this.skyPositiveBlock(hit.x, hit.y, hit.z, 'intent')) return true;
      const block = this.world.idx(hit.x, hit.y, hit.z);
      const device = activeDevice();
      if (this.repairBlock(hit.x, hit.y, hit.z, mining)) this.polarityHint.mended();
      else if (this.polarityHint.idle(block, device, this.inSky || bandOf(hit.y) === SURFACE)) this.hud.polarityHint(controlParams(device), device === 'touch');
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
    // a routed creature (a sky deity) was touched through the router; no listener knows its id (SKY.md §5.7)
    if (kind === 'actor' && this.router.owns(target)) return;
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
        p.gain(d.material[i]);
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

  /** E: drop a bomb at your feet. */
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
    // a bomb placed while the polarity is positive is white: its fuse ends in a love explosion (DECISIONS §7.8)
    this.debris.love[cube] = this.polarity === 'positive' ? 1 : 0;
    this.bombCause.delete(cube); // the slot may have held an old bomb that despawned unlit
    this.debris.cooldown[cube] = 0.8;
    sfx3.fuse();
  }

  /**
   * The double tap of the fire control (every device: a double click, a double RT, a double tap on
   * the bead). The first press fires its intention as usual; with the `missile` stat a second press
   * within DOUBLE_TAP_MS launches a bomb instead (docs/design/built/practices/milagros/DR-LAUNCHER.md).
   */
  private tapMissile() {
    const on = this.stats.get('missile') >= 1;
    if (on && !this.missileHinted) {
      this.missileHinted = true;
      this.hud.toast('toast.missileHint', controlParams(activeDevice()));
    }
    if (!this.input.hit('cast') || this.hands.holding || this.player.muteT > 0) return;
    const double = this.time - this.lastCastTap <= DOUBLE_TAP_MS / 1000;
    this.lastCastTap = this.time;
    if (!double || !on) return;
    this.lastCastTap = -Infinity; // a third press starts a new pair
    this.launchMissile();
  }

  /** One bomb leaves the counter as a missile, unless there is none or a block stands at the muzzle. */
  private launchMissile() {
    const p = this.player;
    if (p.bombs <= 0) { sfx.denied(); this.hud.toast('toast.noBombs'); return; }
    const eye = p.eye, dir = p.forward;
    // the arming rule: a missile needs room to arm, so a shot into a wall at the muzzle is refused
    if (muzzleBlocked((x, y, z) => this.solid(x, y, z), eye.x, eye.y, eye.z, dir.x, dir.y, dir.z)) { sfx.denied(); return; }
    const ev = this.bus.emit('missileLaunch', { speed: MISSILE_SPEED, range: MISSILE_RANGE, polarity: this.polarity });
    if (ev.cancelled) { sfx.denied(); return; }
    p.bombs--;
    // the press that launched does not also cast while it is held
    this.input.suppress('cast');
    const from = eye.addScaledVector(dir, 0.4).add(new THREE.Vector3(0, -0.15, 0));
    this.missiles.launch(from.x, from.y, from.z, dir.x, dir.y, dir.z, ev.polarity, ev.speed, ev.range);
    this.hands.fire();
    this.hud.shake(0.08);
    sfx3.launch(ev.polarity === 'negative');
  }

  /** Missiles fly; each one that meets something explodes there (a bomb blast, or love if positive). */
  private updateMissiles(dt: number) {
    if (!this.missiles.list.length) return;
    const ends = this.missiles.update(dt, {
      solid: (x, y, z) => this.solid(x, y, z),
      meets: (x, y, z) => this.missileMeets(x, y, z),
    });
    for (const m of this.missiles.list) {
      const trail = MISSILE_TRAIL[m.polarity];
      this.particles.burst(m.x - m.dx * 0.3, m.y - m.dy * 0.3, m.z - m.dz * 0.3, pal(trail[Math.floor(m.age * 20) % trail.length]), 2, 0.6, 0.06);
    }
    for (const e of ends) {
      if (e.missile.polarity === 'positive') this.loveBlast(e.x, e.y, e.z);
      else this.explode(e.x, e.y, e.z, this.stats.get('bombRadius'), this.stats.get('bombDamage'), 'missile', this.player.id);
    }
  }

  /** What a missile meets besides blocks: any actor but you (allies too), and loose bombs. */
  private missileMeets(x: number, y: number, z: number) {
    if (this.router.at(x, y, z, 0.2) >= 0) return true;
    for (const a of this.actors.all()) {
      if (a.kind === 'player' || a.kind === 'sky' || !a.alive || a.spawning > 0) continue;
      const b = a.body;
      if (Math.abs(x - b.x) < b.hw + 0.2 && Math.abs(z - b.z) < b.hw + 0.2 && y > b.y - 0.2 && y < b.y + b.h + 0.2) return true;
    }
    const i = this.debrisAt(x, y, z, 0.2);
    return i >= 0 && this.debris.isBomb(i);
  }

  /**
   * The love explosion (a positive missile): the bomb's sphere, but every block and actor in it is
   * touched as a positive intention touches it, with the blast's own damage as the amount. It mends
   * blocks and never breaks one, heals allies, warms projections (half damage, never the last point),
   * grows creatures, and never hurts you. It does not set bombs off or throw loose cubes.
   */
  private loveBlast(x: number, y: number, z: number) {
    const r = this.stats.get('bombRadius'), damage = this.stats.get('bombDamage'), ri = Math.ceil(r);
    for (let dz = -ri; dz <= ri; dz++) for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
      const bx = Math.floor(x) + dx, by = Math.floor(y) + dy, bz = Math.floor(z) + dz;
      const d = Math.hypot(bx + 0.5 - x, by + 0.5 - y, bz + 0.5 - z);
      if (d <= r) { this.repairBlock(bx, by, bz, damage * (1 - 0.5 * d / r)); this.loveLava(bx, by, bz); }
    }
    // a routed creature gets one warm touch per explosion, whatever the radius (SKY.md §5.7)
    this.router.blast({ x, y, z }, r, 'positive', true, 'item');
    for (const a of [...this.actors.all()]) {
      if (a.kind === 'player' || a.kind === 'sky' || !a.alive || a.spawning > 0) continue;
      const ab = a.body, ox = ab.x - x, oz = ab.z - z, d = Math.hypot(ox, ab.y + ab.h / 2 - y, oz);
      if (d < r + 0.4) this.intentTouch(a.id, BLAST_ACTOR_DAMAGE, ox / (d || 1), oz / (d || 1), 'item', 'missile', 'positive', true);
    }
    this.hearPresences(x, z, 'positive');
    LOVE_BLAST.forEach((t, k) => this.particles.burst(x, y, z, pal(t), 24 - k * 6, 4 + k, 0.1 + k * 0.03));
    this.hud.shake(0.15);
    sfx3.loveBoom();
  }

  /** Love turns lava into water, at the same level: the sphere of a love explosion cools the lava in it. */
  private loveLava(x: number, y: number, z: number) {
    const b = this.world.elemAt(x, y, z);
    if (elemKind(b) !== EL_LAVA) return;
    this.world.setElem(x, y, z, EL_WATER, elemLevel(b));
    this.elements.wakeAround(x, y, z);
    this.elementFx('steam', x, y, z);
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
        // a bomb in the fire goes off at once
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
    const top = p.active!;
    if (isFlask(top)) {
      sfx.denied(); this.hud.toast('lab.refused');
      devlog.line(`alembic ${cell(x, y, z)}: feed ${carriedName(top)} -> refused`);
      return;
    }
    const r = labFeed(a, top);
    devlog.line(`alembic ${cell(x, y, z)}: feed ${carriedName(top)} -> ${r}`);
    if (r !== 'fed') {
      sfx.denied();
      this.hud.toast(r === 'cold' ? 'lab.cold' : 'lab.full');
      return;
    }
    p.takeActive();
    this.hands.placed();
    sfx.place();
    this.hud.toast('lab.fed', { n: a.bulb.length, total: BULB });
  }

  /** Right click on the kitchen: the part on top of the hand is cooked into a meal (game/kitchen.ts). */
  private cookAt(x: number, y: number, z: number) {
    const k = this.kitchens.get(this.world.idx(x, y, z));
    const p = this.player, top = p.active;
    if (!k || top === undefined) { sfx.denied(); return; }
    if (typeof top === 'number' || isFlask(top)) {
      sfx.denied(); this.hud.toast('kitchen.refused');
      devlog.line(`kitchen ${cell(x, y, z)}: cook ${carriedName(top)} -> refused`);
      return;
    }
    if (!kitchenCook(k)) {
      sfx.denied(); this.hud.toast('kitchen.out');
      devlog.line(`kitchen ${cell(x, y, z)}: cook ${carriedName(top)} -> out`);
      return;
    }
    devlog.line(`kitchen ${cell(x, y, z)}: cook ${carriedName(top)} -> cooked (${COOKS - k.cooks}/${COOKS} used)`);
    p.takeActive();   // the part leaves the hand first, so the meal always has its place
    p.gain({ potion: mealOf(top.kind) });
    this.bus.emit('cook', { meal: mealOf(top.kind), part: top.kind });
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
    devlog.line(`alembic ${cell(x, y, z)}: intention ${polarity} -> ${r}${flask ? ` (${flask.potion})` : ''}`);
    if (r === 'brew' && flask) {
      this.particles.burst(x + 0.5, y + 1, z + 0.5, pal('light.gold'), 30, 3, 0.07);
      sfx3.reveal();
      this.pickups.add('flask', x + 0.5, y + 1, z + 0.5, this.room, null, PART_DROP_DELAY, flask);
      this.hud.toastDrinkHint('lab.brewed', { name: t(POTIONS[flask.potion].name), left: BREWS - a.brews, total: BREWS });
    } else if (r === 'boil') {
      this.particles.burst(x + 0.5, y + 1, z + 0.5, pal('ink.ash'), 24, 2, 0.1);
      sfx.hit(3);
      this.hud.toast('lab.boiled');
    } else if (r === 'cold') this.hud.toast('lab.cold');
  }

  /** Drink: the top of the hand, when it is a flask, is drunk at once and its potion heals (content/potions.ts). */
  private drink() {
    const p = this.player, top = p.active;
    if (!top || !isFlask(top)) { sfx.denied(); return; }
    const def = POTIONS[top.potion];
    const rooms = flaskRooms(top);
    p.takeActive();
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
      && !(this.below && this.doors.inDoorway(x, y, z));
    // a face in reach whose cell cannot take a block (a doorway, the world's edge) is refused like a
    // blocked placement, never thrown: only aiming at nothing throws the block
    if (!ok) { if (tap || hit) sfx.denied(); else this.throwTop(); return; }
    // the body reaching into the cell: a quarter of a block or less is nudged out and the block goes
    // down; deeper, the block waits in hand until the player steps clear (never thrown, never a jump)
    // the push is worked out now but applied only once the placement goes through (an item may cancel it)
    const over = cellOverlap(p.body, x, y, z);
    const push: [number, number] | null = over ? this.nudgeTarget(over) : [0, 0];
    if (over && (over.depth > PLACE_NUDGE_MAX || !push)) { sfx.denied(); return; }
    const top = p.active!;
    if (typeof top !== 'number') {
      this.pickups.add(isFlask(top) ? 'flask' : 'part', x + 0.5, y, z + 0.5, this.room, null, PART_DROP_DELAY, top);
      this.nudge(push!);
      p.takeActive();
      this.hands.placed();
      sfx.place();
      return;
    }
    const ev = this.bus.emit('blockPlace', { x, y, z, material: p.top });
    if (ev.cancelled) return;
    // the sky marks the player's block Placed only while it is being set (law 3.2, SKY.md §3.4)
    const sky = this.realm === 'sky' ? this.world as SkyWorldApi : null;
    if (sky) sky.placing = true;
    try { this.world.set(x, y, z, ev.material); } finally { if (sky) sky.placing = false; }
    this.debris.clearCell(x, y, z);
    this.nudge(push!);
    p.takeActive();
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
    const top = p.active!;
    if (typeof top !== 'number') {
      const part = this.pickups.add(isFlask(top) ? 'flask' : 'part', e.x, e.y, e.z, this.room, null, PART_DROP_DELAY, top);
      const speed = 9 * this.stats.get('throw');
      this.pickups.launch(part, dir.x * speed + p.body.vx, dir.y * speed + 2, dir.z * speed + p.body.vz);
      p.takeActive();
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
    p.takeActive();
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
          this.player.gain(carried);
          this.hands.holdUp(carriedDef(carried));
          if (typeof carried === 'object') {
            if (isFlask(carried)) this.hud.toastDrinkHint('hand.took', { item: this.carriedName(carried) });
            else this.hud.toast('hand.took', { item: this.carriedName(carried) });
          }
          sfx.pickup();
        }
        continue;
      }
      if (p.type === 'heart' ? this.collectHeart(p.heart) : this.collect(p.type, 1)) {
        this.pickups.take(p);
        this.particles.burst(p.x, p.y + 0.3, p.z, p.type === 'heart' ? pal(HEART_FX[p.heart]) : PICKUP_FX[p.type], 10, 2, 0.06);
      }
    }
  }

  /** Walking up to a closed chest opens it, spending its keys (some cost none). A guarded chest is not
   *  opened here: its Boundary opens the Sanctuary first (see touchGuards). */
  private touchChests() {
    const b = this.player.body;
    for (const c of this.chests) {
      if (c.opened || c.spec.guard) continue;
      const s = c.spec, dist = Math.hypot(b.x - (s.x + 0.5), b.z - (s.z + 0.5));
      if (dist > 3) c.refused = false;
      if (c.refused || dist > 1.5 || b.y < s.y - 1.2 || b.y > s.y + 2.2) continue;
      if (s.meditation) {
        c.refused = true;
        this.openSanctuary((outcome, meditation) => this.answerTutorialChest(c, outcome, meditation), 1, () => this.rootsGuard(c.spec).next());
        continue;
      }
      this.openKeyedChest(c);
    }
  }

  private openKeyedChest(c: { spec: ChestSpec; opened: boolean; refused: boolean; view: ChestView }) {
    const s = c.spec;
    const ev = this.bus.emit('chestOpen', { x: s.x, y: s.y, z: s.z, cost: s.keys });
    const asked = Math.max(0, Math.floor(ev.cost));
    const question = asked > 0 && !ev.cancelled && this.potions.lockDiscount() > 0 && this.player.keys >= asked - 1;
    const cost = question ? asked - 1 : asked;
    if (ev.cancelled || this.player.keys < cost) {
      c.refused = true;
      this.hud.toast('toast.chestLocked', { n: cost });
      sfx.denied();
      return;
    }
    this.player.keys -= cost;
    if (question) this.questioned();
    this.openChest(c, cost);
  }

  private answerTutorialChest(c: { spec: ChestSpec; opened: boolean; refused: boolean; view: ChestView }, outcome: Outcome, meditation: SequenceId) {
    if (c.opened) return;
    if (outcome === 'cancel') {
      c.refused = true;
      this.hud.toast('sanctuary.cancelled');
      return;
    }
    const sitting = sittingPayload(outcome, meditation, 'roots');
    if (sitting) this.bus.emit('meditationComplete', sitting);
    this.openSanctuaryChest(c, outcome);
    this.releaseBoundary(c.spec.room);
  }

  /** Walking up to the Boundary of a vault opens the Sanctuary, its meditation app, for the chest it keeps
   *  (docs/design/built/presences/MEDITATION-APP.md). After a "not now" it waits until the player has stepped
   *  three blocks away from the Boundary. */
  private touchGuards() {
    if (this.hud.tollOpen || this.hud.sanctuaryOpen || this.hud.bannerOpen) return;
    const b = this.player.body;
    for (const e of this.enemies.list) {
      if (!e.alive || !e.tags.has('boundary')) continue;
      const dist = Math.hypot(e.body.x - b.x, e.body.z - b.z);
      const near = dist <= TALK_REACH && Math.abs(e.body.y - b.y) <= 2;
      const c = this.chests.find(q => q.spec.guard && !q.opened && q.spec.room === e.room);
      if (!c) continue;
      if (dist > 3) c.refused = false;
      if (c.refused || !near) continue;
      this.openSanctuary((outcome, meditation) => this.answerGuard(c, outcome, meditation));
      return;
    }
  }

  /** Opens the Sanctuary over the paused world and hands the mouse back to play when it closes. `rate` speeds
   *  its clock for the debug console only. */
  openSanctuary(done: (outcome: Outcome, meditation: SequenceId) => void, rate = 1, guard: () => number = () => this.rng.stream('guard').next()) {
    if (this.hud.sanctuaryOpen) return;
    this.input.modal = true;
    this.input.unlockFor();
    this.hud.sanctuary.show((outcome, meditation) => {
      this.input.modal = false;
      if (this.input.device === 'keyboard') { this.input.release(); this.input.lock(); }
      else this.input.resume();
      done(outcome, meditation);
    }, rate, guard);
  }

  /** The Sanctuary sittings' random draws for a Roots chest: one fork per chest, continued across a "not now" (REWARDS §5). */
  private rootsGuard(s: ChestSpec): Rng {
    const key = `${s.x},${s.y},${s.z}`;
    let g = this.rootsGuards.get(key);
    if (!g) { g = rootsFork(this.rng, 'guard', s.x, s.y, s.z); this.rootsGuards.set(key, g); }
    return g;
  }

  /** The Sanctuary closed. The quick reward draws a tier 1 or 2 practice and a finished meditation a tier 3 or
   *  4 one: the reward spawns from the chest and the Boundary leaves. Not now gives nothing: the chest stays
   *  locked, and the Boundary opens the Sanctuary again once the player has stepped away (more than three
   *  blocks) and come back. An opened chest ignores a second answer, so the reward is given once. */
  private answerGuard(c: { spec: ChestSpec; opened: boolean; refused: boolean; view: ChestView }, outcome: Outcome, meditation: SequenceId) {
    if (c.opened) return;
    if (outcome === 'cancel') {
      c.refused = true;
      this.hud.toast('sanctuary.cancelled');
      return;
    }
    const sitting = sittingPayload(outcome, meditation, 'vault');
    if (sitting) this.bus.emit('meditationComplete', sitting);
    this.openSanctuaryChest(c, outcome);
    this.releaseBoundary(c.spec.room);
  }

  private openSanctuaryChest(c: { spec: ChestSpec; opened: boolean; view: ChestView }, outcome: Exclude<Outcome, 'cancel'>) {
    const [lo, hi] = rewardBand(outcome);
    const maxQuality = c.spec.meditation ? 3 : hi;
    const band: [number, number] = [lo, Math.min(hi, maxQuality)];
    // a Sanctuary on floor 0 is the Roots': its practice comes from the Roots' fork and never marks an item taken
    const s = c.spec;
    const def = bandOf(s.y) === FIRST_FLOOR
      ? ITEM_BY_ID.get(drawRootsPractice(this.pools, rootsFork(this.rng, 'gift', s.x, s.y, s.z), band, this.rootsDrawn)) ?? null
      : ITEM_BY_ID.get(this.pools.drawRuntime('treasure', this.rng.stream('loot'), band)) ?? null;
    this.openChest(c, 0, def ?? undefined);
  }

  /** The Boundary of a vault leaves once its chest has opened. */
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
    const out: { type: PickupKind | 'item'; def: ItemDef | null }[] = [];
    if (s.item) out.push({ type: 'item', def: this.pedestalDef(s) });
    else if (reward) out.push({ type: 'item', def: reward });
    else {
      // a free chest of the Roots draws from its own fork and its practice from the Roots' pool (REWARDS §5): it never moves
      // the loot stream the floors below read. Any other chest draws from the loot stream as before.
      const roots = s.draws !== undefined;
      out.push(...rollChestContents(roots ? rootsFork(this.rng, 'open', s.x, s.y, s.z) : this.rng.stream('loot'), {
        floor: depthOf(s.y), luck: this.stats.get('luck'), draws: s.draws,
        practice: roots
          ? (r, band) => ITEM_BY_ID.get(drawRootsPractice(this.pools, r, band, this.rootsDrawn)) ?? null
          : (r, band) => ITEM_BY_ID.get(this.pools.drawRuntime('treasure', r, band)) ?? null,
      }));
    }
    devlog.line(`chest ${cell(s.x, s.y, s.z)}: opened for ${cost} key(s), contents ${out.map(o => o.type === 'item' ? (o.def?.id ?? 'none') : o.type).join(', ') || 'nothing'}`);
    out.forEach((o, i) => this.spits.push({ t: lead + i * 0.16, run: () => {
      const spread = out.length > 1 ? (i / (out.length - 1) - 0.5) * 1.1 : 0;
      const p: Pickup = this.pickups.add(o.type, cx, s.y + 1.02, cz, s.room, o.def, 0.6);
      const speed = (o.type === 'item' ? 1.7 : 1.5) / 0.68;
      this.ejectReward(p, speed, 6.5, spread);
      this.particles.burst(cx, s.y + 1, cz, pal('light.gold'), o.type === 'item' ? 22 : 10, 2.5, 0.07);
      if (o.type === 'item') sfx3.reveal(); else sfx3.spit();
    } }));
    // once the last thing has left the mouth the chest is empty: its model and its block go (issue #156)
    const world = this.world;
    this.spits.push({ t: Math.max(lead + out.length * 0.16, OPEN_TIME + 0.3), run: () => this.removeChest(c, world) });
  }

  /**
   * An opened chest that has dispensed everything leaves its world: its model, and its block (so no collision).
   * The chest belongs to the dungeon's world, so if a realm swap came first the removal waits in the queue until
   * the dungeon is current again: clearing the same cell in the sky's world would remove a block that is not the chest's.
   */
  private removeChest(c: { spec: ChestSpec; view: ChestView }, world: VoxelSpace) {
    if (this.world !== world) { this.spits.push({ t: 0.25, run: () => this.removeChest(c, world) }); return; }
    const s = c.spec;
    world.set(s.x, s.y, s.z, AIR);
    this.chestViews.remove(c.view);
  }

  private updateSpits(dt: number) {
    // over a snapshot: a run may queue itself again (a removal waiting for its world), and that waits for the next frame
    for (const q of [...this.spits]) { q.t -= dt; if (q.t <= 0) q.run(); }
    this.spits = this.spits.filter(q => q.t > 0);
  }

  /** Somewhere new without walking there (a star pad, heaven, silence): find room to stand, then
   *  let the HUD, the fog and the floor bookkeeping catch up (review L4–L6 points 3 and 5). */
  private teleport(x: number, y: number, z: number) {
    const fx0 = Math.floor(x), fz0 = Math.floor(z);
    if (!this.below) {
      // the sky never edits its world to make room: it finds a cell to stand in (SKY.md §2.5a)
      const [cx, cy, cz] = this.skyRealm().placeAt([fx0, Math.floor(y), fz0]);
      this.player.spawnAt(cx + 0.5, cy, cz + 0.5);
      this.room = -1;
      this.zone = '';
      return;
    }
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
    if (this.pendingPresenceOffer) return;
    const b = this.player.body;
    for (const e of this.enemies.list) {
      if (!e.alive || e.hidden || !e.tags.has('presence') || e.tags.has('met') || e.tags.has('silent')) continue;
      const near = Math.hypot(e.body.x - b.x, e.body.z - b.z) <= TALK_REACH && Math.abs(e.body.y - b.y) <= 2;
      if (!near) { e.tags.delete('answering'); e.tags.delete('offer-declined'); continue; }
      if (e.tags.has('offer-declined')) continue;
      const id = e.def as PresenceId, talk = PRESENCE_TALK[id];
      // the offer itself scans the whole hand in order, as the owner's consent rule asks; a refusal names the active item
      const top = this.player.active;
      const offer = findPresenceOffer(id, this.player.hand);
      if (!offer) {
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
      this.pendingPresenceOffer = { id, enemyId: e.id, index: offer.index, carried: offer.carried };
      this.hud.presenceOfferCard(talk.name, offer.carried);
      this.input.modal = true;
      this.input.unlockFor();
      return;
    }
  }

  private resolvePresenceOffer(accept: boolean) {
    const pending = this.pendingPresenceOffer;
    if (!pending) return;
    this.pendingPresenceOffer = null;
    this.hud.closePresenceOffer();
    this.input.modal = false;
    this.input.suppress('cast', 'place', 'jump', 'throw', 'bomb', 'polarity', 'confirm', 'back');
    this.input.resume();

    const e = this.enemies.list.find(enemy => enemy.id === pending.enemyId);
    const carried = this.player.hand[pending.index];
    if (!e?.alive || !e.tags.has('presence') || e.tags.has('met') || carried !== pending.carried || !unlocksPresence(pending.id, carried)) {
      this.hud.toast('presence.offer.stale');
      return;
    }
    if (!accept) {
      e.tags.add('offer-declined');
      sfx.denied();
      return;
    }

    this.player.removeAt(pending.index);
    this.hands.placed();
    const color = typeof carried === 'object' && !isFlask(carried) ? carried.color : pal('bone.dim');
    const eye = this.player.eye, fwd = this.player.forward;
    this.particles.burst(eye.x + fwd.x * 0.6, eye.y - 0.4, eye.z + fwd.z * 0.6, color, 10, 1.2, 0.05);
    const talk = PRESENCE_TALK[pending.id];
    e.tags.add('met');
    if (talk.drops) this.dropListenerReward(e);
    this.particles.burst(e.body.x, e.body.y + 1.2, e.body.z, pal('light.gold'), 8, 1.2, 0.05);
    if (leavesAfterOffer(pending.id)) this.releaseListener(e);
    this.hud.presenceCard(talk.name, talk.lines);
  }

  /** The Listener's reward is chosen when its heart is accepted, not while the floor is built. */
  private dropListenerReward(e: Enemy) {
    const gift = rollListenerGift(this.rng.stream('drops'));
    const rewards = gift.kind === 'practice'
      ? [{ type: 'item' as const, item: gift.item }]
      : gift.hearts.map(heart => ({ type: 'heart' as const, heart }));
    this.launchGiftPickups(e, rewards);
    sfx3.reveal();
  }

  /** A Listener leaves once it has dropped its reward. It is removed from the world, so its silence leaves with it
   *  (owner decision on #65: the room returns to normal). */
  private releaseListener(e: Enemy) {
    this.particles.burst(e.body.x, e.body.y + 1.5, e.body.z, pal('bone.paper'), 14, 1.6, 0.06);
    this.enemies.dissolve(e);
    this.bus.off(null, `actor:${e.id}`);
    this.actors.remove(e.id);
    this.contacts.forget(e.id);
    this.presenceReplies.delete(e.id);
  }

  private pushPresences() {
    const b = this.player.body;
    for (const e of this.enemies.list) {
      if (!e.alive || e.hidden || !(e.tags.has('presence') || e.tags.has('boundary'))) continue;
      // the box the presence is hit with, not its birth size (#102)
      if (b.y + b.h <= e.body.y || b.y >= e.body.y + e.body.h) continue;
      const at = pushedOut(b.x, b.z, e.body.x, e.body.z, e.body.hw / 2 + b.hw);
      if (at && !boxHits((x, y, z) => this.solid(x, y, z), at.x, b.y, at.z, b.hw, b.h)) { b.x = at.x; b.z = at.z; }
    }
  }

  /** Makes a carried item the active one (the next use targets it): a sound and a notice; slots out of the hand are ignored. */
  chooseCarried(slot: number) {
    const p = this.player;
    if (slot < 0 || slot >= p.hand.length || slot === p.activeIndex) return;
    p.select(slot);
    sfx.select();
    this.hud.carriedChanged();
    this.hud.toast('hand.active', { item: this.carriedName(p.active!) });
  }

  /** The wheel and the D-pad step the active carried item through the hand, wrapping round. */
  private stepCarried(step: 1 | -1) {
    const n = this.player.hand.length;
    if (n > 1) this.chooseCarried((this.player.activeIndex + step + n) % n);
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
    // the top of the sky, and the last star, lead up into the sky realm (SKY.md §2.4): the gate runs the fade
    const fx0 = Math.floor(b.x), fy = Math.floor(b.y + 0.05), fz0 = Math.floor(b.z);
    const pad = b.onGround ? this.tree.pads.findIndex(q => q.x === fx0 && q.y === fy && q.z === fz0) : -1;
    const up = pad >= 0 && this.tree.pads[pad].up === true;
    if (up || b.y > SKY_TOP) {
      const travel = RealmGate.check('dungeon', b, up ? { up: true } : null, this.skyBounds());
      if (travel) { this.gate.start(travel); return; }
    }
    // star pads: step on one and you are on the next star of its constellation
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
    // a height that is not finite has no story: streaming waits, and the watch warns once a run (height-watch.ts)
    if (!this.heightWatch.check(this.player.eye.y)) return;
    const s = this.storyOf(this.player.eye.y);
    if (!Number.isFinite(s) || s === this.story) return;
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
      this.bus.emit('roomEnter', { room: r.id, floor: r.floor, type: r.type, template: r.template, firstVisit: first });
      this.roots?.enterRoom(r.floor === FIRST_FLOOR ? r : undefined);
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

  /** A floor's boss is overcome once per boss room: `how` says whether its health reached zero, it turned to your side, or it ended in stillness. */
  private bossDown(floor: number, how: 'destroyed' | 'converted' | 'stillness') {
    const st = this.bossRooms.get(floor);
    if (!st || st.defeated) return;
    st.defeated = true;
    st.t = HOLE_DELAY;
    this.doors.seal(st.room, false);
    this.roomState.get(st.room)!.cleared = true;
    const f = this.floors.get(floor)!;
    if (f.boss) this.bus.emit('bossOvercome', { boss: f.boss, floor, how });
    this.revealBossItem(f);
    this.hud.toast('toast.bossDown');
    this.hud.shake(0.6);
    sfx3.clear();
  }

  /** The boss bar follows the one fight the player is in: the spawned boss of this room, alive, while the player lives. Called every underground frame outside the simulation step, so it also runs under the death screen, a menu, the pause card and the R fade; a death, a reset (which clears bossRooms) or leaving the room hides it, and only a resumed fight shows it again. */
  private syncBossBar() {
    const st = [...this.bossRooms.values()].find(s => s.spawned && s.room === this.room);
    const boss = st && !this.player.dead ? this.enemies.list.find(e => e.alive && e.spec.kind === 'boss' && e.room === st.room) : undefined;
    this.hud.bossBar(boss ? { name: enemyText(boss.spec).name, ratio: boss.hp / boss.maxHp } : null);
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
    if (!st.defeated || st.open) return;
    const hole = f.hole;
    st.t -= dt;
    if (hole) this.crackHole(hole, Math.min(1, 1 - st.t / HOLE_DELAY));
    if (st.t > 0 || !hole) return;
    if (tollOf(k)) {
      if (!this.standsOnHole(hole)) st.asked = false;
      // the toll waits for an open achievement card (ACHIEVEMENTS §4): it is asked once the card is read
      else if (!st.asked && tollMayOpen(this.keeper.showable, this.hud.bannerOpen)) { st.asked = true; this.hud.openToll(this, k); }
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
    openHole(this.dw, hole);
    this.particles.burst(hole.x + hole.size / 2, hole.yTop + 1, hole.z + hole.size / 2, pal('limestone.dark'), 40, 4, 0.15);
    this.hud.shake(0.5);
    this.hud.toast('toast.wayDown');
    sfx3.rumble();
  }

  payToll(k: number, ids: readonly string[]): boolean {
    const toll = tollOf(k), f = this.floors.get(k), st = this.bossRooms.get(k);
    const p = this.player;
    if (!toll || !f?.hole || !st || p.dead || new Set(ids).size !== ids.length || ids.length !== toll.count) return false;
    const hands: number[] = [], items: string[] = [], base: number[] = [], bonus: number[] = [];
    let keys = 0, bombs = 0;
    for (const id of ids) {
      const [kind, at] = id.split(':'), i = tollIndex(at);
      if (i === null) return false;
      if (kind === 'item' ? !toll.practices : toll.practices) return false;
      if (kind === 'hand') { if (!(i < p.hand.length)) return false; hands.push(i); }
      else if (kind === 'key') { if (!(i < p.keys)) return false; keys++; }
      else if (kind === 'bomb') { if (!(i < p.bombs)) return false; bombs++; }
      else if (kind === 'heart') base.push(i);
      else if (kind === 'layer') bonus.push(i);
      else if (kind === 'item') { const held = this.inventory.items[i]; if (!held) return false; items.push(held.def.id); }
      else return false;
    }
    // every heart is checked before anything is taken: a refused payment spends nothing
    const plan = heartTollPlan(p.hp, Math.floor(this.stats.get('maxHearts')), p.layers, base, bonus);
    if (!plan) return false;
    for (const i of hands.sort((a, b) => b - a)) p.removeAt(i);
    p.keys -= keys;
    p.bombs -= bombs;
    for (const id of items) this.inventory.lose(id);
    if (items.length) this.hud.setItems(this.inventory.items.map(i => i.def));
    // a base heart takes its capacity and the health it holds; a bonus heart goes whole and leaves base health alone
    if (base.length) this.stats.add({ stat: 'maxHearts', layer: 'add', value: -base.length, source: 'toll' });
    p.hp = plan.hp;
    this.clampHealth();
    for (const j of [...plan.layers].sort((a, b) => b - a)) this.heartLost(p.layers.splice(j, 1)[0].kind);
    st.open = true;
    openHole(this.dw, f.hole);
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

  get fov() { return this.fovNow; }

  setFov(v: number) {
    const fov = applyFov(this.camera, v);
    this.hud.setFov(fov);
    if (fov === this.fovNow) return;
    sfx3.fov(fov > this.fovNow);
    this.fovNow = fov;
    saveSettings({ v: 1, fov });
  }

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
    const ctx = this.player.dead ? 'dead' : this.hud.sanctuaryOpen ? 'meditation' : this.hud.screenOpen ? 'inventory' : this.hud.tollOpen ? 'toll' : !playing ? 'paused' : this.hud.bannerOpen ? 'prompt' : 'play';
    const restartBy = inp.hitBy('restart');
    if (restartBy === 'keyboard' ? ctx === 'play' || ctx === 'dead' : restartBy && (ctx === 'paused' || ctx === 'dead')) this.requestRestart();
    else if (ctx === 'dead' && this.deadT > DEATH_GRACE && inp.hit('confirm')) this.requestRestart();
    if (ctx === 'paused' && (inp.hit('confirm') || (inp.hitBy('pause') ?? 'keyboard') !== 'keyboard')) inp.resume();
    else if (ctx === 'play' && inp.hit('pause')) inp.release();
    if (this.restartT > 0) {
      this.restartT -= dt;
      if (this.restartT <= 0) { if (this.sandbox) this.newSandbox(this.sandbox); else this.newRun(); this.revealT = 0; }
    } else if (this.revealT >= 0) {
      // stay dark until the new world is meshed, so it never pops in
      this.revealT += dt;
      if ((!this.chunks.busy && !this.wallsLoading) || this.revealT > RESTART_HOLD_MAX) { this.revealT = -1; this.hud.fadeIn(); }
    }
    this.gate.update(dt);
    // an information banner stays until clicked; that click only dismisses it
    if (ctx === 'prompt' && this.hud.presenceOfferOpen) {
      const confirmedBy = inp.hitBy('confirm');
      if (confirmedBy && confirmedBy !== 'touch') this.resolvePresenceOffer(true);
      else if (inp.hit('back')) this.resolvePresenceOffer(false);
    } else if (ctx === 'prompt' && inp.hit('confirm')) {
      this.hud.confirmBanner();
      inp.suppress('cast', 'place', 'jump', 'throw', 'bomb', 'polarity', 'confirm');
    }
    if (ctx === 'play' || ctx === 'paused' || ctx === 'inventory') {
      const by = inp.hitBy('inventory');
      if (by) this.hud.screenKey(this, by);
    }
    if (ctx === 'paused') {
      const n = inp.navigate();
      if (n.x) this.setFov(stepFov(this.fovNow, n.x));
    }
    if (ctx === 'inventory') {
      if (inp.hit('back')) this.hud.closeScreen(this);
      else {
        const n = inp.navigate();
        if (this.hud.menuShown) { if (n.x) this.setFov(stepFov(this.fovNow, n.x)); }
        else if (n.x || n.y) this.hud.moveSelection(n.x, n.y);
      }
      // a number key picks its slot; Enter or A picks the highlighted carried item
      if (inp.hit('pick')) { const d = inp.digit(); this.chooseCarried(d >= 0 ? d : this.hud.selectedCarried()); }
    }
    if (ctx === 'toll') {
      if (inp.hit('back')) this.hud.closeToll(this);
      else {
        const n = inp.navigate();
        if (n.x || n.y) this.hud.moveSelection(n.x, n.y);
        if (inp.hit('confirm')) this.hud.confirmToll(this);
      }
    }
    if (ctx === 'meditation') this.hud.sanctuary.input(inp, performance.now());
    this.touch.update(this, ctx);
    this.showAchievement(ctx);
    const running = playing && !this.player.dead && !this.hud.screenOpen && !this.hud.tollOpen && !this.hud.sanctuaryOpen && !this.transitioning;
    // the sandbox moves in fixed steps, one per frame, so a session can be replayed
    if (running && !this.hud.presenceOfferOpen && !this.paused) this.simulate(this.sandbox ? SANDBOX_DT : dt);
    if (this.below) { this.stream(); this.chunks.streamOuter(this.player.eye.x, this.player.eye.z); } else this.sky!.stream(this.player.eye);
    this.chunks.update();
    const p = this.player, e = p.eye;
    const below = this.below;
    const sky = !below || e.y > SURFACE_Y - 4;
    this.chunks.setVisibleRange(e.y - (sky ? 60 : 22), e.y + (sky ? 120 : 22), sky);
    this.stars.position.set(e.x, 0, e.z);

    // camera with a little walking bob and explosion shake
    const bob = Math.sin(p.walkPhase * 3.2) * 0.035;
    const sh = this.hud.shakeAmount();
    this.camera.position.set(e.x + fx.spread(sh / 2), e.y + bob + fx.spread(sh / 2), e.z + fx.spread(sh / 2));
    this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ');

    // fog: dark dungeon below, sky above; the element your eyes are in closes it in
    const fog = this.scene.fog as THREE.Fog;
    if (below) {
      const k = THREE.MathUtils.smoothstep(e.y, SURFACE_Y - 3, SURFACE_Y + 2);
      this.fogColor.copy(LEVEL_FOG[Math.min(LAST_FLOOR, depthOf(e.y))] ?? DUNGEON_FOG).lerp(SKY, k);
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
    } else this.sky!.atmosphere(e, this.fogColor, fog, this.stars);
    easeMaster(dt);
    this.chunks.animate(this.time);
    this.renderer.setClearColor(this.fogColor);

    this.camera.getWorldDirection(this.camDir);
    spatial.listener(this.camera.position.x, this.camera.position.y, this.camera.position.z, this.camDir.x, this.camDir.z);
    this.updateRoots();
    // the Sanctuary covers the whole screen: the world under it is not drawn while it does
    if (!this.hud.sanctuary.covering) {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      this.renderer.clearDepth();
      this.renderer.render(this.hands.scene, this.hands.camera);
    }

    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 0.5) { this.fps = Math.round(this.fpsN / this.fpsAcc); this.fpsAcc = 0; this.fpsN = 0; }
    if (this.below) this.syncBossBar();
    this.hud.update(this, running || this.transitioning, dt);
    inp.endFrame();
  }

  private simulate(dt: number) {
    this.time += dt;
    this.breakSfx = this.breakFx = this.elemFx = this.elemSfx = 0;
    const inp = this.input;
    const solid = (x: number, y: number, z: number) => this.solid(x, y, z);
    const b = this.player.body;
    const below = this.below;
    this.player.update(dt, inp, this.stats.all, solid, {
      jump: v => { const ev = this.bus.emit('jump', { velocity: v }); return ev.cancelled ? null : ev.velocity; },
      land: (fall, x, y, z) => {
        // falls never hurt in the sky, and the dungeon's floor bands do not apply there (SKY.md §2.5a)
        const cause = !below ? 'sky' : bandOf(b.y) !== this.groundBand ? 'descent' : 'fall';
        this.bus.emit('land', { fallSpeed: fall, cause, x, y, z });
      },
      bump: speed => this.headBump(speed),
    }, this.playerMedium, below ? {} : { minJump: 1 });
    if (below && b.onGround) this.groundBand = bandOf(b.y);
    this.clampHealth();
    this.updateHearts(dt);
    this.touchBlocks(dt);
    this.syncWeapon();
    this.tapMissile();
    if (this.weapon) this.weapon.update(dt);
    if (!this.weapon || WEAPONS_KEEPING_SHOT.has(this.weaponId)) this.fire();
    this.tryPlace();
    if (inp.hit('throw')) this.throwTop();
    if (inp.hit('drink')) this.drink();
    if (inp.hit('bomb')) this.placeBomb();
    if (inp.hit('polarity')) this.togglePolarity();
    if (inp.hit('previous')) this.stepCarried(-1);
    if (inp.hit('next')) this.stepCarried(1);
    // a number key, or a tap on a slot of the hand (touch), makes that carried item the active one
    if (inp.hit('pick')) this.chooseCarried(inp.digit() >= 0 ? inp.digit() : inp.hitBy('pick') === 'touch' ? inp.touchSlot : -1);
    if (below) this.doors.update(dt, b.x, b.y, b.z, b.hw, b.h, d => this.requestDoor(d));
    this.debris.update(dt);
    this.elements.update(dt);
    this.debrisElements(dt);
    this.playerElements(dt);
    this.touchDebris();
    this.cubeStrikes();
    this.shoveCubes();
    this.touchPickups();
    if (below) this.touchChests();
    this.intents.update(dt);
    this.updateMissiles(dt);
    this.enemyElements(dt);
    this.enemies.update(dt);
    this.blasts.run(b => this.blast(b));
    this.bus.flush();
    if (below) {
      this.trackPlace(dt);
      this.updateLoop(dt);
      this.updateOmens(dt);
      this.updateCombat(dt);
      this.updateChallenges(dt);
      this.updateSpits(dt);
    } else {
      this.skyGate();
      this.sky!.update(dt);
    }
    this.pickups.update(dt, solid);
    if (below) this.chestViews.update(dt, this.player.keys);
    this.particles.update(dt);
    this.debrisView.update(this.debris);
    this.missileView.update(this.missiles.list);
    this.cutHalves.update(dt);
    this.cracks.update(this.world);
    // the active item is the one in the right hand; the item under the choice goes in the other
    const p = this.player, active = p.activeIndex;
    this.hands.update(dt, p.walkPhase, p.active ?? 0, p.hand.filter((_, i) => i !== active).at(-1) ?? 0);
  }

  requestRestart() {
    if (this.transitioning) return;
    this.restartT = RESTART_FADE;
    this.hud.fadeOut(RESTART_FADE);
    sfx3.restart();
  }

  act(act: string) {
    if (act === 'presence-offer-accept') this.resolvePresenceOffer(true);
    else if (act === 'presence-offer-decline') this.resolvePresenceOffer(false);
    else if (act === 'restart' && (this.player.dead || !this.input.playing || this.hud.screenOpen)) this.requestRestart();
    else if (act === 'resume' && !this.player.dead) {
      if (this.hud.screenOpen) this.hud.closeScreen(this);
      else this.input.resume();
    }
    else if (act === 'inventory' && this.hud.screenOpen) this.hud.closeScreen(this);
    else if (act === 'tab-menu') this.hud.openScreen(this, 'menu');
    else if (act === 'tab-items') this.hud.openScreen(this, 'items');
    else if (act === 'fov-down' || act === 'fov-up') this.setFov(stepFov(this.fovNow, act === 'fov-up' ? 1 : -1));
  }

  /** Rooms whose projections are all released (the minimap lights them). */
  private clearedRooms() {
    const out = new Set<number>();
    for (const [id, st] of this.roomState) if (st.cleared && this.visited.has(id)) out.add(id);
    return out;
  }

  /** Fading between runs (R): the world is frozen and the screen goes dark. */
  get transitioning() { return this.restartT > 0 || this.revealT >= 0 || this.gate.busy; }

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
      realm: this.below ? 'dungeon' : `sky · ${this.sky!.set.world.stats().exceptions} exceptions · ${this.sky!.set.world.stats().cached} cached chunks`,
    };
  }
}
