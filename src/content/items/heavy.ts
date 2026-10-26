import { defineItem } from '../../items/types';

export default defineItem({
  id: 'heavy',
  name: 'Leaden Intent',
  description: 'Heavier intentions: more damage, bigger, and they drop hard.',
  pools: { treasure: 1 },
  tags: ['intent'],
  color: 0x8a8f99,
  stats: [
    { stat: 'damage', layer: 'add', value: 2 },
    { stat: 'gravity', layer: 'mul', value: 2 },
    { stat: 'size', layer: 'mul', value: 1.4 },
  ],
});
