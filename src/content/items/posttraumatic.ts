import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'posttraumatic',
  name: 'Post-Traumatic Growth',
  description: 'Some people come through a hard time with more than they had before: a deeper care for others, a clearer sense of what matters, a strength they did not know they had. The wound stays, and it can become ground.',
  effect: 'Walk on lava for 2 seconds per copy, up to 6 seconds, then the lava burns you as usual. The time comes back once you are out of it. Your intentions still go out in it.',
  inspiredBy: "Tedeschi and Calhoun's post-traumatic growth (1996)",
  pools: { treasure: 1 },
  tags: ['emotion', 'fire'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '....cccc....',
      '..cccccccc..',
      '.cccccccccc.',
      '..cccccccc..',
      '.....ss.....',
      '.....ss.....',
      '.....ss.....',
      '.....ss.....',
      'bbbbbbbbbbbb',
      'dbdbdbdbdbdb',
      'bdbdbdbdbdbd',
      'dddddddddddd',
    ],
    palette: { c: pal('path.body.glow'), s: pal('path.emotion.dark'), b: pal('el.lava.hot'), d: pal('el.lava.molten') },
  },
  // lavaWalk: the seconds you may walk on lava (2 per copy; the stat caps the total at 6). While time is left, lava does
  // not hurt you and you walk on its surface at full speed (game.ts: lavaWalkLeft, playerElements, the solid test).
  // Intentions are still put out by lava, and fire still hurts.
  stats: [{ stat: 'lavaWalk', layer: 'add', value: 2 }],
});
