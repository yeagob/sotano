import { pal } from '../palette';
import { defineItem } from '../../items/types';

// The Book of Secrets: the Renaissance "books of secrets" were the recipe books of their day, remedies, meals and
// small arts written down so they would not be lost. Held, it opens the Recipe Book (src/game/recipe-book.ts): every
// brew of the alembic, every meal of the kitchen, and what each presence takes. Behaviour is the `recipes` stat, read
// by the game when the book's key or tab is used; the control is the `recipes` action (src/input/bindings.ts).
// The Roots lay it on a pedestal from mastery level 30 (FIXED_PRACTICES, src/content/tables/roots-mastery.ts).
export default defineItem({
  id: 'bookofsecrets',
  name: 'Book of Secrets',
  description: 'What you learn below is worth writing down. A book of secrets keeps the remedies, the meals and the small arts in one place, so nothing you found has to be found twice.',
  effect: 'Opens the Recipe Book (J, D-pad Down, or its tab in the menu): every potion and meal recipe, and what each presence takes.',
  inspiredBy: 'The Renaissance books of secrets (Alessio Piemontese, Secreti, 1555)',
  pools: { roots: 1 },
  tags: ['mind', 'potion'],
  color: pal('path.mind.glow'),
  quality: 1,
  icon: {
    rows: [
      '............',
      '.......pp...',
      '.......bb...',
      '......bggb..',
      '.....bggggb.',
      '.....bggggb.',
      '......bbbb..',
      '.dddddddddd.',
      '.dbbbbbbbbd.',
      '.dppppppppd.',
      '.dddddddddd.',
      '............',
    ],
    palette: { d: pal('path.mind.dark'), b: pal('path.mind.base'), p: pal('bone.paper'), g: pal('path.mind.glow') },
  },
  stats: [{ stat: 'recipes', layer: 'add', value: 1 }],
});
