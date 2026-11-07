// The sky's 'core' messages in Spanish: the same keys as core.en.ts (docs/architecture/SKY.md §12), spread into es.ts.

import type { Message } from '..';
import type { SKY_CORE_EN } from './core.en';

export const SKY_CORE_ES: { [K in keyof typeof SKY_CORE_EN]: Message } = {
  'level.sky': 'El firmamento',
  'level.skyDeck': 'La cubierta',
  'toast.skyEnter': 'Estás en el cielo. Nada de aquí te quita salud.',
  'toast.skyLeave': 'Caes de vuelta a la copa del árbol.',
  'toast.skyPuff': 'Solo una buena intención llega hasta aquí. Lo demás se disipa.',
  'toast.gateOpens': 'El camino hacia arriba se abre.',
  'toast.towerDown': 'La torre se derrumba.',
  'sky.won': 'El guardián cede.',
};
