// The practices the Roots lay on their pedestals and on the altar (docs/design/not-built/levels/roots/REWARDS.md §4):
// drawn once at run start, after every pedestal of every floor has been reserved, so a Roots practice can never take
// a reserved one. Each draw comes from its own fork of the run's seed and is marked taken, so no later chest gives it
// again. Pure: the game calls it and places what it returns.

import type { RunRandom } from '../core/rng';
import { EXTRA_PRACTICE_BAND, rootsRewards } from '../content/tables/roots-mastery';
import type { ItemPools } from '../items/pool';

/** A spot of floor 0 that holds a practice: the block's cell (`FloorResult.practices` and `altar`). */
export interface RootsSpot { readonly room: number; readonly x: number; readonly y: number; readonly z: number }

/** The key of a spot in the map `drawRootsItems` returns. */
export const spotKey = (s: RootsSpot) => `${s.room}:${s.x},${s.y},${s.z}`;

/**
 * Draws the item of every extra practice (band ★ to ★★★, fork `floor/0/roots/practice/<i>`) and of the altar, if the
 * level has one (band from the table, fork `floor/0/roots/altar`). Returns the item id per spot.
 */
export function drawRootsItems(
  pools: ItemPools,
  rr: RunRandom,
  f: { readonly practices: readonly RootsSpot[]; readonly altar: RootsSpot | null },
  level: number,
): Map<string, string> {
  const out = new Map<string, string>();
  f.practices.forEach((spot, i) => {
    const band: readonly [number, number] = [EXTRA_PRACTICE_BAND.min, EXTRA_PRACTICE_BAND.max];
    out.set(spotKey(spot), pools.drawRuntime('treasure', rr.fork('floor', 0, 'roots', 'practice', i), band));
  });
  const altar = rootsRewards(level).altar;
  if (f.altar && altar) {
    out.set(spotKey(f.altar), pools.drawRuntime('treasure', rr.fork('floor', 0, 'roots', 'altar'), [altar.min, altar.max]));
  }
  return out;
}
