// The climb of the giant tree (issues #317, #328 and #329; docs/design/built/levels/giant-tree/TRUNK.md and
// BRANCHES.md). The trunk: every story's stair is broken (a gap a jump cannot cross and building can, broken treads to
// hop, plugs of earth to dig, the galleries' waterfall to swim up), and the whole climb is passable with no practice by
// digging and placing blocks; the Leaves are reached on foot after it. The branches: six main branches in every seed,
// each with its own platform mechanic, fixed, and each crossed by the real body at base stats to its ball of leaves.
import { describe, expect, it } from 'vitest';
import { EL_WATER, elemKind, isFalling, isSource } from '../src/content/elements';
import { ITEM_BY_ID } from '../src/content/items';
import { AIR, MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { apex } from '../src/physics/jump';
import { boxHits, type Body } from '../src/physics/voxel-collide';
import {
  BALL_R, BRANCH_MECHANICS, BRANCH_PRACTICES, standOn, type BranchPlan, type CoursePiece,
} from '../src/world/branches';
import { CourseRunner, cellsAt, offsetAt, pulseOn } from '../src/world/course';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { CROWN_PLACE } from '../src/world/crown';
import {
  GiantTree, PLUG, STAIR_GAPS, TREE_STORIES, stairGap, stairSteps, stairWorks, treadMissing,
} from '../src/world/tree';
import { VoxelWorld } from '../src/world/world';
import { branchGifts, holdsAllBranchPractices, walkSlowSpot, WALK_SLOW_ITEM } from '../src/game/branch-gifts';
import { parkour, type Target } from './helpers/parkour';
import { walkRoute, type Waypoint } from './helpers/walker';

const TRUNK = TREE_STORIES.map((_, i) => i).filter(i => TREE_STORIES[i].zone === 'trunk');
const BRANCHES = TREE_STORIES.findIndex(s => s.key === 'branches');
const GALLERIES = TREE_STORIES.findIndex(s => s.key === 'galleries');

function tree(seed: number, stories: readonly number[] = TREE_STORIES.map((_, i) => i)) {
  const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
  for (let z = 0; z < w.sz; z++) for (let x = 0; x < w.sx; x++) w.data[w.idx(x, SURFACE_Y, z)] = MAT.grass;
  const t = new GiantTree(w, SURFACE_Y, i => new Rng(seed * 31 + i));
  for (const i of stories) t.grow(i);
  return { w, t };
}

/** Mends stair `i` by building: one block laid in every missing tread cell (the gap, the broken treads, the washed-out
 *  flight), and the plugs dug out. `only` limits it to some steps. Returns the blocks laid and dug. */
function mend(w: VoxelWorld, t: GiantTree, i: number, only?: (j: number) => boolean) {
  let laid = 0, dug = 0;
  const plugs = stairWorks(i).filter(k => k.kind === 'plug');
  for (const [x, y, z, j, f] of t.stairCells(i)) {
    if (only && !only(j)) continue;
    if (treadMissing(i, j, f) && w.get(x, y, z) === AIR) { w.data[w.idx(x, y, z)] = MAT.log; w.elem[w.idx(x, y, z)] = 0; laid++; }
    if (plugs.some(k => j >= k.from && j <= k.to)) for (let h = 1; h <= 3; h++) if (w.get(x, y + h, z) === PLUG) { w.data[w.idx(x, y + h, z)] = AIR; dug++; }
  }
  return { laid, dug };
}

/** A point on tread `k` of stair `i`, on the walking line (feet height), at share `f` along the step. */
function tread(t: GiantTree, i: number, k: number, f = 0.5) {
  const [sx, sz] = t.stairAt(i), fy = t.base + stairSteps(i).floor, a = i * 1.3 + (k - 1 + f) * (2 / 4.5);
  return { x: sx + 0.5 + Math.cos(a) * 4.6, y: fy + k, z: sz + 0.5 + Math.sin(a) * 4.6 };
}

type Cell = [number, number, number];
type Box = { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number };
const stands = (w: VoxelWorld, x: number, y: number, z: number) =>
  w.inside(x, y, z) && w.solid(x, y - 1, z) && !w.solid(x, y, z) && !w.solid(x, y + 1, z);
const ALL = (w: VoxelWorld): Box => ({ x0: 0, x1: w.sx - 1, z0: 0, z1: w.sz - 1, y0: 0, y1: w.sy - 1 });

/** A walk on foot (the world test's rule): to a side neighbour one block up with headroom, level, or down to three. */
function walk(w: VoxelWorld, from: Cell, box: Box) {
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
 *  It never swims. What it cannot reach, no jump without practices reaches. */
function jumper(w: VoxelWorld, from: Cell, box: Box) {
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

function trunkBox(t: GiantTree, i: number): Box {
  const r = TREE_STORIES[i].r + 1;
  return { x0: t.cx - r, x1: t.cx + r, z0: t.cz - r, z1: t.cz + r, y0: t.range(i)[0], y1: t.range(i + 1)[1] };
}
const cellOf = (p: { x: number; y: number; z: number }): Cell => [Math.floor(p.x), p.y, Math.floor(p.z)];

describe('the trunk stairs have gaps you rebuild (issue #317)', () => {
  it('every trunk story has one gap, bigger as you climb, and no other stair has one', () => {
    for (const i of TREE_STORIES.keys()) {
      const g = stairGap(i);
      if (!TRUNK.includes(i)) { expect(g, TREE_STORIES[i].key).toBeNull(); expect(stairWorks(i)).toEqual([]); continue; }
      expect(g, TREE_STORIES[i].key).not.toBeNull();
      expect(g!.to).toBeLessThan(stairSteps(i).steps - 1);
      // the rise across the gap is beyond a ground jump, and beyond two jumps of the ladder
      expect(g!.to - g!.from + 2).toBeGreaterThan(apex(0) + apex(1));
      // every other work of the stair is below its gap
      for (const k of stairWorks(i)) expect(k.to, TREE_STORIES[i].key).toBeLessThan(g!.from - 1);
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

  it('no jump without practices passes a gap: nothing past it is reached from its story, the rest of the stair mended', () => {
    for (const seed of [1, 7, 42]) {
      const { w, t } = tree(seed, TRUNK.flatMap(i => [i, i + 1]));
      for (const i of TRUNK) {
        const g = stairGap(i)!;
        mend(w, t, i, j => j < g.from);
        const s = tread(t, i, 1);
        const seen = jumper(w, cellOf(s), trunkBox(t, i));
        const far = t.stairCells(i).filter(c => c[3] > g.to);
        const reached = far.filter(([x, y, z]) => seen.has(w.idx(x, y + 1, z)));
        expect(reached, `seed ${seed} ${TREE_STORIES[i].key}`).toEqual([]);
        const above = t.range(i + 1)[0] + 2;
        expect([...seen].some(k => w.coords(k)[1] >= above), `seed ${seed} ${TREE_STORIES[i].key}`).toBe(false);
        // the jumper does reach the step under the gap, so the test asks the right question
        expect(seen.has(w.idx(...cellOf(tread(t, i, g.from - 1)))), `${TREE_STORIES[i].key} near`).toBe(true);
      }
    }
  });

  it('the real body cannot cross a gap, and crosses it with one block laid per missing step', () => {
    for (const seed of [1, 42]) for (const i of TRUNK) {
      const { w, t } = tree(seed, [i, i + 1]);
      const g = stairGap(i)!;
      mend(w, t, i, j => j < g.from);
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
});

describe('the broken climb (issue #328): treads to hop, plugs to dig, a waterfall to swim', () => {
  it('every broken tread and every leap is crossed by the real body with one ground jump, no block laid', () => {
    for (const seed of [2, 9]) for (const i of TRUNK) for (const k of stairWorks(i)) {
      if (k.kind !== 'treads' && k.kind !== 'leap') continue;
      const { w, t } = tree(seed, [i, i + 1]);
      mend(w, t, i, j => j < k.from || j > k.to);
      const solid = (x: number, y: number, z: number) => w.solid(x, y, z);
      const route: Target[] = [];
      for (let j = k.from; j <= k.to; j++) route.push({ at: tread(t, i, j, 0.85) });
      route.push({ at: tread(t, i, k.to + 1) }, { at: tread(t, i, k.to + 2) });
      const res = parkour(solid, tread(t, i, k.from - 1, 0.5), route);
      expect(res, `seed ${seed} ${TREE_STORIES[i].key} ${k.kind} ${k.from}`).toMatchObject({ ok: true });
    }
  });

  it('a plug of earth stops the walk up the stair until it is dug', () => {
    for (const i of TRUNK) for (const k of stairWorks(i)) {
      if (k.kind !== 'plug') continue;
      const { w, t } = tree(4, [i, i + 1]);
      mend(w, t, i, j => j < k.from || j > k.to);
      const box = trunkBox(t, i), from = cellOf(tread(t, i, k.from - 1)), past = cellOf(tread(t, i, k.to + 1));
      expect(walk(w, from, box).has(w.idx(...past)), `${TREE_STORIES[i].key} plugged`).toBe(false);
      const { dug } = mend(w, t, i, j => j >= k.from && j <= k.to);
      expect(dug, TREE_STORIES[i].key).toBeGreaterThan(0);
      expect(walk(w, from, box).has(w.idx(...past)), `${TREE_STORIES[i].key} dug`).toBe(true);
    }
  });

  it('the galleries hold a waterfall beside the washed-out flight: a source under the ceiling, falling water to the floor', () => {
    const falls = stairWorks(GALLERIES).filter(k => k.kind === 'falls');
    expect(falls).toHaveLength(1);
    expect(TRUNK.filter(i => i !== GALLERIES).every(i => stairWorks(i).every(k => k.kind !== 'falls'))).toBe(true);
    const { w, t } = tree(5, [GALLERIES, GALLERIES + 1]);
    const cols = t.fallsCells(GALLERIES, falls[0].to + 1);
    expect(cols.length).toBeGreaterThanOrEqual(2);
    const fy = t.base + stairSteps(GALLERIES).floor, top = t.range(GALLERIES)[1];
    for (const [x, z] of cols) {
      expect(isSource(w.elemAt(x, top, z)), 'source on top').toBe(true);
      for (let y = fy; y < top; y++) {
        expect(w.get(x, y, z), `air ${y}`).toBe(AIR);
        expect(elemKind(w.elemAt(x, y, z)), `water ${y}`).toBe(EL_WATER);
        expect(isFalling(w.elemAt(x, y, z)), `falling ${y}`).toBe(true);
      }
    }
    expect(t.waters).toHaveLength(1);
  });

  it('no jump climbs past the washed-out flight; the real body swims up the waterfall and steps out onto the stair', () => {
    for (const seed of [1, 33]) {
      const { w, t } = tree(seed, [GALLERIES, GALLERIES + 1]);
      const k = stairWorks(GALLERIES).find(q => q.kind === 'falls')!, out = k.to + 1;
      mend(w, t, GALLERIES, j => j > out);
      const seen = jumper(w, cellOf(tread(t, GALLERIES, 1)), trunkBox(t, GALLERIES));
      expect(seen.has(w.idx(...cellOf(tread(t, GALLERIES, out)))), `seed ${seed} jumper`).toBe(false);
      const cols = t.fallsCells(GALLERIES, out), fy = t.base + stairSteps(GALLERIES).floor;
      const foot = { x: cols.reduce((a, c) => a + c[0], 0) / cols.length + 0.5, y: fy, z: cols.reduce((a, c) => a + c[1], 0) / cols.length + 0.5 };
      // start on the floor a few blocks out from the waterfall's foot
      const [sx, sz] = t.stairAt(GALLERIES), ox = foot.x - (sx + 0.5), oz = foot.z - (sz + 0.5), od = Math.hypot(ox, oz);
      const from = { x: foot.x + ox / od * 1.5, y: fy, z: foot.z + oz / od * 1.5 };
      const solid = (x: number, y: number, z: number) => w.solid(x, y, z);
      const res = parkour(solid, from, [{ at: foot }, { at: tread(t, GALLERIES, out), swim: true }, { at: tread(t, GALLERIES, out + 1) }],
        { elem: (x, y, z) => w.elemAt(x, y, z) });
      expect(res, `seed ${seed} swim`).toMatchObject({ ok: true });
    }
  });

  it('with no practice, the whole climb is passable by building: from the grass to every story and the Leaves', () => {
    const { w, t } = tree(77);
    const stories = (seen: Set<number>) => new Set([...seen].map(k => t.storyAt(w.coords(k)[1])));
    const before = stories(walk(w, [2, SURFACE_Y + 1, 2], ALL(w)));
    expect(before.has(0)).toBe(true);
    expect(before.has(1)).toBe(false);
    let laid = 0, dug = 0;
    for (const i of TRUNK) { const m = mend(w, t, i); laid += m.laid; dug += m.dug; }
    // the blocks a no-practice climb lays (the gaps are 26 of them); the plugs give more than that
    expect(laid).toBeGreaterThanOrEqual(26);
    const seen = walk(w, [2, SURFACE_Y + 1, 2], ALL(w));
    const after = stories(seen);
    for (let i = 0; i < TREE_STORIES.length; i++) expect(after.has(i), TREE_STORIES[i].key).toBe(true);
    expect(seen.has(w.idx(Math.floor(CROWN_PLACE.x), CROWN_PLACE.y, Math.floor(CROWN_PLACE.z)))).toBe(true);
    expect(dug).toBeGreaterThan(0);
  });

  it('after the trunk, the Leaves are reached on foot from the branch story\'s floor, for every seed tried', () => {
    for (const seed of [1, 7, 42, 99]) {
      const { w, t } = tree(seed, TREE_STORIES.map((_, i) => i).filter(i => i >= BRANCHES - 1));
      const land = tread(t, BRANCHES - 1, stairSteps(BRANCHES - 1).steps);
      const box = { x0: 0, x1: w.sx - 1, z0: 0, z1: w.sz - 1, y0: t.range(BRANCHES)[0], y1: w.sy - 1 };
      const seen = walk(w, cellOf(land), box);
      expect(seen.has(w.idx(Math.floor(CROWN_PLACE.x), CROWN_PLACE.y, Math.floor(CROWN_PLACE.z))), `seed ${seed}`).toBe(true);
    }
  });
});

/** Runs a branch's course for `secs` seconds with nobody on it (so every piece has been written once). */
function settle(w: VoxelWorld, r: CourseRunner, secs = 0.1) {
  for (let t = 0; t < secs; t += 1 / 60) r.update(t, 1 / 60, w, null);
}

/** The ready test before hopping onto piece `k` (BRANCHES.md): a mover in line and staying so, a pulse that is on long
 *  enough, nothing to wait for otherwise. */
function readyFor(b: BranchPlan, k: number) {
  const p = b.pieces[k], prev = b.pieces[k - 1];
  const ahead = [0.1, 0.3, 0.5, 0.7];
  if (p.kind === 'slide') return (t: number, body: Body) => ahead.every(s => cellsAt(p, offsetAt(p, t + s)).some(c => c[2] === Math.floor(body.z)));
  if (p.kind === 'lift' || prev.kind === 'lift') {
    const top = (q: CoursePiece, t: number) => q.cells[0][1] + (q.kind === 'lift' ? offsetAt(q, t) : 0);
    const gap = Math.min(...p.cells.flatMap(c => prev.cells.map(q => Math.abs(c[0] - q[0])))) - 1;
    return (t: number, body: Body) => {
      const mine = Math.round(body.y) - 1;
      return ahead.every(s => {
        const tp = top(p, t + s), tm = top(prev, t + s);
        return tm === mine && (gap >= 2 ? tp === tm : tp - tm <= 1 && tp - tm >= -1);
      });
    };
  }
  if (p.kind === 'pulse') return (t: number) => [0, 0.2, 0.4, 0.6, 0.8, 1.0].every(s => pulseOn(p, t + s))
    && (prev.kind !== 'pulse' || pulseOn(prev, t + 0.35));
  return undefined;
}

function crossBranch(w: VoxelWorld, b: BranchPlan) {
  const r = new CourseRunner(b.pieces);
  settle(w, r);
  const solid = (x: number, y: number, z: number) => w.solid(x, y, z);
  const live = (k: number) => (t: number) => {
    void t;
    const cells = r.current(k);
    return standOn(cells.length ? { ...b.pieces[k], cells } as CoursePiece : b.pieces[k]);
  };
  const route: Target[] = b.pieces.slice(1).map((_, n) => ({ at: live(n + 1), ready: readyFor(b, n + 1) }));
  // to the practice, at the ball's centre
  route.push({ at: { x: b.ball[0] + 0.5, y: b.ball[1], z: b.ball[2] + 0.5 } });
  return parkour(solid, standOn(b.pieces[0]), route, { tick: (t, dt, body) => r.update(t + 0.1, dt, w, body) });
}

describe('the six branches (issue #329)', () => {
  const SEEDS = Array.from({ length: 12 }, (_, k) => k * 13 + 1);

  it('every seed grows the same six branches, each with its own mechanic, from the trunk\'s top story', () => {
    expect(new Set(BRANCH_MECHANICS).size).toBe(6);
    const first = tree(SEEDS[0], [BRANCHES]).t.branchPlans;
    expect(first.map(b => b.mechanic)).toEqual([...BRANCH_MECHANICS]);
    for (const seed of SEEDS) {
      const { w, t } = tree(seed, [BRANCHES]);
      expect(t.branchPlans).toEqual(first);
      for (const b of t.branchPlans) {
        // it starts inside the trunk's wall, on the hall's floor
        expect(Math.abs(b.xIn - t.cx), `${seed} ${b.mechanic}`).toBeLessThanOrEqual(TREE_STORIES[BRANCHES].r - 3);
        expect(b.limb).toBe(t.base + TREE_STORIES[BRANCHES].y0 + 1);
        expect(w.get(b.tip[0], b.tip[1], b.tip[2]), `${seed} ${b.mechanic} tip`).toBe(MAT.bough);
        // its mechanic's pieces exist
        const kinds = new Set(b.pieces.map(p => p.kind));
        const want = { slide: 'slide', lift: 'lift', crumble: 'crumble', switch: 'switch', pulse: 'pulse', beams: 'static' }[b.mechanic];
        expect(kinds.has(want as CoursePiece['kind']), `${b.mechanic}`).toBe(true);
        for (const p of b.pieces) if (p.kind === 'static') for (const [x, y, z] of p.cells) expect(w.get(x, y, z), `${seed} ${b.mechanic} still`).toBe(p.mat);
      }
    }
    // the seed changes only the beams' loose cubes, and they lie high over the course
    const a = tree(1, [BRANCHES]), c = tree(14, [BRANCHES]);
    const beams = a.t.branchPlans.find(b => b.mechanic === 'beams')!;
    expect(a.t.decor.length).toBe(6);
    for (const [, y] of a.t.decor) expect(y).toBeGreaterThanOrEqual(beams.limb + 11);
    const decor = new Set([...a.t.decor, ...c.t.decor].map(q => a.w.idx(...q)));
    let diff = 0;
    // (the trunk's wall has its own seeded knots, as every story's does: only what lies outside the trunk is compared)
    const r = TREE_STORIES[BRANCHES].r + 1;
    for (let k = 0; k < a.w.data.length; k++) {
      if (a.w.data[k] === c.w.data[k]) continue;
      const [x, , z] = a.w.coords(k);
      if (Math.hypot(x - a.t.cx, z - a.t.cz) <= r) continue;
      diff++;
      expect(decor.has(k), `${x} ${z}`).toBe(true);
    }
    expect(diff).toBeGreaterThan(0);
  });

  it('the new blocks build in every seed: each mechanic\'s block stands in the world once its course runs', () => {
    for (const seed of SEEDS) {
      const { w, t } = tree(seed, [BRANCHES]);
      for (const b of t.branchPlans) settle(w, new CourseRunner(b.pieces));
      const seen = new Set<number>(w.data);
      for (const k of ['raftwood', 'dryleaf', 'palebough', 'breathleaf', 'bough']) expect(seen.has(MAT[k]), `${seed} ${k}`).toBe(true);
      // the shade bough is the pairs' second group: it comes when you stand on the first
      const sw = t.branchPlans.find(b => b.mechanic === 'switch')!;
      expect(sw.pieces.some(p => p.mat === MAT.shadebough)).toBe(true);
    }
  });

  it('each branch\'s ball of leaves holds a hollow at its centre for its practice, reached through a hole in its side', () => {
    for (const seed of [3, 8]) {
      const { w, t } = tree(seed, [BRANCHES]);
      for (const b of t.branchPlans) {
        const [bx, by, bz] = b.ball;
        let leaves = 0;
        for (let dy = -4; dy <= 4; dy++) for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++)
          if (w.get(bx + dx, by + dy, bz + dz) === MAT.leaves) leaves++;
        expect(leaves, `${b.mechanic} ball`).toBeGreaterThan(120);
        expect(stands(w, bx, by, bz), `${b.mechanic} centre`).toBe(true);
        // the perch runs from outside the ball to its centre, open over it all the way: the hole
        const perch = b.pieces[b.pieces.length - 1];
        const start = standOn({ ...perch, cells: perch.cells.filter(c => Math.abs(c[0] - bx) === BALL_R) });
        const seen = walk(w, cellOf(start), ALL(w));
        expect(seen.has(w.idx(bx, by, bz)), `${b.mechanic} hole`).toBe(true);
      }
    }
  });

  it('the six practices are all different, and the built ones exist (double jump and wall jump are their own issues)', () => {
    expect(BRANCH_PRACTICES).toHaveLength(6);
    expect(new Set(BRANCH_PRACTICES).size).toBe(6);
    for (const id of ['fartlek', 'flow', 'irimi', 'balasana']) expect(ITEM_BY_ID.has(id), id).toBe(true);
    for (const id of ['double-jump', 'wall-jump']) if (ITEM_BY_ID.has(id)) expect(ITEM_BY_ID.get(id)!.id).toBe(id);
  });

  it('every branch is crossed by the real body at base stats, one ground jump and no block, to its ball\'s centre', () => {
    for (const seed of [1, 27]) {
      const { w, t } = tree(seed, [BRANCHES]);
      for (const b of t.branchPlans) {
        const res = crossBranch(w, b);
        expect(res, `seed ${seed} ${b.mechanic}`).toMatchObject({ ok: true });
      }
    }
  });

  it('a fall from a course lands on its limb, and the stair by the trunk climbs back to the start ledge', () => {
    const { w, t } = tree(6, [BRANCHES]);
    for (const b of t.branchPlans) {
      // under the middle of the course, the limb is ground
      const mid = b.x0 + b.dir * 12;
      expect(w.get(mid, b.limb, b.zl), b.mechanic).toBe(MAT.bough);
      const seen = walk(w, [mid, b.limb + 1, b.zl], ALL(w));
      expect(seen.has(w.idx(...cellOf(standOn(b.pieces[0])))), `${b.mechanic} back to the ledge`).toBe(true);
      // and no jump from the limb reaches a piece of the course: every piece is three or more blocks over it
      for (const p of b.pieces.slice(1)) for (const [, y] of p.cells) expect(y - b.limb, b.mechanic).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('the course pieces at run time (src/world/course.ts)', () => {
  const body = (x: number, y: number, z: number): Body => ({ x, y, z, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true });

  it('a slide carries the body standing on it, a block at a time', () => {
    const { w, t } = tree(1, [BRANCHES]);
    const b = t.branchPlans.find(q => q.mechanic === 'slide')!, k = b.pieces.findIndex(p => p.kind === 'slide');
    const r = new CourseRunner(b.pieces);
    settle(w, r);
    const s = standOn({ ...b.pieces[k], cells: r.current(k) });
    const me = body(s.x, s.y, s.z);
    let moved = 0;
    for (let tt = 0.1; tt < 6; tt += 1 / 60) {
      const z0 = me.z;
      r.update(tt, 1 / 60, w, me);
      if (me.z !== z0) { moved++; expect(Math.abs(me.z - z0)).toBe(1); }
      expect(r.standsOn(k, me), `still on at ${tt}`).toBe(true);
    }
    expect(moved).toBeGreaterThan(2);
  });

  it('a crumble goes a while after it is stood on and comes back; a block never appears inside a body', () => {
    const { w, t } = tree(1, [BRANCHES]);
    const b = t.branchPlans.find(q => q.mechanic === 'crumble')!, k = 1, p = b.pieces[k];
    const r = new CourseRunner(b.pieces);
    settle(w, r);
    const s = standOn(p), me = body(s.x, s.y, s.z);
    r.update(1, 1 / 60, w, me);
    r.update(1 + p.delay! - 0.05, 1 / 60, w, me);
    expect(r.current(k).length).toBeGreaterThan(0);
    r.update(1 + p.delay! + 0.01, 1 / 60, w, me);
    expect(r.current(k)).toEqual([]);
    for (const [x, y, z] of p.cells) expect(w.get(x, y, z)).toBe(AIR);
    // the body falls into the piece's cells: it may not come back while the body is there
    const inside = body(s.x, s.y - 1, s.z);
    inside.onGround = false;
    r.update(1 + p.delay! + p.back! + 0.1, 1 / 60, w, inside);
    expect(boxHits((x, y, z) => w.solid(x, y, z), inside.x, inside.y, inside.z, inside.hw, inside.h)).toBe(false);
    r.update(1 + p.delay! + p.back! + 0.2, 1 / 60, w, null);
    expect(r.current(k).length).toBe(p.cells.length);
  });

  it('the pairs alternate: landing on one brings the other, leaving it takes it away, and they reset on still ground', () => {
    const { w, t } = tree(1, [BRANCHES]);
    const b = t.branchPlans.find(q => q.mechanic === 'switch')!;
    const r = new CourseRunner(b.pieces);
    settle(w, r);
    const a = 1, c = 2;
    expect(r.current(a).length).toBeGreaterThan(0);
    expect(r.current(c)).toEqual([]);
    const sa = standOn(b.pieces[a]), me = body(sa.x, sa.y, sa.z);
    r.update(1, 1 / 60, w, me);
    expect(r.current(c).length).toBeGreaterThan(0);
    me.onGround = false;
    r.update(1.1, 1 / 60, w, me);
    expect(r.current(a)).toEqual([]);
    const sc = standOn(b.pieces[c]);
    Object.assign(me, { x: sc.x, y: sc.y, z: sc.z, onGround: true });
    r.update(1.2, 1 / 60, w, me);
    expect(r.current(a).length).toBeGreaterThan(0);
    // back on the start ledge, still: the pairs return to their start
    const sl = standOn(b.pieces[0]);
    Object.assign(me, { x: sl.x, y: sl.y, z: sl.z, onGround: true });
    for (let tt = 1.3; tt < 3; tt += 1 / 60) r.update(tt, 1 / 60, w, me);
    expect(r.current(a).length).toBeGreaterThan(0);
    expect(r.current(c)).toEqual([]);
  });
});

describe('the branches\' gifts and what the six open (src/game/branch-gifts.ts)', () => {
  it('each branch lays its own practice at its ball\'s centre, and none that this build does not have', () => {
    const { t } = tree(1, []);
    const gifts = branchGifts(t.branchPlans, id => ITEM_BY_ID.has(id));
    for (const g of gifts) {
      const b = t.branchPlans[g.branch];
      expect(g.item).toBe(BRANCH_PRACTICES[b.index]);
      expect([g.x, g.y, g.z]).toEqual([b.ball[0] + 0.5, b.ball[1], b.ball[2] + 0.5]);
    }
    expect(gifts.map(g => g.item).sort()).toEqual(BRANCH_PRACTICES.filter(id => ITEM_BY_ID.has(id)).sort());
    expect(branchGifts(t.branchPlans, () => true)).toHaveLength(6);
  });

  it('the moment comes only when all six are held; the "Andar despacio" hook names the walk-slow practice and the hall\'s centre', () => {
    const held = new Set(BRANCH_PRACTICES.slice(0, 5));
    expect(holdsAllBranchPractices(id => held.has(id))).toBe(false);
    held.add(BRANCH_PRACTICES[5]);
    expect(holdsAllBranchPractices(id => held.has(id))).toBe(true);
    expect(WALK_SLOW_ITEM).toBe('walk-slow');
    const { w, t } = tree(2, [BRANCHES]);
    const at = walkSlowSpot(t.cx, t.cz, t.base + TREE_STORIES[BRANCHES].y0 + 2);
    // the hall's centre is open floor: room for the pedestal and the practice over it
    expect(stands(w, at.x, at.y, at.z)).toBe(true);
    expect(w.get(at.x, at.y + 2, at.z)).toBe(AIR);
  });
});
