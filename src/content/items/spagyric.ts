import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { amt, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'spagyric',
  name: 'Spagyric Art',
  description: 'Separate, purify and join again: a medicine made from the whole of the plant, sparks and all.',
  effect: 'Every potion you drink: fire rate +0.12 per second, up to 6 times (starts at 1).',
  inspiredBy: 'Paracelsus\' spagyric medicine (16th century)',
  pools: { treasure: 0.5 },
  tags: ['will', 'potion', 'nourish'],
  color: pal('path.will.glow'),
  quality: 1,
  icon: {
    rows: [
      '..c.....c...',
      '.....c..c...',
      '....aaaa....',
      '....abba....',
      '...abbbba...',
      '..abbcbbba..',
      '..abbbbbba..',
      '..abbbbbba..',
      '..aaaaaaaa..',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('path.will.glow') },
  },
  stack: stackOf(6, [{ stat: 'fireRate', layer: 'add', value: 0.12 }]),
  hooks: [stackOnDrink('potion', n => ({ value: amt(n, 0.12) }))],
  messages: { stack: 'Spagyric Art ×{n}: fire rate +{value} per second' },
  onGain: api => { api.addStack(1); },
});
