import { pal } from '../palette';
import { phased } from '../../enemies/behaviours';
import { barrage, bars, charge, combo, inhale, moveset, nova, rocks, tide } from '../../enemies/moves';
import { defineEnemy, TX } from '../../enemies/types';

// A mound of everything kept (BESTIARY §6.3). 1 Pushes weights: great weights roll across the room
// and it rams after them. 2 Clutches: it pulls everything back to its pile and throws what it holds.
// 3 Spills: it bursts open; what it kept flies out in every direction while it thrashes.
export default defineEnemy({
  id: 'hoard',
  kind: 'boss',
  name: 'The Hoard',
  pattern: 'Holding on to everything',
  hp: 140,
  speed: 2.6,
  size: [1.2, 2.2],
  contactDamage: 8,
  cost: 0,
  minFloor: 3,
  maxFloor: 4,
  breaks: { tier: 0, power: 5 },
  behaviour: phased({
    arena: ['rockfall', 'spill'],
    phases: [
      moveset({
        gait: { kind: 'stalk' }, pace: [0.5, 1], moves: [
          combo('weights-then-ram', [tide({ windup: 0.8, recover: 0, count: 1, gap: 0, seconds: 2.2, axes: 'z' }), charge({ windup: 0.5, recover: 0, speed: 11, impact: 5 })], { recover: 0.8 }),
          tide({ windup: 0.9, recover: 0.3, count: 2, gap: 1.2, seconds: 2.4, axes: 'both', walk: true }),
          charge({ windup: 0.6, recover: 0.8, speed: 10, impact: 4, min: 3 }),
          bars({ windup: 0.8, recover: 0.5, parallels: 1, spacing: 3.5 }),
        ],
      }),
      moveset({
        gait: { kind: 'stalk' }, pace: [0.4, 0.8], moves: [
          combo('clutch-and-throw', [inhale({ windup: 0.55, recover: 0, r: 9, force: 9, live: 1.6, bite: 8 }), barrage({ windup: 0.4, recover: 0, count: 8, seconds: 1.2, spread: 2.5 })], { recover: 0.6 }),
          inhale({ windup: 0.6, recover: 0.3, r: 9, force: 8, live: 2, bite: 8 }),
          barrage({ windup: 0.5, recover: 0.5, count: 7, seconds: 1.4, spread: 2.5 }),
          bars({ windup: 0.75, recover: 0.5, parallels: 1, spacing: 3.5, cross: true }),
        ],
      }),
      moveset({
        gait: { kind: 'stalk' }, pace: [0.3, 0.6], moves: [
          combo('burst-open', [nova({ windup: 0.45, recover: 0, count: 12, volleys: 2, gap: 0.3, speed: 7.5 }), nova({ windup: 0.4, recover: 0, count: 12, volleys: 2, gap: 0.3, speed: 7.5, spin: 0.3 }), charge({ windup: 0.45, recover: 0, speed: 12, bounces: 2, impact: 6 })], { recover: 0.7 }),
          charge({ windup: 0.5, recover: 0.6, speed: 12, bounces: 2, impact: 6 }),
          nova({ windup: 0.5, recover: 0.5, count: 12, volleys: 3, gap: 0.4, speed: 7.5, spin: 0.25 }),
          rocks({ windup: 0.45, recover: 0.3, count: 5, lead: 1, spread: 3 }),
        ],
      }),
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
