// The Roots' call (issue #295, docs/design/built/levels/roots/CALL.md): from mastery level 50, at the start of every
// run, what the Roots lay comes to the player by itself. Keys, bombs, hearts, the practices on their pedestals and what
// the free chests hold rise, fly to the player and are absorbed by the same rules as a touch. The Sanctuary's practice
// never answers: its sitting is still done by hand.
//
// Pure movement and bookkeeping, no THREE and no game: the game hands it the pickups the Roots laid and the rules of
// touching them, and calls `update` each simulation step. An object that cannot be absorbed (a red heart at full
// health, a layered heart with no room) stays where it lies and is asked again later; one refused on arrival is left
// at the player's feet. Nothing vanishes.

import { rootsRewards } from '../content/tables/roots-mastery';

/** What the call reads and moves of a pickup (`entities/pickups.ts`). */
export interface CallPickup {
  type: string;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  flying: boolean;
  taken: boolean;
  delay: number;
  /** Set while the call carries it: the pickups' own fall and the touch leave it alone. */
  homing?: boolean;
}

/** Whether a run carved at this mastery level calls: from level 50 (ROOTS_CALL_AT), never in the sandbox or the lab. */
export function callActive(level: number, sandbox: boolean): boolean {
  return !sandbox && rootsRewards(level).rootsCall;
}

/**
 * Whether the call opens this chest of floor 0 and draws what it holds: the Roots' free chests only (`draws`). A
 * Sanctuary's chest (`meditation`, its practice earned by a sitting) and a Boundary's guarded chest never answer.
 */
export function chestAnswersCall(spec: { readonly meditation?: boolean; readonly guard?: boolean; readonly draws?: unknown; readonly keys: number }): boolean {
  return !spec.meditation && !spec.guard && spec.draws !== undefined && spec.keys === 0;
}

/** The kinds of pickup the call answers to. Parts and flasks are the player's own, never the Roots'. */
export const CALL_TYPES: ReadonlySet<string> = new Set(['key', 'bomb', 'heart', 'item']);

/** Seconds after the run is revealed before the call begins. */
export const CALL_WAIT = 1.2;
/** Seconds between two loose objects leaving their places. */
export const CALL_STAGGER = 0.12;
/** Seconds a practice waits after the last one arrived (its banner closes first). */
export const CALL_ITEM_GAP = 0.5;
/** Seconds after the call begins before the first practice sets off: its toast is read first, and the loose things lead. */
export const CALL_FIRST_ITEM = 3.5;
/** Seconds between two looks at what is left (a heart refused at full health may be wanted later). */
export const CALL_RETRY = 0.5;
/** Seconds an object rises before it heads for the player. */
export const RISE_TIME = 0.35;
/** Blocks it rises. */
export const RISE = 1.2;
/** Its speed when it turns to the player, its acceleration and its top speed, in blocks a second. */
export const FLY_SPEED = 3;
export const FLY_ACCEL = 16;
export const FLY_MAX = 26;
/** It is absorbed within this distance of the player's chest. */
export const ARRIVE = 0.7;
/** A flight never lasts longer: it is absorbed where it is. */
export const FLY_LIMIT = 5;
/** The player's chest above the feet, where the objects head. */
export const CHEST_HEIGHT = 1.0;

/** What the game tells the call each step. */
export interface CallHost {
  /** The player's feet. */
  readonly player: { readonly x: number; readonly y: number; readonly z: number };
  /** Whether the player is in the Roots' band: only there does the call send anything new. */
  readonly inRoots: boolean;
  /** Whether a practice may set off now (no banner, card or window open). */
  readonly calm: boolean;
  /** Whether this pickup could be absorbed now, with no side effect. */
  canAbsorb(p: CallPickup): boolean;
  /** Absorbs it by the touch rules (takes it on success). False: it was refused. */
  absorb(p: CallPickup): boolean;
  /** An object leaves its place (for a trail or a sound). */
  launched?(p: CallPickup): void;
}

interface Flight { p: CallPickup; t: number }

export class RootsCall {
  private readonly waiting: CallPickup[] = [];
  private readonly flying: Flight[] = [];
  private wait = CALL_WAIT;
  private stagger = 0;
  private itemGap = 0;
  private retry = 0;
  /** Whether the call has begun (the run has been revealed for CALL_WAIT seconds). */
  begun = false;

  /** `laid`: the pickups the Roots laid at run start. Only the kinds of CALL_TYPES are kept. */
  constructor(laid: Iterable<CallPickup>) {
    for (const p of laid) this.add(p);
  }

  /** One more object of the Roots: a free chest's content, or a pedestal's practice redrawn. */
  add(p: CallPickup) {
    if (!CALL_TYPES.has(p.type) || p.taken || this.waiting.includes(p) || this.flying.some(f => f.p === p)) return;
    this.waiting.push(p);
  }

  /** A pedestal's pickup was replaced by another (a redrawn Roots practice): the new one is called in its place. */
  replace(old: CallPickup, next: CallPickup | null) {
    if (!this.holds(old)) return;
    const i = this.waiting.indexOf(old);
    if (i >= 0) this.waiting.splice(i, 1);
    if (next) this.add(next);
  }

  /** What the call is carrying now. */
  get inFlight(): readonly CallPickup[] { return this.flying.map(f => f.p); }

  /** Whether the call is still carrying or waiting on anything. */
  get pending(): number { return this.waiting.filter(p => !p.taken).length + this.flying.length; }

  /** Whether this pickup is one the call answers to (waiting or in flight). */
  holds(p: CallPickup): boolean { return this.waiting.includes(p) || this.flying.some(f => f.p === p); }

  /**
   * One step. Returns true on the step the call begins, so the game can open the free chests and say it once.
   * Objects already in flight always land, even if the player left the Roots; new ones set off only in the Roots.
   */
  update(dt: number, host: CallHost): boolean {
    let began = false;
    if (!this.begun) {
      this.wait -= dt;
      if (this.wait > 0) return false;
      this.begun = began = true;
      this.itemGap = CALL_FIRST_ITEM;
    }
    this.fly(dt, host);
    this.stagger -= dt; this.itemGap -= dt; this.retry -= dt;
    for (let i = this.waiting.length - 1; i >= 0; i--) if (this.waiting[i].taken) this.waiting.splice(i, 1);
    if (!host.inRoots || this.retry > 0) return began;
    const itemInFlight = this.flying.some(f => f.p.type === 'item');
    // nearest first, so the room the player stands in answers before the far ones
    const order = [...this.waiting].sort((a, b) => dist(a, host.player) - dist(b, host.player));
    let sent = false, refused = false;
    for (const p of order) {
      if (p.delay > 0) continue;
      if (p.type === 'item') {
        if (itemInFlight || this.itemGap > 0 || !host.calm || sent) continue;
      } else if (this.stagger > 0) continue;
      if (!host.canAbsorb(p)) { refused = true; continue; }
      this.launch(p, host);
      if (p.type === 'item') { this.itemGap = Infinity; sent = true; } else this.stagger = CALL_STAGGER;
      break;
    }
    // what cannot be absorbed waits where it lies; it is asked again a little later
    if (!sent && refused && !this.flying.length) this.retry = CALL_RETRY;
    return began;
  }

  private launch(p: CallPickup, host: CallHost) {
    this.waiting.splice(this.waiting.indexOf(p), 1);
    p.homing = true;
    p.flying = false;
    p.vx = 0; p.vy = 0; p.vz = 0;
    this.flying.push({ p, t: 0 });
    host.launched?.(p);
  }

  private fly(dt: number, host: CallHost) {
    const tx = host.player.x, ty = host.player.y + CHEST_HEIGHT, tz = host.player.z;
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const f = this.flying[i], p = f.p;
      if (p.taken) { this.flying.splice(i, 1); p.homing = false; continue; }
      f.t += dt;
      if (f.t < RISE_TIME) {
        // it lifts from its place first, easing out, so the player sees it answer
        const k = dt / RISE_TIME;
        p.y += RISE * k * 2 * (1 - f.t / RISE_TIME);
      } else {
        const dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, d = Math.hypot(dx, dy, dz) || 1;
        const speed = Math.min(FLY_MAX, FLY_SPEED + FLY_ACCEL * (f.t - RISE_TIME));
        const step = Math.min(d, speed * dt);
        p.x += dx / d * step; p.y += dy / d * step; p.z += dz / d * step;
        p.vx = dx / d * speed; p.vy = dy / d * speed; p.vz = dz / d * speed;
      }
      const close = Math.hypot(tx - p.x, ty - p.y, tz - p.z) <= ARRIVE;
      if (!close && f.t < FLY_LIMIT) continue;
      this.flying.splice(i, 1);
      p.homing = false;
      if (p.type === 'item') this.itemGap = CALL_ITEM_GAP;
      if (host.absorb(p)) continue;
      // refused on arrival: it drops at the player's feet and stays there, a normal pickup again
      p.x = tx; p.y = host.player.y + 0.6; p.z = tz;
      p.vx = 0; p.vy = 2; p.vz = 0;
      p.flying = true;
    }
  }
}

function dist(p: { x: number; y: number; z: number }, q: { x: number; y: number; z: number }) {
  return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
}
