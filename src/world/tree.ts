// The giant tree above the surface (docs/architecture/LEVELS.md §8, L5): the three upper levels of
// the world in thousands of cubes. A hollow trunk you climb by a spiral stair inside it, branches
// that radiate from its upper third and end in platforms, a canopy of leaves, and above it the
// stars: small platforms of star stone in constellations whose pads carry you from star to star.
// Built once per run, after the rock, from `fork('tree')`; integer maths only, so a seed always
// grows the same tree.

import { AIR, MAT } from '../content/materials';
import type { Rng } from '../core/rng';
import type { VoxelWorld } from './world';

export const TRUNK_R = 5;
export const TRUNK_H = 50;
/** Heights above the surface where each level of the tree begins (HUD labels, the loop). */
export const TREE_ZONES = { trunk: 0, branches: 30, leaves: 55, heaven: 80 } as const;

export interface StarPad { x: number; y: number; z: number; to: number }
export interface TreeResult {
  cx: number; cz: number; base: number; top: number;
  pads: StarPad[];
  /** Bounding box of everything the tree wrote (meshing). */
  box: [number, number, number, number, number, number];
  voxels: number;
}

export function buildTree(w: VoxelWorld, surfaceY: number, rng: Rng): TreeResult {
  const cx = w.sx >> 1, cz = w.sz >> 1, base = surfaceY + 1, ceil = w.sy - 3;
  let voxels = 0;
  const box: TreeResult['box'] = [cx, base, cz, cx, base, cz];
  const put = (x: number, y: number, z: number, m: number) => {
    if (x < 1 || z < 1 || x > w.sx - 2 || z > w.sz - 2 || y < base || y > ceil) return;
    const i = w.idx(x, y, z);
    if (w.data[i] === m) return;
    if (m !== AIR && w.data[i] === AIR) voxels++;
    w.data[i] = m;
    box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.min(box[2], z);
    box[3] = Math.max(box[3], x); box[4] = Math.max(box[4], y); box[5] = Math.max(box[5], z);
  };

  // the trunk: a wall of living wood around a hollow, with a door at its foot on every side
  const topY = base + TRUNK_H;
  for (let y = base - 1; y <= topY; y++) for (let dz = -TRUNK_R; dz <= TRUNK_R; dz++) for (let dx = -TRUNK_R; dx <= TRUNK_R; dx++) {
    const d2 = dx * dx + dz * dz;
    if (d2 > TRUNK_R * TRUNK_R) continue;
    const wall = d2 > (TRUNK_R - 2) * (TRUNK_R - 2);
    const door = y < base + 3 && (Math.abs(dx) <= 1 || Math.abs(dz) <= 1);
    put(cx + dx, y, cz + dz, wall && !door ? MAT.log : y === base - 1 || y === topY ? MAT.log : AIR);
  }
  // the spiral stair inside: one step a block higher every turn of 0.45 rad (about a block of arc)
  for (let y = base; y < topY; y++) {
    const a = (y - base) * 0.45;
    for (const r of [1.6, 2.6]) put(cx + Math.round(Math.cos(a) * r), y, cz + Math.round(Math.sin(a) * r), MAT.log);
  }
  // an opening in the crown of the trunk (y = topY) over the stair's last step
  const aTop = (topY - 1 - base) * 0.45;
  for (const r of [1, 2]) put(cx + Math.round(Math.cos(aTop) * r), topY, cz + Math.round(Math.sin(aTop) * r), AIR);

  // branches: thick beams from the upper third, rising gently, each ending in a platform
  const n = 6 + rng.int(0, 2);
  const ends: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.range(-0.25, 0.25);
    const y0 = base + 30 + rng.int(0, 15);
    const len = 12 + rng.int(0, 10);
    let ex = cx, ez = cz, ey = y0;
    for (let s = TRUNK_R - 2; s <= len; s++) {
      const x = cx + Math.round(Math.cos(a) * s), z = cz + Math.round(Math.sin(a) * s), y = y0 + (s >> 2);
      if (x < 4 || z < 4 || x > w.sx - 5 || z > w.sz - 5) break;
      for (let ox = 0; ox <= 1; ox++) for (let oz = 0; oz <= 1; oz++) put(x + ox, y, z + oz, MAT.log);
      // the trunk opens where a branch leaves it, so you can walk out onto it
      if (s <= TRUNK_R) for (let oy = 1; oy <= 2; oy++) for (let ox = 0; ox <= 1; ox++) for (let oz = 0; oz <= 1; oz++) put(x + ox, y + oy, z + oz, AIR);
      ex = x; ez = z; ey = y;
    }
    for (let dz = -2; dz <= 3; dz++) for (let dx = -2; dx <= 3; dx++) if (dx * dx + dz * dz <= 8) put(ex + dx, ey, ez + dz, MAT.log);
    ends.push([ex, ey, ez]);
  }

  // the canopy: blobs of leaves over every branch's end and over the trunk
  const blob = (x0: number, y0: number, z0: number, r: number) => {
    for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy * 2 + dz * dz > r * r) continue;
      const x = x0 + dx, y = y0 + dy, z = z0 + dz;
      if (w.inside(x, y, z) && w.data[w.idx(x, y, z)] === AIR) put(x, y, z, MAT.leaves);
    }
  };
  for (const [x, y, z] of ends) blob(x, y + 5, z, 5 + rng.int(0, 2));
  blob(cx, topY + 6, cz, 11);

  // the stars: constellations of small platforms above the canopy; each pad carries you to the next
  // star of its constellation (a ring), so you travel the sky from star to star
  const pads: StarPad[] = [];
  const skyBase = topY + 22;
  for (let c = 0; c < 3; c++) {
    const count = 3 + rng.int(0, 2), first = pads.length;
    const a0 = (c / 3) * Math.PI * 2 + rng.range(-0.3, 0.3);
    for (let s = 0; s < count; s++) {
      const r = 10 + s * 6 + rng.int(0, 3), a = a0 + s * 0.35;
      const x = Math.max(4, Math.min(w.sx - 5, cx + Math.round(Math.cos(a) * r)));
      const z = Math.max(4, Math.min(w.sz - 5, cz + Math.round(Math.sin(a) * r)));
      const y = Math.min(ceil - 6, skyBase + rng.int(0, 10));
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) put(x + dx, y, z + dz, MAT.starstone);
      pads.push({ x, y: y + 1, z, to: -1 });
    }
    for (let s = first; s < pads.length; s++) pads[s].to = s + 1 < pads.length ? s + 1 : first;
  }
  return { cx, cz, base, top: topY, pads, box, voxels };
}
