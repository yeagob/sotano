import { pal } from '../palette';
import { chase, emitter, phased, wave } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

export default defineEnemy({
  id: 'overwhelm',
  kind: 'boss',
  name: 'Overwhelm',
  pattern: 'Too much at once',
  hp: 140,
  speed: 1.2,
  size: [0.9, 2.8],
  contactDamage: 8,
  cost: 0,
  minFloor: 3,
  maxFloor: 4,
  behaviour: phased({
    arena: ['flood', 'drain'],
    phases: [
      chase({ lunge: 1 }),
      emitter({ follow: { speed: 1.0, keep: 4 }, every: 3.2, shot: (e, ctx) => wave(e, ctx, 2.4) }),
      emitter({ follow: { speed: 1.0, keep: 4 }, every: 6, shot: (e, ctx) => wave(e, ctx, 3) }),
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
