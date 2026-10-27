import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'kaizen',
  name: 'Kaizen',
  description: 'Small, continuous steps: intentions keep going through two soft blocks.',
  effect: 'Your intentions break through up to 2 extra soft blocks (dirt, crates) and keep flying.',
  inspiredBy: 'Kaizen, the practice of continuous small improvement',
  pools: { treasure: 1 },
  tags: ['will', 'intent', 'mining'],
  color: pal('path.will.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '.........aa.',
      '.........ab.',
      '.......aaab.',
      '.......abbb.',
      '.....aaabbb.',
      '.....abbbbb.',
      '...aaabbbbb.',
      '...abbbbbbb.',
      '.aaabbbbbbb.',
      '.abbbbbbbbb.',
      '............',
    ],
    palette: { a: pal('sky.horizon'), b: pal('path.will.base') },
  },
  hooks: [
    hook('fire', e => { e.intent.pierce += 2; e.intent.color = pal('path.will.base'); }, { id: 'pierce', priority: 10 }),
  ],
});
