import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

// Dowsing and Eye Contact both steer intentions. Only one of them guides at a time: the hooks run in
// acquisition order, so the one gained last writes `homingTarget` last (tests/aim-practices.test.ts).
export default defineItem({
  id: 'dowsing',
  name: 'Dowsing',
  description: 'Finding what lies hidden in the ground by trusting a quiet pull.',
  effect: 'Intentions curve toward the nearest block within 6 blocks. If you also carry Eye Contact, the one you got last is the one that guides.',
  inspiredBy: 'Dowsing, the folk practice of finding water and ore with a rod',
  pools: { treasure: 1 },
  tags: ['mind', 'blocks', 'aim'],
  color: pal('path.mind.glow'),
  quality: 2,
  icon: {
    rows: [
      '..cc....cc..',
      '..bb....bb..',
      '...bb..bb...',
      '....bbbb....',
      '.....bb.....',
      '.....bb.....',
      '.....bb.....',
      '.....bb.....',
      '.....aa.....',
      '....aaaa....',
      '............',
      '............',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow') },
  },
  messages: { takesOver: 'Dowsing now guides your intentions; Eye Contact is set aside.' },
  onGain(api) { if (api.has('eyecontact')) api.toast('takesOver'); },
  hooks: [
    // the last gained of Dowsing and Eye Contact writes last, so it sets both the strength and the target
    hook('fire', e => { e.intent.homing = 3; e.intent.homingTarget = 'block'; }, { id: 'aim', priority: 20 }),
  ],
});
