import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'discharge',
  name: 'Discharge',
  description: 'Stored energy leaves the body through the ground it lands on.',
  effect: 'Landing from a fall of about two blocks or more sends a shockwave out of your feet: 3 blocks, 4 points to every projection in it, shoved back.',
  inspiredBy: 'Somatic Experiencing (Peter Levine, Waking the Tiger, 1997)',
  pools: { treasure: 1 },
  tags: ['body', 'electric'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '............',
      '............',
      '....bbbb....',
      '..bb....bb..',
      '.b..cccc..b.',
      'b..c....c..b',
      'b.c..dd..c.b',
      'b.c.dddd.c.b',
      'aaaaaaaaaaaa',
      '.aaaaaaaaaa.',
      '............',
    ],
    palette: { a: pal('path.body.dark'), b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('land', (e, api) => {
      if (e.fallSpeed >= 10) api.pulse(e.x, e.y, e.z, 3, 4, 6, pal('light.core'), 'discharge');
    }, { id: 'shockwave', priority: 200 }),
  ],
});
