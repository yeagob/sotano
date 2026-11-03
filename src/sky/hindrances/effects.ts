// SkyEffects: the shared rules every hindrance effect goes through (docs/architecture/SKY.md §6). Stub (K0): H0 builds it.

import type { SkyEffectsApi, SkyHost, Vec3 } from '../types';

export class SkyEffects implements SkyEffectsApi {
  constructor(_host: SkyHost) {}
  push(_vx: number, _vy: number, _vz: number) {}
  slow(_f: number, _s: number) {}
  hold(_s: number) {}
  shelter(_from: Vec3, _to: Vec3) { return false; }
  mayChange(_i: number) { return false; }
  transient(_cells: readonly number[], _m: number, _seconds: number, _owner: number): number[] { return []; }
  restore(_owner: number) {}
  protect(_cells: readonly number[], _owner: number) {}
  release(_owner: number) {}
  isProtected(_i: number) { return false; }
  water(_cells: readonly number[], _owner: number): number[] { return []; }
  dry(_owner: number) {}
  update(_dt: number) {}
}
