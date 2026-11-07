// Every deity by animal (docs/architecture/SKY.md §5.5). Registry: written once (K0), never edited again.

import type { Animal, DeityDef } from '../../types';
import { elephantDeity } from './elephant';
import { horseDeity } from './horse';
import { koalaDeity } from './koala';
import { lionDeity } from './lion';
import { pandaDeity } from './panda';

export const DEITIES: { readonly [A in Animal]: DeityDef } = {
  panda: pandaDeity,
  koala: koalaDeity,
  elephant: elephantDeity,
  lion: lionDeity,
  horse: horseDeity,
};
