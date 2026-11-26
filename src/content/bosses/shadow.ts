import { pal } from '../palette';
import { wobble } from '../../enemies/behaviours';
import { evading, evasive, type Dodge } from '../../enemies/evade';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx, type TargetView } from '../../enemies/types';
import {
  BEAM, BEAT, BLADE, BOMB, DASH, GREATCUT, MIN_IDLE, MISSILE, RING, VOLLEY_SHOTS,
  POINTS_PER_DAMAGE, bladeEvery, bladeReach, mirrorOf, shadowLife, strokeDamage, type Mirror,
} from './mirror';

// The floor 9 keystone (docs/design/built/bosses/SHADOW.md). It fights as you do, with what you carry: each frame
// it scores every action it could take from the moment (how far you are, both healths, whether it was just hurt,
// its reach, its bombs, its cooldowns) and takes the best one. No phase and no fixed sequence: two fights against
// the same build go the same way only if you move the same way.

/** Seconds you stand still beside it, with its health at a third or less, that end the fight. */
const STILL = 3;
/** How close it comes when it yields: inside the 2.5 blocks that count as beside you, never touching you. */
const HOME = 2;
const BESIDE = 2.5;
/** Seconds after the fight starts before its first attack: you see it copy your step before it copies your shot. */
const FIRST_ECHO = 1.5;
/** Fan between the strands of a shot, in radians. */
const FAN = 0.16;
const SPEED = 2.4;
/** The score an action needs to be taken at all: below it, it only moves. */
const ACT = 0.5;
/** Seconds after a hit during which it counts as hurt (it dodges, jumps, or steps back before it answers). */
const HURT = 0.6;
/** Its health this far below yours (as shares of each one's start) and it fights from farther away. */
const BEHIND = 0.15;
/** Seconds between two of its jumps, two of its bombs, two of its missiles. */
const JUMP_EVERY = 1.2;
const BOMB_EVERY = 3;
const MISSILE_EVERY = 4;
/** Seconds in the air that make a landing a long one (Discharge). */
const LONG_AIR = 0.5;
/** It strafes one way for this long at least, then turns (seeded). */
const STRAFE = 1.5;
/** A fire seed's burst (Prometheus): 5 of your damage, on the hit. */
const SEED = 5;
/** It may jump again in the air once it has been up this long and is falling. */
const AIR_JUMP = 0.25;
/** The tag its stillness ending leaves on the enemy as it dies: the game reads it and reports `how: 'stillness'`
 *  (ACHIEVEMENTS §1). Turned to your side in the achievements, not destroyed. */
export const STILLNESS_TAG = 'stillness';

type Act = 'volley' | 'stroke' | 'bomb' | 'missile' | 'dash' | 'jump';

/** What it holds and its clocks. Taken the first time it acts: practices and bombs gained later change nothing. */
interface Mind {
  mirror: Mirror;
  /** Bombs it carries (yours at entry); a bomb or a missile spends one. */
  bombs: number;
  /** Your health at entry, in points: the scale for "both healths". */
  yours: number;
  /** Seconds before a volley or a heavy stroke may begin; the shots left in the volley under way and the seconds to the next. */
  idle: number; shots: number; next: number;
  /** Where the first shot of the volley under way goes: where you stood when its tell began. */
  ax: number; ay: number; az: number;
  fired: number;
  blade: number; bombT: number; missileT: number; dashT: number; jumpT: number; ringT: number;
  /** A dash under way: seconds left and its direction. */
  dash: number; dx: number; dz: number;
  air: number; airLeft: number;
  hp: number; hurt: number;
  side: number; sideT: number; seq: number;
  /** Where its last dodge began (NaN: none under way): after it, it strafes on the way the dodge took it. */
  ox: number; oz: number;
  /** Its bomb on the floor, until it goes off. */
  bomb: { x: number; z: number; t: number } | null;
  /** How many times it took each action: read by the tests and the lab. */
  acts: Record<Act, number>;
}

const minds = new WeakMap<Enemy, Mind>();

function mindOf(e: Enemy, ctx: EnemyCtx): Mind {
  let h = minds.get(e);
  if (!h) {
    const mirror = mirrorOf(ctx.practices());
    h = {
      mirror, bombs: Math.max(0, Math.floor(ctx.bombs())), yours: Math.max(1, ctx.health()),
      idle: FIRST_ECHO, shots: 0, next: 0, ax: 0, ay: 0, az: 0, fired: 0,
      blade: FIRST_ECHO, bombT: FIRST_ECHO, missileT: FIRST_ECHO, dashT: 0, jumpT: 0, ringT: 0,
      dash: 0, dx: 0, dz: 0, air: 0, airLeft: mirror.airJumps, hp: e.hp, hurt: HURT, side: 1, sideT: STRAFE, seq: 0, ox: NaN, oz: NaN,
      bomb: null, acts: { volley: 0, stroke: 0, bomb: 0, missile: 0, dash: 0, jump: 0 },
    };
    minds.set(e, h);
    e.speed = SPEED * mirror.move;
  }
  return h;
}

/** The mirror of this Shadow (taken now if it has none yet). */
export const mirrorFor = (e: Enemy, ctx: EnemyCtx): Mirror => mindOf(e, ctx).mirror;

/** Bombs it still carries, and how many times it took each action (for the tests and the lab). */
export const shadowState = (e: Enemy) => { const h = minds.get(e); return h ? { bombs: h.bombs, acts: { ...h.acts } } : null; };

const did = (h: Mind, a: Act) => { h.acts[a]++; };

/** Where you will be when a bolt reaches you (Eye Contact), or where you are. */
function aimAt(e: Enemy, m: Mirror, you: TargetView): [number, number, number] {
  if (!m.shot.lead) return [you.x, you.y + 1, you.z];
  const t = Math.hypot(you.x - e.body.x, you.z - e.body.z) / m.shot.speed;
  return [you.x + (you.vx ?? 0) * t, you.y + 1, you.z + (you.vz ?? 0) * t];
}

/** One shot: one strand per share, fanned, cold. Every fifth is a fire seed when it carries Prometheus. */
function shoot(e: Enemy, ctx: EnemyCtx, h: Mind, x: number, y: number, z: number) {
  const b = e.body, m = h.mirror, from = b.y + b.h * 0.6;
  const dx = x - b.x, dz = z - b.z, l = Math.hypot(dx, dz) || 1;
  const base = Math.atan2(dz, dx), dy = (y - from) / l;
  h.fired++;
  const seed = m.shot.seed && h.fired % 5 === 0 ? SEED * POINTS_PER_DAMAGE : 0;
  m.shot.strands.forEach((share, k) => {
    const a = base + (k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * FAN);
    ctx.bolt(e, Math.cos(a), dy, Math.sin(a), m.shot.speed, m.shot.damage * share + (k === 0 ? seed : 0), m.shot.radius);
  });
}

/** A stroke of its weapon toward where you stand now: the strike's own lead is its tell. Returns its seconds. */
function stroke(e: Enemy, ctx: EnemyCtx, m: Mirror, you: TargetView): number {
  const b = e.body, dx = you.x - b.x, dz = you.z - b.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
  const damage = strokeDamage(m, m.weapon);
  if (m.weapon === 'beam') {
    ctx.strike(e, { lead: m.charge, live: BEAM.live, damage, shape: { kind: 'line', x0: b.x, z0: b.z, x1: b.x + ux * BEAM.length, z1: b.z + uz * BEAM.length, y: b.y, width: BEAM.width } });
    return m.charge + BEAM.live;
  }
  if (m.weapon === 'greatcut') {
    ctx.strike(e, { lead: GREATCUT.lead, live: GREATCUT.live, damage, shape: { kind: 'ring', x: b.x, y: b.y, z: b.z, r: GREATCUT.r, grow: GREATCUT.grow, width: GREATCUT.width, height: GREATCUT.height } });
    return GREATCUT.lead + GREATCUT.live;
  }
  const reach = bladeReach(m);
  ctx.strike(e, { lead: BLADE.lead, live: BLADE.live, damage, shape: { kind: 'line', x0: b.x, z0: b.z, x1: b.x + ux * reach, z1: b.z + uz * reach, y: b.y, width: BLADE.width } });
  return BLADE.lead + BLADE.live;
}

/** A ring from its feet (Discharge on a long landing, Kindling when hurt), marked for a beat. */
function ring(e: Enemy, ctx: EnemyCtx, h: Mind, r: number) {
  if (h.ringT > 0) return;
  h.ringT = RING.every;
  const b = e.body;
  ctx.strike(e, { lead: RING.lead, live: RING.live, damage: RING.damage, shape: { kind: 'ring', x: b.x, y: b.y, z: b.z, r: 0.3, grow: (r - 0.3) / RING.live, width: 0.4, height: 1 } });
}

/** Its bomb at its feet: the blast is marked on the floor for your fuse, then it grows to your radius. */
function bomb(e: Enemy, ctx: EnemyCtx, h: Mind) {
  const b = e.body, m = h.mirror;
  h.bombs--; h.bombT = BOMB_EVERY;
  h.bomb = { x: b.x, z: b.z, t: BOMB.fuse };
  ctx.strike(e, { lead: BOMB.fuse, live: BOMB.live, damage: m.bomb.damage, shape: { kind: 'ring', x: b.x, y: b.y, z: b.z, r: 0.3, grow: (m.bomb.radius - 0.3) / BOMB.live, width: BOMB.width, height: BOMB.height } });
  ctx.fx(b.x, b.y + 0.3, b.z, pal('cold.body'), 8, 1.5, 0.08);
  ctx.cue(e, 'windup');
}

/** Its missile, lobbed to where you stand: its landing is marked while it flies, and it bursts there. */
function missile(e: Enemy, ctx: EnemyCtx, h: Mind, you: TargetView) {
  h.bombs--; h.missileT = MISSILE_EVERY;
  ctx.rain(e, you.x, you.y, you.z, h.mirror.bomb.damage);
}

/** The best action now and its score: every action it could take is scored from the moment, and only the best acts. */
function choose(e: Enemy, ctx: EnemyCtx, h: Mind, d: number): [Act | null, Act | null] {
  const m = h.mirror, b = e.body;
  const mine = e.hp / Math.max(1e-6, e.maxHp), yours = Math.min(1, Math.max(0, ctx.health() / h.yours));
  const behind = mine < yours - BEHIND, hurt = h.hurt < HURT;
  const reach = bladeReach(m);
  const shotWeapon = m.weapon === 'intent' || m.weapon === 'blade';
  const nearBomb = !!h.bomb && Math.hypot(b.x - h.bomb.x, b.z - h.bomb.z) < m.bomb.radius + 0.5;
  const attacks: [Act, number][] = [];
  if (h.shots === 0) {
    if (!m.harmless && shotWeapon && h.idle <= 0 && d <= m.shot.range) attacks.push(['volley', 0.6 + (d >= 3 ? 0.15 : 0) - (hurt && behind ? 0.25 : 0)]);
    if (!m.harmless && m.weapon === 'blade' && h.blade <= 0 && d <= reach + 0.5) attacks.push(['stroke', 0.9]);
    if (!m.harmless && m.weapon === 'beam' && h.idle <= 0 && d <= BEAM.length) attacks.push(['stroke', 0.7]);
    if (!m.harmless && m.weapon === 'greatcut' && h.idle <= 0 && d <= GREATCUT.r + GREATCUT.grow * GREATCUT.live) attacks.push(['stroke', 0.75]);
    if (h.bombs > 0 && !h.bomb && h.bombT <= 0 && d <= m.bomb.radius + 0.8) attacks.push(['bomb', 0.8 + (m.bomb.radius > 2.6 ? 0.1 : 0)]);
    if (m.missile && h.bombs > 0 && !h.bomb && h.missileT <= 0 && d >= MISSILE.near && d <= MISSILE.far) attacks.push(['missile', 0.55 + (behind ? 0.15 : 0) + (d > m.shot.range ? 0.15 : 0)]);
  }
  const motions: [Act, number][] = [];
  if (m.dash && h.dash <= 0 && h.dashT <= 0) {
    const close = d < 1.6 && behind, far = m.weapon === 'blade' && d > reach + 3;
    motions.push(['dash', hurt ? 0.85 : nearBomb ? 0.8 : close ? 0.7 : far ? 0.6 : 0]);
  }
  if (b.onGround && h.jumpT <= 0) motions.push(['jump', hurt ? 0.7 : d < 2 ? 0.6 : nearBomb ? 0.55 : 0.2 + wobble(e.id, h.seq, 41) * 0.35]);
  else if (!b.onGround && h.airLeft > 0 && b.vy < 0 && h.air >= AIR_JUMP) motions.push(['jump', hurt ? 0.7 : d < 3 ? 0.55 : 0.3]);
  const best = (list: [Act, number][]) => list.reduce<[Act | null, number]>((a, c) => (c[1] > a[1] ? c : a), [null, ACT - 1e-9])[0];
  return [best(attacks), best(motions)];
}

/** Where it walks: away from its own bomb, else to the distance its weapon wants, strafing round you. */
function walk(e: Enemy, ctx: EnemyCtx, h: Mind, you: TargetView, d: number) {
  const m = h.mirror, b = e.body;
  if (h.bomb && Math.hypot(b.x - h.bomb.x, b.z - h.bomb.z) < m.bomb.radius + 1.5) {
    const ox = b.x - h.bomb.x, oz = b.z - h.bomb.z, l = Math.hypot(ox, oz) || 1;
    e.wishX = ox / l; e.wishZ = oz / l;
    return;
  }
  const mine = e.hp / Math.max(1e-6, e.maxHp), yours = Math.min(1, Math.max(0, ctx.health() / h.yours));
  const behind = mine < yours - BEHIND;
  const bombing = h.bombs > 0 && h.bombT <= 0 && !behind;
  const want = m.weapon === 'blade' ? bladeReach(m) * 0.7
    : bombing ? m.bomb.radius * 0.6
      : m.weapon === 'greatcut' ? 4
        : Math.min(8, Math.max(3.5, m.shot.range * 0.5)) + (behind ? 2 : 0);
  const [tx, tz] = ctx.toward(e, you);
  const radial = Math.max(-1, Math.min(1, (d - want) / 2));
  let wx = tx * radial - tz * h.side * 0.8, wz = tz * radial + tx * h.side * 0.8;
  const l = Math.hypot(wx, wz) || 1;
  // it stands to aim through the tell of a volley, as you steady your hand: the opening it gives you
  const k = h.shots === VOLLEY_SHOTS ? 0 : 1;
  wx = wx / l * k; wz = wz / l * k;
  e.wishX = wx; e.wishZ = wz;
}

/** Below a third of its health, if you stand still, it stops fighting and comes to stand beside you. */
function yieldTo(e: Enemy, ctx: EnemyCtx, h: Mind, you: TargetView) {
  h.shots = 0; e.pulse = 0;
  e.wishX = 0; e.wishZ = 0;
  const dx = you.x - e.body.x, dz = you.z - e.body.z, d = Math.hypot(dx, dz);
  // it has stopped fighting, not stopped living: it comes home, slowly (issue #314)
  if (d > HOME) { e.wishX = dx / d * 0.4; e.wishZ = dz / d * 0.4; }
  e.timer = d < BESIDE ? e.timer + ctx.dt : 0;
  if (e.timer >= STILL) { e.tags.add(STILLNESS_TAG); ctx.kill(e); }
}

const fights: Behaviour = {
  name: 'mirrors',
  update(e: Enemy, ctx: EnemyCtx) {
    const h = mindOf(e, ctx), m = h.mirror, b = e.body, dt = ctx.dt;
    for (const k of ['idle', 'blade', 'bombT', 'missileT', 'dashT', 'jumpT', 'ringT', 'sideT'] as const) h[k] -= dt;
    h.hurt += dt;
    if (h.bomb && (h.bomb.t -= dt) <= -BOMB.live) h.bomb = null;
    if (e.hp < h.hp - 1e-6) {
      h.hurt = 0;
      if (m.burst) ring(e, ctx, h, RING.burst);
    }
    h.hp = e.hp;
    // the only line it says: once its health falls to a third, how its other ending is reached (toast boss.shadow.phase.2)
    if (e.stage < 2 && e.hp <= e.maxHp / 3) { e.stage = 2; ctx.arena(e, 'stop'); ctx.cue(e, 'phase'); }
    if (!b.onGround) h.air += dt;
    else {
      if (m.landing && h.air >= LONG_AIR) ring(e, ctx, h, RING.landing);
      h.air = 0; h.airLeft = m.airJumps;
    }

    const self = ctx.near(e);
    const still = !!self && Math.hypot(self.vx ?? 0, self.vz ?? 0) < 0.2;
    if (self && still && e.hp <= e.maxHp / 3) { yieldTo(e, ctx, h, self); return; }
    e.timer = 0;

    const you = ctx.target(e);
    if (!you) { e.wishX = 0; e.wishZ = 0; h.shots = 0; e.pulse = 0; return; }
    const d = ctx.dist(e, you);
    if (!Number.isNaN(h.ox)) {
      // the dodge it just made: it keeps going that way round you
      const [tx, tz] = ctx.toward(e, you), along = (b.x - h.ox) * -tz + (b.z - h.oz) * tx;
      if (Math.abs(along) > 0.2) { h.side = Math.sign(along); h.sideT = STRAFE; }
      h.ox = NaN; h.oz = NaN;
    }
    if (h.sideT <= 0) { h.seq++; h.side = wobble(e.id, h.seq, 17) < 0.5 ? -1 : 1; h.sideT = STRAFE + wobble(e.id, h.seq, 23) * 2.5; }

    // the volley under way: a tell, then your shots at your own interval
    if (h.shots > 0) {
      h.next -= dt;
      const first = h.shots === VOLLEY_SHOTS;
      if (first) e.pulse = Math.min(1, 1 - h.next / BEAT);
      if (h.next <= 0) {
        e.pulse = 0;
        const [x, y, z] = first ? [h.ax, h.ay, h.az] : aimAt(e, m, you);
        shoot(e, ctx, h, x, y, z);
        h.shots--; h.next = m.shot.interval;
        if (h.shots === 0) h.idle = MIN_IDLE;
      }
    }

    const [attack, motion] = choose(e, ctx, h, d);
    if (attack === 'volley') {
      h.shots = VOLLEY_SHOTS; h.next = BEAT;
      [h.ax, h.ay, h.az] = aimAt(e, m, you);
      ctx.cue(e, 'windup');
    } else if (attack === 'stroke') {
      const took = stroke(e, ctx, m, you);
      if (m.weapon === 'blade') h.blade = Math.max(took, bladeEvery(m));
      else h.idle = took + MIN_IDLE;
    } else if (attack === 'bomb') bomb(e, ctx, h);
    else if (attack === 'missile') missile(e, ctx, h, you);
    if (attack) did(h, attack);

    if (motion === 'dash') {
      h.dash = DASH.seconds; h.dashT = DASH.cooldown;
      let ux: number, uz: number;
      if (h.bomb && Math.hypot(b.x - h.bomb.x, b.z - h.bomb.z) < m.bomb.radius + 0.5) { ux = b.x - h.bomb.x; uz = b.z - h.bomb.z; }
      else if (m.weapon === 'blade' && d > bladeReach(m) + 3) { ux = you.x - b.x; uz = you.z - b.z; }
      else if (h.hurt < HURT) { ux = -(you.z - b.z) * h.side; uz = (you.x - b.x) * h.side; }
      else { ux = b.x - you.x; uz = b.z - you.z; }
      const l = Math.hypot(ux, uz) || 1;
      h.dx = ux / l; h.dz = uz / l;
      ctx.cue(e, 'leap');
      ctx.fx(b.x, b.y + 0.1, b.z, pal('cold.body'), 8, 2.5, 0.08);
      did(h, 'dash');
    } else if (motion === 'jump') {
      if (b.onGround) h.jumpT = JUMP_EVERY; else h.airLeft--;
      b.vy = m.jump;
      ctx.fx(b.x, b.y + 0.1, b.z, pal('cold.body'), 4, 1.5, 0.07);
      did(h, 'jump');
    }

    if (h.dash > 0) {
      h.dash -= dt;
      const pace = DASH.dist / DASH.seconds / Math.max(1e-6, e.speed);
      e.wishX = h.dx * pace; e.wishZ = h.dz * pace;
      return;
    }
    walk(e, ctx, h, you, d);
  },
};

// you cannot shoot your own shadow while it stands: it slides around you when a hit catches it still, keeping its
// distance (so standing still beside it can still end the fight). With Irimi the slide is as far and quick as your dash.
const ORBIT: Dodge = { kind: 'orbit', dist: 3, tell: 0.25, seconds: 0.35, cooldown: 2, counter: false, idle: 0 };
const sliding = evasive(fights, ORBIT);
const dashing = evasive(fights, { ...ORBIT, ...DASH });

export default defineEnemy({
  id: 'shadow',
  kind: 'boss',
  name: 'The Shadow',
  pattern: 'Everything you do not want to see in yourself',
  hp: 140,
  life: shadowLife,
  speed: SPEED,
  size: [0.34, 1.8],
  contactDamage: 8,
  cost: 0,
  minFloor: 9,
  maxFloor: 9,
  behaviour: {
    name: 'evasive',
    update(e, ctx) {
      const h = mindOf(e, ctx), was = evading(e), x = e.body.x, z = e.body.z;
      (h.mirror.dash ? dashing : sliding).update(e, ctx);
      if (!was && evading(e)) { h.ox = x; h.oz = z; }
    },
  },
  model: [
    { size: [8 * TX, 26 * TX, 6 * TX], pos: [0, 12 * TX, 0], color: pal('ink.void'), name: 'body' },
    { size: [6 * TX, 6 * TX, 6 * TX], pos: [0, 28 * TX, 0], color: pal('ink.void') },
    { size: [10 * TX, TX, 8 * TX], pos: [0, 6 * TX, 0], color: pal('cold.rim') },
    { size: [8 * TX, TX, TX / 2], pos: [0, 2 * TX, 3.25 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
  ],
});
