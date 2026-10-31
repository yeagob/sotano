import { pal } from '../palette';
import { defineEnemy, TX, type Behaviour, type Enemy, type EnemyCtx } from '../../enemies/types';

const under: Behaviour = {
  name: 'under',
  update(e: Enemy, ctx: EnemyCtx) {
    e.wishX = 0; e.wishZ = 0;
    e.timer -= ctx.dt;
    const t = ctx.target(e);
    if (t && e.timer <= 0 && ctx.dist(e, t) < 3) {
      e.timer = 4;
      ctx.strike(e, { lead: 0.5, live: 3, damage: 0, shape: { kind: 'field', x: e.body.x, y: e.body.y, z: e.body.z, r: 2.5, effect: 'slow' } });
      e.pulse = 0.6;
    } else if (e.timer < -0.5) {
      e.pulse = 0.1;
    }
  },
};

export default defineEnemy({
  id: 'sulk',
  name: 'Sulk',
  pattern: 'Fine.',
  hp: 36,
  speed: 0,
  size: [0.6, 0.5],
  contactDamage: 0,
  cost: 2,
  minFloor: 5,
  maxFloor: 6,
  drops: { heart: 0.08 },
  elements: { water: { path: 'dwell', speed: 0.5 } },
  behaviour: under,
  model: [
    { size: [14 * TX, 4 * TX, 12 * TX], pos: [0, 2 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [12 * TX, TX, 10 * TX], pos: [0, 4.5 * TX, 0], color: pal('mat.loam.hi') },
    { size: [3 * TX, 2 * TX, TX / 2], pos: [-3 * TX, 3 * TX, 6.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [3 * TX, 2 * TX, TX / 2], pos: [3 * TX, 3 * TX, 6.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
