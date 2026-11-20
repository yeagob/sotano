import { pal } from '../palette';
import { defineItem } from '../../items/types';
import { pct, stackOf, stackOnDrink } from './stacking';

export default defineItem({
  id: 'teaceremony',
  name: 'Tea Ceremony',
  description: 'Making tea slowly, with every movement attended to, turns a drink into a practice of presence.',
  effect: 'Every potion you drink: move speed +5%, up to 6 times (starts at 1).',
  inspiredBy: 'The Japanese tea ceremony (chadō)',
  pools: { treasure: 0.5 },
  tags: ['mind', 'potion', 'nourish'],
  color: pal('path.mind.glow'),
  quality: 1,
  icon: {
    rows: [
      '...c...c....',
      '..c...c.....',
      '...c...c....',
      '.aaaaaaaa...',
      '.abbbbbbaa..',
      '.abbbbbbab..',
      '.abbbbbbaa..',
      '.abbbbbba...',
      '..aaaaaa....',
      '.dddddddddd.',
      '............',
      '............',
    ],
    palette: { a: pal('copper.dark'), b: pal('bone.paper'), c: pal('path.mind.glow'), d: pal('limestone.base') },
  },
  stack: stackOf(6, [{ stat: 'moveSpeed', layer: 'add', value: 0.05 }]),
  hooks: [stackOnDrink('potion', n => ({ value: pct(n, 0.05) }))],
  messages: { stack: 'Tea Ceremony ×{n}: move speed +{value}%' },
  onGain: api => { api.addStack(1); },
});
