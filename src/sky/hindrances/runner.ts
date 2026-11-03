// The hindrance runner: telegraph first, always (docs/architecture/SKY.md §6, law 3.6). Stub (K0): H0 builds it.

import type { ActiveHindrance, Hindrance, HindranceCtx, HindranceRunnerApi, PositiveHit } from '../types';

export class HindranceRunner implements HindranceRunnerApi {
  constructor(_ctx: HindranceCtx) {}
  start<P>(_h: Hindrance<P>, _p: P, _telegraph: number, _source: number) { return -1; }
  update(_dt: number) {}
  positiveHit(_hit: PositiveHit) { return false; }
  active(): readonly ActiveHindrance[] { return []; }
  stop(_run: number) {}
  clear() {}
}
