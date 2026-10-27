import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'meditations',
  name: 'Meditations',
  description: 'Notes to yourself on what is in your control. Every intention lands with enormous weight.',
  effect: 'Damage ×3, then +2. The strongest damage boost in the game.',
  inspiredBy: 'Marcus Aurelius, Meditations (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['will', 'mind', 'intent'],
  color: pal('path.will.glow'),
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
    palette: { a: pal('path.will.dark'), b: pal('sky.horizon'), c: pal('brass.hi') },
  },
  stats: [
    { stat: 'damage', layer: 'mul', value: 3 },
    { stat: 'damage', layer: 'add', value: 2 },
  ],
});
