import { pal } from '../palette';
import { phased } from '../../enemies/behaviours';
import { barrage, charge, combo, moveset, rocks, shockwave, slam } from '../../enemies/moves';
import { defineEnemy, TX } from '../../enemies/types';

// A door that walks (BESTIARY §6.3). 1 Blocks: it comes at you and rams, and what it rams breaks.
// 2 Walls in: it cuts the room with walls and rams twice, through them. 3 Sits: it will not walk any
// more; it grows heavy and drops on you, and the ceiling comes down with it.
export default defineEnemy({
  id: 'resistance',
  kind: 'boss',
  name: 'Resistance',
  pattern: 'The force that stops creative work',
  hp: 140,
  speed: 3,
  size: [0.9, 2.6],
  contactDamage: 8,
  cost: 0,
  minFloor: 1,
  maxFloor: 2,
  breaks: { tier: 1, power: 6 },
  behaviour: phased({
    arena: ['walls', 'rockfall'],
    phases: [
      moveset({
        gait: { kind: 'stalk' }, pace: [0.5, 1.1], moves: [
          combo('ram-and-stamp', [charge({ windup: 0.6, recover: 0, speed: 11, impact: 5 }), shockwave({ windup: 0.45, recover: 0, rings: 1, gap: 0, reach: 5 })], { recover: 1, min: 3 }),
          charge({ windup: 0.65, recover: 0.9, speed: 11, impact: 5, min: 3 }),
          shockwave({ windup: 0.5, recover: 0.6, rings: 1, gap: 0, reach: 4.5, max: 5 }),
          // it throws cubes of itself at you (owner, b86b17c): each one's landing is marked
          barrage({ windup: 0.45, recover: 0.3, count: 2, seconds: 0.5, spread: 1, walk: true }),
        ],
      }),
      moveset({
        gait: { kind: 'stalk' }, pace: [0.35, 0.8], moves: [
          combo('double-ram', [charge({ windup: 0.55, recover: 0, speed: 12, impact: 5 }), charge({ windup: 0.45, recover: 0, speed: 12, impact: 6 })], { recover: 0.9 }),
          combo('stones-then-ram', [rocks({ windup: 0.45, recover: 0, count: 5, lead: 1, spread: 3 }), charge({ windup: 0.5, recover: 0, speed: 12, impact: 6 })], { recover: 0.8 }),
          charge({ windup: 0.55, recover: 0.75, speed: 12, bounces: 1, impact: 6 }),
          shockwave({ windup: 0.5, recover: 0.6, rings: 2, gap: 0.45, reach: 7 }),
          // it throws cubes of itself at you (owner, b86b17c): each one's landing is marked
          barrage({ windup: 0.45, recover: 0.3, count: 2, seconds: 0.5, spread: 1, walk: true }),
          rocks({ windup: 0.5, recover: 0.4, count: 4, lead: 1, spread: 3, walk: true }),
        ],
      }),
      moveset({
        gait: { kind: 'still' }, pace: [0.3, 0.7], moves: [
          combo('three-drops', [slam({ windup: 0.5, recover: 0, air: 0.6, reach: 6 }), slam({ windup: 0.45, recover: 0, air: 0.6, reach: 6 }), slam({ windup: 0.7, recover: 0, air: 0.9, reach: 11, stones: 4 })], { recover: 1.1, gap: 0.1 }),
          slam({ windup: 0.7, recover: 0.8, air: 0.8, reach: 8, stones: 3 }),
          shockwave({ windup: 0.6, recover: 0.7, rings: 3, gap: 0.5, reach: 10, quake: 0.5 }),
          rocks({ windup: 0.5, recover: 0.4, count: 6, lead: 1, spread: 3.5 }),
        ],
      }),
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
