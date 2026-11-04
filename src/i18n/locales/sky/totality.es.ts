// The sky's 'totality' messages in Spanish: the same keys as totality.en.ts (docs/architecture/SKY.md §12), spread into es.ts.

import type { Message } from '..';
import type { SKY_TOTALITY_EN } from './totality.en';

export const SKY_TOTALITY_ES: { [K in keyof typeof SKY_TOTALITY_EN]: Message } = {
  'level.totality.lower': 'Totalidad inferior: el aire enrarecido',
  'level.totality.mid': 'Totalidad media: el vacío',
  'level.totality.upper': 'Totalidad superior: la aproximación solar',
  'toast.sunClosed': 'El Sol todavía no está abierto.',
};
