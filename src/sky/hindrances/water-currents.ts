// Water currents: timed source water down a channel bed (docs/architecture/SKY.md §6). Stub (K0): H3 builds it.

import type { WaterCurrentsParams, Hindrance } from '../types';

export const waterCurrents: Hindrance<WaterCurrentsParams> = {
  id: 'water-currents',
  telegraph: (_ctx, p) => ({ at: { x: p.channel.head[0], y: p.channel.head[1], z: p.channel.head[2] }, update() {}, end() {} }),
  effect: (_ctx, p) => ({ at: { x: p.channel.head[0], y: p.channel.head[1], z: p.channel.head[2] }, update: () => false, end() {} }),
};
