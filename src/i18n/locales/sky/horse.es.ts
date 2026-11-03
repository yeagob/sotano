// The sky's 'horse' messages in Spanish: the same keys as horse.en.ts (docs/architecture/SKY.md §12), spread into es.ts.
// Provisional name of sky floor 5 ("El prado"), for the owner to confirm.

import type { Message } from '..';
import type { SKY_HORSE_EN } from './horse.en';

export const SKY_HORSE_ES: { [K in keyof typeof SKY_HORSE_EN]: Message } = {
  'level.sky5': 'El prado',
};
