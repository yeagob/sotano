import { pal } from '../palette';
import { emitter } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const volley = (e: Enemy, ctx: EnemyCtx) => {
  const t = ctx.target(e);
  if (!t) return;
  const post = e.seq % 3, x = e.body.x + (post - 1) * 2.5;
  const dx = t.x - x, dz = t.z - e.body.z, l = Math.hypot(dx, dz) || 1;
  ctx.bolt(e, dx / l, (t.y + 1 - e.body.y) / l, dz / l, 8, 4);
  e.seq++;
};

export default defineEnemy({
  id: 'tribunal',
  name: 'The Tribunal',
  pattern: 'We have all agreed.',
  hp: 72,
  speed: 0,
  size: [1.2, 2.2],
  contactDamage: 0,
  cost: 4,
  minFloor: 6,
  maxFloor: 9,
  drops: { heart: 0.1, key: 0.06, bomb: 0.08 },
  behaviour: emitter({ every: 1.2, shot: volley }),
  model: [
    { size: [3 * TX, 32 * TX, 3 * TX], pos: [-5 * TX, 16 * TX, 0], color: pal('paper.base'), name: 'body' },
    { size: [3 * TX, 32 * TX, 3 * TX], pos: [0, 16 * TX, 0], color: pal('paper.base') },
    { size: [3 * TX, 32 * TX, 3 * TX], pos: [5 * TX, 16 * TX, 0], color: pal('paper.base') },
    { size: [20 * TX, 3 * TX, 4 * TX], pos: [0, 30 * TX, 0], color: pal('paper.dark') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-5 * TX, 26 * TX, 2.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [0, 26 * TX, 2.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [5 * TX, 26 * TX, 2.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
