import { defineItem } from '../../items/types';

export default defineItem({
  id: 'selfreliance',
  name: 'Self-Reliance',
  description: 'Trust yourself: intentions pour out twice as fast and hit harder.',
  effect: 'Fire rate ×2. Damage +1.5.',
  inspiredBy: 'Ralph Waldo Emerson, Self-Reliance (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['will', 'intent'],
  color: 0xf2c84b,
  quality: 4,
  icon: {
    rows: [
      '.........aa.',
      '........aaaa',
      '.........aa.',
      '............',
      '.....b......',
      '....bcb.....',
      '...bcccb....',
      '..bcccccb...',
      '.bccccdccb..',
      'bccccddddccb',
      'cccdddddddcc',
      'dddddddddddd',
    ],
    palette: { a: 0xffd27a, b: 0xffffff, c: 0x9aa0aa, d: 0x4a5568 },
  },
  stats: [
    { stat: 'fireRate', layer: 'mul', value: 2 },
    { stat: 'damage', layer: 'add', value: 1.5 },
  ],
});
