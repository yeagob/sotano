import type * as THREE from 'three';
import { buildKitchenTile } from './alembic-model';

// The kitchen station: the -X tile of the original two-tile alembic, cut exactly at the seam
// (see alembic-model.ts, which carves both tiles from one shared grid so the halves stay exact).
// Footprint x, z in [0, 1], origin at the tile's lower corner. Named children: hearth-coals,
// hearth-glow (hidden), ring-0..2, bulb.
export function buildKitchenModel(): THREE.Group {
  return buildKitchenTile();
}
