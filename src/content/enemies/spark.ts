import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const walk = chase({ hesitate: { every: 2, pause: 0.6 } });

const arc: Behaviour = {
  name: 'arc',
  update(e: Enemy, ctx: EnemyCtx) {
    walk.update(e, ctx);
    e.clock += ctx.dt;
    const t = ctx.target(e);
    if (e.clock >= 3 && t) {
      e.clock = 0;
      ctx.strike(e, { lead: 0.7, live: 1.5, damage: 4, shape: { kind: 'line', x0: e.body.x, z0: e.body.z, x1: t.x, z1: t.z, y: e.body.y + 0.8, width: 0.3 } });
    }
  },
};

export default defineEnemy({
  id: 'spark',
  name: 'Spark',
  pattern: 'Is that? What was that?',
  hp: 24,
  speed: 1.5,
  size: [0.2, 0.5],
  contactDamage: 2,
  cost: 2,
  minFloor: 7,
  maxFloor: 8,
  drops: { bomb: 0.1, heart: 0.05 },
  behaviour: arc,
  model: [
    { size: [4 * TX, 6 * TX, 4 * TX], pos: [0, 3 * TX, 0], color: pal('husk.panic.dark'), name: 'body' },
    { size: [2 * TX, 4 * TX, 2 * TX], pos: [0, 8 * TX, 0], color: pal('husk.panic.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 9 * TX, 1.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1 * TX, 9 * TX, 1.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
