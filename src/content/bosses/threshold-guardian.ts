import { pal } from '../palette';
import { charge, emitter, phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const bars = (e: Enemy, ctx: EnemyCtx) => {
  const [x0, z0, x1, z1] = ctx.bounds(e);
  const across = wobble(e.id, e.seq, 1) < 0.5;
  if (across) ctx.strike(e, { lead: 1, live: 0.4, damage: 6, shape: { kind: 'line', x0, z0: e.body.z, x1, z1: e.body.z, y: e.body.y, width: 0.6 } });
  else ctx.strike(e, { lead: 1, live: 0.4, damage: 6, shape: { kind: 'line', x0: e.body.x, z0, x1: e.body.x, z1, y: e.body.y, width: 0.6 } });
  e.seq++;
};

export default defineEnemy({
  id: 'threshold-guardian',
  kind: 'boss',
  name: 'The Threshold Guardian',
  pattern: 'The fear at the edge of change',
  hp: 140,
  speed: 0.8,
  size: [0.9, 3],
  contactDamage: 8,
  cost: 0,
  minFloor: 5,
  maxFloor: 5,
  behaviour: phased({
    arena: ['gate', 'gap'],
    phases: [
      emitter({ follow: { speed: 0.8, keep: 4 }, every: 3, shot: bars }),
      emitter({ follow: { speed: 0.8, keep: 4 },
        every: 1.8,
        shot: (e, ctx) => {
          const t = ctx.target(e);
          if (!t) return;
          const dx = t.x - e.body.x, dz = t.z - e.body.z, l = Math.hypot(dx, dz) || 1;
          for (let k = -1; k <= 1; k++) ctx.bolt(e, dx / l - dz / l * k * 0.3, 0, dz / l + dx / l * k * 0.3, 8, 4);
        },
      }),
      charge({ aim: 0.7, speed: 4.4, run: 1.6, stun: 1.2, range: 12, cooldown: 1.6 }),
    ],
  }),
  model: [
    { size: [6 * TX, 40 * TX, 8 * TX], pos: [-8 * TX, 20 * TX, 0], color: pal('husk.doubt.base'), name: 'body' },
    { size: [6 * TX, 40 * TX, 8 * TX], pos: [8 * TX, 20 * TX, 0], color: pal('husk.doubt.base') },
    { size: [26 * TX, 6 * TX, 8 * TX], pos: [0, 40 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [8 * TX, 8 * TX, TX / 2], pos: [0, 26 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1.5 * TX, 27 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 27 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
