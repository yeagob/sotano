import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'assertive-roar',
  name: 'Assertive Roar',
  description: 'Saying what you need in a steady voice is not aggression. It is a boundary that can be heard.',
  effect: 'Your kicks and throws are 1.5× stronger.',
  inspiredBy: 'Assertiveness training (communication skills)',
  pools: { sky: 1 },
  tags: ['will'],
  color: pal('path.will.glow'),
  quality: 4,
  icon: {
    rows: [
      '.c..c..c..c.',
      '..bbbbbbbb..',
      '.bbbbbbbbbb.',
      'cbbbbbbbbbbc',
      '.bbbbbbbbbb.',
      'cbbbbbbbbbbc',
      '.bbbbbbbbbb.',
      '..bbbbbbbb..',
      '.c..c..c..c.',
      '............',
      '............',
      '............',
    ],
    palette: { b: pal('path.will.base'), c: pal('path.will.glow') },
  },
  stats: [
    { stat: 'kick', layer: 'mul', value: 1.5 },
    { stat: 'throw', layer: 'mul', value: 1.5 },
  ],
});
