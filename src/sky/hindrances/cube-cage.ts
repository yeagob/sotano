// Cube cage: transient cubes round the player, never over a drop (docs/architecture/SKY.md §6). Stub (K0): H2 builds it.

import type { CubeCageParams, Hindrance } from '../types';

export const cubeCage: Hindrance<CubeCageParams> = {
  id: 'cube-cage',
  telegraph: (_ctx, p) => ({ at: p.around, update() {}, end() {} }),
  effect: (_ctx, p) => ({ at: p.around, update: () => false, end() {} }),
};
