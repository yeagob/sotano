import { pal } from '../palette';
import { wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

export const flit: Behaviour = {
  name: 'flit',
  update(e: Enemy, ctx: EnemyCtx) {
    const t = ctx.target(e);
    e.timer -= ctx.dt;
    if (e.flyY < 0) e.flyY = e.body.y + 2.2;
    if (e.timer <= 0) { e.timer = 1.2; e.seq++; }
    const a = wobble(e.id, e.seq, 1) * Math.PI * 2;
    const cx = t ? t.x : e.body.x, cz = t ? t.z : e.body.z;
    const tx = cx + Math.cos(a) * 3, tz = cz + Math.sin(a) * 3;
    const dx = tx - e.body.x, dz = tz - e.body.z, l = Math.hypot(dx, dz) || 1;
    e.wishX = dx / l; e.wishZ = dz / l;
    e.pulse = 0.4 + 0.3 * Math.sin(e.timer * 9);
  },
};

export default defineEnemy({
  id: 'distraction',
  name: 'Distraction',
  pattern: 'Ooh, what is that?',
  hp: 6,
  speed: 1.8,
  size: [0.22, 0.2],
  contactDamage: 2,
  cost: 1,
  minFloor: 1,
  maxFloor: 5,
  drops: { heart: 0.05 },
  behaviour: flit,
  model: [
    { size: [6 * TX, 3 * TX, 4 * TX], pos: [0, 2 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [8 * TX, TX / 2, 3 * TX], pos: [-4 * TX, 3.5 * TX, 0], color: pal('husk.doubt.hi'), rot: [0, 0, 0.35] },
    { size: [8 * TX, TX / 2, 3 * TX], pos: [4 * TX, 3.5 * TX, 0], color: pal('husk.doubt.hi'), rot: [0, 0, -0.35] },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 2.5 * TX, 2.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1 * TX, 2.5 * TX, 2.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
