import { defineItem } from '../../items/types';

export default defineItem({
  id: 'deepfocus',
  name: 'Deep Focus',
  description: 'Undistracted effort breaks through obstacles twice as fast, at some cost to force.',
  inspiredBy: 'Deep Work (Cal Newport)',
  pools: { treasure: 1 },
  tags: ['mind', 'will', 'mining'],
  color: 0xd8a77a,
  quality: 2,
  icon: {
    rows: [
      '............',
      '....aaaa....',
      '..aabbbbaa..',
      '.abbccccbba.',
      'abbcddddcbba',
      'abbcdeedcbba',
      'abbcdeedcbba',
      'abbcddddcbba',
      '.abbccccbba.',
      '..aabbbbaa..',
      '....aaaa....',
      '............',
    ],
    palette: { a: 0x3a2e5a, b: 0x6a5acd, c: 0xb8a9ff, d: 0xf4f0ff, e: 0xe05d5d },
  },
  stats: [
    { stat: 'mining', layer: 'mul', value: 2 },
    { stat: 'damage', layer: 'mul', value: 0.8 },
  ],
});
