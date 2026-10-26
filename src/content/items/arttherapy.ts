import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'arttherapy',
  name: 'Art Therapy',
  description: 'Making something changes the maker: every block you place may heal half a heart.',
  effect: 'Each block you place has a 20% chance to heal half a heart.',
  inspiredBy: 'Art therapy; the idea that making art transforms people',
  pools: { treasure: 1 },
  tags: ['emotion', 'body', 'blocks'],
  color: 0xe88f4a,
  quality: 2,
  icon: {
    rows: [
      '............',
      '...aaaaaa...',
      '..abbbbbba..',
      '.abcbbdbbba.',
      '.abbbbbbeba.',
      '.abfbbbbbba.',
      '.abbbbbbba..',
      '..abbbaaa...',
      '...aaa.gg...',
      '.......gg...',
      '......gg....',
      '............',
    ],
    palette: { a: 0x6b4a2b, b: 0xe6d3b0, c: 0xe0303c, d: 0x5ad1e6, e: 0xf2c84b, f: 0x6fd36f, g: 0x8a6d3b },
  },
  hooks: [
    hook('drop', (e, api) => {
      if (e.how === 'place' && api.rng().chance(0.2)) api.heal(1, 'arttherapy');
    }, { id: 'create', priority: 200 }),
  ],
});
