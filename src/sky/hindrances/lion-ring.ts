// The lion's ring (docs/design/not-built/sky/guardians/LION.md B3, B3b; B4): a ring of a set height that spreads
// from its source at a set speed. The telegraph draws its full reach on the floor in the lion's mane tones; the
// effect grows it and, the first time its band passes a grounded player at its level, pushes them away from the
// source (the pounce's landing) and/or calls `touch` once (the Dusk call's drain). A player in the air lets it pass
// under them, and a solid block between the source and the player stops it there (a wall of player blocks is
// cover). A positive shot at the source during the warning or the spread ends it. Nothing here damages.

import type { MarkPaint, Shape as HazardShape } from '../../enemies/attacks';
import { hazardOwner, sketch } from './runner';
import { near, playerPoint } from './effects';
import type { Effect, Hindrance, HindranceCtx, LionRingParams, PositiveHit, Telegraph, Vec3 } from '../types';

/** A positive shot counts as the answer when it lands this close to the source. */
export const ANSWER_RANGE = 3;
/** Half the width of the ring's band. */
const BAND = 0.3;
/** The vertical share of a push: the landing lifts the player a little as it moves them. */
const PUSH_UP = 0.45;

/** The lion's mane in its darks, so the ring reads on the pale stone without taking a colour of harm. */
export const LION_RING_PAINT: MarkPaint = {
  tell: 'plush.lion.mane.base',
  live: 'plush.lion.mane.dark',
  reach: 'plush.lion.mane.hi',
  motes: ['plush.lion.felt.hi', 'plush.lion.mane.hi'],
};

/** Rings a positive shot ended during their warning (keyed by the start's params). */
const ENDED = new WeakSet<LionRingParams>();

const ringShape = (p: LionRingParams): HazardShape =>
  ({ kind: 'ring', x: p.from.x, y: p.from.y, z: p.from.z, r: 0, grow: p.speed, width: BAND, height: p.height });

class Warn implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: LionRingParams, seconds: number) {
    this.at = p.from;
    sketch(ctx, this.owner, [ringShape(p)], seconds, p.radius / Math.max(1e-6, p.speed), LION_RING_PAINT);
  }

  update() {}

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

class Ring implements Effect {
  readonly at: Vec3;
  /** The ring's radius now. */
  r = 0;
  private done = false;
  private stopped: boolean;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: LionRingParams, ended: boolean) {
    this.at = p.from;
    this.stopped = ended || !(p.speed > 0);
    if (!this.stopped) sketch(ctx, this.owner, [ringShape(p)], 0, p.radius / p.speed, LION_RING_PAINT);
  }

  stop() {
    this.stopped = true;
    this.ctx.hazards.clear(this.owner);
  }

  update(dt: number): boolean {
    if (this.stopped) return false;
    const was = this.r;
    this.r = Math.min(this.p.radius, this.r + this.p.speed * dt);
    const b = this.ctx.host.player().body;
    const dx = b.x - this.p.from.x, dz = b.z - this.p.from.z, d = Math.hypot(dx, dz);
    const level = b.y >= this.p.from.y - 1 && b.y <= this.p.from.y + this.p.height;
    if (!this.done && b.onGround && level && d + b.hw >= was - BAND && d - b.hw <= this.r + BAND) {
      this.done = true;
      if (!this.ctx.effects.shelter(this.p.from, playerPoint(this.ctx.host))) {
        if (this.p.push > 0) {
          const [ux, uz] = d > 1e-6 ? [dx / d, dz / d] : [1, 0];
          this.ctx.effects.push(ux * this.p.push, this.p.push * PUSH_UP, uz * this.p.push);
        }
        this.p.touch?.();
      }
    }
    return this.r < this.p.radius;
  }

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

export const lionRing: Hindrance<LionRingParams> = {
  id: 'lion-ring',
  telegraph: (ctx, p, seconds) => new Warn(ctx, p, seconds),
  effect: (ctx, p) => new Ring(ctx, p, ENDED.delete(p)),
  answer: (_ctx, e, hit: PositiveHit) => {
    if (e instanceof Warn) {
      if (!near(hit, e.p.from, ANSWER_RANGE)) return false;
      ENDED.add(e.p);
      e.end();
      return true;
    }
    if (e instanceof Ring) {
      if (!near(hit, e.p.from, ANSWER_RANGE)) return false;
      e.stop();
      return true;
    }
    return false;
  },
};
