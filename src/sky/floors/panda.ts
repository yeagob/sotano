// Sky floor 1, the panda's (docs/design/not-built/sky/guardians/PANDA.md, B6). Stub (K0): F1 builds it.

import type { Rng } from '../../core/rng';
import type { SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

export const panda: SkyFloorGen = {
  animal: 'panda', index: 1, radius: 20, height: 28,
  generate(_rng: Rng, o: Vec3): SkyFloorPlan {
    const seat = { id: 0, kind: 'seat' as const, x: o.x, y: o.y, z: o.z, w: 1, d: 1, tag: 0 };
    return {
      index: 1, animal: 'panda', y0: o.y, y1: o.y + 28,
      shapes: [], graph: { places: [seat], links: [] },
      seat, spawns: [], nests: [], route: [],
      gate: { x: o.x, z: o.z, r: 0 }, platforms: [],
    };
  },
};
