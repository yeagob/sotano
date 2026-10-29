import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'selfefficacy',
  name: 'Self-Efficacy',
  description: 'Believing you can climb makes the climb possible.',
  effect: 'A projection hit by an intention runs away from you for 3 seconds instead of attacking.',
  inspiredBy: 'Self-efficacy (Albert Bandura, 1977)',
  pools: { treasure: 1 },
  tags: ['will', 'intent'],
  color: pal('path.will.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '............',
      '........dddd',
      '........cccc',
      '........ccca',
      '........ccca',
      '....bbbbaaa.',
      '....baaa....',
      '....baaa....',
      'bbbbaaa.....',
      'baaa........',
      'baaa........',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('path.will.glow'), d: pal('el.fire.hi') },
  },
  hooks: [
    hook('intentHit', (e, api) => {
      if (e.kind === 'actor') api.frighten(e.target, 3);
    }, { id: 'frighten', priority: 200 }),
  ],
});
