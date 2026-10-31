// Placing a block where the player stands. Like Minecraft, a block never goes into a body: when
// the body reaches into the target cell by a quarter of a block or less, it is nudged out of the
// cell and the block goes down; deeper than that, the block stays in hand until the player steps
// clear. It is never thrown just because the player is in the way.

/** The deepest a body may reach into the target cell and still be nudged out (blocks). */
export const PLACE_NUDGE_MAX = 0.25;

/** How far past the overlap the nudge goes, so the body ends just clear of the cell. */
export const PLACE_NUDGE_CLEAR = 0.01;

export interface BodyBox { x: number; y: number; z: number; hw: number; h: number }

export interface CellOverlap {
  /** How far the body reaches into the cell, horizontally (blocks). */
  depth: number;
  /** The horizontal axis to nudge along: 0 is x, 2 is z. */
  axis: 0 | 2;
  /** The direction that takes the body out of the cell: +1 or -1. */
  dir: 1 | -1;
}

/**
 * How far a body reaches into the cell at (cx, cy, cz), and along which horizontal axis it is
 * cheapest to get out. null when the body and the cell don't overlap.
 */
export function cellOverlap(b: BodyBox, cx: number, cy: number, cz: number): CellOverlap | null {
  const oy = Math.min(b.y + b.h, cy + 1) - Math.max(b.y, cy);
  const ox = Math.min(b.x + b.hw, cx + 1) - Math.max(b.x - b.hw, cx);
  const oz = Math.min(b.z + b.hw, cz + 1) - Math.max(b.z - b.hw, cz);
  if (oy <= 0 || ox <= 0 || oz <= 0) return null;
  if (ox <= oz) return { depth: ox, axis: 0, dir: b.x > cx + 0.5 ? 1 : -1 };
  return { depth: oz, axis: 2, dir: b.z > cz + 0.5 ? 1 : -1 };
}
