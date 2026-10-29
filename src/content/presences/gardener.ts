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
    { size: [6 * TX, 12 * TX, 4 * TX], pos: [0, 8 * TX, 0], color: pal('bone.dim'), name: 'body' },
    { size: [8 * TX, 2 * TX, 6 * TX], pos: [0, TX, 0], color: pal('bone.faded') },
    { size: [2 * TX, 6 * TX, 4 * TX], pos: [-4 * TX, 11 * TX, 0], color: pal('bone.paper') },
    { size: [2 * TX, 6 * TX, 4 * TX], pos: [4 * TX, 11 * TX, 0], color: pal('bone.paper') },
    { size: [10 * TX, 2 * TX, 3 * TX], pos: [0, 9 * TX, 1.5 * TX], color: pal('bone.paper') },
    { size: [4 * TX, 4 * TX, 4 * TX], pos: [0, 16 * TX, 0], color: pal('bone.paper') },
    { size: [6 * TX, 2 * TX, 6 * TX], pos: [0, 19 * TX, 0], color: pal('bone.dim') },
    { size: [TX, 4 * TX, TX], pos: [0.5 * TX, 12 * TX, 2.5 * TX], color: pal('living.hi') },
    { size: [2 * TX, TX, TX], pos: [-1 * TX, 13.5 * TX, 2.5 * TX], color: pal('living.hi') },
    { size: [2 * TX, TX, TX], pos: [2 * TX, 12.5 * TX, 2.5 * TX], color: pal('living.hi') },
  ],
});
