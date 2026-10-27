import { pal } from '../palette';
import { ranged } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

// The Inner Critic, "the Lectern": "That's not good enough." (docs/art/DECISIONS.md §8.9). It
// wants you to be accepted, so it judges you first. Tall, pale husk, glyph "Γ": no legs, no torso,
// no hands, never flesh. A stack of ruled pages on a post, a mask with two slits, a quill whose
// cold nib is its tell, and on its back an ✗: it judges first because it fears judgement most.
// Units are texels (1/16 block).
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
  // a stack of paper: fire burns it twice as hard, and soaked pages slow it to a shuffle
  elements: { fire: { harm: 2, path: 'avoid' }, lava: { harm: 2, path: 'avoid' }, water: { speed: 0.45, path: 'cross' } },
  model: [
    { size: [8 * TX, 2 * TX, 6 * TX], pos: [0, 1 * TX, 0], color: pal('paper.dark') },
    { size: [2 * TX, 2 * TX, 2 * TX], pos: [0, 3 * TX, 0], color: pal('paper.dark') },
    // seven slabs: a stack of marked papers
    { size: [8 * TX, 3 * TX, 6 * TX], pos: [0 * TX, 5.5 * TX, 0], color: pal('paper.base'), rot: [0, 0.05, 0] },
    { size: [8 * TX, 3 * TX, 6 * TX], pos: [1 * TX, 8.5 * TX, 0], color: pal('paper.hi'), rot: [0, -0.05, 0] },
    { size: [8 * TX, 3 * TX, 6 * TX], pos: [-1 * TX, 11.5 * TX, 0], color: pal('paper.base'), rot: [0, 0.05, 0] },
    { size: [8 * TX, 3 * TX, 6 * TX], pos: [0 * TX, 14.5 * TX, 0], color: pal('paper.hi'), rot: [0, -0.05, 0] },
    { size: [8 * TX, 3 * TX, 6 * TX], pos: [1 * TX, 17.5 * TX, 0], color: pal('paper.base'), rot: [0, 0.05, 0] },
    { size: [8 * TX, 3 * TX, 6 * TX], pos: [0 * TX, 20.5 * TX, 0], color: pal('paper.hi'), rot: [0, -0.05, 0] },
    { size: [8 * TX, 3 * TX, 6 * TX], pos: [-1 * TX, 23.5 * TX, 0], color: pal('paper.base'), rot: [0, 0.05, 0] },
    // ink ticks on the pages it keeps
    { size: [2 * TX, TX / 2, TX / 2], pos: [-1.5 * TX, 9 * TX, 3.25 * TX], color: pal('ink.line') },
    { size: [2 * TX, TX / 2, TX / 2], pos: [1.5 * TX, 15 * TX, 3.25 * TX], color: pal('ink.line') },
    { size: [2 * TX, TX / 2, TX / 2], pos: [-0.5 * TX, 21 * TX, 3.25 * TX], color: pal('ink.line') },
    // the ✗ on its own back
    { size: [5 * TX, TX, TX / 2], pos: [0, 13 * TX, -3.25 * TX], color: pal('ink.line'), rot: [0, 0, 0.785] },
    { size: [5 * TX, TX, TX / 2], pos: [0, 13 * TX, -3.25 * TX], color: pal('ink.line'), rot: [0, 0, -0.785] },
    // the mask, tilted back 5°, with two narrow slits
    { size: [7 * TX, 6 * TX, TX], pos: [0, 28 * TX, 3.5 * TX], color: pal('paper.hi'), tilt: -0.087, name: 'head' },
    { size: [7 * TX, TX / 2, TX], pos: [0, 3.25 * TX, 0], color: pal('cold.rim'), parent: 'head' },
    { size: [3 * TX, TX, TX / 2], pos: [-2 * TX, 0.5 * TX, 0.75 * TX], color: pal('ink.void'), parent: 'head' },
    { size: [3 * TX, TX, TX / 2], pos: [2 * TX, 0.5 * TX, 0.75 * TX], color: pal('ink.void'), parent: 'head' },
    { size: [2 * TX, TX, TX / 2], pos: [-2 * TX, 0.5 * TX, 1 * TX], color: pal('cold.dim'), glow: true, parent: 'head', name: 'tell' },
    { size: [2 * TX, TX, TX / 2], pos: [2 * TX, 0.5 * TX, 1 * TX], color: pal('cold.dim'), glow: true, parent: 'head', name: 'tell' },
    // the quill, the bar of the Γ, pointing at you; its nib is the tell
    { size: [2 * TX, 2 * TX, 12 * TX], pos: [3 * TX, 24 * TX, 8 * TX], color: pal('ink.line'), name: 'point' },
    { size: [2 * TX, 2 * TX, 2 * TX], pos: [3 * TX, 24 * TX, 15 * TX], color: pal('cold.dim'), glow: true, name: 'tell' },
  ],
});
