import { chase } from '../../enemies/behaviours';
import { defineEnemy } from '../../enemies/types';

// Self-doubt: slow, persistent, presses on you until you move on. A hunched grey figure
// with hollow eyes and arms that hang.
export default defineEnemy({
  id: 'doubt',
  name: 'Doubt',
  pattern: 'Self-doubt',
  hp: 12,
  speed: 1.7,
  size: [0.32, 1.6],
  contactDamage: 4,
  cost: 1,
  minFloor: 1,
  drops: { heart: 0.12, key: 0.04, bomb: 0.05 },
  behaviour: chase({ lunge: 1.5 }),
  model: [
    { size: [0.62, 0.62, 0.36], pos: [0, 0.62, 0], color: 0x6c6f78 },               // torso
    { size: [0.5, 0.5, 0.5], pos: [0, 1.17, 0.08], color: 0x80838c, tilt: 0.35, name: 'head' },
    { size: [0.1, 0.08, 0.04], pos: [-0.11, 1.18, 0.34], color: 0x0b0b10, name: 'eye' },  // hollow eyes
    { size: [0.1, 0.08, 0.04], pos: [0.11, 1.18, 0.34], color: 0x0b0b10, name: 'eye' },
    { size: [0.04, 0.04, 0.02], pos: [-0.11, 1.18, 0.36], color: 0xbfc7ff, glow: true },
    { size: [0.04, 0.04, 0.02], pos: [0.11, 1.18, 0.36], color: 0xbfc7ff, glow: true },
    { size: [0.16, 0.58, 0.16], pos: [-0.4, 0.5, 0.04], color: 0x5c5f68, name: 'armL' },
    { size: [0.16, 0.58, 0.16], pos: [0.4, 0.5, 0.04], color: 0x5c5f68, name: 'armR' },
    { size: [0.2, 0.32, 0.2], pos: [-0.15, 0.16, 0], color: 0x4b4d55, name: 'legL' },
    { size: [0.2, 0.32, 0.2], pos: [0.15, 0.16, 0], color: 0x4b4d55, name: 'legR' },
  ],
});
