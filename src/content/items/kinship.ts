import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** Half-hearts healed per projection turned to your side: a quarter heart (4 points = a half heart). */
export const KINSHIP_HEAL = 0.5;

export default defineItem({
  id: 'kinship',
  name: 'Kinship',
  description: 'Those you turned toward you walk beside you.',
  effect: 'Each projection you turn to your side heals you a quarter heart, once per room visit.',
  inspiredBy: 'Kinship with all beings (many traditions)',
  pools: { treasure: 1 },
  tags: ['emotion', 'allies'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '..aa....aa..',
      '.abba..abba.',
      '.abbbaabbba.',
      '.abbbbbbbba.',
      '..abbbbbba..',
      '...abbbba...',
      '....abba....',
      '.....aa.....',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('mat.obsidian.accent'), b: pal('path.emotion.glow') },
  },
  hooks: [
    // a new visit to a room opens its one heal again
    hook('roomEnter', (_e, api) => { api.memory().healed = 0; }, { id: 'kinship-room', priority: 200 }),
    hook('factionChange', (e, api) => {
      if (e.targetKind !== 'projection' || e.to !== 'self') return;
      const m = api.memory();
      if (m.healed) return;
      m.healed = 1;
      api.heal(KINSHIP_HEAL, 'kinship');
    }, { id: 'kinship-heal', priority: 200 }),
  ],
});
