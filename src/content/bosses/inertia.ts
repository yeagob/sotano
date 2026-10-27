import { pal } from '../palette';
import { charge, emitter, phased, sleep } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'inertia',
  kind: 'boss',
  name: 'Inertia',
  pattern: 'Staying as you are',
  hp: 140,
  speed: 2.2,
  asleep: true,
  size: [1.1, 2.6],
  contactDamage: 8,
  cost: 0,
  minFloor: 1,
  maxFloor: 2,
  breaks: { tier: 1, power: 8 },
  behaviour: phased({
    arena: ['rolls', 'gathers'],
    phases: [
      sleep({ wakeSpeed: 1.5, then: charge({ aim: 0.8, speed: 4.8, run: 3, stun: 1.2, range: 14, cooldown: 0.8 }) }),
      charge({ aim: 0.6, speed: 5.4, run: 3, stun: 0.8, range: 14, cooldown: 0.6 }),
      emitter({ every: 6, shot: (e, ctx) => ctx.strike(e, { lead: 0.9, live: 2.5, damage: 0, shape: { kind: 'pull', x: e.body.x, y: e.body.y, z: e.body.z, r: 5, force: 5 } }) }),
    ],
  }),
  model: [
    { size: [22 * TX, 22 * TX, 22 * TX], pos: [0, 16 * TX, 0], color: pal('husk.doubt.base'), name: 'body' },
    { size: [22 * TX, 2 * TX, 22 * TX], pos: [0, 27 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [4 * TX, TX, TX / 2], pos: [-4 * TX, 19 * TX, 11.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, TX, TX / 2], pos: [4 * TX, 19 * TX, 11.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, TX, TX / 2], pos: [-4 * TX, 19.5 * TX, 11.5 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
    { size: [2 * TX, TX, TX / 2], pos: [4 * TX, 19.5 * TX, 11.5 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
  ],
});
