import { pal } from '../palette';
import { leap } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'impulse',
  name: 'Impulse',
  pattern: 'Acting before thinking',
  hp: 16,
  speed: 1.4,
  size: [0.22, 0.6],
  contactDamage: 3,
  cost: 1,
  minFloor: 1,
  maxFloor: 2,
  drops: { heart: 0.06 },
  breaks: { tier: 0, power: 6 },
  behaviour: leap({ every: 2.2, range: 6, crouch: 0.6, air: 0.7, reach: 1.1, damage: 4 }),
  model: [
    { size: [6 * TX, 5 * TX, 6 * TX], pos: [0, 4 * TX, 0], color: pal('husk.panic.base'), name: 'body' },
    { size: [6 * TX, TX, 6 * TX], pos: [0, 7 * TX, 0], color: pal('husk.panic.hi') },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [-4 * TX, 2 * TX, 0], color: pal('husk.panic.dark'), name: 'legL' },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [4 * TX, 2 * TX, 0], color: pal('husk.panic.dark'), name: 'legR' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1.5 * TX, 5 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 5 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
