// The sky's 'koala' messages in Spanish: the same keys as koala.en.ts (docs/architecture/SKY.md §12), spread into es.ts.
// Provisional: 'level.sky2' is a first Spanish name for the owner to confirm.

import type { Message } from '..';
import type { SKY_KOALA_EN } from './koala.en';

export const SKY_KOALA_ES: { [K in keyof typeof SKY_KOALA_EN]: Message } = {
  'level.sky2': 'Las ramas',
};
