// The Earth below, a sphere seen from Totality's void (docs/architecture/SKY.md §11). Stub (K0): TT builds it.

import type * as THREE from 'three';
import type { SkyViewApi, Vec3 } from '../types';

export class EarthView implements SkyViewApi {
  constructor(_root: THREE.Object3D) {}
  update(_eye: Vec3, _dt: number) {}
  dispose() {}
}
