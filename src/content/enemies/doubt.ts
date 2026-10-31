import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

// Doubt, "Are you sure?" (docs/art/DECISIONS.md §8.8). It wants you to not fail; it keeps you
// still because still is safe. Medium, dark husk, glyph "?": a hunched torso on a dragging sack of
// stones, head hooked forward, forearms crossed over its chest (it holds its own elbows). One family
// eye: 2×2 cold lights in dark sockets that can't hold your gaze. Units are texels (1/16 block).
export default defineEnemy({
  id: 'doubt',
  name: 'Doubt',
  pattern: 'Self-doubt',
  hp: 24,
  speed: 1.7,
  size: [0.32, 1.6],
  contactDamage: 4,
  cost: 1,
  minFloor: 1,
  drops: { heart: 0.12, key: 0.04, bomb: 0.05 },
  behaviour: chase({ lunge: 1.5, hesitate: { every: 1.4, pause: 0.5 }, reach: 0.5 }),
  breaks: { tier: 0, power: 2 },
  // it keeps you still because still is safe: it won't follow you into your feelings (it walks
  // around the water), and its sack of stones drags it down when it falls in
  elements: { water: { path: 'avoid', speed: 0.35 } },
  model: [
    // sack of stones (root): what doubt carries
    { size: [10 * TX, 4 * TX, 8 * TX], pos: [0, 2 * TX, -1 * TX], color: pal('husk.doubt.dark') },
    { size: [10 * TX, TX, 8 * TX], pos: [0, 4.5 * TX, -1 * TX], color: pal('cold.rim') },
    // torso, pitched 20° forward
    { size: [8 * TX, 7 * TX, 6 * TX], pos: [0, 8 * TX, 0], color: pal('husk.doubt.base'), tilt: 0.35 },
    // neck, the hook of the "?"
    { size: [3 * TX, 4 * TX, 3 * TX], pos: [0, 12 * TX, 2.5 * TX], color: pal('husk.doubt.base'), tilt: 0.78 },
    // head, 4 texels forward and tilted 25° down; its face and rim ride on it
    { size: [9 * TX, 8 * TX, 8 * TX], pos: [0, 15 * TX, 5 * TX], color: pal('husk.doubt.hi'), tilt: 0.44, name: 'head' },
    { size: [9 * TX, TX, 8 * TX], pos: [0, 4.5 * TX, 0], color: pal('cold.rim'), parent: 'head' },
    { size: [3 * TX, 3 * TX, TX / 2], pos: [-2 * TX, 0.5 * TX, 4.25 * TX], color: pal('ink.void'), parent: 'head' },
    { size: [3 * TX, 3 * TX, TX / 2], pos: [2 * TX, 0.5 * TX, 4.25 * TX], color: pal('ink.void'), parent: 'head' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-2.5 * TX, 0, 4.5 * TX], color: pal('cold.white'), glow: true, parent: 'head', name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [1.5 * TX, 0, 4.5 * TX], color: pal('cold.white'), glow: true, parent: 'head', name: 'tell' },
    { size: [3 * TX, TX, TX / 2], pos: [-2 * TX, 2.5 * TX, 4.25 * TX], color: pal('ink.void'), parent: 'head' },
    { size: [3 * TX, TX, TX / 2], pos: [2 * TX, 2.5 * TX, 4.25 * TX], color: pal('ink.void'), parent: 'head' },
    // upper arms hanging from the shoulders, forearms crossed over the chest
    { size: [2 * TX, 5 * TX, 2 * TX], pos: [-5 * TX, 8.5 * TX, 1 * TX], color: pal('husk.doubt.base'), name: 'armL' },
    { size: [2 * TX, 5 * TX, 2 * TX], pos: [5 * TX, 8.5 * TX, 1 * TX], color: pal('husk.doubt.base'), name: 'armR' },
    { size: [6 * TX, 2 * TX, 2 * TX], pos: [-0.5 * TX, 8 * TX, 4 * TX], color: pal('husk.doubt.hi'), rot: [0, 0.2, 0] },
    { size: [6 * TX, 2 * TX, 2 * TX], pos: [0.5 * TX, 10 * TX, 4 * TX], color: pal('husk.doubt.hi'), rot: [0, -0.2, 0] },
    // two cold wisps drifting on its back (its overlay motif)
    { size: [2 * TX, TX, TX / 2], pos: [-1 * TX, 9 * TX, -3.25 * TX], color: pal('cold.dim') },
    { size: [2 * TX, TX, TX / 2], pos: [2 * TX, 6 * TX, -3.25 * TX], color: pal('cold.dim') },
  ],
});
