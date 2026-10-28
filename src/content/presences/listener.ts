import { pal } from '../palette';
import { defineEnemy, TX } from '../../enemies/types';
import { still } from './still';

export default defineEnemy({
  id: 'listener',
  kind: 'creature',
  responds: 'positive',
  name: 'The Listener',
  pattern: 'Being heard',
  hp: 1,
  speed: 0,
  size: [0.35, 2.4],
  contactDamage: 0,
  cost: 99,
  minFloor: 99,
  behaviour: still,
  model: [
    { size: [6 * TX, 24 * TX, 6 * TX], pos: [0, 12 * TX, 0], color: pal('bone.dim'), name: 'body' },
    { size: [6 * TX, 4 * TX, 6 * TX], pos: [0, 26 * TX, 0], color: pal('bone.paper') },
    { size: [2 * TX, 4 * TX, 2 * TX], pos: [3 * TX, 15 * TX, 2 * TX], color: pal('bone.paper') },
  ],
});
