// Boss evasion (issue #314, docs/design/built/bosses/FIGHT-FLOW.md §5, Evasion). A boss shot while it stands
// still answers with a manoeuvre that takes it out of the player's line of fire, and a boss that has
// done nothing for a while repositions on its own: no state of a boss is a dead end. Every boss wraps
// its phases in `evasive` with the manoeuvre that fits it. Choices are seeded (`wobble`), never random.

import { pal } from '../content/palette';
import { wobble } from './behaviours';
import type { Behaviour, Enemy, EnemyCtx, TargetView } from './types';

/**
 * `dash`: it rushes sideways (rolls, surges, steps aside). `hop`: a heavy jump sideways that lands with
 * a harmless thud. `blink`: it is gone for a moment (unhittable) and comes back elsewhere around you,
 * the spot marked while it is gone. `orbit`: it slides around you, keeping its distance (the Shadow).
 */
export type DodgeKind = 'dash' | 'hop' | 'blink' | 'orbit';

export interface Dodge {
  kind: DodgeKind;
  /** Blocks it travels (a blink: the farthest it reappears from you). */
  dist: number;
  /** Seconds of the tell: it stops and its tells flare before it goes. */
  tell?: number;
  /** Seconds the manoeuvre lasts (a hop: its air time; a blink: how long it is gone). */
  seconds?: number;
  /** Seconds before a hit can make it dodge again: it stays hittable between dodges. */
  cooldown?: number;
  /** After the manoeuvre its next move or shot comes at once (default true). */
  counter?: boolean;
  /** Repositions on its own after this many seconds without an action (default IDLE; 0: never). */
  idle?: number;
}

/** Slower than this (blocks a second, smoothed) it is standing still. */
export const STILL = 1;
/** Seconds of its recovery that stay open to hits before a dodge may cut it short. */
export const OPENING = 0.4;
/** Seconds without an action before a boss repositions on its own. */
export const IDLE = 3;
/** The fastest pace the stillness check reads (a charge's speed), so it reads stillness soon after one. */
const MAX_PACE = 12;
/** States in which an attack is under way (moveset windup and act; the older charge's aim and run). */
const BUSY = new Set(['windup', 'act', 'aim', 'run']);
const GRAVITY = 26;
const COLD_BODY = pal('cold.body');
const COLD_WHITE = pal('cold.white');

interface Mind {
  hp: number; lx: number; lz: number; speed: number; timer: number; state: string; since: number;
  idle: number; cool: number; pending: boolean; n: number;
  phase: 'none' | 'tell' | 'go'; t: number; tx: number; tz: number; ox: number; oz: number;
}

const minds = new WeakMap<Enemy, Mind>();

/** True while the boss is in a manoeuvre (its tell or the move itself). */
export function evading(e: Enemy): boolean {
  const m = minds.get(e);
  return !!m && m.phase !== 'none';
}

/** Wraps a boss's behaviour (usually its `phased`) with its manoeuvre. */
export function evasive(inner: Behaviour, d: Dodge): Behaviour {
  const tell = d.tell ?? 0.3, seconds = d.seconds ?? 0.4, idle = d.idle ?? IDLE;
  return {
    name: 'evasive',
    update(e, ctx) {
      const b = e.body;
      let m = minds.get(e);
      if (!m) {
        m = { hp: e.hp, lx: b.x, lz: b.z, speed: 0, timer: e.timer, state: e.state, since: 0, idle: 0, cool: 0, pending: false, n: 0, phase: 'none', t: 0, tx: 0, tz: 0, ox: 0, oz: 0 };
        minds.set(e, m);
      }
      // its pace, smoothed; a jump of more than two blocks in a frame is a teleport of its own (the
      // Grudge surfacing, the Many Faces' swap): it stands where it lands
      const moved = Math.hypot(b.x - m.lx, b.z - m.lz);
      const inst = moved > 2 ? 0 : Math.min(MAX_PACE, moved / Math.max(ctx.dt, 1e-3));
      m.lx = b.x; m.lz = b.z;
      m.speed += (inst - m.speed) * Math.min(1, ctx.dt * 4);
      // a hit moves the bar either way: harm drains it, love fills it (combat/polarity.ts)
      const hit = Math.abs(e.hp - m.hp) > 1e-6;
      m.hp = e.hp;
      m.cool = Math.max(0, m.cool - ctx.dt);
      if (m.phase !== 'none') { step(e, ctx, m, d, tell, seconds); return; }

      const t = ctx.target(e);
      const still = m.speed < STILL;
      if (hit && still && t) m.pending = true;
      if (e.state !== m.state) { m.state = e.state; m.since = 0; } else m.since += ctx.dt;
      // an action resets the idle count: a move under way, walking, or a countdown that restarted (a shot)
      const busy = BUSY.has(e.state);
      const restarted = e.timer > m.timer + 0.2;
      m.timer = e.timer;
      if (busy || !still || restarted || !t) m.idle = 0; else m.idle += ctx.dt;
      const opening = (e.state === 'recover' || e.state === 'stun') && m.since < OPENING;
      const free = !busy && !opening && !e.tags.has('asleep');
      if (t && free && ((m.pending && m.cool <= 0) || (idle > 0 && m.idle >= idle))) { begin(e, ctx, m, d, t, tell); return; }
      inner.update(e, ctx);
    },
  };
}

function begin(e: Enemy, ctx: EnemyCtx, m: Mind, d: Dodge, t: TargetView, tell: number) {
  m.pending = false; m.idle = 0; m.cool = d.cooldown ?? 2.2; m.n++;
  const b = e.body;
  m.ox = b.x; m.oz = b.z;
  let kind = d.kind;
  let dest = choose(e, ctx, m, d, t, kind);
  if (!dest && kind === 'blink') { kind = 'dash'; dest = choose(e, ctx, m, d, t, kind); }
  if (!dest) { m.cool = 0.5; return; }
  [m.tx, m.tz] = dest;
  m.phase = 'tell'; m.t = tell;
  e.wishX = 0; e.wishZ = 0;
  // where a blink brings it back is marked in the pale ramp: it does not hurt (DECISIONS §7.6)
  if (kind === 'blink') ctx.strike(e, { lead: tell + (d.seconds ?? 0.4), live: 0, damage: 0, shape: { kind: 'ring', x: m.tx, y: b.y, z: m.tz, r: b.hw + 0.3, grow: 0, width: 0.3, height: 1 } });
  kinds.set(e, kind);
}

/** The manoeuvre a boss is making now (a blink with nowhere to land becomes a dash). */
const kinds = new WeakMap<Enemy, DodgeKind>();

/**
 * Where it goes: the candidate, kept inside the room, that leaves the line from you through it by the
 * most, with a seeded nudge so it does not always pick the same side. A blink lands only on safe floor,
 * never closer than three blocks to you.
 */
function choose(e: Enemy, ctx: EnemyCtx, m: Mind, d: Dodge, t: TargetView, kind: DodgeKind): [number, number] | null {
  const b = e.body;
  const [x0, z0, x1, z1] = ctx.bounds(e);
  const pad = b.hw + 0.3;
  const clampX = (x: number) => Math.min(x1 + 1 - pad, Math.max(x0 + pad, x));
  const clampZ = (z: number) => Math.min(z1 + 1 - pad, Math.max(z0 + pad, z));
  const vx = b.x - t.x, vz = b.z - t.z, r = Math.hypot(vx, vz) || 1;
  const ux = vx / r, uz = vz / r;
  const side = (x: number, z: number) => Math.abs((x - t.x) * uz - (z - t.z) * ux);
  const out: [number, number, number][] = [];
  const angles = [Math.PI / 2, Math.PI / 3, (2 * Math.PI) / 3];
  angles.forEach((a, k) => {
    for (const s of [1, -1]) {
      let x: number, z: number;
      if (kind === 'blink' || kind === 'orbit') {
        // around you: a blink at its distance (4 to `dist` blocks), an orbit along its circle
        const rad = kind === 'blink' ? Math.min(d.dist, Math.max(4, r)) : r;
        const turn = kind === 'blink' ? s * a : s * Math.min(Math.PI / 2, d.dist / r) * (k === 0 ? 1 : k === 1 ? 0.7 : 0.45);
        const c = Math.cos(turn), sn = Math.sin(turn);
        x = t.x + (ux * c - uz * sn) * rad; z = t.z + (ux * sn + uz * c) * rad;
      } else {
        // sideways from the line of fire, straight or slanting toward or away from you
        const c = Math.cos(s * a), sn = Math.sin(s * a);
        x = b.x + (ux * c - uz * sn) * d.dist; z = b.z + (ux * sn + uz * c) * d.dist;
      }
      x = clampX(x); z = clampZ(z);
      if (kind === 'blink' && (Math.hypot(x - t.x, z - t.z) < 3 || !ctx.safe(e, x, b.y, z))) continue;
      const score = side(x, z) - (kind === 'blink' ? 0 : ctx.safe(e, x, b.y, z) ? 0 : 2) + wobble(e.id, m.n, 30 + k * 2 + (s > 0 ? 0 : 1)) * 0.6;
      out.push([x, z, score]);
    }
  });
  if (!out.length) return null;
  out.sort((p, q) => q[2] - p[2]);
  const [x, z] = out[0];
  return side(x, z) < b.hw * 0.5 + 0.3 ? null : [x, z];
}

function step(e: Enemy, ctx: EnemyCtx, m: Mind, d: Dodge, tell: number, seconds: number) {
  const b = e.body, kind = kinds.get(e) ?? d.kind;
  m.t -= ctx.dt;
  if (m.phase === 'tell') {
    // it stops and its tells flare: the read before it goes
    e.wishX = 0; e.wishZ = 0;
    e.pulse = Math.min(1, 1 - m.t / tell);
    if (m.t > 0) return;
    m.phase = 'go'; m.t = seconds; e.pulse = 0.4;
    if (kind === 'blink') {
      ctx.cue(e, 'hide');
      ctx.fx(b.x, b.y + b.h * 0.5, b.z, COLD_BODY, 14, 2.5, 0.09);
      ctx.hide(e, true);
    } else {
      ctx.cue(e, 'leap');
      ctx.fx(b.x, b.y + 0.1, b.z, COLD_BODY, 8, 2.5, 0.08);
      if (kind === 'hop') { b.vy = GRAVITY * seconds / 2; b.vx = (m.tx - b.x) / seconds; b.vz = (m.tz - b.z) / seconds; }
    }
    return;
  }
  const used = seconds - m.t;
  if (kind === 'blink') {
    e.wishX = 0; e.wishZ = 0;
    if (m.t > 0) return;
    b.x = m.tx; b.z = m.tz; b.vx = 0; b.vz = 0;
    m.lx = b.x; m.lz = b.z;
    ctx.hide(e, false);
    ctx.cue(e, 'hide');
    ctx.fx(b.x, b.y + b.h * 0.5, b.z, COLD_WHITE, 14, 2.5, 0.09);
    return end(e, m, d);
  }
  const dx = m.tx - b.x, dz = m.tz - b.z, left = Math.hypot(dx, dz);
  const pace = left / Math.max(0.08, m.t);
  if (left > 0.01) { e.wishX = dx / left * pace / e.speed; e.wishZ = dz / left * pace / e.speed; }
  if (Math.floor(used * 20) !== Math.floor((used - ctx.dt) * 20)) ctx.fx(b.x, b.y + 0.1, b.z, COLD_BODY, 2, 1.2, 0.07);
  if (kind === 'hop') {
    if ((b.onGround && used > seconds * 0.8) || used > seconds + 0.6 || left < 0.15) {
      ctx.quake(e, b.x, b.y, b.z, 0.2);
      return end(e, m, d);
    }
    return;
  }
  // dash and orbit: done when there, out of time, or held by a wall
  const held = used > 0.2 && m.speed < 0.3;
  if (left < 0.25 || m.t <= -0.3 || held) end(e, m, d);
}

function end(e: Enemy, m: Mind, d: Dodge) {
  m.phase = 'none'; m.idle = 0; m.since = 0;
  e.wishX = 0; e.wishZ = 0; e.pulse = 0;
  if (d.counter === false) return;
  // it answers: the next move or shot comes within a beat (a move cut short by the dodge is dropped)
  if (e.state !== 'move') { e.state = 'move'; e.move = -1; }
  e.timer = Math.min(e.timer, 0.25);
  m.state = e.state; m.timer = e.timer;
}
