// The ending of illumination (issue #351; built: docs/design/built/levels/totality/ILLUMINATION.md). Once the five
// guardians are won and the player stands on the last checkpoint, that platform rises and carries the player into
// the Sun; the screen whitens in steps until everything is light; then the card is due. Every timing lives in
// ASCENSION. Pure: time comes from update(dt), never from the seed or the clock.

import type { Place, TotalityPlan, Vec3 } from '../types';
import { footprint } from './chain';

/** The ending's timings and distances, the only place they are written (seconds, blocks). */
export const ASCENSION = {
  /** Seconds the last platform takes to rise into the Sun. */
  RISE_S: 8,
  /** Blocks the platform rises above the Sun's centre while it glides in. */
  RISE_HEIGHT: 12,
  /** Where the rise ends, as a share of the Sun's radius from its centre toward the platform. */
  INTO_SUN: 0.4,
  /** The screen whitens in this many steps, spread evenly over the rise. */
  LIGHT_STEPS: 6,
  /** Seconds each step eases in (the overlay's transition): slow, far under the 3 Hz rule. */
  STEP_EASE_S: 0.8,
  /** Seconds of full light before the card. */
  HOLD_S: 1.5,
  /** Celestial bells: strikes and the seconds between them, from the card on. */
  BELLS: 8,
  BELL_EVERY_S: 0.6,
} as const;

/** The card is due this long after the rise began: the light is full, then held. */
export const CARD_AT = ASCENSION.RISE_S + ASCENSION.HOLD_S;

/** How far (blocks) the feet may be from the checkpoint's top and still stand on it (as the threshold reads it). */
const STAND = 0.5;

export type AscensionPhase = 'waiting' | 'rising' | 'light' | 'card';

/** The screen's light at `t` seconds after the rise began: 0, then LIGHT_STEPS even steps, 1 from the end of the rise. */
export function lightAt(t: number): number {
  if (t < 0) return 0;
  const step = ASCENSION.RISE_S / ASCENSION.LIGHT_STEPS;
  return Math.min(ASCENSION.LIGHT_STEPS, Math.floor(t / step) + 1) / ASCENSION.LIGHT_STEPS;
}

/** The seconds after the card at which each bell strikes. */
export function bellTimes(): number[] {
  return Array.from({ length: ASCENSION.BELLS }, (_, i) => i * ASCENSION.BELL_EVERY_S);
}

/** The ride: from the last checkpoint's top centre to a point inside the Sun, above its centre, toward the platform. */
export function ridePath(last: Place, sun: TotalityPlan['sun']): { from: Vec3; to: Vec3 } {
  const f = footprint(last);
  const from = { x: (f.x0 + f.x1) / 2, y: last.y, z: (f.z0 + f.z1) / 2 };
  const dx = from.x - sun.x, dz = from.z - sun.z, l = Math.hypot(dx, dz) || 1;
  const k = sun.r * ASCENSION.INTO_SUN;
  return { from, to: { x: sun.x + dx / l * k, y: sun.y + ASCENSION.RISE_HEIGHT, z: sun.z + dz / l * k } };
}

/** The feet stand on the last checkpoint's top. */
export function onLast(last: Place, b: { x: number; y: number; z: number; onGround: boolean }): boolean {
  const f = footprint(last);
  return b.onGround && Math.abs(b.y - last.y) <= STAND && b.x >= f.x0 && b.x < f.x1 && b.z >= f.z0 && b.z < f.z1;
}

export class Ascension {
  /** Seconds since the rise began, or -1 while waiting. */
  private t = -1;
  private cardTaken = false;
  readonly from: Vec3;
  readonly to: Vec3;

  constructor(readonly last: Place, sun: TotalityPlan['sun']) {
    ({ from: this.from, to: this.to } = ridePath(last, sun));
  }

  get started(): boolean { return this.t >= 0; }
  get time(): number { return this.t; }

  get phase(): AscensionPhase {
    if (this.t < 0) return 'waiting';
    if (this.t < ASCENSION.RISE_S) return 'rising';
    return this.t < CARD_AT ? 'light' : 'card';
  }

  /** The screen's light now (0 while waiting). */
  get light(): number { return lightAt(this.t); }

  /** Begins the rise once, only when the five guardians are won and the feet stand on the last checkpoint. */
  tryBegin(fiveWon: boolean, standing: boolean): boolean {
    if (this.t >= 0 || !fiveWon || !standing) return false;
    this.t = 0;
    return true;
  }

  update(dt: number) {
    if (this.t >= 0) this.t += Math.max(0, dt);
  }

  /** The platform's top centre now: smoothstep from the checkpoint into the Sun, then held there. */
  platformAt(): Vec3 {
    const u = Math.min(1, Math.max(0, this.t / ASCENSION.RISE_S)), e = u * u * (3 - 2 * u);
    return {
      x: this.from.x + (this.to.x - this.from.x) * e,
      y: this.from.y + (this.to.y - this.from.y) * e,
      z: this.from.z + (this.to.z - this.from.z) * e,
    };
  }

  /** True once, on the first frame the card is due. */
  takeCard(): boolean {
    if (this.cardTaken || this.phase !== 'card') return false;
    this.cardTaken = true;
    return true;
  }
}
