import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'bounceback',
  name: 'Bounce Back',
  description: 'Knocked down, it comes back up.',
  effect: 'Intentions that don\'t break a block bounce off it, up to 2 times, keeping 75% of their speed each time.',
  inspiredBy: 'Resilience (developmental psychology: bouncing back from setbacks)',
  pools: { treasure: 1 },
  tags: ['will', 'intent'],
  color: pal('path.will.glow'),
  quality: 2,
  icon: {
    rows: [
      '..dd......ab',
      '.dddd.....ab',
      '.dddd.....bb',
      '..dd..cc..ab',
      '......cc..ab',
      '........ccab',
      '........ccbb',
      '..........ab',
      '...bb.....ab',
      '...bb.....ab',
      'bb........bb',
      'bb........ab',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('path.will.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('fire', e => { e.intent.bounces += 2; }, { id: 'rebound', priority: 20 }),
  ],
});
