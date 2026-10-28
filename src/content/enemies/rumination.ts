import { pal } from '../palette';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const loop: Behaviour = {
  name: 'loop',
  update(e: Enemy, ctx: EnemyCtx) {
    const t = ctx.target(e);
    e.ghost = true;
    e.clock += ctx.dt;
    if (!t) { e.wishX = 0; e.wishZ = 0; return; }
    if (e.clock >= 4) {
      e.clock = 0;
      const dx = t.x - e.body.x, dz = t.z - e.body.z, l = Math.hypot(dx, dz) || 1;
      ctx.strike(e, { lead: 0.9, live: 0.4, damage: 6, shape: { kind: 'line', x0: e.body.x, z0: e.body.z, x1: e.body.x + dx / l * 12, z1: e.body.z + dz / l * 12, y: e.body.y, width: 0.5 } });
    }
    const [dx, dz] = ctx.toward(e, t);
    e.wishX = dx * 0.9; e.wishZ = dz * 0.9;
    e.pulse = 0.2;
  },
};

export default defineEnemy({
  id: 'rumination',
  name: 'Rumination',
  pattern: 'Again. Again. Again.',
  hp: 16,
  speed: 0.9,
  size: [0.3, 0.5],
  contactDamage: 4,
  cost: 2,
  minFloor: 3,
  maxFloor: 4,
  drops: { bomb: 0.1, heart: 0.06 },
  breaks: { tier: 1, power: 4 },
  behaviour: loop,
  model: [
    { size: [6 * TX, 6 * TX, 16 * TX], pos: [0, 4 * TX, 0], color: pal('husk.doubt.base'), name: 'body' },
    { size: [6 * TX, 2 * TX, 16 * TX], pos: [0, 8 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1.5 * TX, 4.5 * TX, 8.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 4.5 * TX, 8.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
