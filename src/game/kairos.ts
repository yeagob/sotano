// The Kairos stop (the practice Kairos, #123): a DOM-free clock and mark book. The game owns the
// world and the time stop (Game.simulate); this file owns the rules that a test can run without
// a renderer: how many marks, how they are dealt to the intentions, and when the stop ends.
// Docs: docs/design/built/practices/MIRACLES.md (Kairos).

export const KAIROS_CHARGES = 3;
export const KAIROS_MARKS = 5;
/** One intention per mark is fired at the release: as many as the marks. */
export const KAIROS_INTENTIONS = KAIROS_MARKS;
/** Seconds the stop lasts (counted while the game runs: a pause does not spend it). */
export const KAIROS_STOP_SECONDS = 6;
/** How far a mark reaches, in blocks. */
export const KAIROS_REACH = 40;
/** Homing strength of an intention marked on a projection (per second, see Intents.steer). */
export const KAIROS_HOMING = 6;

export interface KairosMark {
  /** A block (its cell) or a projection (its id and the position it held when marked). */
  kind: 'block' | 'projection';
  x: number;
  y: number;
  z: number;
  /** Projection marks only: the actor it sticks to. */
  actor?: number;
}

/** The dealing of intentions to marks: intention k goes to mark k mod n (round robin). With no marks
 *  every intention goes to the crosshair point, which the caller passes as `null`. */
export function dealMarks(count: number, marks: readonly KairosMark[]): (KairosMark | null)[] {
  const out: (KairosMark | null)[] = [];
  for (let k = 0; k < count; k++) out.push(marks.length ? marks[k % marks.length] : null);
  return out;
}

export class Kairos {
  private _stopped = false;
  private left = 0;
  private book: KairosMark[] = [];

  get stopped() { return this._stopped; }
  get marks(): readonly KairosMark[] { return this.book; }
  /** Seconds left of the stop (0 when not stopped). */
  get remaining() { return this._stopped ? this.left : 0; }

  /** Starts the stop. Returns false when it is already running. */
  start(): boolean {
    if (this._stopped) return false;
    this._stopped = true;
    this.left = KAIROS_STOP_SECONDS;
    this.book = [];
    return true;
  }

  /** Adds a mark. Refused (returns 'full') after KAIROS_MARKS; 'idle' when time is not stopped. */
  mark(m: KairosMark): 'added' | 'full' | 'idle' {
    if (!this._stopped) return 'idle';
    if (this.book.length >= KAIROS_MARKS) return 'full';
    this.book.push(m);
    return 'added';
  }

  /** Counts the stop down by `dt` seconds of running game. True when it has run out. */
  tick(dt: number): boolean {
    if (!this._stopped) return false;
    this.left = Math.max(0, this.left - Math.max(0, dt));
    return this.left <= 0;
  }

  /** Ends the stop and returns the marks it had, for the intentions to be fired at. */
  end(): KairosMark[] {
    const out = this.book;
    this._stopped = false;
    this.left = 0;
    this.book = [];
    return out;
  }
}
