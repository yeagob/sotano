// The sky's 'elephant' messages in Spanish: the same keys as elephant.en.ts (docs/architecture/SKY.md §12), spread into es.ts.
// Provisional: 'level.sky3' is a first Spanish name for the owner to confirm.

import type { Message } from '..';
import type { SKY_ELEPHANT_EN } from './elephant.en';

export const SKY_ELEPHANT_ES: { [K in keyof typeof SKY_ELEPHANT_EN]: Message } = {
  'level.sky3': 'Los canales',
};
