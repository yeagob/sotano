// The sky's 'elephant' messages in Spanish: the same keys as elephant.en.ts (docs/architecture/SKY.md §12), spread into es.ts.
// Provisional: 'level.sky3' is a first Spanish name for the owner to confirm; the two toasts are provisional with the attacks.

import type { Message } from '..';
import type { SKY_ELEPHANT_EN } from './elephant.en';

export const SKY_ELEPHANT_ES: { [K in keyof typeof SKY_ELEPHANT_EN]: Message } = {
  'level.sky3': 'Los canales',
  'toast.sky3.won': 'El elefante deja su peso en el suelo. El agua se va de los canales.',
  'toast.sky3.lift': 'La trompa te sujeta y se queda con una práctica.',
};
