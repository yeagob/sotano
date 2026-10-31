import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'perfectionism',
  name: 'Perfectionism',
  pattern: 'It has to be perfect.',
  hp: 28,
  speed: 0.8,
  size: [0.4, 1.4],
  contactDamage: 4,
  cost: 3,
  minFloor: 3,
  maxFloor: 6,
  shell: { plates: 6, plateHp: 4 },
  drops: { heart: 0.1, key: 0.05 },
  behaviour: chase({}),
  model: [
    { size: [10 * TX, 20 * TX, 8 * TX], pos: [0, 14 * TX, 0], color: pal('paper.dark'), name: 'body' },
    { size: [8 * TX, 4 * TX, 6 * TX], pos: [0, 2 * TX, 0], color: pal('husk.doubt.dark') },
    { size: [3 * TX, 2 * TX, 2 * TX], pos: [-2.5 * TX, TX, 3 * TX], color: pal('husk.doubt.base') },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [3 * TX, 1.5 * TX, 3 * TX], color: pal('husk.doubt.hi') },
    { size: [12 * TX, 2 * TX, 10 * TX], pos: [0, 25 * TX, 0], color: pal('paper.base') },
    { size: [8 * TX, 6 * TX, 6 * TX], pos: [0, 29 * TX, 0], color: pal('paper.base') },
    { size: [3 * TX, 4 * TX, TX], pos: [-2.5 * TX, 29 * TX, 3.5 * TX], color: pal('ink.void') },
    { size: [3 * TX, 4 * TX, TX], pos: [2.5 * TX, 29 * TX, 3.5 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX], pos: [-2 * TX, 29 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX], pos: [2 * TX, 29 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [4 * TX, 7 * TX, TX], pos: [-3 * TX, 9.5 * TX, 4.5 * TX], color: pal('paper.hi'), name: 'plate' },
    { size: [4 * TX, 7 * TX, TX], pos: [3 * TX, 9.5 * TX, 4.5 * TX], color: pal('paper.hi'), name: 'plate' },
    { size: [4 * TX, 7 * TX, TX], pos: [-3 * TX, 18.5 * TX, 4.5 * TX], color: pal('paper.hi'), name: 'plate' },
    { size: [4 * TX, 7 * TX, TX], pos: [3 * TX, 18.5 * TX, 4.5 * TX], color: pal('paper.hi'), name: 'plate' },
    { size: [TX, 8 * TX, 4 * TX], pos: [-5.5 * TX, 14 * TX, 0], color: pal('paper.hi'), name: 'plate' },
    { size: [TX, 8 * TX, 4 * TX], pos: [5.5 * TX, 14 * TX, 0], color: pal('paper.hi'), name: 'plate' },
  ],
});
