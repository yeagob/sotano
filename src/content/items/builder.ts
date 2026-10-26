import { defineItem } from '../../items/types';

export default defineItem({
  id: 'builder',
  name: "Builder's Hands",
  description: 'Carry one more block.',
  pools: { treasure: 1 },
  tags: ['blocks'],
  color: 0xc9a227,
  stats: [{ stat: 'carry', layer: 'add', value: 1 }],
});
