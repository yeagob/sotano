import { pal } from '../palette';
import { charge, emitter, phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const accuse = (e: Enemy, ctx: EnemyCtx) => {
  const t = ctx.target(e);
  if (!t) return;
  const dx = t.x - e.body.x, dz = t.z - e.body.z, l = Math.hypot(dx, dz) || 1;
  for (let k = 0; k < 3; k++) {
    const spread = (k - 1) * 0.5;
    ctx.bolt(e, dx / l - dz / l * spread, 0, dz / l + dx / l * spread, 9, 4);
  }
};
const sentence = (e: Enemy, ctx: EnemyCtx) => {
  const [x0, z0, x1, z1] = ctx.bounds(e);
  const x = x0 + wobble(e.id, e.seq, 1) * (x1 - x0), z = z0 + wobble(e.id, e.seq, 2) * (z1 - z0);
  ctx.strike(e, { lead: 1, live: 3, damage: 0, shape: { kind: 'field', x, y: e.body.y, z, r: 2, effect: 'slow' } });
  e.seq++;
};

export default defineEnemy({
  id: 'verdict',
  kind: 'boss',
  name: 'The Verdict',
  pattern: 'To be beyond reproach',
  hp: 140,
  speed: 0.9,
  size: [1.6, 2.6],
  contactDamage: 8,
  cost: 0,
  minFloor: 6,
  maxFloor: 6,
  behaviour: phased({
    arena: ['marks', 'turn'],
    phases: [
      emitter({ every: 2, shot: accuse }),
      emitter({ every: 2.2, shot: sentence }),
      charge({ aim: 0.5, speed: 5, run: 2, stun: 1.8, range: 12, cooldown: 1 }),
    ],
  }),
  model: [
    { size: [30 * TX, 12 * TX, 10 * TX], pos: [0, 12 * TX, 0], color: pal('paper.dark'), name: 'body' },
    { size: [30 * TX, 2 * TX, 10 * TX], pos: [0, 19 * TX, 0], color: pal('paper.base') },
    { size: [2 * TX, 8 * TX, 2 * TX], pos: [-12 * TX, 26 * TX, 4 * TX], color: pal('paper.base') },
    { size: [2 * TX, 8 * TX, 2 * TX], pos: [-8 * TX, 26 * TX, 4 * TX], color: pal('paper.base') },
    { size: [2 * TX, 8 * TX, 2 * TX], pos: [-4 * TX, 26 * TX, 4 * TX], color: pal('paper.base') },
    { size: [2 * TX, 8 * TX, 2 * TX], pos: [0, 26 * TX, 4 * TX], color: pal('paper.base') },
    { size: [2 * TX, 8 * TX, 2 * TX], pos: [4 * TX, 26 * TX, 4 * TX], color: pal('paper.base') },
    { size: [2 * TX, 8 * TX, 2 * TX], pos: [8 * TX, 26 * TX, 4 * TX], color: pal('paper.base') },
    { size: [2 * TX, 8 * TX, 2 * TX], pos: [12 * TX, 26 * TX, 4 * TX], color: pal('paper.base') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [0, 13 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 13.5 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1 * TX, 13.5 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
