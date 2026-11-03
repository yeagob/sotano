// The plush models of sky creatures, built from ModelPart through buildModel (docs/architecture/SKY.md §5.1). Stub (K0): C0 builds it.

import type * as THREE from 'three';
import type { CreatureViewApi, DeityModel, MinionModel, Parts, SkyActor } from '../types';

export class CreatureView implements CreatureViewApi {
  constructor(_root: THREE.Object3D) {}
  add(_a: SkyActor, _model: DeityModel | MinionModel) {}
  remove(_id: number) {}
  parts(_id: number): Parts | null { return null; }
  update(_dt: number, _actors: readonly SkyActor[]) {}
  dispose() {}
}
