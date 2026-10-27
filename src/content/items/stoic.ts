import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'stoic',
  name: 'Stoic Resolve',
  description: 'Weighty, steady intentions: more damage, and they drop hard.',
  effect: 'Damage +2. Intentions are 40% bigger and drop twice as fast.',
  inspiredBy: 'Marcus Aurelius, Meditations; Epictetus, Enchiridion',
  pools: { treasure: 1, boss: 1 },
  tags: ['will', 'intent'],
  color: pal('path.will.glow'),
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
    palette: { a: pal('bone.paper'), b: pal('path.will.glow'), c: pal('path.will.dark') },
  },
  stats: [
    { stat: 'damage', layer: 'add', value: 2 },
    { stat: 'gravity', layer: 'mul', value: 2 },
    { stat: 'size', layer: 'mul', value: 1.4 },
  ],
});
