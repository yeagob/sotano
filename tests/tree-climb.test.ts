// The climb of the giant tree (issues #317 and #328, the owner's seven branches; docs/design/built/levels/giant-tree/
// TRUNK.md and BRANCHES.md): every trunk story's stair has a gap a jump cannot cross and building can; the Leaves are
// reached on foot once the trunk is climbed; the branch story grows exactly seven limbs, each with its ball of leaves,
// for every seed and every course of obstacles.
import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { apex, flight } from '../src/physics/jump';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { CROWN_PLACE } from '../src/world/crown';
import {
  BRANCH_COUNT, BRANCH_OBSTACLES, GiantTree, STAIR_GAPS, TREE_STORIES, stairGap, stairSteps, type BranchCourse,
} from '../src/world/tree';
import { VoxelWorld } from '../src/world/world';
import { walkRoute, type Waypoint } from './helpers/walker';

const TRUNK = TREE_STORIES.map((_, i) => i).filter(i => TREE_STORIES[i].zone === 'trunk');
const BRANCHES = TREE_STORIES.findIndex(s => s.key === 'branches');

function tree(seed: number, stories: readonly number[] = TREE_STORIES.map((_, i) => i), course?: BranchCourse | 'mixed') {
  const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
  for (let z = 0; z < w.sz; z++) for (let x = 0; x < w.sx; x++) w.data[w.idx(x, SURFACE_Y, z)] = MAT.grass;
  const t = new GiantTree(w, SURFACE_Y, i => new Rng(seed * 31 + i), course);
  for (const i of stories) t.grow(i);
  return { w, t };
}

/** Lays back every missing step of stair `i`: the gap rebuilt in full. */
function mend(w: VoxelWorld, t: GiantTree, i: number) {
  const g = stairGap(i)!;
  for (const [x, y, z, j] of t.stairCells(i)) if (j >= g.from && j <= g.to) w.data[w.idx(x, y, z)] = MAT.log;
}

/** The centre of tread `k` of stair `i`, on the walking line (feet height). */
function tread(t: GiantTree, i: number, k: number): Waypoint {
  const [sx, sz] = t.stairAt(i), fy = t.base + stairSteps(i).floor, a = i * 1.3 + (k - 0.5) * (2 / 4.5);
  return { x: sx + 0.5 + Math.cos(a) * 4.6, y: fy + k, z: sz + 0.5 + Math.sin(a) * 4.6 };
}

type Cell = [number, number, number];
const stands = (w: VoxelWorld, x: number, y: number, z: number) =>
  w.inside(x, y, z) && w.solid(x, y - 1, z) && !w.solid(x, y, z) && !w.solid(x, y + 1, z);

/** A walk on foot (the world test's rule): to a side neighbour one block up with headroom, level, or down to three. */
function walk(w: VoxelWorld, from: Cell, box: { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number }) {
  const seen = new Set<number>(), queue: Cell[] = [from];
  seen.add(w.idx(...from));
  while (queue.length) {
    const [x, y, z] = queue.pop()!;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < box.x0 || nx > box.x1 || nz < box.z0 || nz > box.z1) continue;
      for (const dy of [1, 0, -1, -2, -3]) {
        const ny = y + dy;
        if (ny < box.y0 || ny > box.y1) continue;
        if (dy === 1 && w.solid(x, y + 2, z)) continue;
        if (dy < 0 && [...Array(-dy)].some((_, k) => w.solid(nx, y - k, nz) || w.solid(nx, y - k + 1, nz))) continue;
        if (!stands(w, nx, ny, nz) || seen.has(w.idx(nx, ny, nz))) continue;
        seen.add(w.idx(nx, ny, nz));
        queue.push([nx, ny, nz]);
        break;
      }
    }
  }
  return seen;
}

/** A generous jumper, wider than any real jump: from a place you stand on, it reaches any place to stand within 3.5
 *  blocks across that is at most one block higher (a ground jump rises 1.26), or any lower, whatever lies between.
 *  What it cannot reach, no jump without practices reaches. */
function jumper(w: VoxelWorld, from: Cell, box: { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number }) {
  const seen = new Set<number>(), queue: Cell[] = [from];
  seen.add(w.idx(...from));
  while (queue.length) {
    const [x, y, z] = queue.pop()!;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      if (Math.hypot(dx, dz) > 3.5) continue;
      const nx = x + dx, nz = z + dz;
      if (nx < box.x0 || nx > box.x1 || nz < box.z0 || nz > box.z1) continue;
      for (let ny = Math.min(box.y1, y + 1); ny >= box.y0; ny--) {
        if (!stands(w, nx, ny, nz) || seen.has(w.idx(nx, ny, nz))) continue;
        seen.add(w.idx(nx, ny, nz));
        queue.push([nx, ny, nz]);
      }
    }
  }
  return seen;
}

function trunkBox(t: GiantTree, i: number) {
  const r = TREE_STORIES[i].r + 1;
  return { x0: t.cx - r, x1: t.cx + r, z0: t.cz - r, z1: t.cz + r, y0: t.range(i)[0], y1: t.range(i + 1)[1] };
}

describe('the trunk stairs have gaps (issue #317)', () => {
  it('every trunk story has one gap, bigger as you climb, and no other stair has one', () => {
    for (const i of TREE_STORIES.keys()) {
      const g = stairGap(i);
      if (!TRUNK.includes(i)) { expect(g, TREE_STORIES[i].key).toBeNull(); continue; }
      expect(g, TREE_STORIES[i].key).not.toBeNull();
      expect(g!.to).toBeLessThan(stairSteps(i).steps - 1);
      // the rise across the gap is beyond a ground jump, and beyond two jumps of the ladder
      expect(g!.to - g!.from + 2).toBeGreaterThan(apex(0) + apex(1));
    }
    const lens = TRUNK.map(i => STAIR_GAPS[TREE_STORIES[i].key]!.len);
    expect([...lens].sort((a, b) => a - b)).toEqual(lens);
  });

  it('the missing steps are air, the steps either side are whole', () => {
    const { w, t } = tree(3, TRUNK.flatMap(i => [i, i + 1]));
    for (const i of TRUNK) {
      const g = stairGap(i)!;
      for (const [x, y, z, j] of t.stairCells(i)) {
        if (j >= g.from && j <= g.to) expect(w.get(x, y, z), `${TREE_STORIES[i].key} step ${j}`).toBe(AIR);
        else if (j === g.from - 1 || j === g.to + 1) expect(w.get(x, y, z), `${TREE_STORIES[i].key} step ${j}`).toBe(MAT.log);
      }
    }
  });

  it('no jump without practices passes a gap: nothing past it is reached from its story', () => {
    for (const seed of [1, 7, 42]) {
      const { w, t } = tree(seed, TRUNK.flatMap(i => [i, i + 1]));
      for (const i of TRUNK) {
        const g = stairGap(i)!, s = tread(t, i, 1);
        const seen = jumper(w, [Math.floor(s.x), s.y, Math.floor(s.z)], trunkBox(t, i));
        const far = t.stairCells(i).filter(c => c[3] > g.to);
        const reached = far.filter(([x, y, z]) => seen.has(w.idx(x, y + 1, z)));
        expect(reached, `seed ${seed} ${TREE_STORIES[i].key}`).toEqual([]);
        // and nothing of the story above
        const above = t.range(i + 1)[0] + 2;
        expect([...seen].some(k => w.coords(k)[1] >= above), `seed ${seed} ${TREE_STORIES[i].key}`).toBe(false);
        // the jumper does reach the step under the gap, so the test asks the right question
        const near = tread(t, i, g.from - 1);
        expect(seen.has(w.idx(Math.floor(near.x), near.y, Math.floor(near.z))), `${TREE_STORIES[i].key} near`).toBe(true);
      }
    }
  });

  it('the real body cannot cross a gap, and crosses it with one block laid per missing step', () => {
    for (const seed of [1, 42]) for (const i of TRUNK) {
      const { w, t } = tree(seed, [i, i + 1]);
      const g = stairGap(i)!;
      const route: Waypoint[] = [];
      for (let k = g.from - 1; k <= g.to + 2; k++) route.push(tread(t, i, k));
      const from = tread(t, i, g.from - 2), solid = (x: number, y: number, z: number) => w.solid(x, y, z);
      expect(walkRoute(solid, from, route).ok, `seed ${seed} ${TREE_STORIES[i].key} unmended`).toBe(false);
      let laid = 0;
      for (let k = g.from; k <= g.to; k++) {
        const p = tread(t, i, k);
        w.data[w.idx(Math.floor(p.x), p.y - 1, Math.floor(p.z))] = MAT.log;
        laid++;
      }
      expect(laid).toBe(STAIR_GAPS[TREE_STORIES[i].key]!.len);
      expect(walkRoute(solid, from, route), `seed ${seed} ${TREE_STORIES[i].key} mended`).toMatchObject({ ok: true });
    }
  });

  it('from the grass, the climb stops at the first gap; with every gap mended it reaches the Leaves on foot', () => {
    const { w, t } = tree(77);
    const all = { x0: 0, x1: w.sx - 1, z0: 0, z1: w.sz - 1, y0: 0, y1: w.sy - 1 };
    const stories = (seen: Set<number>) => new Set([...seen].map(k => t.storyAt(w.coords(k)[1])));
    const before = stories(walk(w, [2, SURFACE_Y + 1, 2], all));
    expect(before.has(0)).toBe(true);
    expect(before.has(1)).toBe(false);
    for (const i of TRUNK) mend(w, t, i);
    const seen = walk(w, [2, SURFACE_Y + 1, 2], all);
    const after = stories(seen);
    for (let i = 0; i < TREE_STORIES.length; i++) expect(after.has(i), TREE_STORIES[i].key).toBe(true);
    expect(seen.has(w.idx(Math.floor(CROWN_PLACE.x), CROWN_PLACE.y, Math.floor(CROWN_PLACE.z)))).toBe(true);
  });

  it('after the trunk, the Leaves are reached on foot from the branch story\'s floor, for every seed tried', () => {
    for (const seed of [1, 7, 42, 99]) {
      const { w, t } = tree(seed, TREE_STORIES.map((_, i) => i).filter(i => i >= BRANCHES - 1));
      const land = tread(t, BRANCHES - 1, stairSteps(BRANCHES - 1).steps);
      const box = { x0: 0, x1: w.sx - 1, z0: 0, z1: w.sz - 1, y0: t.range(BRANCHES)[0], y1: w.sy - 1 };
      const seen = walk(w, [Math.floor(land.x), land.y, Math.floor(land.z)], box);
      expect(seen.has(w.idx(Math.floor(CROWN_PLACE.x), CROWN_PLACE.y, Math.floor(CROWN_PLACE.z))), `seed ${seed}`).toBe(true);
    }
  });
});

describe('the seven branches (owner, 2026-11-25)', () => {
  const SEEDS = Array.from({ length: 24 }, (_, k) => k * 13 + 1);
  const ALL: readonly (BranchCourse | 'mixed')[] = ['mixed', 'bare', ...BRANCH_OBSTACLES];

  it('every seed and every course grows exactly seven long limbs, each with its platform and its ball of leaves', () => {
    for (const course of ALL) for (const seed of SEEDS) {
      const { w, t } = tree(seed, [BRANCHES], course);
      expect(t.limbs, `${course} ${seed}`).toHaveLength(BRANCH_COUNT);
      for (const l of t.limbs) {
        const [ex, ey, ez] = l.tip, [bx, by, bz] = l.ball;
        expect(w.get(ex, ey, ez), `${course} ${seed} tip`).toBe(MAT.bough);
        let leaves = 0;
        for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++)
          if (w.get(bx + dx, by + dy, bz + dz) === MAT.leaves) leaves++;
        expect(leaves, `${course} ${seed} ball`).toBeGreaterThan(60);
        // long: at least 28 blocks of limb out of the trunk's wall (the old limbs ran 14 to 30)
        const out = l.path.filter(([x, , z]) => Math.hypot(x - t.cx, z - t.cz) > TREE_STORIES[BRANCHES].r).length;
        expect(out, `${course} ${seed} length`).toBeGreaterThanOrEqual(28);
        if (course !== 'bare' && course !== 'mixed') expect(l.course).toBe(course);
        if (l.course !== 'bare') expect(l.obstacles.length, `${course} ${seed} ${l.course}`).toBeGreaterThan(0);
      }
      // no two limbs run into one another out of the trunk: each is its own way to its own ball
      const outside = t.limbs.map(l => l.path.filter(([x, , z]) => Math.hypot(x - t.cx, z - t.cz) > TREE_STORIES[BRANCHES].r + 1));
      for (let a = 0; a < outside.length; a++) for (let b = a + 1; b < outside.length; b++)
        for (const p of outside[a]) for (const q of outside[b])
          expect(Math.hypot(p[0] - q[0], p[2] - q[2]), `${course} ${seed} limbs ${a} ${b}`).toBeGreaterThan(6);
    }
  });

  it('mixed deals every obstacle at least once in every seed', () => {
    for (const seed of SEEDS) {
      const { t } = tree(seed, [BRANCHES], 'mixed');
      for (const c of BRANCH_OBSTACLES) expect(t.limbs.some(l => l.course === c), `${seed} ${c}`).toBe(true);
    }
  });

  it('every limb\'s tip is reached from the hall: on foot, over a jumpable break, or through a knot or a tuft once broken', () => {
    expect(apex(0)).toBeLessThan(2);
    expect(flight(0, 1)!).toBeGreaterThan(2.4);
    for (const course of ['bare', ...BRANCH_OBSTACLES] as BranchCourse[]) for (const seed of SEEDS.slice(0, 8)) {
      const { w, t } = tree(seed, [BRANCHES - 1, BRANCHES, BRANCHES + 1], course);
      for (const l of t.limbs) {
        if (l.course === 'breaks') {
          // a break is at most two blocks of air along the path, a ground jump carries about 2.8
          let run = 0, worst = 0;
          for (const [x, y, z] of l.path) { run = w.get(x, y, z) === AIR ? run + 1 : 0; worst = Math.max(worst, run); }
          expect(worst, `${seed} break`).toBeLessThanOrEqual(2);
          expect(worst, `${seed} break`).toBeGreaterThan(0);
          for (const [x, y, z] of l.obstacles) w.data[w.idx(x, y, z)] = MAT.bough;
        }
        if (l.course === 'knots') {
          // the knot stands two blocks over the limb: no ground jump climbs it
          const cols = new Map<string, number>();
          for (const [x, , z] of l.obstacles) cols.set(`${x},${z}`, (cols.get(`${x},${z}`) ?? 0) + 1);
          for (const n of cols.values()) expect(n, `${seed} knot`).toBe(2);
        }
        if (l.course === 'knots' || l.course === 'tufts') for (const [x, y, z] of l.obstacles) w.data[w.idx(x, y, z)] = AIR;
        const [x0, y0, z0] = l.path[0], [ex, ey, ez] = l.tip;
        const box = { x0: 0, x1: w.sx - 1, z0: 0, z1: w.sz - 1, y0: t.range(BRANCHES)[0], y1: t.range(BRANCHES)[1] };
        const seen = walk(w, [x0, y0 + 1, z0], box);
        expect(seen.has(w.idx(ex, ey + 1, ez)), `${course} ${seed} limb to tip`).toBe(true);
      }
    }
  });

  it('a knot and a tuft stop the walk until they are broken', () => {
    for (const course of ['knots', 'tufts'] as BranchCourse[]) for (const seed of [5, 14, 66]) {
      const { w, t } = tree(seed, [BRANCHES], course);
      const box = { x0: 0, x1: w.sx - 1, z0: 0, z1: w.sz - 1, y0: t.range(BRANCHES)[0], y1: t.range(BRANCHES)[1] };
      for (const l of t.limbs) {
        const [x0, y0, z0] = l.path[0], [ex, ey, ez] = l.tip;
        expect(walk(w, [x0, y0 + 1, z0], box).has(w.idx(ex, ey + 1, ez)), `${course} ${seed} blocked`).toBe(false);
      }
    }
  });
});
