// M0 world generation: one dungeon room surrounded by rock, with the surface above.
//
//   y 25        grass (surface, open sky above)
//   y 23–24     dirt
//   y 15–22     stone with dirt pockets and ore veins
//   y 13–14     brick ceiling
//   y  8–12     room interior (5 high)
//   y  6–7      brick floor
//   y  1–5      deepstone (with a secret cave)
//   y  0        bedrock

import { MAT, AIR } from '../content/materials';
import { CELL_STACK, ROOM_D, ROOM_H, ROOM_W, type RoomTemplate } from '../content/rooms';
import { hash3, type Rng } from '../core/rng';
import { VoxelWorld } from './world';

export const WORLD = { sx: 41, sy: 26, sz: 33 };
export const FLOOR_Y = 8; // first air layer inside the room
export const SURFACE_Y = 25;
export const ROOM = { x0: 14, z0: 13 }; // inner corner of the room

export interface GenResult { world: VoxelWorld; spawn: [number, number, number]; template: string }

export function generateM0(seed: number, rng: Rng, templates: RoomTemplate[]): GenResult {
  const { sx, sy, sz } = WORLD;
  const w = new VoxelWorld(sx, sy, sz);
  const n = (x: number, y: number, z: number, s = 1) => hash3(seed + s, x, y, z);

  // 1. layered rock
  for (let z = 0; z < sz; z++) for (let y = 0; y < sy; y++) for (let x = 0; x < sx; x++) {
    let m: number;
    if (y === 0) m = MAT.bedrock;
    else if (y === SURFACE_Y) m = MAT.grass;
    else if (y >= 23) m = MAT.dirt;
    else if (y <= 5) m = n(x >> 1, y >> 1, z >> 1) < 0.12 ? MAT.obsidian : MAT.deepstone;
    else {
      m = MAT.stone;
      const v = n(x >> 1, y >> 1, z >> 1, 7);
      if (v < 0.12) m = MAT.dirt;
      else if (v > 0.93) m = MAT.ore;
    }
    // world border: bedrock (except the grass layer)
    if (y < SURFACE_Y && (x === 0 || z === 0 || x === sx - 1 || z === sz - 1)) m = MAT.bedrock;
    w.data[w.idx(x, y, z)] = m;
  }

  // 2. room shell: 2-thick brick around the interior
  const { x0, z0 } = ROOM;
  const x1 = x0 + ROOM_W - 1, z1 = z0 + ROOM_D - 1, y0 = FLOOR_Y, y1 = FLOOR_Y + ROOM_H - 1;
  fillBox(w, x0 - 2, y0 - 2, z0 - 2, x1 + 2, y1 + 2, z1 + 2, MAT.brick);
  fillBox(w, x0, y0, z0, x1, y1, z1, AIR);

  // 3. north and south doors (3×3) with a short corridor ending in dirt
  const dx = x0 + (ROOM_W >> 1);
  for (const dir of [-1, 1]) {
    const zWall = dir < 0 ? z0 - 1 : z1 + 1;
    const zEnd = zWall + dir * 6;
    const za = Math.min(zWall, zEnd), zb = Math.max(zWall, zEnd);
    fillBox(w, dx - 2, y0 - 1, za, dx + 2, y0 + 3, zb, MAT.brick);   // corridor
    fillBox(w, dx - 1, y0, za, dx + 1, y0 + 2, zb, AIR);
    fillBox(w, dx - 1, y0, zEnd, dx + 1, y0 + 2, zEnd, MAT.dirt);     // dirt plug
  }

  // 4. interior from the template
  const t = rng.pick(templates);
  let spawn: [number, number, number] = [x0 + ROOM_W / 2, y0, z0 + ROOM_D / 2];
  t.rows.forEach((row, rz) => {
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      const x = x0 + rx, z = z0 + rz;
      if (ch === 'P') spawn = [x + 0.5, y0, z + 0.5];
      const s = CELL_STACK[ch];
      if (s) for (let h = 0; h < s.h; h++) w.data[w.idx(x, y0 + h, z)] = s.m;
    }
  });

  // 5. secrets: a hidden pocket in the western rock and another below the floor
  fillBox(w, 4, 9, 15, 7, 10, 17, AIR);
  w.data[w.idx(5, 9, 16)] = MAT.crate;
  w.data[w.idx(6, 9, 16)] = MAT.ore;
  fillBox(w, 18, 2, 15, 22, 4, 17, AIR);
  w.data[w.idx(20, 2, 16)] = MAT.obsidian;

  w.markAllDirty();
  return { world: w, spawn, template: t.id };
}

function fillBox(w: VoxelWorld, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: number) {
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    if (w.inside(x, y, z)) w.data[w.idx(x, y, z)] = m;
}
