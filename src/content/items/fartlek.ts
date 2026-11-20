import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Fartlek, the Swedish speed play: run for the joy of it, fast and slow as the body likes. The run is core
// behaviour behind the `run` stat (entities/player.ts `walk`, RUN-AND-CROUCH.md holds every number); the
// control is the `run` action of the input layer (src/input/bindings.ts).
export default defineItem({
  id: 'fartlek',
  name: 'Fartlek',
  description: 'Speed play. Run for a while because it feels good, then walk, then run again, as the body likes. Nothing to win and nothing to measure; only the pace you choose.',
  effect: 'Hold Shift (L3, or push the stick to its edge) to run 45% faster.',
  inspiredBy: 'Fartlek, the Swedish "speed play" training',
  pools: { treasure: 1 },
  tags: ['body', 'movement'],
  color: pal('path.body.glow'),
  quality: 2,
  icon: {
    rows: [
      '........cc..',
      '........cc..',
      '.......bbb..',
      '......bbbb..',
      '..cc.dbbb...',
      '.ccd.bbb....',
      '....bbb.....',
      '...b..b.....',
      '..b....b....',
      '.b......b...',
      'bb..........',
      '............',
    ],
    palette: { b: pal('path.body.base'), c: pal('path.body.glow'), d: pal('path.body.dark') },
  },
  stats: [{ stat: 'run', layer: 'add', value: 1 }],
});
