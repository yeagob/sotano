import { defineItem } from '../../items/types';

export default defineItem({
  id: 'stoic',
  name: 'Stoic Resolve',
  description: 'Weighty, steady intentions: more damage, and they drop hard.',
  inspiredBy: 'Marcus Aurelius, Meditations; Epictetus, Enchiridion',
  pools: { treasure: 1 },
  tags: ['will', 'intent'],
  color: 0x8a8f99,
  quality: 2,
  icon: {
    rows: [
      '............',
      '..aaaaaaaa..',
      '...bbbbbb...',
      '...cbcbcb...',
      '...cbcbcb...',
      '...cbcbcb...',
      '...cbcbcb...',
      '...cbcbcb...',
      '...cbcbcb...',
      '...bbbbbb...',
      '..aaaaaaaa..',
      '............',
    ],
    palette: { a: 0xe6e1d8, b: 0xb8b2a8, c: 0x8f897f },
  },
  stats: [
    { stat: 'damage', layer: 'add', value: 2 },
    { stat: 'gravity', layer: 'mul', value: 2 },
    { stat: 'size', layer: 'mul', value: 1.4 },
  ],
});
