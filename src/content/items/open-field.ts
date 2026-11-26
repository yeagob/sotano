import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'open-field',
  name: 'Open Field',
  description: 'In an open field the stride lengthens on its own. There is room to run, and that changes how you move.',
  effect: 'You move 25% faster.',
  inspiredBy: 'Athletics: open-field running (a sport, its generic name)',
  pools: { sky: 1 },
  tags: ['body'],
  color: pal('path.body.glow'),
  quality: 4,
  icon: {
    rows: [
      '............',
      '.....cc.....',
      '....cccc....',
      '...cccccc...',
      'aaaaaaaaaaaa',
      'bbbbbbbbbbbb',
      'aaaaaaaaaaaa',
      'bbbbbbbbbbbb',
      'aaaaaaaaaaaa',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('path.body.dark'), b: pal('path.body.base'), c: pal('path.body.glow') },
  },
  stats: [{ stat: 'moveSpeed', layer: 'mul', value: 1.25 }],
});
