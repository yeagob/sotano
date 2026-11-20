import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { amt, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'breakingbread',
  name: 'Breaking Bread',
  description: 'Sharing a meal makes room for the people across the table, and for yourself.',
  effect: 'Every meal you eat: damage +0.35, up to 6 times (starts at 1).',
  inspiredBy: 'Sharing a meal as reconciliation (many traditions)',
  pools: { treasure: 0.5 },
  tags: ['emotion', 'meal', 'nourish'],
  color: pal('path.emotion.glow'),
  quality: 1,
  icon: {
    rows: [
      '............',
      '....aaaa....',
      '..aabbbbaa..',
      '.abbbbbbbba.',
      '.abcbbcbbba.',
      '.abbbbbbbbba',
      '.aaaaaaaaaaa',
      '............',
      '............',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('copper.dark'), b: pal('copper.hi'), c: pal('bone.paper') },
  },
  stack: stackOf(6, [{ stat: 'damage', layer: 'add', value: 0.35 }]),
  hooks: [stackOnDrink('meal', n => ({ value: amt(n, 0.35) }))],
  messages: { stack: 'Breaking Bread ×{n}: damage +{value}' },
  onGain: api => { api.addStack(1); },
});
