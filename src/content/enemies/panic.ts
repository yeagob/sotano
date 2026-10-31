import { pal } from '../palette';
import { burst } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

// Panic, "Something is wrong, something is wrong." (docs/art/DECISIONS.md §8.10). It wants to
// protect you: an alarm that rings when nothing is on fire. Small, dark husk, glyph "✳": all head,
// hands up, four quick legs, captive light inside that shows through hairline cracks. It swells in
// three steps and the alarm goes white; what it breaks is often the way forward. Texel units.
export default defineEnemy({
  id: 'panic',
  name: 'Panic',
  pattern: 'Anxiety spiralling into panic',
  hp: 14,
  speed: 2.4,
  size: [0.38, 0.9],
  contactDamage: 0,
  cost: 2,
  minFloor: 1,
  drops: { bomb: 0.25, heart: 0.05 },
  behaviour: burst({ trigger: 2.2, fuse: 0.9, radius: 2.2, rush: 1.4 }),
  // an alarm that rings when nothing is on fire: water (feeling it) calms it down for a while, even
  // mid-swell; real fire is what it was always waiting for, and it goes off at once
  elements: {
    water: { speed: 0.5, path: 'cross', enter: e => { e.state = 'calm'; e.timer = 2.5; e.pulse = 0; } },
    fire: { path: 'avoid', enter: e => { if (e.state !== 'swell') { e.state = 'swell'; e.timer = 0.3; } } },
    lava: { path: 'avoid', enter: e => { if (e.state !== 'swell') { e.state = 'swell'; e.timer = 0.3; } } },
  },
  model: [
    // body and head in one (root)
    { size: [10 * TX, 10 * TX, 10 * TX], pos: [0, 8 * TX, 0], color: pal('husk.panic.base'), name: 'body' },
    { size: [10 * TX, TX, 10 * TX], pos: [0, 13.5 * TX, 0], color: pal('cold.rim') },
    // captive light through hairline cracks (front and sides): its core, the tell of the swell
    { size: [TX, 4 * TX, TX / 2], pos: [3.5 * TX, 9 * TX, 5.25 * TX], color: pal('captive.smoulder'), glow: true, name: 'core' },
    { size: [TX / 2, 5 * TX, TX], pos: [5.25 * TX, 7 * TX, -1 * TX], color: pal('captive.smoulder'), glow: true, name: 'core' },
    { size: [TX / 2, 3 * TX, TX], pos: [-5.25 * TX, 10 * TX, 2 * TX], color: pal('captive.smoulder'), glow: true, name: 'core' },
    // face: big sockets, 2×2 cold lights, a small "O" mouth
    { size: [4 * TX, 4 * TX, TX / 2], pos: [-2 * TX, 9.5 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [4 * TX, 4 * TX, TX / 2], pos: [3 * TX, 9.5 * TX, 5.25 * TX], color: pal('ink.void') },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2 * TX, 9.5 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'eye' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [3 * TX, 9.5 * TX, 5.5 * TX], color: pal('cold.white'), glow: true, name: 'eye' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [0.5 * TX, 5.5 * TX, 5.25 * TX], color: pal('ink.void') },
    // hands up: arms raised up and out 30°
    { size: [2 * TX, 5 * TX, 2 * TX], pos: [-6 * TX, 15 * TX, 0], color: pal('husk.panic.hi'), rot: [0, 0, 0.52] },
    { size: [2 * TX, 5 * TX, 2 * TX], pos: [6 * TX, 15 * TX, 0], color: pal('husk.panic.hi'), rot: [0, 0, -0.52] },
    // four spider-quick legs at the corners (diagonal pairs)
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [-4 * TX, 1.5 * TX, 4 * TX], color: pal('husk.panic.dark'), name: 'legL' },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [4 * TX, 1.5 * TX, -4 * TX], color: pal('husk.panic.dark'), name: 'legL' },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [4 * TX, 1.5 * TX, 4 * TX], color: pal('husk.panic.dark'), name: 'legR' },
    { size: [2 * TX, 3 * TX, 2 * TX], pos: [-4 * TX, 1.5 * TX, -4 * TX], color: pal('husk.panic.dark'), name: 'legR' },
  ],
});
