import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'ferryback',
  kind: 'creature',
  name: 'Ferryback',
  pattern: 'Being carried',
  hp: 14,
  speed: 0.6,
  size: [0.42, 0.2],
  contactDamage: 0,
  cost: 99,
  minFloor: 3,
  maxFloor: 4,
  elements: { water: { path: 'dwell', speed: 1 } },
  behaviour: wander({ hover: 0.4, near: 3, far: 6 }),
  model: [
    { size: [14 * TX, 4 * TX, 10 * TX], pos: [0, 4 * TX, 0], color: pal('living.base'), name: 'body' },
    { size: [12 * TX, 2 * TX, 8 * TX], pos: [0, 7 * TX, 0], color: pal('living.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-3 * TX, 5 * TX, 5.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [3 * TX, 5 * TX, 5.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
