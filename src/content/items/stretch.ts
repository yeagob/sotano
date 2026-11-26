import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'stretch',
  name: 'Stretch',
  description: 'Reach a little further than your hands. What you need is already on the floor, and it comes closer when you open up.',
  effect: 'Keys, bombs and hearts on the floor within 3 blocks of you fly to you. Practices are not pulled.',
  pools: { treasure: 1 },
  tags: ['body', 'movement'],
  color: pal('path.body.glow'),
  quality: 1,
  icon: {
    rows: [
      '............',
      '.bb......bb.',
      '.bcb....bcb.',
      '..bcb..bcb..',
      '...bcbbcb...',
      '....bccb....',
      '....bccb....',
      '...bcbbcb...',
      '..bcb..bcb..',
      '.bcb....bcb.',
      '.bb......bb.',
      '............',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow') },
  },
  stats: [{ stat: 'magnet', layer: 'add', value: 3 }],
});
