// The tower knock: a warning, the placed cells into loose cubes, a push off (docs/architecture/SKY.md §5.3). Stub (K0): C1 builds it.

import type { SkyActor, SkyEffectsApi, SkyHost, Tower, TowerKnockApi } from '../types';

/** Seconds of warning before the knock. */
export const KNOCK_WARNING = 2;
/** Blocks the player is pushed off the tower. */
export const KNOCK_PUSH = 2;

export class TowerKnock implements TowerKnockApi {
  readonly busy = false;
  constructor(_host: SkyHost, _effects: SkyEffectsApi) {}
  start(_by: SkyActor | 'sun', _tower: Tower) {}
  update(_dt: number) {}
}
