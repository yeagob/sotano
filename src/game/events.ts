// Game event catalogue: every place where items (and synergies) can step in.
// Payload fields are mutable unless noted; hooks may change them or call `cancel()`
// (only below priority 200). The game reads the payload back after `emit` and acts on it.

import { EventBus } from '../core/events';
import type { DamageKind } from '../core/damage';
import type { ActorId, ActorKind, Faction, Owner } from '../entities/actors';

export type { Owner } from '../entities/actors';

export type CubeAction = 'pickup' | 'kick' | 'ignore';
/** How the player casts (docs/architecture/WEAPONS.md). `intent` is the default shot. */
export type WeaponId = 'intent' | 'blade' | 'beam' | 'greatcut';
export const WEAPON_IDS: readonly WeaponId[] = ['intent', 'blade', 'beam', 'greatcut'];
export type PickupKind = 'key' | 'bomb' | 'heart';
/** Where a chain reaction started and how many links deep it is (an explosion set off by an
 *  explosion has `gen + 1`). Chains stop at MAX_CHAIN_GEN. */
export interface Cause { origin: string; gen: number }


export interface GameEvents {
  // ── shooting ──
  /** On cast: the intention can be modified or the shot cancelled. */
  fire: { intent: IntentSpec };
  /** A weapon that replaces the intention is about to act (a swing, a beam's release, a great cut).
   *  `damage` (to each actor hit, per tick for the beam), `mining` (to blocks) and `reach` (blocks)
   *  can be changed, or cancel to stop it. */
  strike: { weapon: WeaponId; damage: number; mining: number; reach: number; color: number; tags: Set<string> };

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
  /** Loot rolled for a broken block (after the break). Hooks may add, remove or replace drops. */
  blockLoot: { x: number; y: number; z: number; material: number; source: string; drops: PickupKind[] };

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
  /** About to jump. Change `velocity` for higher jumps, or cancel. */
  jump: { velocity: number };
  /** Touched the ground after falling. React only. `cause` is 'descent' for the shaft to the next floor. */
  land: { fallSpeed: number; cause: 'fall' | 'descent' };

  // ── actors (the player and projections; docs/architecture/ACTORS.md) ──
  // Hooks on actorDamage, contact and actorDeath must say which actors they are for
  // (`hook(..., { target: 'player' })`): one event covers everyone.
  /** Anything about to hurt an actor, in damage points (a heart is 8; the player loses exactly
   *  that, shown in quarter hearts). Cancel to ignore it. */
  actorDamage: { target: ActorId; targetKind: ActorKind; def: string; amount: number; kind: DamageKind; source: string; owner: Owner; knockback: number; cause?: Cause };
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

  // ── projections ──
  /** A projection is about to materialise. Every number here can be changed (`contactDamage` in points). */
  enemySpawn: { id: ActorId; def: string; hp: number; speed: number; contactDamage: number; tags: Set<string>; x: number; y: number; z: number };

  // ── dungeon ──
  /** A door wants to open. Locked doors ask for a key: hooks may set `needsKey = false`. */
  doorOpen: { door: number; locked: boolean; needsKey: boolean };
  /** The player walks up to a closed chest. `cost` (keys, 0 = free) can be changed; cancel to keep it shut. */
  chestOpen: { x: number; y: number; z: number; cost: number };
  /** Collecting a key, bomb or heart. `amount` can be changed (or cancel to leave it there). */
  pickupCollect: { kind: PickupKind; amount: number };
  itemGained: { id: string; uid: number };
  roomEnter: { room: number; type: string; firstVisit: boolean };
  /** Every projection of a room is gone; its doors open. `drops` is the room reward. */
  roomClear: { room: number; drops: PickupKind[] };
  floorEnter: { depth: number };
}

/** An intention. Its three targets take separate, absolute amounts (docs/architecture/ACTORS.md §2). */
export interface IntentSpec {
  /** Damage to actors (projections). */
  damage: number;
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
  color: number;
  /** Labels effects can add and react to (e.g. 'burning'). */
  tags: Set<string>;
}

export type GameBus = EventBus<GameEvents>;
/** Emitted only by the core loop (depth 0). `death` is emitted right after `actorDamage`
 *  returns, at the same depth, so a hit that passed the depth cap also reaches `death`. */
export const ROOT_EVENTS = ['death', 'doorOpen', 'enemySpawn', 'roomClear', 'floorEnter'] as const satisfies readonly (keyof GameEvents)[];
export const createBus = (): GameBus => new EventBus<GameEvents>(ROOT_EVENTS);
