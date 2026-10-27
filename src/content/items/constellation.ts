import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'constellation',
  name: 'Systemic Constellation',
  description: 'See the whole system and every part finds its place: projections materialise weaker and slower.',
  effect: 'Projections materialise with 30% less health and 15% slower.',
  inspiredBy: 'Family and systemic constellations (Bert Hellinger and later systemic practitioners)',
  pools: { treasure: 1 },
  tags: ['emotion', 'mind'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '..a.....a...',
      '...b...b....',
      '....b.b.....',
      '.a...c....a.',
      '..b.b.b..b..',
      '...b...bb...',
      '..b.....b...',
      '.a.......a..',
      '............',
      '.....a......',
      '............',
    ],
    palette: { a: pal('sky.horizon'), b: pal('path.mind.base'), c: pal('path.mind.glow') },
  },
  hooks: [
    hook('enemySpawn', e => {
      e.hp *= 0.7;
      e.speed *= 0.85;
    }, { id: 'order', priority: 20 }),
  ],
});
