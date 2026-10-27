// Voxel world: a flat array split into CHUNK³ chunks for meshing.
// In M0 the world is small and fits in memory; the "generator + deltas" model from
// docs/TECHNICAL.md §5.1 arrives with floor streaming (M3).

import { elemByte } from '../content/elements';
import { AIR, mat } from '../content/materials';

export const CHUNK = 16;

export class VoxelWorld {
  readonly data: Uint8Array;
  /** Elements (docs/architecture/ELEMENTS.md §9.1): one byte per voxel (content/elements.ts), 0 = none.
   *  A cell holding an element is air in `data`, so nothing that asks `solid()` sees it. */
  readonly elem: Uint8Array;
  /** Called after any block or element change (the element scheduler wakes the cell). */
  onChange: ((x: number, y: number, z: number) => void) | null = null;
  /** Remaining HP of damaged blocks (only the ones that were hit). Key = voxel index. */
  readonly damaged = new Map<number, number>();
  readonly dirty = new Set<string>();
  /** Chunks whose element mesh is stale (meshed on their own budget, so a flood never delays blocks). */
  readonly elemDirty = new Set<string>();
  /** Bumped on every element change (flow fields avoid hazards that just appeared). */
  elemVersion = 0;
  /** Bumped on every change (navigation caches compare against it). */
  version = 0;
  readonly ncx: number; readonly ncy: number; readonly ncz: number;

  constructor(readonly sx: number, readonly sy: number, readonly sz: number) {
    this.data = new Uint8Array(sx * sy * sz);
    this.elem = new Uint8Array(sx * sy * sz);
    this.ncx = Math.ceil(sx / CHUNK); this.ncy = Math.ceil(sy / CHUNK); this.ncz = Math.ceil(sz / CHUNK);
  }

  inside(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz;
  }
  idx(x: number, y: number, z: number) { return x + this.sx * (y + this.sy * z); }

  get(x: number, y: number, z: number): number {
    return this.inside(x, y, z) ? this.data[this.idx(x, y, z)] : AIR;
  }
  solid(x: number, y: number, z: number) { return this.get(x, y, z) !== AIR; }

  /** Sets a block and marks its chunk for remeshing (plus neighbours when it sits on a border). */
  set(x: number, y: number, z: number, m: number) {
    if (!this.inside(x, y, z)) return;
    const i = this.idx(x, y, z);
    if (this.data[i] === m) return;
    this.data[i] = m;
    // a solid block displaces whatever element was there
    if (m !== AIR && this.elem[i]) { this.elem[i] = 0; this.elemVersion++; this.markElemDirty(x, y, z); }
    this.damaged.delete(i);
    this.version++;
    this.markDirty(x, y, z);
    // fluid faces against this block appear or disappear
    if (this.elemAt(x + 1, y, z) || this.elemAt(x - 1, y, z) || this.elemAt(x, y + 1, z) || this.elemAt(x, y - 1, z)
      || this.elemAt(x, y, z + 1) || this.elemAt(x, y, z - 1)) this.markElemDirty(x, y, z);
    this.onChange?.(x, y, z);
  }

  /** The element byte at a cell, 0 outside the world. */
  elemAt(x: number, y: number, z: number): number {
    return this.inside(x, y, z) ? this.elem[this.idx(x, y, z)] : 0;
  }

  /** Puts an element in an air cell (kind 0 clears it). Ignored inside solid blocks. */
  setElem(x: number, y: number, z: number, kind: number, level: number, falling = false) {
    this.setElemByte(x, y, z, elemByte(kind, level, falling));
  }

  setElemByte(x: number, y: number, z: number, v: number) {
    if (!this.inside(x, y, z)) return;
    const i = this.idx(x, y, z);
    if (this.elem[i] === v || (v && this.data[i] !== AIR)) return;
    // light sources (lava, fire) coming or going re-bake the warm glow on the blocks around them
    if (glows(this.elem[i]) !== glows(v)) this.markDirty(x, y, z);
    this.elem[i] = v;
    this.elemVersion++;
    this.markElemDirty(x, y, z);
    this.onChange?.(x, y, z);
  }

  markElemDirty(x: number, y: number, z: number) {
    const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK), cz = Math.floor(z / CHUNK);
    this.elemDirty.add(chunkKey(cx, cy, cz));
    // a fluid's faces depend on its neighbours across the border
    const lx = x - cx * CHUNK, ly = y - cy * CHUNK, lz = z - cz * CHUNK;
    if (lx === 0 && cx > 0) this.elemDirty.add(chunkKey(cx - 1, cy, cz));
    if (lx === CHUNK - 1 && cx < this.ncx - 1) this.elemDirty.add(chunkKey(cx + 1, cy, cz));
    if (ly === 0 && cy > 0) this.elemDirty.add(chunkKey(cx, cy - 1, cz));
    if (ly === CHUNK - 1 && cy < this.ncy - 1) this.elemDirty.add(chunkKey(cx, cy + 1, cz));
    if (lz === 0 && cz > 0) this.elemDirty.add(chunkKey(cx, cy, cz - 1));
    if (lz === CHUNK - 1 && cz < this.ncz - 1) this.elemDirty.add(chunkKey(cx, cy, cz + 1));
  }

  markDirty(x: number, y: number, z: number) {
    const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK), cz = Math.floor(z / CHUNK);
    this.dirty.add(chunkKey(cx, cy, cz));
    const lx = x - cx * CHUNK, ly = y - cy * CHUNK, lz = z - cz * CHUNK;
    if (lx === 0 && cx > 0) this.dirty.add(chunkKey(cx - 1, cy, cz));
    if (lx === CHUNK - 1 && cx < this.ncx - 1) this.dirty.add(chunkKey(cx + 1, cy, cz));
    if (ly === 0 && cy > 0) this.dirty.add(chunkKey(cx, cy - 1, cz));
    if (ly === CHUNK - 1 && cy < this.ncy - 1) this.dirty.add(chunkKey(cx, cy + 1, cz));
    if (lz === 0 && cz > 0) this.dirty.add(chunkKey(cx, cy, cz - 1));
    if (lz === CHUNK - 1 && cz < this.ncz - 1) this.dirty.add(chunkKey(cx, cy, cz + 1));
  }

  markAllDirty() {
    // elements are marked where they are carved (rooms), so this only queues block meshes
    for (let cz = 0; cz < this.ncz; cz++) for (let cy = 0; cy < this.ncy; cy++) for (let cx = 0; cx < this.ncx; cx++)
      this.dirty.add(chunkKey(cx, cy, cz));
  }

  /** Current HP of a block (its maximum if it has never been damaged). */
  hp(x: number, y: number, z: number): number {
    const i = this.idx(x, y, z);
    return this.damaged.get(i) ?? mat(this.data[i]).hp;
  }

  /** Copies a chunk plus a 1-voxel border from its neighbours, for meshing in a worker
   *  (`elem` copies the element layer instead of the blocks). */
  paddedChunk(cx: number, cy: number, cz: number, elem = false): Uint8Array {
    const P = CHUNK + 2;
    const out = new Uint8Array(P * P * P);
    const x0 = cx * CHUNK - 1, y0 = cy * CHUNK - 1, z0 = cz * CHUNK - 1;
    const src = elem ? this.elem : this.data;
    for (let z = 0; z < P; z++) for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
      const wx = x0 + x, wy = y0 + y, wz = z0 + z;
      out[x + P * (y + P * z)] = this.inside(wx, wy, wz) ? src[this.idx(wx, wy, wz)] : 0;
    }
    return out;
  }
}

/** Lava and fire make light (the block mesher bakes a warm glow next to them). */
export const glows = (b: number) => b >> 6 === 2 || b >> 6 === 3;

export function chunkKey(cx: number, cy: number, cz: number) { return `${cx},${cy},${cz}`; }
export function parseChunkKey(k: string): [number, number, number] {
  const [a, b, c] = k.split(',').map(Number);
  return [a, b, c];
}
