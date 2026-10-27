import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'gratitude',
  name: 'Gratitude Journal',
  description: 'Notice what is going well: cleared rooms reward you more often.',
  effect: 'Luck +1.5: cleared rooms leave a reward more often.',
  inspiredBy: 'Gratitude journaling (positive psychology)',
  pools: { treasure: 1 },
  tags: ['emotion'],
  color: pal('path.emotion.glow'),
  quality: 1,
  icon: {
    rows: [
      'aaaaaaa.....',
      'abbbbbab....',
      'abcbcbab....',
      'abcccbab....',
      'abbcbbab....',
      'abbbbbab....',
      'abbbbbab....',
      'abbbbbab....',
      'aaaaaaab....',
      '.bbbbbbb.c..',
      '........c...',
      '.......c....',
    ],
    palette: { a: pal('mat.crate.base'), b: pal('sky.horizon'), c: pal('path.will.glow') },
  },
  stats: [{ stat: 'luck', layer: 'add', value: 1.5 }],
});
