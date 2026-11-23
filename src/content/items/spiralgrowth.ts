import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Each intention becomes a helix of three strands 120 degrees apart (combat/intents.ts `strandOrbit`).
// Alone it works on its own; with Bilateral Stimulation the pair is tuned by the `doublehelix` synergy.
export default defineItem({
  id: 'spiralgrowth',
  name: 'Spiral Growth',
  description: 'Growth rarely goes in a straight line. It turns around its own centre and moves on.',
  effect: 'Fire rate ×2. Your hands take turns. Each intention flies as three spiralling strands (one full, two at 40% damage and mining), and every practice applies to each.',
  inspiredBy: 'The spiral of growth, seen in shells, leaves and seed heads (phyllotaxis)',
  pools: { boss: 1, vault: 1 },
  tags: ['body', 'intent'],
  color: pal('path.body.glow'),
  quality: 4,
  icon: {
    rows: [
      '............',
      '............',
      '.c..........',
      '.c..bbbbb...',
      'cc..b...bb..',
      'c...b....b..',
      'cb..b.b..b..',
      '.b..bbb..b..',
      '.bb.....bb..',
      '..bb...bb...',
      '....bbbb....',
      '............',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow') },
  },
  stats: [
    { stat: 'fireRate', layer: 'mul', value: 2 },
    { stat: 'twinCast', layer: 'add', value: 1 },
    { stat: 'spiral', layer: 'add', value: 1 },
  ],
});
