// Fall recovery in Totality (docs/architecture/SKY.md §4). The last checkpoint platform the player stood on is
// remembered. A fall that crosses the line CATCH blocks below it is caught by an updraft of pale motes that carries
// the player back onto it in CARRY seconds (input held; gravity waits while the body is carried). The cost of the fall
// is the height lost above the checkpoint, never health.
//
// The carry runs in two legs, so the body never rises into the checkpoint's own slab from below: first up to a point
// just beside the platform's edge and above its top, then in onto its centre. Only a fall is caught: the line must be
// crossed downward in one ordinary frame while airborne, so arriving far below (back from the underground, at the deck)
// never carries the player up to Totality.

import type { Place, SkyHost, UpdraftApi, Vec3 } from '../types';

/** Blocks below the last checkpoint where the updraft catches the player. */
export const CATCH = 20;
/** Seconds the carry back takes. */
export const CARRY = 1.6;
/** Share of CARRY spent on the rise to the platform's edge; the rest moves the body in onto its centre. */
export const RISE_SHARE = 0.75;
/** Blocks beside the platform's edge where the rise ends, and blocks above its top. */
const SIDE = 2, ABOVE = 2;
/** A drop larger than this in one frame is a teleport, not a fall (a fall moves at most 40 b/s). */
const MAX_STEP = 8;
/** Tolerance for feet that stand a float's breath off the platform's top. */
const EPS = 0.05;
/** Seconds between two puffs of motes along the carry. */
const MOTES_EVERY = 0.12;

export class Updraft implements UpdraftApi {
  private last: Place | null = null;
  /** Seconds left in the carry, or 0. */
  private left = 0;
  private leg: 0 | 1 | 2 = 0;
  private prevY: number | null = null;
  private motes = 0;
  private told = false;

  constructor(private readonly host: SkyHost, private readonly checkpoints: readonly Place[]) {}

  get checkpoint(): Place | null { return this.last; }
  get carrying(): boolean { return this.left > 0; }

  update(dt: number) {
    const b = this.host.player().body;
    if (this.left > 0) {
      this.carryStep(dt);
      this.prevY = b.y;
      return;
    }
    const on = b.onGround ? this.checkpointUnder(b.x, b.y, b.z) : null;
    if (on) this.last = on;
    const cp = this.last, prev = this.prevY;
    this.prevY = b.y;
    if (!cp || b.onGround || prev === null) return;
    const line = cp.y - CATCH;
    if (prev >= line && b.y < line && prev - b.y <= MAX_STEP) this.catch(cp);
  }

  /** The platform's top centre, in world coordinates (the feet land there). */
  static centre(p: Place): Vec3 {
    const x0 = p.x - Math.floor((p.w - 1) / 2), z0 = p.z - Math.floor((p.d - 1) / 2);
    return { x: x0 + p.w / 2, y: p.y + EPS, z: z0 + p.d / 2 };
  }

  /** The checkpoint whose top the feet stand on, if any. */
  private checkpointUnder(x: number, y: number, z: number): Place | null {
    for (const p of this.checkpoints) {
      if (Math.abs(y - p.y) > EPS) continue;
      const x0 = p.x - Math.floor((p.w - 1) / 2), z0 = p.z - Math.floor((p.d - 1) / 2);
      if (x >= x0 && x < x0 + p.w && z >= z0 && z < z0 + p.d) return p;
    }
    return null;
  }

  private catch(cp: Place) {
    const player = this.host.player(), b = player.body;
    this.left = CARRY;
    this.leg = 1;
    this.motes = MOTES_EVERY;
    player.carry(this.edgePoint(cp, b.x, b.z), CARRY * RISE_SHARE);
    this.host.fx('updraft', b.x, b.y, b.z, 24);
    this.host.cue('core.updraft', b.x, b.y, b.z);
    if (!this.told) { this.told = true; this.host.toast('toast.updraft'); }
  }

  private carryStep(dt: number) {
    const cp = this.last!, player = this.host.player(), b = player.body;
    this.left = Math.max(0, this.left - dt);
    this.motes -= dt;
    if (this.motes <= 0) { this.motes = MOTES_EVERY; this.host.fx('updraft', b.x, b.y, b.z, 6); }
    if (this.leg === 1 && this.left <= CARRY * (1 - RISE_SHARE) + 1e-9) {
      this.leg = 2;
      player.carry(Updraft.centre(cp), Math.max(this.left, 1e-3));
    }
    if (this.left === 0) {
      this.leg = 0;
      this.host.fx('updraft', b.x, b.y, b.z, 12);
    }
  }

  /** Beside the platform, on the side of the body, SIDE blocks past its corner and ABOVE blocks over its top. */
  private edgePoint(p: Place, x: number, z: number): Vec3 {
    const c = Updraft.centre(p);
    let dx = x - c.x, dz = z - c.z;
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) { dx = 1; dz = 0; } else { dx /= len; dz /= len; }
    const reach = Math.max(p.w, p.d) / 2 * Math.SQRT2 + SIDE;
    return { x: c.x + dx * reach, y: p.y + ABOVE, z: c.z + dz * reach };
  }
}
