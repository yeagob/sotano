import { pal } from '../palette';
import { phased } from '../../enemies/behaviours';
import { altitude, barrage, bars, combo, moveset, nova, puddles } from '../../enemies/moves';
import { defineEnemy, TX } from '../../enemies/types';

// A low ceiling of cloud (BESTIARY §6.3). It drifts over you, never as fast as you run. 1 Rains: cold
// rain falls on where you are going, every drop marked, and stinging puddles. 2 Lowers: it comes
// down, the floor fills with rain, and lightning bars the room. 3 Thins: low enough to reach; it
// throws the rest of its rain at once.
export default defineEnemy({
  id: 'downpour',
  kind: 'boss',
  name: 'The Downpour',
  pattern: 'To be left alone',
  hp: 140,
  speed: 2.2,
  size: [1.4, 1.2],
  contactDamage: 8,
  cost: 0,
  minFloor: 3,
  maxFloor: 4,
  behaviour: phased({
    arena: ['puddle', 'drain'],
    phases: [
      altitude(3.5, moveset({
        gait: { kind: 'hover', height: 3.5 }, pace: [0.3, 0.7], moves: [
          combo('storm-front', [puddles({ windup: 0.7, recover: 0, count: 3, r: 1.3, live: 3, spread: 2.5, walk: true }), barrage({ windup: 0.4, recover: 0, count: 10, seconds: 1.6, spread: 3, walk: true })], { recover: 0.4 }),
          barrage({ windup: 0.45, recover: 0.3, count: 8, seconds: 1.6, spread: 3, walk: true }),
          puddles({ windup: 0.8, recover: 0.3, count: 3, r: 1.3, live: 3, spread: 2.5, walk: true }),
        ],
      })),
      altitude(2.4, moveset({
        gait: { kind: 'hover', height: 2.4 }, pace: [0.3, 0.6], moves: [
          combo('lightning-storm', [bars({ windup: 0.75, recover: 0, parallels: 1, spacing: 4 }), bars({ windup: 0.6, recover: 0, parallels: 1, spacing: 4, cross: true }), barrage({ windup: 0.4, recover: 0, count: 8, seconds: 1.2, spread: 3, walk: true })], { recover: 0.4 }),
          barrage({ windup: 0.4, recover: 0.3, count: 10, seconds: 1.6, spread: 3, walk: true }),
          bars({ windup: 0.8, recover: 0.4, parallels: 1, spacing: 4, walk: true }),
          puddles({ windup: 0.7, recover: 0.3, count: 4, r: 1.3, live: 3, spread: 3, walk: true }),
        ],
      })),
      altitude(1.6, moveset({
        gait: { kind: 'hover', height: 1.6 }, pace: [0.25, 0.5], moves: [
          combo('cloudburst', [nova({ windup: 0.45, recover: 0, count: 10, volleys: 2, gap: 0.35, speed: 7 }), barrage({ windup: 0.4, recover: 0, count: 14, seconds: 1.6, spread: 3.5, walk: true }), bars({ windup: 0.6, recover: 0, parallels: 1, spacing: 4, cross: true })], { recover: 0.5 }),
          barrage({ windup: 0.4, recover: 0.3, count: 12, seconds: 1.5, spread: 3.5, walk: true }),
          bars({ windup: 0.75, recover: 0.4, parallels: 1, spacing: 4, cross: true }),
          nova({ windup: 0.5, recover: 0.4, count: 10, volleys: 2, gap: 0.4, speed: 7 }),
        ],
      })),
    ],
  }),
  model: [
    { size: [30 * TX, 6 * TX, 30 * TX], pos: [0, 26 * TX, 0], color: pal('husk.doubt.dark'), name: 'body' },
    { size: [30 * TX, 2 * TX, 30 * TX], pos: [0, 29 * TX, 0], color: pal('husk.doubt.hi') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-4 * TX, 22 * TX, 15.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [4 * TX, 22 * TX, 15.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-4 * TX, 22.5 * TX, 15.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [4 * TX, 22.5 * TX, 15.5 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});
