import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'occamsrazor',
  name: 'Cut Ties with Toxic Relationships',
  description: 'Some relationships drain you more than they give: with people, substances, food or technology. Cut them off and keep your energy for what gives back. An edge of light joins your intention.',
  effect: 'Adds a blade of light beside your intentions, which keep flying: hold to swing (80% of your fire rate). Each swing cuts every breakable block within 2.5 blocks in front of you (more with size, up to 6) and slices the rubble in two, hits projections for 3× damage and destroys their projectiles.',
  inspiredBy: 'Santiago (Game Glover), on toxic relationships',
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
