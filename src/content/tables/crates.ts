// Crates (issue #6): a broken crate sometimes gives back one key, heart or small bomb. Most crates
// still give nothing, so a drop stays a reward. The chance is set per floor (issue #48): each floor
// draws its own chance from the run's seed, between a third of CRATE_DROP and CRATE_DROP. The roll
// itself runs on the runtime `drops` stream, so it never changes the level's structure.

import { table } from '../../core/tables';
import type { Rng, RunRandom } from '../../core/rng';
import type { PickupKind } from '../../game/events';

/** The top of the range: the chance a crate on the least lucky floor of a seed gives anything. */
export const CRATE_DROP = 0.3;
/** The bottom of the range: a third of CRATE_DROP. */
export const CRATE_DROP_MIN = CRATE_DROP / 3;

export const CRATE_CONTENTS = table<PickupKind>('crate', 'runtime', [
  { value: 'key', weight: 3, luck: 0.2 },
  { value: 'heart', weight: 3, luck: 0.2 },
  { value: 'bomb', weight: 2, luck: 0.2 },
]);

/**
 * The chance a crate on `floor` gives anything: uniform in [CRATE_DROP_MIN, CRATE_DROP], drawn from
 * the floor's own fork of the run's seed (`fork('floor', k, 'crate')`). Pure in (seed, floor): the
 * same seed gives the same chance, and drawing it never moves another stream. Surface crates (above
 * floor 0) use floor 0's chance, as they count as depth 0.
 */
export function floorCrateChance(rr: RunRandom, floor: number): number {
  const u = rr.fork('floor', floor, 'crate').next();
  return CRATE_DROP_MIN + (CRATE_DROP - CRATE_DROP_MIN) * u;
}

/** The drop of one broken crate: nothing (most of the time) or one pickup. `chance` is the floor's. */
export function rollCrate(rng: Rng, chance: number, ctx: { floor: number; luck?: number }): PickupKind | null {
  if (!rng.chance(chance)) return null;
  return CRATE_CONTENTS.roll(rng, ctx) ?? null;
}
