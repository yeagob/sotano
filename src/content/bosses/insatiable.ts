import { pal } from '../palette';
import { emitter, phased } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'insatiable',
  kind: 'boss',
  name: 'The Insatiable',
  pattern: 'To be full',
  hp: 140,
  speed: 0,
  size: [1.4, 2.4],
  contactDamage: 8,
  cost: 0,
  minFloor: 1,
  maxFloor: 2,
  behaviour: phased({
    arena: ['debris', 'hollow'],
    phases: [
      emitter({ every: 5, shot: (e, ctx) => ctx.strike(e, { lead: 0.9, live: 3, damage: 0, shape: { kind: 'pull', x: e.body.x, y: e.body.y, z: e.body.z, r: 9, force: 9 } }) }),
      emitter({ every: 1.4, shot: (e, ctx) => { ctx.shootAt(e, e.body.x + 3 * Math.sin(e.seq), e.body.y, e.body.z + 3 * Math.cos(e.seq)); e.seq++; } }),
      emitter({ every: 2.2, shot: (e, ctx) => ctx.strike(e, { lead: 0.6, live: 0.3, damage: 8, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 5, width: 0.6, height: 1.5 } }) }),
    ],
  }),
  model: [
    { size: [26 * TX, 18 * TX, 26 * TX], pos: [0, 12 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [30 * TX, 4 * TX, 30 * TX], pos: [0, 22 * TX, 0], color: pal('husk.doubt.base') },
    { size: [14 * TX, 2 * TX, 14 * TX], pos: [0, 23.5 * TX, 0], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-4 * TX, 4 * TX, 13.25 * TX], color: pal('cold.white'), glow: true, name: 'core' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [4 * TX, 4 * TX, 13.25 * TX], color: pal('cold.white'), glow: true, name: 'core' },
  ],
});
