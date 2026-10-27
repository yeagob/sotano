import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'manthinketh',
  name: 'As a Man Thinketh',
  description: 'Thought shapes circumstance: blocks crumble four times as fast and intentions fly true.',
  effect: 'Mining ×4 and damage ×1.5: walls crumble. Shot speed +50%, intentions drop half as much.',
  inspiredBy: 'James Allen, As a Man Thinketh (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['mind', 'mining'],
  color: pal('path.mind.glow'),
  quality: 4,
  icon: {
    rows: [
      '....aaaa....',
      '...abbbba...',
      '..abbccbba..',
      '..abccccba..',
      '..abccccba..',
      '..abbccbba..',
      '...abbbba...',
      '....abba....',
      '....dddd....',
      '....dddd....',
      '.....dd.....',
      '............',
    ],
    palette: { a: pal('path.will.base'), b: pal('sky.horizon'), c: pal('bone.paper'), d: pal('mat.stone.hi') },
  },
  stats: [
    { stat: 'mining', layer: 'mul', value: 4 },
    { stat: 'damage', layer: 'mul', value: 1.5 },
    { stat: 'shotSpeed', layer: 'add', value: 0.5 },
    { stat: 'gravity', layer: 'mul', value: 0.5 },
  ],
});
