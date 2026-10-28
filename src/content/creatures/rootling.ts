import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'rootling',
  kind: 'creature',
  name: 'Rootling',
  pattern: 'Curiosity',
  hp: 4,
  speed: 0.9,
  size: [0.16, 0.3],
  contactDamage: 0,
  cost: 99,
  minFloor: 0,
  maxFloor: 0,
  behaviour: wander({ hover: 0, near: 2, far: 6 }),
  model: [
    { size: [4 * TX, 3 * TX, 4 * TX], pos: [0, 3 * TX, 0], color: pal('living.base'), name: 'body' },
    { size: [4 * TX, TX, 4 * TX], pos: [0, 6 * TX, 0], color: pal('living.hi') },
    { size: [TX, 3 * TX, TX], pos: [-1.5 * TX, 0, 1 * TX], color: pal('living.dark'), name: 'legL' },
    { size: [TX, 3 * TX, TX], pos: [1.5 * TX, 0, -1 * TX], color: pal('living.dark'), name: 'legR' },
    { size: [TX, TX, TX / 2], pos: [-1 * TX, 4 * TX, 2.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX, TX, TX / 2], pos: [1 * TX, 4 * TX, 2.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
