// The surface round the tree and its mountains (issue #10, docs/architecture/LEVELS.md §13): a wide
// plain and a ring of terraced ridges outside the dungeon's array. The ground is a formula of the
// run's seed (`fork('mountains')`) with exceptions (docs/design/not-built/levels/WORLD-STORAGE.md),
// on the sky realm's engine: nothing is stored per column or per cell of the surface. A chunk column's
// heights are computed when it is first needed and kept in a small LRU; a chunk's blocks are
// materialised into the sky's `ChunkCache` (LRU, capped) and then its exceptions are applied, so
// evicting it loses nothing. Memory grows with the cache cap and the exceptions, never with the
// surface's size. The world asks `block()` for any cell outside its array.
//
// Seen from the tree (heights above the grass, distances from the trunk's axis):
//
//   0 ─ PLAIN_R         the plain: flat grass, four times wider than the first surface (76 → 304)
//   PLAIN_R ─ CREST_R   the inner wall: terraces (ledges) with cliffs of TERRACE blocks, and stairs
//   CREST_R             the crest: about half the tree's height, one summit per ridge as tall as the tree
//   CREST_R ─ FOOT_R    the outer wall, terraced, down to the far plain
//   FOOT_R ─ EDGE_R     the far plain (other areas will open here later), then the edge
//
// PASSES flat corridors cut the ring into ridges. Every STAIR_ARC blocks of crest a stair of worn
// earth (one block a step, three blocks wide) climbs the inner wall from the plain to the crest, so
// every ledge and every ridge can be reached by jumping.

import { AIR, MAT } from '../content/materials';
import { hash3, type Rng } from '../core/rng';
import { ExceptionKind } from '../sky/types';
import { ChunkCache, type SkyChunk } from '../sky/world/cache';
import { TREE_ZONES } from './tree';
import { CHUNK } from './world';

/** The tree's height above the grass (the top of its canopy): nothing on the surface is taller. */
export const PEAK = TREE_ZONES.heaven;
/** How many times wider the surface is than the first one (issue #10: the plain was 76 blocks). */
export const SURFACE_SCALE = 4;
export const PLAIN_R = 76 * SURFACE_SCALE;
/** The inner wall: wide enough that a stair at one block a block reaches the tallest crest. */
export const INNER_W = 184;
export const CREST_R = PLAIN_R + INNER_W;
export const OUTER_W = 96;
export const FOOT_R = CREST_R + OUTER_W;
export const EDGE_R = FOOT_R + 16;
export const PASSES = 3;
/** Half the width of a pass's flat floor, and how far its sides take to reach the ridge. */
export const PASS_HALF = 6;
const PASS_RAMP = 40;
/** The height of a cliff between two ledges of the walls. */
export const TERRACE = 4;
/** Blocks of crest between two stairs, and the stair's half width (three blocks wide). */
export const STAIR_ARC = 48;
const STAIR_HALF = 1.5;
/** The inner wall's profile: crest × t^INNER_POW, never steeper than one block a block (INNER_W). */
const INNER_POW = 1.25;
/** How wide a summit spreads along the crest (blocks of arc). */
const PEAK_W = 128;
/** Gentle ground under this height is grass; anything steeper or higher is bare stone. */
const GRASS_LINE = 56;
/** How far under the grass the terrain's ground goes (a skirt: nothing below it is ever seen). */
export const DEPTH = 6;
const NONE = -1;

/** Chunk columns whose heights are kept (each 18 × 18 heights and 16 × 16 tops, under 1 KB). */
export const COLUMN_CAP = 1024;
/** Materialised terrain chunks kept (4 KB each): 2 MB. */
export const TERRAIN_CHUNKS = 512;

const C3 = CHUNK * CHUNK * CHUNK;
const W = CHUNK + 2;
/** The shared all-air chunk (never written). */
const EMPTY: SkyChunk = { blocks: new Uint8Array(C3), elem: null };
/** Chunk coordinates are biased so a numeric key holds negative chunks (±16 384 blocks). */
const BIAS = 1024;
const colKey = (cx: number, cz: number) => (cx + BIAS) + 2048 * (cz + BIAS);
const chunkNum = (cx: number, cy: number, cz: number) => colKey(cx, cz) * 64 + cy;
const localOf = (x: number, y: number, z: number) => (x & 15) + CHUNK * ((y & 15) + CHUNK * (z & 15));

export interface Ridge {
  /** The passes it runs between (angles round the tree, radians), `from` < `to` (unwrapped). */
  from: number; to: number;
  /** The angle of its summit (as tall as the tree). */
  peak: number;
}

/** A chunk column's ground: heights with a one-column border, the top block of each inner column. */
interface Column { heights: Int16Array; tops: Uint8Array; lo: number; hi: number; ground: boolean }

export interface TerrainStats {
  /** Bytes of the formula's parameters (passes, ridges, phases, stairs, summits). */
  formula: number;
  /** Stored exceptions (cells that differ from the formula) and their bytes (4 a cell, sparse form). */
  exceptions: number; exceptionBytes: number;
  /** Cached chunk columns and chunks, and their bytes (both capped). */
  columns: number; chunks: number; cacheBytes: number;
  /** Everything the terrain holds. */
  bytes: number;
}

export class Mountains {
  readonly passes: number[] = [];
  readonly ridges: Ridge[] = [];
  /** The angles of the stairs up the inner wall (none inside a pass's ramps). */
  readonly stairs: number[] = [];
  /** The stairs' even spacing round the ring: slot k stands at start + k·step, when it is kept. */
  private readonly stairStart: number;
  private readonly stairStep: number;
  private readonly stairSlot: number[] = [];
  /** The summit column of each ridge, pinned to the tree's height. */
  readonly summits: [number, number][] = [];
  private readonly phase: number[];
  private readonly noise: number;
  private readonly columns = new Map<number, Column>();
  private readonly cache = new ChunkCache(TERRAIN_CHUNKS);
  /** Exceptions per chunk (§5.2 sparse form): local index → material | kind << 8. */
  private readonly edits = new Map<number, Map<number, number>>();

  /** (cx, cz): the tree's axis; `surfaceY`: the grass; `inner`: the dungeon array's size (sx, sz). */
  constructor(rng: Rng, readonly cx: number, readonly cz: number, readonly surfaceY: number, private inner: { sx: number; sz: number }) {
    const base = rng.range(0, Math.PI * 2);
    for (let k = 0; k < PASSES; k++) this.passes.push(base + (k * Math.PI * 2) / PASSES + rng.range(-0.25, 0.25));
    for (let k = 0; k < PASSES; k++) {
      const from = this.passes[k], to = this.passes[(k + 1) % PASSES] + (k === PASSES - 1 ? Math.PI * 2 : 0), span = to - from;
      this.ridges.push({ from, to, peak: from + span * rng.range(0.3, 0.7) });
    }
    this.phase = [rng.range(0, Math.PI * 2), rng.range(0, Math.PI * 2), rng.range(0, Math.PI * 2)];
    this.noise = rng.u32();
    const n = Math.round((Math.PI * 2 * CREST_R) / STAIR_ARC);
    this.stairStep = (Math.PI * 2) / n;
    this.stairStart = rng.range(0, this.stairStep);
    for (let k = 0; k < n; k++) {
      const a = this.stairStart + k * this.stairStep;
      this.stairSlot.push(this.open(a, PLAIN_R) >= 1 ? this.stairs.push(a) - 1 : -1);
    }
    for (const rd of this.ridges) this.summits.push([Math.round(cx + Math.cos(rd.peak) * CREST_R), Math.round(cz + Math.sin(rd.peak) * CREST_R)]);
  }

  /** The crest's height at an angle: the ridge's own line, and its summit. Never above PEAK. */
  crest(a: number): number {
    const [p1, p2, p3] = this.phase;
    let h = PEAK * (0.5 + 0.08 * Math.sin(3 * a + p1) + 0.06 * Math.sin(7 * a + p2) + 0.04 * Math.sin(13 * a + p3));
    for (const r of this.ridges) h = Math.max(h, PEAK * Math.exp(-((angleDiff(a, r.peak) * CREST_R / PEAK_W) ** 2)));
    return Math.min(PEAK, h);
  }

  /** 0 inside a pass's floor, 1 clear of it: how much of the ridge stands at (a, r). */
  private open(a: number, r: number): number {
    let f = 1;
    for (const p of this.passes) f = Math.min(f, smoothstep(PASS_HALF, PASS_HALF + PASS_RAMP, Math.abs(angleDiff(a, p)) * r));
    return f;
  }

  /** The stair whose strip holds (a, r), or -1. */
  private stairAt(a: number, r: number): number {
    const n = this.stairSlot.length;
    const k = ((Math.round((a - this.stairStart) / this.stairStep) % n) + n) % n, s = this.stairSlot[k];
    return s >= 0 && Math.abs(angleDiff(a, this.stairs[s])) * r <= STAIR_HALF ? s : -1;
  }

  /** The formula: height above the grass of the column (x, z), NONE past the edge. Pure. */
  heightOf(x: number, z: number): number {
    const dx = x - this.cx, dz = z - this.cz, r = Math.hypot(dx, dz);
    if (r > EDGE_R) return NONE;
    if (r <= PLAIN_R || r >= FOOT_R) return 0;
    for (const [sx, sz] of this.summits) if (sx === x && sz === z) return PEAK;
    const a = Math.atan2(dz, dx);
    if (r <= CREST_R) {
      const prof = ((r - PLAIN_R) / INNER_W) ** INNER_POW, s = this.stairAt(a, r);
      // a stair: the crest of its own line, one block a block (the profile never rises faster)
      if (s >= 0) return Math.floor(this.crest(this.stairs[s]) * prof);
      return this.terrace(x, z, this.crest(a) * prof * this.open(a, r));
    }
    return this.terrace(x, z, this.crest(a) * (1 - (r - CREST_R) / OUTER_W) ** 1.5 * this.open(a, r));
  }

  /** Ledges and cliffs: the profile cut into steps of TERRACE, rugged by a block in 2 × 2 patches. */
  private terrace(x: number, z: number, h0: number): number {
    let h = TERRACE * Math.floor(h0 / TERRACE);
    if (h >= TERRACE && hash3(this.noise, x >> 1, 0, z >> 1) < 0.5) h += 1;
    return Math.max(0, Math.min(PEAK, h));
  }

  /** Whether (x, z) lies on a stair up the inner wall. */
  onStair(x: number, z: number): boolean {
    const dx = x - this.cx, dz = z - this.cz, r = Math.hypot(dx, dz);
    return r > PLAIN_R && r <= CREST_R && this.stairAt(Math.atan2(dz, dx), r) >= 0;
  }

  // ───────────── chunk columns (computed once, kept in a small LRU) ─────────────

  private column(ccx: number, ccz: number): Column {
    const key = colKey(ccx, ccz);
    let c = this.columns.get(key);
    if (c) { this.columns.delete(key); this.columns.set(key, c); return c; }
    const heights = new Int16Array(W * W), tops = new Uint8Array(CHUNK * CHUNK);
    const x0 = ccx * CHUNK - 1, z0 = ccz * CHUNK - 1;
    let lo = Infinity, hi = -Infinity, ground = false;
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      const h = this.heightOf(x0 + i, z0 + j);
      heights[i + W * j] = h;
      // next to a column with no ground the edge shows its whole skirt
      const top = this.surfaceY + Math.max(0, h);
      lo = Math.min(lo, h === NONE ? this.surfaceY - DEPTH - 1 : top - 1); hi = Math.max(hi, top + 1);
      if (h !== NONE) ground = true;
    }
    for (let j = 1; j <= CHUNK; j++) for (let i = 1; i <= CHUNK; i++) {
      const h = heights[i + W * j];
      if (h === NONE) continue;
      if (this.onStair(x0 + i, z0 + j)) { tops[(i - 1) + CHUNK * (j - 1)] = MAT.dirt; continue; }
      let steep = 0;
      for (const [di, dj] of NEIGHBOURS) {
        const hn = heights[i + di + W * (j + dj)];
        if (hn !== NONE) steep = Math.max(steep, Math.abs(hn - h));
      }
      tops[(i - 1) + CHUNK * (j - 1)] = h <= GRASS_LINE && steep <= 1 ? MAT.grass : MAT.stone;
    }
    c = { heights, tops, lo, hi, ground };
    this.columns.set(key, c);
    if (this.columns.size > COLUMN_CAP) this.columns.delete(this.columns.keys().next().value as number);
    return c;
  }

  /** Height above the grass of the column (x, z), or -1 where there is no ground (past the edge). */
  height(x: number, z: number): number {
    const ccx = Math.floor(x / CHUNK), ccz = Math.floor(z / CHUNK);
    return this.column(ccx, ccz).heights[(x - ccx * CHUNK + 1) + W * (z - ccz * CHUNK + 1)];
  }

  // ───────────── chunks (the sky's cache: formula, then exceptions) ─────────────

  /** The block at a cell (the world asks only for cells outside its array). */
  block(x: number, y: number, z: number): number {
    const k = chunkNum(x >> 4, y >> 4, z >> 4), c = this.cache;
    return (k === c.lastKey ? c.last! : this.chunk(x >> 4, y >> 4, z >> 4, k)).blocks[localOf(x, y, z)];
  }

  private chunk(ccx: number, ccy: number, ccz: number, k: number): SkyChunk {
    const hit = this.cache.get(k);
    if (hit) return hit;
    const col = this.column(ccx, ccz), edits = this.edits.get(k), oy = ccy * CHUNK;
    if (!edits && (!col.ground || oy > col.hi || oy + CHUNK - 1 < this.surfaceY - DEPTH)) { this.cache.remember(k, EMPTY); return EMPTY; }
    const blocks = new Uint8Array(C3);
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const h = col.heights[(lx + 1) + W * (lz + 1)];
      if (h === NONE) continue;
      const top = this.surfaceY + h, m = col.tops[lx + CHUNK * lz];
      const y0 = Math.max(oy, this.surfaceY - DEPTH), y1 = Math.min(oy + CHUNK - 1, top);
      for (let y = y0; y <= y1; y++)
        blocks[lx + CHUNK * ((y - oy) + CHUNK * lz)] = y === top ? m : m !== MAT.stone && y >= top - 3 ? MAT.dirt : MAT.stone;
    }
    if (edits) for (const [li, v] of edits) blocks[li] = v & 255;
    const out: SkyChunk = { blocks, elem: null };
    this.cache.put(k, out);
    return out;
  }

  /** The formula alone at a cell, ignoring exceptions. */
  base(x: number, y: number, z: number): number {
    const h = this.height(x, z);
    if (h === NONE || y < this.surfaceY - DEPTH) return AIR;
    const top = this.surfaceY + h;
    if (y > top) return AIR;
    const ccx = Math.floor(x / CHUNK), ccz = Math.floor(z / CHUNK);
    const m = this.column(ccx, ccz).tops[(x - ccx * CHUNK) + CHUNK * (z - ccz * CHUNK)];
    return y === top ? m : m !== MAT.stone && y >= top - 3 ? MAT.dirt : MAT.stone;
  }

  /** Records an exception (WORLD-STORAGE §5.1): a cell set back to its formula keeps none, unless it
   *  was placed. Not reached by the game yet: the mountains cannot be broken or built on (decision 8). */
  except(x: number, y: number, z: number, m: number, placing = false) {
    const k = chunkNum(x >> 4, y >> 4, z >> 4), li = localOf(x, y, z), b = this.base(x, y, z);
    let e = this.edits.get(k);
    const was = e?.get(li);
    const kind = m !== AIR && (placing || (was !== undefined && was >> 8 === ExceptionKind.Placed)) ? ExceptionKind.Placed
      : m === b ? 0 : m === AIR ? ExceptionKind.Broken : ExceptionKind.Replaced;
    if (kind) { if (!e) { e = new Map(); this.edits.set(k, e); } e.set(li, m | kind << 8); }
    else if (e) { e.delete(li); if (!e.size) this.edits.delete(k); }
    const c = this.cache.peek(k);
    if (c) c.blocks[li] = m; else this.cache.forget(k);
  }

  stats(): TerrainStats {
    let exceptions = 0;
    for (const e of this.edits.values()) exceptions += e.size;
    const formula = 8 * (this.passes.length + 3 * this.ridges.length + this.phase.length + this.stairs.length + 2 * this.summits.length) + 4;
    const exceptionBytes = exceptions * 4 + this.edits.size * 16;
    const cacheBytes = this.columns.size * (W * W * 2 + CHUNK * CHUNK) + this.cache.size * C3;
    return { formula, exceptions, exceptionBytes, columns: this.columns.size, chunks: this.cache.size, cacheBytes, bytes: formula + exceptionBytes + cacheBytes };
  }

  // ───────────── what to mesh ─────────────

  /** Whether a chunk column lies outside the dungeon's array (the terrain owns it). */
  outside(cx: number, cz: number): boolean {
    return cx < 0 || cz < 0 || cx * CHUNK >= this.inner.sx || cz * CHUNK >= this.inner.sz;
  }

  /** The chunks outside the array within `radius` blocks of (x, z) whose cells or one-cell border
   *  cross the ground's top: the chunks to mesh round the viewer, nearest first. */
  chunksNear(x: number, z: number, radius: number): [number, number, number][] {
    const out: [number, number, number, number][] = [];
    const rc = Math.ceil(radius / CHUNK), pcx = Math.floor(x / CHUNK), pcz = Math.floor(z / CHUNK);
    const lim = Math.ceil((EDGE_R + CHUNK) / CHUNK);
    for (let cz = pcz - rc; cz <= pcz + rc; cz++) for (let cx = pcx - rc; cx <= pcx + rc; cx++) {
      if (!this.outside(cx, cz)) continue;
      const d = Math.hypot(cx * CHUNK + 8 - x, cz * CHUNK + 8 - z);
      if (d > radius + CHUNK) continue;
      // past the edge there is no ground at all: skip without computing the column
      if (Math.abs(cx - Math.floor(this.cx / CHUNK)) > lim || Math.abs(cz - Math.floor(this.cz / CHUNK)) > lim) continue;
      const col = this.column(cx, cz);
      if (!col.ground) continue;
      for (let cy = Math.floor(col.lo / CHUNK); cy <= Math.floor(col.hi / CHUNK); cy++) out.push([cx, cy, cz, d]);
    }
    out.sort((a, b) => a[3] - b[3]);
    return out.map(([a, b, c]) => [a, b, c]);
  }
}

const NEIGHBOURS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function angleDiff(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
