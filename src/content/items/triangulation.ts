import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export default defineItem({
  id: 'triangulation',
  name: 'Triangulation',
  description: 'Three points of view, and the truth sits where they cross.',
  effect: 'Each shot fires three intentions in a fan; the two extra ones deal 60% damage and mining.',
  inspiredBy: 'Triangulation: seeing a thing from several places at once (surveying, and reasoning)',
  pools: { treasure: 1, vault: 2 },
  tags: ['mind', 'intent'],
  color: pal('path.mind.glow'),
  quality: 4,
  icon: {
    rows: [
      '.....cc.....',
      '....cddc....',
      '....cddc....',
      '....abba....',
      '...a.bb.a...',
      '..a..bb..a..',
      '..a.bccb.a..',
      '.a.bb..bb.a.',
      '.ab......ba.',
      'cddc....cddc',
      'cddcaaaacddc',
      '.cc......cc.',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('fire', e => { e.intent.volley += 2; }, { id: 'fan-out', priority: 20 }),
  ],
});
