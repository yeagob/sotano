import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Irimi, the entering step of aikido: step into the movement instead of away from it. The dash is core
// behaviour behind the `dash` stat (entities/player.ts `startDash`), read from the double tap, the double
// flick and the swipe of the input layer (src/input/gestures.ts). DASH.md holds every number.
export default defineItem({
  id: 'irimi',
  name: 'Irimi',
  description: 'Entering, not retreating. When something comes at you, the way out is not backwards: step into the movement, quickly and cleanly, and be somewhere else before it arrives.',
  effect: 'Double-tap a direction (double-flick the stick, or swipe on the left side) to dash 4.5 blocks that way. Dash forward while looking up to rise (up to 3.5 blocks). Untouchable while dashing. Cooldown 0.8 s; one dash in the air until you land. In water a dash covers half the way.',
  inspiredBy: 'Irimi, the entering step of aikido',
  pools: { treasure: 1 },
  tags: ['body', 'movement'],
  color: pal('path.body.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '.....cc.....',
      '....cccc....',
      '...cc..cc...',
      '..cc....cc..',
      '.....bb.....',
      '.....bb.....',
      '.....bb.....',
      '.dd..bb..dd.',
      '..dd.bb.dd..',
      '...dd.b.dd..',
      '............',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('path.body.dark') },
  },
  stats: [{ stat: 'dash', layer: 'add', value: 1 }],
});
