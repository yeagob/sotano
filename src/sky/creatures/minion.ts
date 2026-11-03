// The minion framework: rules, turning, ally helps, the stuck guard (docs/architecture/SKY.md §5.4). Stub (K0): C1 builds it.

import type { Polarity } from '../../combat/polarity';
import type { Rng } from '../../core/rng';
import type { DamageKind } from '../../core/damage';
import type { CreatureDeps, DeityApi, MinionApi, MinionDef, SkyActor, SkyFloorPlan, SkyHost, Vec3 } from '../types';

/** Seconds without reaching its graph target before the stuck guard acts. */
export const STUCK = 6;

export class Minion implements MinionApi {
  constructor(readonly actor: SkyActor, readonly def: MinionDef, _plan: SkyFloorPlan, _deps: CreatureDeps, _host: SkyHost, _rng: Rng) {}
  update(_dt: number, _deity: DeityApi | null, _others: readonly SkyActor[]) {}
  touch(_polarity: Polarity, _warm: boolean, _p: Vec3, _kind: DamageKind) {}
}
