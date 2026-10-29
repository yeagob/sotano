import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'boundaries',
  name: 'Boundaries',
  description: 'A line that says how close is close enough.',
  effect: 'Intentions and weapon strokes deal no damage to projections. Each one an intention or a beam hits is shoved 7 blocks/s back along the shot.',
  inspiredBy: 'Boundaries (Henry Cloud and John Townsend, Boundaries, 1992)',
  pools: { treasure: 1 },
  tags: ['emotion', 'intent'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      'aa..........',
      'ba..........',
      'ba.c..c.....',
      'aa.cc.cc..d.',
      'ba..cc.cc.dd',
      'ba..cc.cc.dd',
      'aa.cc.cc..d.',
      'ba.c..c.....',
      'ba..........',
      'aa..........',
      '............',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base'), c: pal('path.emotion.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('strike', e => { e.damage = 0; }, { id: 'no-harm-strike', priority: 20 }),
    hook('fire', e => { e.intent.damage = 0; }, { id: 'no-harm', priority: 20 }),
    hook('intentHit', (e, api) => {
      if (e.kind === 'actor') api.shove(e.target, e.vx, e.vz, 7);
    }, { id: 'push', priority: 200 }),
  ],
});
