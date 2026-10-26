import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'omens',
  name: 'Follow the Omens',
  description: 'The world speaks to those who listen: more luck, and every cleared room leaves something behind.',
  effect: 'Luck +1. Every cleared room leaves a heart, bomb or key.',
  inspiredBy: 'The Alchemist (Paulo Coelho): omens and the personal legend',
  pools: { treasure: 1 },
  tags: ['mind', 'emotion'],
  color: 0xf2c84b,
  quality: 2,
  icon: {
    rows: [
      '.....a......',
      '.....a......',
      '..a..a..a...',
      '...a.b.a....',
      '....bcb.....',
      'aaabcccbaaa.',
      '....bcb.....',
      '...a.b.a....',
      '..a..a..a...',
      '.....a......',
      '.....a......',
      '............',
    ],
    palette: { a: 0xc9a227, b: 0xf2c84b, c: 0xffffff },
  },
  stats: [{ stat: 'luck', layer: 'add', value: 1 }],
  hooks: [
    hook('roomClear', (e, api) => {
      if (!e.drops.length) e.drops.push(api.rng().pick(['heart', 'bomb', 'key'] as const));
    }, { id: 'sign', priority: 50 }),
  ],
});
