// The hindrance runner: telegraph first, always (docs/architecture/SKY.md §6, law 3.6). A hindrance starts
// with its telegraph; its effect begins only when the telegraph has run its full length, and ends by
// itself. Positive intentions are offered to every running hindrance, oldest first. No effect damages:
// this module sequences what the effects do and nothing more.

import type { MarkPaint, Shape, Strike } from '../../enemies/attacks';
import {
  MIN_TELEGRAPH, type ActiveHindrance, type Effect, type Hindrance, type HindranceCtx, type HindranceId,
  type HindranceRunnerApi, type PositiveHit, type Telegraph,
} from '../types';

/** A fresh owner for one hindrance stage's hazards. Owners are negative: actor ids are positive, so the two never meet. */
let lastOwner = -1;
export function hazardOwner(): number {
  return lastOwner--;
}

/** Draws sky shapes on the hazards in their tint for `live` seconds after `lead`. A tinted strike never hits. */
export function sketch(ctx: HindranceCtx, owner: number, shapes: readonly Shape[], lead: number, live: number, paint: MarkPaint) {
  for (const shape of shapes) {
    const s: Strike = { lead, live, damage: 0, shape, tint: paint };
    ctx.hazards.add(owner, 'neutral', 'sky', s);
  }
}

interface Run {
  id: number;
  hid: HindranceId;
  source: number;
  left: number;
  tell: Telegraph;
  /** Set when the telegraph has ended and the effect has begun. */
  effect: Effect | null;
  build: () => Effect;
  answer: (e: Effect | Telegraph, hit: PositiveHit) => boolean;
}

export class HindranceRunner implements HindranceRunnerApi {
  private runs: Run[] = [];
  private nextId = 0;

  constructor(private ctx: HindranceCtx) {}

  start<P>(h: Hindrance<P>, p: P, telegraph: number, source: number): number {
    const seconds = Math.max(MIN_TELEGRAPH, telegraph);
    const run: Run = {
      id: this.nextId++,
      hid: h.id,
      source,
      left: seconds,
      tell: h.telegraph(this.ctx, p, seconds),
      effect: null,
      build: () => h.effect(this.ctx, p),
      answer: (e, hit) => (h.answer ? h.answer(this.ctx, e, hit) : false),
    };
    this.runs.push(run);
    return run.id;
  }

  update(dt: number) {
    for (const run of [...this.runs]) {
      if (run.effect === null) {
        run.left -= dt;
        if (run.left > 0) { run.tell.update(dt, run.left); continue; }
        run.tell.end();
        run.effect = run.build();
      }
      if (!run.effect.update(dt)) this.finish(run);
    }
  }

  positiveHit(hit: PositiveHit): boolean {
    // a beam's repeat ticks are not new intentions (SKY.md §5.7): only a warm touch answers
    if (!hit.warm) return false;
    for (const run of [...this.runs]) {
      if (run.answer(run.effect ?? run.tell, hit)) return true;
    }
    return false;
  }

  active(): readonly ActiveHindrance[] {
    return this.runs.map((r): ActiveHindrance => ({
      run: r.id,
      id: r.hid,
      source: r.source,
      phase: r.effect === null ? 'telegraph' : 'effect',
      left: r.effect === null ? Math.max(0, r.left) : 0,
    }));
  }

  stop(run: number) {
    const r = this.runs.find(x => x.id === run);
    if (r) this.finish(r);
  }

  clear() {
    const all = this.runs;
    this.runs = [];
    for (const r of all) (r.effect ?? r.tell).end();
  }

  private finish(run: Run) {
    (run.effect ?? run.tell).end();
    this.runs = this.runs.filter(r => r !== run);
  }
}
