// The gestures that dash (Irimi): a double tap of a movement key, a double flick of the left stick and a
// swipe on the left side of the phone. Pure and DOM-free, so the tests drive them with plain numbers
// (docs/design/built/practices/DASH.md §3). Directions are relative to the camera.

import { TAP_SLOP } from './bindings';

export type DashDir = 'forward' | 'back' | 'left' | 'right';

/** Two presses of the same direction this close (seconds) are a double tap. */
export const DOUBLE_TAP_S = 0.25;
/** The stick counts as pushed past this magnitude, and as returned under the lower one. */
export const FLICK_PUSH = 0.8;
export const FLICK_RETURN = 0.3;
/** A swipe must cover this many pixels within this many seconds. */
export const SWIPE_PX = 60;
export const SWIPE_S = 0.25;

/** The direction a stick vector points to, by its dominant axis. A pad's y is negative when pushed up. */
export function stickDir(x: number, y: number): DashDir {
  if (Math.abs(x) >= Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y < 0 ? 'forward' : 'back';
}

/** Two presses of one direction within DOUBLE_TAP_S. A third press starts a new pair. */
export class DoubleTap {
  private last = new Map<DashDir, number>();

  /** `now` in seconds. Returns the direction when this press completes a double tap. */
  press(dir: DashDir, now: number): DashDir | null {
    const prev = this.last.get(dir);
    if (prev !== undefined && now - prev <= DOUBLE_TAP_S) {
      this.last.delete(dir);
      return dir;
    }
    this.last.set(dir, now);
    return null;
  }
}

/**
 * Push the stick past FLICK_PUSH, return it under FLICK_RETURN, push it past FLICK_PUSH the same way within
 * DOUBLE_TAP_S of the first push. A push that does not return to neutral does not count (the stick must
 * come back before the second flick), and a held push never counts twice.
 */
export class DoubleFlick {
  private armed = true;
  private phase: 'idle' | 'first' | 'back' = 'idle';
  private dir: DashDir | null = null;
  private t0 = 0;

  /** `now` in seconds, `x` and `y` the raw left stick. Returns the direction on the second flick. */
  update(x: number, y: number, now: number): DashDir | null {
    const m = Math.hypot(x, y);
    if (this.phase !== 'idle' && now - this.t0 > DOUBLE_TAP_S) this.reset();
    if (m < FLICK_RETURN) {
      this.armed = true;
      if (this.phase === 'first') this.phase = 'back';
      return null;
    }
    if (m > FLICK_PUSH && this.armed) {
      this.armed = false;
      const d = stickDir(x, y);
      if (this.phase === 'back' && d === this.dir) {
        this.reset();
        return d;
      }
      this.phase = 'first';
      this.dir = d;
      this.t0 = now;
    }
    return null;
  }

  private reset() { this.phase = 'idle'; this.dir = null; }
}

/** The direction of a swipe that covers SWIPE_PX within SWIPE_S, or null. Screen y grows downward: up is forward. */
export function swipeDir(dx: number, dy: number, seconds: number): DashDir | null {
  if (seconds > SWIPE_S || Math.hypot(dx, dy) < SWIPE_PX) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy < 0 ? 'forward' : 'back';
}

/** How one press on the practice card ended (#375): where it started and ended, and how far it travelled in pixels. */
export interface PressRelease { startedOnCard: boolean; endedOnCard: boolean; endedOnClose: boolean; travel: number }

/**
 * The practice card's close rule (#375). A press closes the card only when it is a tap: its travel never passed the
 * tap slop, so a drag, a scroll or a mouse look never closes it. A press that starts on the card closes it only when
 * it ends on the card's close control ("Tap to continue"). A press that starts elsewhere closes it unless it ends on
 * the card's text.
 */
export function practiceReleaseCloses(r: PressRelease): boolean {
  if (r.travel > TAP_SLOP) return false;
  if (r.startedOnCard) return r.endedOnClose;
  return r.endedOnClose || !r.endedOnCard;
}
