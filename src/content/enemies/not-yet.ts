import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const walk = chase({});

const mend: Behaviour = {
  name: 'mend',
  update(e: Enemy, ctx: EnemyCtx) {
    walk.update(e, ctx);
    e.timer -= ctx.dt;
    if (e.timer <= 0) {
      e.timer = 4;
      if (e.clock >= 4 && e.hp < e.maxHp) { e.hp = Math.min(e.maxHp, e.hp + 2); e.pulse = 0.6; }
    }
  },
};

export default defineEnemy({
  id: 'not-yet',
  name: 'Not Yet',
  pattern: 'Not yet. Not yet. Not yet.',
  hp: 80,
  speed: 0.7,
  size: [0.5, 1.6],
  contactDamage: 4,
  cost: 4,
  minFloor: 6,
  maxFloor: 9,
  armor: 0.7,
  drops: { heart: 0.1, key: 0.06, bomb: 0.08 },
  behaviour: mend,
  model: [
    { size: [14 * TX, 20 * TX, 14 * TX], pos: [0, 10 * TX, 0], color: pal('paper.dark'), name: 'body' },
    { size: [16 * TX, 2 * TX, 16 * TX], pos: [0, 21 * TX, 0], color: pal('paper.base') },
    { size: [6 * TX, 6 * TX, TX], pos: [-8 * TX, 12 * TX, 0], color: pal('paper.hi') },
    { size: [6 * TX, 6 * TX, TX], pos: [8 * TX, 12 * TX, 0], color: pal('paper.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 13 * TX, 7.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 13 * TX, 7.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
