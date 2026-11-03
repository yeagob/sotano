// SkyRealm: the sky's set, its plans and every sky system in their update order (docs/architecture/SKY.md §2.5). Stub (K0): R1 builds it.

import type * as THREE from 'three';
import type { GameBus } from '../game/events';
import { buildSkyLayout } from './layout';
import type { Cell, PositiveHit, SkyCreaturesApi, SkyHost, SkyPlans, SkyRealmApi, SkyRealmSet, SkySetFactory, Vec3 } from './types';

export class SkyRealm implements SkyRealmApi {
  static create(host: SkyHost, _root: THREE.Group, makeSet: SkySetFactory): SkyRealm {
    const plans = buildSkyLayout((...path) => host.fork(...path));
    return new SkyRealm(makeSet(plans.layout), plans);
  }
  readonly creatures: SkyCreaturesApi | null = null;
  private constructor(readonly set: SkyRealmSet, readonly plans: SkyPlans) {}
  update(_dt: number) {}
  stream(_eye: Vec3) {}
  atmosphere(_eye: Vec3, _fogColor: THREE.Color, _fog: THREE.Fog, _stars: THREE.Object3D) {}
  install(_bus: GameBus) {}
  placeAt(at: Cell): Cell { return at; }
  positiveHitsBlock(_hit: PositiveHit) { return false; }
  floorAt(_y: number) { return 0; }
  dispose() {}
}
