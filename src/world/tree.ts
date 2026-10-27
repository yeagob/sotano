import { AIR, MAT } from '../content/materials';
import { hash3, type Rng } from '../core/rng';
import type { VoxelWorld } from './world';

export type TreeZone = 'trunk' | 'branches' | 'leaves' | 'heaven';

export interface TreeStory {
  key: 'roots' | 'rings' | 'galleries' | 'hollows' | 'branches' | 'canopy' | 'stars';
  zone: TreeZone;
  y0: number; h: number;
  r: number;
}

export const TREE_STORIES: readonly TreeStory[] = [
  { key: 'roots', zone: 'trunk', y0: 0, h: 22, r: 34 },
  { key: 'rings', zone: 'trunk', y0: 22, h: 22, r: 30 },
  { key: 'galleries', zone: 'trunk', y0: 44, h: 22, r: 26 },
  { key: 'hollows', zone: 'trunk', y0: 66, h: 22, r: 23 },
  { key: 'branches', zone: 'branches', y0: 88, h: 24, r: 20 },
  { key: 'canopy', zone: 'leaves', y0: 112, h: 34, r: 0 },
  { key: 'stars', zone: 'heaven', y0: 146, h: 114, r: 0 },
];

export const TREE_ZONES = { trunk: 0, branches: 88, leaves: 112, heaven: 146 } as const;

const WALL = 3;
const STAIR_R = 6.5;
const STAIR_CORE = 2;
const STAIR_DA = 2 / 4.5;
const STAIR_HEAD = 3;

export interface StarPad { x: number; y: number; z: number; to: number }

export class GiantTree {
  readonly cx: number; readonly cz: number;
  readonly base: number;
  readonly top: number;
  readonly pads: StarPad[] = [];
  voxels = 0;
  private grown = new Set<number>();

  constructor(private w: VoxelWorld, surfaceY: number, private fork: (story: number) => Rng) {
    this.cx = w.sx >> 1; this.cz = w.sz >> 1; this.base = surfaceY + 1;
    this.top = Math.min(w.sy - 1, this.base + TREE_STORIES[TREE_STORIES.length - 1].y0 + TREE_STORIES[TREE_STORIES.length - 1].h - 1);
  }

  range(i: number): [number, number] {
    const s = TREE_STORIES[i];
    const y0 = i === 0 ? this.base - 2 : this.base + s.y0;
    const y1 = i === TREE_STORIES.length - 1 ? this.w.sy - 1 : this.base + s.y0 + s.h - 1;
    return [y0, y1];
  }

  storyAt(y: number): number {
    for (let i = TREE_STORIES.length - 1; i >= 0; i--) if (y >= this.range(i)[0]) return i;
    return -1;
  }

  isGrown(i: number) { return this.grown.has(i); }

  grow(i: number) {
    if (i < 0 || i >= TREE_STORIES.length || this.grown.has(i)) return;
    this.grown.add(i);
    const s = TREE_STORIES[i], [cy0, cy1] = this.range(i);
    const rng = this.fork(i);
    const put = (x: number, y: number, z: number, m: number) => {
      if (x < 1 || z < 1 || x > this.w.sx - 2 || z > this.w.sz - 2 || y < cy0 || y > cy1) return;
      const k = this.w.idx(x, y, z);
      if (this.w.data[k] === m) return;
      if (m !== AIR && this.w.data[k] === AIR) this.voxels++;
      this.w.data[k] = m;
      this.w.elem[k] = 0;
    };
    const fy = this.base + s.y0 + (i === 0 ? 0 : 2), ceil = this.base + s.y0 + s.h - 1;
    if (s.r > 0) this.trunk(i, put, fy, ceil, rng);
    if (s.key === 'roots') this.roots(put, fy, ceil, rng);
    if (s.key === 'rings') this.rings(i, put, fy, ceil, rng);
    if (s.key === 'galleries') this.galleries(i, put, fy, ceil, rng);
    if (s.key === 'hollows') this.hollows(i, put, fy, ceil, rng);
    if (s.key === 'branches') this.branches(i, put, fy, ceil, rng);
    if (s.key === 'canopy') this.canopy(i, put, fy, ceil, rng);
    if (s.key === 'stars') this.stars(put, fy, rng);
    if (i > 0) this.stair(i - 1, put);
    if (i < TREE_STORIES.length - 1) this.stair(i, put);
  }

  stairAt(i: number): [number, number] {
    const s = TREE_STORIES[i];
    const a = i * 2.4 + Math.PI / 4, d = s.r > 0 ? Math.max(0, s.r - WALL - STAIR_R - 2) : 10;
    return [this.cx + Math.round(Math.cos(a) * d), this.cz + Math.round(Math.sin(a) * d)];
  }

  private inStair(i: number, x: number, z: number, margin = 1) {
    const [sx, sz] = this.stairAt(i);
    return Math.hypot(x - sx, z - sz) <= STAIR_R + margin;
  }

  private nearStairs(i: number, x: number, z: number, margin = 1) {
    return this.inStair(i, x, z, margin) || (i > 0 && this.inStair(i - 1, x, z, margin));
  }

  private trunk(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const s = TREE_STORIES[i], r = s.r, { cx, cz } = this;
    const knots: number[] = [];
    for (let n = 3 + rng.int(0, 2); n > 0; n--) knots.push(rng.range(0, Math.PI * 2));
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > r + 0.5) continue;
      const x = cx + dx, z = cz + dz, a = Math.atan2(dz, dx);
      if (i > 0) { put(x, fy - 2, z, MAT.log); put(x, fy - 1, z, MAT.log); }
      if (d <= r - WALL + 0.5) continue;
      for (let y = fy; y <= ceil; y++) {
        const h = y - fy;
        const knot = h >= 3 && h <= 6 && knots.some(k => Math.abs(angleDiff(a, k)) * r < 2.2);
        put(x, y, z, knot ? AIR : MAT.log);
      }
    }
  }

  private stair(i: number, put: Put) {
    const s = TREE_STORIES[i], [sx, sz] = this.stairAt(i);
    const fy = this.base + s.y0 + (i === 0 ? 0 : 2);
    const steps = TREE_STORIES[i + 1].y0 + 2 - (s.y0 + (i === 0 ? 0 : 2));
    const a0 = i * 1.3;
    const R = Math.ceil(STAIR_R);
    const cells: [number, number, number][] = [];
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > STAIR_R) continue;
      if (d <= STAIR_CORE) { for (let y = fy; y < fy + steps; y++) put(sx + dx, y, sz + dz, MAT.log); continue; }
      if (d < STAIR_CORE + 0.6) continue;
      let t = Math.atan2(dz, dx) - a0;
      t = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      for (let m = 0; ; m++) {
        const j = Math.floor((t + m * Math.PI * 2) / STAIR_DA) + 1;
        if (j > steps) break;
        cells.push([sx + dx, sz + dz, j]);
      }
    }
    for (const [x, z, j] of cells) for (let y = 1; y <= STAIR_HEAD; y++) put(x, fy + j - 1 + y, z, AIR);
    for (const [x, z, j] of cells) put(x, fy + j - 1, z, MAT.log);
  }

  private roots(put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, r = TREE_STORIES[0].r;
    const doors = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (const a of doors) for (let s = r - WALL - 1; s <= r + 1; s++) for (let o = -3; o <= 3; o++) for (let y = fy; y < fy + 8; y++) {
      if (y - fy >= 6 && Math.abs(o) === 3) continue;
      put(cx + Math.round(Math.cos(a) * s - Math.sin(a) * o), y, cz + Math.round(Math.sin(a) * s + Math.cos(a) * o), AIR);
    }
    const n = 10 + rng.int(0, 2);
    for (let k = 0; k < n; k++) {
      const a = (k + 0.5) / n * Math.PI * 2 + rng.range(-0.12, 0.12);
      if (doors.some(d => Math.abs(angleDiff(a, d)) < 0.28)) continue;
      const bend = rng.range(-0.25, 0.25);
      for (let s = r - 2; s < 80; s++) {
        const t = (s - r + 2) / 40, aa = a + bend * t * t;
        const x = cx + Math.round(Math.cos(aa) * s), z = cz + Math.round(Math.sin(aa) * s);
        if (x < 1 || z < 1 || x > this.w.sx - 2 || z > this.w.sz - 2) break;
        const height = Math.round(10 * (1 - t) * (1 - t)), half = Math.max(0, Math.round(2 * (1 - t)));
        if (height <= 0) break;
        for (let o = -half; o <= half; o++) for (let y = 0; y < height - Math.abs(o); y++)
          put(x + Math.round(-Math.sin(aa) * o), fy + y, z + Math.round(Math.cos(aa) * o), MAT.log);
      }
    }
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2 + rng.range(-0.2, 0.2);
      for (let s = 6; s < r - WALL; s++) {
        const x = cx + Math.round(Math.cos(a) * s), z = cz + Math.round(Math.sin(a) * s);
        if (this.nearStairs(0, x, z) || (s % 9 === 4)) continue;
        put(x, fy, z, MAT.log);
        if (s > r - WALL - 9) put(x, fy + 1, z, MAT.log);
      }
    }
    for (let k = 0; k < 6; k++) {
      const a = (k + 0.5) / 6 * Math.PI * 2, d = r * 0.55;
      const px = cx + Math.round(Math.cos(a) * d), pz = cz + Math.round(Math.sin(a) * d);
      if (this.nearStairs(0, px, pz, 4)) continue;
      column(put, px, pz, fy, ceil, 2.2, MAT.log);
    }
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.hypot(dx, dz);
      if (d <= 4 && !this.nearStairs(0, cx + dx, cz + dz)) { put(cx + dx, fy, cz + dz, d < 2.5 ? MAT.dirt : MAT.grass); if (d < 2) put(cx + dx, fy + 1, cz + dz, MAT.grass); }
    }
  }

  private rings(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, r = TREE_STORIES[i].r;
    for (let rr = 7; rr < r - WALL - 2; rr += 5) {
      const gaps: number[] = [];
      for (let n = 2 + rng.int(0, 2); n > 0; n--) gaps.push(rng.range(0, Math.PI * 2));
      for (let dz = -rr - 1; dz <= rr + 1; dz++) for (let dx = -rr - 1; dx <= rr + 1; dx++) {
        const d = Math.hypot(dx, dz);
        if (Math.abs(d - rr) > 0.5) continue;
        const x = cx + dx, z = cz + dz, a = Math.atan2(dz, dx);
        if (gaps.some(g => Math.abs(angleDiff(a, g)) * rr < 2) || this.nearStairs(i, x, z)) continue;
        put(x, fy, z, MAT.log);
        if (rr % 2 === 0) put(x, fy + 1, z, MAT.log);
      }
    }
    if (!this.nearStairs(i, cx, cz, 3)) column(put, cx, cz, fy, ceil, 1.6, MAT.log);
  }

  private galleries(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, r = TREE_STORIES[i].r, inner = r - WALL;
    const level = 8;
    for (let dz = -inner; dz <= inner; dz++) for (let dx = -inner; dx <= inner; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > inner + 0.5 || d < inner - 4.5) continue;
      if (this.nearStairs(i, cx + dx, cz + dz)) continue;
      put(cx + dx, fy + level - 1, cz + dz, MAT.log);
      if (d < inner - 3.5 && hash3(7, cx + dx, i, cz + dz) > 0.3) put(cx + dx, fy + level, cz + dz, MAT.log);
    }
    for (let k = 0; k < 2; k++) {
      const a0 = rng.range(0, Math.PI * 2) + k * Math.PI, rr = inner - 2;
      for (let j = 1; j < level; j++) for (let t = 0; t < 2; t++) {
        const a = a0 + ((j - 1) * 2 + t) / rr;
        for (let o = -1; o <= 1; o++) {
          const x = cx + Math.round(Math.cos(a) * (rr + o)), z = cz + Math.round(Math.sin(a) * (rr + o));
          if (this.nearStairs(i, x, z)) continue;
          for (let y = fy; y < fy + j; y++) put(x, y, z, MAT.log);
          for (let y = fy + j; y < fy + level + 2; y++) put(x, y, z, AIR);
        }
      }
    }
    for (let n = 0; n < 14; n++) {
      const a = rng.range(0, Math.PI * 2), d = rng.range(4, inner - 6);
      const x = cx + Math.round(Math.cos(a) * d), z = cz + Math.round(Math.sin(a) * d);
      if (this.nearStairs(i, x, z, 2)) continue;
      const len = 2 + rng.int(0, 4);
      for (let y = 0; y < len; y++) put(x, ceil - y, z, MAT.leaves);
    }
  }

  private hollows(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, inner = TREE_STORIES[i].r - WALL;
    const posts: [number, number][] = [];
    for (let gz = -inner; gz <= inner; gz += 8) for (let gx = -inner; gx <= inner; gx += 8) {
      const x = cx + gx + rng.int(-1, 1), z = cz + gz + rng.int(-1, 1);
      if (Math.hypot(x - cx, z - cz) > inner - 3 || this.nearStairs(i, x, z, 3) || rng.chance(0.25)) continue;
      column(put, x, z, fy, ceil, 1.5, MAT.log);
      posts.push([x, z]);
    }
    const deck = fy + 9;
    for (const [ax, az] of posts) for (const [bx, bz] of posts) {
      if ((bx <= ax && bz <= az) || Math.hypot(bx - ax, bz - az) > 11 || hash3(11, ax + bx, i, az + bz) < 0.45) continue;
      const n = Math.max(Math.abs(bx - ax), Math.abs(bz - az));
      for (let t = 0; t <= n; t++) {
        const x = Math.round(ax + (bx - ax) * t / n), z = Math.round(az + (bz - az) * t / n);
        for (let ox = 0; ox <= 1; ox++) for (let oz = 0; oz <= 1; oz++) if (!this.nearStairs(i, x + ox, z + oz)) put(x + ox, deck, z + oz, MAT.log);
      }
    }
  }

  private branches(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, r = TREE_STORIES[i].r;
    const n = 7 + rng.int(0, 2);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rng.range(-0.15, 0.15);
      const y0 = fy + 2 + rng.int(0, 3);
      let ex = cx, ez = cz, ey = y0;
      for (let s = r - WALL - 1; s <= r + 30; s++) {
        const x = cx + Math.round(Math.cos(a) * s), z = cz + Math.round(Math.sin(a) * s), y = y0 + ((s - r) >> 2);
        if (x < 5 || z < 5 || x > this.w.sx - 6 || z > this.w.sz - 6) break;
        const thick = s < r + 10 ? 1 : 0;
        for (let ox = -thick; ox <= 1; ox++) for (let oz = -thick; oz <= 1; oz++) {
          put(x + ox, y, z + oz, MAT.log);
          if (thick) put(x + ox, y - 1, z + oz, MAT.log);
        }
        if (s <= r + 1) for (let oy = 1; oy <= 4; oy++) for (let ox = -1; ox <= 2; ox++) for (let oz = -1; oz <= 2; oz++) put(x + ox, y + oy, z + oz, AIR);
        ex = x; ez = z; ey = y;
      }
      if (Math.hypot(ex - cx, ez - cz) < r + 4) continue;
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dz * dz <= 10) put(ex + dx, ey, ez + dz, MAT.log);
      blob(this.w, put, ex, Math.min(ey + 8, ceil - 4), ez, 5);
    }
  }

  private canopy(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, rx = 54, rz = this.cz - 2, ry = ceil - fy;
    for (let dz = -30; dz <= 30; dz++) for (let dx = -30; dx <= 30; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > 30 || (d > 22 && hash3(13, cx + dx, i, cz + dz) < 0.35)) continue;
      put(cx + dx, fy - 2, cz + dz, MAT.log); put(cx + dx, fy - 1, cz + dz, MAT.log);
    }
    for (let y = fy - 2; y <= ceil; y++) for (let z = cz - rz; z <= cz + rz; z++) for (let x = cx - rx; x <= cx + rx; x++) {
      const e = ((x - cx) / rx) ** 2 + ((y - fy + 2) / (ry + 2)) ** 2 + ((z - cz) / rz) ** 2;
      if (e > 1 || e < 0.84) continue;
      if (hash3(17, x >> 3, y >> 3, z >> 3) < 0.18) continue;
      if (this.w.data[this.w.idx(x, y, z)] === AIR) put(x, y, z, MAT.leaves);
    }
    for (let k = 0; k < 5; k++) {
      const a = rng.range(0, Math.PI * 2), len = 26 + rng.int(0, 10);
      for (let s = 0; s < len; s++) {
        const x = cx + Math.round(Math.cos(a) * s), z = cz + Math.round(Math.sin(a) * s), y = fy + Math.round(s * 0.55);
        if (this.nearStairs(i, x, z, 2)) continue;
        for (let ox = 0; ox <= 1; ox++) for (let oz = 0; oz <= 1; oz++) put(x + ox, y, z + oz, MAT.log);
      }
    }
  }

  private stars(put: Put, fy: number, rng: Rng) {
    const [sx, sz] = this.stairAt(TREE_STORIES.length - 2);
    for (let dz = -9; dz <= 9; dz++) for (let dx = -9; dx <= 9; dx++) if (dx * dx + dz * dz <= 81) {
      put(sx + dx, fy - 2, sz + dz, MAT.log); put(sx + dx, fy - 1, sz + dz, MAT.log);
    }
    const pad = (x: number, y: number, z: number) => {
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) put(x + dx, y - 1, z + dz, MAT.starstone);
      this.pads.push({ x, y, z, to: -1 });
    };
    const a = Math.atan2(sz - this.cz, sx - this.cx);
    pad(sx - Math.round(Math.cos(a) * 6), fy, sz - Math.round(Math.sin(a) * 6));
    for (let c = 0; c < 3; c++) {
      const count = 4 + rng.int(0, 2);
      const a0 = (c / 3) * Math.PI * 2 + rng.range(-0.3, 0.3);
      for (let s = 0; s < count; s++) {
        const r = 12 + s * 8 + rng.int(0, 4), aa = a0 + s * 0.4;
        const x = Math.max(4, Math.min(this.w.sx - 5, this.cx + Math.round(Math.cos(aa) * r)));
        const z = Math.max(4, Math.min(this.w.sz - 5, this.cz + Math.round(Math.sin(aa) * r)));
        const y = Math.min(this.w.sy - 8, fy + 16 + c * 26 + s * 4 + rng.int(0, 4));
        pad(x, y, z);
      }
    }
    for (let p = 0; p < this.pads.length; p++) this.pads[p].to = (p + 1) % this.pads.length;
  }

}

type Put = (x: number, y: number, z: number, m: number) => void;

function angleDiff(a: number, b: number) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function column(put: Put, x0: number, z0: number, y0: number, y1: number, r: number, m: number) {
  const R = Math.ceil(r);
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) if (Math.hypot(dx, dz) <= r)
    for (let y = y0; y <= y1; y++) put(x0 + dx, y, z0 + dz, m);
}

function blob(w: VoxelWorld, put: Put, x0: number, y0: number, z0: number, r: number) {
  for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy * 2 + dz * dz > r * r) continue;
    const x = x0 + dx, y = y0 + dy, z = z0 + dz;
    if (w.inside(x, y, z) && w.data[w.idx(x, y, z)] === AIR) put(x, y, z, MAT.leaves);
  }
}
