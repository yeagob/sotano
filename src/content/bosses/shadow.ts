import { pal } from '../palette';
import { phased, wobble } from '../../enemies/behaviours';
import { evasive, type Dodge } from '../../enemies/evade';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx, type TargetView } from '../../enemies/types';
import { BEAM, BEAT, BLADE, bladeReach, DASH, GREATCUT, mirrorOf, strokeDamage, type Mirror } from './mirror';

const SHADOWS = ['doubt', 'critic', 'panic'];
const STILL = 3;
/** How close it comes in its last phase: inside the 2.5 blocks of `stops`, never touching you. */
const HOME = 2;
/** Seconds after the fight starts before its first echo: you see it copy your step before it copies your shot. */
const FIRST_ECHO = 1.5;
/** Fan between the strands of a volley, in radians. */
const FAN = 0.16;
const SPEED = 2.4;
/** The tag its stillness ending leaves on the enemy as it dies: the game reads it and reports `how: 'stillness'`
 *  (ACHIEVEMENTS §1). Turned to your side in the achievements, not destroyed. */
export const STILLNESS_TAG = 'stillness';

/** Its mirror, taken from your practices the first time it acts (practices gained later do not change it), and the
 *  clocks of its echo: seconds to the next volley or stroke, the beat under way, where it aims, the blade's clock. */
interface Echo { mirror: Mirror; clock: number; beat: number; x: number; y: number; z: number; blade: number }
const echoes = new WeakMap<Enemy, Echo>();

function echoOf(e: Enemy, ctx: EnemyCtx): Echo {
  let h = echoes.get(e);
  if (!h) {
    const mirror = mirrorOf(ctx.practices());
    h = { mirror, clock: FIRST_ECHO, beat: 0, x: 0, y: 0, z: 0, blade: 0 };
    echoes.set(e, h);
    e.speed = SPEED * mirror.move;
  }
  return h;
}

/** The mirror of this Shadow (taken now if it has none yet). */
export const mirrorFor = (e: Enemy, ctx: EnemyCtx): Mirror => echoOf(e, ctx).mirror;

const follow = (e: Enemy, ctx: EnemyCtx) => {
  const you = ctx.near(e);
  if (!you) { e.wishX = 0; e.wishZ = 0; return; }
  e.wishX = (you.vx ?? 0) / e.speed; e.wishZ = (you.vz ?? 0) / e.speed;
};

/** Your volley a beat later: one strand per share, fanned, cold, aimed where you stood when its tell began. */
function volley(e: Enemy, ctx: EnemyCtx, h: Echo) {
  const b = e.body, m = h.mirror, from = b.y + b.h * 0.6;
  const dx = h.x - b.x, dz = h.z - b.z, l = Math.hypot(dx, dz) || 1;
  const base = Math.atan2(dz, dx), dy = (h.y - from) / l;
  m.shot.strands.forEach((share, k) => {
    const a = base + (k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * FAN);
    ctx.bolt(e, Math.cos(a), dy, Math.sin(a), m.shot.speed, m.shot.damage * share, m.shot.radius);
  });
}

/** A stroke of its weapon, toward where you stand now: the strike's own lead is its tell. Returns the seconds until the next. */
function stroke(e: Enemy, ctx: EnemyCtx, m: Mirror, you: TargetView): number {
  const b = e.body, dx = you.x - b.x, dz = you.z - b.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
  const damage = strokeDamage(m, m.weapon);
  if (m.weapon === 'beam') {
    ctx.strike(e, { lead: m.charge, live: BEAM.live, damage, shape: { kind: 'line', x0: b.x, z0: b.z, x1: b.x + ux * BEAM.length, z1: b.z + uz * BEAM.length, y: b.y, width: BEAM.width } });
    return m.charge + BEAM.live + BEAM.rest;
  }
  if (m.weapon === 'greatcut') {
    ctx.strike(e, { lead: GREATCUT.lead, live: GREATCUT.live, damage, shape: { kind: 'ring', x: b.x, y: b.y, z: b.z, r: GREATCUT.r, grow: GREATCUT.grow, width: GREATCUT.width, height: GREATCUT.height } });
    return GREATCUT.lead + GREATCUT.live + GREATCUT.rest;
  }
  const reach = bladeReach(m);
  ctx.strike(e, { lead: BLADE.lead, live: BLADE.live, damage, shape: { kind: 'line', x0: b.x, z0: b.z, x1: b.x + ux * reach, z1: b.z + uz * reach, y: b.y, width: BLADE.width } });
  return Math.max(BLADE.every, 1 / m.shot.rate);
}

/** What it does with your practices: your shot (or the weapon that replaces it), a beat later. */
function echo(e: Enemy, ctx: EnemyCtx, h: Echo) {
  const m = h.mirror, you = ctx.target(e);
  if (!you || m.harmless) { h.beat = 0; e.pulse = 0; return; }
  // the blade keeps the shot, as yours does: it strokes on its own clock when you are within its reach
  if (m.weapon === 'blade') {
    h.blade -= ctx.dt;
    if (h.blade <= 0 && ctx.dist(e, you) <= bladeReach(m) + 0.5) h.blade = stroke(e, ctx, m, you);
  }
  if (h.beat > 0) {
    h.beat -= ctx.dt;
    e.pulse = 1 - h.beat / BEAT;
    if (h.beat <= 0) { e.pulse = 0; volley(e, ctx, h); }
    return;
  }
  h.clock -= ctx.dt;
  if (h.clock > 0) return;
  if (m.weapon === 'beam' || m.weapon === 'greatcut') { h.clock = stroke(e, ctx, m, you); return; }
  h.beat = BEAT; h.x = you.x; h.y = you.y + 1; h.z = you.z;
  h.clock = 1 / m.shot.rate;
  ctx.cue(e, 'windup');
}

const mirroring: Behaviour = {
  name: 'mirrors',
  update(e: Enemy, ctx: EnemyCtx) { follow(e, ctx); echo(e, ctx, echoOf(e, ctx)); },
};

const reveals: Behaviour = {
  name: 'reveals',
  update(e: Enemy, ctx: EnemyCtx) {
    follow(e, ctx);
    e.timer -= ctx.dt;
    if (e.timer <= 0) { e.timer = 6; e.seq++; ctx.summon(e, [SHADOWS[Math.floor(wobble(e.id, e.seq, 1) * SHADOWS.length)]]); }
  },
};

const stops: Behaviour = {
  name: 'stops',
  update(e: Enemy, ctx: EnemyCtx) {
    e.wishX = 0; e.wishZ = 0;
    const you = ctx.near(e);
    // it has stopped fighting, not stopped living: it comes home, slowly, to stand beside you (issue #314)
    if (you) {
      const dx = you.x - e.body.x, dz = you.z - e.body.z, d = Math.hypot(dx, dz);
      if (d > HOME) { e.wishX = dx / d * 0.4; e.wishZ = dz / d * 0.4; }
    }
    const beside = !!you && Math.hypot(you.x - e.body.x, you.z - e.body.z) < 2.5 && Math.hypot(you.vx ?? 0, you.vz ?? 0) < 0.2;
    e.timer = beside ? e.timer + ctx.dt : 0;
    if (e.timer >= STILL) { e.tags.add(STILLNESS_TAG); ctx.kill(e); }
  },
};

// you cannot shoot your own shadow: it slides around you, keeping its distance (so standing still beside
// it still ends the fight). It never repositions on its own: if you stand still, so does it, by design.
const ORBIT: Dodge = { kind: 'orbit', dist: 3, tell: 0.25, seconds: 0.35, cooldown: 2, counter: false, idle: 0 };
const phases = phased({ arena: ['mirrors', 'stop'], phases: [mirroring, reveals, stops] });
const sliding = evasive(phases, ORBIT);
// a mirrored Irimi: the same orbit, as far and as quick as your dash
const dashing = evasive(phases, { ...ORBIT, ...DASH });

export default defineEnemy({
  id: 'shadow',
  kind: 'boss',
  name: 'The Shadow',
  pattern: 'Everything you do not want to see in yourself',
  hp: 140,
  speed: SPEED,
  size: [0.34, 1.8],
  contactDamage: 8,
  cost: 0,
  minFloor: 9,
  maxFloor: 9,
  behaviour: { name: 'evasive', update: (e, ctx) => (mirrorFor(e, ctx).dash ? dashing : sliding).update(e, ctx) },
  model: [
    { size: [8 * TX, 26 * TX, 6 * TX], pos: [0, 12 * TX, 0], color: pal('ink.void'), name: 'body' },
    { size: [6 * TX, 6 * TX, 6 * TX], pos: [0, 28 * TX, 0], color: pal('ink.void') },
    { size: [10 * TX, TX, 8 * TX], pos: [0, 6 * TX, 0], color: pal('cold.rim') },
    { size: [8 * TX, TX, TX / 2], pos: [0, 2 * TX, 3.25 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
  ],
});
