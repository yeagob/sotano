// Sky floor 3, the elephant's (docs/design/not-built/sky/guardians/ELEPHANT.md, B6). Stub (K0): F3 builds it.

import type { Rng } from '../../core/rng';
import type { SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

export const elephant: SkyFloorGen = {
  animal: 'elephant', index: 3, radius: 24, height: 34,
  generate(_rng: Rng, o: Vec3): SkyFloorPlan {
    const seat = { id: 0, kind: 'seat' as const, x: o.x, y: o.y, z: o.z, w: 1, d: 1, tag: 0 };
    return {
      index: 3, animal: 'elephant', y0: o.y, y1: o.y + 34,
      shapes: [], graph: { places: [seat], links: [] },
      seat, spawns: [], nests: [], route: [],
      gate: { x: o.x, z: o.z, r: 0 }, platforms: [],
    };
  },
};
