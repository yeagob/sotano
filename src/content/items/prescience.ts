import { pal } from '../palette';
import { defineItem } from '../../items/types';

// Prescience (Presciencia, issue #354; the name is the owner's proposal and provisional): the gift of the deep desert's
// worm, given when the player steps off it after calming it. Unique: its only pool is 'secret', so no pool draws it and
// adding it moves no seed. The rule is the `prescience` stat, read by the minimap (src/game/minimap.ts, Hud.updateMap).
// Docs: docs/design/not-built/practices/PRESCIENCE.md.
export default defineItem({
  id: 'prescience',
  name: 'Prescience',
  description: 'Whoever has ridden the great worm learns to read what has not yet risen out of the sand: the shape of a place before you walk it, and what it keeps for you.',
  effect: 'Every floor\'s map shows all of its rooms from the start, the vaults behind their hard walls included, and a gold mark on every room that holds a practice (on a pedestal, in a chest, or laid by the Roots). Unique: only the worm of the deep desert gives it.',
  inspiredBy: 'Frank Herbert, Dune (1965): the prescience the desert gives',
  pools: { secret: 1 },
  rarity: 'unique',
  tags: ['mind'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      '.....c......',
      '..c.....c...',
      '....bbbb....',
      '..bbaaaabb..',
      '.bbaaddaabb.',
      'bbaaddddaabb',
      '.bbaaddaabb.',
      '..bbaaaabb..',
      '....bbbb....',
      '..c.....c...',
      '.....c......',
      '............',
    ],
    palette: { a: pal('path.mind.base'), b: pal('path.mind.dark'), c: pal('path.mind.glow'), d: pal('ink.void') },
  },
  stats: [{ stat: 'prescience', layer: 'add', value: 1 }],
});
