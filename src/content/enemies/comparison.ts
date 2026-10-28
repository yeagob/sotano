import { pal } from '../palette';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const keep: Behaviour = {
  name: 'keep',
  update(e: Enemy, ctx: EnemyCtx) {
    const t = ctx.target(e);
    e.timer -= ctx.dt;
    if (!t) { e.wishX = 0; e.wishZ = 0; return; }
    const d = ctx.dist(e, t);
    const [dx, dz] = ctx.toward(e, t);
    if (d < 4) { e.wishX = -dx; e.wishZ = -dz; }
    else if (d > 6) { e.wishX = dx; e.wishZ = dz; }
    else { e.wishX = -dz * 0.5; e.wishZ = dx * 0.5; }
    if (e.timer <= 0) {
      e.timer = 2;
      const l = Math.hypot(t.x - e.body.x, t.z - e.body.z) || 1;
      ctx.bolt(e, (t.x - e.body.x) / l, (t.y + 1 - e.body.y) / l, (t.z - e.body.z) / l, 9, 4);
    }
  },
};

export default defineEnemy({
  id: 'comparison',
  name: 'Comparison',
  pattern: 'They are ahead of you.',
  hp: 30,
  speed: 1,
  size: [0.3, 2],
  contactDamage: 0,
  cost: 3,
  minFloor: 3,
  maxFloor: 6,
  drops: { heart: 0.08 },
  elements: { water: { path: 'avoid', speed: 0.4 } },
  behaviour: keep,
  model: [
    { size: [6 * TX, 28 * TX, 2 * TX], pos: [0, 14 * TX, 0], color: pal('mat.obsidian.dark'), name: 'body' },
    { size: [6 * TX, 2 * TX, 3 * TX], pos: [0, 28 * TX, 0], color: pal('mat.obsidian.hi') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [0, 20 * TX, 1.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 20.5 * TX, 1.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1 * TX, 20.5 * TX, 1.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
