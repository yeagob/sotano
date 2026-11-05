// Dense ground: marked cells slow the feet on them (docs/architecture/SKY.md §6). No block changes: the cells are
// marked (glassy motes over them through the warning and while dense), and a grounded player standing on one is
// slowed to `slow` of their pace, refreshed each tick so the slow ends the moment they step off or the effect ends.
// A positive shot at a dense cell returns it to plain ground at once. Nothing here damages.

import { centreOf, cellUnderFeet, hitsCell } from './effects';
import type { DenseGroundParams, Effect, Hindrance, HindranceCtx, PositiveHit, Telegraph, Vec3 } from '../types';

/** Seconds each slow lasts; the effect refreshes it every tick the player stands on dense ground. */
export const SLOW_REFRESH = 0.2;
/** Seconds between the glassy motes over the marked cells. */
const SHINE_EVERY = 0.4;

/** Cells a positive shot returned during the telegraph, by the start's params. */
const CLEARED = new WeakMap<DenseGroundParams, Set<number>>();

function clearOf(p: DenseGroundParams): Set<number> {
  let s = CLEARED.get(p);
  if (!s) { s = new Set(); CLEARED.set(p, s); }
  return s;
}

/** The marked cells shine: a mote over each, every `SHINE_EVERY` seconds. */
class Shine {
  private t = 0;
  constructor(private ctx: HindranceCtx, private cells: () => Iterable<number>) {}
  update(dt: number) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t += SHINE_EVERY;
    const w = this.ctx.host.world();
    for (const i of this.cells()) {
      const [x, y, z] = w.coords(i);
      this.ctx.host.fx('shimmer', x + 0.5, y + 1.02, z + 0.5, 1);
    }
  }
}

class Mark implements Telegraph {
  readonly at: Vec3;
  private shine: Shine;

  constructor(ctx: HindranceCtx, readonly p: DenseGroundParams) {
    this.at = centreOf(ctx.host, p.cells);
    this.shine = new Shine(ctx, () => p.cells.filter(i => !CLEARED.get(p)?.has(i)));
    ctx.host.cue('core.shimmer', this.at.x, this.at.y, this.at.z);
  }

  update(dt: number) { this.shine.update(dt); }
  end() {}
}

class Dense implements Effect {
  readonly at: Vec3;
  readonly cells: Set<number>;
  private t = 0;
  private shine: Shine;

  constructor(private ctx: HindranceCtx, private p: DenseGroundParams) {
    const cleared = CLEARED.get(p);
    CLEARED.delete(p);
    this.cells = new Set(p.cells.filter(i => !cleared?.has(i)));
    this.at = centreOf(ctx.host, p.cells);
    this.shine = new Shine(ctx, () => this.cells);
  }

  update(dt: number): boolean {
    this.t += dt;
    if (this.t >= this.p.seconds) return false;
    this.shine.update(dt);
    if (this.ctx.host.player().body.onGround && this.cells.has(cellUnderFeet(this.ctx.host))) this.ctx.effects.slow(this.p.slow, SLOW_REFRESH);
    return true;
  }

  end() { this.cells.clear(); }
}

export const denseGround: Hindrance<DenseGroundParams> = {
  id: 'dense-ground',
  telegraph: (ctx, p) => new Mark(ctx, p),
  effect: (ctx, p) => new Dense(ctx, p),
  answer: (ctx, e, hit: PositiveHit) => {
    const live = e instanceof Dense ? [...e.cells] : e instanceof Mark ? e.p.cells.filter(i => !CLEARED.get(e.p)?.has(i)) : [];
    const i = live.find(c => hitsCell(ctx.host, hit, c));
    if (i === undefined) return false;
    if (e instanceof Dense) e.cells.delete(i); else if (e instanceof Mark) clearOf(e.p).add(i);
    ctx.host.fx('gold', hit.x, hit.y, hit.z);
    return true;
  },
};
