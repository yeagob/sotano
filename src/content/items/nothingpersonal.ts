import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'nothingpersonal',
  name: 'Nothing Personal',
  description: 'What others do is about them: contact hits slide off you two times in three.',
  effect: 'Two out of three contact hits from projections do nothing to you.',
  inspiredBy: 'The Four Agreements (don Miguel Ruiz): "don\'t take anything personally"',
  pools: { treasure: 1 },
  tags: ['emotion', 'mind'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '.aaaaaaaaaa.',
      '.abbbbbbbba.',
      '.acbbbbbbba.',
      '.abcbbbbbba.',
      '..abcbbbba..',
      '..abbcbbba..',
      '...abbcba...',
      '...abbbba...',
      '....abba....',
      '.....aa.....',
      '............',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('sky.day'), c: pal('rock.source.base') },
  },
  hooks: [
    hook('contact', (e, api) => {
      if (api.rng().chance(2 / 3)) e.toTarget = 0;
    }, { id: 'slide-off', priority: 30, target: 'player' }),
  ],
});
