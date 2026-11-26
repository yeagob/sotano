// The six main branches of the giant tree (issue #329, docs/design/built/levels/giant-tree/BRANCHES.md): each one a
// platform course with its own mechanic, from the branch story's hall to a ball of leaves that holds a mobility practice.
// Pure data and geometry: no world, no randomness. Every layout and every jump distance is fixed, the same in every seed
// (the owner's worry is frustration: a course is learnt, not rolled). The tree builds the static parts
// (src/world/tree.ts); the moving, vanishing, switching and pulsing pieces are run by src/world/course.ts.

import { MAT } from '../content/materials';

export type Cell = [number, number, number];

/** The six mechanics, one per branch, in branch order (#329, the owner's list; the sixth is the proposal of the issue). */
export const BRANCH_MECHANICS = ['slide', 'lift', 'crumble', 'switch', 'pulse', 'beams'] as const;
export type BranchMechanic = (typeof BRANCH_MECHANICS)[number];

/** What a piece of a course does:
 *  - `static`: stays (the start ledge, the perch in the ball, rests between moving pieces, beams and single cubes);
 *  - `slide`: moves sideways, a block at a time, back and forth `range` blocks either side of its home;
 *  - `lift`: moves up and down, a block at a time, from its home up to `range` blocks and back;
 *  - `crumble`: vanishes `delay` seconds after a body first stands on it, and comes back `back` seconds later;
 *  - `switch`: one of two groups; landing on one brings the other group, and the one you leave goes;
 *  - `pulse`: solid for `on` seconds of every `period`, from `phase` on. */
export type PieceKind = 'static' | 'slide' | 'lift' | 'crumble' | 'switch' | 'pulse';

export interface CoursePiece {
  kind: PieceKind;
  mat: number;
  /** The piece's cells at home (its offset 0, or solid). */
  cells: Cell[];
  /** slide and lift: how far it travels; period: seconds of a whole cycle (there and back); phase: share of the cycle at t 0. */
  range?: number;
  period?: number;
  phase?: number;
  /** crumble: seconds from the first touch to vanishing, and from vanishing to coming back. */
  delay?: number;
  back?: number;
  /** switch: its group (0 is solid at the start). */
  group?: 0 | 1;
  /** pulse: seconds solid in each period. */
  on?: number;
  /** slide: the world axis it slides on (the course's sideways axis). */
  axis?: 'z';
}

/** One main branch, as planned. `dir` is +1 east, −1 west; `zl` its line; `limb` the top of its bough (the hall's floor). */
export interface BranchPlan {
  index: number;
  mechanic: BranchMechanic;
  dir: 1 | -1;
  zl: number;
  limb: number;
  /** The x where the limb starts, inside the trunk's wall, and the x of the course's origin (u 0). */
  xIn: number;
  x0: number;
  /** The centre of the tip platform (its top block) and of the ball of leaves (the practice floats at the ball's centre). */
  tip: Cell;
  ball: Cell;
  /** The pieces in the order a body crosses them: the first is the start ledge, the last the perch in the ball. */
  pieces: CoursePiece[];
}

/** The branch story's floor over the tree's base (TREE_STORIES: the story starts at 88, its floor two blocks over). */
const BRANCH_FLOOR = 88 + 2;
/** Where the limbs leave: three lines on each side of the trunk, eleven blocks apart (the world is wider east to west). */
const LINES = [-11, 0, 11] as const;
/** From the centre: the inside of the branch story's wall (r 20, wall 3, one in), the course's origin, the tip. */
const INNER = 16;
const ORIGIN = 23;
export const TIP_U = 27;
/** The ball's radius and its centre over the tip (as the limbs' balls always were: eight blocks over the tip). */
export const BALL_R = 5;
export const BALL_RISE = 8;
/** The course climbs from the start ledge, three over the limb, to the perch, seven over the limb. */
export const LEDGE_RISE = 3;
const PERCH_U = TIP_U - BALL_R;

/** A piece in the course's frame: u along the branch (0 at the origin, growing outward), v across (z), dy over the ledge. */
interface Spec { u: number; len: number; v0: number; v1: number; dy: number; p?: Partial<CoursePiece> & { kind?: PieceKind } }

const S = (u: number, len: number, v0: number, v1: number, dy: number, p?: Spec['p']): Spec => ({ u, len, v0, v1, dy, p });

/** The six layouts (BRANCHES.md has the table). Every hop is at most one block up; a hop up crosses one block of air (two
 *  late in a course), a level hop at most two; the difficulty rises along a course by the timing, never by the jump. */
const LAYOUTS: Record<BranchMechanic, Spec[]> = {
  // sideways movers, three wide so a block of travel in mid-jump still leaves ground under you
  slide: [
    S(5, 2, -1, 1, 0, { kind: 'slide', range: 1, period: 3.2, phase: 0 }),
    S(8, 2, -1, 1, 1, { kind: 'slide', range: 2, period: 4.8, phase: 0.5 }),
    S(11, 2, -1, 1, 1),
    S(14, 2, -1, 1, 2, { kind: 'slide', range: 2, period: 4.0, phase: 0.25 }),
    S(17, 2, -1, 1, 3, { kind: 'slide', range: 2, period: 3.2, phase: 0.75 }),
    S(20, 1, -1, 1, 3),
  ],
  // up-and-down movers: each one is boarded where it meets the step before, and carries you to the next
  lift: [
    S(5, 2, -1, 1, 0, { kind: 'lift', range: 2, period: 4.0, phase: 0 }),
    S(9, 2, -1, 1, 2),
    S(12, 2, -1, 1, 0, { kind: 'lift', range: 3, period: 4.8, phase: 0.3 }),
    S(16, 2, -1, 1, 3),
    S(19, 2, -1, 1, 1, { kind: 'lift', range: 3, period: 3.6, phase: 0.6 }),
  ],
  // dry leaves that give way: the delay shortens and the pieces narrow as you go
  crumble: [
    S(5, 2, -1, 1, 0, { kind: 'crumble', delay: 1.2, back: 3 }),
    S(8, 2, -1, 1, 1, { kind: 'crumble', delay: 1.2, back: 3 }),
    S(11, 2, 0, 1, 1, { kind: 'crumble', delay: 1.0, back: 3 }),
    S(14, 1, -1, 0, 2, { kind: 'crumble', delay: 0.9, back: 3 }),
    S(16, 2, -1, 1, 2, { kind: 'crumble', delay: 0.8, back: 3 }),
    S(19, 2, -1, 1, 3, { kind: 'crumble', delay: 0.7, back: 3 }),
  ],
  // alternating pairs, zig-zag: always jump to the other colour, never jump in place
  switch: [
    S(5, 2, -2, 0, 0, { kind: 'switch', group: 0 }),
    S(8, 2, 0, 2, 1, { kind: 'switch', group: 1 }),
    S(11, 2, -2, 0, 1, { kind: 'switch', group: 0 }),
    S(14, 2, 0, 2, 2, { kind: 'switch', group: 1 }),
    S(17, 2, -2, 0, 3, { kind: 'switch', group: 0 }),
    S(20, 1, -1, 1, 3, { kind: 'switch', group: 1 }),
  ],
  // a wave that runs out along the branch: each piece comes 0.8 s after the one before, and stays a little less
  pulse: [
    S(5, 2, -1, 1, 0, { kind: 'pulse', period: 3.2, on: 2.0, phase: 0 }),
    S(8, 2, -1, 1, 1, { kind: 'pulse', period: 3.2, on: 2.0, phase: 0.8 }),
    S(11, 2, -1, 1, 1, { kind: 'pulse', period: 3.2, on: 2.0, phase: 1.6 }),
    S(14, 2, -1, 1, 2, { kind: 'pulse', period: 3.2, on: 1.8, phase: 2.4 }),
    S(17, 2, -1, 1, 3, { kind: 'pulse', period: 3.2, on: 1.6, phase: 0 }),
    S(20, 1, -1, 1, 3, { kind: 'pulse', period: 3.2, on: 1.6, phase: 0.8 }),
  ],
  // precision: a beam one block wide, single cubes in the air, a second beam, and two cubes to the ball
  beams: [
    S(5, 5, 0, 0, 0),
    S(11, 1, 0, 0, 1),
    S(13, 1, -1, -1, 1),
    S(15, 3, -1, -1, 2),
    S(19, 1, 0, 0, 3),
    S(21, 1, 0, 0, 3),
  ],
};

/** The block each mechanic is built of (DECISIONS §14.7): the moving ones of raft wood, the giving-way of dry leaves, the
 *  pairs pale and shade bough, the pulse of breath leaves, the beams of the branch's own bough. */
function matOf(kind: PieceKind, group?: 0 | 1): number {
  if (kind === 'slide' || kind === 'lift') return MAT.raftwood;
  if (kind === 'crumble') return MAT.dryleaf;
  if (kind === 'switch') return group === 1 ? MAT.shadebough : MAT.palebough;
  if (kind === 'pulse') return MAT.breathleaf;
  return MAT.bough;
}

/** The six branches of a tree centred on (cx, cz) whose base is `base` (the surface + 1). Fixed: no seed. */
export function branchPlans(cx: number, cz: number, base: number): BranchPlan[] {
  const limb = base + BRANCH_FLOOR - 1;
  return BRANCH_MECHANICS.map((mechanic, index) => {
    const dir: 1 | -1 = index < 3 ? 1 : -1, dz = LINES[index % 3], zl = cz + dz;
    const xIn = cx + dir * Math.floor(Math.sqrt(INNER * INNER - dz * dz)), x0 = cx + dir * ORIGIN;
    const at = (u: number) => x0 + dir * u;
    const ledge = limb + LEDGE_RISE;
    const box = (s: Spec): Cell[] => {
      const out: Cell[] = [];
      for (let k = 0; k < s.len; k++) for (let v = s.v0; v <= s.v1; v++) out.push([at(s.u + k), ledge + s.dy, zl + v]);
      return out;
    };
    const piece = (s: Spec): CoursePiece => {
      const kind = s.p?.kind ?? 'static';
      return { ...s.p, kind, mat: matOf(kind, s.p?.group), cells: box(s), ...(kind === 'slide' ? { axis: 'z' as const } : {}) };
    };
    const start = piece(S(2, 2, -1, 1, 0));
    const perch = piece(S(PERCH_U, BALL_R + 2, -1, 1, 4));
    const tip: Cell = [at(TIP_U), limb, zl];
    return {
      index, mechanic, dir, zl, limb, xIn, x0, tip, ball: [at(TIP_U), limb + BALL_RISE, zl],
      pieces: [start, ...LAYOUTS[mechanic].map(piece), perch],
    };
  });
}

/** The centre of a piece's top at home, where a body stands on it (feet height). */
export function standOn(p: CoursePiece): { x: number; y: number; z: number } {
  const n = p.cells.length;
  const x = p.cells.reduce((a, c) => a + c[0], 0) / n, z = p.cells.reduce((a, c) => a + c[2], 0) / n;
  return { x: x + 0.5, y: Math.max(...p.cells.map(c => c[1])) + 1, z: z + 0.5 };
}

/** The practice of each branch, in branch order (#329, the owner's six of 2026-11-26), each where its course asks the most
 *  of what it gives: the sideways movers give the Shift sprint (Fartlek, #263); the lifts the double jump (#293); the dry
 *  leaves, where speed is all, the second faster movement (Flow: the one built practice whose effect is a faster walk and
 *  that carries the movement tag); the alternating pairs the wall jump (#294); the rhythm the dash (Irimi, #261); the
 *  beams, where an edge is the danger, the crouch that never falls off one (Child's Pose, #262). Two of them are built on other
 *  branches (`double-jump`, `wall-jump`): until they are merged, their balls hold nothing (the game asks ITEM_BY_ID). */
export const BRANCH_PRACTICES: readonly string[] = ['fartlek', 'double-jump', 'flow', 'wall-jump', 'irimi', 'balasana'];
