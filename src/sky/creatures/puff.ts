// Law 3.3: a touch that is not positive goes out in a small puff (docs/architecture/SKY.md §4). The first puff
// of a run shows toast.skyPuff once. The key is written by R1 in the core catalog (SKY.md §12); until it is there
// the cast keeps the build green, and it is removed when R1 merges.

import type { MessageKey } from '../../i18n/locales/en';
import type { PuffApi, SkyHost, Vec3 } from '../types';

const FIRST_PUFF = 'toast.skyPuff' as string as MessageKey;

export class Puff implements PuffApi {
  private seen = false;

  constructor(private host: SkyHost) {}

  get shown(): boolean { return this.seen; }

  /** One puff: cloud motes and a soft "pff". Nothing else changes. */
  at(p: Vec3) {
    this.host.fx('puff', p.x, p.y, p.z, 6);
    this.host.cue('core.puff', p.x, p.y, p.z);
    if (!this.seen) {
      this.seen = true;
      this.host.toast(FIRST_PUFF);
    }
  }
}
