import { defineItem } from '../../items/types';

export default defineItem({
  id: 'meditations',
  name: 'Meditations',
  description: 'Notes to yourself on what is in your control. Every intention lands with enormous weight.',
  inspiredBy: 'Marcus Aurelius, Meditations (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['will', 'mind', 'intent'],
  color: 0xd8b26a,
  quality: 4,
  icon: {
    rows: [
      '............',
      '............',
      '.aaaa..aaaa.',
      'abbbbaabbbba',
      'abccbaabccba',
      'abbbbaabbbba',
      'abccbaabccba',
      'abbbbaabbbba',
      'abccbaabccba',
      'abbbbaabbbba',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: 0x6b3a1e, b: 0xf3e7c9, c: 0xa89470 },
  },
  stats: [
    { stat: 'damage', layer: 'mul', value: 3 },
    { stat: 'damage', layer: 'add', value: 2 },
  ],
});
