// Hold fast (KOALA.md B3b, 10): a ring of claw marks round the player's cell that shrinks to the cell over the
// warning, with a soft rising "mmm" from the koala. If the player is still in the cell when it closes, and no
// block stands between the koala and the player (it stops at a block, as a charge does), the attack's `capture`
// runs (the deity holds the player for CAPTURE_TIME and one practice is taken). `stopped()` is the deity's answer:
// a positive intention that landed on it meanwhile. Nothing here damages or drains.

import { hazardOwner, sketch } from './runner';
import { KNOCKBACK_PAINT } from './knockback';
import type { Effect, Hindrance, HindranceCtx, KoalaHoldParams, Telegraph, Vec3 } from '../types';

/** The closed ring: the player's cell and the edge of the next. */
export const CLOSED = 1;
const CLAWS = 8;
const CLAW_EVERY = 0.1;
const END_SECONDS = 0.3;

/** Whether the player stands in the closed ring. */
export function inClosed(ctx: HindranceCtx, p: KoalaHoldParams): boolean {
  const b = ctx.host.player().body;
  return Math.hypot(b.x - p.around.x, b.z - p.around.z) <= CLOSED + b.hw && Math.abs(b.y - p.around.y) <= 1.5;
}

class Claws implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();
  private t = 0;

  constructor(private ctx: HindranceCtx, readonly p: KoalaHoldParams, private seconds: number) {
    this.at = p.around;
    sketch(ctx, this.owner, [{ kind: 'ring', x: p.around.x, y: p.around.y, z: p.around.z, r: CLOSED, grow: 0, width: 0.1, height: 0.3 }], seconds, Infinity, KNOCKBACK_PAINT);
    ctx.host.cue('koala.mmm', p.from.x, p.from.y, p.from.z);
  }

  update(dt: number, left: number) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t += CLAW_EVERY;
    const r = CLOSED + (this.p.radius - CLOSED) * Math.max(0, left / this.seconds);
    for (let k = 0; k < CLAWS; k++) {
      const a = (k / CLAWS) * Math.PI * 2;
      this.ctx.host.fx('motes', this.at.x + Math.cos(a) * r, this.at.y + 0.1, this.at.z + Math.sin(a) * r, 1);
    }
  }

  end() { this.ctx.hazards.clear(this.owner); }
}

class Hold implements Effect {
  readonly at: Vec3;
  readonly caught: boolean = false;
  private t = 0;

  constructor(ctx: HindranceCtx, p: KoalaHoldParams) {
    this.at = p.around;
    if (p.stopped() || !inClosed(ctx, p)) return;
    const b = ctx.host.player().body;
    if (ctx.effects.shelter(p.from, { x: b.x, y: b.y + b.h / 2, z: b.z })) return;
    this.caught = true;
    p.capture();
  }

  update(dt: number): boolean {
    this.t += dt;
    return this.t < END_SECONDS;
  }

  end() {}
}

export const koalaHold: Hindrance<KoalaHoldParams> = {
  id: 'koala-hold',
  telegraph: (ctx, p, seconds) => new Claws(ctx, p, seconds),
  effect: (ctx, p) => new Hold(ctx, p),
};
