import { defineItem } from '../../items/types';

export default defineItem({
  id: 'visualization',
  name: 'Visualization',
  description: 'See it before you do it: intentions fly further and faster.',
  inspiredBy: 'Mental rehearsal in sports psychology',
  pools: { treasure: 1 },
  tags: ['mind', 'intent'],
  color: 0x9b7bff,
  quality: 1,
  icon: {
    rows: [
      '............',
      '............',
      '....aaaa....',
      '..aabbbbaa..',
      '.abbbccbbba.',
      'abbbcddcbbba',
      'abbbcddcbbba',
      '.abbbccbbba.',
      '..aabbbbaa..',
      '....aaaa....',
      '............',
      '............',
    ],
    palette: { a: 0x4b3a7a, b: 0xf4f0ff, c: 0x9b7bff, d: 0x120a20 },
  },
  stats: [
    { stat: 'range', layer: 'mul', value: 1.6 },
    { stat: 'shotSpeed', layer: 'add', value: 0.3 },
  ],
});
