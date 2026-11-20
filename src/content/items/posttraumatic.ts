import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'posttraumatic',
  name: 'Post-Traumatic Growth',
  description: 'Some people come through a hard time with more than they had before: a deeper care for others, a clearer sense of what matters, a strength they did not know they had. The wound stays, and it can become ground.',
  effect: 'Lava never hurts you: you walk on its surface and wade through it at full speed. Your intentions still go out in it.',
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
  // lavaWalk: lava does not hurt you (playerElements), walks on its surface and wades at full speed (the solid test
  // and the wade in game.ts). Intentions are still put out by lava, and fire still hurts.
  stats: [{ stat: 'lavaWalk', layer: 'add', value: 1 }],
});
