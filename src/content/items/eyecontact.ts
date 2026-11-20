import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

// Eye Contact and Dowsing both steer intentions. Only one of them guides at a time: the one gained last
// writes `homingTarget` last (see dowsing.ts and tests/aim-practices.test.ts).
export default defineItem({
  id: 'eyecontact',
  name: 'Eye Contact',
  description: 'Looking at what you fear instead of away from it.',
  effect: 'Intentions curve toward the nearest projection within 8 blocks. If you also carry Dowsing, the one you got last is the one that guides.',
  inspiredBy: 'Eye contact in exposure and assertiveness training',
  pools: { treasure: 1 },
  tags: ['will', 'aim'],
  color: pal('path.will.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '............',
      '............',
      '.aaa....aaa.',
      'abbba..abbba',
      'abcba..abcba',
      'abbba..abbba',
      '.aaa....aaa.',
      '............',
      '............',
      '............',
      '............',
    ],
    palette: { a: pal('path.will.dark'), b: pal('path.will.base'), c: pal('path.will.glow') },
  },
  messages: { takesOver: 'Eye Contact now guides your intentions; Dowsing is set aside.' },
  onGain(api) { if (api.has('dowsing')) api.toast('takesOver'); },
  hooks: [
    // strong enough to bend a shot into a projection a few blocks off the line (3 only grazes it);
    // the last gained of Dowsing and Eye Contact writes last, so it sets both the strength and the target
    hook('fire', e => { e.intent.homing = 10; e.intent.homingTarget = 'projection'; }, { id: 'aim', priority: 20 }),
  ],
});
