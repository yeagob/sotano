import { pal } from '../palette';
import { charge, emitter, phased } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'hoard',
  kind: 'boss',
  name: 'The Hoard',
  pattern: 'Holding on to everything',
  hp: 140,
  speed: 2,
  size: [1.2, 2.2],
  contactDamage: 8,
  cost: 0,
  minFloor: 3,
  maxFloor: 4,
  breaks: { tier: 0, power: 5 },
  behaviour: phased({
    arena: ['clutch', 'spill'],
    phases: [
      charge({ aim: 0.7, speed: 3.8, run: 1.8, stun: 1.4, range: 10, cooldown: 1.2 }),
      emitter({ every: 4.5, shot: (e, ctx) => ctx.strike(e, { lead: 0.8, live: 2.5, damage: 0, shape: { kind: 'pull', x: e.body.x, y: e.body.y, z: e.body.z, r: 6, force: 6 } }) }),
      emitter({ every: 2.6, shot: (e, ctx) => ctx.strike(e, { lead: 0.6, live: 0.3, damage: 8, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 4, width: 0.6, height: 1.5 } }) }),
    ],
  }),
  model: [
    { size: [22 * TX, 20 * TX, 22 * TX], pos: [0, 10 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [14 * TX, 14 * TX, 14 * TX], pos: [0, 24 * TX, 0], color: pal('husk.doubt.base') },
    { size: [6 * TX, 4 * TX, 6 * TX], pos: [-6 * TX, 4 * TX, 7 * TX], color: pal('mat.crate.dark') },
    { size: [6 * TX, 4 * TX, 6 * TX], pos: [6 * TX, 4 * TX, 7 * TX], color: pal('mat.crate.base') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 22 * TX, 7.25 * TX], color: pal('cold.white'), glow: true, name: 'core' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 22 * TX, 7.25 * TX], color: pal('cold.white'), glow: true, name: 'core' },
  ],
});
