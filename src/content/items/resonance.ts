import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

export const RESONANT = 'resonant';

export default defineItem({
  id: 'resonance',
  name: 'Resonance',
  description: 'When one thought rings true, the ones near it start to hum.',
  effect: 'Each intention that hits charges the other intentions in flight within 3 blocks. A charged intention discharges on its next hit: 3 points to projections within 2 blocks.',
  inspiredBy: 'Sympathetic resonance (physics); a nod to attunement in therapy',
  pools: { treasure: 1 },
  tags: ['mind', 'electric', 'intent'],
  color: pal('path.mind.glow'),
  quality: 3,
  icon: {
    rows: [
      '.cc..cc.....',
      '.ca..ca...b.',
      '.ca..ca.c..b',
      '.ca..ca..c.b',
      '.ca..ca..c.b',
      '.ca..ca..c.b',
      '.ca..ca.c..b',
      '.ccccca...b.',
      '..aaaa......',
      '...ca.......',
      '...ca.......',
      '..bbbb......',
    ],
    palette: { a: pal('path.mind.dark'), b: pal('path.mind.base'), c: pal('path.mind.glow') },
  },
  hooks: [
    hook('intentHit', (e, api) => {
      if (e.intent.tags.has(RESONANT)) api.pulse(e.x, e.y, e.z, 2, 3, 0, pal('light.core'), 'resonance');
    }, { id: 'discharge', priority: 200 }),
    hook('intentHit', (e, api) => {
      api.tagFlying(e.x, e.y, e.z, 3, RESONANT, e.intent);
    }, { id: 'charge', priority: 201 }),
  ],
});
