import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'kiai',
  name: 'Remember Breathing',
  description: 'Conscious breathing is the most important thing you can do. Gather your breath, hold it, and let it all out at once: nothing in its way stays standing.',
  effect: 'Replaces your intentions with a charged beam: hold to charge (2.7 ÷ fire rate seconds, between 0.35 and 2), release for a 1-second beam of 10 ticks. Each tick deals 2× mining to the block in its way (it burns on through as blocks break) and 1× damage to every projection on it, and destroys their projectiles.',
  inspiredBy: 'Santiago (Game Glover), on conscious breathing',
  pools: { boss: 1 },
  tags: ['will', 'weapon'],
  color: pal('path.will.glow'),
  quality: 4,
  icon: {
    rows: [
      '............',
      '............',
      '.aaa........',
      'abbba.......',
      'abccbcccccc.',
      'abcddddddddd',
      'abcddddddddd',
      'abccbcccccc.',
      'abbba.......',
      '.aaa........',
      '............',
      '............',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('path.will.glow'), d: pal('light.core') },
  },
  weapon: { id: 'beam', priority: 10 },
});
