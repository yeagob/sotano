import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'taoteching',
  name: 'Tao Te Ching',
  description: 'The softest thing overcomes the hardest: intentions flow through five blocks of any kind.',
  effect: 'Intentions pass through up to 5 blocks of ANY tier (even obsidian), damaging every block they cross, and keep flying. Mining ×1.5.',
  inspiredBy: 'Lao Tzu, Tao Te Ching (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['mind', 'emotion', 'intent', 'mining'],
  color: pal('path.mind.glow'),
  quality: 4,
  icon: {
    rows: [
      '............',
      '....aaaa....',
      'aaaa....aaaa',
      '....cccc....',
      '...cddddc...',
      'a.cdddddbc.a',
      '.acdddbbbca.',
      '...cccccc...',
      'aaaa....aaaa',
      '....aaaa....',
      '............',
      '............',
    ],
    palette: { a: pal('path.emotion.glow'), b: pal('mat.stone.dark'), c: pal('mat.stone.outline'), d: pal('mat.stone.hi') },
  },
  stats: [
    { stat: 'mining', layer: 'mul', value: 1.5 },
  ],
  hooks: [
    hook('fire', e => {
      e.intent.phase += 5;
      e.intent.color = pal('bone.paper');
    }, { id: 'flow-through', priority: 10 }),
  ],
});
