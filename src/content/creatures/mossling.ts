import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'mossling',
  kind: 'creature',
  name: 'Mossling',
  pattern: 'Rest',
  hp: 6,
  speed: 0.35,
  size: [0.22, 0.3],
  contactDamage: 0,
  cost: 99,
  minFloor: 0,
  maxFloor: 0,
  behaviour: wander({ hover: 0, near: 1.5, far: 4 }),
  model: [
    { size: [8 * TX, 6 * TX, 8 * TX], pos: [0, 3 * TX, 0], color: pal('living.base'), name: 'body' },
    { size: [6 * TX, 2 * TX, 6 * TX], pos: [0, 8 * TX, 0], color: pal('living.hi') },
    { size: [2 * TX, 2 * TX, 2 * TX], pos: [-3 * TX, 8 * TX, 1 * TX], color: pal('living.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 4 * TX, 4.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 4 * TX, 4.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
