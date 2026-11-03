// Wind: a gust volume that pushes the player while they stand in it (docs/architecture/SKY.md §6). The
// telegraph draws the gust's lanes on the floor in the sky's leaf tones; the gust pushes steadily along
// its line for its length, unless a solid block in the line shelters the player from the source. A
// positive shot at the source ends the gust, whether it is still a warning or already blowing. Nothing
// here damages.

import type { MarkPaint, Shape as HazardShape } from '../../enemies/attacks';
import { hazardOwner, sketch } from './runner';
import { near, playerPoint } from './effects';
import type { Effect, Hindrance, HindranceCtx, PositiveHit, Telegraph, Vec3, WindParams } from '../types';

/** A positive shot counts as the answer when it lands this close to the source (the tail of the gust). */
export const ANSWER_RANGE = 3;
/** Half the width of a lane. */
const LANE_WIDTH = 0.15;
/** The lanes beside the centre line sit this far off it, as a share of the gust's radius. */
const SIDE_LANE = 0.6;

/** The leaf tones: the sky's leaf in its darks, so the lanes read on the pale stone (the warning is the dark,
 *  the gust the outline, the deepest). */
export const WIND_PAINT: MarkPaint = {
  tell: 'mat.skyleaf.dark',
  live: 'mat.skyleaf.outline',
  reach: 'mat.skyleaf.base',
  motes: ['mat.skyleaf.dark', 'mat.skyleaf.base'],
};

/** Gusts a positive shot has cancelled before they began (keyed by the start's params). */
const CANCELLED = new WeakSet<WindParams>();

/** The gust's centre line and its two side lanes, on the floor at the source's height. */
/** The lanes a gust draws on the floor: its centre line and one either side. */
export function gustLanes(p: WindParams): HazardShape[] {
  const dx = p.to.x - p.from.x, dz = p.to.z - p.from.z, len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len, nz = dx / len, off = p.radius * SIDE_LANE;
  const lane = (s: number): HazardShape => ({
    kind: 'line',
    x0: p.from.x + nx * s, z0: p.from.z + nz * s,
    x1: p.to.x + nx * s, z1: p.to.z + nz * s,
    y: p.from.y, width: LANE_WIDTH,
  });
  return [lane(0), lane(off), lane(-off)];
}

/** Distance from a point to a segment in three dimensions. */
function segmentDistance(q: Vec3, a: Vec3, b: Vec3): number {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, l2 = dx * dx + dy * dy + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy + (q.z - a.z) * dz) / l2)) : 0;
  return Math.hypot(q.x - (a.x + dx * t), q.y - (a.y + dy * t), q.z - (a.z + dz * t));
}

class Lanes implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: WindParams, seconds: number) {
    this.at = p.from;
    sketch(ctx, this.owner, gustLanes(p), seconds, Infinity, WIND_PAINT);
  }

  update() {}

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

class Gust implements Effect {
  readonly at: Vec3;
  private t = 0;
  private stopped: boolean;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: WindParams, cancelled: boolean) {
    this.at = p.from;
    this.stopped = cancelled;
    if (!cancelled) sketch(ctx, this.owner, gustLanes(p), 0, p.seconds, WIND_PAINT);
  }

  /** A positive shot ends the gust now. */
  stop() {
    this.stopped = true;
    this.ctx.hazards.clear(this.owner);
  }

  update(dt: number): boolean {
    if (this.stopped) return false;
    this.t += dt;
    if (this.t >= this.p.seconds) return false;
    const { from, to, radius, strength } = this.p;
    const pl = playerPoint(this.ctx.host);
    const hw = this.ctx.host.player().body.hw;
    if (segmentDistance(pl, from, to) > radius + hw) return true;
    if (this.ctx.effects.shelter(from, pl)) return true;
    const dx = to.x - from.x, dz = to.z - from.z, len = Math.hypot(dx, dz);
    if (len === 0) return true;
    const k = strength * dt;
    this.ctx.effects.push((dx / len) * k, 0, (dz / len) * k);
    return true;
  }

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

export const wind: Hindrance<WindParams> = {
  id: 'wind',
  telegraph: (ctx, p, seconds) => new Lanes(ctx, p, seconds),
  effect: (ctx, p) => new Gust(ctx, p, CANCELLED.delete(p)),
  answer: (_ctx, e, hit: PositiveHit) => {
    if (e instanceof Lanes) {
      if (!near(hit, e.p.from, ANSWER_RANGE)) return false;
      CANCELLED.add(e.p);
      e.end();
      return true;
    }
    if (e instanceof Gust) {
      if (!near(hit, e.p.from, ANSWER_RANGE)) return false;
      e.stop();
      return true;
    }
    return false;
  },
};
