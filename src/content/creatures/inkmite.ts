import { pal } from '../palette';
import { wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'inkmite',
  kind: 'creature',
  name: 'Inkmite',
  pattern: 'Letting things go',
  hp: 2,
  speed: 1.3,
  size: [0.1, 0.14],
  contactDamage: 0,
  cost: 99,
  minFloor: 5,
  maxFloor: 6,
  behaviour: wander({ hover: 0.5, near: 1.5, far: 4 }),
  model: [
    { size: [3 * TX, 2 * TX, 3 * TX], pos: [0, 2 * TX, 0], color: pal('ink.void'), name: 'body' },
    { size: [TX, TX, TX / 2], pos: [-0.5 * TX, 3 * TX, 1.75 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX, TX, TX / 2], pos: [0.5 * TX, 3 * TX, 1.75 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
