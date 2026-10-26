import { defineItem } from '../../items/types';

export default defineItem({
  id: 'miner',
  name: "Miner's Intent",
  description: 'Breaks blocks twice as fast, but deals less damage.',
  pools: { treasure: 1 },
  tags: ['intent', 'mining'],
  color: 0xd8a77a,
  stats: [
    { stat: 'mining', layer: 'mul', value: 2 },
    { stat: 'damage', layer: 'mul', value: 0.8 },
  ],
});
