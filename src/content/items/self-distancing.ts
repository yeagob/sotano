import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'self-distancing',
  name: 'Self-Distancing',
  description: 'A step back is not a retreat. From further away the knot looks smaller, and you can see where to pull.',
  effect: 'Your intentions hurt projections more the further they fly: ×0.5 as they leave your hand, ×1 at half their straight flight, ×2 at its end, and their size multiplies it too (size 2 gives ×2).',
  inspiredBy: 'Self-distancing (emotion-regulation research)',
  pools: { sky: 1 },
  tags: ['mind'],
  color: pal('path.mind.glow'),
  quality: 1,
  icon: {
    rows: [
      '............',
      '............',
      '........bbb.',
      '.......bcccb',
      '.......bcccb',
      'a.a.a..bcccb',
      '.......bcccb',
      '.......bcccb',
      '........bbb.',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow') },
  },
  stats: [{ stat: 'flightDamage', layer: 'add', value: 1 }],
});
