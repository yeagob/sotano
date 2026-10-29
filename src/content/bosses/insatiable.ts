import { pal } from '../palette';
import { phased } from '../../enemies/behaviours';
import { barrage, fan, inhale, moveset, nova, rocks, shockwave } from '../../enemies/moves';
import { defineEnemy, TX } from '../../enemies/types';

// A giant open cup of stone, a maw at floor level (BESTIARY §6.3). It never walks: the room comes to
// it. 1 Inhales: it pulls the whole room toward its biting mouth, and spits between breaths. 2 Spits:
// it throws back everything it swallowed, rain and spirals. 3 Hollow: it can't pull any more; it
// cracks, rings, and the ceiling falls with it.
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
    arena: ['spill', 'rockfall'],
    phases: [
      moveset({
        gait: { kind: 'still' }, pace: [0.4, 0.9], moves: [
          inhale({ windup: 0.8, recover: 0.6, r: 12, force: 9, live: 2.5, bite: 8 }),
          fan({ windup: 0.5, recover: 0.5, count: 5, spread: 1, volleys: 2, gap: 0.35, speed: 9 }),
          barrage({ windup: 0.5, recover: 0.5, count: 5, seconds: 1.2, spread: 2 }),
        ],
      }),
      moveset({
        gait: { kind: 'still' }, pace: [0.3, 0.7], moves: [
          barrage({ windup: 0.5, recover: 0.5, count: 9, seconds: 1.8, spread: 2.5 }),
          nova({ windup: 0.55, recover: 0.6, count: 10, volleys: 3, gap: 0.4, speed: 7, spin: 0.2 }),
          inhale({ windup: 0.6, recover: 0.4, r: 12, force: 10, live: 1.8, bite: 8 }),
        ],
      }),
      moveset({
        gait: { kind: 'still' }, pace: [0.25, 0.6], moves: [
          nova({ windup: 0.5, recover: 0.5, count: 14, volleys: 4, gap: 0.35, speed: 7.5, spin: 0.18 }),
          shockwave({ windup: 0.55, recover: 0.5, rings: 3, gap: 0.5, reach: 12 }),
          rocks({ windup: 0.45, recover: 0.3, count: 5, lead: 1, spread: 3 }),
        ],
      }),
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
