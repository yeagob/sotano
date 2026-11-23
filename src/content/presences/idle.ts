import type { RunRandom } from '../../core/rng';
import type { PresenceId } from './index';

/** The idle window (REQUESTS.md, decided; docs/design/built/presences/*): a presence that has asked for something stays in
 *  its room for a fixed time after the exchange, then leaves. The length is seeded: one draw per run and presence from its
 *  own fork, so the same seed waits the same time, and the countdown runs on game time (the seconds of `simulate`), so a
 *  paused game holds it. Thirty to sixty seconds, as the request document asks; never more than one minute. */
export const IDLE_MIN_S = 30;
export const IDLE_MAX_S = 60;

/** The presences whose exchange is a request, and so stay for their idle window before they leave (pending owner ruling:
 *  the built Gardener and Boatman kept their place for the floor; the request design says they leave). */
export const IDLE_PRESENCES: ReadonlySet<PresenceId> = new Set<PresenceId>(['gardener', 'boatman']);

/** The idle window of this presence in this run, in whole seconds from IDLE_MIN_S to IDLE_MAX_S. Read from the run's root. */
export function idleWindowOf(run: RunRandom, id: PresenceId): number {
  return run.fork('presence', id, 'idle').int(IDLE_MIN_S, IDLE_MAX_S);
}

/** The windows that are running, by enemy id, in seconds left. Counted by the game's own simulation step, so a paused
 *  game holds every window. */
export class IdleTimer {
  private left = new Map<number, number>();

  start(key: number, seconds: number): void {
    this.left.set(key, seconds);
  }

  has(key: number): boolean {
    return this.left.has(key);
  }

  clear(): void {
    this.left.clear();
  }

  /** Counts every running window down by `dt` seconds; returns the keys whose window ran out, each once, and forgets them. */
  tick(dt: number): number[] {
    const done: number[] = [];
    for (const [key, s] of this.left) {
      const next = s - dt;
      if (next > 0) this.left.set(key, next);
      else { this.left.delete(key); done.push(key); }
    }
    return done;
  }
}
