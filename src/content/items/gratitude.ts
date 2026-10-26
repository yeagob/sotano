import { defineItem } from '../../items/types';

export default defineItem({
  id: 'gratitude',
  name: 'Gratitude Journal',
  description: 'Notice what is going well: cleared rooms reward you more often.',
  inspiredBy: 'Gratitude journaling (positive psychology)',
  pools: { treasure: 1 },
  tags: ['emotion'],
  color: 0xe05d5d,
  quality: 1,
  icon: {
    rows: [
      '............',
      '.aaaaaaaaa..',
      '.abbbbbbbab.',
      '.abbcbcbbab.',
      '.abcccccbab.',
      '.abcccccbab.',
      '.abbcccbbab.',
      '.abbbcbbbab.',
      '.abbbbbbbab.',
      '.aaaaaaaaab.',
      '..bbbbbbbbb.',
      '............',
    ],
    palette: { a: 0x7a4a2a, b: 0xf3e7c9, c: 0xe05d5d },
  },
  stats: [{ stat: 'luck', layer: 'add', value: 1.5 }],
});
