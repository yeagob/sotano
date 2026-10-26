import { defineItem } from '../../items/types';

export default defineItem({
  id: 'springs',
  name: 'Spring Heels',
  description: 'Jump much higher.',
  pools: { treasure: 1 },
  tags: ['movement'],
  color: 0x6fd36f,
  stats: [{ stat: 'jump', layer: 'mul', value: 1.7 }],
});
