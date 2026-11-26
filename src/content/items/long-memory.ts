import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'long-memory',
  name: 'Long Memory',
  description: 'Whoever remembers the way is not lost twice. What you learned from each fall comes back to your hand.',
  effect: 'Your intentions deal 1.2× damage to projections.',
  inspiredBy: 'Elephant memory (folk knowledge about elephants)',
  pools: { sky: 1 },
  tags: ['mind'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '.........cc.',
      '........bb..',
      '.......bb...',
      '......bb....',
      '.....bb.....',
      '....bb......',
      '...bb.......',
      '..bb........',
      '.bb.........',
      'bb..........',
      '............',
    ],
    palette: { b: pal('path.mind.base'), c: pal('path.mind.glow') },
  },
  stats: [{ stat: 'damage', layer: 'mul', value: 1.2 }],
});
