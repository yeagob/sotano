import { pal } from '../palette';
import { phase } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const replay: Behaviour = {
  name: 'replay',
  update(e: Enemy, ctx: EnemyCtx) {
    phase({ hover: 1.2, speed: 0.9 }).update(e, ctx);
    e.clock += ctx.dt;
    const t = ctx.target(e);
    if (e.clock >= 4 && t) {
      e.clock = 0;
      ctx.shootAt(e, t.x, t.y + 1, t.z);
    }
  },
};

export default defineEnemy({
  id: 'what-if',
  name: 'What If',
  pattern: 'What if I had…',
  hp: 34,
  speed: 0.9,
  size: [0.32, 1.4],
  contactDamage: 4,
  cost: 3,
  minFloor: 9,
  maxFloor: 9,
  drops: { heart: 0.08, key: 0.06 },
  behaviour: replay,
  model: [
    { size: [10 * TX, 20 * TX, 8 * TX], pos: [0, 10 * TX, 0], color: pal('paper.dark'), name: 'body' },
    { size: [8 * TX, 6 * TX, 6 * TX], pos: [0, 22 * TX, 0], color: pal('paper.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 22 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 22 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
