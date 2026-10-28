import { pal } from '../palette';
import { emitter, phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const charm = (e: Enemy, ctx: EnemyCtx) => {
  const ids = ['doubt', 'critic', 'panic'];
  ctx.summon(e, [ids[Math.floor(wobble(e.id, e.seq, 1) * ids.length)]]);
  e.seq++;
};
const swap = (e: Enemy, ctx: EnemyCtx) => {
  const [x0, z0, x1, z1] = ctx.bounds(e);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, r = Math.min(x1 - x0, z1 - z0) / 3;
  const a = wobble(e.id, e.seq, 2) * Math.PI * 2;
  e.body.x = cx + Math.cos(a) * r; e.body.z = cz + Math.sin(a) * r;
  ctx.strike(e, { lead: 0.7, live: 0.3, damage: 8, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 3.5, width: 0.6, height: 1.5 } });
  e.seq++;
};

export default defineEnemy({
  id: 'many-faces',
  kind: 'boss',
  name: 'The Many Faces',
  pattern: 'To be loved',
  hp: 140,
  speed: 1.0,
  size: [1.6, 2.4],
  contactDamage: 8,
  cost: 0,
  minFloor: 7,
  maxFloor: 8,
  behaviour: phased({
    arena: ['faces', 'plain'],
    phases: [
      emitter({ follow: { speed: 1.0, keep: 5 }, every: 6, shot: charm }),
      emitter({ follow: { speed: 1.0, keep: 5 }, every: 3, shot: swap }),
      emitter({ follow: { speed: 1.0, keep: 5 }, every: 2.2, shot: (e, ctx) => ctx.strike(e, { lead: 0.6, live: 0.3, damage: 8, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 4, width: 0.6, height: 1.5 } }) }),
    ],
  }),
  model: [
    { size: [10 * TX, 10 * TX, 10 * TX], pos: [0, 10 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-2 * TX, 13 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [2 * TX, 13 * TX, 5.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [6 * TX, 6 * TX, TX], pos: [-12 * TX, 10 * TX, 0], color: pal('paper.base') },
    { size: [6 * TX, 6 * TX, TX], pos: [12 * TX, 10 * TX, 0], color: pal('paper.base') },
    { size: [6 * TX, 6 * TX, TX], pos: [0, 10 * TX, 12 * TX], color: pal('paper.base') },
    { size: [6 * TX, 6 * TX, TX], pos: [0, 10 * TX, -12 * TX], color: pal('paper.base') },
    { size: [6 * TX, 6 * TX, TX], pos: [9 * TX, 10 * TX, 9 * TX], color: pal('paper.base') },
    { size: [6 * TX, 6 * TX, TX], pos: [-9 * TX, 10 * TX, -9 * TX], color: pal('paper.base') },
  ],
});
