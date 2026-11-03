// Wind: a gust volume that pushes while the player is in it (docs/architecture/SKY.md §6). Stub (K0): H0 builds it.

import type { WindParams, Hindrance } from '../types';

export const wind: Hindrance<WindParams> = {
  id: 'wind',
  telegraph: (_ctx, p) => ({ at: p.from, update() {}, end() {} }),
  effect: (_ctx, p) => ({ at: p.from, update: () => false, end() {} }),
};
