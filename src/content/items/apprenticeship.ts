import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

/** Half-hearts healed by each brew and each cook: a quarter heart. */
export const APPRENTICE_HEAL = 0.5;

export default defineItem({
  id: 'apprenticeship',
  name: 'Apprenticeship',
  description: 'The hands learn the table before the head does.',
  effect: 'Every brew and cook heals you a quarter heart. Brewed flasks come out iced: a potion that lasts rooms lasts one room more.',
  inspiredBy: 'The craft apprenticeship (guild tradition)',
  pools: { treasure: 1 },
  tags: ['mind', 'tables'],
  color: pal('path.mind.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '.....cc.....',
      '....c..c....',
      '....c..c....',
      '...aaaaaa...',
      '..abbbbbba..',
      '.abbbbbbbba.',
      '.abbcbbbbba.',
      '..abbbbbba..',
      '...aaaaaa...',
      '............',
      '............',
    ],
    palette: { a: pal('mat.obsidian.accent'), b: pal('path.mind.glow'), c: pal('brass.hi') },
  },
  hooks: [
    // the bulb's brew comes out iced (alembic.ts reads `iced` back from the event)
    hook('brew', e => { e.iced = true; }, { id: 'apprentice-ice', priority: 20 }),
    hook('brew', (_e, api) => api.heal(APPRENTICE_HEAL, 'apprenticeship'), { id: 'apprentice-brew', priority: 200 }),
    hook('cook', (_e, api) => api.heal(APPRENTICE_HEAL, 'apprenticeship'), { id: 'apprentice-cook', priority: 200 }),
  ],
});
