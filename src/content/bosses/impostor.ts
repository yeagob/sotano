import { pal } from '../palette';
import { charge, emitter, phased, wobble } from '../../enemies/behaviours';
import { defineEnemy, TX, type Enemy, type EnemyCtx } from '../../enemies/types';

const pretend = (e: Enemy, ctx: EnemyCtx) => {
  const ids = ['doubt', 'critic', 'panic'];
  ctx.summon(e, [ids[Math.floor(wobble(e.id, e.seq, 1) * ids.length)], ids[Math.floor(wobble(e.id, e.seq, 2) * ids.length)]]);
  e.seq++;
};

export default defineEnemy({
  id: 'impostor',
  kind: 'boss',
  name: 'The Impostor',
  pattern: 'The fear of being found out',
  hp: 140,
  speed: 1.6,
  size: [1.0, 2.6],
  contactDamage: 8,
  cost: 0,
  minFloor: 7,
  maxFloor: 8,
  behaviour: phased({
    arena: ['brass', 'frame'],
    phases: [
      charge({ aim: 0.7, speed: 4, run: 1.6, stun: 1.2, range: 10, cooldown: 1.4 }),
      emitter({ every: 6, shot: pretend }),
      emitter({ every: 2.4, shot: (e, ctx) => ctx.strike(e, { lead: 0.6, live: 0.3, damage: 8, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 4, width: 0.6, height: 1.5 } }) }),
    ],
  }),
  model: [
    { size: [18 * TX, 30 * TX, 4 * TX], pos: [0, 16 * TX, 0], color: pal('brass.dark'), name: 'body' },
    { size: [14 * TX, 26 * TX, 2 * TX], pos: [0, 16 * TX, 2 * TX], color: pal('ink.void') },
    { size: [10 * TX, 2 * TX, TX / 2], pos: [0, 10 * TX, 2.25 * TX], color: pal('paper.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 22 * TX, 2.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 22 * TX, 2.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [4 * TX, 6 * TX, 4 * TX], pos: [0, 12 * TX, -1 * TX], color: pal('husk.doubt.hi') },
  ],
});
