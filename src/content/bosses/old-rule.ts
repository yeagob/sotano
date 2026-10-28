import { pal } from '../palette';
import { charge, emitter, phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const command = (e: Enemy, ctx: EnemyCtx) => {
  const [x0, z0, x1, z1] = ctx.bounds(e);
  const x = x0 + wobble(e.id, e.seq, 1) * (x1 - x0), z = z0 + wobble(e.id, e.seq, 2) * (z1 - z0);
  ctx.strike(e, { lead: 0.8, live: 4, damage: 0, shape: { kind: 'field', x, y: e.body.y, z, r: 2.4, effect: 'mute' } });
  ctx.strike(e, { lead: 0.8, live: 4, damage: 0, shape: { kind: 'field', x: e.body.x, y: e.body.y, z: e.body.z, r: 3, effect: 'slow' } });
  e.seq++;
};
const enforce = (e: Enemy, ctx: EnemyCtx) => {
  const t = ctx.target(e);
  if (!t) return;
  ctx.strike(e, { lead: 1, live: 0.4, damage: 8, shape: { kind: 'ring', x: t.x, y: t.y, z: t.z, r: 0.5, grow: 0, width: 0.8, height: 2.6 } });
};

export default defineEnemy({
  id: 'old-rule',
  kind: 'boss',
  name: 'The Old Rule',
  pattern: 'A belief from childhood',
  hp: 140,
  speed: 0.6,
  size: [1.4, 3.2],
  contactDamage: 8,
  cost: 0,
  minFloor: 6,
  maxFloor: 6,
  behaviour: phased({
    arena: ['drop', 'crumble'],
    phases: [
      emitter({ follow: { speed: 0.6, keep: 4 }, every: 4, shot: command }),
      emitter({ follow: { speed: 0.6, keep: 4 }, every: 2.4, shot: enforce }),
      charge({ aim: 0.6, speed: 3.6, run: 1.6, stun: 1.2, range: 10, cooldown: 1.2 }),
    ],
  }),
  model: [
    { size: [16 * TX, 40 * TX, 8 * TX], pos: [0, 20 * TX, 0], color: pal('husk.panic.dark'), name: 'body' },
    { size: [18 * TX, 4 * TX, 10 * TX], pos: [0, 42 * TX, 0], color: pal('husk.panic.hi') },
    { size: [10 * TX, 2 * TX, TX / 2], pos: [0, 30 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [6 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 22 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [6 * TX, 2 * TX, TX / 2], pos: [2 * TX, 22 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 22.5 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 22.5 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
