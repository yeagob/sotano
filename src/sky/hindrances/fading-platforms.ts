// Fading platforms: a whole platform turns to mist, then returns (docs/architecture/SKY.md §6). Stub (K0): H1 builds it.

import type { FadingPlatformsParams, Hindrance } from '../types';

export const fadingPlatforms: Hindrance<FadingPlatformsParams> = {
  id: 'fading-platforms',
  telegraph: (_ctx, _p) => ({ at: { x: 0, y: 0, z: 0 }, update() {}, end() {} }),
  effect: (_ctx, _p) => ({ at: { x: 0, y: 0, z: 0 }, update: () => false, end() {} }),
};
