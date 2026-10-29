import { pal } from '../palette';
import { phased } from '../../enemies/behaviours';
import { charge, combo, fan, moveset, nova, shockwave, tide } from '../../enemies/moves';
import { defineEnemy, TX } from '../../enemies/types';

// A tide with a face of foam (BESTIARY §6.3). 1 Rises: it surges at you and sends a wave across the
// room. 2 Breaks: the room floods and the waves come from every side, one after another (jump them).
// 3 Recedes: the water drains and it throws all it has left: waves, spray and surges.
export default defineEnemy({
  id: 'overwhelm',
  kind: 'boss',
  name: 'Overwhelm',
  pattern: 'Too much at once',
  hp: 140,
  speed: 2.6,
  size: [0.9, 2.8],
  contactDamage: 8,
  breaks: { tier: 1, power: 6 },
  cost: 0,
  minFloor: 3,
  maxFloor: 4,
  behaviour: phased({
    arena: ['flood', 'drain'],
    phases: [
      moveset({
        gait: { kind: 'stalk' }, pace: [0.5, 1], moves: [
          combo('surge-and-break', [charge({ windup: 0.55, recover: 0, speed: 10, impact: 4 }), tide({ windup: 0.8, recover: 0, count: 1, gap: 0, seconds: 2 })], { recover: 0.6, min: 3 }),
          tide({ windup: 0.9, recover: 0.4, count: 1, gap: 0, seconds: 2.2, walk: true }),
          charge({ windup: 0.6, recover: 0.7, speed: 10, impact: 4, min: 3 }),
          fan({ windup: 0.5, recover: 0.5, count: 5, spread: 1.1, volleys: 2, gap: 0.3, speed: 9 }),
        ],
      }),
      moveset({
        gait: { kind: 'stalk' }, pace: [0.4, 0.8], moves: [
          combo('crossing-tides', [tide({ windup: 0.85, recover: 0, count: 2, gap: 0.9, seconds: 2, axes: 'x' }), tide({ windup: 0.6, recover: 0, count: 2, gap: 0.9, seconds: 2, axes: 'z' })], { recover: 0.5 }),
          combo('splash-and-surge', [shockwave({ windup: 0.45, recover: 0, rings: 1, gap: 0, reach: 8 }), charge({ windup: 0.45, recover: 0, speed: 11, bounces: 1, impact: 5 })], { recover: 0.7 }),
          tide({ windup: 0.9, recover: 0.4, count: 3, gap: 1.1, seconds: 2, axes: 'both', walk: true }),
          shockwave({ windup: 0.5, recover: 0.5, rings: 2, gap: 0.45, reach: 8 }),
          charge({ windup: 0.55, recover: 0.7, speed: 11, bounces: 1, impact: 5 }),
        ],
      }),
      moveset({
        gait: { kind: 'stalk' }, pace: [0.3, 0.6], moves: [
          combo('the-flood', [tide({ windup: 0.75, recover: 0, count: 3, gap: 0.7, seconds: 1.8, axes: 'both' }), nova({ windup: 0.45, recover: 0, count: 12, volleys: 2, gap: 0.35, speed: 8 }), charge({ windup: 0.45, recover: 0, speed: 12, bounces: 2, impact: 6 })], { recover: 0.6 }),
          tide({ windup: 0.8, recover: 0.3, count: 4, gap: 0.8, seconds: 1.8, axes: 'both', walk: true }),
          nova({ windup: 0.5, recover: 0.5, count: 12, volleys: 2, gap: 0.4, speed: 8 }),
          charge({ windup: 0.5, recover: 0.6, speed: 12, bounces: 2, impact: 6 }),
        ],
      }),
    ],
  }),
  model: [
    { size: [24 * TX, 30 * TX, 10 * TX], pos: [0, 15 * TX, 0], color: pal('husk.doubt.base'), name: 'body' },
    { size: [24 * TX, 4 * TX, 12 * TX], pos: [0, 30 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [6 * TX, 2 * TX, TX / 2], pos: [-4 * TX, 19 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [6 * TX, 2 * TX, TX / 2], pos: [4 * TX, 19 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-4 * TX, 19 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [4 * TX, 19 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [6 * TX, 3 * TX, 6 * TX], pos: [0, 3 * TX, 0], color: pal('husk.doubt.dark'), name: 'core' },
  ],
});
