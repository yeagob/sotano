// Law 3.2, player blocks are the exception (docs/architecture/SKY.md §4, docs/design/not-built/sky/README.md §3.2).
// A block the player placed is not original: no damage touches it (a bomb, a blast, contact or a
// hindrance does nothing), and only a positive intention can take it away, for good, with no cube back.
// Also: a block broken in the sky gives no loose cube (law 3.1 and the positive removal above).

import { AIR } from '../../content/materials';
import type { GameBus } from '../../game/events';
import { ExceptionKind, type OwnershipApi, type PositiveHit, type SkyHost, type SkyWorldApi } from '../types';

export class Ownership implements OwnershipApi {
  constructor(private readonly world: SkyWorldApi, private readonly host: SkyHost) {}

  install(bus: GameBus) {
    // Cancel band: every damage to a placed cell is refused, whatever its source.
    bus.on('blockDamage', {
      priority: 150, source: 'sky', id: 'placed',
      fn: e => { if (this.placedAt(e.x, e.y, e.z)) e.cancel(); },
    });
    // Modify band: a block broken in the sky drops no loose cube.
    bus.on('blockBreak', {
      priority: 50, source: 'sky', id: 'no-cube',
      fn: e => { e.spawnDebris = false; },
    });
    // Cancel band: a placed block is not broken by any other route either (a fire, the lab's break).
    bus.on('blockBreak', {
      priority: 150, source: 'sky', id: 'placed',
      fn: e => { if (this.placedAt(e.x, e.y, e.z)) e.cancel(); },
    });
  }

  /** Law 3.2: a positive hit on a placed cell removes it for good. True when it did. */
  positiveHit(hit: PositiveHit): boolean {
    if (hit.cell < 0 || this.world.kindAt(hit.cell) !== ExceptionKind.Placed) return false;
    const [x, y, z] = this.world.coords(hit.cell);
    this.world.set(x, y, z, AIR);
    this.host.fx('gold', x + 0.5, y + 0.5, z + 0.5);
    return true;
  }

  private placedAt(x: number, y: number, z: number): boolean {
    return this.world.inside(x, y, z) && this.world.kindAt(this.world.idx(x, y, z)) === ExceptionKind.Placed;
  }
}
