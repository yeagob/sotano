// The crown's place: the one constant the rest of the game reads to find the top of the tree (owner decision D4 of
// #149: the Light goes at the top of the tree; D14: the Leaves are a room). The Light's trigger, placed by its own
// change, reads `CROWN_PLACE` and nothing else, so the crown can move without touching the Light's logic.
// docs/design/built/levels/giant-tree/LEAVES.md.

import { SURFACE_Y, WORLD_SIZE } from './floor';
import { leavesRoomAt, type LeavesRoom } from './tree';

/** The Leaves in the run's world: the giant tree stands at the world's centre on the surface (GiantTree), so the
 *  room is the same in every run. */
export const LEAVES: Readonly<LeavesRoom> = Object.freeze(leavesRoomAt(WORLD_SIZE.sx >> 1, WORLD_SIZE.sz >> 1, SURFACE_Y + 1));

/** The crown's place: the centre tile of the Leaves, inside the ring of starstone under the dome's open eye, at the
 *  height of its floor (feet). `x` and `z` are the tile's centre; `room` is the room's interior box, so a trigger
 *  can ask "inside the Leaves" as well as "at the centre". */
export const CROWN_PLACE = Object.freeze({
  x: LEAVES.x0 + 6 + 0.5,
  y: LEAVES.y0,
  z: LEAVES.z0 + 3 + 0.5,
  room: Object.freeze({ x0: LEAVES.x0, y0: LEAVES.y0, z0: LEAVES.z0, x1: LEAVES.x0 + LEAVES.w - 1, y1: LEAVES.y0 + LEAVES.height - 1, z1: LEAVES.z0 + LEAVES.d - 1 }),
});

/** Is a point (feet) inside the Leaves' interior? */
export function inLeaves(x: number, y: number, z: number): boolean {
  const r = CROWN_PLACE.room;
  return x >= r.x0 && x < r.x1 + 1 && z >= r.z0 && z < r.z1 + 1 && y >= r.y0 - 0.5 && y < r.y1 + 1;
}
