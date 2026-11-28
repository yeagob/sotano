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
import { elemByte, EL_LAVA, EL_WATER, SOURCE } from '../content/elements';
import { hash3, type Rng } from '../core/rng';
import { ExceptionKind } from '../sky/types';
import { ChunkCache, type SkyChunk } from '../sky/world/cache';
import { TREE_ZONES } from './tree';
import { CHUNK } from './world';
import {
  BEDROCK, LAVA_FLOOR, LAVA_TOP, RELIEF_LOW, ROOT_BUSH, ROOT_CHANCE, ROOT_NONE, SEA, SHAFT_HALF,
  TRAP_DEPTH, TREE_REACH, canopyAt, groundHeight, groundRelief, reliefRamp, rootOf, rootRoll, trunkOf,
} from './void';
import { BIOME, BIOME_R, Biomes, ICE_CRUST, PEAK_HIGH, SAND_DEPTH, SPIRE_CHANCE, type Structure } from './biomes';
import { DEEP_SAND, basinBlend, basinHeight, inWormDesert, wormDesertDistance } from './worm-desert';

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

/** Chunk columns whose heights are kept (each 18 × 18 heights and 16 × 16 tops, under 1 KB). */
export const COLUMN_CAP = 1024;
/** Materialised terrain chunks kept (4 KB each): 2 MB. */
export const TERRAIN_CHUNKS = 512;

const C3 = CHUNK * CHUNK * CHUNK;
const W = CHUNK + 2;
/** The shared all-air chunk (never written). */
const EMPTY: SkyChunk = { blocks: new Uint8Array(C3), elem: null };
const SCRATCH = new Uint8Array(C3);
const SCRATCH_ELEM = new Uint8Array(C3);
const CROWN = 8;
const LAVA_CELL = elemByte(EL_LAVA, SOURCE) << 8;
const WATER_CELL = elemByte(EL_WATER, SOURCE) << 8;
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
interface Column { heights: Int16Array; tops: Uint8Array; voids: Uint8Array; deep: Uint8Array; lo: number; hi: number; vlo: number; vhi: number }

interface RootInfo { top: number; kind: number; trunk: number; spire: boolean }

const soil = (y: number, top: number, m: number) => {
  if (y === top) return m;
  if (m === MAT.sand) return y >= top - SAND_DEPTH ? MAT.sand : MAT.stone;
  return m !== MAT.stone && m !== MAT.ice && y >= top - 3 ? MAT.dirt : MAT.stone;
};
const FROZEN = 1 + BIOME.ice;

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
  private readonly editLow = new Map<number, number>();
  editVersion = 0;
  readonly biomes: Biomes;

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
    this.biomes = new Biomes(this.noise, cx, cz);
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

  /** The formula: height above the grass of the column (x, z). Pure. */
  heightOf(x: number, z: number): number {
    const dx = x - this.cx, dz = z - this.cz, r = Math.hypot(dx, dz);
    if (r > EDGE_R) {
      if (r <= BIOME_R) return groundHeight(this.noise, x, z, reliefRamp(r, EDGE_R));
      let h = this.biomes.height(x, z, groundRelief(this.noise, x, z, reliefRamp(r, EDGE_R)));
      // the worm's basin (worm-desert/README.md): the dunes flatten into a low swell of deep sand
      const k = basinBlend(wormDesertDistance(this.cx, this.cz, x, z));
      if (k > 0) h += (basinHeight(x, z) - h) * k;
      return Math.max(RELIEF_LOW, Math.min(PEAK_HIGH, Math.round(h)));
    }
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
    const heights = new Int16Array(W * W), tops = new Uint8Array(CHUNK * CHUNK), voids = new Uint8Array(CHUNK * CHUNK), deep = new Uint8Array(CHUNK * CHUNK);
    const x0 = ccx * CHUNK - 1, z0 = ccz * CHUNK - 1;
    let lo = Infinity, hi = -Infinity, vlo = Infinity, vhi = -Infinity;
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      const x = x0 + i, z = z0 + j, h = this.heightOf(x, z), v = this.voidAt(x, z);
      heights[i + W * j] = h;
      lo = Math.min(lo, v ? this.surfaceY + BEDROCK : this.surfaceY - DEPTH - 1);
      vlo = Math.min(vlo, v ? this.surfaceY + h - 1 : this.surfaceY - DEPTH - 1);
      hi = Math.max(hi, this.surfaceY + h + 1 + (v ? CROWN : 0), this.surfaceY + SEA);
      vhi = Math.max(vhi, this.surfaceY + h + 1, this.surfaceY + SEA);
    }
    for (const s of this.structuresIn(x0, z0, x0 + W - 1, z0 + W - 1)) { hi = Math.max(hi, this.surfaceY + s.d1); vhi = Math.max(vhi, this.surfaceY + s.d1); }
    for (let j = 1; j <= CHUNK; j++) for (let i = 1; i <= CHUNK; i++) {
      const h = heights[i + W * j], x = x0 + i, z = z0 + j, k = (i - 1) + CHUNK * (j - 1);
      const v = this.voidAt(x, z), kind = v ? this.biomes.kind(x, z) : BIOME.void;
      voids[k] = v ? 1 + kind : 0;
      if (v && inWormDesert(this.cx, this.cz, x, z)) { deep[k] = 1; lo = Math.min(lo, this.surfaceY - DEEP_SAND); }
      if (this.onStair(x, z)) { tops[k] = MAT.dirt; continue; }
      let steep = 0;
      for (const [di, dj] of NEIGHBOURS) steep = Math.max(steep, Math.abs(heights[i + di + W * (j + dj)] - h));
      tops[k] = v ? this.biomes.top(kind, x, z, h, steep <= 1) : h <= GRASS_LINE && steep <= 1 ? MAT.grass : MAT.stone;
      if (v && (tops[k] === MAT.grass || kind === BIOME.ice)) vhi = Math.max(vhi, this.surfaceY + h + CROWN + TREE_REACH);
    }
    c = { heights, tops, voids, deep, lo, hi, vlo, vhi };
    this.columns.set(key, c);
    if (this.columns.size > COLUMN_CAP) this.columns.delete(this.columns.keys().next().value as number);
    return c;
  }

  height(x: number, z: number): number {
    const ccx = Math.floor(x / CHUNK), ccz = Math.floor(z / CHUNK);
    return this.column(ccx, ccz).heights[(x - ccx * CHUNK + 1) + W * (z - ccz * CHUNK + 1)];
  }

  topAt(x: number, z: number): number {
    const ccx = Math.floor(x / CHUNK), ccz = Math.floor(z / CHUNK);
    return this.column(ccx, ccz).tops[(x - ccx * CHUNK) + CHUNK * (z - ccz * CHUNK)];
  }

  biomeAt(x: number, z: number): number {
    return this.voidAt(x, z) ? this.biomes.kind(x, z) : BIOME.void;
  }

  private structuresIn(x0: number, z0: number, x1: number, z1: number): Structure[] {
    return this.biomes.structures.filter(s => s.x1 >= x0 && s.x0 <= x1 && s.z1 >= z0 && s.z0 <= z1);
  }

  structureAt(x: number, y: number, z: number): number {
    const d = y - this.surfaceY;
    for (const s of this.biomes.structures) {
      if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1 || d < s.d0 || d > s.d1) continue;
      const v = s.at(x, d, z, this.height(x, z));
      if (v >= 0) return v;
    }
    return -1;
  }

  // ───────────── chunks (the sky's cache: formula, then exceptions) ─────────────

  private at(x: number, y: number, z: number): SkyChunk {
    const k = chunkNum(x >> 4, y >> 4, z >> 4), c = this.cache;
    return k === c.lastKey ? c.last! : this.chunk(x >> 4, y >> 4, z >> 4, k);
  }

  /** The block at a cell (the world asks only for cells outside its array). */
  block(x: number, y: number, z: number): number {
    return this.at(x, y, z).blocks[localOf(x, y, z)];
  }

  elemAt(x: number, y: number, z: number): number {
    return this.at(x, y, z).elem?.[localOf(x, y, z)] ?? 0;
  }

  private cell(col: Column, lx: number, lz: number, y: number): number {
    const i = lx + CHUNK * lz, h = col.heights[(lx + 1) + W * (lz + 1)], top = this.surfaceY + h, d = y - this.surfaceY;
    if (col.deep[i]) {
      // deep sand down to the bedrock: no lava sea under the worm's basin (owner: no hell under the desert)
      if (d === -DEEP_SAND) return MAT.bedrock;
      if (d > -DEEP_SAND && y <= top) return MAT.sand;
      return d > SEA || d < -DEEP_SAND ? AIR : WATER_CELL;
    }
    if (col.voids[i]) {
      if (d === BEDROCK) return MAT.bedrock;
      if (d >= LAVA_FLOOR && d <= LAVA_TOP) return LAVA_CELL;
      if (y <= top) return d > LAVA_TOP ? soil(y, top, col.tops[i]) : AIR;
      if (d > SEA) return AIR;
      return col.voids[i] === FROZEN && d > SEA - ICE_CRUST ? MAT.ice : WATER_CELL;
    }
    if (y < this.surfaceY - DEPTH || y > top) return AIR;
    return soil(y, top, col.tops[i]);
  }

  private rootAt(rx: number, rz: number): RootInfo | null {
    if (Math.hypot(rx - this.cx, rz - this.cz) <= EDGE_R + TREE_REACH) return null;
    const roll = rootRoll(this.noise, rx, rz);
    if (roll >= ROOT_CHANCE || this.biomes.near(rx, rz, TREE_REACH)) return null;
    const top = this.topAt(rx, rz);
    const spire = top !== MAT.grass && roll < SPIRE_CHANCE && this.biomeAt(rx, rz) === BIOME.ice && this.height(rx, rz) >= SEA;
    if (top !== MAT.grass && !spire) return null;
    const h = this.height(rx, rz);
    let steep = 0;
    for (const [di, dj] of NEIGHBOURS) steep = Math.max(steep, Math.abs(this.height(rx + di, rz + dj) - h));
    const kind = rootOf(roll, Math.max(h, spire ? 1 : h), steep);
    return kind === ROOT_NONE ? null : { top: this.surfaceY + h, kind, trunk: trunkOf(this.noise, rx, rz), spire };
  }

  private rootBlock(rx: number, rz: number, root: RootInfo, x: number, y: number, z: number): number {
    const dy = y - root.top;
    if (root.spire) {
      const r = Math.abs(x - rx) + Math.abs(z - rz);
      return dy >= 1 && ((r === 0 && dy <= root.trunk) || (r === 1 && dy <= root.trunk - 3) || (r === 2 && dy === 1 && x !== rx && z !== rz)) ? MAT.ice : AIR;
    }
    if (root.kind === ROOT_BUSH) return x === rx && z === rz && dy === 1 ? MAT.leaves : AIR;
    if (x === rx && z === rz && dy >= 1 && dy <= root.trunk) return MAT.log;
    return canopyAt(x - rx, y - (root.top + root.trunk), z - rz) ? MAT.leaves : AIR;
  }

  private paintTrees(blocks: Uint8Array, x0: number, oy: number, z0: number) {
    for (let rz = z0 - TREE_REACH; rz < z0 + CHUNK + TREE_REACH; rz++) for (let rx = x0 - TREE_REACH; rx < x0 + CHUNK + TREE_REACH; rx++) {
      const root = this.rootAt(rx, rz);
      if (!root) continue;
      const yTop = Math.min(oy + CHUNK - 1, root.top + root.trunk + 1), yBottom = Math.max(oy, root.top + 1);
      for (let y = yBottom; y <= yTop; y++) for (let z = Math.max(z0, rz - TREE_REACH); z <= Math.min(z0 + CHUNK - 1, rz + TREE_REACH); z++)
        for (let x = Math.max(x0, rx - TREE_REACH); x <= Math.min(x0 + CHUNK - 1, rx + TREE_REACH); x++) {
          const i = (x - x0) + CHUNK * ((y - oy) + CHUNK * (z - z0));
          if (blocks[i] === AIR) blocks[i] = this.rootBlock(rx, rz, root, x, y, z);
        }
    }
  }

  private chunk(ccx: number, ccy: number, ccz: number, k: number): SkyChunk {
    const hit = this.cache.get(k);
    if (hit) return hit;
    const col = this.column(ccx, ccz), edits = this.edits.get(k), oy = ccy * CHUNK;
    if (!edits && (oy > col.hi || oy + CHUNK - 1 < col.lo)) { this.cache.remember(k, EMPTY); return EMPTY; }
    const blocks = SCRATCH, elem = SCRATCH_ELEM;
    let wet = false;
    elem.fill(0);
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) for (let ly = 0; ly < CHUNK; ly++) {
      const v = this.cell(col, lx, lz, oy + ly), li = lx + CHUNK * (ly + CHUNK * lz);
      blocks[li] = v & 255;
      if (v >> 8) { wet = true; elem[li] = v >> 8; }
    }
    const x0 = ccx * CHUNK, z0 = ccz * CHUNK;
    this.paintTrees(blocks, x0, oy, z0);
    this.paintStructures(blocks, elem, x0, oy, z0);
    if (edits) for (const [li, v] of edits) { blocks[li] = v & 255; if ((v & 255) !== AIR) elem[li] = 0; }
    let any = false;
    for (let i = 0; i < C3 && !any; i++) if (blocks[i] || elem[i]) any = true;
    if (!any) { this.cache.put(k, EMPTY); return EMPTY; }
    const out: SkyChunk = { blocks: blocks.slice(), elem: wet && elem.some(e => e !== 0) ? elem.slice() : null };
    this.cache.put(k, out);
    return out;
  }

  private paintStructures(blocks: Uint8Array, elem: Uint8Array, x0: number, oy: number, z0: number) {
    for (const s of this.structuresIn(x0, z0, x0 + CHUNK - 1, z0 + CHUNK - 1)) {
      const yLo = Math.max(oy, this.surfaceY + s.d0), yHi = Math.min(oy + CHUNK - 1, this.surfaceY + s.d1);
      if (yLo > yHi) continue;
      for (let z = Math.max(z0, s.z0); z <= Math.min(z0 + CHUNK - 1, s.z1); z++) for (let x = Math.max(x0, s.x0); x <= Math.min(x0 + CHUNK - 1, s.x1); x++) {
        const g = this.height(x, z);
        for (let y = yLo; y <= yHi; y++) {
          const v = s.at(x, y - this.surfaceY, z, g);
          if (v < 0) continue;
          const li = (x - x0) + CHUNK * ((y - oy) + CHUNK * (z - z0));
          blocks[li] = v;
          elem[li] = 0;
        }
      }
    }
  }

  /** The formula alone at a cell, ignoring exceptions. */
  base(x: number, y: number, z: number): number {
    const ccx = Math.floor(x / CHUNK), ccz = Math.floor(z / CHUNK);
    const st = this.structureAt(x, y, z);
    if (st >= 0) return st;
    const b = this.cell(this.column(ccx, ccz), x - ccx * CHUNK, z - ccz * CHUNK, y) & 255;
    if (b !== AIR) return b;
    for (let rz = z - TREE_REACH; rz <= z + TREE_REACH; rz++) for (let rx = x - TREE_REACH; rx <= x + TREE_REACH; rx++) {
      const root = this.rootAt(rx, rz);
      const m = root ? this.rootBlock(rx, rz, root, x, y, z) : AIR;
      if (m !== AIR) return m;
    }
    return AIR;
  }

  voidAt(x: number, z: number): boolean {
    return Math.hypot(x - this.cx, z - this.cz) > EDGE_R;
  }

  voidMix(x: number, z: number): number {
    return reliefRamp(Math.hypot(x - this.cx, z - this.cz), EDGE_R);
  }

  breakable(x: number, y: number, z: number): boolean {
    if (!this.voidAt(x, z)) return false;
    return y - this.surfaceY > (this.deepAt(x, z) ? -DEEP_SAND : LAVA_TOP);
  }

  /** Whether the column (x, z) is the worm's deep sand (worm-desert/README.md): no lava under it, no lava trap. */
  deepAt(x: number, z: number): boolean {
    return this.voidAt(x, z) && inWormDesert(this.cx, this.cz, Math.floor(x), Math.floor(z));
  }

  trapped(x: number, y: number, z: number): boolean {
    const fx = Math.floor(x), fz = Math.floor(z);
    return this.voidAt(fx, fz) && !this.deepAt(fx, fz) && Math.floor(y) <= this.surfaceY + this.height(fx, fz) - TRAP_DEPTH;
  }

  shaft(x: number, y: number, z: number): [number, number, number][] {
    const cx = Math.floor(x), cz = Math.floor(z), top = Math.floor(y), out: [number, number, number][] = [];
    for (let dz = -SHAFT_HALF; dz <= SHAFT_HALF; dz++) for (let dx = -SHAFT_HALF; dx <= SHAFT_HALF; dx++)
      for (let yy = top; yy > this.surfaceY + LAVA_TOP; yy--) if (this.breakable(cx + dx, yy, cz + dz)) out.push([cx + dx, yy, cz + dz]);
    return out;
  }

  /** Records an exception (WORLD-STORAGE §5.1): a cell set back to its formula keeps none, unless it
   *  was placed. The game reaches it only in the Outer Void (decision 8 of WORLD-STORAGE, amended by OUTER-VOID.md). */
  except(x: number, y: number, z: number, m: number, placing = false) {
    const k = chunkNum(x >> 4, y >> 4, z >> 4), li = localOf(x, y, z), b = this.base(x, y, z);
    let e = this.edits.get(k);
    const was = e?.get(li);
    const kind = m !== AIR && (placing || (was !== undefined && was >> 8 === ExceptionKind.Placed)) ? ExceptionKind.Placed
      : m === b ? 0 : m === AIR ? ExceptionKind.Broken : ExceptionKind.Replaced;
    if (kind) { if (!e) { e = new Map(); this.edits.set(k, e); } e.set(li, m | kind << 8); }
    else if (e) { e.delete(li); if (!e.size) this.edits.delete(k); }
    const ck = colKey(x >> 4, z >> 4), low = this.editLow.get(ck);
    if (low === undefined || y >> 4 < low) this.editLow.set(ck, y >> 4);
    this.editVersion++;
    const c = this.cache.peek(k);
    if (c === EMPTY) this.cache.delete(k);
    else if (c) { c.blocks[li] = m; if (c.elem && m !== AIR) c.elem[li] = 0; } else this.cache.forget(k);
  }

  stats(): TerrainStats {
    let exceptions = 0;
    for (const e of this.edits.values()) exceptions += e.size;
    const formula = 8 * (this.passes.length + 3 * this.ridges.length + this.phase.length + this.stairs.length + 2 * this.summits.length + 4 * this.biomes.peaks.length + 9) + 4;
    const exceptionBytes = exceptions * 4 + this.edits.size * 16;
    const cacheBytes = this.columns.size * (W * W * 2 + 2 * CHUNK * CHUNK) + this.cache.size * C3 * 2;
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
    for (let cz = pcz - rc; cz <= pcz + rc; cz++) for (let cx = pcx - rc; cx <= pcx + rc; cx++) {
      if (!this.outside(cx, cz)) continue;
      const d = Math.hypot(cx * CHUNK + 8 - x, cz * CHUNK + 8 - z);
      if (d > radius + CHUNK) continue;
      const col = this.column(cx, cz);
      let lo = Math.floor(col.vlo / CHUNK);
      for (const [di, dj] of AROUND) {
        const e = this.editLow.get(colKey(cx + di, cz + dj));
        if (e !== undefined) lo = Math.min(lo, e - 1);
      }
      for (let cy = lo; cy <= Math.floor(col.vhi / CHUNK); cy++) out.push([cx, cy, cz, d]);
    }
    out.sort((a, b) => a[3] - b[3]);
    return out.map(([a, b, c]) => [a, b, c]);
  }
}

const NEIGHBOURS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const AROUND: readonly [number, number][] = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function angleDiff(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
