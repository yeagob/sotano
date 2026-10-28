import { pal } from '../palette';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const craving: Behaviour = {
  name: 'craving',
  update(e: Enemy, ctx: EnemyCtx) {
    const t = ctx.target(e);
    e.timer -= ctx.dt;
    e.clock += ctx.dt;
    if (!t) { e.wishX = 0; e.wishZ = 0; return; }
    const d = ctx.dist(e, t);
    const [dx, dz] = ctx.toward(e, t);
    if (e.clock >= 4) {
      e.clock = 0;
      ctx.strike(e, { lead: 0.8, live: 2.5, damage: 0, shape: { kind: 'pull', x: e.body.x, y: e.body.y, z: e.body.z, r: 5, force: 3 } });
    }
    if (d < 2.2) { e.wishX = -dx; e.wishZ = -dz; }
    else if (d > 4.5) { e.wishX = dx; e.wishZ = dz; }
    else { e.wishX = -dz * 0.7; e.wishZ = dx * 0.7; }
    e.pulse = 0.2 + 0.2 * Math.sin(e.clock * 3);
  },
};

export default defineEnemy({
  id: 'craving',
  name: 'Craving',
  pattern: 'Wanting that never fills',
  hp: 9,
  speed: 1.2,
  size: [0.3, 1.1],
  contactDamage: 3,
  cost: 2,
  minFloor: 1,
  maxFloor: 2,
  drops: { bomb: 0.1, key: 0.05 },
  behaviour: craving,
  model: [
    { size: [10 * TX, 6 * TX, 10 * TX], pos: [0, 4 * TX, 0], color: pal('husk.doubt.base'), name: 'body' },
    { size: [12 * TX, 2 * TX, 12 * TX], pos: [0, 8 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [8 * TX, TX, 8 * TX], pos: [0, 8.5 * TX, 0], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 4 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 4 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
