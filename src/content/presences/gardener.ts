import { pal } from '../palette';
import { defineEnemy, TX } from '../../enemies/types';
import { still } from './still';

export default defineEnemy({
  id: 'gardener',
  kind: 'creature',
  responds: 'positive',
  name: 'The Gardener',
  pattern: 'Care, patience, cultivation',
  hp: 1,
  speed: 0,
  size: [0.4, 1.4],
  contactDamage: 0,
  cost: 99,
  minFloor: 99,
  behaviour: still,
  model: [
    { size: [10 * TX, 5 * TX, 10 * TX], pos: [0, 2.5 * TX, 0], color: pal('bone.dim'), name: 'body' },
    { size: [4 * TX, 3 * TX, 4 * TX], pos: [0, 6.5 * TX, 0], color: pal('bone.paper') },
    { size: [TX, 4 * TX, TX], pos: [0, 10 * TX, 0], color: pal('living.hi') },
  ],
});
