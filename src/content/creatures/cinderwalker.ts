import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'cinderwalker',
  kind: 'creature',
  name: 'Cinderwalker',
  pattern: 'Walking through fire',
  hp: 6,
  speed: 1,
  size: [0.2, 0.28],
  contactDamage: 0,
  cost: 99,
  minFloor: 7,
  maxFloor: 8,
  elements: { lava: { path: 'cross', harm: 0, speed: 0.9 }, fire: { path: 'cross', harm: 0, speed: 0.9 } },
  behaviour: wander({ hover: 0, near: 2, far: 5 }),
  model: [
    { size: [6 * TX, 5 * TX, 6 * TX], pos: [0, 3 * TX, 0], color: pal('living.dark'), name: 'body' },
    { size: [6 * TX, TX, 6 * TX], pos: [0, 6 * TX, 0], color: pal('mat.stone.base') },
    { size: [TX, TX, TX / 2], pos: [-1.5 * TX, 4 * TX, 3.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX, TX, TX / 2], pos: [1.5 * TX, 4 * TX, 3.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
