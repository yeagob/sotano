// The kitchen (docs/design/built/laboratory): one tile on the odd floors 1, 3, 5 and 7. Right click
// with a part on top of the hand cooks it into a meal. Three cooks per kitchen per run. Cooking has no
// polarity and no effect on projections; it is separate from the alembic's brewing.

import type { PartKind } from '../content/parts';
import type { PotionId } from '../content/potions';

/** Cooks per kitchen per run. */
export const COOKS = 3;

export interface Kitchen { cooks: number }

export function newKitchen(): Kitchen { return { cooks: COOKS }; }

export function isOut(k: Kitchen) { return k.cooks <= 0; }

/** Flesh (the body) makes a half-heart meal; heart, mind and essence make a one-heart meal. */
export function mealOf(kind: PartKind): PotionId {
  return kind === 'flesh' ? 'meal-small' : 'meal-hearty';
}

/** Spends one cook. False when the kitchen has none left. */
export function cook(k: Kitchen): boolean {
  if (isOut(k)) return false;
  k.cooks--;
  return true;
}
