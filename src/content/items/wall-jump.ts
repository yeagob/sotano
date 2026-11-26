import { pal } from '../palette';
import { defineItem } from '../../items/types';

// PROVISIONAL NAME: "Wall Jump" is the working name until the owner names the practice (as the Triple Jump is).
// Its meaning, its credit, its Spanish name and its icon are provisional too, and the art gate (sotano-art) has
// not passed the icon. Its pool is the treasure pool, the common one, as the other quality-3 body practices use.
// It is one more air jump on the airJumps counter, and `wallJumps` says that the last of those needs a wall:
// see docs/design/built/practices/body/WALL-JUMP.md.
export default defineItem({
  id: 'wall-jump',
  name: 'Wall Jump',
  description: 'A wall is not only what stops you. Lean on what is solid beside you, and the body can push off once more.',
  effect: 'One more jump in the air, and only from a wall: press jump while you are off the ground with a solid block touching your side. It rises like the next air jump (2× a ground jump as the first, then 8×, and 16× at most) and pushes you nowhere forward. Landing restores it. It counts toward the air jumps, so with the Triple Jump held it is the last of them and needs a wall.',
  inspiredBy: 'Platform games: the wall jump (a generic mechanic name)',
  pools: { treasure: 1 },
  tags: ['body'],
  color: pal('path.body.glow'),
  quality: 3,
  icon: {
    rows: [
      'dddd........',
      'dddd........',
      'dddd....cc..',
      'dddd....cc..',
      'dddd..bbbbb.',
      'dddd.bbbbbbb',
      'dddd.bbbbbb.',
      'dddd..bbbb..',
      'dddd..bb.bb.',
      'dddd.bb...bb',
      'dddd........',
      'dddd........',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('path.body.dark') },
  },
  stats: [{ stat: 'airJumps', layer: 'add', value: 1 }, { stat: 'wallJumps', layer: 'add', value: 1 }],
});
