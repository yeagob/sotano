// Texture atlas layout (no DOM: the meshing worker uses it too).

import { MAT } from './materials';

export const TILE_PX = 16;
export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 6;

// tiles 0..39 are materials (tile = material id)
export const TILE_GRASS_TOP = 40;
export const TILE_CRACK0 = 44; // 4 crack stages: 44..47
export const CRACK_STAGES = 4;

/** Faces in the mesher's FACES order: +X, -X, +Y, -Y, +Z, -Z. */
export function tileFor(matId: number, face: number): number {
  if (matId === MAT.grass) return face === 2 ? TILE_GRASS_TOP : face === 3 ? MAT.dirt : MAT.grass;
  return matId;
}

/** UV of a corner (a, b ∈ {0,1}) of an atlas tile, with a small inset to avoid bleeding. */
export function tileUV(tile: number, a: number, b: number): [number, number] {
  const tx = tile % ATLAS_COLS, ty = Math.floor(tile / ATLAS_COLS);
  const e = 0.02;
  const aa = a ? 1 - e : e, bb = b ? 1 - e : e;
  return [(tx + aa) / ATLAS_COLS, 1 - (ty + 1 - bb) / ATLAS_ROWS];
}
