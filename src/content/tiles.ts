// Texture atlas layout (no DOM: the meshing worker uses it too).

import { MAT } from './materials';

export const TILE_PX = 16;
export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 8;

/** Tiles 0..47 are materials (tile = material id); the special tiles follow the material range. */
export const MATERIAL_TILES = 48;
export const TILE_GRASS_TOP = 48;
export const TILE_LOG_TOP = 49;
/** End grain of sky wood and the open culms of bamboo (docs/art/sky/blocks.md). */
export const TILE_SKYWOOD_TOP = 50;
export const TILE_BAMBOO_TOP = 51;
export const TILE_CRACK0 = 52; // 4 crack stages: 52..55
export const CRACK_STAGES = 4;

/** Faces in the mesher's FACES order: +X, -X, +Y, -Y, +Z, -Z. */
export function tileFor(matId: number, face: number): number {
  if (matId === MAT.grass) return face === 2 ? TILE_GRASS_TOP : face === 3 ? MAT.dirt : MAT.grass;
  // the trunk's barks change with height, its wood does not: every trunk bark shows the same end grain
  if (matId === MAT.log || matId === MAT.rootbark || matId === MAT.oldbark) return face === 2 || face === 3 ? TILE_LOG_TOP : matId;
  if (matId === MAT.skywood) return face === 2 || face === 3 ? TILE_SKYWOOD_TOP : MAT.skywood;
  if (matId === MAT.bamboo) return face === 2 || face === 3 ? TILE_BAMBOO_TOP : MAT.bamboo;
  return matId;
}

/** UV of a corner (a, b ∈ {0,1}) of an atlas tile, with a small inset to avoid bleeding. */
export function tileUV(tile: number, a: number, b: number): [number, number] {
  const tx = tile % ATLAS_COLS, ty = Math.floor(tile / ATLAS_COLS);
  const e = 0.02;
  const aa = a ? 1 - e : e, bb = b ? 1 - e : e;
  return [(tx + aa) / ATLAS_COLS, 1 - (ty + 1 - bb) / ATLAS_ROWS];
}
