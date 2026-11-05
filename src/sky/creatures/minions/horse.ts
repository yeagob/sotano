// The horse minions: the herd (docs/design/not-built/sky/guardians/HORSE.md B5, docs/design/not-built/sky/minions/README.md).
//
// A horse of the herd gallops a wide loop round the meadow, once a loop comes back at the player and turns away
// at 3 blocks, and grazes once a loop. The horse sends it to kick (deities/horse.ts `SENT`); it also kicks a player
// who stands behind it within 2 blocks: it turns its back, gathers its hind legs, lifts its tail (the floor's
// telegraph), then kicks along the shown arc. A block placed or a jump landed within 3 blocks startles it: it bolts
// half a loop away and never kicks while it bolts. It never leaves the floor, and it comes back when the deity
// rallies. Turned, it clears the sent ones, carries the player 8 blocks, holds a fading segment, or grazes beside
// the deity (which gentles it). Nothing here hurts: a kick is a knockback with its telegraph.
//
// Rules receive no dt: timers here read the host's clock, so they are deterministic under a fixed dt.

import { pal } from '../../../content/palette';
import { TX, type ModelPart } from '../../../enemies/types';
import { cellsOfTags } from '../../hindrances/fading-platforms';
import { KICK_SECONDS } from '../../hindrances/knockback';
import { HOLDER } from '../../render/creature-view';
import { ExceptionKind, TELEGRAPH, type MinionCtx, type MinionDef, type MinionRule, type Parts, type Place, type SkyActor, type SkyWorldApi } from '../../types';
import { PUSH_PER_BLOCK, SENT, feetOf } from '../deities/horse';
import { gallopLoop } from '../gaits';

/** Blocks a second at a gallop, and the distance at which a passing horse turns away from the player (B5). */
export const HERD_SPEED = 6;
export const TURN_AT = 3;
/** Its errands (a sent kick, an ally's help) run straight at their mark: the turn-away is the loop's pass only. */
const STRAIGHT = gallopLoop(HERD_SPEED, 0);
/** The loop round the meadow: its radius about the floor's centre and its points (clear of every paddock). */
export const LOOP_RADIUS = 27;
export const LOOP_POINTS = 12;
/** Seconds of grazing, once each loop. */
export const GRAZE = 3;
/** A kick: the player behind it within this distance; its push in blocks; seconds before it kicks again. */
export const KICK_REACH = 2;
export const KICK_PUSH = 2.5;
export const KICK_REST = 4;
/** A block placed or a jump landed within this distance startles it. */
export const STARTLE_REACH = 3;
/** A sent minion gives up after this long. */
export const SENT_FOR = 10;
/** The carry: 8 blocks forward, once every 10 s (B5, What an ally does). */
export const CARRY = 8;
export const CARRY_EVERY = 10;
/** An ally holds a fading segment the player is within this distance of. */
const HOLD_NEAR = 5;
/** An ally this close to the deity (horizontally) grazes beside it; the deity's brain counts the same reach. */
export const HELP_NEAR = 3.5;
/** Owner ids for an ally's protected cells: positive, far from the hindrances' negative owners. */
export const HOLD_OWNER = 7_000_000;

type Mode = 'run' | 'graze' | 'kick' | 'stand' | 'carry';

interface Mind {
  actor: SkyActor;
  /** The loop point it runs to, and the ones at which it grazes and passes this loop. */
  next: number; grazeAt: number; passAt: number;
  grazeUntil: number; passUntil: number;
  kickUntil: number; kickReady: number;
  bolt: Place | null;
  placedNear: number; scanAt: number;
  wasOnGround: boolean;
  carryReady: number; carryUntil: number; carryTo: Place | null;
  holding: number;
  yaw: number; mode: Mode;
  stride: number; lastT: number;
}

const MINDS = new Map<number, Mind>();

const worldOf = (ctx: MinionCtx): SkyWorldApi | null => {
  try { return ctx.host.world?.() ?? null; } catch { return null; }
};

function mindOf(m: SkyActor, ctx: MinionCtx): Mind {
  let s = MINDS.get(m.id);
  if (!s || s.actor !== m) {
    const now = ctx.host.time();
    s = {
      actor: m, next: nearestLoop(m, ctx), grazeAt: (m.id * 5) % LOOP_POINTS, passAt: (m.id * 5 + 6) % LOOP_POINTS,
      grazeUntil: -Infinity, passUntil: -Infinity, kickUntil: -Infinity, kickReady: now,
      bolt: null, placedNear: -1, scanAt: -Infinity, wasOnGround: true,
      carryReady: now, carryUntil: -Infinity, carryTo: null, holding: -1,
      yaw: 0, mode: 'run', stride: 0, lastT: now,
    };
    MINDS.set(m.id, s);
  }
  return s;
}

/** The centre of the meadow: the middle of the paddocks (or the seat). */
function centreOf(ctx: MinionCtx): { x: number; z: number } {
  const ps = ctx.plan.extra?.paddocks ?? [ctx.plan.seat];
  let x = 0, z = 0;
  for (const p of ps) { x += p.x + 0.5; z += p.z + 0.5; }
  return { x: x / ps.length, z: z / ps.length };
}

/** A loop point as a place on the meadow (negative ids: never a node of the floor graph). */
export function loopPlace(ctx: MinionCtx, k: number): Place {
  const i = ((k % LOOP_POINTS) + LOOP_POINTS) % LOOP_POINTS;
  const c = centreOf(ctx), a = i * 2 * Math.PI / LOOP_POINTS;
  return { id: -1 - i, kind: 'ground', x: Math.floor(c.x + Math.cos(a) * LOOP_RADIUS), y: ctx.plan.y0, z: Math.floor(c.z + Math.sin(a) * LOOP_RADIUS), w: 1, d: 1, tag: 0 };
}

function nearestLoop(m: SkyActor, ctx: MinionCtx): number {
  let best = 0, bd = Infinity;
  for (let k = 0; k < LOOP_POINTS; k++) {
    const p = loopPlace(ctx, k), d = Math.hypot(p.x + 0.5 - m.body.x, p.z + 0.5 - m.body.z);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

/** A place at a point (the player, another minion): its id names what it follows, so the stuck guard counts it once. */
const pointPlace = (id: number, x: number, y: number, z: number): Place =>
  ({ id: -100 - id, kind: 'ground', x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), w: 1, d: 1, tag: 0 });

const flat = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * The next mark of a long run at a point: at most 4 blocks ahead on the line to it. Its id changes as the run
 * closes in, so the stuck guard (6 s on one mark) watches each leg, not the whole errand: a horse that stops
 * closing in is still caught.
 */
function legTo(m: SkyActor, key: number, x: number, y: number, z: number): Place {
  const b = m.body, d = flat(b, { x, z });
  const k = Math.min(1, 4 / Math.max(1e-6, d));
  return { ...pointPlace(key * 64 + Math.floor(d / 4), b.x + (x - b.x) * k, y, b.z + (z - b.z) * k) };
}

/** Turns toward its motion while it moves. */
function face(s: Mind) {
  const b = s.actor.body;
  if (Math.hypot(b.vx, b.vz) > 0.3) s.yaw = Math.atan2(b.vx, b.vz);
}

function stand(m: SkyActor) { m.body.vx = 0; m.body.vz = 0; }

/** Counts the blocks the player placed within STARTLE_REACH. */
function placedNear(m: SkyActor, ctx: MinionCtx): number {
  const w = worldOf(ctx);
  if (!w) return 0;
  const b = m.body, r = STARTLE_REACH;
  let n = 0;
  for (let y = Math.floor(b.y) - 1; y <= Math.floor(b.y) + 2; y++)
    for (let z = Math.floor(b.z) - r; z <= Math.floor(b.z) + r; z++)
      for (let x = Math.floor(b.x) - r; x <= Math.floor(b.x) + r; x++)
        if (w.inside(x, y, z) && w.kindAt(w.idx(x, y, z)) === ExceptionKind.Placed) n++;
  return n;
}

// ───────────────────────── the wild herd's rules, in the order of B5 ─────────────────────────

/** Rule 4 (part): it comes back to the herd when the deity rallies (no bolt, no errand). It never acts by itself. */
const rally: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx), now = ctx.host.time();
  s.stride += Math.hypot(m.body.vx, m.body.vz) * Math.max(0, now - s.lastT);
  s.lastT = now;
  // the meadow's places name the cell they stand on: a body set into that cell steps up onto it
  const w = worldOf(ctx), b = m.body;
  if (w && w.solid(Math.floor(b.x), Math.floor(b.y), Math.floor(b.z)) && !w.solid(Math.floor(b.x), Math.floor(b.y) + 1, Math.floor(b.z))) {
    b.y = Math.floor(b.y) + 1;
    b.vy = 0;
  }
  if (ctx.deity?.state === 'Rallying') { s.bolt = null; SENT.delete(m.id); }
  // an errand that ran too long ends: it goes back to its loop
  const sent = SENT.get(m.id);
  if (sent !== undefined && now - sent > SENT_FOR) SENT.delete(m.id);
  return false;
};

/** A kick under way: it stands, hind legs gathered, until the kick has gone. */
const kicking: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx);
  if (ctx.host.time() >= s.kickUntil) return false;
  s.mode = 'kick';
  stand(m);
  return true;
};

/** Rule 3: a block placed or a jump landed within 3 blocks makes it bolt half a loop away. A bolting horse never kicks. */
const startle: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx), now = ctx.host.time();
  const pb = ctx.host.player().body;
  const landed = !s.wasOnGround && pb.onGround && flat(pb, m.body) <= STARTLE_REACH;
  s.wasOnGround = pb.onGround;
  if (now - s.scanAt >= 0.25) {
    s.scanAt = now;
    const n = placedNear(m, ctx);
    const more = s.placedNear >= 0 && n > s.placedNear;
    s.placedNear = n;
    if (more && !s.bolt) s.bolt = loopPlace(ctx, s.next + LOOP_POINTS / 2);
  }
  if (landed && !s.bolt) s.bolt = loopPlace(ctx, s.next + LOOP_POINTS / 2);
  if (!s.bolt) return false;
  SENT.delete(m.id);
  s.mode = 'run';
  if (ctx.moveTo(m, s.bolt)) { s.next = (-1 - s.bolt.id + 1) % LOOP_POINTS; s.bolt = null; }
  face(s);
  return true;
};

/** Rule 2: a sent minion within reach, or a player behind it within 2 blocks: it turns its back and kicks. */
const kick: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx), now = ctx.host.time();
  if (now < s.kickReady) return false;
  const b = m.body, pb = ctx.host.player().body;
  const dx = pb.x - b.x, dz = pb.z - b.z, d = Math.hypot(dx, dz);
  if (d > KICK_REACH || Math.abs(pb.y - b.y) > 1.5) return false;
  const behind = d > 1e-6 && (dx * Math.sin(s.yaw) + dz * Math.cos(s.yaw)) / d < -0.3;
  if (!SENT.has(m.id) && !behind) return false;
  // it turns its back to the player: the kick goes out behind it, along the shown cone
  s.yaw = Math.atan2(-dx, -dz);
  const dir = d > 1e-6 ? { x: dx / d, y: 0, z: dz / d } : { x: 1, y: 0, z: 0 };
  ctx.hinder('knockback', { from: { x: b.x, y: b.y, z: b.z }, shape: 'cone', radius: KICK_REACH + 0.5, dir, strength: KICK_PUSH * PUSH_PER_BLOCK });
  ctx.host.cue('horse.kick', b.x, b.y + 0.5, b.z);
  s.kickUntil = now + TELEGRAPH[4] + KICK_SECONDS;
  s.kickReady = now + KICK_REST;
  // a sent minion kicks once and returns to its loop
  SENT.delete(m.id);
  stand(m);
  s.mode = 'kick';
  return true;
};

/** The errand: a sent minion breaks off its loop and gallops to the player. */
const errand: MinionRule = (m, ctx) => {
  if (!SENT.has(m.id)) return false;
  const s = mindOf(m, ctx), pb = ctx.host.player().body;
  s.mode = 'run';
  ctx.moveTo(m, legTo(m, m.id, pb.x, pb.y, pb.z), STRAIGHT);
  face(s);
  return true;
};

/** Grazes for 3 s once each loop, standing still on the meadow (rule 5: never on a segment the player needs). */
const graze: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx);
  if (ctx.host.time() >= s.grazeUntil) return false;
  s.mode = 'graze';
  stand(m);
  return true;
};

/** Once a loop it comes back toward the player at speed and turns away at 3 blocks (the gait's turn, rule 1). */
const pass: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx), now = ctx.host.time();
  if (now >= s.passUntil) return false;
  const pb = ctx.host.player().body;
  if (flat(pb, m.body) <= TURN_AT + 1) { s.passUntil = -Infinity; return false; }
  s.mode = 'run';
  ctx.moveTo(m, pointPlace(m.id, pb.x, pb.y, pb.z));
  face(s);
  return true;
};

/** The loop: point after point round the meadow; at its graze point it grazes, at its pass point it comes at the player. */
const loop: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx), now = ctx.host.time();
  s.mode = 'run';
  if (ctx.moveTo(m, loopPlace(ctx, s.next))) {
    const k = s.next;
    s.next = (s.next + 1) % LOOP_POINTS;
    if (k === s.grazeAt) s.grazeUntil = now + GRAZE;
    const pb = ctx.host.player().body;
    if (k === s.passAt && flat(pb, m.body) <= 16) s.passUntil = now + 4;
  }
  face(s);
  return true;
};

// ───────────────────────── what an ally does ─────────────────────────

/** Clear: it runs at a sent minion and turns it away before it kicks. */
const clear: MinionRule = (m, ctx) => {
  const sent = ctx.others.find(o => o.side === 'wild' && SENT.has(o.id) && flat(o.body, m.body) <= 12);
  if (!sent) return false;
  const s = mindOf(m, ctx);
  s.mode = 'run';
  if (flat(sent.body, m.body) <= 1.5) {
    SENT.delete(sent.id);
    const o = MINDS.get(sent.id);
    if (o) o.bolt = loopPlace(ctx, o.next + LOOP_POINTS / 2);
    ctx.host.fx('puff', sent.body.x, sent.body.y + 0.5, sent.body.z, 4);
    return true;
  }
  ctx.moveTo(m, pointPlace(sent.id, sent.body.x, sent.body.y, sent.body.z), STRAIGHT);
  face(s);
  return true;
};

/** Carry: a player who walks onto its back is carried 8 blocks forward, once every 10 s. */
const carry: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx), now = ctx.host.time();
  const b = m.body, pl = ctx.host.player(), pb = pl.body;
  if (now < s.carryUntil && s.carryTo) {
    s.mode = 'carry';
    ctx.moveTo(m, s.carryTo, STRAIGHT);
    face(s);
    return true;
  }
  s.carryTo = null;
  const onBack = flat(pb, b) <= b.hw + 0.2 && pb.y >= b.y + b.h - 0.6 && pb.y <= b.y + b.h + 0.6;
  if (!onBack || now < s.carryReady) return false;
  const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
  const to = { x: b.x + fx * CARRY, y: pb.y, z: b.z + fz * CARRY };
  const seconds = CARRY / HERD_SPEED;
  // the game holds the input and carries the body (SkyPlayer.carry); the player's own jump is never done for them
  pl.carry(to, seconds);
  s.carryTo = pointPlace(m.id + 1_000_000, to.x, b.y, to.z);
  s.carryUntil = now + seconds;
  s.carryReady = now + CARRY_EVERY;
  ctx.host.cue('horse.trot', b.x, b.y, b.z);
  return true;
};

/** Hold: it stands at a fading segment near the player; while it stays, that segment does not fade. */
const hold: MinionRule = (m, ctx) => {
  const s = mindOf(m, ctx), pb = ctx.host.player().body;
  const fixed = new Map(ctx.plan.platforms.map(t => [t.tag, t.fixed] as const));
  const mid = (p: Place) => ({ x: p.x + 0.5, z: p.z + 0.5 });
  const seg = ctx.plan.graph.places
    .filter(p => p.kind === 'segment' && fixed.get(p.tag) === false && flat(mid(p), pb) <= HOLD_NEAR)
    .sort((p, q) => flat(mid(p), pb) - flat(mid(q), pb) || p.id - q.id)[0];
  const owner = HOLD_OWNER + m.id;
  if (s.holding >= 0 && (!seg || s.holding !== seg.tag)) { ctx.release(owner); s.holding = -1; }
  if (!seg) return false;
  const w = worldOf(ctx);
  s.mode = 'run';
  ctx.moveTo(m, pointPlace(seg.id + 2_000_000, seg.x + 0.5, w ? feetOf(w, seg) : seg.y, seg.z + 0.5), STRAIGHT);
  face(s);
  if (s.holding < 0 && flat(m.body, mid(seg)) <= 2.5 && w) {
    ctx.protect(cellsOfTags(w, [seg.tag]), owner);
    s.holding = seg.tag;
  }
  return true;
};

/** Help: it reaches the deity and grazes beside it (the deity's brain gentles the horse every 10 s). */
const help: MinionRule = (m, ctx) => {
  const d = ctx.deity;
  if (!d) return false;
  const s = mindOf(m, ctx);
  // beside the deity: at the foot of its paddock when it stands on one (a paddock is 5 × 5)
  if (flat(d.body, m.body) <= HELP_NEAR) { s.mode = 'graze'; stand(m); return true; }
  s.mode = 'run';
  ctx.moveTo(m, legTo(m, d.id + 3_000_000, d.body.x, d.body.y, d.body.z), STRAIGHT);
  face(s);
  return true;
};

// ───────────────────────── the plush model ─────────────────────────

const c = {
  coat: pal('plush.horse.herd.base'), dark: pal('plush.horse.herd.dark'), hi: pal('plush.horse.herd.hi'),
  mane: pal('plush.horse.mane'), eye: pal('plush.horse.eye'),
};
const T = (n: number) => n * TX;

/** A foal-sized plush of the herd: a small body under a head 2.2 times its width, about 1.3 blocks to the ears. */
export const HORSE_MINION_PARTS: readonly ModelPart[] = [
  { size: [T(6), T(5), T(8)], pos: [0, T(5.5), 0], color: c.coat, name: 'body' },
  { size: [T(2), T(3), T(2)], pos: [T(-2), T(1.5), T(3)], color: c.dark, name: 'legFL' },
  { size: [T(2), T(3), T(2)], pos: [T(2), T(1.5), T(3)], color: c.dark, name: 'legFR' },
  { size: [T(2), T(3), T(2)], pos: [T(-2), T(1.5), T(-3)], color: c.dark, name: 'legBL' },
  { size: [T(2), T(3), T(2)], pos: [T(2), T(1.5), T(-3)], color: c.dark, name: 'legBR' },
  { size: [T(2), T(5), T(2)], pos: [0, T(5), T(-5)], color: c.mane, name: 'tail', tilt: 0.5 },
  { size: [T(13), T(10), T(12)], pos: [0, T(12), T(3)], color: c.coat, name: 'head' },
  { size: [T(9), T(6), T(4)], pos: [0, T(-2), T(7)], color: c.hi, parent: 'head', name: 'muzzle' },
  { size: [T(3), T(3), T(1)], pos: [T(-3.5), T(1.5), T(6.5)], color: c.eye, parent: 'head', inlay: true },
  { size: [T(3), T(3), T(1)], pos: [T(3.5), T(1.5), T(6.5)], color: c.eye, parent: 'head', inlay: true },
  { size: [T(2), T(4), T(2)], pos: [T(-4), T(6.5), 0], color: c.coat, parent: 'head', name: 'earL' },
  { size: [T(2), T(4), T(2)], pos: [T(4), T(6.5), 0], color: c.coat, parent: 'head', name: 'earR' },
  { size: [T(3), T(3), T(12)], pos: [0, T(6), T(-1)], color: c.mane, parent: 'head', name: 'mane' },
];

export interface HerdPose { yaw: number; mode: Mode; stride: number; ratio: number; ally: boolean; t: number }

const step12 = (t: number) => Math.floor(t * 12) / 12;

/** Poses a herd model: the gallop, the graze (head down), the kick (hind legs back, tail up), the soft reaction to hits. */
export function poseHerd(parts: Parts, root: { rotation: { y: number }; position: { y: number } } | null, p: HerdPose) {
  const g = (n: string) => parts.get(n);
  if (root) { root.rotation.y = p.yaw; root.position.y = 0; }
  const run = p.mode === 'run' || p.mode === 'carry';
  const sw = run ? Math.sin(step12(p.stride) * 2.4) * 0.7 : 0;
  const kick = p.mode === 'kick';
  g('legFL')?.rotation.set(sw, 0, 0);
  g('legFR')?.rotation.set(-sw, 0, 0);
  g('legBL')?.rotation.set(kick ? -0.9 : -sw, 0, 0);
  g('legBR')?.rotation.set(kick ? -0.9 : sw, 0, 0);
  // the gathered hind legs and the lifted tail are the kick's tell
  g('tail')?.rotation.set(kick ? -0.4 : 0.5, 0, 0);
  const head = g('head');
  if (head) head.rotation.x = p.mode === 'graze' ? 0.5 : p.ally ? 0.15 * Math.sin(step12(p.t) * 4) : 0;
  // each positive hit turns an ear toward the player; turned, it gives a small happy hop
  g('earL')?.rotation.set(-0.5 * Math.min(1, p.ratio), 0, 0.1);
  g('earR')?.rotation.set(0, 0, -0.1);
  if (root && p.ally && p.ratio >= 1) root.position.y = Math.max(0, Math.sin(step12(p.t) * 3)) * 0.06;
}

function mindAt(parts: Parts): Mind | null {
  const h = parts.get(HOLDER);
  if (!h) return null;
  let best: Mind | null = null, bd = 1.5;
  for (const s of MINDS.values()) {
    const b = s.actor.body, d = Math.hypot(b.x - h.position.x, b.y - h.position.y, b.z - h.position.z);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

// ───────────────────────── the minion ─────────────────────────

export const horseMinion: MinionDef = {
  animal: 'horse',
  max: 5, wildMax: 3,
  // from the paddock gate at the edge of the meadow: a 1.5 s warning, one every 15 s while fewer than 3 are wild
  spawn: { where: 'gate', warning: 1.5, every: 15 },
  hitsToTurn: 4,
  gait: gallopLoop(HERD_SPEED, TURN_AT),
  rules: [rally, kicking, startle, kick, errand, graze, pass, loop],
  ally: [
    { kind: 'clear', rule: clear },
    { kind: 'carry', rule: carry },
    { kind: 'hold', rule: hold },
    { kind: 'help', rule: help },
  ],
  model: {
    parts: HORSE_MINION_PARTS, hw: 0.4, h: 1.3,
    react: (parts, ratio) => {
      const s = mindAt(parts);
      if (!s) return;
      const a = s.actor;
      const mode: Mode = a.state === 'Reacting' || a.state === 'Calm' || a.state === 'Spawning' ? 'stand' : s.mode;
      poseHerd(parts, parts.get(HOLDER)?.children[0] ?? null, { yaw: s.yaw, mode, stride: s.stride, ratio, ally: a.side === 'ally', t: a.t });
    },
  },
};

/** The mind of a herd minion, for tests. */
export const herdMind = (id: number) => MINDS.get(id);
