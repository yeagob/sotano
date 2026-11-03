// No harm in the sky, owner decision 8 (docs/architecture/SKY.md §4). Stub (K0): L1 builds it.

import type { GameBus } from '../../game/events';
import type { InstallNoHarm } from '../types';

export const installNoHarm: InstallNoHarm = (_bus: GameBus) => {};
