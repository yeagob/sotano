import { pal } from '../palette';
import { defineItem } from '../../items/types';

export default defineItem({
  id: 'occamsrazor',
  name: 'Cut Ties with Toxic Relationships',
  description: 'Some relationships drain you more than they give: with people, substances, food or technology. Cut them off and keep your energy for what gives back. An edge of light joins your intention.',
  effect: 'Adds a blade of light beside your intentions, which keep flying: hold to swing (80% of your fire rate). Each swing cuts every breakable block within 2.5 blocks in front of you (more with size, up to 6) and slices the rubble in two, hits projections for 3× damage and destroys their projectiles.',
  inspiredBy: 'Santiago (Game Glover), on toxic relationships',
  pools: { secret: 1 },
  tags: ['mind', 'weapon'],
  color: pal('path.mind.glow'),
  quality: 4,
  // the icon is a knife made from one of the deep desert's worm's teeth (owner, issue #354): a milky curved tooth for a
  // blade, hooked at its tip, its cutting edge lit in the path's glow, the root of the tooth as a guard, a wrapped grip
  icon: {
    rows: [
      '........aa..',
      '.........aa.',
      '.........aab',
      '........aab.',
      '.......aab..',
      '......aab...',
      '.....aab....',
      '....aab.....',
      '...ddb......',
      '..ccd.......',
      '.cc.........',
      'cc..........',
    ],
    palette: { a: pal('bone.paper'), b: pal('path.mind.glow'), c: pal('path.mind.dark'), d: pal('bone.dim') },
  },
  weapon: { id: 'blade', priority: 10 },
});
