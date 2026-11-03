// Dense ground: marked cells slow the feet on them (docs/architecture/SKY.md §6). Stub (K0): H2 builds it.

import type { DenseGroundParams, Hindrance } from '../types';

export const denseGround: Hindrance<DenseGroundParams> = {
  id: 'dense-ground',
  telegraph: (_ctx, _p) => ({ at: { x: 0, y: 0, z: 0 }, update() {}, end() {} }),
  effect: (_ctx, _p) => ({ at: { x: 0, y: 0, z: 0 }, update: () => false, end() {} }),
};
