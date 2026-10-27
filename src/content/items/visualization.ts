import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'visualization',
  name: 'Visualization',
  description: 'See it before you do it: intentions fly further and faster.',
  effect: 'Range ×1.6: intentions fly straight for longer. Shot speed +30%.',
  inspiredBy: 'Mental rehearsal in sports psychology',
  pools: { treasure: 1, boss: 1 },
  tags: ['mind', 'intent'],
  color: pal('path.mind.glow'),
  quality: 1,
  icon: {
    rows: [
      '............',
      '............',
      '....aaaa....',
      '..aabbbbaa..',
      '.abbbccbbba.',
      'abbbcddcbbba',
      'abbbcddcbbba',
      '.abbbccbbba.',
      '..aabbbbaa..',
      '....aaaa....',
      '............',
      '............',
    ],
    palette: { a: pal('mat.obsidian.accent'), b: pal('bone.paper'), c: pal('path.mind.base'), d: pal('mat.obsidian.dark') },
  },
  stats: [
    { stat: 'range', layer: 'mul', value: 1.6 },
    { stat: 'shotSpeed', layer: 'add', value: 0.3 },
  ],
});
