import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'nothingpersonal',
  name: 'Nothing Personal',
  description: 'What others do is about them: contact hits slide off you two times in three.',
  effect: 'Two out of three contact hits from projections do nothing to you.',
  inspiredBy: 'The Four Agreements (don Miguel Ruiz): "don\'t take anything personally"',
  pools: { treasure: 1 },
  tags: ['emotion', 'mind'],
  color: 0x9fd3ff,
  quality: 2,
  icon: {
    rows: [
      '............',
      '..aaaaaaaa..',
      '.abbbbbbbba.',
      '.abbcbbcbba.',
      '.abbbbbbbba.',
      '.abbbbbbbba.',
      '.abcccccbba.',
      '.abbbbbbbba.',
      '..abbbbbba..',
      '...abbbba...',
      '....aaaa....',
      '............',
    ],
    palette: { a: 0x2a5a7a, b: 0x9fd3ff, c: 0x2a2633 },
  },
  hooks: [
    hook('contact', (e, api) => {
      if (api.rng().chance(2 / 3)) e.toTarget = 0;
    }, { id: 'slide-off', priority: 30, target: 'player' }),
  ],
});
