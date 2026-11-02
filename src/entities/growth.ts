// How a friendly creature grows under love shots (issue #51). Its visual scale, its box (the hitbox
// that shots, contact and physics use) and its navigation footprint all come from one value, `scale`.
// `setScale` is the only place a creature's box is written, so the three cannot drift apart.

import type { Enemy } from '../enemies/types';

/** Size added by each warm love shot that reaches a creature (1 is the size it is born at). */
export const GROWTH_STEP = 0.25;
/** The largest size a creature grows to: three times its birth size. */
export const GROWTH_MAX = 3;

/** The size after one more love shot, never past GROWTH_MAX. */
export const grownScale = (scale: number) => Math.min(GROWTH_MAX, scale + GROWTH_STEP);

/** Sets a creature's size: its box is its definition's box times `scale` (clamped to 1..GROWTH_MAX). */
export function setScale(e: Enemy, scale: number) {
  e.scale = Math.min(GROWTH_MAX, Math.max(1, scale));
  e.body.hw = e.spec.size[0] * e.scale;
  e.body.h = e.spec.size[1] * e.scale;
}
