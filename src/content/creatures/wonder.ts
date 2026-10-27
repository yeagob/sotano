import { pal } from '../palette';
import { flee } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

// Wonder: the curiosity that leads you down. A small moth of pale paper that drifts among the roots
// and keeps away from you; it never touches you and never fights. A negative intention can kill it,
// a positive one mends it. Not a projection: no husk, no cold eye, no glow (light is yours). Texel units.
export default defineEnemy({
  id: 'wonder',
  name: 'Wonder',
  pattern: 'Curiosity',
  hp: 3,
  speed: 1.4,
  size: [0.2, 0.4],
  contactDamage: 0,
  // never part of a roster: only spawned as the roots' ambient life
  cost: 99,
  minFloor: 99,
  behaviour: flee({ hover: 1.1, scared: 4 }),
  model: [
    { size: [3 * TX, 3 * TX, 5 * TX], pos: [0, 4 * TX, 0], color: pal('paper.base'), name: 'body' },
    { size: [2 * TX, 2 * TX, 2 * TX], pos: [0, 5 * TX, 3 * TX], color: pal('paper.hi'), name: 'head' },
    { size: [TX / 2, TX, TX], pos: [-1 * TX, 5.5 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [TX / 2, TX, TX], pos: [1 * TX, 5.5 * TX, 4.25 * TX], color: pal('ink.void') },
    // wings, flapping like arms
    { size: [6 * TX, TX, 5 * TX], pos: [-4.5 * TX, 5 * TX, 0], color: pal('paper.hi'), name: 'armL', rot: [0, 0, 0.3] },
    { size: [6 * TX, TX, 5 * TX], pos: [4.5 * TX, 5 * TX, 0], color: pal('paper.hi'), name: 'armR', rot: [0, 0, -0.3] },
    { size: [5 * TX, TX / 2, 3 * TX], pos: [-4 * TX, 5.25 * TX, -1 * TX], color: pal('paper.dark') },
    { size: [5 * TX, TX / 2, 3 * TX], pos: [4 * TX, 5.25 * TX, -1 * TX], color: pal('paper.dark') },
  ],
});
