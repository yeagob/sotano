// Paralysis: a ring that grows from its source at a set speed and holds a grounded player it passes (docs/architecture/
// SKY.md §6). The telegraph draws the ring's full reach on the floor; holding the aim on the source for half a
// second of the warning halves that reach. The effect grows the ring at `speed` until it reaches its radius; a
// grounded player it sweeps over is held once (`hold`: no walking, aiming and shooting kept), and a player in the
// air lets it pass under them. A positive shot at the source halves the hold. Nothing here damages.

import type { MarkPaint, Shape as HazardShape } from '../../enemies/attacks';
import { hazardOwner, sketch } from './runner';
import { near } from './effects';
import { KNOCKBACK_PAINT } from './knockback';
import type { Effect, Hindrance, HindranceCtx, ParalysisParams, PositiveHit, Telegraph, Vec3 } from '../types';

/** Seconds of aim on the source, during the warning, that halve the ring. */
export const AIM_HOLD = 0.5;
/** The aim counts as on the source within this half-angle (radians, about 8°). */
export const AIM_CONE = 0.14;
/** A positive shot counts as the answer when it lands this close to the source. */
export const ANSWER_RANGE = 3;
/** The share of the hold left after a positive shot. */
export const SHORT = 0.5;
/** Half the width of the ring's band, and its height for the hold. */
const BAND = 0.3;
const HEIGHT = 1.2;

/** The sky's dust tones, the same as the knockback's arc: the ring reads on the pale stone. */
export const PARALYSIS_PAINT: MarkPaint = KNOCKBACK_PAINT;

const HALVED = new WeakSet<ParalysisParams>();
const SHORTENED = new WeakSet<ParalysisParams>();

/** The ring's reach for this run: halved when the aim held on the source. */
const reachOf = (p: ParalysisParams): number => (HALVED.has(p) ? p.radius / 2 : p.radius);

function ringShape(p: ParalysisParams, r: number, grow: number): HazardShape {
  return { kind: 'ring', x: p.from.x, y: p.from.y, z: p.from.z, r, grow, width: BAND, height: HEIGHT };
}

class Warn implements Telegraph {
  readonly at: Vec3;
  /** Seconds the aim has held on the source. */
  aimed = 0;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: ParalysisParams, seconds: number) {
    this.at = p.from;
    this.draw(seconds);
    ctx.host.cue('core.grumble', p.from.x, p.from.y, p.from.z);
  }

  private draw(seconds: number) {
    this.ctx.hazards.clear(this.owner);
    sketch(this.ctx, this.owner, [ringShape(this.p, 0, this.p.speed)], seconds, reachOf(this.p) / Math.max(1e-6, this.p.speed), PARALYSIS_PAINT);
  }

  /** Whether the player's aim points at the source now. */
  private aiming(): boolean {
    const pl = this.ctx.host.player();
    const dx = this.p.from.x - pl.eye.x, dy = this.p.from.y - pl.eye.y, dz = this.p.from.z - pl.eye.z;
    const d = Math.hypot(dx, dy, dz), a = Math.hypot(pl.aim.x, pl.aim.y, pl.aim.z);
    if (d < 1e-6 || a < 1e-6) return false;
    return (dx * pl.aim.x + dy * pl.aim.y + dz * pl.aim.z) / (d * a) >= Math.cos(AIM_CONE);
  }

  update(dt: number, left: number) {
    if (HALVED.has(this.p)) return;
    this.aimed = this.aiming() ? this.aimed + dt : 0;
    if (this.aimed < AIM_HOLD) return;
    HALVED.add(this.p);
    this.ctx.host.fx('gold', this.p.from.x, this.p.from.y + 0.5, this.p.from.z);
    this.draw(left);
  }

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

class Ring implements Effect {
  readonly at: Vec3;
  /** The ring's radius now. */
  r = 0;
  private reach: number;
  private held = false;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: ParalysisParams) {
    this.at = p.from;
    this.reach = reachOf(p);
    HALVED.delete(p);
    sketch(ctx, this.owner, [ringShape(p, 0, p.speed)], 0, this.reach / Math.max(1e-6, p.speed), PARALYSIS_PAINT);
  }

  update(dt: number): boolean {
    if (!(this.p.speed > 0)) return false;
    const was = this.r;
    this.r = Math.min(this.reach, this.r + this.p.speed * dt);
    const b = this.ctx.host.player().body;
    const d = Math.hypot(b.x - this.p.from.x, b.z - this.p.from.z);
    const level = b.y >= this.p.from.y - 1 && b.y <= this.p.from.y + HEIGHT;
    if (!this.held && b.onGround && level && d + b.hw >= was - BAND && d - b.hw <= this.r + BAND) {
      this.held = true;
      this.ctx.effects.hold(this.p.hold * (SHORTENED.has(this.p) ? SHORT : 1));
    }
    return this.r < this.reach;
  }

  end() {
    this.ctx.hazards.clear(this.owner);
    SHORTENED.delete(this.p);
  }
}

export const paralysis: Hindrance<ParalysisParams> = {
  id: 'paralysis',
  telegraph: (ctx, p, seconds) => new Warn(ctx, p, seconds),
  effect: (ctx, p) => new Ring(ctx, p),
  answer: (_ctx, e, hit: PositiveHit) => {
    if (!(e instanceof Warn) && !(e instanceof Ring)) return false;
    if (SHORTENED.has(e.p) || !near(hit, e.p.from, ANSWER_RANGE)) return false;
    SHORTENED.add(e.p);
    return true;
  },
};
