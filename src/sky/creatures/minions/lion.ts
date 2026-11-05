// The lion minions, the pride (docs/design/not-built/sky/guardians/LION.md B5, minions/README.md; B4 builds them).
// A lion of the pride keeps low and stalks: slow in the player's view, fast out of it, still and staring back when
// the player looks at it. Up to two hold the ledges the player needs; the rest close in and circle. It pounces from
// a ledge above the player and roars a small freeze, each after its own sign (the crouch and the drawn landing ring;
// the mane lift and the ring), and it never pounces on a frozen player. Each positive hit makes it blink and lower
// its head; at four it turns ally: it holds a ledge (no hindrance may change it), roars the pride down, or climbs to
// the Sunning Ledge and rubs its head on the lion. Every number is the document's target, provisional.

import { pal, type PalToken } from '../../../content/palette';
import type { ModelPart } from '../../../enemies/types';
import { nearest, placeById, route } from '../../floors/graph';
import { bound, compose, pounce as pounceGait, seen, stalk } from '../gaits';
import { HELP_RANGE } from '../minion';
import type { Gait, Move, MinionCtx, MinionDef, MinionRule, Parts, Place, SkyActor } from '../../types';

/** Blocks a second in the player's view (within 60° of the aim) and out of it. */
export const STALK_SEEN = 1;
export const STALK_UNSEEN = 3.5;
export const VIEW_CONE = 60 * Math.PI / 180;
/** Within this cone of the aim the player is looking at it: a stalker stops, sits and stares back (rule 5). */
export const LOOKED_CONE = 30 * Math.PI / 180;
/** Circling the player on the same ledge. */
export const CIRCLE = 6;
/** The pounce: within this sideways, at least this far below; the crouch before the leap, the leap, the push. */
export const POUNCE_SIDE = 5;
export const POUNCE_DROP = 2;
export const CROUCH = 0.3;
export const LEAP = 0.7;
export const POUNCE_PUSH = 5;
export const POUNCE_COOLDOWN = 6;
/** The small roar: its reach, its freeze, how near the player must be, and its cooldown. */
export const ROAR_REACH = 4;
export const ROAR_HOLD = 1;
export const ROAR_COOLDOWN = 9;
/** The sign of the roar, the mane lifted (the ring's own warning runs with it). */
export const ROAR_POSE = 1;
/** Holders: at most this many. */
export const HOLDERS = 2;
/** An ally's clear: hostile minions within this lie down for that long; its cooldown. */
export const CLEAR_RANGE = 6;
export const LIE_DOWN = 4;
export const CLEAR_COOLDOWN = 12;
/** At most this many allies help at the deity at once. */
export const HELPERS = 2;

const MOVES: readonly Move[] = ['walk', 'step', 'jump', 'drop', 'climb'];

type Mode = 'free' | 'crouch' | 'leap' | 'roar' | 'sit' | 'lie' | 'hold';

interface Mind {
  mode: Mode;
  /** Seconds in the mode, and the seconds of the last tick. */
  t: number;
  dt: number;
  /** The machine's clock as last read (rules get no dt: they read it from `actor.t`). */
  last: number;
  pounceCd: number;
  roarCd: number;
  clearCd: number;
  lieLeft: number;
  /** Where a pounce lands, as a place the pounce gait can aim at. */
  leapTo: Place | null;
  /** The ledge a holder lies on. */
  hold: Place | null;
  /** The cells an ally holds safe (its owner id is its actor's). */
  holding: boolean;
  angle: number;
}

const MINDS = new WeakMap<SkyActor, Mind>();
/** The minion whose rules ran last: the system calls `react` right after the same minion's update (read once). */
let ticked: Mind | null = null;

function mindOf(m: SkyActor): Mind {
  let mind = MINDS.get(m);
  if (!mind) {
    mind = { mode: 'free', t: 0, dt: 0, last: 0, pounceCd: 0, roarCd: 0, clearCd: 0, lieLeft: 0, leapTo: null, hold: null, holding: false, angle: 0 };
    MINDS.set(m, mind);
  }
  return mind;
}

/** Advances the mind by the seconds the machine has run since the last rule call. */
function tick(m: SkyActor): { mind: Mind; dt: number } {
  const mind = mindOf(m);
  const dt = m.t >= mind.last ? m.t - mind.last : m.t;
  mind.last = m.t;
  mind.t += dt;
  mind.dt = dt;
  mind.pounceCd = Math.max(0, mind.pounceCd - dt);
  mind.roarCd = Math.max(0, mind.roarCd - dt);
  mind.clearCd = Math.max(0, mind.clearCd - dt);
  mind.lieLeft = Math.max(0, mind.lieLeft - dt);
  ticked = mind;
  return { mind, dt };
}

const to = (mind: Mind, mode: Mode) => { mind.mode = mode; mind.t = 0; };

/** A place made for a point (a leap's landing, a circling point): id −1, so the stuck guard never counts it. */
const spot = (x: number, y: number, z: number): Place => ({ id: -1, kind: 'ground', x: Math.floor(x), y: Math.floor(y + 1e-3), z: Math.floor(z), w: 1, d: 1, tag: 0 });

/** The next place on the graph's route from the minion toward `goal` (the same place once there). */
function nextToward(m: SkyActor, ctx: MinionCtx, goal: Place): Place | null {
  const g = ctx.plan.graph, b = m.body;
  const here = nearest(g, b.x, b.y, b.z);
  if (!here) return null;
  const path = route(g, here.id, goal.id, MOVES);
  if (!path) return null;
  return placeById(g, path[Math.min(1, path.length - 1)]);
}

/** The wild minions of the floor with this one, in id order. */
const pride = (m: SkyActor, ctx: MinionCtx): SkyActor[] =>
  [m, ...ctx.others].filter(a => a.side === 'wild').sort((a, b) => a.id - b.id);

/** The ledge the player needs next: the nearest place above them. */
function neededLedge(ctx: MinionCtx): Place | null {
  const p = ctx.host.player().body;
  let best: Place | null = null, bestD = Infinity;
  for (const q of ctx.plan.graph.places) {
    if (q.kind !== 'ledge' || q.y <= p.y + 0.5) continue;
    const d = Math.hypot(q.x + 0.5 - p.x, q.z + 0.5 - p.z) + (q.y - p.y);
    if (d < bestD) { bestD = d; best = q; }
  }
  return best;
}

// ───────────────────────── the wild rules (B5), in order ─────────────────────────

/** An ally's roar laid it down: it lies still. And a sequence under way (crouch, leap, roar) runs to its end. */
const busy: MinionRule = (m, ctx) => {
  const { mind } = tick(m);
  if (mind.lieLeft > 0) { if (mind.mode !== 'lie') to(mind, 'lie'); return true; }
  if (mind.mode === 'lie') to(mind, 'free');
  if (mind.mode === 'crouch') {
    if (mind.t >= CROUCH) to(mind, 'leap');
    return true;
  }
  if (mind.mode === 'leap') {
    const there = !mind.leapTo || ctx.moveTo(m, mind.leapTo, LEAP_GAIT);
    if (there || mind.t >= LEAP + 0.5) { mind.leapTo = null; to(mind, 'free'); }
    return true;
  }
  if (mind.mode === 'roar') {
    if (mind.t >= ROAR_POSE) to(mind, 'free');
    return true;
  }
  return false;
};

/** Rule 2 (and 4): the pounce from a ledge above, never on a frozen player. */
const pounceRule: MinionRule = (m, ctx) => {
  const mind = mindOf(m), pl = ctx.host.player(), b = m.body, p = pl.body;
  if (pl.held || mind.pounceCd > 0 || !b.onGround) return false;
  if (Math.hypot(p.x - b.x, p.z - b.z) > POUNCE_SIDE || b.y - p.y < POUNCE_DROP) return false;
  mind.leapTo = spot(p.x, p.y, p.z);
  mind.pounceCd = POUNCE_COOLDOWN;
  // the arc's landing is drawn for the floor's telegraph: the crouch and the leap land with its end
  ctx.hinder('lion-ring', { from: { x: p.x, y: p.y, z: p.z }, speed: 8, radius: 1.2, height: 0.8, push: POUNCE_PUSH });
  ctx.host.cue('lion.crouch', b.x, b.y, b.z);
  to(mind, 'crouch');
  return true;
};

/** Rule 3: the small roar, the mane lifted, a ring to 4 blocks that freezes for 1 s. */
const roarRule: MinionRule = (m, ctx) => {
  const mind = mindOf(m), pl = ctx.host.player(), b = m.body, p = pl.body;
  if (pl.held || mind.roarCd > 0 || Math.hypot(p.x - b.x, p.z - b.z) > ROAR_REACH || Math.abs(p.y - b.y) > 1.5) return false;
  mind.roarCd = ROAR_COOLDOWN;
  ctx.hinder('paralysis', { from: { x: b.x, y: b.y, z: b.z }, speed: 8, radius: ROAR_REACH, hold: ROAR_HOLD });
  ctx.host.cue('lion.roar', b.x, b.y + b.h, b.z);
  to(mind, 'roar');
  return true;
};

/** Rule 1: up to two holders lie on the edge of the ledge the player needs and wait there for their pounce. */
const holderRule: MinionRule = (m, ctx) => {
  const mind = mindOf(m);
  if (pride(m, ctx).indexOf(m) >= HOLDERS) { mind.hold = null; return false; }
  mind.hold ??= neededLedge(ctx);
  if (!mind.hold) return false;
  const next = nextToward(m, ctx, mind.hold);
  if (next && next.id !== mind.hold.id) { ctx.moveTo(m, next); return true; }
  if (ctx.moveTo(m, mind.hold)) to(mind, 'hold');
  return true;
};

/** Rule 5: a stalker the player looks at stops, sits and stares back. */
const watchedRule: MinionRule = (m, ctx) => {
  const mind = mindOf(m);
  if (!seen(m, ctx, LOOKED_CONE)) { if (mind.mode === 'sit') to(mind, 'free'); return false; }
  if (mind.mode !== 'sit') to(mind, 'sit');
  m.body.vx = 0; m.body.vz = 0;
  return true;
};

/** The stalkers close in along the floor graph, and circle the player at 6 blocks once on the same ledge. */
const stalkRule: MinionRule = (m, ctx) => {
  const mind = mindOf(m), b = m.body, p = ctx.host.player().body;
  const d = Math.hypot(p.x - b.x, p.z - b.z);
  if (Math.abs(p.y - b.y) < 1 && d < CIRCLE + 3) {
    mind.angle = Math.atan2(b.z - p.z, b.x - p.x) + 0.6;
    const c = spot(p.x + Math.cos(mind.angle) * CIRCLE, b.y, p.z + Math.sin(mind.angle) * CIRCLE);
    ctx.def.gait.step(m, ctx, c, mind.dt);
    return true;
  }
  const goal = nearest(ctx.plan.graph, p.x, p.y, p.z);
  const next = goal ? nextToward(m, ctx, goal) : null;
  if (!next) return false;
  ctx.moveTo(m, next);
  return true;
};

// ───────────────────────── the ally helps (B5) ─────────────────────────

/** Clear: it roars at the pride; hostile minions within 6 blocks lie down for 4 s. */
const clearHelp: MinionRule = (m, ctx) => {
  const { mind } = tick(m);
  if (mind.mode === 'roar') { if (mind.t >= ROAR_POSE) to(mind, 'free'); return true; }
  if (mind.clearCd > 0) return false;
  const b = m.body;
  const near = ctx.others.filter(o => o.side === 'wild' && Math.hypot(o.body.x - b.x, o.body.z - b.z) <= CLEAR_RANGE);
  if (near.length === 0) return false;
  for (const o of near) mindOf(o).lieLeft = LIE_DOWN;
  mind.clearCd = CLEAR_COOLDOWN;
  ctx.host.cue('lion.roar', b.x, b.y + b.h, b.z);
  ctx.host.fx('motes', b.x, b.y + b.h, b.z, 6);
  to(mind, 'roar');
  return true;
};

/** Hold: the first ally lies at the edge of the ledge the player needs, and no hindrance may change that ledge's top. */
const holdHelp: MinionRule = (m, ctx) => {
  const mind = mindOf(m);
  const allies = [m, ...ctx.others].filter(a => a.side === 'ally').sort((a, b) => a.id - b.id);
  if (allies[0] !== m) return false;
  const ledge = neededLedge(ctx) ?? mind.hold;
  if (!ledge) return false;
  if (mind.hold && mind.hold.id !== ledge.id && mind.holding) { ctx.release(m.id); mind.holding = false; }
  mind.hold = ledge;
  const next = nextToward(m, ctx, ledge);
  if (next && next.id !== ledge.id) { ctx.moveTo(m, next); return true; }
  if (ctx.moveTo(m, ledge) && !mind.holding) {
    const w = ctx.host.world();
    const x0 = ledge.x - ((ledge.w - 1) >> 1), z0 = ledge.z - ((ledge.d - 1) >> 1);
    const cells: number[] = [];
    for (let x = x0; x < x0 + ledge.w; x++) for (let z = z0; z < z0 + ledge.d; z++) cells.push(w.idx(x, ledge.y - 1, z));
    ctx.protect(cells, m.id);
    mind.holding = true;
  }
  return true;
};

/** Help: it climbs to the Sunning Ledge and stays by the lion (the machine adds its hits); at most two at once. */
const helpHelp: MinionRule = (m, ctx) => {
  const d = ctx.deity;
  if (!d) return false;
  const near = (a: SkyActor) => Math.hypot(a.body.x - d.body.x, a.body.z - d.body.z) <= HELP_RANGE && Math.abs(a.body.y - d.body.y) <= d.body.h + HELP_RANGE;
  const helping = ctx.others.filter(a => a.side === 'ally' && near(a)).length;
  if (!near(m) && helping >= HELPERS) return false;
  const seat = ctx.plan.seat;
  const next = nextToward(m, ctx, seat) ?? seat;
  ctx.moveTo(m, next);
  return true;
};

// ───────────────────────── the gait and the model ─────────────────────────

/** Keeps low and stalks, bounding up a ledge of up to 2 blocks when the stalk is blocked. */
export const LION_GAIT: Gait = compose(stalk(STALK_SEEN, STALK_UNSEEN, VIEW_CONE), bound(2));
/** The leap of a pounce: a ballistic arc of up to 8 blocks (the gait's `pounce`), landing in `LEAP`. */
const LEAP_GAIT: Gait = compose(pounceGait(8), LION_GAIT);

const T = 1 / 16;
const c = (t: PalToken) => pal(t);

/** A lion of the pride, about one block tall: the same plush as the lion, a smaller mane, a giant head. */
export const LION_MINION_PARTS: readonly ModelPart[] = [
  { name: 'body', size: [8 * T, 6 * T, 10 * T], pos: [0, 5 * T, 0], color: c('plush.lion.felt.base') },
  { name: 'legFL', parent: 'body', size: [3 * T, 3 * T, 3 * T], pos: [-2.5 * T, -4 * T, 3 * T], color: c('plush.lion.felt.dark') },
  { name: 'legFR', parent: 'body', size: [3 * T, 3 * T, 3 * T], pos: [2.5 * T, -4 * T, 3 * T], color: c('plush.lion.felt.dark') },
  { name: 'legHL', parent: 'body', size: [3 * T, 3 * T, 3 * T], pos: [-2.5 * T, -4 * T, -3 * T], color: c('plush.lion.felt.dark') },
  { name: 'legHR', parent: 'body', size: [3 * T, 3 * T, 3 * T], pos: [2.5 * T, -4 * T, -3 * T], color: c('plush.lion.felt.dark') },
  { name: 'tail', parent: 'body', size: [T, T, 6 * T], pos: [0, T, -8 * T], color: c('plush.lion.felt.dark') },
  { name: 'tuft', parent: 'tail', size: [2 * T, 2 * T, 2 * T], pos: [0, 0, -3 * T], color: c('plush.lion.mane.dark') },
  { name: 'head', parent: 'body', size: [10 * T, 9 * T, 8 * T], pos: [0, 6 * T, 5 * T], color: c('plush.lion.felt.base') },
  { name: 'mane', parent: 'head', size: [14 * T, 13 * T, 4 * T], pos: [0, 0, -3 * T], color: c('plush.lion.mane.base') },
  { name: 'muzzle', parent: 'head', size: [6 * T, 3 * T, 2 * T], pos: [0, -2.5 * T, 5 * T], color: c('plush.lion.muzzle') },
  { name: 'nose', parent: 'muzzle', size: [2 * T, T, T], pos: [0, T, 1.5 * T], color: c('plush.lion.nose'), inlay: true },
  { name: 'eyeL', parent: 'head', size: [2 * T, 2 * T, T], pos: [-2.5 * T, T, 4.5 * T], color: c('plush.lion.eye'), inlay: true },
  { name: 'eyeR', parent: 'head', size: [2 * T, 2 * T, T], pos: [2.5 * T, T, 4.5 * T], color: c('plush.lion.eye'), inlay: true },
];

/** What a minion's model shows: its mode, the hits toward turning, and its clock. */
export interface PridePose { mode: string; ratio: number; t: number }

const BODY_Y = 5 * T;

/** Poses a pride lion (pure). Each positive hit lowers the head and slows a blink; at 1 it lifts its tail, happy. */
export function posePride(parts: Parts, p: PridePose) {
  const body = parts.get('body'), head = parts.get('head'), mane = parts.get('mane'), tail = parts.get('tail');
  if (!body || !head || !mane || !tail) return;
  const r = Math.min(1, Math.max(0, p.ratio));
  let bodyY = BODY_Y, sy = 1, tilt = 0.12 * r * 3, maneK = 1, tailPitch = 0.3;
  switch (p.mode) {
    case 'crouch': sy = 0.75; bodyY -= T; tailPitch = 0.8; break;
    case 'roar': maneK = 1.25; tilt = -0.2; break;
    case 'sit': case 'hold': case 'lie': sy = 0.85; bodyY -= T; break;
    default: break;
  }
  if (r >= 1) { tailPitch = -0.6; tilt = 0; }
  body.position.y = bodyY;
  body.scale.set(1, sy, 1);
  head.rotation.x = Math.min(0.45, tilt);
  mane.scale.set(maneK, maneK, 1);
  tail.rotation.set(tailPitch, 0.2 * Math.sin(p.t * 2 * Math.PI * 0.6), 0);
  // the slow blink of a positive hit: the lids close for a moment, slower as the hits gather
  const blink = r > 0 && r < 1 && (p.t % (2.5 - r)) < 0.25 ? 0.2 : 1;
  for (const e of [parts.get('eyeL'), parts.get('eyeR')]) e?.scale.set(1, blink, 1);
}

export const lionMinion: MinionDef = {
  animal: 'lion',
  max: 6, wildMax: 4,
  spawn: { where: 'shade', warning: 1.5, every: 14 },
  hitsToTurn: 4,
  gait: LION_GAIT,
  rules: [busy, pounceRule, roarRule, holderRule, watchedRule, stalkRule],
  ally: [
    { kind: 'clear', rule: clearHelp },
    { kind: 'hold', rule: holdHelp },
    { kind: 'help', rule: helpHelp },
  ],
  model: {
    parts: LION_MINION_PARTS,
    hw: 7 * T,
    h: 1,
    react: (parts, ratio) => {
      const m = ticked;
      ticked = null;
      posePride(parts, { mode: m?.mode ?? 'free', ratio, t: m?.t ?? 0 });
    },
  },
};
