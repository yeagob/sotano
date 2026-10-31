// Boss movesets (docs/design/BESTIARY.md §6.6). A boss is never idle: between attacks it walks its
// gait (stalks you, keeps its distance, hovers over you), and every few seconds it picks the next
// move of its phase. Each move has three beats, like Isaac's bosses: a windup (it stops, its tells
// brighten, a growl, and the attack's shape is drawn on the floor), the act, and a recovery (the
// opening to hit it). Phases are `phased` (behaviours.ts) with one moveset each.
//
// Choices are seeded by the boss's id and its move count (`wobble`), never by Math.random.

import { pal } from '../content/palette';
import { wobble } from './behaviours';
import type { Behaviour, Enemy, EnemyCtx, TargetView } from './types';

export interface Move {
  name: string;
  /** Seconds of telegraph before it acts (≥ 0.4: DECISIONS §8.5). */
  windup: number;
  /** Seconds it stands spent after the act: the opening. */
  recover: number;
  /** Chosen only when the target is at least / at most this far (blocks). */
  min?: number;
  max?: number;
  /** Keep walking its gait during the windup (by default it stops: the stop is part of the telegraph). */
  walk?: boolean;
  /** Once, when the windup starts: aim, and draw what it will do. */
  aim?(e: Enemy, ctx: EnemyCtx, t: TargetView): void;
  /** Once, when the windup ends. */
  act(e: Enemy, ctx: EnemyCtx, t: TargetView): void;
  /** Every frame after the act until it returns true (`time`: seconds since the act). */
  hold?(e: Enemy, ctx: EnemyCtx, t: TargetView | null, time: number): boolean;
}

export type Gait =
  | { kind: 'stalk'; near?: number }
  | { kind: 'keep'; dist: number }
  | { kind: 'hover'; height: number }
  | { kind: 'still' };

/** Gravity a leaping boss falls under (entities/enemies.ts). */
const GRAVITY = 26;
// Particles and decoration are pale blue-white; damage is red (issue #47, see attacks.ts markTint).
const COLD_WHITE = pal('cold.white');
const COLD_BODY = pal('cold.body');

/** Where the target will be in `s` seconds, if it keeps running (bosses read your movement). */
export function ahead(t: TargetView, s: number): [number, number] {
  return [t.x + (t.vx ?? 0) * s, t.z + (t.vz ?? 0) * s];
}

/** The last move each boss made (it never repeats one while it has another). */
const last = new WeakMap<Enemy, number>();

/** A phase of a boss: a gait between moves, and a rotation of moves picked by its seed. */
export function moveset(opt: { gait: Gait; pace: [number, number]; moves: Move[] }): Behaviour {
  const rest = (e: Enemy) => opt.pace[0] + wobble(e.id, e.seq, 5) * (opt.pace[1] - opt.pace[0]);
  return {
    name: 'moveset',
    update(e, ctx) {
      const t = ctx.target(e);
      const g = opt.gait;
      if (g.kind === 'hover' && e.flyY < 0) e.flyY = e.body.y + g.height;
      const m = e.move >= 0 ? opt.moves[e.move] : undefined;
      if (m && e.state === 'windup') {
        e.timer -= ctx.dt;
        if (m.walk && t) walk(e, ctx, g, t); else { e.wishX = 0; e.wishZ = 0; }
        e.pulse = Math.min(1, 1 - e.timer / m.windup);
        if (e.timer > 0) return;
        if (!t) { e.state = 'move'; e.timer = rest(e); e.move = -1; e.pulse = 0; return; }
        m.act(e, ctx, t);
        e.state = 'act'; e.act = 0; e.pulse = 0;
        return;
      }
      if (m && e.state === 'act') {
        e.act += ctx.dt;
        if (!m.hold || m.hold(e, ctx, t, e.act)) { e.state = 'recover'; e.timer = m.recover; e.wishX = 0; e.wishZ = 0; }
        return;
      }
      if (m && e.state === 'recover') {
        e.wishX = 0; e.wishZ = 0; e.pulse = 0;
        e.timer -= ctx.dt;
        if (e.timer <= 0) { e.state = 'move'; e.timer = rest(e); e.move = -1; }
        return;
      }
      // between moves: walk the gait, and pick the next move when the rest is over
      e.move = -1;
      if (!t) { e.wishX = 0; e.wishZ = 0; e.pulse = 0; return; }
      walk(e, ctx, g, t);
      e.pulse = 0.1;
      e.timer -= ctx.dt;
      if (e.timer > 0) return;
      const d = ctx.dist(e, t);
      const fits = opt.moves.map((_, i) => i).filter(i => d >= (opt.moves[i].min ?? 0) && d <= (opt.moves[i].max ?? Infinity));
      const pool = fits.length ? fits : opt.moves.map((_, i) => i);
      let pick = pool[Math.floor(wobble(e.id, e.seq, 7) * pool.length) % pool.length];
      // never the same move twice in a row when there is another
      if (pool.length > 1 && pick === last.get(e)) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
      e.seq++;
      last.set(e, pick);
      e.move = pick;
      e.state = 'windup';
      e.timer = opt.moves[pick].windup;
      ctx.cue(e, 'windup');
      opt.moves[pick].aim?.(e, ctx, t);
    },
  };
}

/** Where each flying boss stood when it first rose: its heights are measured from there. */
const ground = new WeakMap<Enemy, number>();

/** Flies at `height` blocks over the floor it rose from (a phase can bring it lower: the Downpour). */
export function altitude(height: number, inner: Behaviour): Behaviour {
  return {
    name: inner.name,
    update(e, ctx) {
      if (!ground.has(e)) ground.set(e, e.body.y);
      e.flyY = ground.get(e)! + height;
      inner.update(e, ctx);
    },
  };
}

function walk(e: Enemy, ctx: EnemyCtx, g: Gait, t: TargetView) {
  const d = ctx.dist(e, t);
  if (g.kind === 'still') { e.wishX = 0; e.wishZ = 0; return; }
  const [dx, dz] = ctx.toward(e, t);
  if (g.kind === 'stalk') {
    const k = d > (g.near ?? 0.8) ? 1 : 0;
    e.wishX = dx * k; e.wishZ = dz * k;
  } else if (g.kind === 'hover') {
    const k = d > 0.6 ? Math.min(1, d / 3) : 0;
    e.wishX = dx * k; e.wishZ = dz * k;
  } else {
    // keep its distance, circling you in between
    const side = wobble(e.id, e.seq, 3) < 0.5 ? 1 : -1;
    if (d < g.dist - 1.5) { e.wishX = -dx; e.wishZ = -dz; }
    else if (d > g.dist + 2) { e.wishX = dx; e.wishZ = dz; }
    else { e.wishX = -dz * side * 0.8; e.wishZ = dx * side * 0.8; }
  }
}

/** Where a ray from (x, z) along (ux, uz) leaves the room. */
function toEdge(ctx: EnemyCtx, e: Enemy, x: number, z: number, ux: number, uz: number): [number, number] {
  const [x0, z0, x1, z1] = ctx.bounds(e);
  let s = 60;
  if (ux > 1e-3) s = Math.min(s, (x1 + 0.5 - x) / ux); else if (ux < -1e-3) s = Math.min(s, (x0 + 0.5 - x) / ux);
  if (uz > 1e-3) s = Math.min(s, (z1 + 0.5 - z) / uz); else if (uz < -1e-3) s = Math.min(s, (z0 + 0.5 - z) / uz);
  return [x + ux * Math.max(0, s), z + uz * Math.max(0, s)];
}

/** Per-boss state a move keeps while it acts (bounces left, volleys fired). */
const left = new WeakMap<Enemy, number>();
/** When the current run of a charge began (a bounce starts a new one). */
const runFrom = new WeakMap<Enemy, number>();

/** A shockwave ring from a point: low enough to jump (0.8), it grows out to `reach` blocks. */
function wave(e: Enemy, ctx: EnemyCtx, x: number, y: number, z: number, reach: number, lead: number, damage: number, speed = 9) {
  ctx.strike(e, { lead, live: reach / speed, damage, shape: { kind: 'ring', x, y, z, r: 0.6, grow: speed, width: 0.5, height: 0.8 } });
}

/**
 * Rush at the target in a straight line (any angle, aimed where you are going), shedding dust. It
 * stops when it hits something: a quake, a shockwave from the wall and, if it breaks blocks, a hole
 * in what it hit. With `bounces` it turns on you and goes again.
 */
export function charge(o: { windup: number; recover: number; speed: number; run?: number; bounces?: number; impact?: number; damage?: number; min?: number; max?: number }): Move {
  const aimAt = (e: Enemy, ctx: EnemyCtx, t: TargetView) => {
    const [tx, tz] = ahead(t, 0.25);
    const dx = tx - e.body.x, dz = tz - e.body.z, l = Math.hypot(dx, dz) || 1;
    e.aimX = dx / l; e.aimZ = dz / l;
    const [ex, ez] = toEdge(ctx, e, e.body.x, e.body.z, e.aimX, e.aimZ);
    ctx.strike(e, { lead: o.windup, live: 0, damage: 0, warns: true, shape: { kind: 'line', x0: e.body.x, z0: e.body.z, x1: ex, z1: ez, y: e.body.y, width: e.body.hw } });
  };
  return {
    name: 'charge', windup: o.windup, recover: o.recover, min: o.min, max: o.max,
    aim: aimAt,
    act(e, ctx) { left.set(e, o.bounces ?? 0); runFrom.set(e, 0); ctx.cue(e, 'sweep'); },
    hold(e, ctx, t, time) {
      const b = e.body;
      e.wishX = e.aimX * o.speed / e.speed; e.wishZ = e.aimZ * o.speed / e.speed;
      e.pulse = 0.6;
      const ran = time - (runFrom.get(e) ?? 0);
      if (Math.floor(time * 30) !== Math.floor((time - ctx.dt) * 30)) ctx.fx(b.x - e.aimX * b.hw, b.y + 0.1, b.z - e.aimZ * b.hw, COLD_BODY, 2, 1.5, 0.08);
      const run = o.run ?? 2.5;
      const stopped = ran > 0.15 && Math.hypot(b.vx, b.vz) < o.speed * 0.25;
      if (!stopped && ran < run) return false;
      if (stopped) {
        ctx.quake(e, b.x + e.aimX * b.hw, b.y, b.z + e.aimZ * b.hw, 0.45);
        ctx.crash(e, e.aimX, e.aimZ);
        if (o.impact) wave(e, ctx, b.x, b.y, b.z, o.impact, 0, o.damage ?? 8);
      }
      const n = left.get(e) ?? 0;
      if (n > 0 && t) {
        // turn on you and go again, at once: the bounce is the danger
        left.set(e, n - 1);
        const dx = t.x - b.x, dz = t.z - b.z, l = Math.hypot(dx, dz) || 1;
        e.aimX = dx / l; e.aimZ = dz / l;
        runFrom.set(e, time);
        ctx.cue(e, 'sweep');
        return false;
      }
      e.wishX = 0; e.wishZ = 0;
      return true;
    },
  };
}

/**
 * Leap onto where you will be: the landing spot is marked as it crouches, and the landing is a
 * quake and a shockwave (jump it). With `stones`, the ceiling sheds stones around the landing.
 */
export function slam(o: { windup: number; recover: number; air: number; reach: number; damage?: number; stones?: number; min?: number; max?: number }): Move {
  return {
    name: 'slam', windup: o.windup, recover: o.recover, min: o.min, max: o.max,
    aim(e, ctx, t) {
      const [tx, tz] = ahead(t, o.windup * 0.5);
      e.aimX = tx; e.aimZ = tz;
      ctx.strike(e, { lead: o.windup + o.air, live: 0, damage: 0, warns: true, shape: { kind: 'ring', x: tx, y: t.y, z: tz, r: e.body.hw + 0.4, grow: 0, width: 0.3, height: 1 } });
    },
    act(e, ctx) {
      const b = e.body;
      b.vx = (e.aimX - b.x) / o.air; b.vz = (e.aimZ - b.z) / o.air; b.vy = GRAVITY * o.air / 2;
      e.wishX = b.vx / e.speed; e.wishZ = b.vz / e.speed;
      ctx.cue(e, 'leap');
      ctx.fx(b.x, b.y + 0.1, b.z, COLD_BODY, 10, 3, 0.09);
    },
    hold(e, ctx, _t, time) {
      const b = e.body;
      if (!(b.onGround && time > 0.15) && time < o.air + 1) {
        if (b.vy > -0.5) { e.wishX = (e.aimX - b.x) / Math.max(0.1, o.air - time) / e.speed; e.wishZ = (e.aimZ - b.z) / Math.max(0.1, o.air - time) / e.speed; }
        return false;
      }
      e.wishX = 0; e.wishZ = 0;
      ctx.quake(e, b.x, b.y, b.z, 0.6);
      // the body lands on what is under it, then the ring goes out
      ctx.strike(e, { lead: 0, live: 0.12, damage: o.damage ?? 8, shape: { kind: 'ring', x: b.x, y: b.y, z: b.z, r: 0.2, grow: 8, width: b.hw + 0.3, height: 2 } });
      wave(e, ctx, b.x, b.y, b.z, o.reach, 0.05, o.damage ?? 8);
      for (let k = 0; k < (o.stones ?? 0); k++) {
        const a = wobble(e.id, e.seq, 20 + k) * Math.PI * 2, r = 2 + wobble(e.id, e.seq, 40 + k) * 4;
        ctx.rockfall(e, b.x + Math.cos(a) * r, b.y, b.z + Math.sin(a) * r, 0.9 + k * 0.15, o.damage ?? 8);
      }
      return true;
    },
  };
}

/** Concentric shockwaves from its body, `gap` seconds apart: each one is jumped. */
export function shockwave(o: { windup: number; recover: number; rings: number; gap: number; reach: number; speed?: number; damage?: number; quake?: number; min?: number; max?: number }): Move {
  return {
    name: 'shockwave', windup: o.windup, recover: o.recover, min: o.min, max: o.max,
    aim(e, ctx) { wave(e, ctx, e.body.x, e.body.y, e.body.z, o.reach, o.windup, 0, o.speed); },
    act(e, ctx) {
      const b = e.body;
      ctx.quake(e, b.x, b.y, b.z, o.quake ?? 0.4);
      for (let k = 0; k < o.rings; k++) wave(e, ctx, b.x, b.y, b.z, o.reach, k * o.gap, o.damage ?? 8, o.speed);
    },
    hold: (_e, _ctx, _t, time) => time >= (o.rings - 1) * o.gap,
  };
}

/**
 * Bolts in every direction, `volleys` times, each volley turned by half a gap (a spiral when
 * `spin` is set): the gaps between bolts are where you stand.
 */
export function nova(o: { windup: number; recover: number; count: number; volleys: number; gap: number; speed: number; damage?: number; spin?: number; min?: number; max?: number }): Move {
  const fire = (e: Enemy, ctx: EnemyCtx, k: number) => {
    const off = wobble(e.id, e.seq, 9) * Math.PI * 2 + k * (o.spin ?? Math.PI / o.count);
    for (let i = 0; i < o.count; i++) {
      const a = off + i / o.count * Math.PI * 2;
      ctx.bolt(e, Math.cos(a), 0, Math.sin(a), o.speed, o.damage ?? 4);
    }
    const b = e.body;
    ctx.fx(b.x, b.y + b.h * 0.6, b.z, COLD_WHITE, 8, 3, 0.06);
  };
  return {
    name: 'nova', windup: o.windup, recover: o.recover, min: o.min, max: o.max,
    act(e, ctx) { fire(e, ctx, 0); left.set(e, 1); },
    hold(e, ctx, _t, time) {
      const k = left.get(e) ?? o.volleys;
      if (k >= o.volleys) return true;
      if (time >= k * o.gap) { fire(e, ctx, k); left.set(e, k + 1); }
      return false;
    },
  };
}

/** A fan of bolts aimed at where you are going, `volleys` times. */
export function fan(o: { windup: number; recover: number; count: number; spread: number; volleys: number; gap: number; speed: number; damage?: number; walk?: boolean; min?: number; max?: number }): Move {
  const fire = (e: Enemy, ctx: EnemyCtx, t: TargetView | null) => {
    if (!t) return;
    const b = e.body;
    const [tx, tz] = ahead(t, Math.hypot(t.x - b.x, t.z - b.z) / o.speed);
    const base = Math.atan2(tz - b.z, tx - b.x);
    for (let i = 0; i < o.count; i++) {
      const a = base + (o.count > 1 ? (i / (o.count - 1) - 0.5) * o.spread : 0);
      ctx.bolt(e, Math.cos(a), (t.y + 1 - (b.y + b.h * 0.6)) / Math.max(2, Math.hypot(tx - b.x, tz - b.z)), Math.sin(a), o.speed, o.damage ?? 4);
    }
    ctx.fx(b.x, b.y + b.h * 0.6, b.z, COLD_WHITE, 6, 2.5, 0.06);
  };
  return {
    name: 'fan', windup: o.windup, recover: o.recover, min: o.min, max: o.max, walk: o.walk,
    act(e, ctx, t) { fire(e, ctx, t); left.set(e, 1); },
    hold(e, ctx, t, time) {
      const k = left.get(e) ?? o.volleys;
      if (k >= o.volleys) return true;
      if (time >= k * o.gap) { fire(e, ctx, t); left.set(e, k + 1); }
      return false;
    },
  };
}

/** Lobs that rain around you over `seconds`, each landing marked while it flies. */
export function barrage(o: { windup: number; recover: number; count: number; seconds: number; spread: number; damage?: number; walk?: boolean; min?: number; max?: number }): Move {
  return {
    name: 'barrage', windup: o.windup, recover: o.recover, min: o.min, max: o.max, walk: o.walk,
    act(e) { left.set(e, 0); },
    hold(e, ctx, t, time) {
      const fired = Math.min(o.count, Math.floor(time / o.seconds * o.count) + 1);
      let k = left.get(e) ?? o.count;
      for (; k < fired && t; k++) {
        // the first of each three falls on where you are going; the others around it
        const [tx, tz] = ahead(t, 0.6);
        const a = wobble(e.id, e.seq * 31 + k, 11) * Math.PI * 2, r = k % 3 === 0 ? 0 : 0.8 + wobble(e.id, e.seq * 31 + k, 12) * o.spread;
        ctx.rain(e, tx + Math.cos(a) * r, t.y, tz + Math.sin(a) * r, o.damage ?? 4);
      }
      left.set(e, k);
      return k >= o.count;
    },
  };
}

/** Stones from the ceiling: around you (`around`) or all over the room, a beat apart. */
export function rocks(o: { windup: number; recover: number; count: number; lead: number; spread: number; damage?: number; walk?: boolean; min?: number; max?: number }): Move {
  return {
    name: 'rocks', windup: o.windup, recover: o.recover, min: o.min, max: o.max, walk: o.walk,
    act(e, ctx, t) {
      ctx.quake(e, e.body.x, e.body.y, e.body.z, 0.25);
      for (let k = 0; k < o.count; k++) {
        const [tx, tz] = ahead(t, 0.5 + k * 0.1);
        const a = wobble(e.id, e.seq, 60 + k) * Math.PI * 2, r = k === 0 ? 0 : 1 + wobble(e.id, e.seq, 80 + k) * o.spread;
        ctx.rockfall(e, tx + Math.cos(a) * r, t.y, tz + Math.sin(a) * r, o.lead + k * 0.12, o.damage ?? 8);
      }
    },
  };
}

/**
 * It breathes in: the room pulls toward it for `live` seconds and whatever reaches its mouth is
 * bitten. It stands still while it inhales (the opening is the risk).
 */
export function inhale(o: { windup: number; recover: number; r: number; force: number; live: number; bite?: number; min?: number; max?: number }): Move {
  return {
    name: 'inhale', windup: o.windup, recover: o.recover, min: o.min, max: o.max,
    aim(e, ctx) { ctx.strike(e, { lead: o.windup, live: 0, damage: 0, warns: (o.bite ?? 4) > 0, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: o.r, grow: 0, width: 0.3, height: 1 } }); },
    act(e, ctx) {
      const b = e.body;
      ctx.strike(e, { lead: 0, live: o.live, damage: 0, shape: { kind: 'pull', x: b.x, y: b.y, z: b.z, r: o.r, force: o.force } });
      ctx.strike(e, { lead: 0, live: o.live, damage: o.bite ?? 4, shape: { kind: 'field', x: b.x, y: b.y, z: b.z, r: b.hw + 1.2, effect: 'sting' } });
    },
    hold(e, ctx, _t, time) {
      const b = e.body;
      if (Math.floor(time * 20) !== Math.floor((time - ctx.dt) * 20)) {
        const a = time * 7, r = o.r * (0.6 + 0.4 * Math.sin(time * 3));
        ctx.fx(b.x + Math.cos(a) * r, b.y + 0.4, b.z + Math.sin(a) * r, COLD_BODY, 2, 0.4, 0.06);
      }
      e.pulse = 0.5 + 0.3 * Math.sin(time * 6);
      return time >= o.live;
    },
  };
}

/**
 * Walls that cross the whole room (Sweeps), `count` of them `gap` seconds apart, from alternating
 * sides and axes. Low enough (1.0) to jump.
 */
export function tide(o: { windup: number; recover: number; count: number; gap: number; seconds: number; axes?: 'x' | 'z' | 'both'; height?: number; damage?: number; walk?: boolean; min?: number; max?: number }): Move {
  const send = (e: Enemy, ctx: EnemyCtx, k: number, lead: number) => {
    const [x0, z0, x1, z1] = ctx.bounds(e);
    const axis = o.axes === 'z' ? 'z' : o.axes === 'both' ? (k % 2 ? 'z' : 'x') : 'x';
    const forward = wobble(e.id, e.seq, 13 + k) < 0.5;
    const [a0, a1, c0, c1] = axis === 'x' ? [x0, x1, z0, z1] : [z0, z1, x0, x1];
    const from = forward ? a0 - 0.5 : a1 + 1.5, to = forward ? a1 + 1.5 : a0 - 0.5;
    ctx.strike(e, { lead, live: o.seconds, damage: o.damage ?? 8, shape: { kind: 'sweep', axis, from, to, speed: Math.abs(to - from) / o.seconds, across: [c0, c1 + 1], y: e.body.y, height: o.height ?? 1, width: 0.6 } });
  };
  return {
    name: 'tide', windup: o.windup, recover: o.recover, min: o.min, max: o.max, walk: o.walk,
    aim(e, ctx) { send(e, ctx, 0, o.windup); left.set(e, 1); },
    act() {},
    hold(e, ctx, _t, time) {
      const k = left.get(e) ?? o.count;
      if (k >= o.count) return true;
      if (time >= (k - 1) * o.gap) { send(e, ctx, k, 0.9); left.set(e, k + 1); }
      return false;
    },
  };
}

/**
 * Bars: lines across the room through where you are (`cross` draws both axes), with parallels
 * `spacing` apart: the safe places are between them.
 */
export function bars(o: { windup: number; recover: number; parallels: number; spacing: number; cross?: boolean; damage?: number; walk?: boolean; min?: number; max?: number }): Move {
  return {
    name: 'bars', windup: o.windup, recover: o.recover, min: o.min, max: o.max, walk: o.walk,
    aim(e, ctx, t) {
      const [x0, z0, x1, z1] = ctx.bounds(e);
      const [tx, tz] = ahead(t, o.windup * 0.4);
      const y = e.body.y, s = { lead: o.windup, live: 0.35, damage: o.damage ?? 8 };
      const across = wobble(e.id, e.seq, 1) < 0.5;
      for (let k = -o.parallels; k <= o.parallels; k++) {
        const off = k * o.spacing;
        if (across || o.cross) ctx.strike(e, { ...s, shape: { kind: 'line', x0, z0: tz + off, x1: x1 + 1, z1: tz + off, y, width: 0.5 } });
        if (!across || o.cross) ctx.strike(e, { ...s, shape: { kind: 'line', x0: tx + off, z0, x1: tx + off, z1: z1 + 1, y, width: 0.5 } });
      }
    },
    act(e, ctx) { ctx.quake(e, e.body.x, e.body.y, e.body.z, 0.2); },
  };
}

/** Stinging pools on you and around you, left for `live` seconds (Downpour's puddles). */
export function puddles(o: { windup: number; recover: number; count: number; r: number; live: number; spread: number; damage?: number; walk?: boolean; min?: number; max?: number }): Move {
  return {
    name: 'puddles', windup: o.windup, recover: o.recover, min: o.min, max: o.max, walk: o.walk,
    aim(e, ctx, t) {
      for (let k = 0; k < o.count; k++) {
        const [tx, tz] = ahead(t, 0.4);
        const a = wobble(e.id, e.seq, 90 + k) * Math.PI * 2, r = k === 0 ? 0 : o.r * 1.5 + wobble(e.id, e.seq, 95 + k) * o.spread;
        ctx.strike(e, { lead: o.windup, live: o.live, damage: o.damage ?? 4, shape: { kind: 'field', x: tx + Math.cos(a) * r, y: t.y, z: tz + Math.sin(a) * r, r: o.r, effect: 'sting' } });
      }
    },
    act() {},
  };
}

/**
 * A sequence, like Isaac's bosses chain theirs (three hops and a great leap, a ram that ends in
 * rings): moves one after another, each with its own windup and telegraph, a short `gap` between
 * them, and the recovery only after the last. It counts as one move in the rotation.
 */
export function combo(name: string, moves: Move[], o: { recover: number; gap?: number; min?: number; max?: number }): Move {
  const first = moves[0];
  const at = new WeakMap<Enemy, { i: number; phase: 'wind' | 'act' | 'gap'; t: number; start: number }>();
  return {
    name, windup: first.windup, recover: o.recover, min: o.min ?? first.min, max: o.max ?? first.max, walk: first.walk,
    aim: (e, ctx, t) => first.aim?.(e, ctx, t),
    act(e, ctx, t) { first.act(e, ctx, t); at.set(e, { i: 0, phase: 'act', t: 0, start: 0 }); },
    hold(e, ctx, t, time) {
      const s = at.get(e);
      if (!s) return true;
      const m = moves[s.i];
      if (s.phase === 'act') {
        if (m.hold && !m.hold(e, ctx, t, time - s.start)) return false;
        if (s.i + 1 >= moves.length) return true;
        s.phase = 'gap'; s.t = o.gap ?? 0.15;
        e.wishX = 0; e.wishZ = 0;
        return false;
      }
      if (s.phase === 'gap') {
        e.wishX = 0; e.wishZ = 0;
        s.t -= ctx.dt;
        if (s.t > 0) return false;
        if (!t) return true;
        s.i++; s.phase = 'wind'; s.t = moves[s.i].windup;
        ctx.cue(e, 'windup');
        moves[s.i].aim?.(e, ctx, t);
        return false;
      }
      // the next move's windup: it stops (unless that move walks) and its tells brighten again
      if (!m.walk) { e.wishX = 0; e.wishZ = 0; }
      s.t -= ctx.dt;
      e.pulse = Math.min(1, 1 - s.t / m.windup);
      if (s.t > 0) return false;
      if (!t) return true;
      m.act(e, ctx, t);
      s.phase = 'act'; s.start = time; e.pulse = 0;
      return false;
    },
  };
}
