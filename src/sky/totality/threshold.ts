// The closed threshold of the Sun (docs/architecture/SKY.md §8). Stub (K0): TT builds it.

import type { SkyHost, ThresholdApi, TotalityPlan } from '../types';

export class Threshold implements ThresholdApi {
  readonly touched = false;
  constructor(_host: SkyHost, _plan: TotalityPlan) {}
  update(_dt: number) {}
}
