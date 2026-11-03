// Law 3.8, the only way up is inside the tree (docs/architecture/SKY.md §4). Stub (K0): L2 builds it.

import type { FloorIndex, OutsideWatchApi, SkyHost, SkyTreePlan, Tower } from '../types';

export class OutsideWatch implements OutsideWatchApi {
  constructor(_host: SkyHost, _tree: SkyTreePlan, _knock: (tower: Tower, floor: FloorIndex) => void) {}
  update(_dt: number) {}
}
