// Damage to blocks (docs/architecture/ACTORS.md §2). Damage to actors and damage to blocks are
// separate numbers everywhere: an intention carries `damage` (actors) and `mining` (blocks),
// an explosion `actorDamage` and `damage`. Nothing multiplies one by the other.

import type { MaterialDef } from '../content/materials';

export type DamageKind = 'intent' | 'explosion' | 'fire' | 'crush' | 'kick' | 'melee' | 'contact' | 'projectile' | 'item';

/** Minimum fraction of damage that always gets through: "with enough intent, everything breaks". */
export const MIN_DAMAGE_FRACTION = 0.1;

/** Damage a block of material `m` takes from a hit of `amount` (block damage, e.g. an intent's `mining`). */
export function blockDamage(amount: number, m: MaterialDef): number {
  if (!isFinite(m.hp)) return 0;
  return Math.max(amount - m.armor, amount * MIN_DAMAGE_FRACTION);
}

/** Hits needed to break an intact block (handy for balancing and tests). */
export function hitsToBreak(amount: number, m: MaterialDef): number {
  const d = blockDamage(amount, m);
  return d > 0 ? Math.ceil(m.hp / d - 1e-9) : Infinity;
}
