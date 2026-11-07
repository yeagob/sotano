// Law 3.8, the only way up is inside the tree (docs/architecture/SKY.md §4, docs/design/not-built/sky/README.md §3.8).
// A player standing on a placed tower (law 3.9) outside the trunk's outer radius, at the tree's heights, is watched:
// the guardian of the floor at that height (the panda at and below the first floor, the horse above the last) is asked
// once to knock the tower down. The knock itself (its warning, the trip out, the cubes falling) is the guardian's
// tower routine behind `knock`. Asked again only after REWATCH seconds on the same outside tower (the guardian may have
// been busy), or at once for a new tower after the player has stepped off. Totality, above the roof, is not watched:
// there is no tree there to climb outside of.

import { SKY_AXIS } from '../floors/tree';
import type { FloorIndex, OutsideWatchApi, SkyHost, SkyTreePlan, Tower } from '../types';
import { towerUnder } from './tower';

/** Seconds on the same outside tower before the guardian is asked again. */
export const REWATCH = 4;

export class OutsideWatch implements OutsideWatchApi {
  /** Game time of the last ask for the tower the player stands on now, or null when they stand on no outside tower. */
  private askedAt: number | null = null;
  /** The top cell of the tower last asked about. */
  private top = -1;
  /** The deck's height: below it the trunk is not built yet, and everything is outside. */
  private readonly deck: number;

  constructor(private readonly host: SkyHost, private readonly tree: SkyTreePlan,
    private readonly knock: (tower: Tower, floor: FloorIndex) => void) {
    this.deck = Math.min(...tree.halls.map(h => h.y0));
  }

  update(_dt: number) {
    const b = this.host.player().body;
    const tower = towerUnder(this.host.world(), b);
    if (!tower || !this.outside(b.x, b.y, b.z)) { this.askedAt = null; return; }
    const now = this.host.time(), top = tower.cells[0];
    if (this.askedAt !== null && top === this.top && now - this.askedAt < REWATCH) return;
    this.askedAt = now;
    this.top = top;
    this.knock(tower, this.floorAt(b.y));
  }

  /** Beyond the trunk's outer radius at a height the trunk spans (anything below the deck is outside; above the roof is not watched). */
  outside(x: number, y: number, z: number): boolean {
    const r = this.tree.trunkRadius(y);
    if (r <= 0 && y >= this.deck) return false;
    return Math.hypot(x - SKY_AXIS.x, z - SKY_AXIS.z) > r;
  }

  /** The guardian floor at a height: the last hall whose ground is at or below it, the first floor below them all. */
  floorAt(y: number): FloorIndex {
    let floor: FloorIndex = 1;
    for (const h of this.tree.halls) if (h.floor !== 0 && y >= h.y0) floor = h.floor;
    return floor;
  }
}
