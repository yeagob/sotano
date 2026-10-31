import { pal } from '../palette';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const drain: Behaviour = {
  name: 'drain',
  update(e: Enemy, ctx: EnemyCtx) {
    const t = ctx.target(e);
    e.wishX = 0; e.wishZ = 0;
    e.clock += ctx.dt;
    if (e.clock >= 4) {
      e.clock = 0;
      ctx.strike(e, { lead: 0.4, live: 4, damage: 0, shape: { kind: 'field', x: e.body.x, y: e.body.y, z: e.body.z, r: 3, effect: 'mute' } });
    }
    if (t) {
      const [dx, dz] = ctx.toward(e, t);
      const d = ctx.dist(e, t);
      if (d < 5) { e.wishX = -dx * 0.6; e.wishZ = -dz * 0.6; }
    }
    e.pulse = 0.2;
  },
};

export default defineEnemy({
  id: 'cynicism',
  name: 'Cynicism',
  pattern: 'What is the point?',
  hp: 52,
  speed: 0.9,
  size: [0.3, 1.2],
  contactDamage: 0,
  cost: 3,
  minFloor: 9,
  maxFloor: 9,
  drops: { heart: 0.08, bomb: 0.06 },
  behaviour: drain,
  model: [
    { size: [8 * TX, 16 * TX, 8 * TX], pos: [0, 8 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [10 * TX, 2 * TX, 10 * TX], pos: [0, 17 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [0, 12 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [0, 12 * TX, 4.5 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
  ],
});
