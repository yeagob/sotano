import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'stretch',
  name: 'Stretch',
  description: 'Stretching is a good physical habit: a few minutes of it keep the body long, loose and ready. Reach a little further than your hands, and what you need on the floor comes closer when you open up.',
  effect: 'Keys, bombs and hearts on the floor within 3 blocks of you fly to you. Practices are not pulled.',
  inspiredBy: 'Yoga, and its stretching postures',
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
