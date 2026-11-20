import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'furoshiki',
  name: 'Furoshiki',
  description: 'One cloth, folded with care, carries more than a bag.',
  effect: 'Carry 2 more things in your hand.',
  inspiredBy: 'Furoshiki, the Japanese wrapping cloth',
  pools: { treasure: 1 },
  tags: ['body', 'blocks'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '.a........a.',
      'abb......bba',
      'abbbbbbbbbba',
      'abbcbbbbcbba',
      'abbbbbbbbbba',
      'abbbbbbbbbba',
      'abbcbbbbcbba',
      'abbbbbbbbbba',
      'abb......bba',
      '.a........a.',
      '............',
      '............',
    ],
    palette: { a: pal('copper.dark'), b: pal('path.body.glow'), c: pal('living.glow') },
  },
  stats: [{ stat: 'carry', layer: 'add', value: 2 }],
});
