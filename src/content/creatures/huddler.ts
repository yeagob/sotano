import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'huddler',
  kind: 'creature',
  responds: 'positive',
  name: 'Huddler',
  pattern: 'Warmth shared',
  hp: 4,
  speed: 0.7,
  size: [0.2, 0.22],
  contactDamage: 0,
  cost: 99,
  minFloor: 9,
  maxFloor: 9,
  elements: { water: { path: 'cross', speed: 0.9 } },
  behaviour: wander({ hover: 0, near: 1.5, far: 3 }),
  model: [
    { size: [6 * TX, 5 * TX, 6 * TX], pos: [0, 3 * TX, 0], color: pal('living.base'), name: 'body' },
    { size: [6 * TX, 2 * TX, 6 * TX], pos: [0, 6 * TX, 0], color: pal('cold.rim') },
    { size: [TX, TX, TX / 2], pos: [-1.5 * TX, 4 * TX, 3.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX, TX, TX / 2], pos: [1.5 * TX, 4 * TX, 3.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
