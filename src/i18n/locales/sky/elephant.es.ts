// The sky's 'elephant' messages in Spanish: the same keys as elephant.en.ts (docs/architecture/SKY.md §12), spread into es.ts.

import type { Message } from '..';
import type { SKY_ELEPHANT_EN } from './elephant.en';

export const SKY_ELEPHANT_ES: { [K in keyof typeof SKY_ELEPHANT_EN]: Message } = {
};
