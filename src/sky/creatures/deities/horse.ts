// The horse deity, guardian of sky floor 5 (docs/design/not-built/sky/guardians/HORSE.md, B2–B4, B3b).
//
// The deity machine (deity.ts) runs the shared cycle; this file is the horse's data and its "brain": one rule whose
// tick runs every frame before the machine. The brain owns the horse's body (it walks and leaps, it never
// levitates), its startle and calm, the herd it sends, the floor's rhythm of fades, the special attacks' longer
// telegraphs and the calm feedback. The machine picks attacks from `attacks`, which here is a getter: the brain
// offers the one attack the horse makes next, so it knows which telegraph is on show from its first frame.
//
// Nothing here takes health. Attacks push, slow or hold through ctx.hinder; three drain spirit through ctx.drain
// (the spirit gate decides); Snaking captures (CAPTURE_TIME, one practice). Every number is a target of B9.

import type * as THREE from 'three';
import { MAT } from '../../../content/materials';
import { pal } from '../../../content/palette';
import { TX, type ModelPart } from '../../../enemies/types';
import type { Shape as HazardShape, MarkPaint } from '../../../enemies/attacks';
import { KNOCKBACK_PAINT } from '../../hindrances/knockback';
import { hazardOwner } from '../../hindrances/runner';
import { WIND_PAINT } from '../../hindrances/wind';
import { HOLDER } from '../../render/creature-view';
import {
  CAPTURE_TIME, ExceptionKind, MIN_TELEGRAPH, TELEGRAPH,
  type AttackDef, type CustomState, type DeityCtx, type DeityDef, type DeityRule, type Parts, type Place,
  type SkyActor, type SkyCue, type SkyWorldApi, type Vec3,
} from '../../types';

// ───────────────────────── targets (HORSE.md B2, B3, B3b, B4, B9) ─────────────────────────

export const HORSE_HITS = 48;
/** Alert starts within this distance. */
export const SIGHT = 14;
export const REST: readonly [number, number, number] = [2.5, 2, 1.5];
/** Startle: a moving player, or a jump that lands, this close. */
export const STARTLE = 6;
/** Calm: standing still this long, this close (or on its paddock), and the horse is Gentled. */
export const CALM_RANGE = 8;
export const CALM_TIME = 1.5;
export const GENTLED = 3;
/** A Gentled horse walks up to this distance from the player. */
export const GENTLE_NEAR = 3;
/** The great leap: at most this far across and this high. */
export const LEAP_MAX = 20;
export const LEAP_PEAK = 8;
/** Seconds a leap's crouch is shown before it goes (its telegraph, B2 startle). */
export const CROUCH = TELEGRAPH[4];
/** Seconds after a landing before a startle can leap again. */
export const LEAP_REST = 2;
/** A special attack that drains shows 0.2 s more than the floor's telegraph, one that captures 0.5 s more (guardians §6.6). */
export const DRAIN_TAIL = 0.2;
export const CAPTURE_TAIL = 0.5;
/** A capture comes at most once in this many seconds. */
export const CAPTURE_GAP = 30;
/** No capture within this long after the player was last held. */
export const HELD_CALM = 1;
/** The spirit each drain takes (B3b; the owner accepts them for now, 2026-11-05). */
export const SNORT_SPIRIT = 14;
export const GALLOP_SPIRIT = 16;
export const PANIC_SPIRIT = 18;
/** An ally grazing beside the horse gentles it this often (B4). */
export const ALLY_CALM_EVERY = 10;
/** Beside the deity: within this horizontal reach (a little more than the paddock's half-width and an ally's body). */
export const ALLY_NEAR = 3.6;
/** From the second stage the floor fades one segment of each run this often (B6, the rhythm). */
export const RHYTHM = 12;
/** Seconds a faded segment stays gone. */
export const FADE_SECONDS = 3;
/** The push's speed for each block of push (the same as the tower knock's). */
export const PUSH_PER_BLOCK = 2.5;
/** Blocks a second: grazing, walking up to a still player, the gallop, a trot. */
const GRAZE_SPEED = 0.6;
const WALK_SPEED = 2;
export const GALLOP_SPEED = 12;
const TROT_SPEED = 4;
/** Herd panic drains a player who moved within this many seconds of its end. */
export const PANIC_MOVED = 0.3;
/** The trail of a gallop lasts this long. */
const TRAIL = 1;

const push = (blocks: number) => blocks * PUSH_PER_BLOCK;

// ───────────────────────── the herd the horse sends (B2, B5 rule 2) ─────────────────────────

/** Minions the horse has sent to kick, by actor id, with the host time they were sent. Read by minions/horse.ts. */
export const SENT = new Map<number, number>();

// ───────────────────────── small world helpers (shared with minions/horse.ts) ─────────────────────────

const worldOf = (ctx: { host: { world?: () => SkyWorldApi } }): SkyWorldApi | null => {
  try { return ctx.host.world?.() ?? null; } catch { return null; }
};

/** The feet height of a place: the floors give the cell they stand on (solid), or the cell the feet stand in. */
export function feetOf(w: SkyWorldApi | null, p: Place): number {
  return w && w.solid(p.x, p.y, p.z) ? p.y + 1 : p.y;
}

/** The feet height over the first solid cell at (x, z) at or below `from`, within 16 blocks; null over a void. */
export function groundAt(w: SkyWorldApi | null, x: number, z: number, from: number): number | null {
  if (!w) return from;
  const cx = Math.floor(x), cz = Math.floor(z);
  for (let y = Math.floor(from); y > from - 16; y--) if (w.solid(cx, y, cz)) return y + 1;
  return null;
}

/** Whether a block the player placed stands in the column at (x, z) from the feet up to two blocks over them. */
export function placedAt(w: SkyWorldApi | null, x: number, y: number, z: number): boolean {
  if (!w) return false;
  const cx = Math.floor(x), cz = Math.floor(z);
  for (let cy = Math.floor(y); cy <= Math.floor(y) + 2; cy++) {
    if (!w.inside(cx, cy, cz)) continue;
    if (w.kindAt(w.idx(cx, cy, cz)) === ExceptionKind.Placed) return true;
  }
  return false;
}

/** A solid block strictly between two points (a breath stops at the first block, like a gust). */
export function blocked(w: SkyWorldApi | null, a: Vec3, b: Vec3): boolean {
  if (!w) return false;
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) / 0.25));
  const ax = Math.floor(a.x), ay = Math.floor(a.y), az = Math.floor(a.z);
  const bx = Math.floor(b.x), by = Math.floor(b.y), bz = Math.floor(b.z);
  for (let k = 1; k < n; k++) {
    const t = k / n;
    const x = Math.floor(a.x + (b.x - a.x) * t), y = Math.floor(a.y + (b.y - a.y) * t), z = Math.floor(a.z + (b.z - a.z) * t);
    if ((x === ax && y === ay && z === az) || (x === bx && y === by && z === bz)) continue;
    if (w.solid(x, y, z)) return true;
  }
  return false;
}

/**
 * One kinematic step over the ground toward (tx, tz): it steps up one block (a fence, a segment's lip), drops
 * off any edge, and stops at a wall two blocks high or at a block the player placed. Returns 'moved', 'there',
 * 'wall' or 'placed'. Deterministic for a fixed dt; no gravity is integrated (the horse lands where it walks).
 */
export function glide(w: SkyWorldApi | null, b: { x: number; y: number; z: number; vx: number; vy: number; vz: number },
  tx: number, tz: number, speed: number, dt: number, stopAt = 0): 'moved' | 'there' | 'wall' | 'placed' {
  const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
  if (d <= stopAt + 1e-6) { b.vx = 0; b.vz = 0; return 'there'; }
  const s = Math.min(speed * dt, d - stopAt);
  const nx = b.x + (dx / d) * s, nz = b.z + (dz / d) * s;
  if (placedAt(w, nx, b.y, nz)) { b.vx = 0; b.vz = 0; return 'placed'; }
  let ny = b.y;
  if (w) {
    if (w.solid(Math.floor(nx), Math.floor(b.y) + 1, Math.floor(nz))) { b.vx = 0; b.vz = 0; return 'wall'; }
    const g = groundAt(w, nx, nz, b.y + 0.5);
    if (g !== null) ny = g;
  }
  b.vx = (nx - b.x) / dt; b.vz = (nz - b.z) / dt; b.vy = 0;
  b.x = nx; b.z = nz; b.y = ny;
  return Math.hypot(tx - nx, tz - nz) <= stopAt + 1e-6 ? 'there' : 'moved';
}

// ───────────────────────── attacks ─────────────────────────

export type HorseAttackId = 'stamp' | 'gust' | 'leap' | 'wave' | 'send' | 'dust' | 'snort' | 'shake' | 'gallop' | 'panic' | 'snaking';

const spec = (tell: string, pose: string, cue: string) => ({ tell, pose, cue: `horse.${cue}` as SkyCue });

/** The telegraph of each attack: the part that tells, its extreme pose, its sound (DECISIONS §8.5). */
export const HORSE_TELEGRAPHS: { readonly [K in HorseAttackId]: { tell: string; pose: string; cue: SkyCue } } = {
  stamp: spec('legs', 'rear', 'rear'),
  gust: spec('tail', 'swish', 'whistle'),
  leap: spec('legs', 'crouch', 'paw'),
  wave: spec('head', 'whinny', 'whinny'),
  send: spec('head', 'call', 'call'),
  dust: spec('body', 'roll', 'thud'),
  snort: spec('nostrils', 'flare', 'snort'),
  shake: spec('mane', 'shake', 'shake'),
  gallop: spec('legs', 'paw', 'drum'),
  panic: spec('eyes', 'tremble', 'hoofbeats'),
  snaking: spec('head', 'snake', 'snake'),
};

/** The first stage each attack is used in (B3: stage 1 Rear and stamp, Tail gust; 2 Leap and land; 3 Whinny wave. B3b by phase). */
export const HORSE_STAGES: { readonly [K in HorseAttackId]: 0 | 1 | 2 } = {
  stamp: 0, gust: 0, send: 0, dust: 0, snort: 0, leap: 1, shake: 1, gallop: 1, wave: 2, panic: 2, snaking: 2,
};
const SPIRIT: Partial<Record<HorseAttackId, number>> = { snort: SNORT_SPIRIT, gallop: GALLOP_SPIRIT, panic: PANIC_SPIRIT };
const TAIL: Partial<Record<HorseAttackId, number>> = { snort: DRAIN_TAIL, gallop: DRAIN_TAIL, panic: DRAIN_TAIL, snaking: CAPTURE_TAIL };

const ORDER: readonly HorseAttackId[] = ['stamp', 'gust', 'send', 'dust', 'snort', 'leap', 'shake', 'gallop', 'wave', 'panic', 'snaking'];

/** Every attack of the horse, in the order of its document. */
export const HORSE_ATTACKS: readonly AttackDef[] = ORDER.map((id): AttackDef => ({
  id,
  stage: HORSE_STAGES[id],
  telegraph: HORSE_TELEGRAPHS[id],
  ...(SPIRIT[id] !== undefined ? { spirit: SPIRIT[id] } : {}),
  act: ctx => brainOf(ctx).act(id),
}));
const BY_ID = new Map(HORSE_ATTACKS.map(a => [a.id as HorseAttackId, a]));

// ───────────────────────── the brain ─────────────────────────

type Motion =
  | { k: 'leap'; from: Vec3; to: Vec3; t: number; time: number; peak: number }
  | { k: 'walk'; to: Vec3; speed: number; stop: number; t: number; max: number }
  | { k: 'run'; to: Vec3; speed: number; trail: boolean; drain: boolean; t: number; max: number }
  | { k: 'circle'; c: Vec3; r: number; a: number; left: number; t: number; time: number; reached: boolean; last: Vec3 | null };

/** What the model shows: read by the plush model (`progress`) and the gallery. */
export interface HorsePose {
  yaw: number;
  /** Head pitch: positive lowers it (grazing, Gentled), negative raises it (alert, whinny). */
  head: number;
  /** Side swing of the head (snaking). */
  swing: number;
  /** 0 → 1: rearing on the hind legs. */
  rear: number;
  /** 0 → 1: crouched to leap, kneeling to roll. */
  crouch: number;
  /** Leg phase and its amplitude (0 still, 1 a gallop). */
  stride: number; gait: number;
  /** Tail swish 0 → 1. */
  tail: number;
  /** Ears: −1 pinned back, 0 easy, 1 pricked forward. */
  ears: number;
  /** Mane shake 0 → 1. */
  mane: number;
  /** Nostril flare 0 → 1. */
  flare: number;
  /** Trembling 0 → 1 (Herd panic). */
  tremble: number;
  /** Seconds, for the stepped cycles. */
  t: number;
  /** Seconds of the hurt flinch left. */
  hurt: number;
}

export const restPose = (): HorsePose => ({ yaw: 0, head: 0, swing: 0, rear: 0, crouch: 0, stride: 0, gait: 0, tail: 0, ears: 0, mane: 0, flare: 0, tremble: 0, t: 0, hurt: 0 });

const BRAINS = new WeakMap<SkyActor, Brain>();
const LIVE = new Set<Brain>();
/** The brain whose rule ticked last: the attack getter belongs to it (one deity updates at a time). */
let active: Brain | null = null;

function brainOf(ctx: DeityCtx): Brain {
  let b = BRAINS.get(ctx.deity);
  if (!b) { b = new Brain(ctx); BRAINS.set(ctx.deity, b); LIVE.add(b); }
  b.ctx = ctx;
  return b;
}

/** The brain of a horse actor, for tests and the model. */
export const horseBrain = (a: SkyActor): Brain | undefined => BRAINS.get(a);

const flat = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.z - b.z);

export class Brain {
  ctx: DeityCtx;
  /** Seconds since this brain was born (its own clock: deterministic under a fixed dt). */
  clock = 0;
  pose = restPose();
  /** The attack offered to the machine and not yet begun; the attack whose telegraph (or tail) is on show. */
  offered: HorseAttackId | null = null;
  /** Limits the attacks the horse may make (tests and the sandbox); null: all of its stage. */
  only: readonly HorseAttackId[] | null = null;
  current: HorseAttackId | null = null;
  last: HorseAttackId | null = null;
  /** A positive hit landed on the horse during the current telegraph (the attack's positive answer). */
  answered = false;
  /** The tail of a special attack's telegraph, still to run after the machine's act. */
  strike: { id: HorseAttackId; left: number } | null = null;
  motion: Motion | null = null;
  gentled = false;
  gentledLeft = 0;
  /** True once the horse has acted since its last Gentled spell (calm is a gift, not a loop). */
  calmReady = true;
  /** Off its paddock after a landing, a gallop or a circle: it leaps back when it can. */
  offHome = false;
  won = false;
  /** The place the horse calls home now (its paddock), and the leap it is crouching for. */
  home: Place;
  private leapTo: Place | null = null;
  private crouchLeft = 0;
  private landedAt = -Infinity;
  private lastCapture = -Infinity;
  private heldAt = -Infinity;
  private wasOnGround = true;
  private landedNear = false;
  private stillWas = 0;
  private feedback = 0;
  private allyCalm = 0;
  private rhythm = 0;
  private rhythmStep = 0;
  private refusedUntil = -Infinity;
  private queue: { at: number; tag: number }[] = [];
  /** Until when a gust or a fade the horse started is still on the floor (Herd panic waits for it). */
  private busyUntil = -Infinity;
  private trail: { x: number; y: number; z: number; until: number }[] = [];
  private marks: number | null = null;
  private aim: Vec3 = { x: 0, y: 0, z: 1 };
  private gallopTo: Vec3 | null = null;
  private lastState = 'Idle';
  private grazeA = 0;
  private hurtLeft = 0;
  private hitsSeen = 0;

  constructor(ctx: DeityCtx) {
    this.ctx = ctx;
    this.home = ctx.plan.seat;
  }

  get world(): SkyWorldApi | null { return worldOf(this.ctx); }
  get body() { return this.ctx.deity.body; }
  private player() { return this.ctx.host.player(); }

  /** The paddocks of the floor (the seat is one of them). */
  paddocks(): readonly Place[] {
    const p = this.ctx.plan.extra?.paddocks;
    return p && p.length ? p : [this.ctx.plan.seat];
  }

  private feetPoint(p: Place): Vec3 { return { x: p.x + 0.5, y: feetOf(this.world, p), z: p.z + 0.5 }; }

  /** Whether the body stands on a paddock (inside its 5 × 5 and on its top). */
  onPaddock(): Place | null {
    const b = this.body;
    for (const p of this.paddocks()) {
      if (Math.abs(b.x - (p.x + 0.5)) <= p.w / 2 && Math.abs(b.z - (p.z + 0.5)) <= p.d / 2 && Math.abs(b.y - feetOf(this.world, p)) < 0.6) return p;
    }
    return null;
  }

  // ── the tick ──

  tick(dt: number) {
    active = this;
    this.clock += dt;
    const a = this.ctx.deity, b = this.body, pl = this.player();
    if (pl.held) this.heldAt = this.clock;
    // a jump that lands near the horse startles it
    const pb = pl.body;
    this.landedNear = !this.wasOnGround && pb.onGround && flat(pb, b) <= STARTLE;
    this.wasOnGround = pb.onGround;
    if (a.hits > this.hitsSeen) { this.hurtLeft = 0.3; this.hitsSeen = a.hits; }
    this.hurtLeft = Math.max(0, this.hurtLeft - dt);

    // the machine began the attack it was offered (its state's clock is zero on its first frame)
    if (this.offered && a.t === 0 && (a.state === 'Attacking' || a.state === 'Hurt')) this.begin(this.offered);

    if (a.state !== 'Hurt' && a.state !== this.lastState) this.entered(a.state);
    if (a.state !== 'Hurt') this.lastState = a.state;

    this.move(dt);
    if (this.strike) {
      this.strike.left -= dt;
      if (this.strike.left <= 1e-9) { const id = this.strike.id; this.strike = null; this.land(id); }
    }
    this.runTrail();
    this.runQueue();
    if (!this.won) {
      this.rhythmTick(dt);
      this.transitions(dt);
    }
    this.calmFeedback(dt);
    this.updatePose(dt);
  }

  /** The machine entered a state (seen from the actor, not while Hurt hides it). */
  private entered(state: string) {
    const b = this.body;
    if (state === 'Rallying') {
      // it rears and whinnies; the herd comes back to it (minions/horse.ts reads the state)
      this.ctx.host.cue('horse.rally', b.x, b.y + b.h, b.z);
      SENT.clear();
    }
    if (state === 'Recovering') this.ctx.host.cue('horse.blow', b.x, b.y + b.h, b.z);
  }

  /** The horse's own moves between attacks: startle, calm, an ally's calm, and the leap home. */
  private transitions(dt: number) {
    const ctx = this.ctx, a = ctx.deity, pl = this.player().body;
    const st = a.state;
    if (st === 'Hurt' || this.motion || this.current || this.strike) return;
    const d = ctx.distance();
    const free = st === 'Grazing' || st === 'Watching';
    if (!free) return;
    // the leap home after a landing, a gallop or a circle
    if (this.offHome && st === 'Watching') {
      if (!this.onPaddock()) { this.leap(this.homePaddock()); return; }
      this.offHome = false;
    }
    // startle: a player rushing at it, or landing a jump near it
    const moving = ctx.still() === 0;
    if (this.clock - this.landedAt >= LEAP_REST && ((moving && d <= STARTLE) || this.landedNear)) {
      const to = this.farPaddock();
      if (to) { this.leap(to); return; }
    }
    // calm: a still player near it, in its sight, with no telegraph on show
    const near = d <= CALM_RANGE || this.isOn(this.home, pl);
    if (this.calmReady && near && d <= SIGHT && ctx.still() >= CALM_TIME) { this.go('Gentled'); return; }
    // an ally grazing beside it gentles it every ALLY_CALM_EVERY seconds
    const allies = ctx.minions.filter(m => m.side === 'ally' && flat(m.body, a.body) <= ALLY_NEAR);
    if (allies.length) {
      this.allyCalm += dt;
      if (this.allyCalm >= ALLY_CALM_EVERY) { this.allyCalm = 0; this.go('Gentled'); }
    } else this.allyCalm = 0;
  }

  private isOn(p: Place, b: { x: number; y: number; z: number }): boolean {
    return Math.abs(b.x - (p.x + 0.5)) <= p.w / 2 && Math.abs(b.z - (p.z + 0.5)) <= p.d / 2 && Math.abs(b.y - feetOf(this.world, p)) < 1;
  }

  private go(state: string) {
    this.offered = null;
    this.ctx.go(state);
  }

  // ── picking the next attack (the getter) ──

  /** The attack the horse makes next, as a list of one for the machine's `choose()`. */
  offer(): readonly AttackDef[] {
    // offered and not begun: the machine refused it (the spirit gate was closed), so no drain for a moment
    if (this.offered) this.refusedUntil = this.clock + 1;
    const stage = this.ctx.stage;
    const ok = ORDER.filter(id => HORSE_STAGES[id] <= stage && (!this.only || this.only.includes(id)) && this.eligible(id));
    let pool = ok.filter(id => id !== this.last);
    if (pool.length === 0) pool = ok;
    if (pool.length === 0) { this.offered = null; return []; }
    // Sending and Attacking in turn (B2, the cycle): after an attack, the herd goes if it can
    let id: HorseAttackId;
    if (this.last !== 'send' && pool.includes('send')) id = 'send';
    else {
      const attacks = pool.filter(x => x !== 'send');
      const from = attacks.length ? attacks : pool;
      id = from[this.ctx.rng.int(0, from.length - 1)];
    }
    this.offered = id;
    return [BY_ID.get(id)!];
  }

  private eligible(id: HorseAttackId): boolean {
    const d = this.ctx.distance();
    if (SPIRIT[id] !== undefined && this.clock < this.refusedUntil) return false;
    switch (id) {
      case 'send': return this.sendable().length > 0;
      case 'leap': return d <= LEAP_MAX;
      case 'snaking': return d <= 10 && this.canCapture();
      // Herd panic is not chosen while a gust or a fade is under the player, nor while a sent minion runs at them
      case 'panic': return this.clock >= this.busyUntil && SENT.size === 0;
      case 'stamp': case 'wave': return this.segments().length > 0 || id === 'stamp';
      default: return true;
    }
  }

  canCapture(): boolean {
    return this.clock - this.lastCapture >= CAPTURE_GAP && !this.player().held && this.clock - this.heldAt >= HELD_CALM;
  }

  /** Wild minions free to be sent, nearest the player first. */
  private sendable(): SkyActor[] {
    const pl = this.player().body;
    return this.ctx.minions
      .filter(m => m.side === 'wild' && m.state === 'Wild' && !SENT.has(m.id))
      .sort((p, q) => flat(p.body, pl) - flat(q.body, pl) || p.id - q.id);
  }

  // ── telegraphs: their first frame ──

  private begin(id: HorseAttackId) {
    this.offered = null;
    this.current = id;
    this.answered = false;
    this.calmReady = true;
    const b = this.body, pl = this.player().body;
    const dx = pl.x - b.x, dz = pl.z - b.z, d = Math.hypot(dx, dz) || 1;
    this.aim = { x: dx / d, y: 0, z: dz / d };
    const len = TELEGRAPH[4] + (TAIL[id] ?? 0);
    const y = b.y + 0.02;
    if (id === 'snort') {
      // a pale cone of 30 degrees out to 12 blocks, from the nose toward the player
      const a0 = Math.atan2(this.aim.z, this.aim.x);
      const rays = [-15, 0, 15].map((deg): HazardShape => {
        const a = a0 + deg * Math.PI / 180;
        return { kind: 'line', x0: b.x, z0: b.z, x1: b.x + Math.cos(a) * 12, z1: b.z + Math.sin(a) * 12, y, width: 0.12 };
      });
      this.draw(rays, len, 0.3, WIND_PAINT);
    } else if (id === 'gallop') {
      this.gallopTo = this.gallopEnd();
      this.draw(this.dashes(b, this.gallopTo), len, 1.5, KNOCKBACK_PAINT);
    } else if (id === 'panic') {
      // the grass lies flat in a wave that rolls out across the whole floor
      this.draw([{ kind: 'ring', x: b.x, y, z: b.z, r: 0, grow: 32 / len, width: 0.3, height: 0.3 }], 0, len, WIND_PAINT);
    } else if (id === 'snaking') {
      const c = { x: pl.x, y: pl.y, z: pl.z };
      const from = Math.atan2(b.z - c.z, b.x - c.x);
      this.motion = { k: 'circle', c, r: 3, a: from, left: Math.PI * 2, t: 0, time: len, reached: false, last: null };
    }
  }

  /** Marks on the floor in the sky's tones (never red: nothing here hurts). */
  private draw(shapes: readonly HazardShape[], lead: number, live: number, paint: MarkPaint) {
    const hz = this.ctx.host.hazards?.();
    if (!hz) return;
    if (this.marks === null) this.marks = hazardOwner();
    for (const shape of shapes) hz.add(this.marks, 'neutral', 'sky', { lead, live, damage: 0, shape, tint: paint });
  }

  private clearMarks() {
    if (this.marks !== null) this.ctx.host.hazards?.()?.clear(this.marks);
  }

  /** A dashed line: one block of dash, half a block of gap. */
  private dashes(a: Vec3, b: Vec3): HazardShape[] {
    const d = flat(a, b), out: HazardShape[] = [];
    for (let s = 0; s < d; s += 1.5) {
      const e = Math.min(d, s + 1), ux = (b.x - a.x) / (d || 1), uz = (b.z - a.z) / (d || 1);
      out.push({ kind: 'line', x0: a.x + ux * s, z0: a.z + uz * s, x1: a.x + ux * e, z1: a.z + uz * e, y: a.y + 0.02, width: 0.5 });
    }
    return out;
  }

  /** The gallop line: from the horse, passing within 3 blocks of the player and never through their cell, 6 past them. */
  private gallopEnd(): Vec3 {
    const b = this.body, pl = this.player().body;
    const side = { x: -this.aim.z, z: this.aim.x };
    const by = { x: pl.x + side.x * 2, z: pl.z + side.z * 2 };
    const dx = by.x - b.x, dz = by.z - b.z, d = Math.hypot(dx, dz) || 1;
    let ex = b.x + (dx / d) * (d + 6), ez = b.z + (dz / d) * (d + 6);
    // it stops on open ground, inside the meadow
    const c = this.centre(), r = Math.hypot(ex - c.x, ez - c.z), max = 27;
    if (r > max) { ex = c.x + (ex - c.x) * max / r; ez = c.z + (ez - c.z) * max / r; }
    return { x: ex, y: b.y, z: ez };
  }

  centre(): Vec3 {
    const ps = this.paddocks();
    let x = 0, z = 0;
    for (const p of ps) { x += p.x + 0.5; z += p.z + 0.5; }
    return { x: x / ps.length, y: this.ctx.plan.y0, z: z / ps.length };
  }

  // ── acts: when the machine's telegraph ends ──

  act(id: HorseAttackId) {
    const ctx = this.ctx, b = this.body, pl = this.player().body;
    const feet = { x: b.x, y: b.y, z: b.z };
    this.last = id;
    const tail = TAIL[id];
    if (tail !== undefined) { this.strike = { id, left: tail }; return; }
    this.current = null;
    switch (id) {
      case 'stamp': {
        // the hooves land: a push of 2.5 round it (1 when a positive hit met the raised hooves)
        ctx.hinder('knockback', { from: feet, shape: 'ring', radius: 3, strength: push(this.answered ? 1 : 2.5) });
        const segs = this.segments().slice(0, 2);
        if (segs.length) this.fade(segs.map(s => s.tag), FADE_SECONDS);
        break;
      }
      case 'gust': {
        // a gust along the line from its tail past the player; a positive hit on it during the swish shortens it
        const seconds = this.answered ? 1 : 3;
        const to = { x: pl.x + this.aim.x * 5, y: pl.y + 0.9, z: pl.z + this.aim.z * 5 };
        ctx.hinder('wind', { from: { x: b.x, y: b.y + 0.9, z: b.z }, to, radius: 1.5, strength: 3, seconds });
        this.busyUntil = Math.max(this.busyUntil, this.clock + MIN_TELEGRAPH + seconds);
        break;
      }
      case 'leap': {
        const mark = this.markNear();
        if (!mark) break;
        this.motion = { k: 'leap', from: { ...feet }, to: mark, t: 0, time: MIN_TELEGRAPH, peak: Math.min(LEAP_PEAK, 2 + flat(feet, mark) * 0.3) };
        this.offHome = true;
        // a landing ring 0.8 high that pushes 2 (none when it landed softly, after a positive hit on its crouch)
        if (!this.answered) ctx.hinder('horse-ring', { from: mark, speed: 8, radius: 4, height: 0.8, strength: push(2) });
        break;
      }
      case 'wave': {
        // five segments ahead of the player flicker one after another, every 0.4 s
        const segs = this.segments().slice(0, 5);
        segs.forEach((s, i) => this.queue.push({ at: this.clock + i * 0.4, tag: s.tag }));
        this.busyUntil = Math.max(this.busyUntil, this.clock + segs.length * 0.4 + MIN_TELEGRAPH + FADE_SECONDS);
        break;
      }
      case 'send': {
        const n = ctx.stage === 0 ? 1 : 2;
        const now = ctx.host.time();
        for (const m of this.sendable().slice(0, n)) SENT.set(m.id, now);
        break;
      }
      case 'dust': {
        const cells = this.churned();
        if (cells.length) ctx.hinder('dense-ground', { cells, seconds: 5, slow: 0.5 });
        break;
      }
      case 'shake': {
        if (!this.answered) ctx.hinder('horse-ring', { from: feet, speed: 8, radius: 8, height: 0.8, strength: push(1.5) });
        break;
      }
    }
  }

  /** The end of a special attack's longer telegraph: the drain or the capture lands now (law 3.6: never at its start). */
  private land(id: HorseAttackId) {
    const ctx = this.ctx, b = this.body, pl = this.player(), pb = pl.body;
    this.current = null;
    const calm = (x: number, y: number, z: number) => ctx.host.cue('horse.chime', x, y, z);
    switch (id) {
      case 'snort': {
        if (this.answered) { ctx.host.cue('horse.nicker', b.x, b.y + b.h, b.z); break; }
        const nose = { x: b.x + this.aim.x, y: b.y + 2, z: b.z + this.aim.z };
        const to = { x: pb.x, y: pb.y + pb.h / 2, z: pb.z };
        const dx = to.x - b.x, dz = to.z - b.z, d = Math.hypot(dx, dz);
        ctx.host.fx('puff', nose.x, nose.y, nose.z, 6);
        const inside = d <= 12 && (d < 0.5 || (dx * this.aim.x + dz * this.aim.z) / d >= Math.cos(15 * Math.PI / 180));
        if (inside && !blocked(this.world, nose, to)) ctx.drain(SNORT_SPIRIT);
        break;
      }
      case 'gallop': {
        const end = this.gallopTo ?? this.gallopEnd();
        this.gallopTo = null;
        this.motion = { k: 'run', to: end, speed: this.answered ? TROT_SPEED : GALLOP_SPEED, trail: !this.answered, drain: !this.answered, t: 0, max: 4 };
        this.offHome = true;
        break;
      }
      case 'panic': {
        // moving drains; standing still is the answer; a positive hit on the horse calms it
        if (!this.answered && ctx.still() < PANIC_MOVED) ctx.drain(PANIC_SPIRIT);
        else calm(pb.x, pb.y, pb.z);
        break;
      }
      case 'snaking': {
        const m = this.motion;
        const closed = m?.k === 'circle' && m.left <= 1e-6;
        if (m?.k === 'circle') this.motion = null;
        this.clearMarks();
        this.offHome = true;
        if (this.answered || !closed || !m || m.k !== 'circle') break;
        const inside = flat(pb, m.c) <= m.r && Math.abs(pb.y - m.c.y) < 2;
        if (inside && this.canCapture()) {
          pl.hold(CAPTURE_TIME);
          ctx.host.takeRandomPractice();
          ctx.host.toast('toast.horseHerds');
          this.lastCapture = this.clock;
        }
        break;
      }
    }
  }

  /** A positive hit counted on the horse: during a telegraph (or its tail) it is that attack's answer. */
  onHit() {
    if (this.current) {
      this.answered = true;
      // a soft answer stops what is already moving: the circle opens, the horse lifts its head
      if (this.current === 'snaking' && this.motion?.k === 'circle') { this.motion = null; this.clearMarks(); }
    }
  }

  // ── the floor's segments and the dust ──

  /** The run segments that fade (not fixed), nearest the player first, never the one under their feet. */
  segments(): Place[] {
    const fixed = new Map(this.ctx.plan.platforms.map(t => [t.tag, t.fixed] as const));
    const pb = this.player().body;
    return this.ctx.plan.graph.places
      .filter(p => p.kind === 'segment' && p.tag > 0 && fixed.get(p.tag) === false && !this.isOn(p, pb))
      .sort((p, q) => Math.hypot(p.x + 0.5 - pb.x, p.z + 0.5 - pb.z) - Math.hypot(q.x + 0.5 - pb.x, q.z + 0.5 - pb.z) || p.id - q.id);
  }

  private fade(tags: readonly number[], seconds: number) {
    this.ctx.hinder('fading-platforms', { tags, seconds });
    this.busyUntil = Math.max(this.busyUntil, this.clock + MIN_TELEGRAPH + seconds);
  }

  private runQueue() {
    while (this.queue.length && this.queue[0].at <= this.clock + 1e-9) {
      const q = this.queue.shift()!;
      if (!this.won) this.fade([q.tag], FADE_SECONDS);
    }
  }

  /** The floor's rhythm: from the second stage, one segment of each run fades every RHYTHM seconds. */
  private rhythmTick(dt: number) {
    if (this.ctx.stage < 1) { this.rhythm = 0; return; }
    this.rhythm += dt;
    if (this.rhythm < RHYTHM) return;
    this.rhythm = 0;
    const fixed = new Map(this.ctx.plan.platforms.map(t => [t.tag, t.fixed] as const));
    const segs = this.ctx.plan.graph.places.filter(p => p.kind === 'segment');
    const pb = this.player().body;
    const tags: number[] = [];
    for (let r = 0; r + 3 <= segs.length && r < 18; r += 3) {
      const run = segs.slice(r, r + 3).filter(p => fixed.get(p.tag) === false && !this.isOn(p, pb));
      if (run.length) tags.push(run[this.rhythmStep % run.length].tag);
    }
    this.rhythmStep++;
    if (tags.length) this.fade(tags, FADE_SECONDS);
  }

  /** The churned patch round the player's cell: the meadow or a fixed segment, never a fading one, never a placed block. */
  private churned(): number[] {
    const w = this.world, pb = this.player().body;
    if (!w) return [];
    const y = Math.floor(pb.y - 0.05), cx = Math.floor(pb.x), cz = Math.floor(pb.z), out: number[] = [];
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dz * dz > 4) continue;
      const x = cx + dx, z = cz + dz;
      if (!w.inside(x, y, z) || !w.solid(x, y, z) || w.get(x, y, z) === MAT.mist) continue;
      const i = w.idx(x, y, z);
      if (w.kindAt(i) === ExceptionKind.Placed) continue;
      out.push(i);
    }
    return out;
  }

  /** A landing mark 2.5 blocks from the player toward the horse, on ground near their height, never on them. */
  private markNear(): Vec3 | null {
    const b = this.body, pb = this.player().body;
    const base = Math.atan2(b.z - pb.z, b.x - pb.x);
    for (let k = 0; k < 8; k++) {
      const a = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 4;
      const x = pb.x + Math.cos(a) * 2.5, z = pb.z + Math.sin(a) * 2.5;
      const g = groundAt(this.world, x, z, pb.y + 1);
      if (g !== null && Math.abs(g - pb.y) <= 1.5 && flat({ x, y: 0, z }, b) <= LEAP_MAX) return { x, y: g, z };
    }
    return null;
  }

  // ── leaps: the startle, the leap home, a teleport when it is too far ──

  private leap(to: Place) {
    this.leapTo = to;
    this.go('Leaping');
  }

  /** The paddock to flee to: at least 12 from the player, the farthest the horse can reach in one leap; else the farthest. */
  farPaddock(): Place | null {
    const b = this.body, pb = this.player().body;
    const here = this.onPaddock();
    const away = this.paddocks().filter(p => p !== here && Math.hypot(p.x + 0.5 - pb.x, p.z + 0.5 - pb.z) >= 12);
    if (!away.length) return null;
    const dist = (p: Place) => Math.hypot(p.x + 0.5 - pb.x, p.z + 0.5 - pb.z);
    const reach = away.filter(p => Math.hypot(p.x + 0.5 - b.x, p.z + 0.5 - b.z) <= LEAP_MAX);
    const from = reach.length ? reach : away;
    return from.reduce((best, p) => (dist(p) > dist(best) ? p : best));
  }

  /** Back home after a landing: the paddock nearest the horse that is at least 6 from the player. */
  private homePaddock(): Place {
    const b = this.body, pb = this.player().body;
    const ok = this.paddocks().filter(p => Math.hypot(p.x + 0.5 - pb.x, p.z + 0.5 - pb.z) >= STARTLE);
    const from = ok.length ? ok : this.paddocks();
    return from.reduce((best, p) => (Math.hypot(p.x + 0.5 - b.x, p.z + 0.5 - b.z) < Math.hypot(best.x + 0.5 - b.x, best.z + 0.5 - b.z) ? p : best));
  }

  /** Leaping: the crouch and the landing mark on the far paddock, then the leap (or the teleport, beyond LEAP_MAX). */
  leapEnter() {
    this.crouchLeft = CROUCH;
    const to = this.leapTo;
    const b = this.body;
    this.ctx.host.cue('horse.paw', b.x, b.y, b.z);
    if (to) {
      const p = this.feetPoint(to);
      this.draw([{ kind: 'ring', x: p.x, y: p.y + 0.02, z: p.z, r: 1.5, grow: 0, width: 0.2, height: 0.4 }], CROUCH, 0.8, KNOCKBACK_PAINT);
    }
  }

  leapTick(dt: number) {
    if (this.crouchLeft <= 0) return;
    this.crouchLeft -= dt;
    if (this.crouchLeft > 1e-9) return;
    this.crouchLeft = 0;
    const to = this.leapTo, b = this.body;
    if (!to) return;
    const p = this.feetPoint(to);
    const d = flat(b, p);
    if (d <= LEAP_MAX) {
      this.motion = { k: 'leap', from: { x: b.x, y: b.y, z: b.z }, to: p, t: 0, time: 0.6 + d * 0.025, peak: Math.min(LEAP_PEAK, 2 + d * 0.3) };
    } else {
      // the teleport fits the startle (B2): it vanishes and reappears far from the player
      this.ctx.host.fx('shimmer', b.x, b.y + b.h / 2, b.z, 8);
      this.ctx.host.cue('core.shimmer', b.x, b.y + b.h / 2, b.z);
      b.x = p.x; b.y = p.y; b.z = p.z;
      this.ctx.host.fx('shimmer', b.x, b.y + b.h / 2, b.z, 8);
      this.home = to;
      this.landedAt = this.clock;
    }
  }

  leapDone(): boolean { return this.crouchLeft <= 0 && this.motion?.k !== 'leap'; }

  leapExit() {
    if (this.leapTo && !this.motion) this.home = this.leapTo;
    this.leapTo = null;
    this.crouchLeft = 0;
    this.clearMarks();
  }

  // ── Grazing and Gentled ──

  grazeTick(dt: number) {
    if (this.motion) return;
    const c = this.feetPoint(this.home);
    this.grazeA += dt * GRAZE_SPEED / 1.2;
    const tx = c.x + Math.cos(this.grazeA) * 1.2, tz = c.z + Math.sin(this.grazeA) * 1.2;
    glide(this.world, this.body, tx, tz, GRAZE_SPEED * 2, dt);
  }

  gentleEnter() {
    this.gentled = true;
    this.gentledLeft = GENTLED;
    this.calmReady = false;
    const b = this.body, pb = this.player().body;
    this.motion = { k: 'walk', to: { x: pb.x, y: pb.y, z: pb.z }, speed: WALK_SPEED, stop: GENTLE_NEAR, t: 0, max: GENTLED };
    // it lowers its head and blows softly: the player is right to stand still
    this.ctx.host.cue('horse.blow', b.x, b.y + b.h, b.z);
    this.ctx.host.fx('motes', pb.x, pb.y + 0.1, pb.z, 6);
  }

  gentleTick(dt: number) { this.gentledLeft -= dt; }

  gentleExit() {
    this.gentled = false;
    if (this.motion?.k === 'walk') this.motion = null;
    if (!this.onPaddock()) this.offHome = true;
  }

  // ── motions ──

  private move(dt: number) {
    const m = this.motion, b = this.body, w = this.world;
    if (!m) return;
    m.t += dt;
    if (m.k === 'leap') {
      const u = Math.min(1, m.t / m.time);
      b.x = m.from.x + (m.to.x - m.from.x) * u;
      b.z = m.from.z + (m.to.z - m.from.z) * u;
      const top = Math.max(m.from.y, m.to.y) + m.peak;
      const c = 2 * top - (m.from.y + m.to.y) / 2;
      b.y = (1 - u) * (1 - u) * m.from.y + 2 * u * (1 - u) * c + u * u * m.to.y;
      b.vx = 0; b.vy = 0; b.vz = 0;
      b.onGround = u >= 1;
      if (u >= 1) {
        this.motion = null;
        this.landedAt = this.clock;
        this.ctx.host.fx('puff', b.x, b.y, b.z, 10);
        this.ctx.host.cue('horse.land', b.x, b.y, b.z);
      }
      return;
    }
    if (m.k === 'walk' || m.k === 'run') {
      const r = glide(w, b, m.to.x, m.to.z, m.speed, dt, m.k === 'walk' ? m.stop : 0);
      if (m.k === 'run' && m.trail) this.trail.push({ x: b.x, y: b.y, z: b.z, until: this.clock + TRAIL });
      if (m.k === 'run' && m.drain) this.touchDrain();
      if (r !== 'moved' || m.t >= m.max) this.motion = null;
      return;
    }
    // the circle of Snaking: run to its edge, then round the player until it closes
    if (!m.reached) {
      const p = { x: m.c.x + Math.cos(m.a) * m.r, z: m.c.z + Math.sin(m.a) * m.r };
      const r = glide(w, b, p.x, p.z, 14, dt);
      if (r === 'placed') { this.motion = null; return; }
      if (r === 'there' || r === 'wall' || flat(b, { x: p.x, y: 0, z: p.z }) < 0.3) { m.reached = true; m.last = { x: b.x, y: b.y, z: b.z }; }
      return;
    }
    const remaining = Math.max(1e-3, m.time - m.t);
    // the last step closes the circle exactly (no float crumb leaves it open)
    const da = remaining <= dt * 1.5 ? m.left : Math.min(m.left, (m.left / remaining) * dt);
    const na = m.a + da;
    const r = glide(w, b, m.c.x + Math.cos(na) * m.r, m.c.z + Math.sin(na) * m.r, 30, dt);
    if (r === 'placed') { this.motion = null; this.ctx.host.fx('puff', b.x, b.y + 0.5, b.z, 4); return; }
    m.a = na; m.left -= da;
    const p = { x: b.x, y: b.y, z: b.z };
    // the circle is drawn as it runs, from the first hoofprint to the last: the open arc is the way out
    if (m.last) this.draw([{ kind: 'line', x0: m.last.x, z0: m.last.z, x1: p.x, z1: p.z, y: p.y + 0.02, width: 0.18 }], 0, remaining + CAPTURE_TAIL, KNOCKBACK_PAINT);
    m.last = p;
  }

  /** A player who touches the galloping horse or its dust trail drains (once per run: Deity.drain). */
  private touchDrain() {
    const b = this.body, pb = this.player().body;
    const touch = flat(pb, b) <= b.hw + pb.hw + 0.1 && pb.y < b.y + b.h && pb.y + pb.h > b.y;
    const trail = this.trail.some(t => Math.hypot(pb.x - t.x, pb.z - t.z) <= 0.5 + pb.hw && Math.abs(pb.y - t.y) < 1.5);
    if (touch || trail) this.ctx.drain(GALLOP_SPIRIT);
  }

  private runTrail() {
    if (!this.trail.length) return;
    this.trail = this.trail.filter(t => t.until > this.clock);
    const m = this.motion;
    if (m?.k !== 'run' || !m.drain) {
      // the trail still drains for its second after the horse has passed
      if (this.trail.length && this.ctx.deity.state !== 'Won') {
        const pb = this.player().body;
        if (this.trail.some(t => Math.hypot(pb.x - t.x, pb.z - t.z) <= 0.5 + pb.hw && Math.abs(pb.y - t.y) < 1.5)) this.ctx.drain(GALLOP_SPIRIT);
      }
    }
    if (Math.round(this.clock * 10) % 2 === 0) {
      const t = this.trail[this.trail.length - 1];
      if (t) this.ctx.host.fx('puff', t.x, t.y + 0.1, t.z, 2);
    }
  }

  // ── calm feedback (design requirement, owner 2026-11-05): stillness shows the player they are right ──

  private calmFeedback(dt: number) {
    const ctx = this.ctx, pb = this.player().body;
    const s = ctx.still();
    const near = ctx.distance() <= SIGHT;
    const panic = this.current === 'panic';
    this.feedback -= dt;
    if (near && (panic || ctx.distance() <= CALM_RANGE) && this.feedback <= 0) {
      this.feedback = 0.4;
      // still: the dust settles and the grass rises round their cell; moving: the dust lifts
      if (s > 0) ctx.host.fx('motes', pb.x, pb.y + 0.05, pb.z, panic ? 4 : 2);
      else if (this.stillWas >= 0.3) ctx.host.fx('puff', pb.x, pb.y + 0.05, pb.z, 3);
    }
    if (panic && s > 0 && this.stillWas === 0) ctx.host.cue('horse.settle', pb.x, pb.y, pb.z);
    this.stillWas = s;
  }

  // ── the pose the model shows ──

  private updatePose(dt: number) {
    const a = this.ctx.deity, b = this.body, pl = this.player().body, p = this.pose;
    p.t += dt;
    p.hurt = this.hurtLeft;
    const moving = Math.hypot(b.vx, b.vz);
    let want = p.yaw;
    if (this.motion && this.motion.k !== 'leap' && moving > 0.2) want = Math.atan2(b.vx, b.vz);
    else if (this.motion?.k === 'leap') want = Math.atan2(this.motion.to.x - this.motion.from.x, this.motion.to.z - this.motion.from.z);
    else if (a.state !== 'Grazing' && a.state !== 'Idle') want = Math.atan2(pl.x - b.x, pl.z - b.z);
    else if (moving > 0.05) want = Math.atan2(b.vx, b.vz);
    let dy = want - p.yaw;
    while (dy > Math.PI) dy -= 2 * Math.PI;
    while (dy < -Math.PI) dy += 2 * Math.PI;
    p.yaw += Math.sign(dy) * Math.min(Math.abs(dy), 6 * dt);
    p.gait = this.motion && this.motion.k !== 'leap' ? Math.min(1, moving / 6) : 0;
    p.stride += dt * (2 + moving * 1.2);
    const tg = this.current ?? (this.strike?.id ?? null);
    const near = this.ctx.distance() <= CALM_RANGE && this.ctx.still() > 0.3;
    const st = this.lastState;
    p.head = st === 'Grazing' || st === 'Won' ? 0.55 : this.gentled ? 0.45 : st === 'Watching' ? -0.15 : 0;
    p.ears = st === 'Watching' || near ? 1 : 0;
    p.rear = 0; p.crouch = 0; p.tail = 0; p.mane = 0; p.flare = 0; p.tremble = 0; p.swing = 0;
    if (st === 'Rallying') { p.rear = 1; p.head = -0.35; p.mane = 0.6; }
    if (st === 'Leaping' && this.crouchLeft > 0) p.crouch = 1;
    if (this.motion?.k === 'leap') { p.crouch = 0.4; p.gait = 0; }
    switch (tg) {
      case 'stamp': p.rear = 1; p.ears = 1; break;
      case 'gust': p.tail = 1; break;
      case 'leap': p.crouch = 1; break;
      case 'wave': case 'send': p.head = -0.35; p.ears = 1; break;
      case 'dust': p.crouch = 1; p.head = 0.3; break;
      case 'snort': p.head = -0.3; p.flare = 1; break;
      case 'shake': p.mane = 1; p.ears = 0; break;
      case 'gallop': p.head = 0.15; p.ears = 1; break;
      case 'panic': p.tremble = 1; p.head = -0.25; p.ears = 1; break;
      case 'snaking': p.head = 0.35; p.ears = -1; p.swing = 1; break;
      default: break;
    }
  }
}

// ───────────────────────── the machine's states and rules ─────────────────────────

const STATES: readonly CustomState[] = [
  {
    // its Idle: head down, tail swishing, walking slowly round its paddock
    name: 'Grazing', replaces: 'Idle',
    tick: (ctx, dt) => brainOf(ctx).grazeTick(dt),
    next: ctx => (ctx.distance() <= SIGHT ? 'Watching' : null),
  },
  {
    name: 'Gentled',
    enter: ctx => brainOf(ctx).gentleEnter(),
    tick: (ctx, dt) => brainOf(ctx).gentleTick(dt),
    exit: ctx => brainOf(ctx).gentleExit(),
    next: ctx => (brainOf(ctx).gentledLeft <= 1e-9 ? 'Watching' : null),
  },
  {
    // Leaping away (the startle) and the leap home: the crouch, then the great leap or the teleport
    name: 'Leaping',
    enter: ctx => brainOf(ctx).leapEnter(),
    tick: (ctx, dt) => brainOf(ctx).leapTick(dt),
    exit: ctx => brainOf(ctx).leapExit(),
    next: ctx => (brainOf(ctx).leapDone() ? 'Watching' : null),
  },
];

const RULES: readonly DeityRule[] = [{
  id: 'horse',
  tick: (ctx, dt) => brainOf(ctx).tick(dt),
  // Gentled: each positive hit counts as two (B4); during a telegraph it is also that attack's answer
  worth: ctx => { const b = brainOf(ctx); b.onHit(); return b.gentled ? 2 : 1; },
}];

// ───────────────────────── the plush model (docs/art/sky/horse.md) ─────────────────────────

const c = {
  coat: pal('plush.horse.coat.base'), dark: pal('plush.horse.coat.dark'), hi: pal('plush.horse.coat.hi'),
  mane: pal('plush.horse.mane'), eye: pal('plush.horse.eye'), shine: pal('plush.horse.shine'),
};
const T = (n: number) => n * TX;

/** A small round body under a giant head (2.2 times the body's width); about 3 blocks to the ears. */
const BODY: readonly ModelPart[] = [
  { size: [T(14), T(12), T(18)], pos: [0, T(13), 0], color: c.coat, name: 'body' },
  // the hips are pivots inside the body, so the legs swing from the joint (DECISIONS §8.5)
  ...([['FL', -4, 6], ['FR', 4, 6], ['BL', -4, -6], ['BR', 4, -6]] as const).flatMap(([n, x, z]): ModelPart[] => [
    { size: [T(1), T(1), T(1)], pos: [T(x), T(8), T(z)], color: c.coat, name: `hip${n}` },
    { size: [T(4), T(8), T(4)], pos: [0, T(-4), 0], color: c.dark, parent: `hip${n}`, name: `leg${n}` },
  ]),
  { size: [T(1), T(1), T(1)], pos: [0, T(17), T(-8)], color: c.coat, name: 'tailRoot' },
  { size: [T(4), T(12), T(4)], pos: [0, T(-4), T(-3)], color: c.mane, parent: 'tailRoot', name: 'tail', tilt: 0.5 },
];
const HEAD: readonly ModelPart[] = [
  { size: [T(1), T(1), T(1)], pos: [0, T(18), T(6)], color: c.coat, name: 'neck' },
  { size: [T(28), T(24), T(32)], pos: [0, T(14), T(4)], color: c.coat, parent: 'neck', name: 'head' },
  { size: [T(20), T(13), T(10)], pos: [0, T(-6), T(19)], color: c.hi, parent: 'head', name: 'muzzle' },
  { size: [T(3), T(3), T(1)], pos: [T(-5), T(1), T(5)], color: c.eye, parent: 'muzzle', name: 'nostrilL', inlay: true },
  { size: [T(3), T(3), T(1)], pos: [T(5), T(1), T(5)], color: c.eye, parent: 'muzzle', name: 'nostrilR', inlay: true },
  { size: [T(6), T(7), T(1)], pos: [T(-8), T(3), T(16)], color: c.eye, parent: 'head', name: 'eyeL', inlay: true },
  { size: [T(6), T(7), T(1)], pos: [T(8), T(3), T(16)], color: c.eye, parent: 'head', name: 'eyeR', inlay: true },
  { size: [T(2), T(2), T(1)], pos: [T(1), T(2), T(0.5)], color: c.shine, parent: 'eyeL', inlay: true },
  { size: [T(2), T(2), T(1)], pos: [T(1), T(2), T(0.5)], color: c.shine, parent: 'eyeR', inlay: true },
  { size: [T(5), T(9), T(4)], pos: [T(-10), T(15), T(2)], color: c.coat, parent: 'head', name: 'earL' },
  { size: [T(5), T(9), T(4)], pos: [T(10), T(15), T(2)], color: c.coat, parent: 'head', name: 'earR' },
  { size: [T(8), T(6), T(30)], pos: [0, T(14), T(-3)], color: c.mane, parent: 'head', name: 'mane' },
  { size: [T(10), T(6), T(4)], pos: [0, T(11), T(15)], color: c.mane, parent: 'head', name: 'forelock' },
];

/** Every part of the deity's model, body then head. */
export const HORSE_DEITY_PARTS: readonly ModelPart[] = [...BODY, ...HEAD];

/** Poses held at 12 fps (DECISIONS §8.5: stepped poses, smooth world position); pulses at most 2.5 Hz. */
const step12 = (t: number) => Math.floor(t * 12) / 12;
const wave = (t: number, hz: number) => Math.sin(2 * Math.PI * hz * step12(t));

/**
 * Poses the deity's parts. `root` is the model's group (it turns to `yaw`); `ratio` is hits / target: the horse's
 * sign of progress (B4) is its wide eyes softening and its ears turning forward as the gold marks gather.
 */
export function poseHorse(parts: Parts, root: THREE.Object3D | null, p: HorsePose, ratio: number) {
  const g = (n: string) => parts.get(n);
  if (root) {
    root.rotation.y = p.yaw;
    root.rotation.x = -0.35 * p.rear;
    root.scale.y = 1 - 0.1 * p.crouch;
    root.rotation.z = 0.04 * p.tremble * wave(p.t, 2.5);
  }
  const swing = wave(p.t * Math.max(0.5, p.gait) + p.stride * 0.1, 2.2) * 0.7 * p.gait;
  const front = -0.9 * p.rear;
  g('hipFL')?.rotation.set(front + swing, 0, 0);
  g('hipFR')?.rotation.set(front - swing, 0, 0);
  g('hipBL')?.rotation.set(-swing + 0.5 * p.crouch, 0, 0);
  g('hipBR')?.rotation.set(swing + 0.5 * p.crouch, 0, 0);
  g('tailRoot')?.rotation.set(0, 0.6 * p.tail * wave(p.t, 2), 0);
  const neck = g('neck');
  if (neck) {
    neck.rotation.x = p.head + 0.25 * p.crouch;
    neck.rotation.y = 0.4 * p.swing * wave(p.t, 1.5);
    neck.rotation.z = p.hurt > 0.15 ? 0.14 : 0;
  }
  // ears: forward with the pricked pose and with progress; pinned back while snaking
  const ear = Math.max(p.ears, ratio) * -0.35 + (p.ears < 0 ? 0.7 : 0);
  g('earL')?.rotation.set(ear, 0, 0.15);
  g('earR')?.rotation.set(ear, 0, -0.15);
  g('mane')?.rotation.set(0, 0, 0.15 * p.mane * wave(p.t, 2.5));
  const flare = 1 + 0.4 * p.flare;
  g('nostrilL')?.scale.set(flare, flare, 1);
  g('nostrilR')?.scale.set(flare, flare, 1);
  // the wide eyes soften: their height eases from 1 to 0.65 as the marks gather (whites never shown: plush)
  const lid = 1 - 0.35 * Math.min(1, Math.max(0, ratio)) + 0.15 * p.tremble;
  g('eyeL')?.scale.set(1, lid, 1);
  g('eyeR')?.scale.set(1, lid, 1);
}

/** The live brain nearest a model's holder (the view moves the holder to the body each frame). */
function brainAt(parts: Parts): Brain | null {
  const h = parts.get(HOLDER);
  if (!h) return null;
  let best: Brain | null = null, bestD = 4;
  for (const b of LIVE) {
    const d = Math.hypot(b.body.x - h.position.x, b.body.y - h.position.y, b.body.z - h.position.z);
    if (d < bestD) { bestD = d; best = b; }
  }
  return best;
}

// ───────────────────────── the deity ─────────────────────────

export const horseDeity: DeityDef = {
  animal: 'horse', floor: 5,
  hits: HORSE_HITS,
  telegraph: TELEGRAPH[4],
  recover: 2,
  rest: REST,
  sight: SIGHT,
  hover: null,
  teleport: true,
  get attacks() { return active ? active.offer() : HORSE_ATTACKS; },
  states: STATES,
  rules: RULES,
  // an ally grazing beside it brings calm instead of hits (B4): the brain gentles the horse every 10 s
  ally: { act: 'graze', every: ALLY_CALM_EVERY, cap: 0, calm: true },
  knock: 'kick',
  won: {
    toast: 'toast.horseWon',
    gift: 'triple-jump',
    // it changes its attitude (provisional, owner 2026-11-03): it stops leaping away, and the wind stops
    play: ctx => {
      const b = brainOf(ctx);
      b.won = true;
      b.offHome = false;
      SENT.clear();
      const body = ctx.deity.body;
      ctx.host.cue('horse.chime', body.x, body.y + body.h, body.z);
      ctx.host.fx('motes', body.x, body.y + body.h / 2, body.z, 12);
    },
  },
  model: {
    body: BODY, head: HEAD,
    // the box round the body and the giant head (ears included), within 25 % of the model's bounds
    hw: 0.9, h: 3.1,
    progress: (parts, ratio) => {
      const b = brainAt(parts);
      const root = parts.get(HOLDER)?.children[0] ?? null;
      poseHorse(parts, root, b?.pose ?? restPose(), ratio);
    },
  },
};
