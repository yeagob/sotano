import { pal } from '../palette';
import { defineItem } from '../../items/types';

// PROVISIONAL NAME: "Triple Jump" is the working name until the owner names it (SKY.md §9,
// MOVEMENT-ABILITIES.md open question 1). Its meaning and icon are also provisional until the owner
// and the art gate (sotano-art) confirm them. A sky gift: its only pool is 'sky', which ItemPools never
// draws from; the won horse hands it out by id.
export default defineItem({
  id: 'triple-jump',
  name: 'Triple Jump',
  description: 'Climbing is not one leap. Each jump takes you higher than the one before, and the last one carries you where no single step could reach.',
  effect: 'Two more jumps in the air: press jump again while you are off the ground. The first rises 2× a ground jump; the second rises 8× and gives full steering in the air. Neither pushes you forward. Landing restores them. No jump rises above 16 blocks.',
  inspiredBy: 'Athletics: the triple jump (a sport, its generic name)',
  pools: { sky: 1 },
  tags: ['body'],
  color: pal('path.body.glow'),
  quality: 3,
  icon: {
    rows: [
      '............',
      '............',
      '............',
      '........cccc',
      '........dbbb',
      '........dbbb',
      '....ccccdbbb',
      '....bbbddbbb',
      '....bbbddbbb',
      'ccccbbbddbbb',
      'bbbdbbbddbbb',
      'bbbdbbbddbbb',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('path.body.dark') },
  },
  stats: [{ stat: 'airJumps', layer: 'add', value: 2 }],
});
