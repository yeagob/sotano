// The Sun over the threshold, the one warmth that is not a threat (provisional) (docs/architecture/SKY.md §11). Stub (K0): TT builds it.

import type * as THREE from 'three';
import type { SkyViewApi, Vec3 } from '../types';

export class SunView implements SkyViewApi {
  constructor(_root: THREE.Object3D) {}
  update(_eye: Vec3, _dt: number) {}
  dispose() {}
}
