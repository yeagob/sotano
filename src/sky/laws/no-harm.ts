// No harm in the sky, owner decision 8 (docs/architecture/SKY.md §4). Stub (K0): L1 builds it.
// The law changed (owner, 2026-11-03): no health loss in the sky, see docs/architecture/SKY.md section 19.

import type { GameBus } from '../../game/events';
import type { InstallNoHarm } from '../types';

export const installNoHarm: InstallNoHarm = (_bus: GameBus) => {};
