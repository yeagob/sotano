// The Sanctuary as state (docs/design/built/presences/MEDITATION-APP.md). DOM-free, so the rules are tested
// without a page: the view draws whatever this says and sends every press through `act`, `back` or `press`.
//
// Screens: `home` (meditate, or take the quick reward), `library` (which meditation), `length` (20, 30 or 40
// seconds; choosing begins), `session` (the sitting, on the app's own clock), `leave` (stay, or leave with the
// quick reward) and `end` (receive). An outcome ends the app, once: `cancel` (not now), `quick` or `complete`.

import type { Action } from '../input/bindings';
import {
  LENGTHS_SEC, SEQUENCE, SEQUENCE_IDS, momentAt, planSitting, skipPart,
  type LengthSec, type Moment, type Outcome, type Plan, type SequenceId,
} from '../content/presences/meditations';

export type Screen = 'home' | 'library' | 'length' | 'session' | 'leave' | 'end';

export interface Prefs { mute: boolean; calm: boolean }

/** What changed on a tick, for the view's sounds: a new part, a new guidance line, a new beat of the breath, the end. */
export interface Tick { part: boolean; line: boolean; beat: boolean; done: boolean }

/** The most motes a scene may hold: fewer on a small screen, none with calm visuals. */
export const PARTICLE_CAP = 160;
export const PARTICLE_CAP_SMALL = 70;
export const SMALL_SCREEN_PX = 500;
export function particleCap(width: number, height: number, calm: boolean): number {
  if (calm) return 0;
  return Math.min(width, height) < SMALL_SCREEN_PX ? PARTICLE_CAP_SMALL : PARTICLE_CAP;
}

/** What the scene may draw. Calm visuals keeps the breath shape and drops everything that moves across the screen. */
export function sceneBudget(width: number, height: number, calm: boolean) {
  return { particles: particleCap(width, height, calm), sway: !calm, effects: !calm };
}

/** The buttons a touch (or a click) reaches each action through. */
export const TOUCH_TILE: Partial<Record<Action, string>> = { skip: 'skip', mute: 'mute', calm: 'calm', back: 'close' };

/** The longest step the app's clock takes in one call. A stalled frame counts for at most this much. */
export const MAX_CLOCK_STEP_MS = 250;

/**
 * Turns the real timestamps of the page into the app's clock. Each call moves the clock by the real time since
 * the last call, but never by more than MAX_CLOCK_STEP_MS. A hidden tab stops its frames, so when it comes back
 * the time it was hidden is not counted: a sitting cannot end while the game is not drawing it.
 */
export class AppClock {
  private at: number | null = null;
  private t = 0;

  /** The app's time after the real time `real` (milliseconds, from a monotonic source). */
  now(real: number): number {
    if (this.at !== null) this.t += Math.min(MAX_CLOCK_STEP_MS, Math.max(0, real - this.at));
    this.at = real;
    return this.t;
  }

  /** A new sitting starts from zero. */
  reset() { this.at = null; this.t = 0; }
}

interface PressSource { hit(a: Action): boolean; navigate(): { x: number; y: number } }

export class MeditationApp {
  screen: Screen = 'home';
  seq: SequenceId = SEQUENCE_IDS[0];
  seconds: LengthSec = LENGTHS_SEC[0];
  plan: Plan | null = null;
  paused = false;
  /** Milliseconds of the sitting that have run. Only a running session moves it. */
  elapsed = 0;
  outcome: Outcome | null = null;
  selected = 'meditate';
  /** How fast the clock runs against real time. 1 in play; the debug console may raise it to review a sitting. */
  rate = 1;
  private last: number | null = null;
  private seen = { part: -1, line: -1, beat: -1 };

  constructor(readonly prefs: Prefs = { mute: false, calm: false }) {}

  /** The choices of the current screen, in order. The close ✕ is not a choice: it is always there, as Back. */
  get tiles(): string[] {
    switch (this.screen) {
      case 'home': return ['meditate', 'quick'];
      case 'library': return SEQUENCE_IDS.map(id => `seq:${id}`);
      case 'length': return LENGTHS_SEC.map(s => `len:${s}`);
      case 'session': return ['pause', 'skip', 'mute', 'calm', 'leave'];
      case 'leave': return ['stay', 'quick'];
      case 'end': return ['receive'];
    }
  }

  get running() { return this.screen === 'session' && !this.paused && !this.outcome; }

  get moment(): Moment | null { return this.plan ? momentAt(this.plan, this.elapsed) : null; }

  private go(screen: Screen, selected: string) {
    this.screen = screen;
    this.selected = selected;
  }

  private finish(o: Outcome): Outcome | null {
    if (this.outcome) return null;
    this.outcome = o;
    return o;
  }

  /** A press on a choice, a switch or the close ✕. Returns the outcome that ends the app, or null if it stays. */
  act(id: string, now: number): Outcome | null {
    if (this.outcome) return null;
    this.tick(now);
    if (id === 'close') return this.back(now);
    if (id === 'mute') { this.prefs.mute = !this.prefs.mute; return null; }
    if (id === 'calm') { this.prefs.calm = !this.prefs.calm; return null; }
    if (!this.tiles.includes(id)) return null;
    switch (this.screen) {
      case 'home':
        if (id === 'quick') return this.finish('quick');
        this.go('library', `seq:${this.seq}`);
        return null;
      case 'library':
        this.seq = id.slice(4) as SequenceId;
        this.go('length', `len:${this.seconds}`);
        return null;
      case 'length':
        this.seconds = Number(id.slice(4)) as LengthSec;
        this.plan = planSitting(SEQUENCE[this.seq], this.seconds);
        this.elapsed = 0;
        this.paused = false;
        this.seen = { part: -1, line: -1, beat: -1 };
        this.go('session', 'pause');
        return null;
      case 'session':
        if (id === 'pause') this.paused = !this.paused;
        else if (id === 'skip' && this.plan) this.plan = skipPart(this.plan, this.elapsed);
        else if (id === 'leave') this.go('leave', 'stay');
        return null;
      case 'leave':
        if (id === 'quick') return this.finish('quick');
        this.go('session', 'pause');
        return null;
      case 'end':
        return this.finish('complete');
    }
  }

  /** One step back. On Home it is "not now"; in a sitting it only asks; from the end it still receives. */
  back(now: number): Outcome | null {
    if (this.outcome) return null;
    this.tick(now);
    switch (this.screen) {
      case 'home': return this.finish('cancel');
      case 'library': this.go('home', 'meditate'); return null;
      case 'length': this.go('library', `seq:${this.seq}`); return null;
      case 'session': this.go('leave', 'stay'); return null;
      case 'leave': this.go('session', 'pause'); return null;
      case 'end': return this.finish('complete');
    }
  }

  /** Moves the selection over the screen's choices, laid out in `cols` columns. */
  move(dx: number, dy: number, cols: number) {
    const tiles = this.tiles;
    const at = Math.max(0, tiles.indexOf(this.selected));
    const next = Math.min(tiles.length - 1, Math.max(0, at + dx + dy * Math.max(1, cols)));
    this.selected = tiles[next];
  }

  /** One frame of input from the bindings (keyboard and gamepad; touch and the mouse press the buttons). */
  press(inp: PressSource, now: number, cols: number): Outcome | null {
    if (inp.hit('back')) return this.back(now);
    if (inp.hit('mute')) return this.act('mute', now);
    if (inp.hit('calm')) return this.act('calm', now);
    if (inp.hit('skip')) return this.act('skip', now);
    const n = inp.navigate();
    if (n.x || n.y) this.move(n.x, n.y, cols);
    if (inp.hit('confirm')) return this.act(this.selected, now);
    return null;
  }

  /** Moves the app's clock to `now` (milliseconds, any monotonic source) and says what changed. */
  tick(now: number): Tick {
    const out: Tick = { part: false, line: false, beat: false, done: false };
    const dt = this.last === null ? 0 : Math.max(0, now - this.last);
    this.last = now;
    if (!this.plan || !this.running) return out;
    this.elapsed = Math.min(this.plan.totalMs, this.elapsed + dt * this.rate);
    const m = momentAt(this.plan, this.elapsed);
    if (m.done) {
      this.go('end', 'receive');
      out.done = true;
      return out;
    }
    const beat = m.part * 100000 + m.beat;
    out.part = m.part !== this.seen.part;
    out.line = m.lineSeq !== this.seen.line;
    out.beat = beat !== this.seen.beat;
    this.seen = { part: m.part, line: m.lineSeq, beat };
    return out;
  }
}
