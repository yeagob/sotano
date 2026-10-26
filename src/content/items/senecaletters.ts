import { defineItem } from '../../items/types';

export default defineItem({
  id: 'senecaletters',
  name: 'Letters from a Stoic',
  description: 'Carry more and let go harder: three more blocks, double kick and throw.',
  inspiredBy: 'Seneca, Moral Letters to Lucilius (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['will', 'body', 'blocks'],
  color: 0xc0392b,
  quality: 4,
  icon: {
    rows: [
      '............',
      '............',
      'aaaaaaaaaaaa',
      'abbbbbbbbbba',
      'abbbbbbbbbba',
      'aabbbbbbbbaa',
      'abaabbbbaaba',
      'abbbaccabbba',
      'abbbbccbbbba',
      'abbbbbbbbbba',
      'aaaaaaaaaaaa',
      '............',
    ],
    palette: { a: 0x8a6d3b, b: 0xf3e7c9, c: 0xc0392b },
  },
  stats: [
    { stat: 'carry', layer: 'add', value: 3 },
    { stat: 'kick', layer: 'mul', value: 2 },
    { stat: 'throw', layer: 'mul', value: 2 },
    { stat: 'reach', layer: 'add', value: 2 },
  ],
});
