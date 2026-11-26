import { AIR, MAT } from '../content/materials';
import { CELL_STACK, ROCK, ROOM_D, ROOM_H, ROOM_W, ceilingAt } from '../content/rooms';
import { CROWN_PALETTE, LEAVES_OCULUS, LEAVES_ROOM } from '../content/crown';
import { hash3, type Rng } from '../core/rng';
import { MARGIN, reach } from '../sky/totality/reach';
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

/** The gap in each trunk story's stair (issue #317, TRUNK.md): steps `from` to `from + len − 1` of the stair that
 *  climbs out of that story are missing. A step rises one block, so a gap of `len` steps is a rise of `len + 1` from
 *  the last step below it to the first above it, far over a ground jump (1.26). The gaps start at step 13, above the
 *  highest thing a story's floor lets you stand on (the hollows' decks, 10), so no ledge reaches past them; they grow
 *  by one step a story, so the climb gets harder as it goes. One block laid per missing step crosses a gap. */
export const STAIR_GAPS: Readonly<Partial<Record<TreeStory['key'], { from: number; len: number }>>> = {
  roots: { from: 13, len: 5 },
  rings: { from: 13, len: 6 },
  galleries: { from: 13, len: 7 },
  hollows: { from: 13, len: 8 },
};

/** The steps of stair `i` that are missing (STAIR_GAPS), or null when its stair is whole. */
export function stairGap(i: number): { from: number; to: number } | null {
  const g = STAIR_GAPS[TREE_STORIES[i]?.key];
  return g ? { from: g.from, to: g.from + g.len - 1 } : null;
}

/** How many steps stair `i` has (1 is the lowest), and the feet height over the base of its first step's floor. */
export function stairSteps(i: number): { steps: number; floor: number } {
  const s = TREE_STORIES[i], floor = s.y0 + (i === 0 ? 0 : 2);
  return { steps: TREE_STORIES[i + 1].y0 + 2 - floor, floor };
}

/** The branches (BRANCHES.md): the owner's seven limbs, every seed. */
export const BRANCH_COUNT = 7;
/** What a limb asks of you on the way to its ball of leaves (BRANCHES.md):
 *  - `bare`: nothing, a walk out;
 *  - `breaks`: two breaks in the limb, one to two blocks long, that a ground jump crosses;
 *  - `knots`: two knots of bough across the limb, two blocks over its top, to break or to climb by building;
 *  - `tufts`: two tufts of leaves across the limb, three high, to break through or burn;
 *  - `narrows`: a stretch of six blocks where the limb thins to a beam about one block wide. */
export type BranchCourse = 'bare' | 'breaks' | 'knots' | 'tufts' | 'narrows';
/** The courses with an obstacle, the ones `mixed` deals out. */
export const BRANCH_OBSTACLES: readonly BranchCourse[] = ['breaks', 'knots', 'tufts', 'narrows'];
/** The one switch for the limbs' obstacles (owner, 2026-11-25: the owner tests the variations): one course for every
 *  limb, or `mixed`, which deals every obstacle once to the first four limbs in a seeded order and draws the other
 *  three from the seed, so one climb shows them all. */
export const BRANCH_COURSE: BranchCourse | 'mixed' = 'mixed';
/** How many blocks of path a limb runs from inside the trunk's wall, when the world leaves room for it. */
const LIMB_REACH = 46;
/** How far in from the world's sides a limb's path stops, so its platform and its ball fit. */
const LIMB_EDGE = 8;
/** Radians a limb turns per block toward the world's long axis, once out of the trunk. */
const LIMB_TURN = 0.11;
/** The least angle between two limbs where they leave the trunk, radians. */
const LIMB_APART = 0.45;

/** One limb of the branch story, as grown: its course, its walking line (the top block of each path point), the
 *  centre of its tip platform (the top block) and of its ball of leaves, and the cells of its obstacles. */
export interface Limb {
  course: BranchCourse;
  path: [number, number, number][];
  tip: [number, number, number];
  ball: [number, number, number];
  obstacles: [number, number, number][];
}

/** A pad's cell: its centre cell, on the ground (x, z) at the height of its floor (y). */
export interface Spot { x: number; y: number; z: number }

/** A star pad. `up`: the last pad of the route; stepping on it leaves the built tree upward (SKY.md §2.4). The pads
 *  carry no teleport: the route is walked by the jumps (STARS.md). */
export interface StarPad extends Spot { up?: boolean }

/** Pads in each constellation (fixed: the positions do not change with the seed, only the pads' sizes do). */
const CONSTELLATION_PADS = 5;
/** A base pad is three blocks across; each pad's seeded draw adds one of these steps to that width (STARS.md). */
const PAD_WIDTH = 3;
/** The width steps: a loss of one to three blocks (a loss that leaves no block is one block), a gain of one or two. */
const PAD_SIZE_STEPS = [-3, -2, -1, 1, 2] as const;
/** Constellation pads whose hop from the one before is lengthened, as 'c.s' (constellation c, pad s). */
const LENGTHENED = new Set<string>(['0.2', '1.1', '1.3', '2.4']);
const LENGTHEN = 3;
/** The cloud layer above the route's top pad (STARS.md): its height over the pad's floor, and its reach across. The Triple
 *  Jump reaches 13.86 above the top pad's floor, so the layer is in reach from the top pad. The pad one block under the top
 *  reaches 12.86 above the top's floor, so a height above that keeps the sky from opening from the pads below: the layer sits
 *  at 13.3, between the two, with 0.45 blocks of margin on each side. */
export const CLOUD_RISE = 13.3;
/** The cloud's reach across, in blocks: five blocks before, times ten (the layer covers almost the whole sky). */
export const CLOUD_RADIUS = 5 * 10;

/** The cloud layer's spot: the body passes it (no solids) and its feet at `y`, within `r` blocks of (x, z), open the sky. */
export interface CloudSpot { x: number; y: number; z: number; r: number }

/** The cloud layer above a pad: centred on its centre cell, CLOUD_RISE blocks above its floor. */
export function cloudAbove(top: Spot): CloudSpot {
  return { x: top.x + 0.5, y: top.y + CLOUD_RISE, z: top.z + 0.5, r: CLOUD_RADIUS };
}

/** The most intermediate pads one hop may take (a guard: the base route's longest hop needs four). */
const MAX_BRIDGE = 10;
/** Sideways swings a bridge's pads may take, in blocks, from the straight line between the hop's ends (tried for up to
 *  three pads; a longer bridge is an equal split of the straight line). */
const SWINGS = [0, 2, -2, 4, -4, 6, -6, 8, -8];
const SWING_PADS = 3;
/** A pad is three blocks wide and a body 0.6 wide: a body must be this far (centre to centre) from a pad's centre to
 *  pass beside it without its head meeting the pad's underside (STARS.md, the way up). */
export const PAD_CLEARANCE = 1.8;
/** Horizontal room a rise needs before the pad above: the Triple Jump has climbed clear of the pad's underside after
 *  this many blocks per block of rise (the flight of physics/jump.ts, at base stats). */
export const CLIMB_TRAVEL = 0.45;

/** A hop between two pads fits the Triple Jump at base stats (STARS.md): its gap is at most MARGIN × reach of its rise,
 *  and at least what it takes to pass the pad above beside it. */
export function padHopFits(a: Spot, b: Spot): boolean {
  const r = reach(b.y - a.y), gap = Math.hypot(b.x - a.x, b.z - a.z);
  return r !== undefined && gap <= MARGIN * r && gap >= PAD_CLEARANCE + CLIMB_TRAVEL * Math.max(0, b.y - a.y);
}

/** Every list of `k` swings, the smallest total swing first (the order a bridge tries them in). */
function swingPlans(k: number): number[][] {
  let plans: number[][] = [[]];
  for (let n = 0; n < k; n++) plans = plans.flatMap(p => SWINGS.map(s => [...p, s]));
  return plans.sort((p, q) => p.reduce((t, v) => t + Math.abs(v), 0) - q.reduce((t, v) => t + Math.abs(v), 0));
}
const PLANS: number[][][] = Array.from({ length: MAX_BRIDGE + 1 }, (_, k) => (k <= SWING_PADS ? swingPlans(k) : [new Array<number>(k).fill(0)]));

/** The route the pads make: each hop the Triple Jump cannot make is split by the fewest intermediate pads that all fit
 *  once rounded to cells. Each intermediate pad lies on the straight line between the hop's ends, swung sideways by the
 *  smallest swing that lets every part fit, so a short hop that climbs is taken round the pad above. `clamp` keeps the
 *  pads in the world. Deterministic: it draws no randomness. */
export function bridgePads(spots: readonly Spot[], clamp: (x: number, z: number) => [number, number] = (x, z) => [x, z]): Spot[] {
  const out: Spot[] = spots.length ? [{ ...spots[0] }] : [];
  for (let i = 1; i < spots.length; i++) {
    const a = spots[i - 1], b = spots[i];
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;
    const path = (swing: number[]): Spot[] => {
      const k = swing.length, p: Spot[] = [a];
      for (let j = 1; j <= k; j++) {
        const t = j / (k + 1), side = swing[j - 1];
        const [x, z] = clamp(a.x + dx * t + px * side, a.z + dz * t + pz * side);
        p.push({ x: Math.round(x), y: Math.round(a.y + (b.y - a.y) * t), z: Math.round(z) });
      }
      p.push(b);
      return p;
    };
    let found: Spot[] | null = null;
    for (let k = 0; k <= MAX_BRIDGE && !found; k++) {
      for (const swing of PLANS[k]) {
        const p = path(swing);
        if (p.every((q, j) => j === 0 || padHopFits(p[j - 1], q))) { found = p; break; }
      }
    }
    out.push(...(found ?? path(new Array(MAX_BRIDGE).fill(0))).slice(1).map(p => ({ ...p })));
  }
  return out;
}

/** The star pad a body stands on (its feet's cell is the pad's centre, on the ground), or -1 (STARS.md). */
export function padUnder(pads: readonly StarPad[], x: number, y: number, z: number, onGround: boolean): number {
  if (!onGround) return -1;
  const fx = Math.floor(x), fy = Math.floor(y + 0.05), fz = Math.floor(z);
  return pads.findIndex(q => q.x === fx && q.y === fy && q.z === fz);
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
  /** The cloud layer above the top pad, once the stars are grown (null before). The sky opens where the body passes it. */
  cloud: CloudSpot | null = null;
  /** The room of the crown (D14): fixed by the tree's place, never by the seed, so it is known before it is grown. */
  readonly leaves: LeavesRoom;
  /** The limbs of the branch story, filled when it grows. */
  readonly limbs: Limb[] = [];
  voxels = 0;
  private grown = new Set<number>();
  /** The run's salt for the bark and leaf patches: the same seed grows the same bark. */
  private readonly salt: number;

  constructor(private w: VoxelWorld, surfaceY: number, private fork: (story: number) => Rng,
    private readonly course: BranchCourse | 'mixed' = BRANCH_COURSE) {
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

  /** The tread cells of stair `i`, each with its step (1 is the lowest): [x, y, z, step], y the step's block. Missing
   *  steps (STAIR_GAPS) are listed too: they are the blocks to lay back to mend the gap. */
  stairCells(i: number): [number, number, number, number][] {
    const [sx, sz] = this.stairAt(i), { steps, floor } = stairSteps(i), fy = this.base + floor;
    const a0 = i * 1.3, R = Math.ceil(STAIR_R);
    const cells: [number, number, number, number][] = [];
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > STAIR_R || d < STAIR_CORE + 0.6) continue;
      let t = Math.atan2(dz, dx) - a0;
      t = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      for (let m = 0; ; m++) {
        const j = Math.floor((t + m * Math.PI * 2) / STAIR_DA) + 1;
        if (j > steps) break;
        cells.push([sx + dx, fy + j - 1, sz + dz, j]);
      }
    }
    return cells;
  }

  private stair(i: number, put: Put) {
    const [sx, sz] = this.stairAt(i), { steps, floor } = stairSteps(i), fy = this.base + floor;
    const R = Math.ceil(STAIR_R);
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++)
      if (Math.hypot(dx, dz) <= STAIR_CORE) for (let y = fy; y < fy + steps; y++) put(sx + dx, y, sz + dz, MAT.log);
    const cells = this.stairCells(i), gap = stairGap(i);
    for (const [x, y, z] of cells) for (let h = 1; h <= STAIR_HEAD; h++) put(x, y + h, z, AIR);
    for (const [x, y, z, j] of cells) put(x, y, z, gap && j >= gap.from && j <= gap.to ? AIR : MAT.log);
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

  /** The courses of the seven limbs: one for all, or `mixed` (BRANCH_COURSE). */
  private courses(rng: Rng): BranchCourse[] {
    if (this.course !== 'mixed') return Array(BRANCH_COUNT).fill(this.course);
    const deck = [...BRANCH_OBSTACLES];
    for (let k = deck.length - 1; k > 0; k--) { const j = rng.int(0, k); [deck[k], deck[j]] = [deck[j], deck[k]]; }
    while (deck.length < BRANCH_COUNT) deck.push(BRANCH_OBSTACLES[rng.int(0, BRANCH_OBSTACLES.length - 1)]);
    return deck;
  }

  /** The branch story (BRANCHES.md): seven limbs leave the hall at its floor through tunnels in the wall, wide and thick
   *  at the trunk and thinner at the tip, rising a block every four to six; out of the trunk each one bends toward the
   *  world's long axis (the world is wider east to west), so every limb runs long. Each ends in a platform of bough
   *  under its ball of leaves, and carries its course's obstacles (`BranchCourse`). */
  private branches(i: number, put: Put, fy: number, ceil: number, rng: Rng) {
    const { cx, cz } = this, r = TREE_STORIES[i].r, n = BRANCH_COUNT;
    const courses = this.courses(rng);
    const lo = LIMB_EDGE, hiX = this.w.sx - 1 - LIMB_EDGE, hiZ = this.w.sz - 1 - LIMB_EDGE;
    // a limb leaves where its way through the wall, three blocks wide, misses both stairs of the story
    const clear = (a: number) => {
      for (let s = r - WALL - 1; s <= r + 1; s += 0.5) for (const o of [-1.5, 0, 1.5]) {
        const x = Math.floor(cx + Math.cos(a) * s - Math.sin(a) * o), z = Math.floor(cz + Math.sin(a) * s + Math.cos(a) * o);
        if (this.nearStairs(i, x, z)) return false;
      }
      return true;
    };
    // nudged off the stairs, and kept a little apart from the limbs already placed so no two run into one another
    const angles: number[] = [];
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI * 2 + rng.range(-0.15, 0.15);
      const tries = Array.from({ length: 33 }, (_, m) => a0 + (m % 2 ? 1 : -1) * Math.ceil(m / 2) * 0.05).filter(clear);
      angles.push(tries.find(a => angles.every(b => Math.abs(angleDiff(a, b)) >= LIMB_APART)) ?? tries[0] ?? a0);
    }
    for (let k = 0; k < n; k++) {
      const a = angles[k];
      const top0 = fy - 1 + rng.int(0, 1), per = 4 + rng.int(0, 2);
      // the side it bends to is its place in the ring, not where a stair nudged it, so two limbs never merge
      const goal = Math.cos((k / n) * Math.PI * 2) >= 0 ? 0 : Math.PI;
      // the path: points one block apart, from just inside the wall, bending toward the long axis once outside
      const pts: { x: number; z: number; y: number; h: number }[] = [];
      let px = cx + Math.cos(a) * (r - WALL - 1), pz = cz + Math.sin(a) * (r - WALL - 1), h = a;
      for (let s = 0; s < LIMB_REACH; s++) {
        if (Math.hypot(px - cx, pz - cz) > r + 1) h += Math.max(-LIMB_TURN, Math.min(LIMB_TURN, angleDiff(goal, h)));
        if (s > 0) {
          const nx = px + Math.cos(h), nz = pz + Math.sin(h);
          if (nx < lo || nz < lo || nx > hiX || nz > hiZ) break;
          px = nx; pz = nz;
        }
        pts.push({ x: px, z: pz, y: top0 + Math.floor(s / per), h });
      }
      // the limb: a disc of bough under each point, its half-width and its rows shrinking toward the tip
      for (let p = 0; p < pts.length; p++) {
        const q = pts[p], t = p / pts.length, hw = 2.4 - 0.9 * t, rows = t < 0.5 ? 3 : 2, R = Math.ceil(hw);
        for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
          const x = Math.floor(q.x) + dx, z = Math.floor(q.z) + dz;
          if (Math.hypot(x + 0.5 - q.x, z + 0.5 - q.z) > hw || this.nearStairs(i, x, z)) continue;
          for (let y = q.y - rows + 1; y <= q.y; y++) put(x, y, z, MAT.bough);
          // the tunnel through the trunk's wall
          if (Math.hypot(x - cx, z - cz) <= r + 1) for (let y = q.y + 1; y <= q.y + 4; y++) put(x, y, z, AIR);
        }
      }
      const end = pts[pts.length - 1], ex = Math.floor(end.x), ez = Math.floor(end.z), ey = end.y;
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dz * dz <= 10) put(ex + dx, ey, ez + dz, MAT.bough);
      const by = Math.min(ey + 8, ceil - 4);
      blob(this.w, put, ex, by, ez, 5);
      const limb: Limb = {
        course: courses[k], tip: [ex, ey, ez], ball: [ex, by, ez], obstacles: [],
        path: pts.map(q => [Math.floor(q.x), q.y, Math.floor(q.z)]),
      };
      this.obstacles(limb, pts, put, r);
      this.limbs.push(limb);
    }
  }

  /** A limb's obstacles (`BranchCourse`), at two places out of the trunk (a third and two thirds of the way from the
   *  wall to the tip) or, for `narrows`, one stretch half way. Each sits where the limb is level for two blocks on
   *  either side, so a break is never also a step up. */
  private obstacles(limb: Limb, pts: { x: number; z: number; y: number; h: number }[], put: Put, r: number) {
    if (limb.course === 'bare') return;
    const { cx, cz } = this;
    const out = pts.findIndex(q => Math.hypot(q.x - cx, q.z - cz) > r + 2);
    const span = pts.length - 4 - out;
    if (out < 0 || span < 8) return;
    const level = (p: number) => p >= 2 && p + 2 < pts.length && pts[p - 2].y === pts[p + 2].y;
    const near = (p: number) => { for (let d = 0; d < 6; d++) { if (level(p + d)) return p + d; if (level(p - d)) return p - d; } return p; };
    const at = limb.course === 'narrows' ? [out + Math.round(span / 2)] : [out + Math.round(span / 3), out + Math.round(span * 2 / 3)];
    for (const p0 of at) {
      const c = pts[near(p0)], ux = Math.cos(c.h), uz = Math.sin(c.h);
      const along = limb.course === 'narrows' ? 3 : limb.course === 'breaks' ? 0.75 : 1;
      for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
        const x = Math.floor(c.x) + dx, z = Math.floor(c.z) + dz;
        const ox = x + 0.5 - c.x, oz = z + 0.5 - c.z, u = ox * ux + oz * uz, v = Math.abs(-ox * uz + oz * ux);
        if (Math.abs(u) > along || v > 3.5) continue;
        if (limb.course === 'breaks') for (let y = c.y - 3; y <= c.y; y++) this.clear(put, limb, x, y, z, AIR);
        if (limb.course === 'narrows' && v > 0.75) for (let y = c.y - 3; y <= c.y; y++) this.clear(put, limb, x, y, z, AIR);
        // a knot and a tuft stand on the limb's top, across its whole width
        // (where the limb already rises a block, the obstacle rises with it, so it is never one block over its ground)
        const top = this.w.get(x, c.y + 1, z) === MAT.bough ? c.y + 1 : this.w.get(x, c.y, z) === MAT.bough ? c.y : -1;
        if (top < 0) continue;
        if (limb.course === 'knots') for (let y = top + 1; y <= top + 2; y++) this.clear(put, limb, x, y, z, MAT.bough);
        if (limb.course === 'tufts') for (let y = top + 1; y <= top + 3; y++) this.clear(put, limb, x, y, z, this.leafAt(x, y, z));
      }
    }
  }

  /** Writes an obstacle's cell: a cut only takes the limb's own bough, a knot or a tuft only fills air. */
  private clear(put: Put, limb: Limb, x: number, y: number, z: number, m: number) {
    const was = this.w.get(x, y, z);
    if (m === AIR ? was !== MAT.bough : was !== AIR) return;
    put(x, y, z, m);
    limb.obstacles.push([x, y, z]);
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
    // the base pads: the first one on the disc, then three constellations rising from the tree's centre. Every position is
    // fixed (the same on every seed); only the sizes of the pads are seeded (see the width draw below).
    const spots: Spot[] = [];
    const a = Math.atan2(sz - this.cz, sx - this.cx);
    spots.push({ x: sx - Math.round(Math.cos(a) * 6), y: fy, z: sz - Math.round(Math.sin(a) * 6) });
    for (let c = 0; c < 3; c++) {
      const a0 = (c / 3) * Math.PI * 2;
      for (let s = 0; s < CONSTELLATION_PADS; s++) {
        const r = 12 + s * 8 + 2 + (LENGTHENED.has(`${c}.${s}`) ? LENGTHEN : 0), aa = a0 + s * 0.4;
        const x = Math.max(4, Math.min(this.w.sx - 5, this.cx + Math.round(Math.cos(aa) * r)));
        const z = Math.max(4, Math.min(this.w.sz - 5, this.cz + Math.round(Math.sin(aa) * r)));
        const y = Math.min(this.w.sy - 8, fy + 16 + c * 26 + s * 4 + 2);
        spots.push({ x, y, z });
      }
    }
    // every hop of the route is one the Triple Jump makes (STARS.md): the bridges between the base pads are pads too
    const clamp = (x: number, z: number): [number, number] => [Math.max(4, Math.min(this.w.sx - 5, x)), Math.max(4, Math.min(this.w.sz - 5, z))];
    for (const { x, y, z } of bridgePads(spots, clamp)) {
      // the pad's size: one seeded draw. A loss of one to three blocks of width (never below one block across), or a gain of one or two (STARS.md)
      const width = Math.max(1, PAD_WIDTH + PAD_SIZE_STEPS[rng.int(0, PAD_SIZE_STEPS.length - 1)]);
      const lo = Math.floor((width - 1) / 2), hi = width - 1 - lo;
      for (let dz = -lo; dz <= hi; dz++) for (let dx = -lo; dx <= hi; dx++) put(x + dx, y - 1, z + dz, MAT.starstone);
      this.pads.push({ x, y, z });
    }
    this.pads[this.pads.length - 1].up = true;
    this.cloud = cloudAbove(this.pads[this.pads.length - 1]);
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
