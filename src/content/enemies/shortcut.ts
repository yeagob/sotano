import { pal } from '../palette';
import { flee } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const run = flee({ hover: 0, scared: 5 });

const way: Behaviour = {
  name: 'way',
  update(e: Enemy, ctx: EnemyCtx) {
    run.update(e, ctx);
    e.clock += ctx.dt;
    const you = ctx.near(e);
    if (you && e.clock >= 4 && Math.hypot(you.x - e.body.x, you.z - e.body.z) < 4) {
      e.clock = 0;
      ctx.strike(e, { lead: 0.6, live: 0.4, damage: 6, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 4, width: 0.6, height: 1.4 } });
    }
  },
};

export default defineEnemy({
  id: 'shortcut',
  name: 'Shortcut',
  pattern: 'There is an easier way.',
  hp: 18,
  speed: 1.8,
  size: [0.24, 0.4],
  contactDamage: 0,
  cost: 2,
  minFloor: 7,
  maxFloor: 8,
  drops: { key: 0.1, bomb: 0.1 },
  behaviour: way,
  model: [
    { size: [6 * TX, 8 * TX, 6 * TX], pos: [0, 4 * TX, 0], color: pal('husk.panic.dark'), name: 'body' },
    { size: [4 * TX, 2 * TX, 4 * TX], pos: [0, 9 * TX, 0], color: pal('husk.panic.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 6 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1 * TX, 6 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
