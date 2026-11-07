// Law 3.1, nothing stays broken (docs/architecture/SKY.md §4, docs/design/not-built/sky/README.md §3.1).
// A broken original block comes back after REGROW seconds. It shimmers for its last SHIMMER seconds;
// at the end it returns only when the cell is free (no player, sky creature or loose cube in it, and
// no block the player placed). Otherwise it checks again every REGROW_RETRY seconds.
// Pure: time comes from `update(dt)`, effects go through the host.

import type { CellTest, RegrowthApi, SkyHost, SkyWorldApi } from '../types';
import { ExceptionKind } from '../types';

/** Seconds a broken original block takes to return; it shimmers for the last second. */
export const REGROW = 5;
export const SHIMMER = 1;
/** Seconds between checks while the cell is occupied. */
export const REGROW_RETRY = 0.25;

interface Gap {
  x: number; y: number; z: number;
  /** Clock time of the next free check. */
  next: number;
  /** Clock time the shimmer starts. */
  shimmerAt: number;
  shimmered: boolean;
}

export class Regrowth implements RegrowthApi {
  private clock = 0;
  private readonly gaps = new Map<number, Gap>();
  /** The one function the world calls; kept so dispose can tell whether it is still ours. */
  private readonly onBrokenHook: (i: number) => void;

  constructor(private readonly world: SkyWorldApi, private readonly host: SkyHost, private readonly occupied: CellTest) {
    this.onBrokenHook = i => this.broke(i);
    world.onBroken = this.onBrokenHook;
  }

  /** Cells waiting to return. */
  get pending() { return this.gaps.size; }

  update(dt: number) {
    this.clock += dt;
    for (const [i, g] of this.gaps) {
      if (!g.shimmered && this.clock >= g.shimmerAt) {
        g.shimmered = true;
        this.host.fx('shimmer', g.x + 0.5, g.y + 0.5, g.z + 0.5);
        this.host.cue('core.shimmer', g.x + 0.5, g.y + 0.5, g.z + 0.5);
      }
      if (this.clock < g.next) continue;
      if (this.free(i, g)) {
        this.world.restore(i);
        this.gaps.delete(i);
        this.host.cue('core.regrow', g.x + 0.5, g.y + 0.5, g.z + 0.5);
      } else {
        g.next = this.clock + REGROW_RETRY;
      }
    }
  }

  dispose() {
    if (this.world.onBroken === this.onBrokenHook) this.world.onBroken = null;
    this.gaps.clear();
  }

  /** An original cell left its formula value. A new departure restarts its timer. */
  private broke(i: number) {
    const [x, y, z] = this.world.coords(i);
    const due = this.clock + REGROW;
    this.gaps.set(i, { x, y, z, next: due, shimmerAt: due - SHIMMER, shimmered: false });
  }

  private free(i: number, g: Gap): boolean {
    return this.world.kindAt(i) !== ExceptionKind.Placed && !this.occupied(g.x, g.y, g.z);
  }
}
