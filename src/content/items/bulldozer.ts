import { defineItem } from '../../items/types';

export default defineItem({
  id: 'bulldozer',
  name: 'Bulldozer',
  description: 'Soft blocks shatter when you walk into them.',
  pools: { treasure: 1 },
  tags: ['blocks', 'contact'],
  color: 0xb5651d,
  // contact breaking is a core rule driven by the `crush` stat: -1 (none) + 1 = tier 0
  stats: [{ stat: 'crush', layer: 'add', value: 1 }],
});
