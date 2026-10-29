import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export const CHARGED = 'charged';

export default defineItem({
  id: 'rapport',
  name: 'Rapport',
  description: 'Two things that understand each other pass the current along.',
  effect: 'Intentions that hit a loose cube charge it. A charged cube that lands hard discharges: 4 points to projections within 2.5 blocks, shoved back.',
  inspiredBy: 'Rapport, the working alliance of therapy (Carl Rogers, On Becoming a Person, 1961)',
  pools: { treasure: 1 },
  tags: ['emotion', 'electric', 'blocks'],
  color: pal('path.emotion.glow'),
  quality: 2,
  icon: {
    rows: [
      '........cccc',
      '........bbaa',
      '........bbaa',
      '......ddbbaa',
      '.....dd.....',
      '....ddddd...',
      '......dd....',
      '.....dd.....',
      'cccc.d......',
      'bbaa........',
      'bbaa........',
      'bbaa........',
    ],
    palette: { a: pal('path.emotion.dark'), b: pal('path.emotion.base'), c: pal('path.emotion.glow'), d: pal('bone.paper') },
  },
  hooks: [
    hook('intentHit', (e, api) => {
      if (e.kind === 'cube') api.tagCube(e.target, CHARGED);
    }, { id: 'charge', priority: 200 }),
    hook('debrisImpact', (e, api) => {
      if (e.tags.has(CHARGED)) api.pulse(e.x, e.y, e.z, 2.5, 4, 6, pal('light.core'), 'rapport');
    }, { id: 'discharge', priority: 200 }),
  ],
});
