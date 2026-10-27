import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'occamsrazor',
  name: "Occam's Razor",
  description: 'Of all the explanations, keep the simplest; cut away everything that is not needed. An edge of light joins your intention.',
  effect: 'Adds a blade of light beside your intentions, which keep flying: hold to swing (80% of your fire rate). Each swing cuts every breakable block within 2.5 blocks in front of you (more with size, up to 6) and slices the rubble in two, hits projections for 3× damage and destroys their projectiles.',
  inspiredBy: "Occam's razor (William of Ockham, 14th century); a wink at the swords of light of space opera",
  pools: { boss: 1 },
  tags: ['mind', 'weapon'],
  color: pal('path.mind.glow'),
  quality: 4,
  icon: {
    rows: [
      '..........aa',
      '.........aba',
      '........abb.',
      '.......abb..',
      '......abb...',
      '.....abb....',
      '....abb.....',
      '...abb......',
      '..cbb.......',
      '.dcc........',
      'dd.c........',
      'dd..........',
    ],
    palette: { a: pal('light.core'), b: pal('path.mind.glow'), c: pal('path.mind.dark'), d: pal('brass.base') },
  },
  weapon: { id: 'blade', priority: 10 },
});
