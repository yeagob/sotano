// Crates (issue #6): a broken crate sometimes gives back one key, heart or small bomb. Most crates
// still give nothing, so a drop stays a reward. Rolled on the runtime `drops` stream, so it never
// changes the level's structure.

import { table } from '../../core/tables';
import type { Rng } from '../../core/rng';
import type { PickupKind } from '../../game/events';

/** Chance a broken crate gives anything at all. */
export const CRATE_DROP = 0.3;

export const CRATE_CONTENTS = table<PickupKind>('crate', 'runtime', [
  { value: 'key', weight: 3, luck: 0.2 },
  { value: 'heart', weight: 3, luck: 0.2 },
  { value: 'bomb', weight: 2, luck: 0.2 },
]);

/** The drop of one broken crate: nothing (most of the time) or one pickup. */
export function rollCrate(rng: Rng, ctx: { floor: number; luck?: number }): PickupKind | null {
  if (!rng.chance(CRATE_DROP)) return null;
  return CRATE_CONTENTS.roll(rng, ctx) ?? null;
}
