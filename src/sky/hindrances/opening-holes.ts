// Opening holes: cracked cells turn to transient air, then return (docs/architecture/SKY.md §6). Stub (K0): H1 builds it.

import type { OpeningHolesParams, Hindrance } from '../types';

export const openingHoles: Hindrance<OpeningHolesParams> = {
  id: 'opening-holes',
  telegraph: (_ctx, _p) => ({ at: { x: 0, y: 0, z: 0 }, update() {}, end() {} }),
  effect: (_ctx, _p) => ({ at: { x: 0, y: 0, z: 0 }, update: () => false, end() {} }),
};
