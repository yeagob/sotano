import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'co-regulation',
  name: 'Co-Regulation',
  description: 'Nobody calms down entirely alone. You find your own rhythm beside someone who already has theirs.',
  effect: 'You can hold one more block: 3 in your hands instead of 2.',
  inspiredBy: 'Co-regulation (attachment and nervous-system research)',
  pools: { sky: 1 },
  tags: ['emotion'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '..bb....bb..',
      '.bbbb..bbbb.',
      '.bbbb..bbbb.',
      '..bb.cc.bb..',
      '.....cc.....',
      '............',
      '.aaaaaaaaaa.',
      '............',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base'), c: pal('path.emotion.glow') },
  },
  stats: [{ stat: 'carry', layer: 'add', value: 1 }],
});
