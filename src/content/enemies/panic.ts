import { burst } from '../../enemies/behaviours';
import { defineEnemy } from '../../enemies/types';

// Anxiety spiralling into panic: rushes at you, swells and bursts, breaking the blocks
// around it. Destructive, but it also opens paths. A pulsing red-green cube with a jagged mouth.
export default defineEnemy({
  id: 'panic',
  name: 'Panic',
  pattern: 'Anxiety spiralling into panic',
  hp: 7,
  speed: 2.4,
  size: [0.38, 0.9],
  contactDamage: 0,
  cost: 2,
  minFloor: 1,
  drops: { bomb: 0.25, heart: 0.05 },
  behaviour: burst({ trigger: 2.2, fuse: 0.9, radius: 2.2, rush: 1.4 }),
  model: [
    { size: [0.76, 0.76, 0.76], pos: [0, 0.48, 0], color: 0x9c2b2b, name: 'body' },
    { size: [0.5, 0.08, 0.04], pos: [0, 0.4, 0.39], color: 0x111111 },                 // jagged mouth
    { size: [0.08, 0.08, 0.04], pos: [-0.16, 0.48, 0.39], color: 0x111111 },
    { size: [0.08, 0.08, 0.04], pos: [0.0, 0.32, 0.39], color: 0x111111 },
    { size: [0.08, 0.08, 0.04], pos: [0.16, 0.48, 0.39], color: 0x111111 },
    { size: [0.12, 0.12, 0.04], pos: [-0.16, 0.66, 0.39], color: 0xb6ff5a, glow: true, name: 'eye' },
    { size: [0.12, 0.12, 0.04], pos: [0.16, 0.66, 0.39], color: 0xb6ff5a, glow: true, name: 'eye' },
    { size: [0.2, 0.12, 0.2], pos: [-0.2, 0.06, 0], color: 0x6e1f1f },
    { size: [0.2, 0.12, 0.2], pos: [0.2, 0.06, 0], color: 0x6e1f1f },
  ],
});
