import { pal } from '../palette';
import { charge, emitter, phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const surface = (e: Enemy, ctx: EnemyCtx) => {
  const [x0, z0, x1, z1] = ctx.bounds(e);
  const t = ctx.target(e);
  const far = t && Math.hypot(t.x - e.body.x, t.z - e.body.z) < 3;
  const x = x0 + wobble(e.id, e.seq, 1) * (x1 - x0), z = z0 + wobble(e.id, e.seq, 2) * (z1 - z0);
  ctx.strike(e, { lead: 0.9, live: 0.4, damage: 8, shape: { kind: 'ring', x, y: e.body.y, z, r: 0.4, grow: 3, width: 0.6, height: 1.4 } });
  if (!far) { e.body.x = x; e.body.z = z; }
  e.seq++;
};
const erupt = (e: Enemy, ctx: EnemyCtx) => {
  const [x0, z0, x1, z1] = ctx.bounds(e);
  for (let k = 0; k < 2; k++) {
    const x = x0 + wobble(e.id, e.seq, 3 + k) * (x1 - x0), z = z0 + wobble(e.id, e.seq, 5 + k) * (z1 - z0);
    ctx.strike(e, { lead: 1.1, live: 0.4, damage: 6, shape: { kind: 'ring', x, y: e.body.y, z, r: 0.5, grow: 3.5, width: 0.7, height: 1.6 } });
  }
  e.seq++;
};

export default defineEnemy({
  id: 'grudge',
  kind: 'boss',
  name: 'The Grudge',
  pattern: 'To never be hurt again',
  hp: 140,
  speed: 1.0,
  size: [1.3, 1.2],
  contactDamage: 8,
  breaks: { tier: 1, power: 6 },
  cost: 0,
  minFloor: 6,
  maxFloor: 6,
  behaviour: phased({
    arena: ['mud', 'surface'],
    phases: [
      emitter({ follow: { speed: 1.0, keep: 4 }, every: 3.5, shot: surface }),
      emitter({ follow: { speed: 1.0, keep: 4 }, every: 2.2, shot: erupt }),
      charge({ aim: 0.7, speed: 4.2, run: 1.6, stun: 1.6, range: 12, cooldown: 1.4 }),
    ],
  }),
  model: [
    { size: [30 * TX, 10 * TX, 14 * TX], pos: [0, 6 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [28 * TX, 2 * TX, 12 * TX], pos: [0, 12 * TX, 0], color: pal('husk.doubt.base') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-5 * TX, 7 * TX, 7.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [5 * TX, 7 * TX, 7.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-5 * TX, 7.5 * TX, 7.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [5 * TX, 7.5 * TX, 7.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [4 * TX, 3 * TX, 4 * TX], pos: [0, 14 * TX, -2 * TX], color: pal('husk.doubt.hi'), glow: false },
  ],
});
