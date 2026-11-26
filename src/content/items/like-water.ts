import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export const LIKE_WATER_SECONDS = 3;

export default defineItem({
  id: 'like-water',
  name: 'Like Water',
  description: 'Nothing is softer than water, and nothing wears down the hard so well. Where your care lands, it flows.',
  effect: 'A positive intention that hits a block leaves running water on that face for 3 s, then it dries. Hitting that water again only restarts its 3 s. Every being in it moves at half speed.',
  inspiredBy: 'Tao Te Ching, chapters 8 and 78 (water as the highest good)',
  pools: { sky: 1 },
  tags: ['emotion'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      '.....b......',
      '.....b......',
      '....bcb.....',
      '....bcb.....',
      '...bcccb....',
      '...bcccb....',
      '..bcccccb...',
      '..bcccacb...',
      '..bccccab...',
      '...bccab....',
      '....bbb.....',
      '............',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base'), c: pal('path.emotion.glow') },
  },
  hooks: [
    hook('intentHit', (e, api) => {
      if (e.kind !== 'block' || e.intent.polarity !== 'positive') return;
      api.tempWater(e.x + e.nx * 0.5, e.y + e.ny * 0.5, e.z + e.nz * 0.5, LIKE_WATER_SECONDS);
    }, { id: 'water', priority: 200 }),
  ],
});
