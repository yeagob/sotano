import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'perfectionism',
  name: 'Perfectionism',
  pattern: 'It has to be perfect.',
  hp: 14,
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
    { size: [12 * TX, 16 * TX, 12 * TX], pos: [0, 8 * TX, 0], color: pal('paper.dark'), name: 'body' },
    { size: [6 * TX, 6 * TX, 6 * TX], pos: [0, 8 * TX, 6 * TX], color: pal('husk.doubt.dark') },
    { size: [12 * TX, 2 * TX, 12 * TX], pos: [0, 17 * TX, 0], color: pal('paper.base') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-6 * TX, 10 * TX, 0], color: pal('paper.hi') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [6 * TX, 10 * TX, 0], color: pal('paper.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 8 * TX, 9.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1 * TX, 8 * TX, 9.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
