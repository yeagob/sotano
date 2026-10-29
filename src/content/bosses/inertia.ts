import { pal } from '../palette';
import { phased, sleep } from '../../enemies/behaviours';
import { barrage, charge, combo, inhale, moveset, shockwave, slam } from '../../enemies/moves';
import { defineEnemy, TX } from '../../enemies/types';

// A mass of packed earth, asleep (BESTIARY §6.3). 1 Sleeps: you must move it (a kick, a bomb, a hard
// shot); awake, it rolls at you and bounces off the walls back at you. 2 Rolls: faster, more bounces,
// and it lands on you. 3 Gathers: it pulls the room in, then rolls through what it gathered.
export default defineEnemy({
  id: 'inertia',
  kind: 'boss',
  name: 'Inertia',
  pattern: 'Staying as you are',
  hp: 140,
  speed: 2.4,
  asleep: true,
  size: [1.1, 2.6],
  contactDamage: 8,
  cost: 0,
  minFloor: 1,
  maxFloor: 2,
  breaks: { tier: 1, power: 8 },
  behaviour: phased({
    arena: ['rockfall', 'spill'],
    phases: [
      sleep({
        wakeSpeed: 1.5, then: moveset({
          gait: { kind: 'stalk' }, pace: [0.5, 1], moves: [
            combo('roll-and-clods', [charge({ windup: 0.65, recover: 0, speed: 10, run: 3, bounces: 1, impact: 4 }), barrage({ windup: 0.4, recover: 0, count: 4, seconds: 0.7, spread: 1.8 })], { recover: 1 }),
            charge({ windup: 0.7, recover: 1, speed: 10, run: 3, bounces: 2, impact: 4 }),
            barrage({ windup: 0.5, recover: 0.5, count: 3, seconds: 0.6, spread: 1.5 }),
          ],
        }),
      }),
      moveset({
        gait: { kind: 'stalk' }, pace: [0.35, 0.8], moves: [
          combo('hop-hop-roll', [slam({ windup: 0.45, recover: 0, air: 0.55, reach: 5 }), slam({ windup: 0.45, recover: 0, air: 0.55, reach: 5 }), charge({ windup: 0.5, recover: 0, speed: 12, run: 3, bounces: 2, impact: 6 })], { recover: 0.9, gap: 0.1 }),
          charge({ windup: 0.55, recover: 0.8, speed: 12, run: 3, bounces: 3, impact: 6 }),
          slam({ windup: 0.6, recover: 0.8, air: 0.75, reach: 7, stones: 2 }),
          shockwave({ windup: 0.5, recover: 0.5, rings: 2, gap: 0.4, reach: 8 }),
        ],
      }),
      moveset({
        gait: { kind: 'stalk' }, pace: [0.3, 0.6], moves: [
          combo('breathe-in-roll-out', [inhale({ windup: 0.6, recover: 0, r: 10, force: 9, live: 1.4, bite: 8 }), charge({ windup: 0.4, recover: 0, speed: 14, run: 3, bounces: 2, impact: 7 })], { recover: 0.8, gap: 0.05 }),
          inhale({ windup: 0.6, recover: 0.1, r: 10, force: 8, live: 1.6, bite: 8 }),
          charge({ windup: 0.45, recover: 0.7, speed: 13, run: 3, bounces: 3, impact: 7 }),
          barrage({ windup: 0.5, recover: 0.5, count: 6, seconds: 1, spread: 2.5 }),
        ],
      }),
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
