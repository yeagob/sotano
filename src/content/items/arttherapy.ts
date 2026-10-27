import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'arttherapy',
  name: 'Art Therapy',
  description: 'Making something changes the maker: every block you place may heal half a heart.',
  effect: 'Each block you place has a 20% chance to heal half a heart.',
  inspiredBy: 'Art therapy; the idea that making art transforms people',
  pools: { treasure: 1 },
  tags: ['emotion', 'body', 'blocks'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '...aaaaaa...',
      '..abbbbbba..',
      '.abcbbcbbba.',
      '.abbbbbbcba.',
      '.abcbbbbbba.',
      '.abbbbbbba..',
      '..abbbaaa...',
      '...aaa.gg...',
      '.......gg...',
      '......gg....',
      '............',
    ],
    palette: { a: pal('mat.dirt.base'), b: pal('sky.horizon'), c: pal('path.emotion.glow'), g: pal('brass.base') },
  },
  hooks: [
    hook('drop', (e, api) => {
      if (e.how === 'place' && api.rng().chance(0.2)) api.heal(1, 'arttherapy');
    }, { id: 'create', priority: 200 }),
  ],
});
