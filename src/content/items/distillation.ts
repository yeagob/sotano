import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { pct, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'distillation',
  name: 'Distillation',
  description: 'Separate the subtle from the gross: what is clear rises, and what is heavy settles.',
  effect: 'Every potion you drink: jump +6%, up to 6 times (starts at 1).',
  inspiredBy: 'Alchemical distillation: "separate the subtle from the gross" (Emerald Tablet)',
  pools: { treasure: 0.5 },
  tags: ['mind', 'potion', 'nourish'],
  color: pal('path.mind.glow'),
  quality: 1,
  icon: {
    rows: [
      '.....a......',
      '....aba.....',
      '...abcba....',
      '...abcba....',
      '..abbcbba...',
      '..abbcbba...',
      '..abbbbbba..',
      '..abbbbbba..',
      '...abbbba...',
      '....aaaa....',
      '............',
      '..dddddddd..',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow'), d: pal('iron.base') },
  },
  stack: stackOf(6, [{ stat: 'jump', layer: 'add', value: 0.06 }]),
  hooks: [stackOnDrink('potion', n => ({ value: pct(n, 0.06) }))],
  messages: { stack: 'Distillation ×{n}: jump +{value}%' },
  onGain: api => { api.addStack(1); },
});
