// The sky realm's voxels (docs/architecture/SKY.md §3.2–§3.6): a formula world with exceptions.
// The shape of the world is a SkyLayout (a list of shapes and a chunk index); only what differs
// from it is stored, keyed by voxel index, and chunks are materialised on demand into an LRU cache
// (ChunkCache) the mesher and physics read. Memory grows with the features and the exceptions,
// never with the volume.
//
// Who writes decides the kind of an exception, never the cell (§3.4):
//   Placed     set(m) while `placing` is true (the player placed a block), or any later solid write
//              over a placed cell. Ends by a removal (then Broken if the formula there is solid) or
//              the tower knock.
//   Broken     any other set(AIR) over a cell whose formula is solid. Regrowth restores it.
//   Replaced   any other set(m) that differs from the formula. Regrowth restores it.
//   Transient  setTransient: ends at its time (`expire`, a min-heap). Refuses placed cells.
//   Story      setStory: a permanent change the game makes. It becomes the cell's baseline: the
//              other kinds are measured against it, and `restore` returns to it.
// A cell set back to its baseline keeps no exception, unless the player placed it (then it stays
// Placed, and `restore` leaves it). `onBroken` fires when a cell becomes Broken
// or Replaced from any other state (once per departure, so regrowth's timer is not reset by a
// second change of an already-changed cell). The element layer has no kinds: its edits live in
// their own map and never make a block exception.
//
// Pure: integer and hash arithmetic, no fx, no three.js.

import { elemByte } from '../../content/elements';
import { AIR, mat } from '../../content/materials';
import { ExceptionKind, type SkyLayout, type SkyWorldApi, type SkyWorldStats } from '../types';
import { chunkKey, glows } from '../../world/world';
import { CACHE_CHUNKS, ChunkCache, type SkyChunk } from './cache';
import { formulaAt, formulaElemAt, SKY_NCX, SKY_NCY, SKY_NCZ, SKY_SX, SKY_SY, SKY_SZ, skyChunk, skyChunkOf } from './shape-index';
import { CHUNK, rasterise } from './shapes';

export { SKY_NCX, SKY_NCY, SKY_NCZ, SKY_SX, SKY_SY, SKY_SZ, skyChunk } from './shape-index';

const C3 = CHUNK * CHUNK * CHUNK;
const P = CHUNK + 2;
const SXY = SKY_SX * SKY_SY;
/** The shared all-air chunk the memo may hold for a chunk with nothing in it. Never written. */
const EMPTY: SkyChunk = { blocks: new Uint8Array(C3), elem: null };
/** Rough sizes for `stats().bytes` (§3.6). */
const SHAPE_BYTES = 100, ENTRY_BYTES = 4, KEY_BYTES = 48, EXCEPTION_BYTES = 70;

const localOf = (x: number, y: number, z: number) => (x & 15) + CHUNK * ((y & 15) + CHUNK * (z & 15));

interface Timed { until: number; i: number }

export class SkyWorld implements SkyWorldApi {
  readonly sx = SKY_SX; readonly sy = SKY_SY; readonly sz = SKY_SZ;
  readonly ncx = SKY_NCX; readonly ncy = SKY_NCY; readonly ncz = SKY_NCZ;
  readonly damaged = new Map<number, number>();
  readonly dirty = new Set<string>();
  readonly elemDirty = new Set<string>();
  version = 0;
  elemVersion = 0;
  onChange: ((x: number, y: number, z: number) => void) | null = null;
  onBroken: ((i: number) => void) | null = null;
  /** True only while the game places a block for the player (R2 sets it around tryPlace). */
  placing = false;

  /** Block exceptions: material | kind << 8. */
  private readonly edits = new Map<number, number>();
  /** Story changes: the cell's new baseline. */
  private readonly story = new Map<number, number>();
  /** Element edits: the byte that differs from the formula's (0 included). */
  private readonly elemEdits = new Map<number, number>();
  /** Chunk → cells with a block edit or a story change; chunk → cells with an element edit. */
  private readonly cells = new Map<number, Set<number>>();
  private readonly elemCells = new Map<number, Set<number>>();
  /** Transient cells: the time each returns, and the heap that orders them. */
  private readonly transients = new Map<number, { until: number; owner: number }>();
  private readonly heap: Timed[] = [];
  private readonly cache: ChunkCache;

  constructor(readonly layout: SkyLayout, opts?: { cacheChunks?: number }) {
    this.cache = new ChunkCache(opts?.cacheChunks ?? CACHE_CHUNKS);
  }

  // ───────────── addressing ─────────────

  inside(x: number, y: number, z: number) {
    return x >= 0 && y >= 0 && z >= 0 && x < SKY_SX && y < SKY_SY && z < SKY_SZ;
  }
  /** x + sx·(y + sy·z): up to 2^32, exact in a double (never use bit operators on it). */
  idx(x: number, y: number, z: number) { return x + SKY_SX * (y + SKY_SY * z); }
  coords(i: number): [number, number, number] {
    const z = Math.floor(i / SXY), r = i - z * SXY, y = Math.floor(r / SKY_SX);
    return [r - y * SKY_SX, y, z];
  }

  // ───────────── the formula ─────────────

  /** The formula alone, ignoring exceptions (and story changes). */
  base(x: number, y: number, z: number): number { return formulaAt(this.layout, x, y, z); }
  /** The cell's baseline: the story change if any, else the formula. */
  private baseline(i: number, x: number, y: number, z: number): number {
    const s = this.story.get(i);
    return s !== undefined ? s : formulaAt(this.layout, x, y, z);
  }

  // ───────────── reading ─────────────

  get(x: number, y: number, z: number): number {
    if (!this.inside(x, y, z)) return AIR;
    const k = skyChunkOf(x, y, z), c = this.cache;
    return (k === c.lastKey ? c.last! : this.chunk(k)).blocks[localOf(x, y, z)];
  }
  getAt(i: number): number {
    // i < 2^32: the divisions stay exact, and r < 2^24 is safe for bit operators (sx 256, 16 chunks across)
    const z = (i / SXY) | 0, r = i - z * SXY, y = r >>> 8, x = r & 255;
    const k = (x >> 4) + ((y >> 4) << 4) + ((z >> 4) << 16), c = this.cache;
    return (k === c.lastKey ? c.last! : this.chunk(k)).blocks[(x & 15) | ((y & 15) << 4) | ((z & 15) << 8)];
  }
  solid(x: number, y: number, z: number) { return this.get(x, y, z) !== AIR; }
  elemAt(x: number, y: number, z: number): number {
    if (!this.inside(x, y, z)) return 0;
    const k = skyChunkOf(x, y, z), c = this.cache;
    const e = (k === c.lastKey ? c.last! : this.chunk(k)).elem;
    return e ? e[localOf(x, y, z)] : 0;
  }
  elemAtIndex(i: number): number { const [x, y, z] = this.coords(i); return this.elemAt(x, y, z); }
  hp(x: number, y: number, z: number): number {
    return this.damaged.get(this.idx(x, y, z)) ?? mat(this.get(x, y, z)).hp;
  }
  kindAt(i: number): ExceptionKind | 0 {
    const e = this.edits.get(i);
    if (e !== undefined) return (e >> 8) as ExceptionKind;
    return this.story.has(i) ? ExceptionKind.Story : 0;
  }

  /** The block at a cell without materialising its chunk (cached buffer, else edit, else baseline). */
  private peek(i: number, x: number, y: number, z: number): number {
    const c = this.cache.peek(skyChunkOf(x, y, z));
    if (c) return c.blocks[localOf(x, y, z)];
    const e = this.edits.get(i);
    return e !== undefined ? e & 255 : this.baseline(i, x, y, z);
  }
  private peekElem(i: number, x: number, y: number, z: number): number {
    const c = this.cache.peek(skyChunkOf(x, y, z));
    if (c) return c.elem ? c.elem[localOf(x, y, z)] : 0;
    const e = this.elemEdits.get(i);
    return e !== undefined ? e : formulaElemAt(this.layout, x, y, z);
  }

  // ───────────── materialisation ─────────────

  /** The chunk's buffers, materialised on a miss (the shared empty chunk when nothing is in it). */
  private chunk(k: number): SkyChunk {
    return this.cache.get(k) ?? this.materialise(k);
  }

  private materialise(k: number): SkyChunk {
    const ids = this.layout.index.get(k), cells = this.cells.get(k), ecells = this.elemCells.get(k);
    if (!ids && !cells && !ecells) { this.cache.remember(k, EMPTY); return EMPTY; }
    const cx = k % SKY_NCX, cy = Math.floor(k / SKY_NCX) % SKY_NCY, cz = Math.floor(k / (SKY_NCX * SKY_NCY));
    const ox = cx * CHUNK, oy = cy * CHUNK, oz = cz * CHUNK;
    const blocks = new Uint8Array(C3);
    let elem: Uint8Array | null = null;
    if (ecells || (ids && ids.some(id => this.layout.shapes[id].k === 'elem'))) elem = new Uint8Array(C3);
    if (ids) for (const id of ids) rasterise(this.layout.shapes[id], ox, oy, oz, blocks, elem);
    if (cells) for (const i of cells) {
      const [x, y, z] = this.coords(i);
      const e = this.edits.get(i);
      blocks[localOf(x, y, z)] = e !== undefined ? e & 255 : this.story.get(i)!;
    }
    if (ecells && elem) for (const i of ecells) {
      const [x, y, z] = this.coords(i);
      elem[localOf(x, y, z)] = this.elemEdits.get(i)!;
    }
    const c: SkyChunk = { blocks, elem };
    this.cache.put(k, c);
    return c;
  }

  /** Materialises a chunk ahead of need (SkyRealm.stream's prefetch). True when it was not cached and
   *  now is. An empty chunk (or one outside the world) is never stored, so it is never prefetched. */
  prefetch(cx: number, cy: number, cz: number): boolean {
    if (this.emptyChunk(cx, cy, cz)) return false;
    const k = skyChunk(cx, cy, cz);
    if (this.cache.has(k)) return false;
    this.chunk(k);
    return true;
  }

  /** True when a chunk has no shape and no exception: it is all air with no element. */
  emptyChunk(cx: number, cy: number, cz: number): boolean {
    if (cx < 0 || cy < 0 || cz < 0 || cx >= SKY_NCX || cy >= SKY_NCY || cz >= SKY_NCZ) return true;
    const k = skyChunk(cx, cy, cz);
    return !this.layout.index.has(k) && !this.cells.has(k) && !this.elemCells.has(k);
  }

  /** A chunk and its one-voxel border for the mesher. Border cells of chunks not in the cache are
   *  read as edit ?? baseline without materialising them [M2]. */
  paddedChunk(cx: number, cy: number, cz: number, elem = false): Uint8Array {
    const out = new Uint8Array(P * P * P);
    const k = skyChunk(cx, cy, cz);
    const inWorld = cx >= 0 && cy >= 0 && cz >= 0 && cx < SKY_NCX && cy < SKY_NCY && cz < SKY_NCZ;
    const own = inWorld ? this.chunk(k) : EMPTY;
    const src = elem ? own.elem : own.blocks;
    const x0 = cx * CHUNK - 1, y0 = cy * CHUNK - 1, z0 = cz * CHUNK - 1;
    for (let z = 0; z < P; z++) for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
      const wx = x0 + x, wy = y0 + y, wz = z0 + z, o = x + P * (y + P * z);
      if (x > 0 && y > 0 && z > 0 && x <= CHUNK && y <= CHUNK && z <= CHUNK) {
        if (src) out[o] = src[(x - 1) + CHUNK * ((y - 1) + CHUNK * (z - 1))];
        continue;
      }
      if (!this.inside(wx, wy, wz)) continue;
      const i = this.idx(wx, wy, wz);
      out[o] = elem ? this.peekElem(i, wx, wy, wz) : this.peek(i, wx, wy, wz);
    }
    return out;
  }

  // ───────────── writing blocks ─────────────

  set(x: number, y: number, z: number, m: number) {
    if (!this.inside(x, y, z)) return;
    const i = this.idx(x, y, z);
    if (this.peek(i, x, y, z) === m) return;
    const b = this.baseline(i, x, y, z), was = this.kindAt(i);
    let kind: ExceptionKind | 0;
    // the player's block is the player's even when it matches the baseline (stone back into broken stone)
    if (m !== AIR && this.placing) kind = ExceptionKind.Placed;
    else if (m === b) kind = 0;
    else if (m !== AIR && was === ExceptionKind.Placed) kind = ExceptionKind.Placed;
    else if (m === AIR) kind = ExceptionKind.Broken;
    else kind = ExceptionKind.Replaced;
    this.write(i, x, y, z, m, kind);
    this.departed(i, was, kind);
  }

  /** A permanent change: the cell's new baseline. A player's block over it stays (as Placed). */
  setStory(x: number, y: number, z: number, m: number) {
    if (!this.inside(x, y, z)) return;
    const i = this.idx(x, y, z);
    const k = skyChunkOf(x, y, z), prev = this.peek(i, x, y, z);
    if (m === formulaAt(this.layout, x, y, z)) this.story.delete(i); else this.story.set(i, m);
    const e = this.edits.get(i);
    const keep = e !== undefined && e >> 8 === ExceptionKind.Placed && (e & 255) !== m;
    if (keep) { this.track(i, k); return; }
    // drop any other exception: the story is what the cell is now
    this.write(i, x, y, z, m, 0, prev);
  }

  /** A hindrance's timed change. Refuses placed cells. */
  setTransient(x: number, y: number, z: number, m: number, until: number, owner: number): boolean {
    if (!this.inside(x, y, z)) return false;
    const i = this.idx(x, y, z);
    if (this.kindAt(i) === ExceptionKind.Placed) return false;
    if (m === this.baseline(i, x, y, z)) {
      if (this.edits.has(i)) this.write(i, x, y, z, m, 0);
      return true;
    }
    this.write(i, x, y, z, m, ExceptionKind.Transient);
    this.transients.set(i, { until, owner });
    this.push({ until, i });
    return true;
  }

  /** Back to the baseline (the formula, or the story change): drops the cell's exception. A placed
   *  block is the player's: restore leaves it (only a removal or the tower knock ends it). */
  restore(i: number) {
    if (!this.edits.has(i) || this.kindAt(i) === ExceptionKind.Placed) return;
    const [x, y, z] = this.coords(i);
    this.write(i, x, y, z, this.baseline(i, x, y, z), 0);
  }

  /** Restores every transient cell whose time has come. */
  expire(now: number) {
    const h = this.heap;
    while (h.length && h[0].until <= now) {
      const t = this.pop();
      const live = this.transients.get(t.i);
      if (live && live.until === t.until && this.kindAt(t.i) === ExceptionKind.Transient) this.restore(t.i);
    }
  }

  /** Placed cells → air (Broken where the baseline is solid); returns the cells that were placed.
   *  Read their materials before calling: the loose cubes are the caller's. */
  knockTower(cells: readonly number[]): number[] {
    const out: number[] = [];
    for (const i of cells) {
      if (this.kindAt(i) !== ExceptionKind.Placed) continue;
      const [x, y, z] = this.coords(i);
      const kind = this.baseline(i, x, y, z) === AIR ? 0 : ExceptionKind.Broken;
      this.write(i, x, y, z, AIR, kind);
      this.departed(i, ExceptionKind.Placed, kind);
      out.push(i);
    }
    return out;
  }

  private departed(i: number, was: ExceptionKind | 0, kind: ExceptionKind | 0) {
    const changed = (k: ExceptionKind | 0) => k === ExceptionKind.Broken || k === ExceptionKind.Replaced;
    if (changed(kind) && !changed(was)) this.onBroken?.(i);
  }

  /** Records a cell's exception (kind 0: none) and shows value m. */
  private write(i: number, x: number, y: number, z: number, m: number, kind: ExceptionKind | 0, prev = this.peek(i, x, y, z)) {
    const k = skyChunkOf(x, y, z);
    if (kind) this.edits.set(i, m | kind << 8); else this.edits.delete(i);
    if (kind !== ExceptionKind.Transient) this.transients.delete(i);
    this.track(i, k);
    if (prev === m) return;
    const c = this.cache.peek(k);
    const li = localOf(x, y, z);
    if (c) c.blocks[li] = m;
    this.damaged.delete(i);
    // a solid block displaces whatever element was there
    if (m !== AIR) {
      const e = this.peekElem(i, x, y, z);
      if (e) { this.storeElem(i, x, y, z, k, 0); this.elemVersion++; this.markElemDirty(x, y, z); }
    }
    this.version++;
    this.markDirty(x, y, z);
    if (this.neighbourElem(x, y, z)) this.markElemDirty(x, y, z);
    this.onChange?.(x, y, z);
  }

  /** Keeps the chunk → cells index in step with the edits and story maps. */
  private track(i: number, k: number) {
    const has = this.edits.has(i) || this.story.has(i);
    let s = this.cells.get(k);
    if (has) {
      if (!s) { s = new Set(); this.cells.set(k, s); }
      s.add(i);
      if (!this.cache.has(k)) this.cache.forget(k);
    } else if (s) {
      s.delete(i);
      if (!s.size) this.cells.delete(k);
    }
  }

  private neighbourElem(x: number, y: number, z: number): boolean {
    const n = (a: number, b: number, c: number) => this.inside(a, b, c) && this.peekElem(this.idx(a, b, c), a, b, c) !== 0;
    return n(x + 1, y, z) || n(x - 1, y, z) || n(x, y + 1, z) || n(x, y - 1, z) || n(x, y, z + 1) || n(x, y, z - 1);
  }

  // ───────────── writing elements ─────────────

  setElem(x: number, y: number, z: number, kind: number, level: number, falling = false) {
    this.setElemByte(x, y, z, elemByte(kind, level, falling));
  }

  setElemByte(x: number, y: number, z: number, v: number) {
    if (!this.inside(x, y, z)) return;
    const i = this.idx(x, y, z);
    const cur = this.peekElem(i, x, y, z);
    if (cur === v || (v && this.peek(i, x, y, z) !== AIR)) return;
    // light sources (lava, fire) coming or going re-bake the warm glow on the blocks around them
    if (glows(cur) !== glows(v)) this.markDirty(x, y, z);
    this.storeElem(i, x, y, z, skyChunkOf(x, y, z), v);
    this.elemVersion++;
    this.markElemDirty(x, y, z);
    this.onChange?.(x, y, z);
  }

  /** Records an element edit (none when it equals the formula's) and shows it in a cached chunk. */
  private storeElem(i: number, x: number, y: number, z: number, k: number, v: number) {
    if (v === formulaElemAt(this.layout, x, y, z)) this.elemEdits.delete(i); else this.elemEdits.set(i, v);
    let s = this.elemCells.get(k);
    if (this.elemEdits.has(i)) {
      if (!s) { s = new Set(); this.elemCells.set(k, s); }
      s.add(i);
      if (!this.cache.has(k)) this.cache.forget(k);
    } else if (s) {
      s.delete(i);
      if (!s.size) this.elemCells.delete(k);
    }
    const c = this.cache.peek(k);
    if (!c) return;
    if (!c.elem) { if (!v) return; c.elem = new Uint8Array(C3); }
    c.elem[localOf(x, y, z)] = v;
  }

  // ───────────── dirty marking (as VoxelWorld) ─────────────

  markDirty(x: number, y: number, z: number) { mark(this.dirty, x, y, z); }
  markElemDirty(x: number, y: number, z: number) { mark(this.elemDirty, x, y, z); }

  // ───────────── the transient heap ─────────────

  private push(t: Timed) {
    const h = this.heap;
    h.push(t);
    let n = h.length - 1;
    while (n > 0) {
      const p = (n - 1) >> 1;
      if (h[p].until <= t.until) break;
      h[n] = h[p]; n = p;
    }
    h[n] = t;
  }
  private pop(): Timed {
    const h = this.heap, top = h[0], last = h.pop()!;
    if (h.length) {
      let n = 0;
      for (;;) {
        const a = 2 * n + 1, b = a + 1;
        let m = n, v = last.until;
        if (a < h.length && h[a].until < v) { m = a; v = h[a].until; }
        if (b < h.length && h[b].until < v) m = b;
        if (m === n) break;
        h[n] = h[m]; n = m;
      }
      h[n] = last;
    }
    return top;
  }

  // ───────────── stats ─────────────

  stats(): SkyWorldStats {
    const byKind = { [ExceptionKind.Broken]: 0, [ExceptionKind.Replaced]: 0, [ExceptionKind.Placed]: 0, [ExceptionKind.Transient]: 0, [ExceptionKind.Story]: this.story.size } as Record<ExceptionKind, number>;
    for (const e of this.edits.values()) byKind[(e >> 8) as ExceptionKind]++;
    let index = 0;
    for (const ids of this.layout.index.values()) index += ids.length;
    let cachedBytes = 0;
    for (const k of this.cache.keys()) cachedBytes += C3 + (this.cache.peek(k)!.elem ? C3 : 0);
    const exceptions = this.edits.size + this.story.size;
    return {
      shapes: this.layout.shapes.length,
      index,
      exceptions,
      byKind,
      elemEdits: this.elemEdits.size,
      cached: this.cache.size,
      bytes: this.layout.shapes.length * SHAPE_BYTES + index * ENTRY_BYTES + this.layout.index.size * KEY_BYTES
        + (exceptions + this.elemEdits.size + this.transients.size) * EXCEPTION_BYTES + cachedBytes,
    };
  }
}

function mark(set: Set<string>, x: number, y: number, z: number) {
  const cx = x >> 4, cy = y >> 4, cz = z >> 4;
  set.add(chunkKey(cx, cy, cz));
  const lx = x & 15, ly = y & 15, lz = z & 15;
  if (lx === 0 && cx > 0) set.add(chunkKey(cx - 1, cy, cz));
  if (lx === CHUNK - 1 && cx < SKY_NCX - 1) set.add(chunkKey(cx + 1, cy, cz));
  if (ly === 0 && cy > 0) set.add(chunkKey(cx, cy - 1, cz));
  if (ly === CHUNK - 1 && cy < SKY_NCY - 1) set.add(chunkKey(cx, cy + 1, cz));
  if (lz === 0 && cz > 0) set.add(chunkKey(cx, cy, cz - 1));
  if (lz === CHUNK - 1 && cz < SKY_NCZ - 1) set.add(chunkKey(cx, cy, cz + 1));
}
