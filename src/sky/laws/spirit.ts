// Spirit, the outline of the hearts (docs/design/not-built/sky/guardians/README.md §6.6, docs/architecture/SKY.md §5.2).
// The one gate of every special attack's drain. A deity calls ctx.drain(n) in its attack's act; this law decides whether
// the drain lands, and only this law calls host.drainSpirit. Health is never taken here.
//   - at most once per attack run (the deity's own flag, Deity.drain);
//   - at least 6 s between two drains;
//   - never while the player is held, nor within 1 s after.
// At zero spirit the player goes to a random floor of the underground (floors 0 to 9, silence excluded); the refill
// comes with the teleport (game.ts passRealm), not here.

import type { SkyHost, SpiritApi } from '../types';

/** Seconds between two drains. */
export const DRAIN_GAP = 6;
/** Seconds after a hold ends in which no drain lands. */
export const DRAIN_CALM = 1;
/** The floors the player can be sent to at zero spirit (the silence chamber is excluded). */
export const UNDERGROUND_FLOORS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export class SpiritLaw implements SpiritApi {
  /** The game time of the last frame in which the player was held. */
  private heldAt = -Infinity;
  private drainedAt = -Infinity;
  /** How many times spirit has run out: each fall takes its own rng fork. */
  private falls = 0;

  constructor(private readonly host: SkyHost) {}

  /** Called once a frame by the sky realm. */
  update(): void {
    if (this.host.player().held) this.heldAt = this.host.time();
  }

  canDrain(): boolean {
    const now = this.host.time();
    if (this.host.player().held) return false;
    if (now - this.heldAt < DRAIN_CALM) return false;
    return now - this.drainedAt >= DRAIN_GAP;
  }

  drain(n: number): boolean {
    if (!this.canDrain()) return false;
    this.drainedAt = this.host.time();
    this.host.drainSpirit(n);
    if (this.host.spirit() <= 0) {
      this.host.sendUnderground(UNDERGROUND_FLOORS, this.host.fork('sky', 'underground', this.falls++));
    }
    return true;
  }
}
