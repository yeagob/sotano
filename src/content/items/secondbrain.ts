import { defineItem } from '../../items/types';

export default defineItem({
  id: 'secondbrain',
  name: 'Second Brain',
  description: 'Let something else hold what you carry: carry one more block.',
  effect: 'Carry 2 blocks instead of 1 (the second shows in your other hand).',
  inspiredBy: 'Building a Second Brain (Tiago Forte); external memory',
  pools: { treasure: 1 },
  tags: ['mind', 'blocks'],
  color: 0xc9a227,
  quality: 3,
  icon: {
    rows: [
      '............',
      '...aaaaaa...',
      '..abbabbba..',
      '.abbbabbbba.',
      '.abaabbaaba.',
      '.abbbbabbba.',
      '.abbabbbbba.',
      '..abbbabba..',
      '...aaaaaa...',
      '.....cc.....',
      '.....cc.....',
      '............',
    ],
    palette: { a: 0xb05c8a, b: 0xf2a7c9, c: 0x8a8f99 },
  },
  stats: [{ stat: 'carry', layer: 'add', value: 1 }],
});
