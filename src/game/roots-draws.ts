// The practices the Roots lay on their pedestals and on the altar (docs/design/built/levels/roots/REWARDS.md §4-§5),
// and every other draw floor 0 makes on the Roots' account. Each draw comes from its own fork of the run's seed under
// `floor/0/roots/…` (docs/architecture/RNG.md), so nothing the mastery level adds moves a shared stream. A Roots draw
// reads the pool but never marks an item taken (`ItemPools.drawRoots`), so a later floor draws from the same pool at
// every level; the items the Roots drew are kept in `drawn`, so the Roots never offer the same practice twice.
// Pure: the game calls these and places what they return.

import type { Rng, RunRandom } from '../core/rng';
import { EXTRA_PRACTICE_BAND, rootsRewards } from '../content/tables/roots-mastery';
import type { ItemPools } from '../items/pool';

/** A spot of floor 0 that holds a practice: the block's cell (`FloorResult.practices` and `altar`). */
export interface RootsSpot { readonly room: number; readonly x: number; readonly y: number; readonly z: number }

/** The key of a spot in the map `drawRootsItems` returns. */
export const spotKey = (s: RootsSpot) => `${s.room}:${s.x},${s.y},${s.z}`;

/** One of the Roots' pedestal sites: its spot, the fork path its draw takes and the band of its practice. */
export interface RootsSite {
  readonly key: string;
  readonly spot: RootsSpot;
  readonly path: readonly (string | number)[];
  readonly band: readonly [number, number];
}

/** The fork of one of floor 0's Roots draws: `floor/0/roots/…` followed by the decision's own path (RNG.md). */
export function rootsFork(rr: RunRandom, ...path: (string | number)[]): Rng {
  return rr.fork('floor', 0, 'roots', ...path);
}

/**
 * The extra practices (band ★ to ★★★, path `practice/<i>`) and the altar, if the level has one (band from the table,
 * path `altar`). Floor 0's carving says where they stand; this says what they are in order.
 */
export function rootsSites(f: { readonly practices: readonly RootsSpot[]; readonly altar: RootsSpot | null }, level: number): RootsSite[] {
  const sites: RootsSite[] = f.practices.map((spot, i) => ({
    key: spotKey(spot), spot, path: ['practice', i], band: [EXTRA_PRACTICE_BAND.min, EXTRA_PRACTICE_BAND.max],
  }));
  const altar = rootsRewards(level).altar;
  if (f.altar && altar) sites.push({ key: spotKey(f.altar), spot: f.altar, path: ['altar'], band: [altar.min, altar.max] });
  return sites;
}

/** One practice of the Roots: drawn from the pool in its band, never a reserved or held one, never one in `drawn`; then kept in `drawn`. */
export function drawRootsPractice(pools: ItemPools, rng: Rng, band: readonly [number, number] | undefined, drawn: Set<string>): string {
  const id = pools.drawRoots(rng, band, drawn);
  drawn.add(id);
  return id;
}

/**
 * Draws the item of every Roots site at run start, after every pedestal of every floor has been reserved. Returns the
 * item id per spot. `drawn` collects what the Roots drew, for the rest of the run.
 */
export function drawRootsItems(
  pools: ItemPools,
  rr: RunRandom,
  f: { readonly practices: readonly RootsSpot[]; readonly altar: RootsSpot | null },
  level: number,
  drawn: Set<string> = new Set(),
): Map<string, string> {
  const out = new Map<string, string>();
  for (const site of rootsSites(f, level)) out.set(site.key, drawRootsPractice(pools, rootsFork(rr, ...site.path), site.band, drawn));
  return out;
}

/**
 * A Roots pedestal whose practice the player has taken from elsewhere draws again: the `again` time of this site
 * (1, 2, …) names its fork, so each draw has its own numbers. Called once per such taking.
 */
export function redrawRootsSite(pools: ItemPools, rr: RunRandom, site: RootsSite, again: number, drawn: Set<string>): string {
  return drawRootsPractice(pools, rootsFork(rr, ...site.path, 'again', again), site.band, drawn);
}
