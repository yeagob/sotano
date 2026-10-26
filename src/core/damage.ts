// Unified damage (see docs/TECHNICAL.md §4.5). In M0 blocks are the only target;
// enemies, the player and doors will go through the same function.

import type { MaterialDef } from '../content/materials';

export type DamageKind = 'intent' | 'explosion' | 'fire' | 'crush' | 'kick' | 'melee';

/** Minimum fraction of damage that always gets through: "with enough intent, everything breaks". */
export const MIN_DAMAGE_FRACTION = 0.1;

export function blockDamage(amount: number, mining: number, m: MaterialDef): number {
  if (!isFinite(m.hp)) return 0;
  const raw = amount * mining;
  return Math.max(raw - m.armor, raw * MIN_DAMAGE_FRACTION);
}

/** Hits needed to break an intact block (handy for balancing and tests). */
export function hitsToBreak(amount: number, mining: number, m: MaterialDef): number {
  const d = blockDamage(amount, mining, m);
  return d > 0 ? Math.ceil(m.hp / d - 1e-9) : Infinity;
}
