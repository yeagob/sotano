import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const walk = chase({ lunge: 1.4 });

const smile: Behaviour = {
  name: 'smile',
  update(e: Enemy, ctx: EnemyCtx) {
    if (e.hidden) {
      e.wishX = 0; e.wishZ = 0;
      const you = ctx.near(e);
      if (you && Math.hypot(you.x - e.body.x, you.z - e.body.z) < 2.2) { ctx.hide(e, false); e.clock = 0; }
      return;
    }
    walk.update(e, ctx);
  },
};

export default defineEnemy({
  id: 'pretence',
  name: 'Pretence',
  pattern: 'I am fine.',
  hp: 32,
  speed: 1.7,
  size: [0.32, 0.9],
  contactDamage: 6,
  cost: 3,
  minFloor: 7,
  maxFloor: 8,
  drops: { heart: 0.1, key: 0.06 },
  behaviour: smile,
  model: [
    { size: [10 * TX, 10 * TX, 10 * TX], pos: [0, 6 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [10 * TX, 2 * TX, 10 * TX], pos: [0, 11.5 * TX, 0], color: pal('paper.base') },
    { size: [8 * TX, 2 * TX, TX / 2], pos: [0, 4 * TX, 5.25 * TX], color: pal('paper.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2.5 * TX, 9 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2.5 * TX, 9 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
