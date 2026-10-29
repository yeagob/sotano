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
    { size: [8 * TX, 24 * TX, 8 * TX], pos: [0, 12 * TX, 0], color: pal('mat.obsidian.dark'), name: 'body' },
    { size: [8 * TX, 3 * TX, 8 * TX], pos: [0, 25.5 * TX, 0], color: pal('mat.obsidian.hi') },
    { size: [4 * TX, 2 * TX, TX / 2], pos: [0, 19 * TX, 4.25 * TX], color: pal('ink.void') },
  ],
});
