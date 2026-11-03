// The sky's 'core' messages in Spanish: the same keys as core.en.ts (docs/architecture/SKY.md §12), spread into es.ts.

import type { Message } from '..';
import type { SKY_CORE_EN } from './core.en';

export const SKY_CORE_ES: { [K in keyof typeof SKY_CORE_EN]: Message } = {
};
