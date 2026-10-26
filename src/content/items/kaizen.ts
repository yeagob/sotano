import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'kaizen',
  name: 'Kaizen',
  description: 'Small, continuous steps: intentions keep going through two soft blocks.',
  effect: 'Your intentions break through up to 2 extra soft blocks (dirt, crates) and keep flying.',
  inspiredBy: 'Kaizen, the practice of continuous small improvement',
  pools: { treasure: 1 },
  tags: ['will', 'intent', 'mining'],
  color: 0xffb347,
  quality: 2,
  icon: {
    rows: [
      '............',
      '.........aa.',
      '.........ab.',
      '.......aaab.',
      '.......abbb.',
      '.....aaabbb.',
      '.....abbbbb.',
      '...aaabbbbb.',
      '...abbbbbbb.',
      '.aaabbbbbbb.',
      '.abbbbbbbbb.',
      '............',
    ],
    palette: { a: 0xffe3a3, b: 0xffb347 },
  },
  hooks: [
    hook('fire', e => { e.intent.pierce += 2; e.intent.color = 0xffb347; }, { id: 'pierce', priority: 10 }),
  ],
});
