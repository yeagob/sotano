// Totality's three strata above the crown (docs/architecture/SKY.md §8). Stub (K0): TT builds it.

import type { Stratum } from '../types';

export const STRATA: readonly Stratum[] = [
  { id: 0, name: 'lower', y0: 221, y1: 420, materials: [], sizes: [3, 2] },
  { id: 1, name: 'mid', y0: 420, y1: 700, materials: [], sizes: [2] },
  { id: 2, name: 'upper', y0: 700, y1: 980, materials: [], sizes: [2, 1] },
];

export const stratumAt = (_y: number): Stratum | null => null;
