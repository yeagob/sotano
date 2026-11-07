// The horse's ring: a low band that spreads from where the hooves land and pushes outward once as it passes
// (docs/design/not-built/sky/guardians/HORSE.md, B3 "Leap and land" and B3b "Mane shake"). Unlike the knockback's
// ring, which reaches its whole radius at once, this one grows at `speed` and is only `height` blocks tall, so the
// player answers it by jumping the edge as it passes, or by standing behind a block. The telegraph draws its full
// reach in the dust tones; a positive shot at the source during the telegraph calms it (no ring). Nothing here
// damages: the push is the hindrance's whole effect, and a player pushed off a segment falls unhurt.

import type { Shape as HazardShape } from '../../enemies/attacks';
import { hazardOwner, sketch } from './runner';
import { near, playerPoint } from './effects';
import { KNOCKBACK_PAINT } from './knockback';
import type { Effect, Hindrance, HindranceCtx, HorseRingParams, PositiveHit, Telegraph, Vec3 } from '../types';

/** A positive shot counts as the answer when it lands this close to the source. */
export const ANSWER_RANGE = 3;
/** Half the width of the band. */
export const BAND = 0.35;
/** The push's lift, as a share of its strength: the band lifts the player a little as it throws them out. */
const LIFT = 0.35;

/** Rings a positive shot calmed during their warning (keyed by the start's params). */
const CALMED = new WeakSet<HorseRingParams>();

function ringShape(p: HorseRingParams, grow: number): HazardShape {
  return { kind: 'ring', x: p.from.x, y: p.from.y, z: p.from.z, r: grow > 0 ? 0 : p.radius, grow, width: BAND, height: p.height };
}

class Warn implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: HorseRingParams, seconds: number) {
    this.at = p.from;
    sketch(ctx, this.owner, [ringShape(p, 0)], seconds, Infinity, KNOCKBACK_PAINT);
  }

  update() {}

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

class Band implements Effect {
  readonly at: Vec3;
  /** The band's radius now. */
  r = 0;
  private pushed = false;
  private calm: boolean;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: HorseRingParams) {
    this.at = p.from;
    this.calm = CALMED.delete(p);
    if (!this.calm) sketch(ctx, this.owner, [ringShape(p, p.speed)], 0, p.radius / Math.max(1e-6, p.speed), KNOCKBACK_PAINT);
  }

  update(dt: number): boolean {
    if (this.calm || !(this.p.speed > 0)) return false;
    const was = this.r;
    this.r = Math.min(this.p.radius, this.r + this.p.speed * dt);
    const b = this.ctx.host.player().body;
    const dx = b.x - this.p.from.x, dz = b.z - this.p.from.z, d = Math.hypot(dx, dz);
    // a jump over the band lets it pass under the feet; a player on a lower or higher platform is not touched
    const under = b.y >= this.p.from.y - 0.5 && b.y < this.p.from.y + this.p.height;
    if (!this.pushed && under && d + b.hw >= was - BAND && d - b.hw <= this.r + BAND) {
      this.pushed = true;
      const from = { x: this.p.from.x, y: this.p.from.y + 0.4, z: this.p.from.z };
      if (!this.ctx.effects.shelter(from, playerPoint(this.ctx.host))) {
        const ux = d > 1e-6 ? dx / d : 1, uz = d > 1e-6 ? dz / d : 0;
        this.ctx.effects.push(ux * this.p.strength, this.p.strength * LIFT, uz * this.p.strength);
      }
    }
    return this.r < this.p.radius;
  }

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

export const horseRing: Hindrance<HorseRingParams> = {
  id: 'horse-ring',
  telegraph: (ctx, p, seconds) => new Warn(ctx, p, seconds),
  effect: (ctx, p) => new Band(ctx, p),
  answer: (_ctx, e, hit: PositiveHit) => {
    if (!(e instanceof Warn) || !near(hit, e.p.from, ANSWER_RANGE)) return false;
    CALMED.add(e.p);
    e.end();
    return true;
  },
};
