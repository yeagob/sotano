import { defineItem } from '../../items/types';

export default defineItem({
  id: 'exposure',
  name: 'Exposure',
  description: 'Walk into small fears and they shatter: soft blocks break on contact.',
  effect: 'Walking into soft blocks (dirt, grass, crates) shatters them instantly.',
  inspiredBy: 'Exposure therapy (cognitive behavioural therapy)',
  pools: { treasure: 1 },
  tags: ['emotion', 'body', 'contact'],
  color: 0xb5651d,
  quality: 2,
  icon: {
    rows: [
      '............',
      '.aaaaaaaaaa.',
      '.abbbbbcbbb.',
      '.abbbbcbbbb.',
      '.abbbccbbbb.',
      '.abbcbbcbbb.',
      '.abcbbbbcbb.',
      '.acbbbbbbcb.',
      '.abbbbbbbbc.',
      '.abbbbbbbbb.',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: 0x5e3d25, b: 0xb5651d, c: 0xffe08a },
  },
  // contact breaking is a core rule driven by the `crush` stat: -1 (none) + 1 = tier 0
  stats: [{ stat: 'crush', layer: 'add', value: 1 }],
});
