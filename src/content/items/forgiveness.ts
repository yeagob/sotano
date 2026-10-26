import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'forgiveness',
  name: 'Forgiveness',
  description: 'Release what touches you: projections that hit you are hurt by it, and half the time you are not.',
  effect: 'Projections that touch you take 4 damage. Half of their contact hits on you are ignored.',
  inspiredBy: 'A Course in Miracles (Helen Schucman): forgiveness as release; perception as a mirror',
  pools: { treasure: 1 },
  tags: ['emotion'],
  color: 0xfff3c4,
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
    palette: { a: 0xc9a227, b: 0xf2c84b, c: 0xfff3c4, d: 0xffffff },
  },
  hooks: [
    hook('contact', (e, api) => {
      // what touches you meets no resistance: it takes the blow, and often you don't
      e.toAttacker += 4;
      if (api.rng().chance(0.5)) e.toTarget = 0;
    }, { id: 'release', priority: 40, target: 'player' }),
  ],
});
