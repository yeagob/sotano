// Eucalyptus haze (KOALA.md B3b, 6): a pale circle round the player's cell, a haze rising inside it with a growing
// hiss, then a burst. A player inside the circle when it bursts has their spirit drained through the attack's
// `drain` (the deity's ctx.drain, so the spirit gate decides). A block does not stop it: it is air, not a lob.
// A positive shot into the circle during the warning scatters the haze into drifting leaves: no drain.
// Nothing here pushes, slows or damages.

import type { MarkPaint } from '../../enemies/attacks';
import { hazardOwner, sketch } from './runner';
import type { Effect, Hindrance, HindranceCtx, KoalaHazeParams, PositiveHit, Telegraph, Vec3 } from '../types';

/** The haze reaches this high over the circle, for the burst and for a shot into it. */
const HIGH = 2.5;
const BURST_SECONDS = 0.6;
const RISE_EVERY = 0.15;

/** The pale circle: eucalyptus leaf greys, the haze its lightest. */
export const HAZE_PAINT: MarkPaint = {
  tell: 'mat.skyleaf.hi',
  live: 'mat.skyleaf.base',
  reach: 'mat.skyleaf.hi',
  motes: ['mat.skyleaf.hi', 'mat.mist.hi'],
};

/** Runs a positive shot scattered, by the start's params. */
const SCATTERED = new WeakSet<KoalaHazeParams>();

/** Whether the player's body is inside the circle and under its haze. */
export function inHaze(ctx: HindranceCtx, p: KoalaHazeParams): boolean {
  const b = ctx.host.player().body;
  return Math.hypot(b.x - p.at.x, b.z - p.at.z) <= p.radius + b.hw && b.y >= p.at.y - 1 && b.y <= p.at.y + HIGH;
}

class Circle implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();
  private t = 0;
  private k = 0;

  constructor(private ctx: HindranceCtx, readonly p: KoalaHazeParams, seconds: number) {
    this.at = p.at;
    sketch(ctx, this.owner, [{ kind: 'ring', x: p.at.x, y: p.at.y, z: p.at.z, r: p.radius, grow: 0, width: 0.12, height: 0.4 }], seconds, Infinity, HAZE_PAINT);
    ctx.host.cue('koala.chew', p.at.x, p.at.y, p.at.z);
  }

  update(dt: number) {
    if (SCATTERED.has(this.p)) return;
    this.t -= dt;
    if (this.t > 0) return;
    this.t += RISE_EVERY;
    // the haze rises in a fixed walk round the circle
    const a = (this.k++ * 2.399) % (Math.PI * 2), r = this.p.radius * (0.3 + 0.6 * ((this.k * 0.618) % 1));
    this.ctx.host.fx('motes', this.at.x + Math.cos(a) * r, this.at.y + 0.3, this.at.z + Math.sin(a) * r, 1);
    if (this.k % 4 === 0) this.ctx.host.cue('koala.hiss', this.at.x, this.at.y, this.at.z);
  }

  end() { this.ctx.hazards.clear(this.owner); }
}

class Burst implements Effect {
  readonly at: Vec3;
  private t = 0;

  constructor(ctx: HindranceCtx, p: KoalaHazeParams) {
    this.at = p.at;
    if (SCATTERED.delete(p)) return;
    ctx.host.fx('puff', p.at.x, p.at.y + 1, p.at.z, 10);
    if (inHaze(ctx, p)) p.drain();
  }

  update(dt: number): boolean {
    this.t += dt;
    return this.t < BURST_SECONDS;
  }

  end() {}
}

export const koalaHaze: Hindrance<KoalaHazeParams> = {
  id: 'koala-haze',
  telegraph: (ctx, p, seconds) => new Circle(ctx, p, seconds),
  effect: (ctx, p) => new Burst(ctx, p),
  answer: (ctx, e, hit: PositiveHit) => {
    if (!(e instanceof Circle) || SCATTERED.has(e.p)) return false;
    const p = e.p;
    if (Math.hypot(hit.x - p.at.x, hit.z - p.at.z) > p.radius || hit.y < p.at.y - 0.5 || hit.y > p.at.y + HIGH + 1) return false;
    SCATTERED.add(p);
    ctx.host.fx('motes', hit.x, hit.y, hit.z, 8);
    ctx.host.cue('koala.rustle', hit.x, hit.y, hit.z);
    return true;
  },
};
