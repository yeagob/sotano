import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'constellation',
  name: 'Systemic Constellation',
  description: 'See the whole system and every part finds its place: projections materialise weaker and slower.',
  effect: 'Projections materialise with 30% less health and 15% slower.',
  inspiredBy: 'Family and systemic constellations (Bert Hellinger and later systemic practitioners)',
  pools: { treasure: 1 },
  tags: ['emotion', 'mind'],
  color: 0xc9a0ff,
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
    palette: { a: 0xfff3c4, b: 0x6a5acd, c: 0xc9a0ff },
  },
  hooks: [
    hook('enemySpawn', e => {
      e.hp *= 0.7;
      e.speed *= 0.85;
    }, { id: 'order', priority: 20 }),
  ],
});
