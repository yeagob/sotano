import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'star-mite',
  kind: 'creature',
  responds: 'positive',
  name: 'Star-mite',
  pattern: 'Joining what is apart',
  hp: 2,
  speed: 0.7,
  size: [0.12, 0.16],
  contactDamage: 0,
  cost: 99,
  minFloor: 1,
  maxFloor: 5,
  behaviour: wander({ hover: 2, near: 2.5, far: 6 }),
  model: [
    { size: [2 * TX, 2 * TX, 2 * TX], pos: [0, 2 * TX, 0], color: pal('living.dark'), name: 'body' },
    { size: [TX / 2, TX / 2, TX / 2], pos: [-1.5 * TX, 3.5 * TX, 0], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX / 2, TX / 2, TX / 2], pos: [1.5 * TX, 3.5 * TX, 0], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX / 2, TX / 2, TX / 2], pos: [0, 3.5 * TX, 1.5 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
