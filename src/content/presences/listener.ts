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
    { size: [6 * TX, 26 * TX, 6 * TX], pos: [0, 13 * TX, 0], color: pal('bone.dim'), name: 'body' },
    { size: [8 * TX, 2 * TX, 8 * TX], pos: [0, TX, 0], color: pal('bone.faded') },
    { size: [6 * TX, 6 * TX, 6 * TX], pos: [0, 29 * TX, 0], color: pal('bone.paper') },
    { size: [TX, 3 * TX, 3 * TX], pos: [-3.5 * TX, 29.5 * TX, 0.5 * TX], color: pal('bone.dim') },
    { size: [TX, 2 * TX, 2 * TX], pos: [-3.5 * TX, 27 * TX, 0], color: pal('bone.dim') },
    { size: [TX, 3 * TX, 3 * TX], pos: [3.5 * TX, 29.5 * TX, 0.5 * TX], color: pal('bone.dim') },
    { size: [TX, 2 * TX, 2 * TX], pos: [3.5 * TX, 27 * TX, 0], color: pal('bone.dim') },
  ],
});
