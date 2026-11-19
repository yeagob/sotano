import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { pct, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'mindfuleating',
  name: 'Mindful Eating',
  description: 'Taste every bite, notice when you are full, and let the meal settle the body.',
  effect: 'Every meal you eat: move speed +5%, up to 6 times (starts at 1).',
  inspiredBy: 'Mindful eating (contemplative practice)',
  pools: { treasure: 0.5 },
  tags: ['body', 'meal', 'nourish'],
  color: pal('path.body.glow'),
  quality: 1,
  icon: {
    rows: [
      '...c..c.....',
      '....c..c....',
      '............',
      '..aaaaaaaa..',
      '..abddbbba..',
      '..abbddbba..',
      '...abbbba...',
      '....aaaa....',
      '............',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('copper.dark'), b: pal('copper.base'), c: pal('path.body.glow'), d: pal('mat.leaf.hi') },
  },
  stack: stackOf(6, [{ stat: 'moveSpeed', layer: 'add', value: 0.05 }]),
  hooks: [stackOnDrink('meal', n => ({ value: pct(n, 0.05) }))],
  messages: { stack: 'Mindful Eating ×{n}: move speed +{value}%' },
  onGain: api => { api.addStack(1); },
});
