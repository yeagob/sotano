// The mountains round the surface (issue #10, docs/architecture/LEVELS.md §13): a ring of ridges
// round the giant tree, outside the dungeon's array. The shape is a formula of the run's seed
// (`fork('mountains')`) baked once into a heightmap of columns (two bytes each), never stored as
// blocks: the world asks `block()` for any cell outside its array, and the mesher meshes the
// chunks the ground crosses. Nothing here can be broken or built on (the array holds every change).
//
// Seen from the tree (heights above the grass, distances from the trunk's axis):
//
//   0 ─ PLAIN_R         the plain: flat grass, the dungeon's square sits inside it
//   PLAIN_R ─ CREST_R   the inner wall: foothills that steepen into rugged cliffs
//   CREST_R             the crest: about half the tree's height, one peak per ridge as tall as the tree
//   CREST_R ─ FOOT_R    the outer wall, steeper, down to the far plain
//   FOOT_R ─ EDGE_R     the far plain (other areas will open here later), then the edge
//
// PASSES flat corridors cut the ring into ridges; each ridge has one trail of one-block steps
// (worn earth) from the plain to a shoulder on its crest, so every ridge can be climbed by jumping.

import { AIR, MAT } from '../content/materials';
import { hash3, type Rng } from '../core/rng';
import { TREE_ZONES } from './tree';
import { CHUNK } from './world';

/** The tree's height above the grass (the top of its canopy): the highest peak reaches it. */
export const PEAK = TREE_ZONES.heaven;
export const PLAIN_R = 76;
export const INNER_W = 60;
export const CREST_R = PLAIN_R + INNER_W;
export const OUTER_W = 36;
export const FOOT_R = CREST_R + OUTER_W;
export const EDGE_R = FOOT_R + 16;
export const PASSES = 3;
/** Half the width of a pass's flat floor, and how far its sides take to reach the ridge. */
export const PASS_HALF = 4;
const PASS_RAMP = 22;
/** The crest height where a ridge's trail arrives (it must fit in the inner wall at one block a block). */
export const SHOULDER = 48;
/** The trail is the strip within this many blocks of its line (three blocks wide). */
const TRAIL_HALF = 1.5;
/** How wide a peak spreads along the crest (blocks of arc). */
const PEAK_W = 36;
/** Gentle ground under this height is grass; anything steeper or higher is bare stone. */
const GRASS_LINE = 40;
/** How far under the grass the terrain's ground goes (a skirt: nothing below it is ever seen). */
export const DEPTH = 6;
const NONE = -1;

export interface Ridge {
  /** The passes it runs between (angles round the tree, radians), `from` < `to` (unwrapped). */
  from: number; to: number;
  /** The angle of its peak (as tall as the tree) and of its trail. */
  peak: number; trail: number;
}

export class Mountains {
  readonly x0: number; readonly z0: number; readonly n: number;
  readonly passes: number[] = [];
  readonly ridges: Ridge[] = [];
  /** Height above the grass of every column of the square round the tree, NONE past the edge. */
  readonly heights: Int16Array;
  private readonly tops: Uint8Array;
  private readonly trails: Uint8Array;
  private readonly phase: number[];
  private readonly noise: number;

  /** (cx, cz): the tree's axis; `surfaceY`: the grass; `inner`: the dungeon array's size (sx, sz). */
  constructor(rng: Rng, readonly cx: number, readonly cz: number, readonly surfaceY: number, private inner: { sx: number; sz: number }) {
    const base = rng.range(0, Math.PI * 2);
    for (let k = 0; k < PASSES; k++) this.passes.push(base + (k * Math.PI * 2) / PASSES + rng.range(-0.25, 0.25));
    for (let k = 0; k < PASSES; k++) {
      const from = this.passes[k], to = this.passes[(k + 1) % PASSES] + (k === PASSES - 1 ? Math.PI * 2 : 0), span = to - from;
      this.ridges.push({ from, to, peak: from + span * rng.range(0.25, 0.4), trail: from + span * rng.range(0.6, 0.75) });
    }
    this.phase = [rng.range(0, Math.PI * 2), rng.range(0, Math.PI * 2), rng.range(0, Math.PI * 2)];
    this.noise = rng.u32();
    this.n = EDGE_R * 2 + 1; this.x0 = cx - EDGE_R; this.z0 = cz - EDGE_R;
    this.heights = new Int16Array(this.n * this.n);
    this.tops = new Uint8Array(this.n * this.n);
    this.trails = new Uint8Array(this.n * this.n);
    this.build();
  }

  /** The crest's height at an angle: the ridge's own line, its peak, its trail's shoulder. */
  crest(a: number): number {
    const [p1, p2, p3] = this.phase;
    let h = PEAK * (0.5 + 0.08 * Math.sin(3 * a + p1) + 0.06 * Math.sin(7 * a + p2) + 0.04 * Math.sin(13 * a + p3));
    for (const r of this.ridges) {
      h = Math.max(h, PEAK * Math.exp(-((angleDiff(a, r.peak) * CREST_R / PEAK_W) ** 2)));
      const t = smoothstep(TRAIL_HALF + 1, TRAIL_HALF + 28, Math.abs(angleDiff(a, r.trail)) * CREST_R);
      h = SHOULDER + (h - SHOULDER) * t;
    }
    return h;
  }

  /** 0 inside a pass's floor, 1 clear of it: how much of the ridge stands at (a, r). */
  private open(a: number, r: number): number {
    let f = 1;
    for (const p of this.passes) f = Math.min(f, smoothstep(PASS_HALF, PASS_HALF + PASS_RAMP, Math.abs(angleDiff(a, p)) * r));
    return f;
  }

  private build() {
    const { n } = this;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const dx = this.x0 + i - this.cx, dz = this.z0 + j - this.cz, r = Math.hypot(dx, dz), k = i + n * j;
      if (r > EDGE_R) { this.heights[k] = NONE; continue; }
      if (r <= PLAIN_R || r >= FOOT_R) continue;
      const a = Math.atan2(dz, dx);
      const trail = this.ridges.find(rd => r <= CREST_R + 2 && Math.abs(angleDiff(a, rd.trail)) * r <= TRAIL_HALF);
      if (trail) { this.heights[k] = Math.min(SHOULDER, Math.floor(r - PLAIN_R)); this.trails[k] = 1; continue; }
      const prof = r <= CREST_R ? ((r - PLAIN_R) / INNER_W) ** 1.5 : (1 - (r - CREST_R) / OUTER_W) ** 1.5;
      let h = Math.round(this.crest(a) * prof * this.open(a, r));
      // rugged, never a smooth wall: a step up or down in blocks of 2 × 2
      if (h >= 2) h += Math.floor(hash3(this.noise, (this.x0 + i) >> 1, 0, (this.z0 + j) >> 1) * 3) - 1;
      this.heights[k] = Math.max(0, Math.min(PEAK, h));
    }
    // each ridge's summit stands exactly as tall as the tree
    for (const rd of this.ridges) {
      const i = Math.round(this.cx + Math.cos(rd.peak) * CREST_R) - this.x0, j = Math.round(this.cz + Math.sin(rd.peak) * CREST_R) - this.z0;
      this.heights[i + n * j] = PEAK;
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const k = i + n * j, h = this.heights[k];
      if (h === NONE) continue;
      if (this.trails[k]) { this.tops[k] = MAT.dirt; continue; }
      let steep = 0;
      for (const [di, dj] of NEIGHBOURS) {
        const hn = this.heightAt(i + di, j + dj);
        if (hn !== NONE) steep = Math.max(steep, Math.abs(hn - h));
      }
      this.tops[k] = h <= GRASS_LINE && steep <= 1 ? MAT.grass : MAT.stone;
    }
  }

  private heightAt(i: number, j: number): number {
    return i < 0 || j < 0 || i >= this.n || j >= this.n ? NONE : this.heights[i + this.n * j];
  }

  /** Height above the grass of the column (x, z), or -1 where there is no ground (past the edge). */
  height(x: number, z: number): number { return this.heightAt(x - this.x0, z - this.z0); }

  /** Whether (x, z) lies on a ridge's trail. */
  onTrail(x: number, z: number): boolean {
    const i = x - this.x0, j = z - this.z0;
    return i >= 0 && j >= 0 && i < this.n && j < this.n && this.trails[i + this.n * j] === 1;
  }

  /** The block at a cell (the world asks only for cells outside its array). */
  block(x: number, y: number, z: number): number {
    const i = x - this.x0, j = z - this.z0;
    if (i < 0 || j < 0 || i >= this.n || j >= this.n || y < this.surfaceY - DEPTH) return AIR;
    const k = i + this.n * j, h = this.heights[k];
    if (h === NONE) return AIR;
    const top = this.surfaceY + h;
    if (y > top) return AIR;
    const m = this.tops[k];
    if (y === top) return m;
    return m !== MAT.stone && y >= top - 3 ? MAT.dirt : MAT.stone;
  }

  /** Whether a chunk column lies outside the dungeon's array (the terrain owns it). */
  outside(cx: number, cz: number): boolean {
    return cx < 0 || cz < 0 || cx * CHUNK >= this.inner.sx || cz * CHUNK >= this.inner.sz;
  }

  /** Whether a chunk column outside the array holds any ground. */
  covers(cx: number, cz: number): boolean {
    return this.outside(cx, cz) && cx * CHUNK + CHUNK > this.x0 && cz * CHUNK + CHUNK > this.z0
      && cx * CHUNK <= this.x0 + this.n - 1 && cz * CHUNK <= this.z0 + this.n - 1;
  }

  /** Every chunk outside the array whose cells or one-cell border cross the ground's top: the chunks to mesh. */
  chunks(): [number, number, number][] {
    const out: [number, number, number][] = [];
    const c0x = Math.floor(this.x0 / CHUNK), c1x = Math.floor((this.x0 + this.n - 1) / CHUNK);
    const c0z = Math.floor(this.z0 / CHUNK), c1z = Math.floor((this.z0 + this.n - 1) / CHUNK);
    for (let cz = c0z; cz <= c1z; cz++) for (let cx = c0x; cx <= c1x; cx++) {
      if (!this.outside(cx, cz)) continue;
      let lo = Infinity, hi = -Infinity, ground = false;
      for (let z = cz * CHUNK - 1; z <= cz * CHUNK + CHUNK; z++) for (let x = cx * CHUNK - 1; x <= cx * CHUNK + CHUNK; x++) {
        const h = this.height(x, z);
        // next to a column with no ground the edge shows its whole skirt
        const top = this.surfaceY + Math.max(0, h);
        lo = Math.min(lo, h === NONE ? this.surfaceY - DEPTH - 1 : top - 1); hi = Math.max(hi, top + 1);
        if (h !== NONE) ground = true;
      }
      if (!ground) continue;
      for (let cy = Math.floor(lo / CHUNK); cy <= Math.floor(hi / CHUNK); cy++) out.push([cx, cy, cz]);
    }
    return out;
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
