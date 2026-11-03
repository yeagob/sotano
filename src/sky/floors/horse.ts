// Sky floor 5, the horse's (docs/design/not-built/sky/guardians/HORSE.md, B6). Stub (K0): F5 builds it.

import type { Rng } from '../../core/rng';
import type { SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

export const horse: SkyFloorGen = {
  animal: 'horse', index: 5, radius: 30, height: 12,
  generate(_rng: Rng, o: Vec3): SkyFloorPlan {
    const seat = { id: 0, kind: 'seat' as const, x: o.x, y: o.y, z: o.z, w: 1, d: 1, tag: 0 };
    return {
      index: 5, animal: 'horse', y0: o.y, y1: o.y + 12,
      shapes: [], graph: { places: [seat], links: [] },
      seat, spawns: [], nests: [], route: [],
      gate: { x: o.x, z: o.z, r: 0 }, platforms: [],
    };
  },
};
