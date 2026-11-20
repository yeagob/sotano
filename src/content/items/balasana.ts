import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Balasana, the child's pose: folding in to rest is also a way forward. The crouch is core behaviour behind
// the `crouch` stat (entities/stance.ts, entities/player.ts `setStance`); the control is the `crouch` action
// of the input layer (src/input/bindings.ts). RUN-AND-CROUCH.md holds every number.
export default defineItem({
  id: 'balasana',
  name: "Child's Pose",
  description: 'Folding in to rest is also a way forward. Make yourself small and low: the body that bends passes under what would stop it, and keeps its footing at the edge.',
  effect: 'Hold C (R3, or swipe down from the bottom of the right side, which toggles it) to crouch: fit through 1-block gaps, never fall off edges, take half contact damage. Crouched you move at 45% speed.',
  inspiredBy: 'Balasana, the child\'s pose of yoga',
  pools: { treasure: 1 },
  tags: ['body', 'movement'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '............',
      '............',
      '.........cc.',
      '.....bbbbcc.',
      '...bbbbbb...',
      '..bbbbbb....',
      '.dddddd.....',
      'dddddddddd..',
      '............',
      '............',
      '............',
      '............',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('path.body.dark') },
  },
  stats: [{ stat: 'crouch', layer: 'add', value: 1 }],
});
