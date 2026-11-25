// How allies keep out of the player's way (issue #327, docs/design/built/encounters/MOVEMENT.md). Pure
// rules over boxes and the voxel grid: no three.js. Enemies.escort applies them to allies only; a hostile
// projection never reads this file, so its navigation is the one it always had.

import type { Body } from '../physics/voxel-collide';
import type { Enemy } from './types';
import { growsUnder } from '../entities/growth';

type Solid = (x: number, y: number, z: number) => boolean;

/** Inside this distance (blocks, centre to centre) a following ally steps back from the player. */
export const FOLLOW_NEAR = 2;
/** Beyond this distance a following ally walks back to the player; between the two it holds. */
export const FOLLOW_FAR = 4;
/** The space an ally keeps between its box and the player's (blocks). */
export const PERSONAL_GAP = 0.5;
/** How far ahead of the player's eye an ally steps out of the line of the player's shots (blocks). */
export const SHOT_RANGE = 10;
/** How far ahead of a walking player an ally steps out of its path (blocks). */
export const PATH_RANGE = 3;
/** The margin around an ally's box that counts as being in a line (blocks). */
export const LANE_GAP = 0.25;
/** The player's walking speed (blocks/s) above which it counts as walking toward an ally. */
export const APPROACH_SPEED = 0.5;
/** An ally in a one-block doorway or corridor leaves it when the player, this close (blocks), walks toward it. */
export const YIELD_RADIUS = 4;
/** Extra cost, in steps, of each cell the player's box stands on or next to, on an ally's flow field. */
export const SOFT_COST = 8;
/** Cells the doorway search looks through before it gives up and steps straight away. */
const YIELD_SEARCH = 200;

/** The player as an ally sees it: its box, its eye height over the feet, its aim (unit, 3D) and its velocity. */
export interface Escortee {
  id: number; room: number;
  body: Body;
  eye: number;
  aim: [number, number, number];
}

/** Allies in the sense of #327: the projections on the player's side (converted and mended) and the friendly
 *  creatures love shots have grown. Sky allies and the future drones are not here (owner, #327). */
export const isAlly = (e: Enemy) => e.faction === 'self' || (growsUnder(e) && e.scale > 1);

/** Whether two boxes overlap (feet-based boxes, square in plan). */
export function overlaps(a: Body, b: Body): boolean {
  return Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.z - b.z) < a.hw + b.hw && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** The horizontal gap between two boxes (negative when they overlap in plan). */
export const boxGap = (a: Body, b: Body) => Math.max(Math.abs(a.x - b.x) - a.hw - b.hw, Math.abs(a.z - b.z) - a.hw - b.hw);

/** Whether the cell under (x, y, z) is a one-block doorway or corridor: shut on both sides along x, or along z. */
export function narrow(solid: Solid, x: number, y: number, z: number): boolean {
  const cx = Math.floor(x), cy = Math.floor(y + 0.05), cz = Math.floor(z);
  const shut = (sx: number, sz: number) => solid(sx, cy, sz) || solid(sx, cy + 1, sz);
  return (shut(cx - 1, cz) && shut(cx + 1, cz)) || (shut(cx, cz - 1) && shut(cx, cz + 1));
}

/**
 * Whether the box `b` stands in a line from (ox, oy, oz) along the unit `dir`, within `range`: the point of
 * the line nearest its centre falls inside the box grown by `margin` (LANE_GAP for a shot; for a path, the
 * walker's own half width too). Returns the side to step to (+1 or -1,
 * across the line's horizontal heading), or 0 when the box is clear of the line.
 */
export function laneSide(b: Body, ox: number, oy: number, oz: number, dir: [number, number, number], range: number, margin = LANE_GAP): number {
  const vx = b.x - ox, vy = b.y + b.h / 2 - oy, vz = b.z - oz;
  const t = vx * dir[0] + vy * dir[1] + vz * dir[2];
  if (t <= 0 || t > range) return 0;
  const qx = ox + dir[0] * t, qy = oy + dir[1] * t, qz = oz + dir[2] * t;
  const inside = Math.abs(qx - b.x) < b.hw + margin && Math.abs(qz - b.z) < b.hw + margin && qy > b.y - margin && qy < b.y + b.h + margin;
  if (!inside) return 0;
  const cross = dir[0] * vz - dir[2] * vx;
  return cross >= 0 ? 1 : -1;
}

/** The unit step across a horizontal heading, to `side`, or null when the heading is vertical. */
export function across(dir: [number, number, number], side: number): [number, number] | null {
  const l = Math.hypot(dir[0], dir[2]);
  if (l < 1e-3) return null;
  return [-dir[2] / l * side, dir[0] / l * side];
}

/** Whether the player is walking toward the box `b` (faster than APPROACH_SPEED along the line to it). */
export function approaching(b: Body, p: Body): boolean {
  const dx = b.x - p.x, dz = b.z - p.z, l = Math.hypot(dx, dz) || 1;
  return (p.vx * dx + p.vz * dz) / l > APPROACH_SPEED;
}

/**
 * The first step out of a one-block doorway or corridor for an ally the player is walking toward: a
 * breadth-first search over open cells at its own level, inside `bounds` (x0, z0, x1, z1), that never
 * steps on the player's cells, to the nearest cell that is neither narrow nor next to the player. Null
 * when it stands in no such cell. With no way out it steps straight away from the player.
 */
export function yieldStep(solid: Solid, b: Body, p: Body, bounds: [number, number, number, number]): [number, number] | null {
  if (!narrow(solid, b.x, b.y, b.z)) return null;
  const y = Math.floor(b.y + 0.05), [x0, z0, x1, z1] = bounds;
  const w = x1 - x0 + 1, d = z1 - z0 + 1;
  const sx = Math.floor(b.x), sz = Math.floor(b.z);
  const open = (x: number, z: number) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && !solid(x, y, z) && !solid(x, y + 1, z);
  const player = (x: number, z: number) => Math.abs(x + 0.5 - p.x) < p.hw + 1 && Math.abs(z + 0.5 - p.z) < p.hw + 1;
  const away = (): [number, number] => { const dx = b.x - p.x, dz = b.z - p.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
  if (!open(sx, sz)) return away();
  const parent = new Int32Array(w * d).fill(-1);
  const start = (sx - x0) + (sz - z0) * w;
  parent[start] = start;
  const queue = [start];
  for (let q = 0; q < queue.length && q < YIELD_SEARCH; q++) {
    const i = queue[q], cx = x0 + (i % w), cz = z0 + ((i / w) | 0);
    if (i !== start && !narrow(solid, cx + 0.5, y, cz + 0.5) && !player(cx, cz)) {
      let step = i;
      while (parent[step] !== start) step = parent[step];
      const dx = x0 + (step % w) + 0.5 - b.x, dz = z0 + ((step / w) | 0) + 0.5 - b.z, l = Math.hypot(dx, dz);
      return l > 1e-3 ? [dx / l, dz / l] : away();
    }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, nz = cz + dz;
      if (!open(nx, nz) || player(nx, nz)) continue;
      const n = (nx - x0) + (nz - z0) * w;
      if (parent[n] >= 0) continue;
      parent[n] = i;
      queue.push(n);
    }
  }
  return away();
}

/**
 * Takes out of a wish the part that would bring the box closer to the player inside its personal space,
 * and adds a step away that grows as the gap closes. Returns the wish unchanged outside that space, or
 * when the two boxes are not at the same height.
 */
export function keepClear(b: Body, p: Body, wish: [number, number]): [number, number] {
  if (b.y >= p.y + p.h + 0.3 || b.y + b.h <= p.y - 0.3) return wish;
  const gap = boxGap(b, p);
  if (gap >= PERSONAL_GAP) return wish;
  let dx = b.x - p.x, dz = b.z - p.z, l = Math.hypot(dx, dz);
  // on the very same spot any steady direction will do
  if (l < 1e-3) { dx = 1; dz = 0; l = 1; }
  const ux = dx / l, uz = dz / l;
  let [wx, wz] = wish;
  const toward = -(wx * ux + wz * uz);
  if (toward > 0) { wx += toward * ux; wz += toward * uz; }
  const push = Math.min(1, (PERSONAL_GAP - gap) / PERSONAL_GAP);
  return [wx + ux * push, wz + uz * push];
}
