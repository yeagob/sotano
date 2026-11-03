// Gold marks where each positive hit landed on a deity (docs/architecture/SKY.md §5.3). Stub (K0): C0 builds it.

import type * as THREE from 'three';
import type { SkyHitMarksApi, Vec3 } from '../types';

export class HitMarks implements SkyHitMarksApi {
  constructor(_parent: THREE.Object3D, _max: number) {}
  add(_local: Vec3) {}
  clear() {}
  dispose() {}
}
