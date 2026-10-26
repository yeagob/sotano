import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'drill',
  name: 'Drill',
  description: 'Intentions keep going through two soft blocks.',
  pools: { treasure: 1 },
  tags: ['intent', 'mining'],
  color: 0xffb347,
  hooks: [
    hook('fire', e => { e.intent.pierce += 2; e.intent.color = 0xffb347; }, { id: 'pierce', priority: 10 }),
  ],
});
