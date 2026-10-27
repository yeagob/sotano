import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'selfreliance',
  name: 'Self-Reliance',
  description: 'Trust yourself: intentions pour out twice as fast and hit harder.',
  effect: 'Fire rate ×2. Damage +1.5.',
  inspiredBy: 'Ralph Waldo Emerson, Self-Reliance (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['will', 'intent'],
  color: pal('path.will.glow'),
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
    palette: { a: pal('brass.hi'), b: pal('bone.paper'), c: pal('iron.hi'), d: pal('rock.f2.base') },
  },
  stats: [
    { stat: 'fireRate', layer: 'mul', value: 2 },
    { stat: 'damage', layer: 'add', value: 1.5 },
  ],
});
