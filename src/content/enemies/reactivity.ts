import { pal } from '../palette';
import { charge } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'reactivity',
  name: 'Reactivity',
  pattern: 'How dare you!',
  hp: 48,
  speed: 1,
  size: [0.42, 0.9],
  contactDamage: 4,
  cost: 3,
  minFloor: 5,
  maxFloor: 6,
  drops: { heart: 0.1, bomb: 0.1 },
  breaks: { tier: 1, power: 6 },
  behaviour: charge({ aim: 0.7, speed: 4.8, run: 1.8, stun: 1.5, range: 9, cooldown: 1.2 }),
  model: [
    { size: [10 * TX, 8 * TX, 10 * TX], pos: [0, 6 * TX, 0], color: pal('husk.panic.base'), name: 'body' },
    { size: [10 * TX, 2 * TX, 10 * TX], pos: [0, 11 * TX, 0], color: pal('husk.panic.hi') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [0, 7 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [0, 7 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [6 * TX, 2 * TX, 2 * TX], pos: [0, 2 * TX, 6 * TX], color: pal('husk.panic.dark'), name: 'legL' },
  ],
});
