// Game event catalogue: every place where items (and synergies) can step in.
// Payload fields are mutable unless noted; hooks may change them or call `cancel()`
// (only below priority 200). The game reads the payload back after `emit` and acts on it.

import { EventBus } from '../core/events';
import type { DamageKind } from '../core/damage';

export type CubeAction = 'pickup' | 'kick' | 'ignore';
export type PickupKind = 'key' | 'bomb' | 'heart';
/** Who caused something: the player, a specific enemy, or the world itself. */
export type Owner = 'player' | 'world' | `enemy:${number}`;

export interface GameEvents {
  // ── shooting ──
  /** On cast: the intention can be modified or the shot cancelled. */
  fire: { intent: IntentSpec };

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
  /** Something exploded. Radius and damage can be changed before blocks are hit.
   *  `actorDamage` is in half-hearts for the player (enemies take it ×4 as HP). */
  explosion: { x: number; y: number; z: number; radius: number; damage: number; actorDamage: number; source: string; owner: Owner };
  /** Loot rolled for a broken block (after the break). Hooks may add, remove or replace drops. */
  blockLoot: { x: number; y: number; z: number; material: number; source: string; drops: PickupKind[] };

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

  // ── health ──
  /** Anything about to hurt the player, in half-hearts. Cancel to ignore it. */
  playerDamage: { amount: number; kind: string; source: string; owner: Owner };
  /** About to heal the player, in half-hearts. */
  heal: { amount: number; source: string };
  /** The player reached 0 hearts. Cancel to survive (with whatever health a hook sets). */
  death: { source: string };

  // ── enemies (projections) ──
  /** An enemy is about to materialise. Every number here can be changed. */
  enemySpawn: { uid: number; def: string; hp: number; speed: number; contactDamage: number; tags: Set<string>; x: number; y: number; z: number };
  /** Anything about to hurt an enemy, in HP. */
  enemyDamage: { uid: number; def: string; amount: number; kind: string; source: string; owner: Owner; knockback: number };
  /** The player and an enemy touch: how much each takes (half-hearts / HP). */
  enemyContact: { uid: number; def: string; toPlayer: number; toEnemy: number };
  /** An enemy dissolved. `drops` can be changed. */
  enemyDeath: { uid: number; def: string; x: number; y: number; z: number; drops: PickupKind[] };

  // ── dungeon ──
  /** A door wants to open. Locked doors ask for a key: hooks may set `needsKey = false`. */
  doorOpen: { door: number; locked: boolean; needsKey: boolean };
  /** Collecting a key, bomb or heart. `amount` can be changed (or cancel to leave it there). */
  pickupCollect: { kind: PickupKind; amount: number };
  itemGained: { id: string; uid: number };
  roomEnter: { room: number; type: string; firstVisit: boolean };
  /** Every projection of a room is gone; its doors open. `drops` is the room reward. */
  roomClear: { room: number; drops: PickupKind[] };
  floorEnter: { depth: number };
}

export interface IntentSpec {
  damage: number;
  mining: number;
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
export const createBus = (): GameBus => new EventBus<GameEvents>();
