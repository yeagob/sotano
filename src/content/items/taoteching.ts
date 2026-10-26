import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'taoteching',
  name: 'Tao Te Ching',
  description: 'The softest thing overcomes the hardest: intentions flow through five blocks of any kind.',
  inspiredBy: 'Lao Tzu, Tao Te Ching (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['mind', 'emotion', 'intent', 'mining'],
  color: 0xe8e4da,
  quality: 4,
  icon: {
    rows: [
      '............',
      '....bbbb....',
      '..aabbbbbb..',
      '.aaaabbbbbb.',
      '.aaaaabbabb.',
      '.aaaaaabbbb.',
      '.aaaaaaabbb.',
      '.aabaaaaabb.',
      '.aaaaaaaabb.',
      '..aaaaaaab..',
      '....aaaa....',
      '............',
    ],
    palette: { a: 0xf4f0e6, b: 0x2a2633 },
  },
  stats: [
    { stat: 'mining', layer: 'mul', value: 1.5 },
  ],
  hooks: [
    hook('fire', e => {
      e.intent.pierce += 5;
      e.intent.pierceTier = Math.max(e.intent.pierceTier, 3);
      e.intent.color = 0xe8e4da;
    }, { id: 'flow-through', priority: 10 }),
  ],
});
