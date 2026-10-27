import { pal } from '../palette';
import { charge, emitter, phased } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'resistance',
  kind: 'boss',
  name: 'Resistance',
  pattern: 'The force that stops creative work',
  hp: 140,
  speed: 2.6,
  size: [0.9, 2.6],
  contactDamage: 8,
  cost: 0,
  minFloor: 1,
  maxFloor: 2,
  breaks: { tier: 1, power: 6 },
  behaviour: phased({
    arena: ['walls', 'walls'],
    phases: [
      charge({ aim: 0.8, speed: 4.2, run: 1.8, stun: 1.6, range: 10, cooldown: 1.4 }),
      charge({ aim: 0.6, speed: 4.6, run: 1.8, stun: 1.2, range: 10, cooldown: 1.0 }),
      emitter({ every: 2.4, shot: (e, ctx) => ctx.strike(e, { lead: 0.6, live: 0.3, damage: 8, shape: { kind: 'ring', x: e.body.x, y: e.body.y, z: e.body.z, r: 0.5, grow: 4, width: 0.6, height: 1.5 } }) }),
    ],
  }),
  model: [
    { size: [28 * TX, 20 * TX, 14 * TX], pos: [0, 16 * TX, 0], color: pal('husk.panic.base'), name: 'body' },
    { size: [28 * TX, 2 * TX, 14 * TX], pos: [0, 27 * TX, 0], color: pal('husk.panic.hi') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-6 * TX, 17 * TX, 7.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [6 * TX, 17 * TX, 7.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-6 * TX, 17.5 * TX, 7.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [6 * TX, 17.5 * TX, 7.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [8 * TX, 8 * TX, 8 * TX], pos: [-8 * TX, 4 * TX, 0], color: pal('husk.panic.dark'), name: 'legL' },
    { size: [8 * TX, 8 * TX, 8 * TX], pos: [8 * TX, 4 * TX, 0], color: pal('husk.panic.dark'), name: 'legR' },
  ],
});
