// Bellow (KOALA.md B3b, 8): a ring with a clear edge forms round the Fork, then spreads at `speed` out to
// `radius`, `height` high. A player it touches has their spirit drained once through the attack's `drain`; it
// does not push. Jumping over it as it passes, or standing behind a block (a block stops a ring), lets it go by.
// The answer is the deity's (a positive intention into its chest during its own telegraph): this ring has none.

import type { MarkPaint } from '../../enemies/attacks';
import { hazardOwner, sketch } from './runner';
import type { Effect, Hindrance, HindranceCtx, KoalaBellowParams, Telegraph, Vec3 } from '../types';

/** The band's half width: how near the edge the body must be for the ring to touch it. */
const BAND = 0.5;
const START_R = 1.5;

/** The ring: the wood's darks, so it reads on the pale branches it crosses. */
export const BELLOW_PAINT: MarkPaint = {
  tell: 'mat.skywood.dark',
  live: 'mat.skywood.outline',
  reach: 'mat.skywood.base',
  motes: ['mat.skywood.base', 'mat.skywood.hi'],
};

class Swell implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, p: KoalaBellowParams, seconds: number) {
    this.at = p.from;
    sketch(ctx, this.owner, [{ kind: 'ring', x: p.from.x, y: p.from.y, z: p.from.z, r: START_R, grow: p.speed, width: 0.15, height: p.height }], seconds, 0, BELLOW_PAINT);
    ctx.host.cue('koala.rumble', p.from.x, p.from.y, p.from.z);
  }

  update() {}
  end() { this.ctx.hazards.clear(this.owner); }
}

class Wave implements Effect {
  readonly at: Vec3;
  /** The ring's radius now. */
  r = START_R;
  touched = false;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, private p: KoalaBellowParams) {
    this.at = p.from;
    const live = Math.max(0, (p.radius - START_R) / Math.max(1e-3, p.speed));
    sketch(ctx, this.owner, [{ kind: 'ring', x: p.from.x, y: p.from.y, z: p.from.z, r: START_R, grow: p.speed, width: 0.15, height: p.height }], 0, live, BELLOW_PAINT);
    ctx.host.cue('koala.bellow', p.from.x, p.from.y, p.from.z);
  }

  update(dt: number): boolean {
    const p = this.p;
    if (p.speed <= 0) return false;
    this.r = Math.min(p.radius, this.r + p.speed * dt);
    if (!this.touched) {
      const b = this.ctx.host.player().body;
      const d = Math.hypot(b.x - p.from.x, b.z - p.from.z);
      const inBand = d >= this.r - BAND - b.hw && d <= this.r + b.hw;
      const low = b.y >= p.from.y - 0.5 && b.y <= p.from.y + p.height;
      const mid = p.from.y + p.height / 2;
      if (inBand && low && !this.ctx.effects.shelter({ x: p.from.x, y: mid, z: p.from.z }, { x: b.x, y: mid, z: b.z })) {
        this.touched = true;
        p.drain();
      }
    }
    return this.r < p.radius;
  }

  end() { this.ctx.hazards.clear(this.owner); }
}

export const koalaBellow: Hindrance<KoalaBellowParams> = {
  id: 'koala-bellow',
  telegraph: (ctx, p, seconds) => new Swell(ctx, p, seconds),
  effect: (ctx, p) => new Wave(ctx, p),
};
