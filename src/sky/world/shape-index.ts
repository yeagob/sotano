// The sky's layout: its shapes and a spatial index from chunk to the shapes that touch it
// (docs/architecture/SKY.md §3.2, §3.3). `buildIndex` is the only way a SkyLayout is made; the
// formula of a cell (`formulaAt`), its element and its platform tag are read through it, last shape
// wins (shapes.ts). Pure: no fx, no three.js.

import { AIR } from '../../content/materials';
import type { Shape, SkyLayout } from '../types';
import { boundsOf, covers, CHUNK } from './shapes';

/** The sky world's size: 16 × 16 chunks across, the sky tree's axis at (128, 128). */
export const SKY_SX = 256, SKY_SZ = 256;
/** A nominal height: 4096 chunk rows that cost nothing until touched. */
export const SKY_SY = 1 << 16;
export const SKY_NCX = SKY_SX / CHUNK, SKY_NCY = SKY_SY / CHUNK, SKY_NCZ = SKY_SZ / CHUNK;

/** The numeric key of a sky chunk (the index's and the cache's): below 2^20. */
export const skyChunk = (cx: number, cy: number, cz: number) => cx + SKY_NCX * (cy + SKY_NCY * cz);
/** The key of the chunk that holds a cell (inside the world). */
export const skyChunkOf = (x: number, y: number, z: number) => (x >> 4) + SKY_NCX * ((y >> 4) + SKY_NCY * (z >> 4));

/** Builds the layout: every shape, in order, filed under each chunk its bounds touch (clipped to the world). */
export function buildIndex(shapes: readonly Shape[]): SkyLayout {
  const lists = new Map<number, number[]>();
  shapes.forEach((s, id) => {
    const b = boundsOf(s);
    const cx0 = Math.max(0, b[0]) >> 4, cy0 = Math.max(0, b[1]) >> 4, cz0 = Math.max(0, b[2]) >> 4;
    const cx1 = Math.min(SKY_SX - 1, b[3]) >> 4, cy1 = Math.min(SKY_SY - 1, b[4]) >> 4, cz1 = Math.min(SKY_SZ - 1, b[5]) >> 4;
    if (b[3] < 0 || b[4] < 0 || b[5] < 0) return;
    for (let cz = cz0; cz <= cz1; cz++) for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      const k = skyChunk(cx, cy, cz);
      const l = lists.get(k);
      if (l) l.push(id); else lists.set(k, [id]);
    }
  });
  const index = new Map<number, Uint32Array>();
  for (const [k, l] of lists) index.set(k, Uint32Array.from(l));
  const layout: SkyLayout = {
    shapes,
    index,
    tagAt(x, y, z) {
      const id = winner(layout, x, y, z);
      if (id < 0) return 0;
      const s = shapes[id];
      return s.k !== 'elem' && s.m !== AIR && 'tag' in s ? s.tag ?? 0 : 0;
    },
  };
  return layout;
}

const inside = (x: number, y: number, z: number) => x >= 0 && y >= 0 && z >= 0 && x < SKY_SX && y < SKY_SY && z < SKY_SZ;

/** The id of the last block shape (not `elem`) that covers a cell, −1 for none. */
export function winner(layout: SkyLayout, x: number, y: number, z: number): number {
  if (!inside(x, y, z)) return -1;
  const ids = layout.index.get(skyChunkOf(x, y, z));
  if (!ids) return -1;
  for (let n = ids.length - 1; n >= 0; n--) {
    const s = layout.shapes[ids[n]];
    if (s.k !== 'elem' && covers(s, x, y, z)) return ids[n];
  }
  return -1;
}

/** The formula's block at a cell: the last block shape covering it, AIR for none or outside. */
export function formulaAt(layout: SkyLayout, x: number, y: number, z: number): number {
  const id = winner(layout, x, y, z);
  if (id < 0) return AIR;
  const s = layout.shapes[id];
  return s.k === 'elem' ? AIR : s.m;
}

/** The formula's element byte at a cell: the last shape covering it, if it is an elem shape over air. */
export function formulaElemAt(layout: SkyLayout, x: number, y: number, z: number): number {
  if (!inside(x, y, z)) return 0;
  const ids = layout.index.get(skyChunkOf(x, y, z));
  if (!ids) return 0;
  for (let n = ids.length - 1; n >= 0; n--) {
    const s = layout.shapes[ids[n]];
    if (!covers(s, x, y, z)) continue;
    // a block shape after every elem shape clears the element; an elem shape lands only on air
    return s.k === 'elem' && formulaAt(layout, x, y, z) === AIR ? s.byte : 0;
  }
  return 0;
}
