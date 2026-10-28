import { pal } from '../palette';
import { chirp, wander } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'chirper',
  kind: 'creature',
  name: 'Chirper',
  pattern: 'The gut feeling',
  hp: 3,
  speed: 0.8,
  size: [0.14, 0.2],
  contactDamage: 0,
  cost: 99,
  minFloor: 1,
  maxFloor: 2,
  behaviour: chirp({ every: 2.6, base: wander({ hover: 0.6, near: 2.5, far: 6 }) }),
  model: [
    { size: [3 * TX, 2 * TX, 4 * TX], pos: [0, 3 * TX, 0], color: pal('living.dark'), name: 'body' },
    { size: [2 * TX, 2 * TX, 2 * TX], pos: [0, 5 * TX, 2 * TX], color: pal('living.base') },
    { size: [TX / 2, 4 * TX, TX / 2], pos: [-1 * TX, 7 * TX, 3 * TX], color: pal('living.dark'), rot: [0.3, 0, 0.2] },
    { size: [TX / 2, 4 * TX, TX / 2], pos: [1 * TX, 7 * TX, 3 * TX], color: pal('living.dark'), rot: [0.3, 0, -0.2] },
    { size: [TX, TX, TX / 2], pos: [-0.5 * TX, 5.5 * TX, 4.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
    { size: [TX, TX, TX / 2], pos: [0.5 * TX, 5.5 * TX, 4.25 * TX], color: pal('living.glow'), glow: true, name: 'tell' },
  ],
});
