import { pal } from '../palette';
import { defineItem } from '../../items/types';

// The turns of the hands: the Player's castSide flips after each shot while `twinCast` is on, and
// Game.fire() starts each shot from that side. Every hook on `fire` still applies to every shot.
export default defineItem({
  id: 'bilateral',
  name: 'Bilateral Stimulation',
  description: 'Left, then right, then left again. The attention moves from side to side, and a hard memory is held more lightly.',
  effect: 'Fire rate ×2. Your hands take turns: each shot is cast by the other hand, and every practice you carry applies to each shot.',
  inspiredBy: 'Bilateral stimulation, alternating left and right (EMDR, Francine Shapiro)',
  pools: { treasure: 1 },
  tags: ['emotion', 'intent'],
  color: pal('path.emotion.glow'),
  quality: 3,
  icon: {
    rows: [
      '.aa.........',
      'abba........',
      '.aa.........',
      '.........aa.',
      '........abba',
      '.........aa.',
      '.aa.........',
      'abba........',
      '.aa.........',
      '.........aa.',
      '........abba',
      '.........aa.',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base') },
  },
  stats: [
    { stat: 'fireRate', layer: 'mul', value: 2 },
    { stat: 'twinCast', layer: 'add', value: 1 },
  ],
});
