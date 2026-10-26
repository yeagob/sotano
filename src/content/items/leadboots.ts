import { defineItem } from '../../items/types';

export default defineItem({
  id: 'leadboots',
  name: 'Lead Boots',
  description: 'Kick blocks twice as hard.',
  pools: { treasure: 1 },
  tags: ['blocks', 'contact'],
  color: 0x4a5568,
  stats: [{ stat: 'kick', layer: 'mul', value: 2 }],
});
