// The Sun's entrance (docs/architecture/SKY.md §8; built: docs/design/built/levels/totality/THRESHOLD.md). The last
// jump of the chain, taken from the last checkpoint, that carries the player's body into the Sun's volume calls
// the host's enterUnity once. Unity is issue #95 and is pending: the host records the entrance and nothing else
// (owner, 2026-11-05). No refusal exists any more: the Sun is entered, not opened.

import type { Place, SkyHost, ThresholdApi, TotalityPlan } from '../types';
import { footprint } from './chain';

/** The Sun's hum comes back every HUM_EVERY seconds while the player is within HUM_RANGE blocks of its surface. */
const HUM_EVERY = 2.4;
const HUM_RANGE = 10;
/** How far (blocks) the feet may be from the checkpoint's top and still count as standing on it. */
const STAND = 0.5;

export class Threshold implements ThresholdApi {
  private done = false;
  /** On the ground of the last checkpoint at the last frame. */
  private standing = false;
  /** Jumped off the last checkpoint and still in the air: only then may the Sun be entered. */
  private armed = false;
  private hum = 0;
  private readonly last: Place;
  private readonly sun: TotalityPlan['sun'];

  constructor(private readonly host: SkyHost, plan: TotalityPlan) {
    this.last = plan.platforms[plan.platforms.length - 1];
    this.sun = plan.sun;
  }

  /** True once the player's body has entered the Sun from the last checkpoint's jump. */
  get entered(): boolean {
    return this.done;
  }

  update(dt: number) {
    this.hum = Math.max(0, this.hum - dt);
    const b = this.host.player().body;
    const s = this.sun;
    const dx = b.x - s.x, dy = b.y + b.h / 2 - s.y, dz = b.z - s.z;
    const d = Math.hypot(dx, dy, dz);
    if (d - s.r <= HUM_RANGE && this.hum <= 0) {
      this.host.cue('totality.hum', s.x, s.y, s.z);
      this.hum = HUM_EVERY;
    }
    // a jump begun on the last checkpoint arms the entrance; walking off it, or standing on any other ground, does not
    if (b.onGround) {
      this.armed = false;
      const f = footprint(this.last);
      this.standing = Math.abs(b.y - this.last.y) <= STAND && b.x >= f.x0 && b.x < f.x1 && b.z >= f.z0 && b.z < f.z1;
    } else {
      if (this.standing && b.vy > 0) this.armed = true;
      this.standing = false;
    }
    if (!this.done && this.armed && d <= s.r) {
      this.done = true;
      this.host.enterUnity();
    }
  }
}
