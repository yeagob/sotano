// The five guardian floors, bottom to top (docs/architecture/SKY.md §7.1). Registry: written once (K0), never edited again.

import type { SkyFloorGen } from '../types';
import { elephant } from './elephant';
import { horse } from './horse';
import { koala } from './koala';
import { lion } from './lion';
import { panda } from './panda';

export const SKY_FLOORS: readonly SkyFloorGen[] = [panda, koala, elephant, lion, horse];
