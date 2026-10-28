import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'thoughtstopping',
  name: 'Thought Stopping',
  description: 'Stop the loop, and the thought has nowhere left to go.',
  effect: 'A projection hit by an intention freezes for 2 seconds: it stops moving and cannot touch you.',
  inspiredBy: 'Thought stopping (cognitive behavioural therapy)',
  pools: { treasure: 1 },
  tags: ['mind', 'intent'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      '...bbbbbb...',
      '..bbaaaabb..',
      '.bba....abb.',
      'bba......abb',
      'ba........ab',
      'ba.cccccc.ab',
      'ba.cccccc.ab',
      'ba........ab',
      'bba......abb',
      '.bba....abb.',
      '..bbaaaabb..',
      '...bbbbbb...',
    ],
    palette: { a: pal('path.mind.base'), b: pal('path.mind.glow'), c: pal('bone.paper') },
  },
  hooks: [
    hook('intentHit', (e, api) => {
      if (e.kind === 'actor') api.freeze(e.target, 2);
    }, { id: 'freeze', priority: 200 }),
  ],
});
