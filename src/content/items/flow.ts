import { defineItem } from '../../items/types';

export default defineItem({
  id: 'flow',
  name: 'Flow',
  description: 'Absorbed in the task, everything speeds up: move and cast faster.',
  effect: 'Movement speed +30%. Fire rate +0.5 per second.',
  inspiredBy: 'Flow (Mihaly Csikszentmihalyi)',
  pools: { treasure: 1 },
  tags: ['body', 'movement'],
  color: 0x5ad1e6,
  quality: 2,
  icon: {
    rows: [
      '............',
      '............',
      '..aaa.......',
      '.a...a....a.',
      'a.....a..a..',
      '.......aa...',
      '..bbb.......',
      '.b...b....b.',
      'b.....b..b..',
      '.......bb...',
      '............',
      '............',
    ],
    palette: { a: 0x9fe8f5, b: 0x2a8ab0 },
  },
  stats: [
    { stat: 'moveSpeed', layer: 'add', value: 0.3 },
    { stat: 'fireRate', layer: 'add', value: 0.5 },
  ],
});
