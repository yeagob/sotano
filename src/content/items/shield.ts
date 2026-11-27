import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'shield',
  name: 'Shield',
  description: 'In the leap nothing can hold you. While your feet are off the ground, you belong to no one\'s grip.',
  effect: 'While you are in the air nothing reaches you: no damage, push, hold, freeze, drain, capture or wind. On the ground you are as before.',
  inspiredBy: 'The shield, an old symbol of protection (heraldry and myth)',
  pools: { sky: 1 },
  tags: ['will'],
  color: pal('path.will.glow'),
  quality: 4,
  icon: {
    rows: [
      'bbbbbbbbbbbb',
      'b..........b',
      'b..........b',
      'b...cccc...b',
      'b...caac...b',
      '.b..caac..b.',
      '.b...cc...b.',
      '..b......b..',
      '..b......b..',
      '...b....b...',
      '....b..b....',
      '.....bb.....',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('path.will.glow') },
  },
  stats: [{ stat: 'airShield', layer: 'add', value: 1 }],
});
