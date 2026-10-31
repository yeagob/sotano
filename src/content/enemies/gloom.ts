import { pal } from '../palette';
import { wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const rain: Behaviour = {
  name: 'rain',
  update(e: Enemy, ctx: EnemyCtx) {
    if (e.flyY < 0) e.flyY = e.body.y + 3.2;
    const t = ctx.target(e);
    e.timer -= ctx.dt;
    if (e.timer <= 0) {
      e.timer = 0.7;
      e.seq++;
      if (t) {
        const a = wobble(e.id, e.seq, 1) * Math.PI * 2, r = 1 + wobble(e.id, e.seq, 2) * 5;
        ctx.shootAt(e, t.x + Math.cos(a) * r, t.y + 1, t.z + Math.sin(a) * r);
      }
    }
    e.wishX = 0; e.wishZ = 0;
    e.pulse = 0.3;
  },
};

export default defineEnemy({
  id: 'gloom',
  name: 'Gloom',
  pattern: 'Everything is grey',
  hp: 28,
  speed: 0.6,
  size: [0.6, 0.4],
  contactDamage: 0,
  cost: 2,
  minFloor: 3,
  maxFloor: 4,
  drops: { heart: 0.06, bomb: 0.05 },
  behaviour: rain,
  model: [
    { size: [16 * TX, 4 * TX, 12 * TX], pos: [0, 2 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [12 * TX, 2 * TX, 10 * TX], pos: [0, 5 * TX, 0], color: pal('husk.doubt.base') },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [-5 * TX, -1 * TX, -3 * TX], color: pal('cold.dim') },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [4 * TX, -1 * TX, 3 * TX], color: pal('cold.dim') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 2 * TX, 6.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 2 * TX, 6.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
