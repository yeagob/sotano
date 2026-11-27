// The body button: the one touch context button that the crouch (Child's Pose) and the dash (Irimi) share
// (docs/architecture/input/TOUCH.md §1.1, issue #377). It is shown only while a practice gives one of them,
// and a press does the one that applies now. Pure and DOM-free, so the tests drive it with plain values.

import { stickDir, type DashDir } from './gestures';

/** What the body button needs to know at the moment of a press. */
export interface BodyState {
  /** The crouch stat is on (Child's Pose, Walk Slow or the Folding Tincture). */
  crouch: boolean;
  /** The dash stat is on (Irimi). */
  dash: boolean;
  /** The crouch is switched on now. */
  crouched: boolean;
  /** The touch stick, x right and y up, each in -1..1. */
  stickX: number;
  stickY: number;
}

/** What a press of the body button does: switch the crouch on, switch it off, dash, or nothing. */
export type BodyChoice = 'crouch' | 'stand' | 'dash' | null;

/** The stick counts as moving past this share of its radius (the dash's flick return, gestures.ts). */
export const BODY_MOVING = 0.3;

/** Whether the body button is on screen: only while a practice gives the crouch or the dash. */
export function bodyShown(s: Pick<BodyState, 'crouch' | 'dash' | 'crouched'>): boolean {
  return s.crouch || s.dash || s.crouched;
}

/**
 * What a press does now, in this order: crouched, it stands you up; with the dash and the stick pushed (or without
 * the crouch), it dashes; with the crouch, it kneels. So with both practices the button kneels while you stand
 * still and dashes while you move, as a slide comes out of a run in the shooters a phone player knows.
 */
export function bodyChoice(s: BodyState): BodyChoice {
  if (s.crouched) return 'stand';
  const moving = Math.hypot(s.stickX, s.stickY) >= BODY_MOVING;
  if (s.dash && (moving || !s.crouch)) return 'dash';
  if (s.crouch) return 'crouch';
  return null;
}

/** The direction of a dash from the body button: the way the stick points, forward when it rests. */
export function bodyDashDir(stickX: number, stickY: number): DashDir {
  if (Math.hypot(stickX, stickY) < BODY_MOVING) return 'forward';
  // stickDir reads a pad's y, negative when pushed up; the touch stick's y is positive up
  return stickDir(stickX, -stickY);
}
