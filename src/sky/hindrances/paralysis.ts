// Paralysis: a growing ring that holds a grounded player (docs/architecture/SKY.md §6). Stub (K0): H3 builds it.

import type { ParalysisParams, Hindrance } from '../types';

export const paralysis: Hindrance<ParalysisParams> = {
  id: 'paralysis',
  telegraph: (_ctx, p) => ({ at: p.from, update() {}, end() {} }),
  effect: (_ctx, p) => ({ at: p.from, update: () => false, end() {} }),
};
