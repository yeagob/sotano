import { pal } from '../palette';
import { phased } from '../../enemies/behaviours';
import { bars, charge, combo, fan, moveset, nova, slam } from '../../enemies/moves';
import { defineEnemy, TX } from '../../enemies/types';

// The gate at the edge of change, on the route of shadow (BESTIARY §6.5). 1 Bars: bars of force cross
// the room where you stand, in grids; it walks after you. 2 Tests: volleys across the room, aimed
// and in rings. 3 Steps aside: it charges along the edge of the pit and lands on you, barring as it goes.
export default defineEnemy({
  id: 'threshold-guardian',
  kind: 'boss',
  name: 'The Threshold Guardian',
  pattern: 'The fear at the edge of change',
  hp: 140,
  speed: 2,
  size: [0.9, 3],
  contactDamage: 8,
  cost: 0,
  minFloor: 5,
  maxFloor: 5,
  behaviour: phased({
    arena: ['rockfall', 'rockfall'],
    phases: [
      moveset({
        gait: { kind: 'stalk' }, pace: [0.4, 0.8], moves: [
          combo('closing-gate', [bars({ windup: 0.75, recover: 0, parallels: 1, spacing: 3.5 }), bars({ windup: 0.6, recover: 0, parallels: 1, spacing: 3.5, cross: true }), bars({ windup: 0.6, recover: 0, parallels: 2, spacing: 3 })], { recover: 0.6, gap: 0.2 }),
          bars({ windup: 0.85, recover: 0.4, parallels: 2, spacing: 3 }),
          bars({ windup: 0.85, recover: 0.4, parallels: 1, spacing: 3.5, cross: true }),
          fan({ windup: 0.5, recover: 0.5, count: 5, spread: 0.9, volleys: 2, gap: 0.3, speed: 10, walk: true }),
        ],
      }),
      moveset({
        gait: { kind: 'keep', dist: 6 }, pace: [0.3, 0.7], moves: [
          combo('volley-chain', [fan({ windup: 0.45, recover: 0, count: 7, spread: 1.4, volleys: 2, gap: 0.3, speed: 10 }), nova({ windup: 0.45, recover: 0, count: 16, volleys: 2, gap: 0.35, speed: 8, spin: 0.2 }), fan({ windup: 0.4, recover: 0, count: 9, spread: 1.8, volleys: 2, gap: 0.3, speed: 11 })], { recover: 0.6 }),
          fan({ windup: 0.5, recover: 0.4, count: 7, spread: 1.4, volleys: 3, gap: 0.3, speed: 10, walk: true }),
          nova({ windup: 0.55, recover: 0.5, count: 16, volleys: 3, gap: 0.4, speed: 8, spin: 0.2 }),
          bars({ windup: 0.8, recover: 0.4, parallels: 2, spacing: 3, cross: true }),
        ],
      }),
      moveset({
        gait: { kind: 'stalk' }, pace: [0.25, 0.55], moves: [
          combo('charge-and-crush', [charge({ windup: 0.5, recover: 0, speed: 13, bounces: 1, impact: 6 }), slam({ windup: 0.5, recover: 0, air: 0.7, reach: 9, stones: 4 }), bars({ windup: 0.55, recover: 0, parallels: 2, spacing: 3, cross: true })], { recover: 0.8 }),
          charge({ windup: 0.5, recover: 0.6, speed: 13, bounces: 2, impact: 6 }),
          slam({ windup: 0.6, recover: 0.6, air: 0.75, reach: 9, stones: 3 }),
          bars({ windup: 0.7, recover: 0.3, parallels: 2, spacing: 3, cross: true }),
        ],
      }),
    ],
  }),
  model: [
    { size: [6 * TX, 40 * TX, 8 * TX], pos: [-8 * TX, 20 * TX, 0], color: pal('husk.doubt.base'), name: 'body' },
    { size: [6 * TX, 40 * TX, 8 * TX], pos: [8 * TX, 20 * TX, 0], color: pal('husk.doubt.base') },
    { size: [26 * TX, 6 * TX, 8 * TX], pos: [0, 40 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [8 * TX, 8 * TX, TX / 2], pos: [0, 26 * TX, 4.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1.5 * TX, 27 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 27 * TX, 4.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
