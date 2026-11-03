// The sky tree: trunk, deck, halls, heartwood slabs and membranes (docs/architecture/SKY.md §7.1). Stub (K0): TR builds it.

import type { Rng } from '../../core/rng';
import type { FloorIndex, SkyTreePlan, SkyWorldApi } from '../types';

/** The sky tree's axis. */
export const SKY_AXIS = { x: 128, z: 128 } as const;

export function buildSkyTree(_rng: Rng): SkyTreePlan {
  const at = { id: 0, kind: 'ground' as const, x: SKY_AXIS.x, y: 0, z: SKY_AXIS.z, w: 1, d: 1, tag: 0 };
  return { shapes: [], halls: [], deck: at, door: at, gates: [], trunkRadius: () => 0 };
}

/** Floor n's deity was won: its way up turns to air (setStory). */
export function openGate(_world: SkyWorldApi, _tree: SkyTreePlan, _n: FloorIndex) {}
