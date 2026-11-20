// Lucid Dream (docs/design/built/practices/MIRACLES.md): while phased, the body passes through blocks with finite hp.
// Blocks with infinite hp (bedrock, heartwood, the sun seal) stay solid, and the body never leaves the box of the room
// it started in (walls included): beyond that box everything is solid. When the phase ends inside a block, the body
// moves to the nearest free standing cell inside room interiors. Pure functions: the game passes its world in.
import { boxHits } from '../physics/voxel-collide';

/** The status timer's id, shared by the item (grantStatus) and the game (movement, HUD). */
export const PHASE_STATUS = 'phase';
/** A pickup starts the phase for this many seconds; more pickups add time up to the cap. */
export const PHASE_SECONDS = 3;
export const PHASE_CAP = 6;
/** The last seconds of a phase, when the warning tick sounds once. */
export const PHASE_WARN_S = 1;

/** An axis-aligned box of whole cells, both corners included. */
export interface CellBox { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number }
type Solid = (x: number, y: number, z: number) => boolean;

/**
 * The room's box with its walls: one cell around the interior on the sides and the ceiling layer above. The floor
 * is not in it: the floor layer stays solid, so a phased body cannot sink through the floor of its room.
 */
export function roomBox(r: { x0: number; y0: number; z0: number; w: number; d: number; height: number }): CellBox {
  return { x0: r.x0 - 1, y0: r.y0, z0: r.z0 - 1, x1: r.x0 + r.w, y1: r.y0 + r.height, z1: r.z0 + r.d };
}

/** The room's interior: the cells a body may stand in. */
export function roomInterior(r: { x0: number; y0: number; z0: number; w: number; d: number; height: number }): CellBox {
  return { x0: r.x0, y0: r.y0, z0: r.z0, x1: r.x0 + r.w - 1, y1: r.y0 + r.height - 1, z1: r.z0 + r.d - 1 };
}

/** Where a phase is allowed when the player stands in no room (a corridor or the sky): a small box around the feet. */
export function fallbackBox(fx: number, fy: number, fz: number): CellBox {
  const x = Math.floor(fx), y = Math.floor(fy + 0.001), z = Math.floor(fz);
  return { x0: x - 3, y0: y - 2, z0: z - 3, x1: x + 3, y1: y + 4, z1: z + 3 };
}

export function inBox(b: CellBox, x: number, y: number, z: number): boolean {
  return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;
}

/**
 * The solid test while phased: outside `box` everything is solid; inside it a block with finite hp is not, and the
 * rest (unbreakable blocks, doors) is as solid as before. `breakable(x, y, z)` says a block has finite hp.
 */
export function phasedSolid(solid: Solid, breakable: Solid, box: CellBox): Solid {
  return (x, y, z) => !inBox(box, x, y, z) || (solid(x, y, z) && !breakable(x, y, z));
}

/** A room interior (or the fallback box) where a body may end a phase, with the room's open tiles when it has them. */
export interface RescueArea { box: CellBox; open?: (x: number, z: number) => boolean }

/**
 * The nearest free standing spot for a body of half width `hw` and height `h` inside the areas, in the order given
 * (the current room first). A spot is free when the body's box is clear of solid cells; one with solid ground below
 * is preferred. Returns the centre of the feet, or null when no area has room (the caller then keeps the body).
 */
export function rescueSpot(solid: Solid, feet: { x: number; y: number; z: number }, areas: readonly RescueArea[], hw = 0.3, h = 1.8): { x: number; y: number; z: number } | null {
  for (const a of areas) {
    const b = a.box;
    let best: { x: number; y: number; z: number } | null = null;
    let bestScore = Infinity;
    for (let cz = b.z0; cz <= b.z1; cz++) for (let cy = b.y0; cy <= b.y1; cy++) for (let cx = b.x0; cx <= b.x1; cx++) {
      if (a.open && !a.open(cx, cz)) continue;
      const x = cx + 0.5, z = cz + 0.5;
      if (boxHits(solid, x, cy, z, hw, h)) continue;
      const ground = solid(cx, cy - 1, cz);
      const d2 = (x - feet.x) ** 2 + (cy - feet.y) ** 2 + (z - feet.z) ** 2 + (ground ? 0 : 16);
      if (d2 < bestScore) { bestScore = d2; best = { x, y: cy, z }; }
    }
    if (best) return best;
  }
  return null;
}
