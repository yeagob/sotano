// Koala lob: something drops from the Fork onto warm marks (KOALA.md B3 Leaf drop, B3b Joey ride). The telegraph
// draws a small ring on each mark with motes falling over it; the effect drops on each mark that is left. A
// bundle of leaves that lands on the player shoves them off the mark and down; the joey rides them (a Ride:
// half-height jumps, no slow) for `ride` seconds. A solid block over the player stops a lob (lobs stop at solid
// blocks), and a positive shot that meets a falling bundle, over its mark, scatters it. Nothing here damages.

import type { MarkPaint } from '../../enemies/attacks';
import { hazardOwner, sketch } from './runner';
import { Ride } from './koala-hug';
import type { Effect, Hindrance, HindranceCtx, KoalaLobParams, PositiveHit, Telegraph, Vec3 } from '../types';

/** Blocks above its mark where a lob starts its fall (a roof under this shelters). */
export const DROP = 6;
/** The leaves' shove: off the mark, and down (B3: it pushes the player down about a block). */
const SHOVE = 3;
const DOWN = 4;
/** The mark's ring, and how close to it the player's body counts as on it. */
const MARK_R = 0.45;
/** A shot this close to a mark's column, sideways, meets its bundle. */
const MEET = 0.9;
const LEAF_SECONDS = 0.4;
const FALL_MOTES = 0.25;

/** The marks: warm leaf tones on the wood, darker than the branch they lie on. */
export const LOB_PAINT: MarkPaint = {
  tell: 'mat.skyleaf.dark',
  live: 'mat.skyleaf.outline',
  reach: 'mat.skyleaf.base',
  motes: ['mat.skyleaf.base', 'mat.skyleaf.hi'],
};

/** Marks a positive shot scattered during the warning, by the start's params. */
const SCATTERED = new WeakMap<KoalaLobParams, Set<number>>();

/** Whether the player's body stands on a mark (feet at the mark's height, within its ring). */
export function onMark(ctx: HindranceCtx, m: Vec3): boolean {
  const b = ctx.host.player().body;
  return Math.hypot(b.x - m.x, b.z - m.z) <= MARK_R + b.hw && b.y >= m.y - 0.6 && b.y <= m.y + 1.5;
}

class Marks implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();
  private t = 0;

  constructor(private ctx: HindranceCtx, readonly p: KoalaLobParams, seconds: number) {
    this.at = p.marks[0] ?? { x: 0, y: 0, z: 0 };
    sketch(ctx, this.owner, p.marks.map(m => ({ kind: 'ring' as const, x: m.x, y: m.y, z: m.z, r: MARK_R, grow: 0, width: 0.1, height: 0.3 })), seconds, Infinity, LOB_PAINT);
    ctx.host.cue(p.ride > 0 ? 'koala.joey' : 'koala.shake', this.at.x, this.at.y + DROP, this.at.z);
  }

  update(dt: number) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t += FALL_MOTES;
    const gone = SCATTERED.get(this.p);
    this.p.marks.forEach((m, i) => { if (!gone?.has(i)) this.ctx.host.fx('motes', m.x, m.y + DROP * 0.5, m.z, 1); });
  }

  end() { this.ctx.hazards.clear(this.owner); }
}

class Drop implements Effect {
  readonly at: Vec3;
  private t = 0;
  private ride: Ride | null = null;

  constructor(ctx: HindranceCtx, p: KoalaLobParams) {
    this.at = p.marks[0] ?? { x: 0, y: 0, z: 0 };
    const gone = SCATTERED.get(p);
    SCATTERED.delete(p);
    const b = ctx.host.player().body;
    const head = { x: b.x, y: b.y + b.h, z: b.z };
    let landed = false;
    p.marks.forEach((m, i) => {
      if (gone?.has(i)) return;
      ctx.host.fx('puff', m.x, m.y, m.z, 5);
      if (landed || !onMark(ctx, m)) return;
      if (ctx.effects.shelter({ x: m.x, y: m.y + DROP, z: m.z }, head)) return;
      landed = true;
      if (p.ride > 0) { this.ride = new Ride(ctx, p.ride, false); return; }
      let dx = b.x - m.x, dz = b.z - m.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.05) { dx /= d; dz /= d; } else { dx = 1; dz = 0; }
      ctx.effects.push(dx * SHOVE, -DOWN, dz * SHOVE);
    });
  }

  update(dt: number): boolean {
    this.t += dt;
    if (this.ride) return this.ride.update(dt);
    return this.t < LEAF_SECONDS;
  }

  end() { this.ride?.off(); }
}

export const koalaLob: Hindrance<KoalaLobParams> = {
  id: 'koala-lob',
  telegraph: (ctx, p, seconds) => new Marks(ctx, p, seconds),
  effect: (ctx, p) => new Drop(ctx, p),
  answer: (ctx, e, hit: PositiveHit) => {
    if (!(e instanceof Marks)) return false;
    const gone = SCATTERED.get(e.p) ?? new Set<number>();
    const i = e.p.marks.findIndex((m, k) => !gone.has(k) && Math.hypot(hit.x - m.x, hit.z - m.z) <= MEET && hit.y >= m.y - 0.5 && hit.y <= m.y + DROP);
    if (i < 0) return false;
    gone.add(i);
    SCATTERED.set(e.p, gone);
    const m = e.p.marks[i];
    ctx.host.fx('motes', hit.x, hit.y, hit.z, 6);
    ctx.host.cue('koala.rustle', m.x, hit.y, m.z);
    return true;
  },
};
