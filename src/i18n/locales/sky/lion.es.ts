// The sky's 'lion' messages in Spanish: the same keys as lion.en.ts (docs/architecture/SKY.md §12), spread into es.ts.

import type { Message } from '..';
import type { SKY_LION_EN } from './lion.en';

export const SKY_LION_ES: { [K in keyof typeof SKY_LION_EN]: Message } = {
};
