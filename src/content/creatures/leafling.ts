import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'leafling',
  kind: 'creature',
  responds: 'positive',
  name: 'Leafling',
  pattern: 'Wonder',
  hp: 3,
  speed: 0.5,
  size: [0.16, 0.22],
  contactDamage: 0,
  cost: 99,
  minFloor: 1,
  maxFloor: 5,
  behaviour: wander({ hover: 1.2, near: 2, far: 5 }),
  model: [
    { size: [4 * TX, 2 * TX, 4 * TX], pos: [0, 3 * TX, 0], color: pal('living.base'), name: 'body' },
    { size: [5 * TX, TX, 5 * TX], pos: [0, 5 * TX, 0], color: pal('living.hi') },
    { size: [TX, TX, TX / 2], pos: [-1 * TX, 3.5 * TX, 2.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX, TX, TX / 2], pos: [1 * TX, 3.5 * TX, 2.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
