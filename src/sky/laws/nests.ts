// Block nests, shared term 6.3 (docs/architecture/SKY.md §4). Stub (K0): L1 builds it.

import type { NestsApi, Place, SkyHost } from '../types';

export const NEST_CUBES = 3;
/** Seconds until a taken cube is replaced. */
export const NEST_REFILL = 6;
/** A cube farther than this from the nest's centre counts as taken. */
export const NEST_REACH = 1.5;

export class Nests implements NestsApi {
  constructor(_host: SkyHost, _places: readonly Place[], _material: number) {}
  update(_dt: number) {}
  count(_place: number) { return 0; }
  dispose() {}
}
