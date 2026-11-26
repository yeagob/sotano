import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'still-sitting',
  name: 'Still Sitting',
  description: 'Staying still is a movement too. While the body does not run, the mind stops running after it.',
  effect: 'Invulnerability after a hit lasts 1.5 s instead of 1 s.',
  inspiredBy: 'Zen sitting practice (zazen)',
  pools: { sky: 1 },
  tags: ['body'],
  color: pal('path.body.glow'),
  quality: 1,
  icon: {
    rows: [
      '............',
      '............',
      '....bbbb....',
      '...bbbbbb...',
      '...bccccb...',
      '....bbbb....',
      '...bbbbbb...',
      '..bbbbbbbb..',
      '..bbbbbbbb..',
      '.bbbbbbbbbb.',
      'aaaaaaaaaaaa',
      'aaaaaaaaaaaa',
    ],
    palette: { a: pal('path.body.dark'), b: pal('path.body.base'), c: pal('path.body.glow') },
  },
  stats: [{ stat: 'invuln', layer: 'add', value: 0.5 }],
});
