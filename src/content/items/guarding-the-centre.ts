import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'guarding-the-centre',
  name: 'Guarding the Centre',
  description: 'Keep still at the centre, and what moves around you slows to your pace.',
  effect: 'Every 3 s a sphere of stillness leaves you and grows to 4 blocks in 1.5 s. Each projection or sky creature it reaches is frozen for 3 s, unless it thawed less than 3 s ago. It never freezes you.',
  inspiredBy: 'The Secret of the Golden Flower (Chinese Taoist text): guarding the centre in stillness',
  pools: { sky: 1 },
  tags: ['body'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '...bbbbbb...',
      '..b......b..',
      '.b........b.',
      'b...aaaa...b',
      'b..a....a..b',
      'b..a.cc.a..b',
      'b..a.cc.a..b',
      'b..a....a..b',
      'b...aaaa...b',
      '.b........b.',
      '..b......b..',
      '...bbbbbb...',
    ],
    palette: { a: pal('path.body.base'), b: pal('path.body.dark'), c: pal('path.body.glow') },
  },
  stats: [{ stat: 'freezeSphere', layer: 'add', value: 1 }],
});
