import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'secondbrain',
  name: 'Second Brain',
  description: 'Let something else hold what you carry: carry one more block.',
  effect: 'Carry 2 blocks instead of 1 (the second shows in your other hand).',
  inspiredBy: 'Building a Second Brain (Tiago Forte); external memory',
  pools: { treasure: 1 },
  tags: ['mind', 'blocks'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '...aaaaaa...',
      '..abbabbba..',
      '.abbbabbbba.',
      'abaabbaabbaa',
      'abbbbbabbbba',
      '.abbabbbbba.',
      '..abbbabba..',
      '...aaaaaa...',
      '.....cc.....',
      '....cccc....',
      '..cccccccc..',
    ],
    palette: { a: pal('mat.obsidian.accent'), b: pal('path.mind.glow'), c: pal('mat.stone.hi') },
  },
  stats: [{ stat: 'carry', layer: 'add', value: 1 }],
});
