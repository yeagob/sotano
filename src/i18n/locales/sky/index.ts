// The sky's catalog parts by name, for tests and reviews (docs/architecture/SKY.md §12). Written once (K0).

import { SKY_CORE_EN } from './core.en';
import { SKY_CORE_ES } from './core.es';
import { SKY_ELEPHANT_EN } from './elephant.en';
import { SKY_ELEPHANT_ES } from './elephant.es';
import { SKY_ENDGAME_EN } from './endgame.en';
import { SKY_ENDGAME_ES } from './endgame.es';
import { SKY_HORSE_EN } from './horse.en';
import { SKY_HORSE_ES } from './horse.es';
import { SKY_KOALA_EN } from './koala.en';
import { SKY_KOALA_ES } from './koala.es';
import { SKY_LION_EN } from './lion.en';
import { SKY_LION_ES } from './lion.es';
import { SKY_PANDA_EN } from './panda.en';
import { SKY_PANDA_ES } from './panda.es';
import { SKY_TOTALITY_EN } from './totality.en';
import { SKY_TOTALITY_ES } from './totality.es';

export const SKY_PARTS_EN = {
  core: SKY_CORE_EN, panda: SKY_PANDA_EN, koala: SKY_KOALA_EN, elephant: SKY_ELEPHANT_EN,
  lion: SKY_LION_EN, horse: SKY_HORSE_EN, totality: SKY_TOTALITY_EN, endgame: SKY_ENDGAME_EN,
} as const;
export const SKY_PARTS_ES = {
  core: SKY_CORE_ES, panda: SKY_PANDA_ES, koala: SKY_KOALA_ES, elephant: SKY_ELEPHANT_ES,
  lion: SKY_LION_ES, horse: SKY_HORSE_ES, totality: SKY_TOTALITY_ES, endgame: SKY_ENDGAME_ES,
} as const;
