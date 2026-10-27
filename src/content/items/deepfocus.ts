import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'deepfocus',
  name: 'Deep Focus',
  description: 'Undistracted effort breaks through obstacles twice as fast, at some cost to force.',
  effect: 'Breaks blocks twice as fast (mining ×2). Damage ×0.8.',
  inspiredBy: 'Deep Work (Cal Newport)',
  pools: { treasure: 1, boss: 1 },
  tags: ['mind', 'will', 'mining'],
  color: pal('path.mind.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '....a..a....',
      '..aabbbbaa..',
      '.abbccccbba.',
      '..bcddddcb..',
      '..bcdaadcb..',
      '..bcdaadcb..',
      '..bcddddcb..',
      '.abbccccbba.',
      '..aabbbbaa..',
      '....a..a....',
      '............',
    ],
    palette: { a: pal('mat.obsidian.hi'), b: pal('path.mind.base'), c: pal('path.mind.glow'), d: pal('bone.paper') },
  },
  stats: [
    { stat: 'mining', layer: 'mul', value: 2 },
    { stat: 'damage', layer: 'mul', value: 0.8 },
  ],
});
