import { defineItem } from '../../items/types';

export default defineItem({
  id: 'farsight',
  name: 'Far Sight',
  description: 'Intentions fly further and faster.',
  pools: { treasure: 1 },
  tags: ['intent'],
  color: 0x9b7bff,
  stats: [
    { stat: 'range', layer: 'mul', value: 1.6 },
    { stat: 'shotSpeed', layer: 'add', value: 0.3 },
  ],
});
