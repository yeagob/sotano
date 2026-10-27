import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'bubbler',
  kind: 'creature',
  name: 'Bubbler',
  pattern: 'Breath, the body\'s rhythm',
  hp: 4,
  speed: 0.9,
  size: [0.18, 0.18],
  contactDamage: 0,
  cost: 99,
  minFloor: 3,
  maxFloor: 4,
  elements: { water: { path: 'dwell', speed: 1.1 } },
  behaviour: wander({ hover: 0.8, near: 2, far: 5 }),
  model: [
    { size: [5 * TX, 3 * TX, 6 * TX], pos: [0, 4 * TX, 0], color: pal('living.base'), name: 'body' },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [0, 4 * TX, -4 * TX], color: pal('living.dark') },
    { size: [2 * TX, 2 * TX, 2 * TX], pos: [0, 4 * TX, 4 * TX], color: pal('living.hi') },
    { size: [TX, TX, TX / 2], pos: [-1 * TX, 5 * TX, 4.5 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX, TX, TX / 2], pos: [1 * TX, 5 * TX, 4.5 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
