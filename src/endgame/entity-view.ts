// The Spiked Entity's model: dark, low and wide, countless stepped spikes (docs/architecture/SKY.md §11). Stub (K0): EN builds it.

import type * as THREE from 'three';
import type { EntityViewApi, SpikedEntityApi } from '../sky/types';

export class EntityView implements EntityViewApi {
  constructor(_root: THREE.Object3D) {}
  sync(_e: SpikedEntityApi, _dt: number) {}
  shimmer() {}
  dispose() {}
}
