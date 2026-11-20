import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { amt, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'grace',
  name: 'Grace Before Meals',
  description: 'A moment of thanks before the first bite, for the hands that grew and cooked the food.',
  effect: 'Every meal you eat: fire rate +0.12 per second, up to 6 times (starts at 1).',
  inspiredBy: 'Saying grace, gratitude before eating',
  pools: { treasure: 0.5 },
  tags: ['emotion', 'meal', 'nourish'],
  color: pal('path.emotion.glow'),
  quality: 1,
  icon: {
    rows: [
      '.c........c.',
      '.....aa.....',
      '....abba....',
      '.c..abba..c.',
      '...abbbba...',
      '..abbcbbba..',
      '.abbbbbbbba.',
      '..aaaaaaaa..',
      '............',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('copper.dark'), b: pal('copper.hi'), c: pal('path.emotion.glow') },
  },
  stack: stackOf(6, [{ stat: 'fireRate', layer: 'add', value: 0.12 }]),
  hooks: [stackOnDrink('meal', n => ({ value: amt(n, 0.12) }))],
  messages: { stack: 'Grace Before Meals ×{n}: fire rate +{value} per second' },
  onGain: api => { api.addStack(1); },
});
