// The giant panda, guardian of sky floor 1 (docs/design/not-built/sky/guardians/PANDA.md, B1–B4 and B3b).
//
// A deity is data run by the one machine of ../deity.ts. The panda adds its own states by name (an Idle that also
// wakes for a player above height 8, its Recovering, the one rally at half its hits, the nap after it, and the
// longer telegraphs of its specials: Chewing, Peeking, Tumbling, Cradling) and one rule that ticks first every
// frame. That rule keeps the panda's memory (`Mind`): the rest beat, the calm feedback, which telegraph is on show
// and what the player did during it, the gates of each attack, the tumble's ball.
//
// Three seams of the machine are read on purpose, because the contracts give a deity file no other door:
//   - an attack's `telegraph` is read by the machine when its telegraph begins: its getter notes the start;
//   - `guard` is asked on every warm positive touch: the panda has no guard (it returns false) and notes the touch,
//     which is the counter of the attacks a positive intention on the panda answers;
//   - `attacks` is a getter: the machine's `choose()` sees only the attacks the panda's gates allow now (the phase
//     at half the hits, the rest beat, the nap, the capture's spacing, the ground under the player).
// The engine's stages fall at a third and two thirds; the panda has two phases that change at half (B3b), so its
// phase-two attacks are stage 1 and also wait for half the hits, and the engine's own rallies pass straight
// through. Nothing here takes health: the attacks push, slow, hold or grow bamboo through hindrances, and the three
// drains go through `ctx.drain` (the spirit gate). Nothing sets alive to false.

import type * as THREE from 'three';
import { pal, type PalToken } from '../../../content/palette';
import type { ModelPart } from '../../../enemies/types';
import { KNOCKBACK_PAINT } from '../../hindrances/knockback';
import { hazardOwner } from '../../hindrances/runner';
import { HOLDER } from '../../render/creature-view';
import { RALLY } from '../deity';
import {
  CAPTURE_TIME, ExceptionKind, TELEGRAPH, type AttackDef, type Cell, type CustomState, type DeityCtx, type DeityDef, type DeityRule,
  type Parts, type SkyActor, type TelegraphSpec, type Vec3,
} from '../../types';

// ───────────────────────── numbers (PANDA.md B2–B4, B9: every one a target) ─────────────────────────

export const HITS = 24;
/** The one change of phase: half the hit count (B3b). */
export const HALF_HITS = 12;
/** Levitation over the seat (B2). */
export const HOVER = 1.5;
/** Watching starts within this distance, or above WATCH_HEIGHT within 1.5 times it (B2). */
export const SIGHT = 12;
export const WATCH_HEIGHT = 8;
export const RECOVER = 2.5;
/** Rest between a recovery and the next telegraph, by phase (B2). */
export const REST: readonly [number, number] = [3.5, 2.5];
/** The rest beat: standing still this long while watched delays the next attack by REST_BEAT_WAIT (B2). */
export const REST_BEAT = 2;
export const REST_BEAT_WAIT = 2;
export const NAP = 5;
/** A drain's telegraph is 0.2 s longer than the floor's, a capture's 0.5 s (guardians §6.6). */
export const DRAIN_TAIL = 0.2;
export const CAPTURE_TAIL = 0.5;
/** A capture comes at most once in this many seconds, and never within HELD_CALM of a hold (guardians §6.6). */
export const CAPTURE_GAP = 30;
export const HELD_CALM = 1;
export const CHEW_SPIRIT = 6;
export const PEEK_SPIRIT = 8;
export const TUMBLE_SPIRIT = 8;
/** Slow chew: rushing is two jumps, or more than three blocks walked, during the telegraph (B3b 7). */
export const CHEW_JUMPS = 2;
export const CHEW_MOVE = 3;
export const STUMP_SECONDS = 6;
export const PRESS_SECONDS = 5;
export const PRESS_SLOW = 0.5;
export const HOLE_SECONDS = 4;
export const THICKET_SECONDS = 4;
export const YAWN_RADIUS = 10;
/** The ring's source, out from the seat's centre past its column (the seat is 3 wide and the panda drifts 1). */
const YAWN_OUT = 2.6;
export const TUMBLE_SPEED = 5;
/** The tumble's ball reaches the player from this far toward the seat and rolls this far past them. */
const TUMBLE_BACK = 4;
const TUMBLE_ON = 3;
/** Horizontal reach of the ball's touch (the size of the panda). */
const TUMBLE_TOUCH = 1.1;
/** The cradle's ring, and how near its centre the player must still be when it closes. */
export const CRADLE_RING = 2;
const CRADLE_IN = 0.75;
/** The knockback's push speed per block of push (the tower knock's measure, SKY.md §5.3). */
const PER_BLOCK = 2.5;
const STUMP_PUSH = 1 * PER_BLOCK;
const SOFT_PUSH = 1.5 * PER_BLOCK;
/** The hindrance telegraph the deity's ctx.hinder adds after the deity's own (MIN_TELEGRAPH). */
const HINDER_WARN = 0.8;
/** A horizontal speed above a walk: the player is being pushed, which does not count as rushing. */
const PUSHED_SPEED = 5.5;
/** A take-off at least this fast is a jump (a push lifts less). */
const JUMP_VY = 4;
const LEAVES = 8;
const LEAF_EVERY = 0.25;

export type Kind = 'toss' | 'press' | 'sit' | 'yawn' | 'shove' | 'thicket' | 'chew' | 'peekaboo' | 'tumble' | 'cradle';

const TAIL_SECONDS: Partial<Record<Kind, number>> = { chew: DRAIN_TAIL, peekaboo: DRAIN_TAIL, tumble: DRAIN_TAIL, cradle: CAPTURE_TAIL };
/** The custom state each special waits out its longer telegraph in. */
const TAIL_STATE: Partial<Record<Kind, string>> = { chew: 'Chewing', peekaboo: 'Peeking', tumble: 'Tumbling', cradle: 'Cradling' };
const TAILS = new Set(Object.values(TAIL_STATE));

// ───────────────────────── the panda's memory ─────────────────────────

/** One telegraph on show, and what the player did while it ran. */
interface Tell {
  id: Kind;
  start: number;
  fresh: boolean;
  /** Seconds to the next fx of this telegraph. */
  fxT: number;
  /** Fx shown so far (the chew's leaf ring turns one leaf per crunch). */
  shown: number;
  jumps: number;
  moved: number;
  wasGround: boolean;
  lx: number; lz: number;
  /** Cells the attack lands on, chosen when its telegraph begins. */
  cells: number[];
  /** The point it aims at (the player's feet, the ring's centre). */
  at: Vec3;
  dir: [number, number];
  /** The shove's arc or the tumble's line, start to end. */
  line: { x0: number; z0: number; x1: number; z1: number; y: number } | null;
  /** The owner of the hazard marks it draws. */
  owner: number;
}

interface Ball { x: number; y: number; z: number; dx: number; dz: number; left: number; puffT: number; owner: number; touched: boolean }

export interface Mind {
  ctx: DeityCtx;
  clock: number;
  /** The machine's state as the panda knows it: the Hurt overlay never hides it. */
  core: string;
  lastTouch: number;
  attackAt: number;
  beatGiven: boolean;
  leaves: number;
  leafT: number;
  rallied: boolean;
  rallyNow: boolean;
  realRally: boolean;
  rallyEnd: number;
  resumeTo: string;
  resuming: boolean;
  recoverEnd: number;
  napEnd: number;
  busyUntil: number;
  lastCapture: number;
  lastHeld: number;
  tell: Tell | null;
  tailLeft: number;
  ball: Ball | null;
  won: boolean;
  /** What happened, for the tests and the gallery: 'drain:chew', 'capture', 'counter:yawn', 'rally', 'nap'… */
  log: string[];
  /** View only: the yaw the body turns to, and the clock it was last drawn at. */
  yaw: number;
  drawn: number;
}

const MINDS = new WeakMap<SkyActor, Mind>();
/** The mind of the panda being updated now: its rule ticks first in every update, before the machine chooses. */
let CURRENT: Mind | null = null;

function mindOf(ctx: DeityCtx): Mind {
  let m = MINDS.get(ctx.deity);
  if (!m) {
    m = {
      ctx, clock: 0, core: 'Idle', lastTouch: -Infinity, attackAt: 0, beatGiven: false, leaves: 0, leafT: 0,
      rallied: false, rallyNow: false, realRally: false, rallyEnd: 0, resumeTo: 'Watching', resuming: false,
      recoverEnd: 0, napEnd: 0, busyUntil: -Infinity, lastCapture: -Infinity, lastHeld: -Infinity,
      tell: null, tailLeft: 0, ball: null, won: false, log: [], yaw: 0, drawn: 0,
    };
    MINDS.set(ctx.deity, m);
  }
  m.ctx = ctx;
  return m;
}

/** The panda's memory, for tests and the gallery (null before the machine first asks for it). */
export const pandaMind = (a: SkyActor): Mind | null => MINDS.get(a) ?? null;
/** Whether this deity is the panda napping (its minions walk at half pace then, B5 rule 7). */
export const pandaNapping = (a: SkyActor | null): boolean => !!a && MINDS.get(a)?.core === 'Napping';

/** Takes the resume flag a rally that passed through left. */
function resumed(m: Mind): boolean {
  const r = m.resuming;
  m.resuming = false;
  return r;
}

// ───────────────────────── world helpers ─────────────────────────

const playerBody = (ctx: DeityCtx) => ctx.host.player().body;
const headOf = (ctx: DeityCtx): Vec3 => { const b = ctx.deity.body; return { x: b.x, y: b.y + b.h * 0.8, z: b.z }; };
const eyeOf = (ctx: DeityCtx): Vec3 => { const b = playerBody(ctx); return { x: b.x, y: b.y + b.h * 0.85, z: b.z }; };
const cueAt = (ctx: DeityCtx, name: string, up = 2) => { const b = ctx.deity.body; ctx.host.cue(`panda.${name}`, b.x, b.y + up, b.z); };

/** The feet height of the first surface at or below `from` in the column (x, z), or null over a long drop. */
function surface(ctx: DeityCtx, x: number, z: number, from: number): number | null {
  const w = ctx.host.world();
  for (let y = from; y > from - 40; y--) if (w.solid(x, y - 1, z) && !w.solid(x, y, z)) return y;
  return null;
}

/** The player's feet cell, on the surface under them (where a jumping player lands). */
function standCell(ctx: DeityCtx): Cell | null {
  const b = playerBody(ctx);
  const x = Math.floor(b.x), z = Math.floor(b.z);
  const y = surface(ctx, x, z, Math.floor(b.y + 0.05));
  return y === null ? null : [x, y, z];
}

/** No solid cell on the straight line from a to b (sampled each quarter block, the ends left out). */
function sees(ctx: DeityCtx, a: Vec3, b: Vec3): boolean {
  const w = ctx.host.world();
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / 0.25);
  for (let k = 2; k < n - 1; k++) {
    const u = k / n;
    if (w.solid(Math.floor(a.x + (b.x - a.x) * u), Math.floor(a.y + (b.y - a.y) * u), Math.floor(a.z + (b.z - a.z) * u))) return false;
  }
  return true;
}

/** A block the player placed on the straight line from a to b (the cradle's float stops at it, as a charge stops). */
function placedBetween(ctx: DeityCtx, a: Vec3, b: Vec3): boolean {
  const w = ctx.host.world();
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / 0.25);
  for (let k = 1; k < n; k++) {
    const u = k / n;
    const x = Math.floor(a.x + (b.x - a.x) * u), y = Math.floor(a.y + (b.y - a.y) * u), z = Math.floor(a.z + (b.z - a.z) * u);
    if (w.solid(x, y, z) && w.kindAt(w.idx(x, y, z)) === ExceptionKind.Placed) return true;
  }
  return false;
}

/** The top cells (solid, air above) of the 3 × 3 round the player's stand cell. */
function topCells(ctx: DeityCtx, c: Cell): number[] {
  const w = ctx.host.world();
  const out: number[] = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = c[0] + dx, z = c[2] + dz;
    if (w.solid(x, c[1] - 1, z) && !w.solid(x, c[1], z)) out.push(w.idx(x, c[1] - 1, z));
  }
  return out;
}

const DIRS: readonly [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** The way to the nearest edge of the surface the player stands on. */
function edgeOf(ctx: DeityCtx, c: Cell): [number, number] {
  const w = ctx.host.world();
  let best: [number, number] = [1, 0], bestN = Infinity;
  for (const [dx, dz] of DIRS) {
    let n = 0;
    while (n < 6 && w.solid(c[0] + dx * (n + 1), c[1] - 1, c[2] + dz * (n + 1)) && !w.solid(c[0] + dx * (n + 1), c[1], c[2] + dz * (n + 1))) n++;
    if (n < bestN) { bestN = n; best = [dx, dz]; }
  }
  return best;
}

/** Points round the player at their height that the panda sees (the peekaboo's warm cells) and does not. */
function sightCells(ctx: DeityCtx, c: Cell): { seen: Vec3[]; hidden: Vec3[] } {
  const seen: Vec3[] = [], hidden: Vec3[] = [];
  const head = headOf(ctx);
  for (const r of [0, 1.5, 3]) for (let k = 0; k < (r === 0 ? 1 : 8); k++) {
    const a = (k / 8) * 2 * Math.PI;
    const x = Math.floor(c[0] + 0.5 + r * Math.cos(a)), z = Math.floor(c[2] + 0.5 + r * Math.sin(a));
    const y = surface(ctx, x, z, c[1] + 1);
    if (y === null || Math.abs(y - c[1]) > 1) continue;
    const p = { x: x + 0.5, y: y + 1.5, z: z + 0.5 };
    (sees(ctx, head, p) ? seen : hidden).push(p);
  }
  return { seen, hidden };
}

/** A line mark on the floor in the knockback's dust tones (never red: nothing here hurts). */
function line(ctx: DeityCtx, owner: number, l: NonNullable<Tell['line']>, lead: number, live: number) {
  ctx.host.hazards().add(owner, 'neutral', 'sky', {
    lead, live, damage: 0, tint: KNOCKBACK_PAINT,
    shape: { kind: 'line', x0: l.x0, z0: l.z0, x1: l.x1, z1: l.z1, y: l.y, width: 0.15 },
  });
}

/** A positive hit landed on the panda since this telegraph began: the attacks a hit on the panda answers. */
const countered = (m: Mind): boolean => !!m.tell && m.lastTouch >= m.tell.start;

/** Once every `every` seconds of a telegraph. */
function tickEvery(t: Tell, dt: number, every: number): boolean {
  t.fxT -= dt;
  if (t.fxT > 0) return false;
  t.fxT += every;
  t.shown++;
  return true;
}

function motesOn(ctx: DeityCtx, cells: readonly number[], kind: 'motes' | 'shimmer', dy: number) {
  const w = ctx.host.world();
  for (const i of cells) { const [x, y, z] = w.coords(i); ctx.host.fx(kind, x + 0.5, y + dy, z + 0.5, 1); }
}

// ───────────────────────── the attacks (B3 and B3b) ─────────────────────────

interface Spec {
  id: Kind;
  phase: 1 | 2;
  spirit?: number;
  telegraph: TelegraphSpec;
  /** May it start now (the gates of its document)? */
  gate?(ctx: DeityCtx, m: Mind): boolean;
  /** When its telegraph begins: where it lands. */
  begin?(ctx: DeityCtx, m: Mind, t: Tell): void;
  /** Every tick of its telegraph: what the player sees and hears. */
  show?(ctx: DeityCtx, m: Mind, t: Tell, dt: number): void;
  /** When the telegraph ends (a special: when its longer telegraph ends). */
  land(ctx: DeityCtx, m: Mind, t: Tell): void;
}

const SPECS: readonly Spec[] = [
  {
    // 1. Bamboo toss: a lob that stands as a one-block stump for 6 s; a stump on the player is a soft push of 1 block.
    id: 'toss', phase: 1,
    telegraph: { tell: 'armR', pose: 'lift', cue: 'panda.rustle' },
    begin(ctx, _m, t) {
      const b = playerBody(ctx);
      // aimed where the player is going
      const lead = 0.6;
      const x = Math.floor(b.x + Math.max(-3, Math.min(3, b.vx * lead))), z = Math.floor(b.z + Math.max(-3, Math.min(3, b.vz * lead)));
      const y = surface(ctx, x, z, Math.floor(b.y + 1.05));
      if (y !== null) t.cells = [ctx.host.world().idx(x, y, z)];
    },
    show(ctx, _m, t, dt) { if (tickEvery(t, dt, 0.3)) motesOn(ctx, t.cells, 'motes', 0.05); },
    land(ctx, m, t) {
      if (t.cells.length === 0) return;
      ctx.hinder('panda-bamboo', { cells: t.cells, seconds: STUMP_SECONDS, from: headOf(ctx), push: STUMP_PUSH });
      m.busyUntil = Math.max(m.busyUntil, m.clock + HINDER_WARN + 0.6);
    },
  },
  {
    // 2. Heavy press: a 3 × 3 band dense for 5 s, walking at half pace.
    id: 'press', phase: 1,
    telegraph: { tell: 'armL', pose: 'press', cue: 'panda.press' },
    begin(ctx, _m, t) {
      const c = standCell(ctx);
      if (!c) return;
      const w = ctx.host.world();
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (w.solid(c[0] + dx, c[1] - 1, c[2] + dz)) t.cells.push(w.idx(c[0] + dx, c[1] - 1, c[2] + dz));
    },
    show(ctx, _m, t, dt) { if (tickEvery(t, dt, 0.35)) motesOn(ctx, t.cells, 'shimmer', 1.02); },
    land(ctx, m, t) {
      if (t.cells.length === 0) return;
      ctx.hinder('dense-ground', { cells: t.cells, seconds: PRESS_SECONDS, slow: PRESS_SLOW });
      m.busyUntil = Math.max(m.busyUntil, m.clock + HINDER_WARN + PRESS_SECONDS);
    },
  },
  {
    // 3. Sit-down: one or two cells of a column top sink out for 4 s, never the whole top.
    id: 'sit', phase: 1,
    telegraph: { tell: 'body', pose: 'shift', cue: 'panda.whump' },
    gate: ctx => { const c = standCell(ctx); return !!c && c[1] > ctx.plan.y0 && topCells(ctx, c).length >= 2; },
    begin(ctx, _m, t) {
      const c = standCell(ctx);
      if (!c || c[1] <= ctx.plan.y0) return;
      const tops = topCells(ctx, c);
      if (tops.length < 2) return;
      const under = ctx.host.world().idx(c[0], c[1] - 1, c[2]);
      const first = tops.includes(under) ? under : tops[0];
      t.cells = [first];
      const rest = tops.filter(i => i !== first);
      // a second cell only when two are left over: a route off the top always stays
      if (rest.length >= 2) t.cells.push(rest[ctx.rng.int(0, rest.length - 1)]);
    },
    show(ctx, _m, t, dt) { if (tickEvery(t, dt, 0.3)) motesOn(ctx, t.cells, 'motes', 1); },
    land(ctx, m, t) {
      if (t.cells.length === 0) return;
      ctx.hinder('opening-holes', { cells: t.cells, seconds: HOLE_SECONDS });
      m.busyUntil = Math.max(m.busyUntil, m.clock + HINDER_WARN + HOLE_SECONDS);
    },
  },
  {
    // 4. Yawn (phase 2): a ring of drowsy air pushes 1.5 blocks away from the seat; a hit in the open mouth ends it.
    id: 'yawn', phase: 2,
    telegraph: { tell: 'mouth', pose: 'yawn', cue: 'panda.yawn' },
    show(ctx, _m, t, dt) {
      if (!tickEvery(t, dt, 0.3)) return;
      const b = ctx.deity.body;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * 2 * Math.PI; ctx.host.fx('puff', b.x + 2 * Math.cos(a), b.y, b.z + 2 * Math.sin(a), 1); }
    },
    land(ctx, m) {
      if (countered(m)) { m.log.push('counter:yawn'); cueAt(ctx, 'hm'); return; }
      // the ring forms round the seat at the player's height: its source sits just outside the seat's column, toward
      // the player, so the seat itself is not taken for a shelter (a column between still is)
      const b = ctx.deity.body, p = playerBody(ctx);
      const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz) || 1;
      const from = { x: b.x + (dx / d) * YAWN_OUT, y: Math.floor(p.y), z: b.z + (dz / d) * YAWN_OUT };
      ctx.hinder('knockback', { from, shape: 'ring', radius: YAWN_RADIUS, strength: SOFT_PUSH });
      m.busyUntil = Math.max(m.busyUntil, m.clock + HINDER_WARN + 0.6);
    },
  },
  {
    // 5. Playful shove: a soft push of 1.5 blocks toward the nearest edge, along the arc it shows.
    id: 'shove', phase: 1,
    telegraph: { tell: 'armL', pose: 'paw', cue: 'panda.huff' },
    begin(ctx, _m, t) {
      const c = standCell(ctx);
      if (!c) return;
      t.dir = edgeOf(ctx, c);
      t.at = { x: c[0] + 0.5, y: c[1], z: c[2] + 0.5 };
      t.line = { x0: t.at.x, z0: t.at.z, x1: t.at.x + t.dir[0] * 2, z1: t.at.z + t.dir[1] * 2, y: c[1] };
      line(ctx, t.owner, t.line, ctx.def.telegraph, 0);
    },
    land(ctx, m, t) {
      ctx.host.hazards().clear(t.owner);
      if (countered(m)) { m.log.push('counter:shove'); cueAt(ctx, 'pat', 1); return; }
      if (!t.line) return;
      const from = { x: t.at.x - t.dir[0] * 0.5, y: t.at.y, z: t.at.z - t.dir[1] * 0.5 };
      ctx.hinder('knockback', { from, shape: 'line', dir: { x: t.dir[0], y: 0, z: t.dir[1] }, radius: 2, strength: SOFT_PUSH });
      m.busyUntil = Math.max(m.busyUntil, m.clock + HINDER_WARN + 0.6);
    },
  },
  {
    // 6. Thicket: a line of 2-high stalks between the player and the seat for 4 s, one end always open.
    id: 'thicket', phase: 1,
    telegraph: { tell: 'armR', pose: 'tap', cue: 'panda.rustle' },
    begin(ctx, _m, t) {
      const c = standCell(ctx);
      if (!c) return;
      const w = ctx.host.world();
      const sx = ctx.plan.seat.x - c[0], sz = ctx.plan.seat.z - c[2];
      const d = Math.hypot(sx, sz) || 1;
      for (let k = 1; k <= 3; k++) {
        const x = Math.floor(c[0] + 0.5 + (sx / d) * k), z = Math.floor(c[2] + 0.5 + (sz / d) * k);
        if (x === c[0] && z === c[2]) continue;
        // a stalk stands on the surface it grows from, never over a drop
        if (!w.solid(x, c[1] - 1, z) || w.solid(x, c[1], z)) break;
        t.cells.push(w.idx(x, c[1], z), w.idx(x, c[1] + 1, z));
      }
    },
    show(ctx, _m, t, dt) { if (tickEvery(t, dt, 0.3)) motesOn(ctx, t.cells, 'motes', 0.1); },
    land(ctx, _m, t) {
      if (t.cells.length) ctx.hinder('panda-bamboo', { cells: t.cells, seconds: THICKET_SECONDS });
    },
  },
  {
    // 7. Slow chew (drain 6): a player who rushes during the chew. The leaves turn green while the pace is kept.
    id: 'chew', phase: 1, spirit: CHEW_SPIRIT,
    telegraph: { tell: 'mouth', pose: 'chew', cue: 'panda.crunch' },
    gate: (_ctx, m) => m.clock >= m.busyUntil,
    begin(ctx, _m, t) { const b = playerBody(ctx); t.at = { x: b.x, y: b.y, z: b.z }; },
    show(ctx, _m, t, dt) {
      if (!tickEvery(t, dt, 0.5)) return;
      cueAt(ctx, 'crunch');
      // calm feedback: one leaf of the ring a crunch, a leaf's green while the pace is kept, a pale puff once rushed
      const calm = t.jumps < CHEW_JUMPS && t.moved <= CHEW_MOVE;
      const a = ((t.shown % 8) / 8) * 2 * Math.PI;
      ctx.host.fx(calm ? 'motes' : 'puff', t.at.x + 3 * Math.cos(a), t.at.y + 0.1, t.at.z + 3 * Math.sin(a), 1);
    },
    land(ctx, m, t) {
      if (countered(m)) { m.log.push('counter:chew'); cueAt(ctx, 'mm'); return; }
      if (t.jumps >= CHEW_JUMPS || t.moved > CHEW_MOVE) { m.log.push('drain:chew'); ctx.drain(CHEW_SPIRIT); }
    },
  },
  {
    // 8. Peekaboo (phase 2, drain 8): a player hidden from the panda's sight when it uncovers its eyes.
    id: 'peekaboo', phase: 2, spirit: PEEK_SPIRIT,
    telegraph: { tell: 'armL', pose: 'cover', cue: 'panda.hum' },
    gate: ctx => { const c = standCell(ctx); return !!c && sightCells(ctx, c).seen.length > 0; },
    show(ctx, _m, t, dt) {
      if (!tickEvery(t, dt, 0.4)) return;
      const c = standCell(ctx);
      if (!c) return;
      const { seen, hidden } = sightCells(ctx, c);
      for (const p of seen) ctx.host.fx('motes', p.x, p.y - 1.4, p.z, 1);
      for (const p of hidden) ctx.host.fx('puff', p.x, p.y - 1.4, p.z, 1);
    },
    land(ctx, m) {
      if (countered(m)) { m.log.push('counter:peekaboo'); cueAt(ctx, 'giggle'); return; }
      if (!sees(ctx, headOf(ctx), eyeOf(ctx))) { m.log.push('drain:peekaboo'); ctx.drain(PEEK_SPIRIT); }
    },
  },
  {
    // 9. Tumble (phase 2, drain 8): a ball of drowsy air rolls along the shown line; its touch drains.
    id: 'tumble', phase: 2, spirit: TUMBLE_SPIRIT,
    telegraph: { tell: 'body', pose: 'tuck', cue: 'panda.rumble' },
    begin(ctx, _m, t) {
      const b = playerBody(ctx), d = ctx.deity.body;
      let dx = b.x - d.x, dz = b.z - d.z;
      const n = Math.hypot(dx, dz) || 1;
      dx /= n; dz /= n;
      const back = Math.max(0, Math.min(TUMBLE_BACK, n - 2.5));
      const c = standCell(ctx);
      const y = c ? c[1] : Math.floor(b.y);
      t.line = { x0: b.x - dx * back, z0: b.z - dz * back, x1: b.x + dx * TUMBLE_ON, z1: b.z + dz * TUMBLE_ON, y };
      t.dir = [dx, dz];
      line(ctx, t.owner, t.line, ctx.def.telegraph + DRAIN_TAIL, Infinity);
    },
    land(ctx, m, t) {
      if (countered(m) || !t.line) {
        ctx.host.hazards().clear(t.owner);
        if (countered(m)) { m.log.push('counter:tumble'); cueAt(ctx, 'mm', 1); }
        return;
      }
      const l = t.line;
      m.ball = { x: l.x0, y: l.y, z: l.z0, dx: t.dir[0], dz: t.dir[1], left: Math.hypot(l.x1 - l.x0, l.z1 - l.z0), puffT: 0, owner: t.owner, touched: false };
      ctx.host.cue('panda.rumble', l.x0, l.y, l.z0);
    },
  },
  {
    // 10. Cradle (phase 2, capture): a ring of leaves shrinks to the player's cell; inside when it closes, held 3 s.
    id: 'cradle', phase: 2,
    telegraph: { tell: 'armR', pose: 'open', cue: 'panda.hum' },
    gate: (ctx, m) => !ctx.host.player().held && m.clock - m.lastHeld >= HELD_CALM && m.clock - m.lastCapture >= CAPTURE_GAP,
    begin(ctx, _m, t) {
      const c = standCell(ctx), b = playerBody(ctx);
      t.at = c ? { x: c[0] + 0.5, y: c[1], z: c[2] + 0.5 } : { x: b.x, y: b.y, z: b.z };
    },
    show(ctx, m, t, dt) {
      if (!tickEvery(t, dt, 0.2)) return;
      const u = (m.clock - t.start) / (ctx.def.telegraph + CAPTURE_TAIL);
      const r = CRADLE_RING * Math.max(0.1, 1 - u);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * 2 * Math.PI; ctx.host.fx('motes', t.at.x + r * Math.cos(a), t.at.y + 0.1, t.at.z + r * Math.sin(a), 1); }
    },
    land(ctx, m, t) {
      if (countered(m)) { m.log.push('counter:cradle'); cueAt(ctx, 'hum', 1); return; }
      const pl = ctx.host.player(), b = pl.body;
      // a block between the panda and the player stops its float there
      if (placedBetween(ctx, headOf(ctx), { x: b.x, y: b.y + b.h / 2, z: b.z })) { m.log.push('blocked:cradle'); return; }
      if (Math.hypot(b.x - t.at.x, b.z - t.at.z) > CRADLE_IN || Math.abs(b.y - t.at.y) > 1.5) return;
      pl.hold(CAPTURE_TIME);
      ctx.host.takeRandomPractice();
      m.lastCapture = m.clock;
      m.log.push('capture');
      ctx.host.cue('panda.hum', b.x, b.y + 1, b.z);
    },
  },
];

const SPEC_BY = new Map(SPECS.map(s => [s.id, s]));

/** A telegraph begins: the machine has read this attack's telegraph (it reads it twice in that tick). */
function begin(m: Mind, id: Kind) {
  if (m.tell && m.tell.id === id && m.tell.start === m.clock) return;
  const b = playerBody(m.ctx);
  m.core = 'Attacking';
  m.tell = {
    id, start: m.clock, fresh: true, fxT: 0, shown: 0, jumps: 0, moved: 0, wasGround: b.onGround, lx: b.x, lz: b.z,
    cells: [], at: { x: b.x, y: b.y, z: b.z }, dir: [1, 0], line: null, owner: hazardOwner(),
  };
}

function toAttack(s: Spec): AttackDef {
  return {
    id: s.id,
    stage: s.phase === 1 ? 0 : 1,
    ...(s.spirit !== undefined ? { spirit: s.spirit } : {}),
    get telegraph() {
      if (CURRENT) begin(CURRENT, s.id);
      return s.telegraph;
    },
    act(ctx: DeityCtx) {
      const m = mindOf(ctx);
      const tail = TAIL_SECONDS[s.id];
      if (tail !== undefined) {
        m.tailLeft = tail;
        ctx.go(TAIL_STATE[s.id] as string);
        return;
      }
      if (m.tell) s.land(ctx, m, m.tell);
      m.tell = null;
    },
  };
}

/** The panda's ten attacks in the order of its document (B3 1–4, B3b 5–10). */
export const PANDA_ATTACKS: readonly AttackDef[] = SPECS.map(toAttack);
export const PANDA_KINDS: readonly Kind[] = SPECS.map(s => s.id);
/** The phase an attack enters in (B3b). */
export const phaseOf = (id: string): 1 | 2 => SPEC_BY.get(id as Kind)?.phase ?? 1;

/** The attacks its gates allow now (the machine still filters by stage and by the spirit gate). */
function allowed(m: Mind, list: readonly AttackDef[]): readonly AttackDef[] {
  if (m.won || m.core === 'Napping' || m.clock < m.attackAt - 1e-9) return [];
  const ctx = m.ctx;
  return list.filter(a => {
    const s = SPEC_BY.get(a.id as Kind);
    if (!s) return true;
    if (s.phase === 2 && ctx.deity.hits < HALF_HITS) return false;
    return s.gate ? s.gate(ctx, m) : true;
  });
}

// ───────────────────────── the panda's rule and states ─────────────────────────

/** What the telegraph shows, and what the player did while it ran (Slow chew reads it). */
function trackTell(ctx: DeityCtx, m: Mind, dt: number) {
  const t = m.tell!;
  const s = SPEC_BY.get(t.id)!;
  if (t.fresh) { t.fresh = false; s.begin?.(ctx, m, t); }
  const b = playerBody(ctx);
  const pushed = Math.hypot(b.vx, b.vz) > PUSHED_SPEED;
  if (b.onGround) {
    if (!pushed) t.moved += Math.hypot(b.x - t.lx, b.z - t.lz);
  } else if (t.wasGround && b.vy > JUMP_VY && !pushed) {
    t.jumps++;
  }
  t.wasGround = b.onGround;
  t.lx = b.x; t.lz = b.z;
  s.show?.(ctx, m, t, dt);
}

/** The rest beat and its calm feedback (B2): leaves settle round a still player; at 2 s the next attack waits 2 s more. */
function restBeat(ctx: DeityCtx, m: Mind, dt: number) {
  const s = ctx.still();
  if (s <= 0) { m.leaves = 0; m.leafT = 0; return; }
  m.leafT -= dt;
  if (m.leafT <= 0 && m.leaves < LEAVES) {
    m.leafT += LEAF_EVERY;
    const b = playerBody(ctx), a = (m.leaves / LEAVES) * 2 * Math.PI;
    ctx.host.fx('motes', b.x + 0.9 * Math.cos(a), b.y + 0.05, b.z + 0.9 * Math.sin(a), 1);
    m.leaves++;
  }
  if (!m.beatGiven && s >= REST_BEAT) {
    m.beatGiven = true;
    m.attackAt = Math.max(m.attackAt, m.clock) + REST_BEAT_WAIT;
    m.log.push('rest-beat');
    cueAt(ctx, 'sigh');
  }
}

/** The tumble's ball: rolls along its line, stops at a solid block, drains once on touch. */
function rollBall(ctx: DeityCtx, m: Mind, dt: number) {
  const ball = m.ball!;
  const w = ctx.host.world();
  const step = Math.min(ball.left, TUMBLE_SPEED * dt);
  const nx = ball.x + ball.dx * step, nz = ball.z + ball.dz * step;
  if (w.solid(Math.floor(nx), ball.y, Math.floor(nz))) {
    ctx.host.fx('puff', ball.x, ball.y + 0.5, ball.z, 4);
    m.log.push('stopped:tumble');
    endBall(ctx, m);
    return;
  }
  ball.x = nx; ball.z = nz; ball.left -= step;
  ball.puffT -= dt;
  if (ball.puffT <= 0) { ball.puffT += 0.1; ctx.host.fx('puff', ball.x, ball.y + 0.5, ball.z, 2); }
  const b = playerBody(ctx);
  if (!ball.touched && Math.hypot(b.x - ball.x, b.z - ball.z) <= TUMBLE_TOUCH && b.y < ball.y + 1 && b.y + b.h > ball.y) {
    ball.touched = true;
    m.log.push('drain:tumble');
    ctx.drain(TUMBLE_SPIRIT);
  }
  if (ball.left <= 1e-6) endBall(ctx, m);
}

function endBall(ctx: DeityCtx, m: Mind) {
  if (m.ball) ctx.host.hazards().clear(m.ball.owner);
  m.ball = null;
}

const rule: DeityRule = {
  id: 'panda',
  tick(ctx, dt) {
    const m = mindOf(ctx);
    CURRENT = m;
    m.clock += dt;
    if (ctx.host.player().held) m.lastHeld = m.clock;
    if (m.won) return;
    if (m.tell) trackTell(ctx, m, dt);
    if (m.core === 'Watching') restBeat(ctx, m, dt);
    if (m.ball) rollBall(ctx, m, dt);
    // the one change of phase, at half the hits; a telegraph on show is never cut (its Recovering rallies instead)
    if (!m.rallied && ctx.deity.hits >= HALF_HITS && (m.core === 'Idle' || m.core === 'Watching')) {
      m.rallied = true;
      m.rallyNow = true;
      ctx.go('Rallying');
    }
  },
  // Watching begins: the phase's rest, 3.5 s while Grazing and 2.5 s while Hurrying, on the def's 2.5 s.
  delay(ctx) {
    const m = mindOf(ctx);
    m.resuming = false;
    m.core = 'Watching';
    m.beatGiven = false;
    m.leaves = 0;
    const extra = ctx.deity.hits < HALF_HITS ? REST[0] - REST[1] : 0;
    m.attackAt = m.clock + REST[1] + extra;
    return extra;
  },
};

const idle: CustomState = {
  name: 'Idle', replaces: 'Idle',
  enter(ctx) { const m = mindOf(ctx); resumed(m); m.core = 'Idle'; },
  next(ctx) {
    const d = ctx.distance();
    const high = playerBody(ctx).y - ctx.plan.y0 >= WATCH_HEIGHT;
    return d <= SIGHT || (high && d <= SIGHT * 1.5) ? 'Watching' : null;
  },
};

const recovering: CustomState = {
  name: 'Recovering', replaces: 'Recovering',
  enter(ctx) {
    const m = mindOf(ctx);
    if (!resumed(m)) { m.recoverEnd = m.clock + RECOVER; cueAt(ctx, 'sigh'); }
    m.core = 'Recovering';
  },
  next(ctx) {
    const m = mindOf(ctx);
    if (m.clock < m.recoverEnd - 1e-9) return null;
    if (!m.won && !m.rallied && ctx.deity.hits >= HALF_HITS) { m.rallied = true; m.rallyNow = true; return 'Rallying'; }
    return 'Watching';
  },
};

/** The one rally (at half the hits) yawns and stretches for 2 s, then the nap; the machine's own rallies pass through. */
const rallying: CustomState = {
  name: 'Rallying', replaces: 'Rallying',
  enter(ctx) {
    const m = mindOf(ctx);
    resumed(m);
    if (m.rallyNow) {
      m.rallyNow = false;
      m.realRally = true;
      m.rallyEnd = m.clock + RALLY;
      m.log.push('rally');
      cueAt(ctx, 'yawn');
      const b = ctx.deity.body;
      ctx.host.fx('motes', b.x, b.y + b.h, b.z, 6);
    } else {
      m.realRally = false;
      m.resumeTo = TAILS.has(m.core) ? 'Recovering' : m.core === 'Rallying' || m.core === 'Attacking' ? 'Watching' : m.core;
    }
    m.core = 'Rallying';
  },
  next(ctx) {
    const m = mindOf(ctx);
    if (!m.realRally) { m.resuming = true; return m.resumeTo; }
    return m.clock >= m.rallyEnd - 1e-9 ? 'Napping' : null;
  },
};

const napping: CustomState = {
  name: 'Napping',
  enter(ctx) {
    const m = mindOf(ctx);
    if (!resumed(m)) { m.napEnd = m.clock + NAP; m.log.push('nap'); cueAt(ctx, 'snore'); }
    m.core = 'Napping';
  },
  next(ctx) { const m = mindOf(ctx); return m.clock >= m.napEnd - 1e-9 ? 'Watching' : null; },
};

/** A special's longer telegraph: it waits out its tail, then lands; the tumble waits for its ball too. */
const tail = (name: string): CustomState => ({
  name,
  enter(ctx) { const m = mindOf(ctx); resumed(m); m.core = name; },
  tick(ctx, dt) {
    const m = mindOf(ctx);
    if (m.tailLeft <= 0) return;
    m.tailLeft -= dt;
    if (m.tailLeft > 1e-9) return;
    m.tailLeft = 0;
    const t = m.tell;
    if (t) SPEC_BY.get(t.id)?.land(ctx, m, t);
  },
  next(ctx) {
    const m = mindOf(ctx);
    return m.tailLeft > 0 || m.ball ? null : 'Recovering';
  },
  exit(ctx) {
    const m = mindOf(ctx);
    // cut short by a rally passing through, the special does not land and its marks go
    if (m.tell && !m.ball) ctx.host.hazards().clear(m.tell.owner);
    m.tell = null;
    m.tailLeft = 0;
  },
});

// ───────────────────────── the model (docs/art/sky/panda.md) ─────────────────────────

const TX = 1 / 16;
const box = (size: [number, number, number], pos: [number, number, number], t: PalToken, more: Partial<ModelPart> = {}): ModelPart =>
  ({ size: [size[0] * TX, size[1] * TX, size[2] * TX], pos: [pos[0] * TX, pos[1] * TX, pos[2] * TX], color: pal(t), ...more });

/** The plush body: legs, a round felt body with its black shoulder band, arms on shoulder pivots, the stalk. */
export const PANDA_BODY: readonly ModelPart[] = [
  box([6, 5, 6], [-4, 2.5, 1], 'plush.panda.black.base'),
  box([6, 5, 6], [4, 2.5, 1], 'plush.panda.black.base'),
  box([16, 14, 14], [0, 11, 0], 'plush.panda.white.base', { name: 'body' }),
  box([10, 8, 1], [0, 10, 7.25], 'plush.panda.white.hi', { inlay: true }),
  box([17, 5, 15], [0, 16, 0], 'plush.panda.black.base'),
  box([1, 1, 1], [-10.5, 16.5, 1], 'plush.panda.black.base', { name: 'armL' }),
  box([5, 11, 5], [0, -5, 0], 'plush.panda.black.base', { parent: 'armL' }),
  box([1, 1, 1], [10.5, 16.5, 1], 'plush.panda.black.base', { name: 'armR' }),
  box([5, 11, 5], [0, -5, 0], 'plush.panda.black.base', { parent: 'armR' }),
  box([2, 22, 2], [0, -6, 3.5], 'mat.bamboo.base', { parent: 'armR', name: 'stalk' }),
  box([4, 1, 3], [2, 10, 0], 'mat.skyleaf.base', { parent: 'stalk' }),
];

/** The giant head, 2.25 times the body's width: ears, eye patches, heavy lids, muzzle and the chewing mouth. */
export const PANDA_HEAD: readonly ModelPart[] = [
  box([36, 30, 32], [0, 33, 0], 'plush.panda.white.base', { name: 'head' }),
  box([34, 2, 30], [0, -14.5, 0], 'plush.panda.white.dark', { parent: 'head' }),
  box([9, 9, 7], [-14, 16, -2], 'plush.panda.black.base', { parent: 'head', name: 'earL' }),
  box([9, 9, 7], [14, 16, -2], 'plush.panda.black.base', { parent: 'head', name: 'earR' }),
  box([5, 5, 1], [-14, 16, 1.6], 'plush.panda.black.hi', { parent: 'head', inlay: true }),
  box([5, 5, 1], [14, 16, 1.6], 'plush.panda.black.hi', { parent: 'head', inlay: true }),
  box([10, 11, 1], [-8, 1, 16.5], 'plush.panda.black.base', { parent: 'head', inlay: true, rot: [0, 0, 0.35] }),
  box([10, 11, 1], [8, 1, 16.5], 'plush.panda.black.base', { parent: 'head', inlay: true, rot: [0, 0, -0.35] }),
  box([3, 3, 1], [-8, 1, 17.1], 'plush.panda.eye', { parent: 'head', inlay: true }),
  box([3, 3, 1], [8, 1, 17.1], 'plush.panda.eye', { parent: 'head', inlay: true }),
  box([1, 1, 1], [-7, 2, 17.6], 'plush.panda.glint', { parent: 'head', inlay: true }),
  box([1, 1, 1], [9, 2, 17.6], 'plush.panda.glint', { parent: 'head', inlay: true }),
  box([6, 4, 1], [-8, 2.5, 17.8], 'plush.panda.black.dark', { parent: 'head', name: 'lidL' }),
  box([6, 4, 1], [8, 2.5, 17.8], 'plush.panda.black.dark', { parent: 'head', name: 'lidR' }),
  box([14, 9, 4], [0, -7, 17], 'plush.panda.white.hi', { parent: 'head' }),
  box([6, 3, 2], [0, -4, 19.5], 'plush.panda.black.base', { parent: 'head' }),
  box([6, 2, 1], [0, -9.5, 19.1], 'plush.panda.mouth', { parent: 'head', name: 'mouth' }),
];

interface Rest { px: number; py: number; pz: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number }
const RESTS = new WeakMap<THREE.Object3D, Rest>();

/** Puts a part back in its pose as built: every frame starts from it, so a pose never drifts. */
export function atRest(o: THREE.Object3D | undefined): THREE.Object3D | null {
  if (!o) return null;
  let r = RESTS.get(o);
  if (!r) {
    r = { px: o.position.x, py: o.position.y, pz: o.position.z, rx: o.rotation.x, ry: o.rotation.y, rz: o.rotation.z, sx: o.scale.x, sy: o.scale.y, sz: o.scale.z };
    RESTS.set(o, r);
  }
  o.position.set(r.px, r.py, r.pz);
  o.rotation.set(r.rx, r.ry, r.rz);
  o.scale.set(r.sx, r.sy, r.sz);
  return o;
}

/** 0 → 1 over a telegraph: the tell reaches its extreme pose as the telegraph ends (DECISIONS §8.5). */
const ease = (u: number) => { const k = Math.max(0, Math.min(1, u)); return k * k * (3 - 2 * k); };
const on = (t: number, hz: number) => (Math.sin(2 * Math.PI * hz * t) > 0 ? 1 : 0);

/** A pose to show, for the gallery: a state, a telegraph and how far into it, the hits' ratio. */
export interface PandaPose { core: string; tell: Kind | null; u: number; still: boolean; won: boolean }

/** Poses the panda's parts (view only). Poses step at 12 fps; breathing is ±3 %, nothing toggles faster than 2 Hz. */
export function posePanda(parts: Parts, ratio: number, p: PandaPose, clock: number) {
  const t = Math.floor(clock * 12) / 12;
  const body = atRest(parts.get('body')), head = atRest(parts.get('head'));
  const armL = atRest(parts.get('armL')), armR = atRest(parts.get('armR'));
  const mouth = atRest(parts.get('mouth'));
  const lidL = atRest(parts.get('lidL')), lidR = atRest(parts.get('lidR'));
  atRest(parts.get('earL')); atRest(parts.get('earR')); atRest(parts.get('stalk'));
  if (body) body.scale.y *= 1 + 0.03 * Math.sin(2 * Math.PI * 0.4 * t);

  // the lids: heavy at first, opening as the gold marks gather; shut for the nap, drooping for a still player
  let shut = 1 - 0.8 * ratio;
  if (p.core === 'Napping') shut = 1.4;
  else if (p.won) shut = 0.15;
  else if (p.core === 'Watching' && p.still) shut = Math.min(1.4, shut + 0.3);
  if (p.tell === 'chew') shut = Math.max(shut, 0.6 + 0.8 * p.u);
  for (const lid of [lidL, lidR]) {
    if (!lid) continue;
    lid.scale.y = Math.max(0.15, shut);
    lid.position.y += (1 - lid.scale.y) * 2 * TX;
  }
  const u = ease(p.u);
  switch (p.tell) {
    case null:
      // chewing at rest, the stalk at the mouth; a nap keeps the mouth shut
      if (mouth && p.core !== 'Napping') mouth.scale.y = 1 + 0.6 * on(t, 1.5);
      if (armR && (p.core === 'Idle' || p.core === 'Watching')) armR.rotation.x = -1.1;
      if (head && p.core === 'Napping') head.rotation.x = 0.3;
      if (armL && armR && p.core === 'Rallying') { armL.rotation.z = -2.6; armR.rotation.z = 2.6; if (mouth) mouth.scale.y = 3.5; }
      break;
    case 'toss': if (armR) armR.rotation.x = -Math.PI * u; break;
    case 'press': if (armL && armR) { armL.rotation.x = armR.rotation.x = -0.6 * (1 - u); } if (body) body.scale.y *= 1 - 0.08 * u; break;
    case 'sit': if (body) body.position.x += (on(t, 1.5) * 2 - 1) * TX * u; if (head) head.position.y -= 2 * TX * u; break;
    case 'yawn': if (mouth) mouth.scale.y = 1 + 3 * u; if (head) head.rotation.x = -0.3 * u; break;
    case 'shove': if (armL) armL.rotation.z = -2.4 * u; break;
    case 'thicket': if (armR) armR.rotation.x = -0.6 * (0.4 + 0.6 * on(t, 2)); break;
    case 'chew': if (mouth) mouth.scale.y = 1 + 0.8 * on(t, 2); break;
    case 'peekaboo': if (armL && armR) { armL.rotation.x = armR.rotation.x = -2.5 * u; } break;
    case 'tumble': if (head) head.rotation.x = 0.5 * u; if (body) body.scale.set(1 - 0.1 * u, 1 - 0.15 * u, 1 - 0.1 * u); break;
    case 'cradle': if (armL && armR) { armL.rotation.z = -1.3 * u; armR.rotation.z = 1.3 * u; } if (head) head.rotation.x = -0.25 * u; break;
  }
}

/** The panda's sign of progress (its lids open as the hits gather) and its poses, read from its memory. View only. */
function progress(parts: Parts, ratio: number) {
  const m = CURRENT;
  if (!m) { posePanda(parts, ratio, { core: 'Idle', tell: null, u: 0, still: false, won: false }, 0); return; }
  const tell = m.tell;
  const len = m.ctx.def.telegraph + (tell ? TAIL_SECONDS[tell.id] ?? 0 : 0);
  posePanda(parts, ratio, {
    core: m.core, tell: tell?.id ?? null, u: tell ? (m.clock - tell.start) / len : 0,
    still: m.ctx.still() > 0.3, won: m.won,
  }, m.clock);
  // the body turns slowly to the player (the inner group, so the gold marks on the holder stay where they landed)
  const inner = parts.get(HOLDER)?.children[0];
  if (!inner) return;
  const dt = Math.max(0, Math.min(0.1, m.clock - m.drawn));
  m.drawn = m.clock;
  const p = m.ctx.host.player().body, d = m.ctx.deity.body;
  let diff = Math.atan2(p.x - d.x, p.z - d.z) - m.yaw;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  m.yaw += diff * Math.min(1, dt * (m.core === 'Idle' ? 0.5 : 1.5));
  const lean = m.core === 'Recovering' ? -0.22 : m.core === 'Napping' ? 0.12 : 0;
  inner.rotation.set(lean, m.yaw, 0, 'YXZ');
}

// ───────────────────────── the def ─────────────────────────

/** The panda's deity def; `only` keeps just those attacks (the tests and the gallery run them one at a time). */
export function makePandaDeity(only?: readonly Kind[]): DeityDef {
  const list = only ? PANDA_ATTACKS.filter(a => only.includes(a.id as Kind)) : PANDA_ATTACKS;
  return {
    animal: 'panda', floor: 1,
    hits: HITS,
    telegraph: TELEGRAPH[0],
    recover: RECOVER,
    // the phase's rest is the def's 2.5 plus the rule's delay (1 s more while Grazing)
    rest: [REST[1], REST[1], REST[1]],
    sight: SIGHT,
    hover: HOVER,
    teleport: false,
    // The panda has no guard (B4): every warm positive touch counts. Asked on each one, it notes the touch.
    guard: (_d, ctx) => { const m = mindOf(ctx); m.lastTouch = m.clock; return false; },
    get attacks() { return CURRENT ? allowed(CURRENT, list) : list; },
    states: [idle, recovering, rallying, napping, tail('Chewing'), tail('Peeking'), tail('Tumbling'), tail('Cradling')],
    rules: [rule],
    // B4: an ally sitting against the panda adds a hit every 4 s. Open question 9 proposes no cap: provisional,
    // the cap is the whole count.
    ally: { act: 'sit', every: 4, cap: HITS },
    knock: 'nudge',
    won: {
      toast: 'sky.panda.won',
      play(ctx) {
        const m = mindOf(ctx);
        m.won = true;
        m.core = 'Won';
        m.tell = null;
        endBall(ctx, m);
        m.log.push('won');
        const b = ctx.deity.body;
        ctx.host.fx('gold', b.x, b.y + b.h / 2, b.z, 12);
        cueAt(ctx, 'sigh');
      },
    },
    model: { body: PANDA_BODY, head: PANDA_HEAD, hw: 1.1, h: 3, progress },
  };
}

export const pandaDeity: DeityDef = makePandaDeity();
