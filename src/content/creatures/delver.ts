import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'delver',
  kind: 'creature',
  name: 'Delver',
  pattern: 'Play',
  hp: 5,
  speed: 1.1,
  size: [0.2, 0.22],
  contactDamage: 0,
  cost: 99,
  minFloor: 1,
  maxFloor: 3,
  behaviour: wander({ hover: 0, near: 2, far: 5 }),
  model: [
    { size: [5 * TX, 4 * TX, 5 * TX], pos: [0, 3 * TX, 0], color: pal('living.base'), name: 'body' },
    { size: [5 * TX, 2 * TX, 3 * TX], pos: [0, 5 * TX, 2 * TX], color: pal('mat.dirt.base') },
    { size: [3 * TX, 2 * TX, TX], pos: [0, 2 * TX, 3.5 * TX], color: pal('mat.dirt.hi') },
    { size: [TX, TX, TX / 2], pos: [-1 * TX, 5 * TX, 2.5 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX, TX, TX / 2], pos: [1 * TX, 5 * TX, 2.5 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
