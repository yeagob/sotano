import { pal } from '../palette';
import { flit } from './distraction';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'noise',
  name: 'Noise',
  pattern: 'Ooh! And that! And that!',
  hp: 4,
  speed: 2.4,
  size: [0.2, 0.2],
  contactDamage: 2,
  cost: 3,
  minFloor: 4,
  maxFloor: 9,
  drops: { heart: 0.03 },
  behaviour: flit,
  model: [
    { size: [3 * TX, 2 * TX, 3 * TX], pos: [0, 2 * TX, 0], color: pal('husk.doubt.dark') },
    { size: [5 * TX, TX / 2, 2 * TX], pos: [-3 * TX, 3 * TX, 0], color: pal('husk.doubt.hi'), rot: [0, 0, 0.3] },
    { size: [5 * TX, TX / 2, 2 * TX], pos: [3 * TX, 3 * TX, 0], color: pal('husk.doubt.hi'), rot: [0, 0, -0.3] },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-0.5 * TX, 2.5 * TX, 1.75 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [0.5 * TX, 2.5 * TX, 1.75 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
