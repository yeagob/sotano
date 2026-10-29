import { pal } from '../palette';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const shut: Behaviour = {
  name: 'shut',
  update(e: Enemy, ctx: EnemyCtx) {
    e.wishX = 0; e.wishZ = 0;
    e.timer -= ctx.dt;
    if (e.state === 'peek') {
      e.pulse = 0.5;
      if (e.timer <= 0) { e.state = 'shut'; e.timer = 3; e.tags.add('shut'); ctx.hide(e, true); }
      return;
    }
    e.pulse = 0;
    if (e.timer <= 0) {
      const t = ctx.target(e);
      if (t && ctx.dist(e, t) < 7) {
        e.state = 'peek'; e.timer = 1.2; e.tags.delete('shut'); ctx.hide(e, false);
        ctx.shootAt(e, t.x, t.y + 1, t.z);
      } else {
        e.timer = 0.5;
      }
    }
  },
};

export default defineEnemy({
  id: 'avoidance',
  name: 'Avoidance',
  pattern: 'Looking away from what hurts',
  hp: 10,
  speed: 0,
  size: [0.42, 0.42],
  contactDamage: 0,
  cost: 2,
  minFloor: 1,
  maxFloor: 2,
  drops: { heart: 0.07, key: 0.04 },
  behaviour: shut,
  model: [
    { size: [14 * TX, 14 * TX, 14 * TX], pos: [0, 7 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [12 * TX, 12 * TX, TX / 2], pos: [0, 7 * TX, 7.25 * TX], color: pal('husk.doubt.base') },
    { size: [3 * TX, 2 * TX, TX / 2], pos: [-3 * TX, 8 * TX, 7.5 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
    { size: [3 * TX, 2 * TX, TX / 2], pos: [3 * TX, 8 * TX, 7.5 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
  ],
});
