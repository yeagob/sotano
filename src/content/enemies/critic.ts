import { ranged } from '../../enemies/behaviours';
import { defineEnemy } from '../../enemies/types';

// The inner critic: keeps its distance and lobs judgements at you. Tall, pale and thin,
// one arm always pointing.
export default defineEnemy({
  id: 'critic',
  name: 'Inner Critic',
  pattern: 'The judging voice',
  hp: 9,
  speed: 1.5,
  size: [0.28, 1.9],
  contactDamage: 4,
  cost: 2,
  minFloor: 1,
  drops: { heart: 0.1, key: 0.08, bomb: 0.06 },
  behaviour: ranged({ keep: 6, cooldown: 2.4, windup: 0.6 }),
  model: [
    { size: [0.42, 0.8, 0.28], pos: [0, 0.95, 0], color: 0xd8d0c4 },                 // long torso
    { size: [0.4, 0.42, 0.4], pos: [0, 1.6, 0], color: 0xe9e2d6, name: 'head' },
    { size: [0.26, 0.04, 0.04], pos: [0, 1.52, 0.21], color: 0x3a2a2a },               // frown
    { size: [0.08, 0.06, 0.04], pos: [-0.09, 1.66, 0.21], color: 0x2a1a1a },
    { size: [0.08, 0.06, 0.04], pos: [0.09, 1.66, 0.21], color: 0x2a1a1a },
    { size: [0.12, 0.12, 0.62], pos: [0.28, 1.25, 0.3], color: 0xcfc6b8, name: 'point' },  // pointing arm
    { size: [0.08, 0.08, 0.1], pos: [0.28, 1.25, 0.64], color: 0xe05d5d, glow: true, name: 'tip' },
    { size: [0.12, 0.6, 0.12], pos: [-0.28, 0.95, 0], color: 0xcfc6b8, name: 'armL' },
    { size: [0.14, 0.55, 0.14], pos: [-0.1, 0.28, 0], color: 0xb8afa2, name: 'legL' },
    { size: [0.14, 0.55, 0.14], pos: [0.1, 0.28, 0], color: 0xb8afa2, name: 'legR' },
  ],
});
