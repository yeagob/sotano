import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'senecaletters',
  name: 'Letters from a Stoic',
  description: 'Carry more and let go harder: three more blocks, double kick and throw.',
  effect: 'Carry 4 blocks. Kicks and throws ×2. Reach +2 blocks.',
  inspiredBy: 'Seneca, Moral Letters to Lucilius (public domain)',
  pools: { treasure: 1, vault: 2 },
  tags: ['will', 'body', 'blocks'],
  color: pal('path.will.glow'),
  quality: 4,
  icon: {
    rows: [
      '..aaaaaaaa..',
      '.abbbbbbbba.',
      '..abbbbbba..',
      '..abccccba..',
      '..abbbbbba..',
      '..abccccba..',
      '..abbbbbba..',
      '..abccbbba..',
      '..abbbbdda..',
      '.abbbbbddba.',
      '..aaaaaaaa..',
      '............',
    ],
    palette: { a: pal('brass.base'), b: pal('sky.horizon'), c: pal('rock.f1.dark'), d: pal('path.will.glow') },
  },
  stats: [
    { stat: 'carry', layer: 'add', value: 3 },
    { stat: 'kick', layer: 'mul', value: 2 },
    { stat: 'throw', layer: 'mul', value: 2 },
    { stat: 'reach', layer: 'add', value: 2 },
  ],
});
