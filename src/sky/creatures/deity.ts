// The deity framework: the machine, stages, positive hits, levitation, teleport, won (docs/architecture/SKY.md §5.3). Stub (K0): C0 builds it.

import type { Polarity } from '../../combat/polarity';
import type { Rng } from '../../core/rng';
import type { DamageKind } from '../../core/damage';
import type { CreatureDeps, DeityApi, DeityDef, SkyActor, SkyFloorPlan, SkyHost, Stage, Vec3 } from '../types';

export { TELEGRAPH, MIN_TELEGRAPH } from '../types';
/** Seconds of the core states with a fixed length. */
export const HURT = 0.3;
export const RALLY = 2;
/** Teleport far never lands within this distance of the player. */
export const TELEPORT_MIN = 12;

/** stage = min(2, ⌊3·hits / target⌋). */
export const stageOf = (hits: number, target: number): Stage => Math.min(2, Math.floor(3 * hits / target)) as Stage;

export class Deity implements DeityApi {
  readonly stage: Stage = 0;
  readonly won = false;
  onWon: ((d: SkyActor) => void) | null = null;
  constructor(readonly actor: SkyActor, readonly def: DeityDef, _plan: SkyFloorPlan, _deps: CreatureDeps, _host: SkyHost, _rng: Rng) {}
  update(_dt: number) {}
  touch(_polarity: Polarity, _warm: boolean, _p: Vec3, _kind: DamageKind) {}
}
