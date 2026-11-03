// Fall recovery in Totality (docs/architecture/SKY.md §4). Stub (K0): L2 builds it.

import type { Place, SkyHost, UpdraftApi } from '../types';

/** Blocks below the last checkpoint where the updraft catches the player. */
export const CATCH = 20;
/** Seconds the carry back takes. */
export const CARRY = 1.6;

export class Updraft implements UpdraftApi {
  readonly checkpoint: Place | null = null;
  readonly carrying = false;
  constructor(_host: SkyHost, _checkpoints: readonly Place[]) {}
  update(_dt: number) {}
}
