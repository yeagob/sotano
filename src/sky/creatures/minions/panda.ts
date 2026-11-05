// The panda minions: the panda itself, embodied as smaller pandas (docs/design/not-built/sky/guardians/PANDA.md B5,
// docs/design/not-built/sky/minions/README.md). Calm, slow and never striking: their danger is weight and position.
//
// A wild one walks 1.5 a second, pulls itself up a column face a block every 1.2 s, clambers slowly across the short
// gaps of the grove, rolls down at 4 when the way is down, and sits whenever it is not moving. In order, each tick:
// a minion an ally knocked down rolls to the ground; one that strays to the foot well's rim steps back out (owner,
// 2026-11-05); a player standing still within 3 blocks for 2 s makes it sit and watch; a player below it on its
// column makes it tuck and roll (a soft push, with the floor's telegraph); a sitting one chews an original block in
// front of it over 3 s (the block comes back after 5 s); otherwise it climbs to the column top nearest the player
// that is higher than the player, never above the seat's height, and sits there. During the panda's nap it moves at
// half pace. An ally clears a wild minion off a column, climbs to the seat to sit against the panda (two at most),
// or follows the player and sits on their column, holding the cell under it. Nothing here hurts or drains.

import type * as THREE from 'three';
import { AIR } from '../../../content/materials';
import { pal, type PalToken } from '../../../content/palette';
import type { ModelPart } from '../../../enemies/types';
import { linksOf, nearest, placeById, route } from '../../floors/graph';
import { FOOT_WELL, SKY_AXIS } from '../../floors/tree';
import { HOLDER } from '../../render/creature-view';
import { ExceptionKind, type Gait, type MinionCtx, type MinionDef, type MinionRule, type Move, type Parts, type Place, type SkyActor, type Vec3 } from '../../types';
import { pandaNapping } from '../deities/panda';
import { aimAt, arrived, climbFace, compose, roll, walk } from '../gaits';

/** B5 targets. */
export const WALK = 1.5;
export const CLIMB = 1.2;
export const ROLL = 4;
/** A clamber across a gap of the grove, blocks a second (as slow as a climb). */
export const CLAMBER = 1.2;
export const CURIOUS_RANGE = 3;
export const CURIOUS_TIME = 2;
export const CHEW_TIME = 3;
export const REGROW = 5;
/** Seconds between two rolls, and two chews, of one minion. */
const ROLL_EVERY = 8;
const CHEW_EVERY = 15;
const SOFT_PUSH = 1.5 * 2.5;
/** The well's rim: one block round the mouth; a minion keeps this far from the mouth's centre. */
const RIM = 1;
const RIM_MARGIN = 0.5;
/** At most this many allies sit against the panda at once (B4). */
export const HELPERS = 2;
const MOVES: readonly Move[] = ['walk', 'step', 'jump', 'drop', 'climb', 'build'];

// ───────────────────────── gaits ─────────────────────────

/**
 * Clambers across a short gap of the grove to the next column top (up to 2 up or 1.5 down, 1.2 to 3.6 across) at
 * `speed`, in a low arc: a panda pulling itself over, never a leap. It applies only where the next step has no ground
 * and no face (walking or climbing do the rest). Deterministic: the arc is kept by actor id.
 */
export const clamber = (speed: number): Gait => {
  const arcs = new Map<number, { from: Vec3; to: Vec3; t: number; T: number }>();
  return {
    id: 'clamber',
    step: (m, ctx, to, dt) => {
      const b = m.body;
      let a = arcs.get(m.id);
      if (!a) {
        if (arrived(m, to)) return true;
        const p = aimAt(to);
        const d = Math.hypot(p.x - b.x, p.z - b.z), dy = p.y - b.y;
        if (!b.onGround || d < 1.2 || d > 3.6 || dy < -1.5 || dy > 2.2) return false;
        const w = ctx.host.world();
        const nx = Math.floor(b.x + ((p.x - b.x) / d) * (b.hw + 0.6)), nz = Math.floor(b.z + ((p.z - b.z) / d) * (b.hw + 0.6));
        const fy = Math.floor(b.y + 1e-3);
        if (w.solid(nx, fy - 1, nz) || w.solid(nx, fy, nz)) return false;
        a = { from: { x: b.x, y: b.y, z: b.z }, to: p, t: 0, T: d / Math.max(0.1, speed) };
        arcs.set(m.id, a);
      }
      a.t = Math.min(a.T, a.t + dt);
      const u = a.t / a.T;
      b.x = a.from.x + (a.to.x - a.from.x) * u;
      b.z = a.from.z + (a.to.z - a.from.z) * u;
      b.y = a.from.y + (a.to.y - a.from.y) * u + 0.6 * Math.sin(Math.PI * u) + Math.max(0, a.to.y - a.from.y) * Math.sin(Math.PI * u) * 0.5;
      b.vx = 0; b.vy = 0; b.vz = 0;
      b.onGround = false;
      if (u < 1) return false;
      arcs.delete(m.id);
      b.y = a.to.y;
      b.onGround = true;
      return true;
    },
  };
};

export const PANDA_GAIT = compose(clamber(CLAMBER), roll(ROLL), climbFace(CLIMB), walk(WALK));
/** B5 rule 7: during the panda's nap, half pace. */
export const NAP_GAIT = compose(clamber(CLAMBER / 2), roll(ROLL / 2), climbFace(CLIMB * 2), walk(WALK / 2));
const ROLL_GAIT = compose(roll(ROLL), walk(WALK));

// ───────────────────────── memory ─────────────────────────

interface Mem {
  last: number;
  stillT: number;
  sitting: boolean;
  rollReady: number;
  rollAt: number;
  rollTo: Place | null;
  chewCell: number;
  chewT: number;
  biteT: number;
  chewReady: number;
  knocked: Place | null;
  clearReady: number;
  helping: boolean;
  holding: boolean;
}
const MEMS = new WeakMap<SkyActor, Mem>();
function memOf(m: SkyActor, ctx: MinionCtx): Mem {
  let s = MEMS.get(m);
  if (!s) {
    const now = ctx.host.time();
    s = {
      last: now, stillT: 0, sitting: false, rollReady: now, rollAt: -1, rollTo: null, chewCell: -1, chewT: 0, biteT: 0,
      chewReady: now + CHEW_EVERY / 2, knocked: null, clearReady: now, helping: false, holding: false,
    };
    MEMS.set(m, s);
  }
  return s;
}
/** Seconds since this minion's last rule tick (the rules get no dt: they read the host's clock). */
function tick(s: Mem, ctx: MinionCtx): number {
  const now = ctx.host.time();
  const dt = Math.max(0, now - s.last);
  s.last = now;
  return dt;
}

// ───────────────────────── places and routes ─────────────────────────

/** The foot well's mouth on this floor: FOOT_WELL is off the trunk's axis, and the floor's seat is on it. */
export function wellOf(ctx: { plan: MinionCtx['plan'] }): { x: number; z: number; r: number } {
  const s = ctx.plan.seat;
  return { x: s.x + (FOOT_WELL.x - SKY_AXIS.x) + 0.5, z: s.z + (FOOT_WELL.z - SKY_AXIS.z) + 0.5, r: FOOT_WELL.r };
}
/** Whether (x, z) is on the well's mouth or its rim, with a margin for the body. */
export function onRim(ctx: { plan: MinionCtx['plan'] }, x: number, z: number, hw = 0.45): boolean {
  const w = wellOf(ctx);
  return Math.hypot(x - w.x, z - w.z) <= w.r + RIM + RIM_MARGIN + hw;
}
const placeOnRim = (ctx: MinionCtx, p: Place) => onRim(ctx, p.x + 0.5, p.z + 0.5);
const atGround = (ctx: MinionCtx, y: number) => y < ctx.plan.y0 + 0.5;
const temp = (x: number, y: number, z: number): Place => ({ id: -1, kind: 'ground', x: Math.floor(x), y, z: Math.floor(z), w: 1, d: 1, tag: 0 });

/** No solid cell at feet and head height on the ground line from the body to p. */
function clearLine(ctx: MinionCtx, from: Vec3, to: Vec3): boolean {
  const w = ctx.host.world();
  const d = Math.hypot(to.x - from.x, to.z - from.z), n = Math.ceil(d / 0.5), y = Math.floor(from.y + 1e-3);
  for (let k = 1; k < n; k++) {
    const x = Math.floor(from.x + ((to.x - from.x) * k) / n), z = Math.floor(from.z + ((to.z - from.z) * k) / n);
    if (w.solid(x, y, z) || w.solid(x, y + 1, z) || onRim(ctx, x + 0.5, z + 0.5)) return false;
  }
  return true;
}

/** On the ground, a straight walk to `to`, or round the seat by a clear point of a ring when the way is shut. */
function groundStep(m: SkyActor, ctx: MinionCtx, to: Place): Place {
  const b = m.body, p = aimAt(to);
  if (clearLine(ctx, b, p)) return to;
  const s = ctx.plan.seat;
  let best: Place | null = null, bestD = Infinity;
  for (const r of [5, 8]) for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 2 * Math.PI;
    const q = { x: s.x + 0.5 + r * Math.cos(a), y: ctx.plan.y0, z: s.z + 0.5 + r * Math.sin(a) };
    if (onRim(ctx, q.x, q.z) || !clearLine(ctx, b, q) || ctx.host.world().solid(Math.floor(q.x), q.y, Math.floor(q.z))) continue;
    const d = Math.hypot(q.x - b.x, q.z - b.z) + Math.hypot(p.x - q.x, p.z - q.z);
    if (d < bestD) { bestD = d; best = temp(q.x, q.y, q.z); }
  }
  return best ?? to;
}

/** The next place to move to on the way to `target` along the floor graph, or null once there. */
export function hopToward(m: SkyActor, ctx: MinionCtx, target: Place): Place | null {
  if (arrived(m, target)) return null;
  const g = ctx.plan.graph, b = m.body;
  const entries = g.places.filter(p => atGround(ctx, p.y) && linksOf(g, p.id).length > 0 && !placeOnRim(ctx, p));
  if (atGround(ctx, b.y)) {
    if (atGround(ctx, target.y)) return groundStep(m, ctx, target);
    let best: { e: Place; path: number[] } | null = null, bestC = Infinity;
    for (const e of entries) {
      const path = route(g, e.id, target.id, MOVES);
      if (!path) continue;
      const c = Math.hypot(e.x + 0.5 - b.x, e.z + 0.5 - b.z) + 2 * path.length;
      if (c < bestC) { bestC = c; best = { e, path }; }
    }
    if (!best) return null;
    if (!arrived(m, best.e)) return groundStep(m, ctx, best.e);
    return best.path.length > 1 ? placeById(g, best.path[1]) : target;
  }
  const from = nearest(g, b.x, b.y, b.z);
  if (!from) return null;
  if (!arrived(m, from) && (Math.hypot(from.x + 0.5 - b.x, from.z + 0.5 - b.z) > 1.5 || Math.abs(from.y - b.y) > 1.5)) {
    // off the graph (fallen between columns): down to the nearest way in
    const e = nearest({ places: entries, links: [] }, b.x, b.y, b.z);
    return e;
  }
  const path = route(g, from.id, target.id, MOVES);
  if (!path) return nearest({ places: entries, links: [] }, b.x, b.y, b.z);
  if (!arrived(m, from)) return from;
  return path.length > 1 ? placeById(g, path[1]) : target;
}

function move(m: SkyActor, ctx: MinionCtx, to: Place) {
  ctx.moveTo(m, to, pandaNapping(ctx.deity) ? NAP_GAIT : undefined);
}

function sit(m: SkyActor, s: Mem) {
  m.body.vx = 0; m.body.vz = 0;
  s.sitting = true;
}

/** The column top nearest the player and higher than them, never above the seat's height, never on the rim. */
function perchFor(ctx: MinionCtx): Place | null {
  const p = ctx.host.player().body, seat = ctx.plan.seat;
  let best: Place | null = null, bestD = Infinity;
  for (const q of ctx.plan.graph.places) {
    if (q.kind !== 'top' || q.y >= seat.y || placeOnRim(ctx, q)) continue;
    const d = Math.hypot(q.x + 0.5 - p.x, q.z + 0.5 - p.z) + (q.y > p.y + 0.5 ? 0 : 100);
    if (d < bestD) { bestD = d; best = q; }
  }
  return best;
}

// ───────────────────────── wild rules (B5, in order) ─────────────────────────

/** Knocked down by an ally: rolls to the ground, unharmed. */
const knocked: MinionRule = (m, ctx) => {
  const s = memOf(m, ctx);
  if (!s.knocked) return false;
  if (arrived(m, s.knocked) || atGround(ctx, m.body.y)) { s.knocked = null; return false; }
  ctx.moveTo(m, s.knocked, ROLL_GAIT);
  return true;
};

/** Rule 8: never into the foot well's mouth; a minion on its rim steps back out. */
const rim: MinionRule = (m, ctx) => {
  const b = m.body;
  if (!atGround(ctx, b.y) || !onRim(ctx, b.x, b.z, b.hw)) return false;
  const w = wellOf(ctx);
  const dx = b.x - w.x, dz = b.z - w.z, d = Math.hypot(dx, dz) || 1;
  const r = w.r + RIM + RIM_MARGIN + b.hw + 1;
  ctx.moveTo(m, temp(w.x + (dx / d) * r, Math.floor(b.y + 1e-3), w.z + (dz / d) * r));
  return true;
};

/** Rule 3: a player standing still within 3 blocks for 2 s: it sits and watches until they move. */
const curious: MinionRule = (m, ctx) => {
  const s = memOf(m, ctx);
  const dt = tick(s, ctx);
  const p = ctx.host.player().body, b = m.body;
  const still = p.onGround && Math.hypot(p.vx, p.vz) < 0.05;
  const near = Math.hypot(p.x - b.x, p.z - b.z) <= CURIOUS_RANGE && Math.abs(p.y - b.y) <= 2;
  s.stillT = still && near ? s.stillT + dt : 0;
  if (s.stillT < CURIOUS_TIME) return false;
  sit(m, s);
  return true;
};

/** Rule 4: the player below it on its column: it tucks (the floor's telegraph), then rolls down; the push is soft. */
const tuckRoll: MinionRule = (m, ctx) => {
  const s = memOf(m, ctx), now = ctx.host.time(), b = m.body, p = ctx.host.player().body;
  if (s.rollAt >= 0) {
    if (now < s.rollAt) { sit(m, s); return true; }
    if (!s.rollTo || arrived(m, s.rollTo) || now > s.rollAt + 4) { s.rollAt = -1; s.rollTo = null; return false; }
    s.sitting = false;
    ctx.moveTo(m, s.rollTo, ROLL_GAIT);
    return true;
  }
  if (now < s.rollReady || !p.onGround || !b.onGround) return false;
  const d = Math.hypot(p.x - b.x, p.z - b.z), dy = b.y - p.y;
  if (d > 2.5 || dy < 1 || dy > 8) return false;
  const dir = d > 1e-3 ? { x: (p.x - b.x) / d, y: 0, z: (p.z - b.z) / d } : { x: 1, y: 0, z: 0 };
  ctx.hinder('knockback', { from: { x: b.x, y: Math.floor(p.y), z: b.z }, shape: 'line', dir, radius: d + 1, strength: SOFT_PUSH });
  ctx.host.cue('panda.huff', b.x, b.y + 0.5, b.z);
  s.rollReady = now + ROLL_EVERY;
  s.rollAt = now + 1;
  s.rollTo = nearest(ctx.plan.graph, p.x, p.y, p.z);
  sit(m, s);
  return true;
};

/** An original block beside a sitting minion that it may chew: not placed, not the seat, not the vertical route. */
function chewable(m: SkyActor, ctx: MinionCtx): number {
  const w = ctx.host.world(), b = m.body, seat = ctx.plan.seat;
  const y = Math.floor(b.y + 1e-3);
  for (const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as const) {
    const x = Math.floor(b.x) + dx, z = Math.floor(b.z) + dz;
    if (!w.solid(x, y, z)) continue;
    const i = w.idx(x, y, z);
    if (w.kindAt(i) !== 0 || w.base(x, y, z) !== w.get(x, y, z)) continue;
    if (Math.hypot(x + 0.5 - (seat.x + 0.5), z + 0.5 - (seat.z + 0.5)) < 3.5) continue;
    if (ctx.plan.route.some(r => Math.abs(r.x - x) <= 1 && Math.abs(r.z - z) <= 1 && Math.abs(r.y - y) <= 2)) continue;
    return i;
  }
  return -1;
}

/** Rule 5: a sitting minion chews an original block in front of it over 3 s, with bites; it comes back after 5 s. */
const chew: MinionRule = (m, ctx) => {
  const s = memOf(m, ctx), now = ctx.host.time(), w = ctx.host.world();
  if (s.chewCell >= 0) {
    const [x, y, z] = w.coords(s.chewCell);
    if (w.getAt(s.chewCell) === AIR || w.kindAt(s.chewCell) === ExceptionKind.Placed) { s.chewCell = -1; return false; }
    const dt = Math.max(0, now - s.chewT);
    s.chewT = now;
    s.biteT += dt;
    if (s.biteT >= 0.75 && s.biteT < CHEW_TIME) { ctx.host.fx('puff', x + 0.5, y + 0.8, z + 0.5, 1); }
    if (Math.floor(s.biteT / 0.75) !== Math.floor((s.biteT - dt) / 0.75)) ctx.host.cue('panda.munch', x + 0.5, y + 0.5, z + 0.5);
    if (s.biteT >= CHEW_TIME) {
      w.setTransient(x, y, z, AIR, now + REGROW, m.id);
      ctx.host.fx('puff', x + 0.5, y + 0.5, z + 0.5, 3);
      s.chewCell = -1;
      s.chewReady = now + CHEW_EVERY;
    }
    sit(m, s);
    return true;
  }
  if (!s.sitting || now < s.chewReady) return false;
  const i = chewable(m, ctx);
  if (i < 0) { s.chewReady = now + CHEW_EVERY / 3; return false; }
  s.chewCell = i;
  s.chewT = now;
  s.biteT = 0;
  return true;
};

/** Rules 2 and 6: climbs to the column top nearest the player that is higher than them, and sits there. */
const perch: MinionRule = (m, ctx) => {
  const s = memOf(m, ctx);
  const target = perchFor(ctx);
  const hop = target ? hopToward(m, ctx, target) : null;
  if (!hop) { sit(m, s); return true; }
  s.sitting = false;
  move(m, ctx, hop);
  return true;
};

// ───────────────────────── ally helps ─────────────────────────

/** Clear: rolls into a wild minion up on a column and knocks it down to level ground, unharmed. */
const clear: MinionRule = (m, ctx) => {
  const s = memOf(m, ctx), now = ctx.host.time(), b = m.body;
  if (now < s.clearReady) return false;
  for (const o of ctx.others) {
    if (o.side !== 'wild' || o.state === 'Spawning' || atGround(ctx, o.body.y)) continue;
    const ob = o.body;
    if (Math.hypot(ob.x - b.x, ob.z - b.z) > 2.5 || Math.abs(ob.y - b.y) > 1.5) continue;
    const down = nearest(ctx.plan.graph, ob.x, ctx.plan.y0, ob.z, ['ground', 'spawn', 'nest']);
    if (!down) continue;
    memOf(o, ctx).knocked = down;
    s.clearReady = now + 4;
    ctx.host.fx('puff', ob.x, ob.y + 0.5, ob.z, 4);
    ctx.host.cue('panda.roll', ob.x, ob.y, ob.z);
    return true;
  }
  return false;
};

/** Help: climbs to the seat at its own slow pace and sits against the panda (at most two at once). */
const help: MinionRule = (m, ctx) => {
  const s = memOf(m, ctx);
  if (!ctx.deity || ctx.deity.side === 'ally') { s.helping = false; return false; }
  if (!s.helping) {
    const busy = ctx.others.filter(o => o.side === 'ally' && MEMS.get(o)?.helping).length;
    if (busy >= HELPERS) return false;
    s.helping = true;
  }
  if (s.holding) { ctx.release(m.id); s.holding = false; }
  const hop = hopToward(m, ctx, ctx.plan.seat);
  if (!hop) { sit(m, s); return true; }
  s.sitting = false;
  move(m, ctx, hop);
  return true;
};

/** Hold: follows the player at 2 blocks and sits on their column top; the cell under a sitting ally cannot change. */
const hold: MinionRule = (m, ctx) => {
  const s = memOf(m, ctx), b = m.body, p = ctx.host.player().body;
  if (Math.hypot(p.x - b.x, p.z - b.z) <= 2 && Math.abs(p.y - b.y) <= 1.5 && b.onGround) {
    sit(m, s);
    if (!s.holding) {
      const w = ctx.host.world();
      ctx.protect([w.idx(Math.floor(b.x), Math.floor(b.y - 0.05), Math.floor(b.z))], m.id);
      s.holding = true;
    }
    return true;
  }
  if (s.holding) { ctx.release(m.id); s.holding = false; }
  const to = nearest(ctx.plan.graph, p.x, p.y, p.z, ['top', 'ground', 'ledge', 'nest', 'spawn', 'seat']);
  const hop = to ? hopToward(m, ctx, to) : null;
  if (!hop) { sit(m, s); return true; }
  s.sitting = false;
  move(m, ctx, hop);
  return true;
};

// ───────────────────────── the model ─────────────────────────

const TX = 1 / 16;
const box = (size: [number, number, number], pos: [number, number, number], t: PalToken, more: Partial<ModelPart> = {}): ModelPart =>
  ({ size: [size[0] * TX, size[1] * TX, size[2] * TX], pos: [pos[0] * TX, pos[1] * TX, pos[2] * TX], color: pal(t), ...more });

/** A little panda about a block and a quarter tall: the deity's shapes at a smaller size, its head 2.1 times its body. */
export const PANDA_MINION_PARTS: readonly ModelPart[] = [
  box([3, 2, 3], [-2.5, 1, 1], 'plush.panda.black.base'),
  box([3, 2, 3], [2.5, 1, 1], 'plush.panda.black.base'),
  box([8, 6, 7], [0, 5, 0], 'plush.panda.white.base', { name: 'body' }),
  box([8.5, 2, 7.5], [0, 7.5, 0], 'plush.panda.black.base'),
  box([2.5, 4, 2.5], [-5, 5, 1], 'plush.panda.black.base', { name: 'armL' }),
  box([2.5, 4, 2.5], [5, 5, 1], 'plush.panda.black.base', { name: 'armR' }),
  box([17, 12, 14], [0, 14.5, 0], 'plush.panda.white.base', { name: 'head' }),
  box([4, 4, 3], [-6.5, 7, -1], 'plush.panda.black.base', { parent: 'head' }),
  box([4, 4, 3], [6.5, 7, -1], 'plush.panda.black.base', { parent: 'head' }),
  box([5, 5, 1], [-3.5, 0.5, 7.25], 'plush.panda.black.base', { parent: 'head', inlay: true, rot: [0, 0, 0.35] }),
  box([5, 5, 1], [3.5, 0.5, 7.25], 'plush.panda.black.base', { parent: 'head', inlay: true, rot: [0, 0, -0.35] }),
  box([2, 2, 1], [-3.5, 0.5, 7.6], 'plush.panda.eye', { parent: 'head', inlay: true }),
  box([2, 2, 1], [3.5, 0.5, 7.6], 'plush.panda.eye', { parent: 'head', inlay: true }),
  box([1, 1, 1], [-3, 1, 8], 'plush.panda.glint', { parent: 'head', inlay: true }),
  box([1, 1, 1], [4, 1, 8], 'plush.panda.glint', { parent: 'head', inlay: true }),
  box([7, 4, 2], [0, -3.5, 7.5], 'plush.panda.white.hi', { parent: 'head' }),
  box([3, 1.5, 1], [0, -2, 8.6], 'plush.panda.black.base', { parent: 'head' }),
  box([3, 1, 1], [0, -4.6, 8.6], 'plush.panda.mouth', { parent: 'head', name: 'mouth' }),
];

interface Look { ratio: number; munch: number; happy: number; base: Map<THREE.Object3D, [number, number, number, number]> }
const LOOKS = new WeakMap<Parts, Look>();
/** The view's frame step: react has no clock of its own (view only, never the simulation). */
const FRAME = 1 / 60;

/** Each positive hit: it sits and munches for a second; at the turn, a small happy roll. */
export function reactMinion(parts: Parts, ratio: number) {
  let l = LOOKS.get(parts);
  if (!l) { l = { ratio, munch: 0, happy: 0, base: new Map() }; LOOKS.set(parts, l); }
  if (ratio > l.ratio) { l.munch = 1; if (ratio >= 1) l.happy = 0.6; }
  l.ratio = ratio;
  const mouth = parts.get('mouth'), head = parts.get('head'), inner = parts.get(HOLDER)?.children[0];
  for (const o of [mouth, head]) if (o && !l.base.has(o)) l.base.set(o, [o.position.y, o.scale.y, o.rotation.x, 0]);
  if (l.munch > 0) l.munch = Math.max(0, l.munch - FRAME);
  if (l.happy > 0) l.happy = Math.max(0, l.happy - FRAME);
  const t = Math.floor((1 - l.munch) * 12) / 12;
  if (mouth) { const r = l.base.get(mouth)!; mouth.scale.y = r[1] * (l.munch > 0 && Math.sin(2 * Math.PI * 2 * t) > 0 ? 1.8 : 1); }
  if (head) { const r = l.base.get(head)!; head.rotation.x = r[2] + (l.munch > 0 ? 0.15 : 0); }
  if (inner) inner.rotation.x = l.happy > 0 ? -2 * Math.PI * (1 - l.happy / 0.6) : 0;
}

// ───────────────────────── the def ─────────────────────────

export const pandaMinion: MinionDef = {
  animal: 'panda',
  max: 4, wildMax: 3,
  // B5: a clump rustles and shakes for 1.5 s, then a panda tumbles out; one every 12 s while below the counts.
  spawn: { where: 'clumps', warning: 1.5, every: 12 },
  hitsToTurn: 3,
  gait: PANDA_GAIT,
  rules: [knocked, rim, curious, tuckRoll, chew, perch],
  ally: [
    { kind: 'clear', rule: clear },
    { kind: 'help', rule: help },
    { kind: 'hold', rule: hold },
  ],
  model: { parts: PANDA_MINION_PARTS, hw: 0.45, h: 1.25, react: reactMinion },
};
