// Structure table: each floor of a run gets a rock theme (densities of pockets and veins).

import { table } from '../../core/tables';

export interface RockTheme { id: string; pockets: number; ore: number; hard: number }

export const ROCK_THEME = table<RockTheme>('rock-theme', 'structure', [
  { value: { id: 'plain', pockets: 0.12, ore: 0.07, hard: 0.1 }, weight: 4 },
  { value: { id: 'earthy', pockets: 0.28, ore: 0.05, hard: 0.05 }, weight: 2 },
  { value: { id: 'veined', pockets: 0.08, ore: 0.18, hard: 0.1 }, weight: 2 },
  { value: { id: 'hardened', pockets: 0.05, ore: 0.07, hard: 0.35 }, weight: 2, minFloor: 2 },
]);
