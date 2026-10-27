import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'drifter',
  kind: 'creature',
  name: 'Drifter',
  pattern: 'Lightness',
  hp: 5,
  speed: 0.5,
  size: [0.34, 0.12],
  contactDamage: 0,
  cost: 99,
  minFloor: 5,
  maxFloor: 6,
  behaviour: wander({ hover: 2.2, near: 3, far: 7 }),
  model: [
    { size: [14 * TX, 2 * TX, 12 * TX], pos: [0, 2 * TX, 0], color: pal('living.hi'), name: 'body' },
    { size: [10 * TX, TX, 8 * TX], pos: [0, 3.5 * TX, 0], color: pal('living.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-3 * TX, 2 * TX, 6.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [3 * TX, 2 * TX, 6.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
