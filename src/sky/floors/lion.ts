// Sky floor 4, the lion's (docs/design/not-built/sky/guardians/LION.md, B6). Stub (K0): F4 builds it.

import type { Rng } from '../../core/rng';
import type { SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

export const lion: SkyFloorGen = {
  animal: 'lion', index: 4, radius: 26, height: 36,
  generate(_rng: Rng, o: Vec3): SkyFloorPlan {
    const seat = { id: 0, kind: 'seat' as const, x: o.x, y: o.y, z: o.z, w: 1, d: 1, tag: 0 };
    return {
      index: 4, animal: 'lion', y0: o.y, y1: o.y + 36,
      shapes: [], graph: { places: [seat], links: [] },
      seat, spawns: [], nests: [], route: [],
      gate: { x: o.x, z: o.z, r: 0 }, platforms: [],
    };
  },
};
