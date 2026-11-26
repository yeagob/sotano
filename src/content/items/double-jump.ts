import { pal } from '../palette';
import { defineItem } from '../../items/types';

// PROVISIONAL NAME: "Double Jump" is the working name until the owner names the practices (as the Triple
// Jump is named). Its meaning, its credit and its icon are provisional too, and the art gate (sotano-art)
// has not passed the icon yet. Its pool is the treasure pool, as the other quality-3 practices (the Triple
// Jump is the sky gift). It is one more air jump on the airJumps stat: with the Triple Jump held it gives four
// jumps in all (the ground jump and three in the air, rising 2×, 8× and 16×). See docs/design/not-built/practices/DOUBLE-JUMP.md.
export default defineItem({
  id: 'double-jump',
  name: 'Double Jump',
  description: 'Leaving the ground is not the end of the lift. The body can rise once more before it has to come down.',
  effect: 'One more jump in the air: press jump again while you are off the ground. It rises 2× a ground jump, steers as the first air jump does, and pushes you nowhere forward. Landing restores it. With the Triple Jump you have four jumps in all (the ground jump and three in the air); the second rises 8× and the third 16×, both with full steering. Air jumps stop at three, whichever items give them. It also counts toward Embodied.',
  inspiredBy: 'Platform games: the double jump (a generic mechanic name)',
  pools: { treasure: 1 },
  tags: ['body'],
  color: pal('path.body.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '............',
      '............',
      '............',
      '............',
      '........cccc',
      '........dbbb',
      '........dbbb',
      '........dbbb',
      'ccccccccdbbb',
      'bbbbbbbbdbbb',
      'bbbbbbbbdbbb',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('path.body.dark') },
  },
  stats: [{ stat: 'airJumps', layer: 'add', value: 1 }],
});
