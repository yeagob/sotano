import { pal } from '../palette';
import { emitter } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const bounce = (e: Enemy, ctx: EnemyCtx) => {
  const t = ctx.target(e);
  if (!t) return;
  for (const off of [-1, 0, 1]) {
    const x = e.body.x + off * 1.2, z = e.body.z - 0.3 * Math.abs(off);
    const dx = t.x - x, dz = t.z - z, l = Math.hypot(dx, dz) || 1;
    ctx.bolt(e, dx / l, (t.y + 1 - e.body.y) / l, dz / l, 8, 4);
  }
};

export default defineEnemy({
  id: 'hall-of-mirrors',
  name: 'The Hall of Mirrors',
  pattern: 'Everyone is ahead of you.',
  hp: 22,
  speed: 0,
  size: [1, 2],
  contactDamage: 0,
  cost: 5,
  minFloor: 7,
  maxFloor: 9,
  drops: { heart: 0.08, key: 0.06 },
  behaviour: emitter({ every: 2.6, shot: bounce }),
  model: [
    { size: [20 * TX, 26 * TX, 2 * TX], pos: [-6 * TX, 13 * TX, 0], color: pal('mat.obsidian.dark'), name: 'body' },
    { size: [20 * TX, 26 * TX, 2 * TX], pos: [6 * TX, 13 * TX, 0], color: pal('mat.obsidian.dark') },
    { size: [10 * TX, 24 * TX, 2 * TX], pos: [0, 13 * TX, -4 * TX], color: pal('mat.obsidian.dark') },
    { size: [18 * TX, 2 * TX, 2 * TX], pos: [0, 26 * TX, 0], color: pal('mat.obsidian.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-6 * TX, 12 * TX, 1.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [6 * TX, 12 * TX, 1.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
