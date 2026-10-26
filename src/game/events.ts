// Game event catalogue: every place where items (and synergies) can step in.
// Payload fields are mutable unless noted; hooks may change them or call `cancel()`
// (only below priority 200). The game reads the payload back after `emit` and acts on it.

import { EventBus } from '../core/events';
import type { DamageKind } from '../core/damage';

export type CubeAction = 'pickup' | 'kick' | 'ignore';

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
  /** Something exploded. Radius and damage can be changed before blocks are hit. */
  explosion: { x: number; y: number; z: number; radius: number; damage: number; source: string };

  // ── loose cubes ──
  /** Walking into a loose cube. The core pre-fills `action` (pickup if your hand has room,
   *  kick otherwise) and then does whatever is left in it. */
  touchCube: { cube: number; material: number; held: number; carry: number; action: CubeAction };
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
  /** Touched the ground after falling. React only (fall damage, stomps… later). */
  land: { fallSpeed: number };

  // ── dungeon ──
  /** A door wants to open. Locked doors ask for a key: hooks may set `needsKey = false`. */
  doorOpen: { door: number; locked: boolean; needsKey: boolean };
  keyPickup: { count: number };
  itemGained: { id: string; uid: number };
  roomEnter: { room: number; type: string; firstVisit: boolean };
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
}

export type GameBus = EventBus<GameEvents>;
export const createBus = (): GameBus => new EventBus<GameEvents>();
