// RealmGate: the passages between the worlds, run as a fade (docs/architecture/SKY.md §2.4). Stub (K0): R1 builds it.

import type { Pos, RealmGateApi, RealmGateHost, RealmKind, SkyBounds, Travel } from './types';

/** Realm y below which falling off the arrival deck goes down to the crown. */
export const SKY_FLOOR_OUT = 4;

export class RealmGate implements RealmGateApi {
  /** Pure: which travel, if any, the player's position asks for this frame. */
  static check(_realm: RealmKind, _pos: Pos, _pad: { up: boolean } | null, _sky: SkyBounds): Travel | null { return null; }
  readonly busy = false;
  constructor(_host: RealmGateHost) {}
  start(_t: Travel) {}
  update(_dt: number) {}
}
