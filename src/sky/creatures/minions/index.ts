// Every minion kind by animal (docs/architecture/SKY.md §5.5). Registry: written once (K0), never edited again.

import type { Animal, MinionDef } from '../../types';
import { elephantMinion } from './elephant';
import { horseMinion } from './horse';
import { koalaMinion } from './koala';
import { lionMinion } from './lion';
import { pandaMinion } from './panda';

export const MINIONS: { readonly [A in Animal]: MinionDef } = {
  panda: pandaMinion,
  koala: koalaMinion,
  elephant: elephantMinion,
  lion: lionMinion,
  horse: horseMinion,
};
