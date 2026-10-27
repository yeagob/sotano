import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'exposure',
  name: 'Exposure',
  description: 'Walk into small fears and they shatter: soft blocks break on contact.',
  effect: 'Walking into soft blocks (dirt, grass, crates) shatters them instantly.',
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
  // contact breaking is a core rule driven by the `crush` stat: -1 (none) + 1 = tier 0
  stats: [{ stat: 'crush', layer: 'add', value: 1 }],
});
