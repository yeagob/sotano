// Law 3.2, player blocks are the exception (docs/architecture/SKY.md §4). Stub (K0): L1 builds it.

import type { GameBus } from '../../game/events';
import type { OwnershipApi, PositiveHit, SkyHost, SkyWorldApi } from '../types';

export class Ownership implements OwnershipApi {
  constructor(_world: SkyWorldApi, _host: SkyHost) {}
  install(_bus: GameBus) {}
  positiveHit(_hit: PositiveHit) { return false; }
}
