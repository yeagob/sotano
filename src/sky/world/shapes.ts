// The sky's shapes (docs/architecture/SKY.md §3.3): what each kind covers, and how a shape fills
// its intersection with one chunk in one loop. Pure integer and hash arithmetic: no fx, no three.js,
// no randomness drawn (a blob's ragged surface is a fixed hash3 of the cell, like the cave ceiling).
//
// What each kind covers (all bounds inclusive, cells are integer coordinates):
//
//   box     every cell with x0 ≤ x ≤ x1, y0 ≤ y ≤ y1, z0 ≤ z ≤ z1 (the corners may come in any order).
//   ring    y0 ≤ y ≤ y1 and a rounded distance from the axis cell (cx, cz) between r0 and r1: the
//           cells with dx² + dz² ≤ r1² + r1, minus those with dx² + dz² ≤ r0² − r0. So r0 0 is a
//           full disc 2·r1 + 1 wide, r0 1 takes out the axis cell only, and a tube r0 4, r1 5 has
//           walls two thick. (≤ r² + r is the voxel circle of radius r + ½: round, no nubs.)
//   run     a straight line of cells from (ax, ay, az) to (bx, by, bz), one cell per step of the
//           longest axis, each carrying a cross-section w wide in x and in z (from p − ⌊(w−1)/2⌋ to
//           p + ⌊w/2⌋) and h high from the line upwards (p.y to p.y + h − 1). A branch, a segment,
//           a channel bed; its ends are square.
//   helix   a spiral stair round the axis (cx, cz) from y0 to y1: one tread a block thick at every
//           height, each one block above the last, turning counter-clockwise in (x, z) (the angle
//           from +x towards +z grows). `rise` is the height one full turn climbs, so a lap has
//           `rise` treads, each the sector [k, k + 1) · 360°/rise at height y0 + k (mod rise). A
//           tread spans the rounded distances r − w + 1 to r (w wide; w ≥ r + 1 reaches the axis).
//   ledges  the straight-up route: one-block ledges from y0 to y1, one per height, turning round a
//           2 × 2 square whose first cell is (x0, z0): ledge k (at y0 + k) sits at offset
//           (0, 0), (1, 0), (1, 1), (0, 1) for k mod 4 = 0, 1, 2, 3, the first number along
//           `axis`, the second across it (+x or +z). Every ledge is the next one's side neighbour,
//           one block lower, and a column holds a ledge every 4 heights, so a 1.8-high body
//           standing on any ledge has headroom 3 and climbs with a jump of 1 (a 2-wide strip with
//           a ledge every height would bump the head on the ledge two above).
//   blob    an ellipsoid round (cx, cy, cz) with radii rx, ry, rz (each at least 1) whose surface is
//           ragged by a fixed hash: a cell is in when q + 0.35 · hash3(seed, x, y, z) ≤ 1, q being
//           (dx/rx)² + (dy/ry)² + (dz/rz)². The core (q ≤ 0.65) is always solid.
//   elem    a box of one element byte (content/elements.ts), laid only where the block is air.
//
// Order decides: shapes are applied in their list order and the last one that covers a cell wins.
// A block shape (every kind but elem) sets the block, AIR included (an air shape carves an
// opening), and clears any element under it; an elem shape sets the element of the cells that are
// air at that point. So a cell holds an element only where its final block is air.

import { hash3 } from '../../core/rng';
import { AIR } from '../../content/materials';
import type { Shape } from '../types';

export const CHUNK = 16;
const C2 = CHUNK * CHUNK;
const TAU = Math.PI * 2;
/** The blob's surface: how deep its ragged shell reaches into the ellipsoid. */
export const BLOB_ROUGH = 0.35;
/** Ledge offsets round the 2 × 2 square: (along axis, across axis) for k mod 4. */
const LEDGE: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** A shape's inclusive cell bounds: [x0, y0, z0, x1, y1, z1]. */
export type Bounds = [number, number, number, number, number, number];

/** True for every kind that writes the block (all but `elem`). */
export const isBlockShape = (s: Shape) => s.k !== 'elem';

/** The inclusive axis-aligned bounds of every cell a shape may cover. */
export function boundsOf(s: Shape): Bounds {
  switch (s.k) {
    case 'box': case 'elem':
      return [Math.min(s.x0, s.x1), Math.min(s.y0, s.y1), Math.min(s.z0, s.z1), Math.max(s.x0, s.x1), Math.max(s.y0, s.y1), Math.max(s.z0, s.z1)];
    case 'ring':
      return [s.cx - s.r1, Math.min(s.y0, s.y1), s.cz - s.r1, s.cx + s.r1, Math.max(s.y0, s.y1), s.cz + s.r1];
    case 'run': {
      const lo = (Math.max(1, s.w) - 1) >> 1, hi = Math.max(1, s.w) >> 1, h = Math.max(1, s.h);
      return [Math.min(s.ax, s.bx) - lo, Math.min(s.ay, s.by), Math.min(s.az, s.bz) - lo, Math.max(s.ax, s.bx) + hi, Math.max(s.ay, s.by) + h - 1, Math.max(s.az, s.bz) + hi];
    }
    case 'helix':
      return [s.cx - s.r, Math.min(s.y0, s.y1), s.cz - s.r, s.cx + s.r, Math.max(s.y0, s.y1), s.cz + s.r];
    case 'ledges':
      return [s.x0, Math.min(s.y0, s.y1), s.z0, s.x0 + 1, Math.max(s.y0, s.y1), s.z0 + 1];
    case 'blob': {
      const rx = Math.max(1, s.rx), ry = Math.max(1, s.ry), rz = Math.max(1, s.rz);
      return [s.cx - rx, s.cy - ry, s.cz - rz, s.cx + rx, s.cy + ry, s.cz + rz];
    }
  }
}

const pointsOf = new WeakMap<Shape, readonly (readonly [number, number, number])[]>();

/** The points of a run's centre line: one per step of its longest axis (kept per shape). */
export function runPoints(s: Extract<Shape, { k: 'run' }>): readonly (readonly [number, number, number])[] {
  const known = pointsOf.get(s);
  if (known) return known;
  const out = linePoints(s);
  pointsOf.set(s, out);
  return out;
}

function linePoints(s: Extract<Shape, { k: 'run' }>): [number, number, number][] {
  const dx = s.bx - s.ax, dy = s.by - s.ay, dz = s.bz - s.az;
  const n = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
  const out: [number, number, number][] = [];
  if (n === 0) return [[s.ax, s.ay, s.az]];
  for (let i = 0; i <= n; i++) out.push([s.ax + Math.round(dx * i / n), s.ay + Math.round(dy * i / n), s.az + Math.round(dz * i / n)]);
  return out;
}

const inDisc = (d2: number, r: number) => d2 <= r * r + r;
/** Rounded distance in [r0, r1] (see the header). */
const inBand = (d2: number, r0: number, r1: number) => inDisc(d2, r1) && (r0 <= 0 || d2 > r0 * r0 - r0);

/** The tread (k) a helix's sector holds at a cell offset from its axis. */
function helixSector(dx: number, dz: number, rise: number): number {
  let a = Math.atan2(dz, dx);
  if (a < 0) a += TAU;
  return Math.min(rise - 1, Math.floor(a / TAU * rise));
}
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Whether a shape covers a cell. */
export function covers(s: Shape, x: number, y: number, z: number): boolean {
  switch (s.k) {
    case 'box': case 'elem':
      return x >= Math.min(s.x0, s.x1) && x <= Math.max(s.x0, s.x1) && y >= Math.min(s.y0, s.y1) && y <= Math.max(s.y0, s.y1)
        && z >= Math.min(s.z0, s.z1) && z <= Math.max(s.z0, s.z1);
    case 'ring': {
      if (y < Math.min(s.y0, s.y1) || y > Math.max(s.y0, s.y1)) return false;
      const dx = x - s.cx, dz = z - s.cz;
      return inBand(dx * dx + dz * dz, s.r0, s.r1);
    }
    case 'run': {
      const b = boundsOf(s);
      if (x < b[0] || y < b[1] || z < b[2] || x > b[3] || y > b[4] || z > b[5]) return false;
      const lo = (Math.max(1, s.w) - 1) >> 1, hi = Math.max(1, s.w) >> 1, h = Math.max(1, s.h);
      for (const [px, py, pz] of runPoints(s))
        if (x >= px - lo && x <= px + hi && z >= pz - lo && z <= pz + hi && y >= py && y < py + h) return true;
      return false;
    }
    case 'helix': {
      const y0 = Math.min(s.y0, s.y1);
      if (y < y0 || y > Math.max(s.y0, s.y1)) return false;
      const dx = x - s.cx, dz = z - s.cz;
      if (!inBand(dx * dx + dz * dz, s.r - Math.max(1, s.w) + 1, s.r)) return false;
      const rise = Math.max(1, s.rise);
      return helixSector(dx, dz, rise) === mod(y - y0, rise);
    }
    case 'ledges': {
      const y0 = Math.min(s.y0, s.y1);
      if (y < y0 || y > Math.max(s.y0, s.y1)) return false;
      const [a, c] = LEDGE[(y - y0) & 3];
      return s.axis === 'x' ? x === s.x0 + a && z === s.z0 + c : z === s.z0 + a && x === s.x0 + c;
    }
    case 'blob': {
      const rx = Math.max(1, s.rx), ry = Math.max(1, s.ry), rz = Math.max(1, s.rz);
      const dx = (x - s.cx) / rx, dy = (y - s.cy) / ry, dz = (z - s.cz) / rz;
      const q = dx * dx + dy * dy + dz * dz;
      return q <= 1 && q + BLOB_ROUGH * hash3(s.seed, x, y, z) <= 1;
    }
  }
}

/**
 * Applies one shape to the chunk whose first cell is (ox, oy, oz): `blocks` (and `elems`, when the
 * chunk keeps an element layer) are CHUNK³ buffers indexed lx + 16·(ly + 16·lz). Loops over the
 * shape's intersection with the chunk only.
 */
export function rasterise(s: Shape, ox: number, oy: number, oz: number, blocks: Uint8Array, elems: Uint8Array | null) {
  if (s.k === 'run') { rasteriseRun(s, ox, oy, oz, blocks, elems); return; }
  const b = boundsOf(s);
  const x0 = Math.max(b[0], ox), y0 = Math.max(b[1], oy), z0 = Math.max(b[2], oz);
  const x1 = Math.min(b[3], ox + CHUNK - 1), y1 = Math.min(b[4], oy + CHUNK - 1), z1 = Math.min(b[5], oz + CHUNK - 1);
  if (x0 > x1 || y0 > y1 || z0 > z1) return;
  const full = s.k === 'box' || s.k === 'elem';
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    const row = (y - oy) * CHUNK + (z - oz) * C2 - ox;
    for (let x = x0; x <= x1; x++) {
      if (!full && !covers(s, x, y, z)) continue;
      const li = row + x;
      if (s.k === 'elem') { if (elems && blocks[li] === AIR) elems[li] = s.byte; }
      else { blocks[li] = s.m; if (elems) elems[li] = 0; }
    }
  }
}

function rasteriseRun(s: Extract<Shape, { k: 'run' }>, ox: number, oy: number, oz: number, blocks: Uint8Array, elems: Uint8Array | null) {
  const lo = (Math.max(1, s.w) - 1) >> 1, hi = Math.max(1, s.w) >> 1, h = Math.max(1, s.h);
  for (const [px, py, pz] of runPoints(s)) {
    const x0 = Math.max(px - lo, ox), y0 = Math.max(py, oy), z0 = Math.max(pz - lo, oz);
    const x1 = Math.min(px + hi, ox + CHUNK - 1), y1 = Math.min(py + h - 1, oy + CHUNK - 1), z1 = Math.min(pz + hi, oz + CHUNK - 1);
    if (x0 > x1 || y0 > y1 || z0 > z1) continue;
    for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
      const row = (y - oy) * CHUNK + (z - oz) * C2 - ox;
      for (let x = x0; x <= x1; x++) { blocks[row + x] = s.m; if (elems) elems[row + x] = 0; }
    }
  }
}
