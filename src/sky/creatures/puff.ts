// Law 3.3: a touch that is not positive goes out in a small puff (docs/architecture/SKY.md §4). Stub (K0): C0 builds it.

import type { PuffApi, SkyHost, Vec3 } from '../types';

export class Puff implements PuffApi {
  readonly shown = false;
  constructor(_host: SkyHost) {}
  at(_p: Vec3) {}
}
