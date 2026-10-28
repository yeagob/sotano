import { pal } from '../palette';
import { emitter } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const rule = (e: Enemy, ctx: EnemyCtx) => {
  const t = ctx.target(e);
  if (!t) return;
  const along = Math.abs(t.x - e.body.x) >= Math.abs(t.z - e.body.z);
  const dx = along ? Math.sign(t.x - e.body.x) : 0, dz = along ? 0 : Math.sign(t.z - e.body.z);
  ctx.bolt(e, dx, 0, dz, 10, 4);
};

export default defineEnemy({
  id: 'shoulds',
  name: 'The Shoulds',
  pattern: 'I should… I should…',
  hp: 16,
  speed: 0,
  size: [0.3, 0.4],
  contactDamage: 0,
  cost: 2,
  minFloor: 5,
  maxFloor: 6,
  drops: { heart: 0.06, bomb: 0.06 },
  behaviour: emitter({ every: 2.2, shot: rule }),
  model: [
    { size: [4 * TX, 14 * TX, 3 * TX], pos: [0, 7 * TX, 0], color: pal('paper.dark'), name: 'body' },
    { size: [8 * TX, 2 * TX, 3 * TX], pos: [0, 13 * TX, 0], color: pal('paper.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 9 * TX, 1.75 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1 * TX, 9 * TX, 1.75 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
