import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'forgiveness',
  name: 'Forgiveness',
  description: 'Release what touches you: projections that hit you are hurt by it, and half the time you are not.',
  effect: 'Projections that touch you take 4 damage. Half of their contact hits on you are ignored.',
  inspiredBy: 'A Course in Miracles (Helen Schucman): forgiveness as release; perception as a mirror',
  pools: { treasure: 1 },
  tags: ['emotion'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '.....aa.....',
      '....abba....',
      '...abccba...',
      '..abccccba..',
      '.abccddccba.',
      '.abccddccba.',
      '..abccccba..',
      '...abccba...',
      '....abba....',
      '.....aa.....',
      '............',
    ],
    palette: { a: pal('path.will.base'), b: pal('brass.hi'), c: pal('sky.horizon'), d: pal('bone.paper') },
  },
  hooks: [
    hook('contact', (e, api) => {
      // what touches you meets no resistance: it takes the blow, and often you don't
      e.toAttacker += 4;
      if (api.rng().chance(0.5)) e.toTarget = 0;
    }, { id: 'release', priority: 40, target: 'player' }),
  ],
});
