// The closed threshold of the Sun (docs/architecture/SKY.md §8): the last checkpoint stands before a sealed
// gate of light (the unbreakable sun-seal). Touching it shows toast.sunClosed and a soft push back. Nothing
// opens: the gate is never changed (owner decision 2; Unity is issue #95, not built).

import type { SkyHost, ThresholdApi, TotalityPlan } from '../types';

/** Seconds before the refusal can come again. */
const COOL = 1.5;
/** The Sun's hum comes back every HUM_EVERY seconds while the player is within HUM_RANGE blocks. */
const HUM_EVERY = 2.4;
const HUM_RANGE = 10;
/** The push back, blocks per second, and its upward share. */
const PUSH = 4;
const LIFT = 2;
/** Height of the gate (the wall of the plan is six blocks). */
const GATE_HEIGHT = 6;

export class Threshold implements ThresholdApi {
  private hit = false;
  private near = false;
  private cool = 0;
  private hum = 0;
  private readonly at: TotalityPlan['threshold'];

  constructor(private readonly host: SkyHost, plan: TotalityPlan) {
    this.at = plan.threshold;
  }

  /** True once the player has touched the gate. */
  get touched(): boolean {
    return this.hit;
  }

  update(dt: number) {
    this.cool = Math.max(0, this.cool - dt);
    this.hum = Math.max(0, this.hum - dt);
    const b = this.host.player().body;
    const dx = b.x - this.at.x, dz = b.z - this.at.z;
    const d = Math.hypot(dx, dz);
    if (d <= HUM_RANGE && this.hum <= 0) {
      this.host.cue('totality.hum', this.at.x, this.at.y, this.at.z);
      this.hum = HUM_EVERY;
    }
    const inHeight = b.y + b.h >= this.at.y && b.y <= this.at.y + GATE_HEIGHT;
    const touching = d <= this.at.r + b.hw && inHeight;
    if (touching && !this.near && this.cool <= 0) {
      this.hit = true;
      this.cool = COOL;
      this.host.toast('toast.sunClosed');
      this.host.cue('totality.refuse', this.at.x, this.at.y, this.at.z);
      this.host.fx('bounce', b.x, b.y + 1, b.z);
      // back the way the player came: away from the gate, horizontally, with a small lift (never a drop)
      const nx = d > 0 ? dx / d : -1, nz = d > 0 ? dz / d : 0;
      this.host.player().push(nx * PUSH, LIFT, nz * PUSH);
    }
    this.near = touching;
  }
}
