import { AIR, MAT } from '../content/materials';
import { CELL_STACK, ROCK, ROOM_D, ROOM_H, ROOM_W, ceilingAt } from '../content/rooms';
import { CROWN_PALETTE, LEAVES_OCULUS, LEAVES_ROOM } from '../content/crown';
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

/** The bark of each trunk story (docs/design/built/levels/giant-tree/BARK.md): root bark at the foot,
 *  living wood in the middle, old bark high up; the stair stays living wood all the way; above the trunk, boughs. */
export const STORY_BARK: Readonly<Record<TreeStory['key'], string>> = {
  roots: 'rootbark', rings: 'log', galleries: 'log', hollows: 'oldbark', branches: 'oldbark', canopy: 'bough', stars: 'bough',
};
/** Rows at the foot of a story where its bark gives way, patch by patch, to the bark of the story below. */
export const BARK_BLEND = 4;
/** Share of the crown's leaf cells (4 × 4 × 4) that are young leaves; more of them towards the top. */
export const YOUNG_LEAF_SHARE = 0.3;

/** Stands for "this story's bark" in the builders; `put` resolves it cell by cell (`barkAt`). */
const BARK = -1;
const WALL = 3;
const STAIR_R = 6.5;
const STAIR_CORE = 2;
const STAIR_DA = 2 / 4.5;
const STAIR_HEAD = 3;

/** `up`: the last star of the last constellation; stepping on it leaves the built tree upward (SKY.md §2.4). */
export interface StarPad { x: number; y: number; z: number; to: number; up?: boolean }

/** The star pad a body stands on (its feet's cell is the pad's centre, on the ground), or -1 (STARS.md). */
export function padUnder(pads: readonly StarPad[], x: number, y: number, z: number, onGround: boolean): number {
  if (!onGround) return -1;
  const fx = Math.floor(x), fy = Math.floor(y + 0.05), fz = Math.floor(z);
  return pads.findIndex(q => q.x === fx && q.y === fy && q.z === fz);
}

/** The pads' chain, one frame (STARS.md): stepping onto pad `pad` carries you to its next, unless it is the pad you
 *  were just carried to (`lock`); stepping off every pad re-arms it. Returns the new lock and the pad to go to. */
export function padTravel(pads: readonly StarPad[], pad: number, lock: number): { lock: number; to: StarPad | null } {
  if (pad < 0) return { lock: -1, to: null };
  if (pad === lock) return { lock, to: null };
  return { lock: pads[pad].to, to: pads[pads[pad].to] };
}

/** The centre of the spiral stair that climbs from story `i` into story `i + 1`, for a tree centred on (cx, cz). */
export function stairCentre(i: number, cx: number, cz: number): [number, number] {
  const s = TREE_STORIES[i];
  const a = i * 2.4 + Math.PI / 4, d = s.r > 0 ? Math.max(0, s.r - WALL - STAIR_R - 2) : 10;
  return [cx + Math.round(Math.cos(a) * d), cz + Math.round(Math.sin(a) * d)];
}

/** The steps of stair `i` that a cell (dx, dz) from the stair's centre carries, one per turn (1 is the lowest step). */
function stepsAt(i: number, dx: number, dz: number, steps: number): number[] {
  let t = Math.atan2(dz, dx) - i * 1.3;
  t = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const out: number[] = [];
  for (let m = 0; ; m++) {
    const j = Math.floor((t + m * Math.PI * 2) / STAIR_DA) + 1;
    if (j > steps) return out;
    out.push(j);
  }
}

/** The Leaves (owner decision D14, docs/design/built/levels/giant-tree/LEAVES.md): the room of the crown, by the
 *  stair from the canopy to the stars. `x0, y0, z0` is the interior's corner (y0 the first block of air over the
 *  floor, as a floor's rooms); the doorway is the west one, three wide, onto the step of the stair at that height. */
export interface LeavesRoom {
  x0: number; y0: number; z0: number;
  w: number; d: number; height: number;
  /** The doorway's cells between the stair and the room (x from x0 − 3 to x0 − 1, the template's west rows 2–4). */
  door: { x0: number; x1: number; z0: number; z1: number };
  /** The stair step the doorway opens onto (1 is the stair's lowest step). */
  step: number;
}

/** The canopy story's index, and the stair that climbs out of it to the stars, which the Leaves hang beside. */
const CANOPY = TREE_STORIES.findIndex(s => s.key === 'canopy');
/** How far east of the stair's centre the room's interior begins: the stair's tread ends at 6.5, the doorway is
 *  three blocks (one over the gap, two through the shell of leaves). */
const LEAVES_OFFSET = 10;
/** The highest the Leaves may reach: the stair step it opens onto is the one nearest this height over the canopy's floor. */
const LEAVES_LIFT = 18;

/** Where the Leaves stand for a tree centred on (cx, cz) whose base is `base` (surface + 1): east of the canopy's
 *  stair, on the step of that stair whose tread points east, the highest that keeps the room inside its band. */
export function leavesRoomAt(cx: number, cz: number, base: number): LeavesRoom {
  const s = TREE_STORIES[CANOPY], next = TREE_STORIES[CANOPY + 1];
  const [sx, sz] = stairCentre(CANOPY, cx, cz);
  const fy = base + s.y0 + 2, steps = next.y0 + 2 - (s.y0 + 2);
  const height = LEAVES_ROOM.height ?? ROOM_H;
  // the step whose tread runs east of the stair's centre (the row dz = 0), standing at fy + j
  const fits = (j: number) => leavesBandOk(fy + j, height, base);
  const choices = stepsAt(CANOPY, 6, 0, steps).filter(fits);
  const step = choices.reduce((a, b) => (Math.abs(b - LEAVES_LIFT) < Math.abs(a - LEAVES_LIFT) ? b : a), choices[0] ?? 1);
  const x0 = sx + LEAVES_OFFSET, z0 = sz - 3, y0 = fy + step;
  return { x0, y0, z0, w: ROOM_W, d: ROOM_D, height, door: { x0: x0 - 3, x1: x0 - 1, z0: z0 + 2, z1: z0 + 4 }, step };
}

/** The Leaves' band (sotano-levels §3 for the tree): the canopy story's rows, with the room's floor and its two
 *  blocks of shell over the canopy's own floor, and at least `LEAVES_CLEAR` rows between its ceiling's shell and the
 *  story above (the stars), as a floor keeps three layers of rock between bands. */
export const LEAVES_CLEAR = 3;
export function leavesBandOk(y0: number, height: number, base: number): boolean {
  const s = TREE_STORIES[CANOPY];
  const bottom = base + s.y0, top = base + s.y0 + s.h - 1;
  return y0 - 2 > bottom + 1 && y0 + height + 1 <= top - LEAVES_CLEAR;
}

export class GiantTree {
  readonly cx: number; readonly cz: number;
  readonly base: number;
  readonly top: number;
  readonly pads: StarPad[] = [];
  /** The room of the crown (D14): fixed by the tree's place, never by the seed, so it is known before it is grown. */
  readonly leaves: LeavesRoom;
  voxels = 0;
  private grown = new Set<number>();
  /** The run's salt for the bark and leaf patches: the same seed grows the same bark. */
  private readonly salt: number;

  constructor(private w: VoxelWorld, surfaceY: number, private fork: (story: number) => Rng) {
    this.cx = w.sx >> 1; this.cz = w.sz >> 1; this.base = surfaceY + 1;
    this.salt = fork(TREE_STORIES.length).u32() & 0x7fffffff;
    this.top = Math.min(w.sy - 1, this.base + TREE_STORIES[TREE_STORIES.length - 1].y0 + TREE_STORIES[TREE_STORIES.length - 1].h - 1);
    this.leaves = leavesRoomAt(this.cx, this.cz, this.base);
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

  /** The bark at a cell: its story's bark, with ragged patches of the bark below in the story's
   *  lowest rows, so a change of bark is a seam of patches and never a straight line. */
  barkAt(x: number, y: number, z: number): number {
    const i = Math.max(0, this.storyAt(y));
    const own = MAT[STORY_BARK[TREE_STORIES[i].key]];
    if (i === 0) return own;
    const h = y - this.range(i)[0];
    if (h >= BARK_BLEND) return own;
    const below = MAT[STORY_BARK[TREE_STORIES[i - 1].key]];
    return hash3(this.salt, x >> 1, y, z >> 1) < (BARK_BLEND - h) / (BARK_BLEND + 1) ? below : own;
  }

  /** The crown's leaves at a cell: patches of young leaves, more of them the higher the cell. */
  leafAt(x: number, y: number, z: number): number {
    const [y0, y1] = this.range(TREE_STORIES.findIndex(s => s.key === 'canopy'));
    const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)));
    return hash3(this.salt + 1, x >> 2, y >> 2, z >> 2) < YOUNG_LEAF_SHARE * (0.4 + 1.2 * t) ? MAT.youngleaf : MAT.leaves;
  }

  grow(i: number) {
    // NaN fails every comparison, so only a whole number is a story (a NaN height must not index the table)
    if (!Number.isInteger(i) || i < 0 || i >= TREE_STORIES.length || this.grown.has(i)) return;
    this.grown.add(i);
    const s = TREE_STORIES[i], [cy0, cy1] = this.range(i);
    const rng = this.fork(i);
    const put = (x: number, y: number, z: number, m: number) => {
      if (x < 1 || z < 1 || x > this.w.sx - 2 || z > this.w.sz - 2 || y < cy0 || y > cy1) return;
      if (m === BARK) m = this.barkAt(x, y, z);
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
    return stairCentre(i, this.cx, this.cz);
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
      if (i > 0) { put(x, fy - 2, z, BARK); put(x, fy - 1, z, BARK); }
      if (d <= r - WALL + 0.5) continue;
      for (let y = fy; y <= ceil; y++) {
        const h = y - fy;
        const knot = h >= 3 && h <= 6 && knots.some(k => Math.abs(angleDiff(a, k)) * r < 2.2);
        put(x, y, z, knot ? AIR : BARK);
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
          put(x + Math.round(-Math.sin(aa) * o), fy + y, z + Math.round(Math.cos(aa) * o), BARK);
      }
    }
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2 + rng.range(-0.2, 0.2);
      for (let s = 6; s < r - WALL; s++) {
        const x = cx + Math.round(Math.cos(a) * s), z = cz + Math.round(Math.sin(a) * s);
        if (this.nearStairs(0, x, z) || (s % 9 === 4)) continue;
        put(x, fy, z, BARK);
        if (s > r - WALL - 9) put(x, fy + 1, z, BARK);
      }
    }
    for (let k = 0; k < 6; k++) {
      const a = (k + 0.5) / 6 * Math.PI * 2, d = r * 0.55;
      const px = cx + Math.round(Math.cos(a) * d), pz = cz + Math.round(Math.sin(a) * d);
      if (this.nearStairs(0, px, pz, 4)) continue;
      column(put, px, pz, fy, ceil, 2.2, BARK);
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
        put(x, fy, z, BARK);
        if (rr % 2 === 0) put(x, fy + 1, z, BARK);
      }
    }
    if (!this.nearStairs(i, cx, cz, 3)) column(put, cx, cz, fy, ceil, 1.6, BARK);
  }

  private galleries(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, r = TREE_STORIES[i].r, inner = r - WALL;
    const level = 8;
    for (let dz = -inner; dz <= inner; dz++) for (let dx = -inner; dx <= inner; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > inner + 0.5 || d < inner - 4.5) continue;
      if (this.nearStairs(i, cx + dx, cz + dz)) continue;
      put(cx + dx, fy + level - 1, cz + dz, BARK);
      if (d < inner - 3.5 && hash3(7, cx + dx, i, cz + dz) > 0.3) put(cx + dx, fy + level, cz + dz, BARK);
    }
    for (let k = 0; k < 2; k++) {
      const a0 = rng.range(0, Math.PI * 2) + k * Math.PI, rr = inner - 2;
      for (let j = 1; j < level; j++) for (let t = 0; t < 2; t++) {
        const a = a0 + ((j - 1) * 2 + t) / rr;
        for (let o = -1; o <= 1; o++) {
          const x = cx + Math.round(Math.cos(a) * (rr + o)), z = cz + Math.round(Math.sin(a) * (rr + o));
          if (this.nearStairs(i, x, z)) continue;
          for (let y = fy; y < fy + j; y++) put(x, y, z, BARK);
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
      column(put, x, z, fy, ceil, 1.5, BARK);
      posts.push([x, z]);
    }
    const deck = fy + 9;
    for (const [ax, az] of posts) for (const [bx, bz] of posts) {
      if ((bx <= ax && bz <= az) || Math.hypot(bx - ax, bz - az) > 11 || hash3(11, ax + bx, i, az + bz) < 0.45) continue;
      const n = Math.max(Math.abs(bx - ax), Math.abs(bz - az));
      for (let t = 0; t <= n; t++) {
        const x = Math.round(ax + (bx - ax) * t / n), z = Math.round(az + (bz - az) * t / n);
        for (let ox = 0; ox <= 1; ox++) for (let oz = 0; oz <= 1; oz++) if (!this.nearStairs(i, x + ox, z + oz)) put(x + ox, deck, z + oz, BARK);
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
          put(x + ox, y, z + oz, MAT.bough);
          if (thick) put(x + ox, y - 1, z + oz, MAT.bough);
        }
        if (s <= r + 1) for (let oy = 1; oy <= 4; oy++) for (let ox = -1; ox <= 2; ox++) for (let oz = -1; oz <= 2; oz++) put(x + ox, y + oy, z + oz, AIR);
        ex = x; ez = z; ey = y;
      }
      if (Math.hypot(ex - cx, ez - cz) < r + 4) continue;
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dz * dz <= 10) put(ex + dx, ey, ez + dz, MAT.bough);
      blob(this.w, put, ex, Math.min(ey + 8, ceil - 4), ez, 5);
    }
  }

  private canopy(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, rx = 54, rz = this.cz - 2, ry = ceil - fy;
    for (let dz = -30; dz <= 30; dz++) for (let dx = -30; dx <= 30; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > 30 || (d > 22 && hash3(13, cx + dx, i, cz + dz) < 0.35)) continue;
      put(cx + dx, fy - 2, cz + dz, BARK); put(cx + dx, fy - 1, cz + dz, BARK);
    }
    for (let y = fy - 2; y <= ceil; y++) for (let z = cz - rz; z <= cz + rz; z++) for (let x = cx - rx; x <= cx + rx; x++) {
      const e = ((x - cx) / rx) ** 2 + ((y - fy + 2) / (ry + 2)) ** 2 + ((z - cz) / rz) ** 2;
      if (e > 1 || e < 0.84) continue;
      if (hash3(17, x >> 3, y >> 3, z >> 3) < 0.18) continue;
      if (this.w.data[this.w.idx(x, y, z)] === AIR) put(x, y, z, this.leafAt(x, y, z));
    }
    for (let k = 0; k < 5; k++) {
      const a = rng.range(0, Math.PI * 2), len = 26 + rng.int(0, 10);
      for (let s = 0; s < len; s++) {
        const x = cx + Math.round(Math.cos(a) * s), z = cz + Math.round(Math.sin(a) * s), y = fy + Math.round(s * 0.55);
        if (this.nearStairs(i, x, z, 2)) continue;
        for (let ox = 0; ox <= 1; ox++) for (let oz = 0; oz <= 1; oz++) put(x + ox, y, z + oz, MAT.bough);
      }
    }
    this.carveLeaves(put, ceil);
  }

  /** The Leaves (D14): the crown's room carved from its template (src/content/crown.ts) as a floor carves its rooms,
   *  in the crown's palette: a shell of leaves two blocks thick, a floor of bough, the template's pieces, an open eye in
   *  the dome up to the top of the story, and the west doorway onto the stair's step. Carved last in the canopy, so a
   *  limb or the crown's shell that reaches into it gives way to the room. */
  private carveLeaves(put: Put, ceil: number) {
    const L = this.leaves, t = LEAVES_ROOM, h = L.height, W = L.w, D = L.d;
    const leaf = (x: number, y: number, z: number) => put(x, y, z, this.leafAt(x, y, z));
    const at = (c: number, r: number) => (c >= 0 && r >= 0 && c < W && r < D ? t.rows[r][c] : ROCK);
    const open = (c: number, r: number) => at(c, r) !== ROCK;
    const floor = MAT[CROWN_PALETTE.floor], trim = MAT[CROWN_PALETTE.trim], ring = MAT[CROWN_PALETTE.ring];
    for (let r = -2; r < D + 2; r++) for (let c = -2; c < W + 2; c++) {
      if (open(c, r)) continue;
      let near = false;
      for (let dz = -2; dz <= 2 && !near; dz++) for (let dx = -2; dx <= 2 && !near; dx++) near = open(c + dx, r + dz);
      if (near) for (let y = L.y0 - 2; y <= L.y0 + h + 1; y++) leaf(L.x0 + c, y, L.z0 + r);
    }
    for (let r = 0; r < D; r++) for (let c = 0; c < W; c++) {
      const ch = at(c, r), x = L.x0 + c, z = L.z0 + r;
      const top = L.y0 + ROOM_H - 1 + ceilingAt(t.ceiling ?? 'flat', h - ROOM_H, c, r, W, D);
      put(x, L.y0 - 2, z, floor); put(x, L.y0 - 1, z, floor);
      for (let y = L.y0; y <= top; y++) put(x, y, z, AIR);
      const eye = Math.abs(c - 6) <= LEAVES_OCULUS && Math.abs(r - 3) <= LEAVES_OCULUS;
      for (let y = top + 1; y <= (eye ? ceil : L.y0 + h + 1); y++) put(x, y, z, eye ? AIR : this.leafAt(x, y, z));
      const s = CELL_STACK[ch];
      if (!s) continue;
      const m = ch === 'o' ? ring : ch === '#' ? this.leafAt(x, L.y0, z) : trim;
      const n = ch === '#' ? top - L.y0 + 1 : s.h;
      for (let k = 0; k < n; k++) put(x, L.y0 + k, z, m);
    }
    // the doorway: through the shell and over the gap to the stair's tread, a floor of bough and three blocks of air
    for (let z = L.door.z0; z <= L.door.z1; z++) for (let x = L.door.x0; x <= L.door.x1; x++) {
      put(x, L.y0 - 2, z, floor); put(x, L.y0 - 1, z, floor);
      for (let y = L.y0; y < L.y0 + 3; y++) put(x, y, z, AIR);
    }
  }

  private stars(put: Put, fy: number, rng: Rng) {
    const [sx, sz] = this.stairAt(TREE_STORIES.length - 2);
    for (let dz = -9; dz <= 9; dz++) for (let dx = -9; dx <= 9; dx++) if (dx * dx + dz * dz <= 81) {
      put(sx + dx, fy - 2, sz + dz, BARK); put(sx + dx, fy - 1, sz + dz, BARK);
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
    this.pads[this.pads.length - 1].up = true;
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
