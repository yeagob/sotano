// Sky floor 2, the koala's (docs/design/not-built/sky/guardians/KOALA.md, B6). Stub (K0): F2 builds it.

import type { Rng } from '../../core/rng';
import type { SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

export const koala: SkyFloorGen = {
  animal: 'koala', index: 2, radius: 22, height: 32,
  generate(_rng: Rng, o: Vec3): SkyFloorPlan {
    const seat = { id: 0, kind: 'seat' as const, x: o.x, y: o.y, z: o.z, w: 1, d: 1, tag: 0 };
    return {
      index: 2, animal: 'koala', y0: o.y, y1: o.y + 32,
      shapes: [], graph: { places: [seat], links: [] },
      seat, spawns: [], nests: [], route: [],
      gate: { x: o.x, z: o.z, r: 0 }, platforms: [],
    };
  },
};
