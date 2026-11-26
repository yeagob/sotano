// The wind above the crown (issue #373, docs/design/built/levels/giant-tree/WIND.md): from the first row over the
// crown's leaves upward it always blows, one steady direction for each 3-second period, and it pushes the body
// while it is in the air with 1.1 times the body's own air control force. It is one source on the air's forces
// (`src/physics/air-forces.ts`), so a practice can cancel it with a filter.

import type { Rng } from '../core/rng';
import { SURFACE_Y } from '../world/floor';
import { TREE_ZONES } from '../world/tree';
import type { AirForce, AirQuery, AirVec } from '../physics/air-forces';

/** Seconds the wind keeps one direction (owner: every 3 seconds). */
export const WIND_PERIOD = 3;
/** The wind's force as a share of the body's own air control force (owner: the player's force plus 0.1 of it). */
export const WIND_FACTOR = 1.1;
/** The smallest turn between two periods, radians: each new direction is at least 60° from the last, so every
 *  change reads as a change. The turn is drawn in [60°, 300°]. */
export const WIND_TURN_MIN = Math.PI / 3;

/** The feet height where the wind starts for a tree whose base is `base` (surface + 1): the first row of the stars
 *  story (`TREE_ZONES.heaven`, 146 blocks over the base), the row just above the crown's highest leaves (the canopy's
 *  shell reaches its story's last row, base + 145). */
export function windFloor(base: number): number { return base + TREE_ZONES.heaven; }

/** Where the wind starts in the run's world: the giant tree stands on the surface. */
export const WIND_FROM = windFloor(SURFACE_Y + 1);

/** The wind as a source of the air's forces. `fork(n)` is the run's fork for period n (`fork('wind', n)`). */
export class Wind implements AirForce {
  readonly id = 'wind';
  /** Seconds of the wind's own clock: it starts at 0 with the run and runs with the world's time. */
  t = 0;
  private n = -1;
  private angle = 0;
  private readonly dir: AirVec = { x: 1, z: 0 };

  constructor(private readonly fork: (n: number) => Rng, readonly from = WIND_FROM) {}

  advance(dt: number) { if (dt > 0 && Number.isFinite(dt)) this.t += dt; }

  /** The period the clock is in: it turns at every whole multiple of `WIND_PERIOD` seconds. */
  get period(): number { return Math.floor((this.t + 1e-9) / WIND_PERIOD); }

  /** The wind's direction in period `n`, a horizontal unit vector. Each period is a fresh fork, so no stream moves:
   *  the first angle is uniform, and each later one turns from the one before by [60°, 300°]. */
  directionAt(n: number): AirVec {
    if (n < this.n) { this.n = -1; }
    while (this.n < n) {
      const next = this.n + 1, r = this.fork(next);
      this.angle = next === 0 ? r.next() * Math.PI * 2 : this.angle + r.range(WIND_TURN_MIN, Math.PI * 2 - WIND_TURN_MIN);
      this.n = next;
    }
    this.dir.x = Math.cos(this.angle); this.dir.z = Math.sin(this.angle);
    return { x: this.dir.x, z: this.dir.z };
  }

  /** The direction now. */
  get direction(): AirVec { return this.directionAt(this.period); }

  /** Whether the wind blows at a feet height. */
  blowsAt(y: number): boolean { return y >= this.from; }

  at(q: AirQuery): AirVec | null {
    if (!this.blowsAt(q.y) || !(q.control > 0)) return null;
    const d = this.direction, f = WIND_FACTOR * q.control;
    return { x: d.x * f, z: d.z * f };
  }
}
