// The sky's 'koala' messages in Spanish: the same keys as koala.en.ts (docs/architecture/SKY.md §12), spread into es.ts.

import type { Message } from '..';
import type { SKY_KOALA_EN } from './koala.en';

export const SKY_KOALA_ES: { [K in keyof typeof SKY_KOALA_EN]: Message } = {
};
