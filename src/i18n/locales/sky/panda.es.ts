// The sky's 'panda' messages in Spanish: the same keys as panda.en.ts (docs/architecture/SKY.md §12), spread into es.ts.

import type { Message } from '..';
import type { SKY_PANDA_EN } from './panda.en';

export const SKY_PANDA_ES: { [K in keyof typeof SKY_PANDA_EN]: Message } = {
  'level.sky1': 'El asiento de bambú',
  'sky.panda.name': 'El panda gigante',
  'sky.panda.minion': 'Pandita',
  'sky.panda.won': 'El panda se posa en su asiento, bien despierto y amable.',
};
