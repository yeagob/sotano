import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'second-guessing',
  name: 'Second-Guessing',
  pattern: 'Wait, are you really sure?',
  hp: 52,
  speed: 1.7,
  size: [0.34, 1.6],
  contactDamage: 4,
  cost: 2,
  minFloor: 3,
  maxFloor: 7,
  drops: { heart: 0.1, key: 0.05, bomb: 0.06 },
  behaviour: chase({ lunge: 1.5, hesitate: { every: 1.2, pause: 0.8 }, reach: 0.5 }),
  elements: { water: { path: 'avoid', speed: 0.35 } },
  model: [
    { size: [10 * TX, 4 * TX, 8 * TX], pos: [0, 2 * TX, -1 * TX], color: pal('husk.doubt.dark') },
    { size: [10 * TX, TX, 8 * TX], pos: [0, 4.5 * TX, -1 * TX], color: pal('cold.rim') },
    { size: [8 * TX, 7 * TX, 6 * TX], pos: [0, 8 * TX, 0], color: pal('husk.doubt.base'), tilt: 0.35 },
    { size: [3 * TX, 4 * TX, 3 * TX], pos: [0, 12 * TX, 2.5 * TX], color: pal('husk.doubt.base'), tilt: 0.78 },
    { size: [9 * TX, 8 * TX, 8 * TX], pos: [0, 15 * TX, 5 * TX], color: pal('husk.doubt.hi'), tilt: 0.44, name: 'head' },
    { size: [3 * TX, 3 * TX, TX / 2], pos: [-2 * TX, 15 * TX, 9.25 * TX], color: pal('ink.void') },
    { size: [3 * TX, 3 * TX, TX / 2], pos: [2 * TX, 15 * TX, 9.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2.5 * TX, 15 * TX, 9.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 15 * TX, 9.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 5 * TX, 2 * TX], pos: [-5 * TX, 8.5 * TX, 1 * TX], color: pal('husk.doubt.base'), name: 'armL' },
    { size: [2 * TX, 5 * TX, 2 * TX], pos: [5 * TX, 8.5 * TX, 1 * TX], color: pal('husk.doubt.base'), name: 'armR' },
    { size: [TX, TX, TX / 2], pos: [-4 * TX, 2 * TX, 5 * TX], color: pal('cold.dim') },
  ],
});
