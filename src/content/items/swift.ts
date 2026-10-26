import { defineItem } from '../../items/types';

export default defineItem({
  id: 'swift',
  name: 'Quick Feet',
  description: 'Move faster and cast a little faster.',
  pools: { treasure: 1 },
  tags: ['movement'],
  color: 0x5ad1e6,
  stats: [
    { stat: 'moveSpeed', layer: 'add', value: 0.3 },
    { stat: 'fireRate', layer: 'add', value: 0.5 },
  ],
});
