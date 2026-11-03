// SkyCreatures: every deity and minion of the realm, and their touch provider (docs/architecture/SKY.md §5.2). Stub (K0): C0 builds it.

import type * as THREE from 'three';
import type { Polarity } from '../../combat/polarity';
import type { DamageKind } from '../../core/damage';
import type {
  CreatureDeps, DeityDef, FloorIndex, MinionDef, Place, SkyActor, SkyCreaturesApi, SkyFloorPlan, SkyHost, TouchTarget, Vec3,
} from '../types';

export class SkyCreatures implements SkyCreaturesApi {
  onWon: ((d: SkyActor, floor: FloorIndex) => void) | null = null;
  constructor(_root: THREE.Group, _host: SkyHost, _deps: CreatureDeps) {}
  spawnDeity(_def: DeityDef, _plan: SkyFloorPlan): SkyActor { throw new Error('SkyCreatures.spawnDeity: not built (C0)'); }
  spawnMinion(_def: MinionDef, _plan: SkyFloorPlan, _at: Place): SkyActor { throw new Error('SkyCreatures.spawnMinion: not built (C1)'); }
  owns(_id: number) { return false; }
  at(_x: number, _y: number, _z: number, _r: number) { return -1; }
  targets(): readonly TouchTarget[] { return []; }
  touch(_id: number, _polarity: Polarity, _warm: boolean, _p: Vec3, _kind: DamageKind) {}
  update(_dt: number, _floor: number) {}
  all(): readonly SkyActor[] { return []; }
  dispose() {}
}
