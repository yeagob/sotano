import { pal } from '../palette';
import { defineItem, hook } from '../../items/types';

const HUM_PER_INTENTION = 0.01;

export default defineItem({
  id: 'resonance',
  name: 'Resonance',
  description: 'When one thought rings true, the ones near it start to hum.',
  effect: 'Each other intention in flight in the room adds 1% damage to the intention you fire.',
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
    hook('fire', (e, api) => {
      e.intent.damage *= 1 + HUM_PER_INTENTION * api.intentsHere();
    }, { id: 'hum', priority: 90 }),
  ],
});
