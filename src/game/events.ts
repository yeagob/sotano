// Game event catalogue: every place where items (and synergies) can step in.
// Payload fields are mutable unless noted; hooks may change them or call `cancel()`
// (only below priority 200). The game reads the payload back after `emit` and acts on it.

import { EventBus } from '../core/events';
import type { DamageKind } from '../core/damage';
import type { ActorId, ActorKind, Faction, Owner } from '../entities/actors';
import type { Polarity } from '../combat/polarity';
import type { HeartKind } from '../content/heart-art';
import type { LayerKind } from '../entities/hearts';

export type { Owner } from '../entities/actors';

export type CubeAction = 'pickup' | 'kick' | 'ignore';
/** How the player casts (docs/architecture/WEAPONS.md). `intent` is the default shot. */
export type WeaponId = 'intent' | 'blade' | 'beam' | 'greatcut';
export const WEAPON_IDS: readonly WeaponId[] = ['intent', 'blade', 'beam', 'greatcut'];
/** Weapons that are used alongside the intention instead of replacing it. */
export const WEAPONS_KEEPING_SHOT: ReadonlySet<WeaponId> = new Set<WeaponId>(['blade']);
export type PickupKind = 'key' | 'bomb' | 'heart';
/** Where a chain reaction started and how many links deep it is (an explosion set off by an
 *  explosion has `gen + 1`). Chains stop at MAX_CHAIN_GEN. */
export interface Cause { origin: string; gen: number }


export interface GameEvents {
  // ── shooting ──
  /** On cast: the intention can be modified or the shot cancelled. */
  fire: { intent: IntentSpec };
  /** The player toggled the loaded intention's polarity (BESTIARY §1.1). React only. */
  polarityChange: { from: Polarity; to: Polarity };
  /** A weapon that replaces the intention is about to act (a swing, a beam's release, a great cut).
   *  `damage` (to each actor hit, per tick for the beam), `mining` (to blocks) and `reach` (blocks)
   *  can be changed, or cancel to stop it. */
  /** `polarity` is the loaded intention's: every hit of the stroke follows it (combat/polarity.ts). */
  strike: { weapon: WeaponId; damage: number; mining: number; reach: number; color: number; tags: Set<string>; polarity: Polarity };
  intentHit: { kind: 'actor' | 'cube' | 'block'; target: number; x: number; y: number; z: number; nx: number; ny: number; nz: number; vx: number; vy: number; vz: number; intent: IntentSpec };
  /** An intention rebounded off a block (`bounce` is 1 for its first rebound, 2… after). `x, y, z` is the bounce point,
   *  `nx, ny, nz` the face normal and `vx, vy, vz` the reflected velocity: hooks may change the velocity and the spec.
   *  New intentions born at the bounce point go in `launch`; the core adds them after the frame's loop, so it is safe
   *  to launch from here. React or modify only: it cannot be cancelled. */
  intentBounce: IntentBounce;

  // ── blocks in the world ──
  /** Before damage is applied to a block. `amount` already accounts for the material's armor. */
  blockDamage: { x: number; y: number; z: number; material: number; amount: number; kind: DamageKind; source: string };
  /** The block reached 0 HP. Cancel to keep it; `spawnDebris = false` makes it vanish without a loose cube.
   *  `source` says who broke it ('intent', 'contact', 'chain', 'explosion:volatile'…). */
  blockBreak: { x: number; y: number; z: number; material: number; kind: DamageKind; source: string; spawnDebris: boolean };
  /** Placing a block from your hand. `material` can be swapped (e.g. "placed blocks become TNT"). */
  blockPlace: { x: number; y: number; z: number; material: number };
  /** The player walked into a solid block. The core shatters it when `crush` is true
   *  (it starts as "tier ≤ the crush stat"; hooks may flip it either way). */
  touchBlock: { x: number; y: number; z: number; material: number; crush: boolean };
  /** The player's head hit a solid block while jumping (once per block above). The core breaks it
   *  when `breaks` is true (it starts as "tier ≤ the headbutt stat"; hooks may flip it). */
  headBump: { x: number; y: number; z: number; material: number; speed: number; breaks: boolean };
  /** Something exploded. Radius and damage can be changed before blocks are hit.
   *  `damage` is for blocks, `actorDamage` (points) for every actor in range.
   *  Explosions are queued and run a few per frame; `cause` says which chain this one belongs to. */
  explosion: { x: number; y: number; z: number; radius: number; damage: number; actorDamage: number; source: string; owner: Owner; cause: Cause };
  /** One of the player's own bombs or missiles went off (`source` 'bomb' or 'missile'), either polarity:
   *  a negative blast after it hit its blocks and actors, a love explosion (positive) after it mended them.
   *  `radius` is the blast's real radius. Never a volatile cube or another item's explosion. `acted` holds
   *  the ids of the practices that already acted on this blast: a practice held twice acts once per blast. */
  bombBlast: { x: number; y: number; z: number; radius: number; polarity: Polarity; source: string; acted: Set<string> };
  /** Loot rolled for a broken block (after the break). Hooks may add, remove or replace drops. */
  blockLoot: { x: number; y: number; z: number; material: number; source: string; drops: PickupKind[] };
  /** A pulse went off: damage to the projections in a sphere, from an item's burst (`source` is the item's id).
   *  React only. Kindling and Stolen Fire burst this way; Hearth listens for it. */
  burst: { x: number; y: number; z: number; radius: number; damage: number; source: string };

  // ── elements (docs/architecture/ELEMENTS.md §9) ──
  /** Fire or lava is about to set a flammable block alight (the block burns away into a flame).
   *  Cancel to keep it. `by` says what lit it. */
  ignite: { x: number; y: number; z: number; material: number; by: 'fire' | 'lava' };
  /** Two elements meet (`reaction` is a row of content/reactions.ts): the cell at (x, y, z) becomes
   *  `result` (a material id; 0 = it is simply gone). Change it to another material, or cancel. */
  materialReact: { x: number; y: number; z: number; reaction: string; result: number };
  /** An actor's body went into an element (`depth`: 'feet' or 'head'). React only. */
  elementEnter: { target: ActorId; targetKind: ActorKind; def: string; element: 'water' | 'lava' | 'fire'; depth: 'feet' | 'head' };
  /** An actor's body left an element. React only. */
  elementLeave: { target: ActorId; targetKind: ActorKind; def: string; element: 'water' | 'lava' | 'fire' };

  // ── loose cubes ──
  /** Walking into a loose cube. The core pre-fills `action` (pickup if your hand has room,
   *  kick otherwise; bombs are always kicked) and then does whatever is left in it. */
  touchCube: { cube: number; material: number; held: number; carry: number; bomb: boolean; action: CubeAction };
  /** About to place a bomb at your feet. Change the fuse, or cancel. */
  bombPlace: { fuse: number };
  /** About to launch a bomb as a missile (a quick double tap with the `missile` stat). `speed` is the
   *  steady speed (blocks/s) and `range` how far it flies (blocks); `polarity` decides the blast
   *  (negative: a bomb blast; positive: a love explosion). Change them, or cancel: no bomb is spent. */
  missileLaunch: { speed: number; range: number; polarity: Polarity };
  /** Kicking a loose cube. `tags` end up on the cube (see `debrisImpact`). */
  kick: { cube: number; material: number; speed: number; lift: number; tags: Set<string> };
  /** Throwing the top block of your hand (Q, or right click with nowhere to place it). */
  throw: { cube: number; material: number; speed: number; lift: number; tags: Set<string> };
  /** A block left your hand, however it happened (placed or thrown). React only. */
  drop: { material: number; how: 'place' | 'throw' };
  /** A tagged cube (thrown or kicked) hit something hard. Its tags are cleared afterwards
   *  unless a hook sets `keepTags`. */
  debrisImpact: { cube: number; x: number; y: number; z: number; material: number; speed: number; tags: Set<string>; keepTags: boolean };

  // ── movement ──
  /** About to jump. Change `velocity` for higher jumps, or cancel. `air` is the jump's step on the
   *  ladder when it is made in the air (1 = the first air jump, 2 = the second; absent on the ground). */
  jump: { velocity: number; air?: number };
  /** Touched the ground after falling. React only. `cause` is 'descent' for the shaft to the next floor, 'sky' in the sky. */
  land: { fallSpeed: number; cause: 'fall' | 'descent' | 'sky'; x: number; y: number; z: number };

  // ── actors (the player and projections; docs/architecture/ACTORS.md) ──
  // Hooks on actorDamage, contact and actorDeath must say which actors they are for
  // (`hook(..., { target: 'player' })`): one event covers everyone.
  /** Anything about to hurt an actor, in damage points (a heart is 8; the player loses exactly
   *  that, shown in quarter hearts). Cancel to ignore it. `polarity` is set for player intentions
   *  (shots and weapon strokes), already halved if positive; the ceiling of positive ones is applied after this event. */
  actorDamage: { target: ActorId; targetKind: ActorKind; def: string; amount: number; kind: DamageKind; source: string; owner: Owner; knockback: number; cause?: Cause; polarity: Polarity | null };
  /** A projection touches an actor it is hostile to (at most once per pair every 0.5 s):
   *  `toTarget` and `toAttacker` are damage points. */
  contact: { attacker: ActorId; attackerDef: string; target: ActorId; targetKind: ActorKind; toTarget: number; toAttacker: number };
  /** About to heal the player, in damage points (4 = half a heart). */
  heal: { amount: number; source: string };
  /** The player reached 0 hearts. Cancel to survive (with whatever health a hook sets). */
  death: { source: string };
  /** An actor changed side (react only), e.g. a projection that became part of the self. */
  factionChange: { target: ActorId; targetKind: ActorKind; def: string; from: Faction; to: Faction; source: string };
  /** An actor is gone (react only). `drops` can be changed (projections drop them). */
  actorDeath: { target: ActorId; targetKind: ActorKind; def: string; x: number; y: number; z: number; drops: PickupKind[] };
  /** An intention entered a water or lava cell, once per entry (not again while it stays in that element). Hooks may change
   *  the world (`ItemApi.convertFluid`), never the intention: the element is read again after the hooks, so lava that a hook
   *  made where the intention is puts it out, and water that a hook made does not. */
  intentElement: { intent: IntentSpec; x: number; y: number; z: number; element: 'water' | 'lava' };

  // ── projections ──
  /** A projection is about to materialise. Every number here can be changed (`contactDamage` in points). */
  enemySpawn: { id: ActorId; def: string; hp: number; speed: number; contactDamage: number; tags: Set<string>; x: number; y: number; z: number };

  // ── dungeon ──
  /** A bomb caught a door: it is about to be blown apart for good (open forever, never
   *  sealed or locked again). Cancel to keep it. */
  doorBreak: { door: number; locked: boolean; source: string };
  /** A door wants to open. Locked doors ask for a key: hooks may set `needsKey = false`. */
  doorOpen: { door: number; locked: boolean; needsKey: boolean };
  /** The player walks up to a closed chest. `cost` (keys, 0 = free) can be changed; cancel to keep it shut. */
  chestOpen: { x: number; y: number; z: number; cost: number };
  /** Collecting a key, bomb or heart. `amount` can be changed (or cancel to leave it there). */
  pickupCollect: { kind: PickupKind; amount: number; readonly heart?: HeartKind };
  heartLost: { readonly heart: LayerKind };
  berserkChange: { readonly on: boolean };
  itemGained: { id: string; uid: number };
  roomEnter: { room: number; floor: number; type: string; template: string; firstVisit: boolean };
  /** Every projection of a room is gone; its doors open. `drops` is the room reward. */
  roomClear: { room: number; drops: PickupKind[] };
  /** The player entered a floor; `arrival` is that floor's arrival point (its feet position). */
  floorEnter: { depth: number; arrival: { x: number; y: number; z: number } };
  /** A run's end advanced the Roots' page (PAGES §1): the new current page, once per run. React only. */
  pageReached: { page: number };

  brew: { potion: string; iced: boolean; contents: number; x: number; y: number; z: number };
  drink: { potion: string; rooms: number };
  /** A boss of a floor was overcome, once per boss room (ACHIEVEMENTS §1): its health reached zero (`destroyed`), it turned
   *  to the player's side (`converted`), or the Shadow's own ending was reached by standing still beside it (`stillness`). `mastery` is the Roots' mastery level the run was carved
   *  with (read at run start, 0 in a run started on the debug level), which the global difficulty follows (#352, #353). React only. */
  bossOvercome: { boss: string; floor: number; how: 'destroyed' | 'converted' | 'stillness'; mastery: number };
  /** A Sanctuary opened by a Boundary (the Roots' chest or a vault's) ended with `complete` (ACHIEVEMENTS §1). `seconds` is
   *  the time of every sitting finished in that visit, each at its full length (the hour achievement adds them up). React only. */
  meditationComplete: { meditation: string; source: 'roots' | 'vault'; seconds: number };
  /** A kitchen cooked a part into a meal (game/kitchen.ts). React only. */
  cook: { meal: string; part: string };
  /** The player died on the band `floor` (0 is the Roots, -1 the surface). Emitted only once the death stands: no hook
   *  cancelled `death`. React only (ACHIEVEMENTS §1). */
  playerDied: { floor: number; source: string };
  /** The player's body went from the Roots up into the surface band, where the giant tree begins (ACHIEVEMENTS §1). React only. */
  surfaceEnter: { from: number };
  /** A block was placed from the hand. `afterPact` is true once the player has made the Listener's pact (saved). React only. */
  blockPlaced: { afterPact: boolean };
  /** The tutorial book's shown page turned back one page: `from` was a tutorial page (1 to 6), now it is `page`. React only. */
  bookBack: { from: number; page: number };
  /** The player's body touches bedrock on one side: `side` is above, below, north, south, east or west. Emitted once when a
   *  side starts to touch it. React only. */
  bedrockTouch: { side: string };
  /** The body, above the surface, entered a new story of the giant tree (`story` is its key: roots, rings, galleries,
   *  hollows, branches, canopy or stars). The canopy is the crown (ACHIEVEMENTS §1). React only. */
  treeStory: { story: string };
  /** The run holds the six branch practices of the giant tree at once (issue #329, BRANCHES.md), however each was taken.
   *  Emitted once a run, by the game. `practices` is how many there are (6). React only. */
  branchPracticesAll: { practices: number };
  /** The completion percentage reached 100: every part is complete (COMPLETION.md §8). Emitted once, by the game. React only. */
  completionFull: { percent: number };
  /** A projection turned to the player's side (`convert`, once per conversion). `boss` is true for a boss, whose own
   *  achievements count it (ACHIEVEMENTS §1). React only. */
  projectionConverted: { def: string; boss: boolean };
  /** A hostile projection died of harm: its health reached zero (`hurtEnemy`, the explosions, the hazards), so a
   *  self-ending (an alarm's blast, a fall) is not one. `boss` as above. React only. */
  projectionDestroyed: { def: string; boss: boolean };
  /** A practice gained turned the synergy `synergy` (its id) on: the first time in this inventory it met its
   *  requirement. A state of being is one of these (ACHIEVEMENTS §1). React only. */
  synergyOn: { synergy: string };
  /** A presence is met for the first time on this enemy: its first exchange is done (the gift taken, the choice answered,
   *  the toll paid, the ore given, the Child's build finished), the rule the codex keeps (CODEX.md). `presence` is its id
   *  ('boatman', 'star-reader'…). Once per presence and encounter; the achievements count it once in the save. React only (ACHIEVEMENTS §1). */
  presenceMet: { presence: string };
  /** The ending of illumination (ILLUMINATION.md): the last checkpoint carried the player into the Sun and the screen
   *  is all light; the card is shown. Once per run, by the game. `friends` is the run's befriended beings (ally-tally.ts).
   *  React only (ACHIEVEMENTS §1). */
  illumination: { friends: number };
}

/** A rebound of an intention, as the `intentBounce` event carries it. */
export interface IntentBounce {
  intent: IntentSpec;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  nx: number; ny: number; nz: number;
  bounce: number;
  /** Intentions launched at the bounce point, added by hooks: `bounce` is the rebound count they start with. */
  launch: { spec: IntentSpec; vx: number; vy: number; vz: number; bounce: number }[];
}

/** An intention. Its three targets take separate, absolute amounts (docs/architecture/ACTORS.md §2). */
export interface IntentSpec {
  /** Damage to actors (projections). */
  damage: number;
  /** Positive mends what it touches; negative harms it (combat/polarity.ts). */
  polarity: Polarity;
  /** Damage to blocks, before the material's armor. */
  mining: number;
  /** How hard it shoves loose cubes. */
  knock: number;
  speed: number;      // blocks/s
  flight: number;     // seconds flying straight before dropping
  gravity: number;    // blocks/s²
  radius: number;
  pierce: number;     // blocks it can break through and keep going
  pierceTier: number; // highest tier `pierce` works on (0 = soft blocks only)
  phase: number;      // blocks of any tier it passes through, damaging each one on the way
  color: number;
  /** Labels effects can add and react to (e.g. 'burning'). */
  tags: Set<string>;
  volley: number;
  bounces: number;
  homing: number;
  /** What homing steers toward: the nearest block, or the nearest projection (Eye Contact). */
  homingTarget: 'block' | 'projection';
  /** Positive only (the Transcendent state): an aura of `absorb` times its radius. It takes every destructible block it
   *  touches, adds their armor to its damage, and warms each projection it touches. 0 or absent: no aura. */
  absorb?: number;
  /** How the intention flies as three strands (combat/intents.ts): set from the `triad` and `spiral` stats. */
  formation?: Formation;
}

/** The shape of an intention's strands: a triangle that widens over the flight (`triad`, Rule of Three),
 *  a helix that turns (`spiral`, Spiral Growth), or both (the triangle turns). */
export interface Formation { triad: boolean; spiral: boolean }

export type GameBus = EventBus<GameEvents>;
/** Emitted only by the core loop (depth 0). `death` is emitted right after `actorDamage`
 *  returns, at the same depth, so a hit that passed the depth cap also reaches `death`. */
export const ROOT_EVENTS = ['death', 'doorOpen', 'enemySpawn', 'roomClear', 'floorEnter', 'playerDied', 'surfaceEnter', 'bookBack', 'bedrockTouch', 'treeStory'] as const satisfies readonly (keyof GameEvents)[];
export const createBus = (): GameBus => new EventBus<GameEvents>(ROOT_EVENTS);
