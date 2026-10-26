import { defineItem } from '../../items/types';

export default defineItem({
  id: 'manthinketh',
  name: 'As a Man Thinketh',
  description: 'Thought shapes circumstance: blocks crumble four times as fast and intentions fly true.',
  inspiredBy: 'James Allen, As a Man Thinketh (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['mind', 'mining'],
  color: 0xfff3c4,
  quality: 4,
  icon: {
    rows: [
      '....aaaa....',
      '...abbbba...',
      '..abbccbba..',
      '..abccccba..',
      '..abccccba..',
      '..abbccbba..',
      '...abbbba...',
      '....abba....',
      '....dddd....',
      '....dddd....',
      '.....dd.....',
      '............',
    ],
    palette: { a: 0xc9a227, b: 0xfff3c4, c: 0xffffff, d: 0x8a8f99 },
  },
  stats: [
    { stat: 'mining', layer: 'mul', value: 4 },
    { stat: 'damage', layer: 'mul', value: 1.5 },
    { stat: 'shotSpeed', layer: 'add', value: 0.5 },
    { stat: 'gravity', layer: 'mul', value: 0.5 },
  ],
});
