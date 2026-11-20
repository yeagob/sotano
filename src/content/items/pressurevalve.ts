import { pal } from '../palette';
import { defineItem } from '../../items/types';

// What is let out on purpose does not burst on its own: the bombs you carry are fuller and hit harder,
// and the valve hands you two more of them.
export default defineItem({
  id: 'pressurevalve',
  name: 'Pressure Valve',
  description: 'What is let out on purpose does not burst on its own. Naming the heat and opening a small outlet keeps the pressure from breaking the walls.',
  effect: 'Bombs: blast radius +0.8 blocks and damage ×1.6. Gives 2 bombs.',
  inspiredBy: 'Emotional release and the \'pressure cooker\' model of anger',
  pools: { treasure: 1 },
  tags: ['emotion', 'explosive', 'bomb'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '....bbbb....',
      '..bb....bb..',
      '.b.....d..b.',
      '.b....dd..b.',
      '.b....d...b.',
      'b..........b',
      'b..........b',
      '.b........b.',
      '..bb....bb..',
      '....bbbb....',
      '............',
      '............',
    ],
    palette: { b: pal('path.emotion.base'), d: pal('bone.paper') },
  },
  stats: [
    { stat: 'bombRadius', layer: 'add', value: 0.8 },
    { stat: 'bombDamage', layer: 'mul', value: 1.6 },
  ],
  onGain(api) { api.collect('bomb', 2); },
});
