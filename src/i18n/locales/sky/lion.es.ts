// The sky's 'lion' messages in Spanish: the same keys as lion.en.ts (docs/architecture/SKY.md §12), spread into es.ts.
// 'La llanura' is the Spanish working name for sky floor 4 (owner to confirm with 'The plain').

import type { Message } from '..';
import type { SKY_LION_EN } from './lion.en';

export const SKY_LION_ES: { [K in keyof typeof SKY_LION_EN]: Message } = {
  'level.sky4': 'La llanura',
  'sky.lion.name': 'El león',
  'sky.lion.minion': 'Un león de la manada',
  'toast.skyLionWon': 'El león se tumba, y su manada se tumba con él.',
  'toast.skyLionScruff': 'El león te sujeta por la nuca y se queda con una de tus prácticas.',
};
