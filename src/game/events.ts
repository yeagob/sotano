// Game event catalogue. Items hook into these (see content/items.ts).

import { EventBus } from '../core/events';
import type { DamageKind } from '../core/damage';

export interface GameEvents {
  /** On fire: the intention can be modified or the shot cancelled. */
  fire: { intent: IntentSpec };
  /** Before damage is applied to a block. `amount` already accounts for the material's armor. */
  blockDamage: { x: number; y: number; z: number; material: number; amount: number; kind: DamageKind; source: string };
  /** The block broke. `spawnDebris = false` makes it vanish without a physics cube. */
  blockBreak: { x: number; y: number; z: number; material: number; kind: DamageKind; spawnDebris: boolean };
  blockPlace: { x: number; y: number; z: number; material: number };
  pickup: { material: number };
  kick: { material: number; speed: number };
  intentHit: { x: number; y: number; z: number; intent: IntentSpec; target: 'block' | 'debris' | 'none' };
}

export interface IntentSpec {
  damage: number;
  mining: number;
  speed: number;     // blocks/s
  flight: number;    // seconds flying straight before dropping
  gravity: number;   // blocks/s²
  radius: number;
  pierce: number;    // soft (tier 0) blocks it pierces
  color: number;
}

export type GameBus = EventBus<GameEvents>;
export const createBus = (): GameBus => new EventBus<GameEvents>();
