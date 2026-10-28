import { pal } from '../palette';
import { flee } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'scarcity',
  name: 'Scarcity',
  pattern: 'There will not be enough',
  hp: 10,
  speed: 1.6,
  size: [0.24, 0.3],
  contactDamage: 0,
  cost: 2,
  minFloor: 3,
  maxFloor: 4,
  drops: { key: 0.6, bomb: 0.4, heart: 0.3 },
  behaviour: flee({ hover: 0, scared: 7 }),
  model: [
    { size: [8 * TX, 8 * TX, 8 * TX], pos: [0, 5 * TX, 0], color: pal('husk.panic.dark'), name: 'body' },
    { size: [6 * TX, 2 * TX, 6 * TX], pos: [0, 10 * TX, 0], color: pal('mat.crate.base') },
    { size: [3 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 6 * TX, 4.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [3 * TX, 2 * TX, TX / 2], pos: [2 * TX, 6 * TX, 4.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
