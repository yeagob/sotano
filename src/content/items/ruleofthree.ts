import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Three strands at the corners of a triangle around the flight line (combat/intents.ts `strandOrbit`).
// The shares of damage and mining are TRIAD_SHARE; the triangle turns when Spiral Growth is held too.
export default defineItem({
  id: 'ruleofthree',
  name: 'Rule of Three',
  description: 'Three known things give the one you do not know. Three strands, each carrying its share of the answer.',
  effect: 'Each intention flies as three in a triangle that widens as it travels; each deals 70% damage and mining. With Spiral Growth the triangle turns.',
  inspiredBy: 'The rule of three, a proportion from three known terms (classical arithmetic)',
  pools: { treasure: 1 },
  tags: ['mind', 'intent'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      '.....cc.....',
      '.....cc.....',
      '....b..b....',
      '....b..b....',
      '...b....b...',
      '...b....b...',
      '..b......b..',
      '..b......b..',
      '.b........b.',
      'cc........cc',
      'ccbbbbbbbbcc',
      '............',
    ],
    palette: { b: pal('path.mind.base'), c: pal('path.mind.glow') },
  },
  stats: [{ stat: 'triad', layer: 'add', value: 1 }],
});
