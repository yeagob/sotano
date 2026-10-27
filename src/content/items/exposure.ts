import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'exposure',
  name: 'Exposure',
  description: 'Walk into your fears and they wear away: whatever you press against crumbles, little by little.',
  effect: 'Walking into any block around you (never the ones below) wears it down: 20 block damage per second, armor still counts. Soft blocks fall at once, obsidian takes seconds.',
  inspiredBy: 'Exposure therapy (cognitive behavioural therapy)',
  pools: { treasure: 1 },
  tags: ['emotion', 'body', 'contact'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '.........cc.',
      '.aaaaaaa.cc.',
      '.abbbbcb....',
      '.abbbcbbb...',
      '.abbccbbbba.',
      '.abcbbcbbba.',
      '.acbbbbcbba.',
      '.abbbbbbcba.',
      '.abbbbbbbca.',
      '.abbbbbbbba.',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: pal('mat.crate.dark'), b: pal('path.will.base'), c: pal('brass.hi') },
  },
  // contact wear is a core rule driven by the `crush` stat (block damage per second of contact)
  stats: [{ stat: 'crush', layer: 'add', value: 20 }],
});
