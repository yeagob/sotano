import type { MessageKey } from '../../i18n';
import type { HeartKind } from '../heart-art';

/** The trust meter (REQUESTS.md; built by agent for #235, owner's "Opus decides" on #228, D7). When a requesting presence's
 *  idle window closes with the player near, it asks "Have you done it?". A yes after at least HONEST_STILL_S seconds with no
 *  input in the window is an honest completion; a yes sooner is an early yes. The game never says which: the check is a
 *  guess, so the card's words are the same for both. A hidden step, kept per run and never drawn, named or said, starts at
 *  the top; an early yes lowers it one step, an honest completion raises it one. The gift is read from the step after the
 *  answer, never nothing, and it draws no randomness. "Not now" gives nothing and changes nothing. */

export const TRUST_TOP = 3;
export const TRUST_START = TRUST_TOP;

/** Seconds of no input, in one stretch inside the window, that make a yes an honest completion (REQUESTS.md). */
export const HONEST_STILL_S = 30;

/** The question and its one answer (the choice card adds "Not now"). */
export const DONE_CHOICE: { question: MessageKey; options: readonly MessageKey[] } = {
  question: 'request.done.question',
  options: ['request.done.yes'],
};

/** The step after a yes: one up for an honest completion, one down for an early yes, inside 0 to TRUST_TOP. */
export function answerDone(step: number, still: number): number {
  return still >= HONEST_STILL_S ? Math.min(TRUST_TOP, step + 1) : Math.max(0, step - 1);
}

export type DoneGift = { type: 'heart'; heart: HeartKind } | { type: 'key' | 'bomb' };

/** The gift of each step, the smallest first: a bomb, a key, a red heart, a blue heart at the top. Never nothing. */
export const DONE_GIFTS: readonly DoneGift[] = [
  { type: 'bomb' },
  { type: 'key' },
  { type: 'heart', heart: 'red' },
  { type: 'heart', heart: 'blue' },
];

export function doneGift(step: number): DoneGift {
  return DONE_GIFTS[Math.max(0, Math.min(TRUST_TOP, Math.floor(step)))];
}

/** The longest stretch of no input inside each running window, by key. Counted on game time, so a paused game holds it. */
export class StillWatch {
  private now = new Map<number, number>();
  private best = new Map<number, number>();

  start(key: number): void {
    this.now.set(key, 0);
    this.best.set(key, 0);
  }

  /** One frame: `active` when any key, button, stick, touch or look moved. */
  tick(dt: number, active: boolean): void {
    for (const [key, s] of this.now) {
      const next = active ? 0 : s + dt;
      this.now.set(key, next);
      if (next > (this.best.get(key) ?? 0)) this.best.set(key, next);
    }
  }

  /** The longest still stretch of a window, and forgets it. 0 for a key never started. */
  take(key: number): number {
    const b = this.best.get(key) ?? 0;
    this.now.delete(key);
    this.best.delete(key);
    return b;
  }

  clear(): void {
    this.now.clear();
    this.best.clear();
  }
}
