// The sky's 'endgame' messages in Spanish: the same keys as endgame.en.ts (docs/architecture/SKY.md §12), spread into es.ts.

import type { Message } from '..';
import type { SKY_ENDGAME_EN } from './endgame.en';

export const SKY_ENDGAME_ES: { [K in keyof typeof SKY_ENDGAME_EN]: Message } = {
  // PROVISIONAL working name, like the English one (ENDGAME.md, open question 1).
  'endgame.entity.name': 'La Entidad de Púas',
  // The revelation: a faithful translation of the owner's English line, for the owner to confirm
  // (owner decision 9, docs/architecture/SKY.md §12).
  'endgame.entity.line1': 'El verdadero camino no era llegar a este lugar; el verdadero camino es ir hacia arriba.',
  'endgame.entity.line2': 'Todo este tiempo te equivocabas: tu camino era subir.',
  'toast.stairOpens': 'Se abre una escalera: sube por todos los pisos hasta la superficie',
};
