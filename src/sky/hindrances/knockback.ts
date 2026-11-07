// Knockback: an impulse on the player's body along the shown arc (docs/architecture/SKY.md §6). The
// telegraph draws the arc on the floor in the sky's dust tones; the effect pushes once when the player
// stands in it, unless a solid block between the source and the player shelters them. A positive shot
// at the source during the telegraph softens the kick to 0.4 of its push. Nothing here damages.

import type { MarkPaint, Shape as HazardShape } from '../../enemies/attacks';
import { hazardOwner, sketch } from './runner';
import { near, playerPoint } from './effects';
import type {
  Effect, Hindrance, HindranceCtx, KnockbackParams, PositiveHit, Telegraph, Vec3,
} from '../types';

/** How long the kick's effect lasts, in seconds (the push itself is one impulse). */
export const KICK_SECONDS = 0.6;
/** The vertical share of the impulse: the arc goes up as it goes out. */
const ARC_UP = 0.45;
/** The push of a kick that a positive shot softened (SKY.md §6). */
export const SOFT = 0.4;
/** A positive shot counts as the answer when it lands this close to the source. */
export const ANSWER_RANGE = 3;
/** Half the width of a line kick and of its drawn arc. */
const HALF_WIDTH = 0.15;
/** The cone's half angle, in degrees. */
const CONE = 40;
const CONE_RAYS = [-40, -20, 0, 20, 40] as const;
const CONE_COS = Math.cos(CONE * Math.PI / 180);

/** The dust tones: the sky's wood in its darks. The arc must read on the pale stone it lands on (the warning
 *  is the dark, the live arc the outline, the deepest), so the marks are darker than the matter they cross. */
export const KNOCKBACK_PAINT: MarkPaint = {
  tell: 'mat.skywood.dark',
  live: 'mat.skywood.outline',
  reach: 'mat.skywood.base',
  motes: ['mat.skywood.base', 'mat.skywood.dark'],
};

/** Kicks whose push a positive shot has softened (keyed by the start's params: one start, one kick). */
const SOFTENED = new WeakSet<KnockbackParams>();

/** The aim: the horizontal direction of `dir`, or +x when it has none. */
function aimOf(p: KnockbackParams): [number, number] {
  if (!p.dir) return [1, 0];
  const l = Math.hypot(p.dir.x, p.dir.z);
  return l > 0 ? [p.dir.x / l, p.dir.z / l] : [1, 0];
}

/** The arc a kick draws on the floor: a ring, a line or the five rays of a cone. */
export function kickShapes(p: KnockbackParams): HazardShape[] {
  const f = p.from, r = p.radius;
  if (p.shape === 'ring') return [{ kind: 'ring', x: f.x, y: f.y, z: f.z, r, grow: 0, width: HALF_WIDTH, height: 1.2 }];
  const [ax, az] = aimOf(p);
  if (p.shape === 'line') return [{ kind: 'line', x0: f.x, z0: f.z, x1: f.x + ax * r, z1: f.z + az * r, y: f.y, width: HALF_WIDTH }];
  const a0 = Math.atan2(az, ax);
  return CONE_RAYS.map((deg): HazardShape => {
    const a = a0 + deg * Math.PI / 180;
    return { kind: 'line', x0: f.x, z0: f.z, x1: f.x + Math.cos(a) * r, z1: f.z + Math.sin(a) * r, y: f.y, width: HALF_WIDTH };
  });
}

/** Whether the player's body (its middle, `hw` wide) is in the kick's reach. */
function reaches(p: KnockbackParams, pl: Vec3, hw: number): boolean {
  const dx = pl.x - p.from.x, dz = pl.z - p.from.z, d = Math.hypot(dx, dz);
  const [ax, az] = aimOf(p);
  const along = dx * ax + dz * az;
  if (p.shape === 'ring') return d <= p.radius + hw;
  if (p.shape === 'line') return along >= 0 && along <= p.radius + hw && Math.abs(dx * az - dz * ax) <= HALF_WIDTH + hw;
  return d <= p.radius + hw && (d === 0 || along >= d * CONE_COS);
}

/** The unit direction the push takes: away from the source in a ring, along the aim in a line or a cone. */
function pushOf(p: KnockbackParams, pl: Vec3): [number, number] {
  if (p.shape === 'ring') {
    const dx = pl.x - p.from.x, dz = pl.z - p.from.z, d = Math.hypot(dx, dz);
    if (d > 0) return [dx / d, dz / d];
  }
  return aimOf(p);
}

class Warn implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: KnockbackParams, seconds: number) {
    this.at = p.from;
    sketch(ctx, this.owner, kickShapes(p), seconds, Infinity, KNOCKBACK_PAINT);
  }

  update() {}

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

class Kick implements Effect {
  readonly at: Vec3;
  private t = 0;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, p: KnockbackParams, soft: boolean) {
    this.at = p.from;
    sketch(ctx, this.owner, kickShapes(p), 0, KICK_SECONDS, KNOCKBACK_PAINT);
    const pl = playerPoint(ctx.host);
    if (!reaches(p, pl, ctx.host.player().body.hw)) return;
    if (ctx.effects.shelter(p.from, pl)) return;
    const [ux, uz] = pushOf(p, pl);
    const k = p.strength * (soft ? SOFT : 1);
    ctx.effects.push(ux * k, k * ARC_UP, uz * k);
  }

  update(dt: number): boolean {
    this.t += dt;
    return this.t < KICK_SECONDS;
  }

  end() {
    this.ctx.hazards.clear(this.owner);
  }
}

export const knockback: Hindrance<KnockbackParams> = {
  id: 'knockback',
  telegraph: (ctx, p, seconds) => new Warn(ctx, p, seconds),
  effect: (ctx, p) => new Kick(ctx, p, SOFTENED.delete(p)),
  answer: (_ctx, e, hit: PositiveHit) => {
    if (!(e instanceof Warn) || !near(hit, e.p.from, ANSWER_RANGE)) return false;
    SOFTENED.add(e.p);
    return true;
  },
};
