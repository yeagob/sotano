import { pal } from '../palette';
import { volley } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';
import { still } from './still';

export const SANCTUARY_RADIUS = 2;

const throwCube = (e: Enemy, ctx: EnemyCtx) => {
  const t = ctx.target(e);
  if (t) ctx.shootAt(e, t.x, t.y + 1, t.z);
};

export default defineEnemy({
  id: 'boundary',
  kind: 'projection',
  responds: 'negative',
  name: 'The Boundary',
  pattern: 'Boundaries',
  hp: 9999,
  armor: 1,
  speed: 0,
  size: [0.5, 2.6],
  contactDamage: 0,
  cost: 99,
  minFloor: 99,
  behaviour: volley({ every: 2.4, shot: throwCube, then: still }),
  model: [
    { size: [6 * TX, 34 * TX, 6 * TX], pos: [0, 17 * TX, 0], color: pal('limestone.dark'), name: 'body' },
    { size: [16 * TX, 4 * TX, 3 * TX], pos: [0, 2 * TX, 6.5 * TX], color: pal('limestone.dark') },
    { size: [16 * TX, 4 * TX, 3 * TX], pos: [0, 2 * TX, -6.5 * TX], color: pal('limestone.dark') },
    { size: [3 * TX, 4 * TX, 10 * TX], pos: [-6.5 * TX, 2 * TX, 0], color: pal('limestone.dark') },
    { size: [3 * TX, 4 * TX, 10 * TX], pos: [6.5 * TX, 2 * TX, 0], color: pal('limestone.dark') },
    { size: [16 * TX, TX, 3 * TX], pos: [0, 4.5 * TX, 6.5 * TX], color: pal('limestone.base') },
    { size: [16 * TX, TX, 3 * TX], pos: [0, 4.5 * TX, -6.5 * TX], color: pal('limestone.base') },
    { size: [3 * TX, TX, 10 * TX], pos: [-6.5 * TX, 4.5 * TX, 0], color: pal('limestone.base') },
    { size: [3 * TX, TX, 10 * TX], pos: [6.5 * TX, 4.5 * TX, 0], color: pal('limestone.base') },
    { size: [8 * TX, 6 * TX, 8 * TX], pos: [0, 37 * TX, 0], color: pal('limestone.dark') },
    { size: [8 * TX, TX, 8 * TX], pos: [0, 40.5 * TX, 0], color: pal('limestone.base') },
    { size: [4 * TX, TX, TX], pos: [0, 38.5 * TX, 4.5 * TX], color: pal('husk.doubt.dark') },
    { size: [4 * TX, TX, TX], pos: [0, 35.5 * TX, 4.5 * TX], color: pal('husk.doubt.dark') },
    { size: [TX, 2 * TX, TX], pos: [-1.5 * TX, 37 * TX, 4.5 * TX], color: pal('husk.doubt.dark') },
    { size: [TX, 2 * TX, TX], pos: [1.5 * TX, 37 * TX, 4.5 * TX], color: pal('husk.doubt.dark') },
    { size: [2 * TX, 2 * TX, TX], pos: [0, 37 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
