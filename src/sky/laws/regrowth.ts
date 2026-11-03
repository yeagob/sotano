// Law 3.1, nothing stays broken (docs/architecture/SKY.md §4). Stub (K0): L1 builds it.

import type { CellTest, RegrowthApi, SkyHost, SkyWorldApi } from '../types';

/** Seconds a broken original block takes to return; it shimmers for the last second. */
export const REGROW = 5;
export const SHIMMER = 1;
/** Seconds between checks while the cell is occupied. */
export const REGROW_RETRY = 0.25;

export class Regrowth implements RegrowthApi {
  readonly pending = 0;
  constructor(_world: SkyWorldApi, _host: SkyHost, _occupied: CellTest) {}
  update(_dt: number) {}
  dispose() {}
}
