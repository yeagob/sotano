// How a friendly actor grows under love shots (issue #51, extended to every friendly actor by #102) and
// shrinks under negative shots (#102). Its visual scale, its box (the hitbox that shots, contact, physics
// and push use) and its navigation footprint all come from one value, `scale`. `setScale` is the only place
// a box is written, so the three cannot drift apart.

import type { Enemy } from '../enemies/types';

/** Size added by each warm love shot that reaches a friendly actor (1 is the size it is born at). */
export const GROWTH_STEP = 0.25;
/** The largest size a friendly actor grows to: three times its birth size. */
export const GROWTH_MAX = 3;

/** Friendly actors grow: everything that is not a projection, except the Boundary, which is a place and not a being. */
export const growsUnder = (e: Enemy) => e.faction !== 'projection' && !e.tags.has('boundary');

/** The size after one more love shot, never past GROWTH_MAX. */
export const grownScale = (scale: number) => Math.min(GROWTH_MAX, scale + GROWTH_STEP);

/** The size after one negative shot: one step smaller, never below the birth size. */
export const shrunkScale = (scale: number) => Math.max(1, scale - GROWTH_STEP);

/** Sets a creature's size: its box is its definition's box times `scale` (clamped to 1..GROWTH_MAX). */
export function setScale(e: Enemy, scale: number) {
  e.scale = Math.min(GROWTH_MAX, Math.max(1, scale));
  e.body.hw = e.spec.size[0] * e.scale;
  e.body.h = e.spec.size[1] * e.scale;
}
