import { pal } from '../palette';
import { emitter, phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const blaze = (e: Enemy, ctx: EnemyCtx) => {
  const t = ctx.target(e);
  if (!t) return;
  for (let k = 0; k < 2; k++) {
    const a = wobble(e.id, e.seq, k) * Math.PI * 2, r = 1.5 + wobble(e.id, e.seq, k + 2) * 2;
    ctx.shootAt(e, t.x + Math.cos(a) * r, t.y, t.z + Math.sin(a) * r);
  }
  e.seq++;
};

export default defineEnemy({
  id: 'furnace',
  kind: 'boss',
  name: 'The Furnace',
  pattern: 'To be enough',
  hp: 140,
  speed: 0.8,
  size: [1.4, 2.6],
  contactDamage: 8,
  cost: 0,
  minFloor: 7,
  maxFloor: 8,
  behaviour: phased({
    arena: ['fire', 'cool'],
    phases: [
      emitter({ follow: { speed: 0.8, keep: 4 }, every: 5, shot: (e, ctx) => ctx.strike(e, { lead: 0.9, live: 2.5, damage: 0, shape: { kind: 'pull', x: e.body.x, y: e.body.y, z: e.body.z, r: 6, force: 5 } }) }),
      emitter({ follow: { speed: 0.8, keep: 4 }, every: 1.8, shot: blaze }),
      emitter({ follow: { speed: 0.8, keep: 4 }, every: 2.4, shot: (e, ctx) => ctx.strike(e, { lead: 0.6, live: 0.3, damage: 8, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 4, width: 0.6, height: 1.5 } }) }),
    ],
  }),
  model: [
    { size: [22 * TX, 30 * TX, 20 * TX], pos: [0, 15 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [8 * TX, 8 * TX, TX / 2], pos: [0, 5 * TX, 10.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [0, 5 * TX, 10.5 * TX], color: pal('cold.white'), glow: true, name: 'core' },
    { size: [6 * TX, 8 * TX, 6 * TX], pos: [0, 34 * TX, 0], color: pal('husk.doubt.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-6 * TX, 17 * TX, 10.25 * TX], color: pal('cold.dim'), glow: true, name: 'core' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [6 * TX, 17 * TX, 10.25 * TX], color: pal('cold.dim'), glow: true, name: 'core' },
  ],
});
