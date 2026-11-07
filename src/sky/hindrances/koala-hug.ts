// Koala hug: a koala minion swings by one arm, then drops and hugs the player under it (KOALA.md B5, rule 3 and 4).
// The telegraph is the swing (a squeak, motes from the branch it hangs from); the effect, if the player is still
// under it on solid ground, is a ride: walking at 40% and jumps at half height for its seconds, until three jumps
// shake it off or `loose()` says the minion let go (a positive intention at it, an ally's clear). A ride never
// starts over a drop that was not shown: with no solid cell under the player's feet it does not start at all.
// The same ride carries the deity's joey (koala-lob). Nothing here damages, drains or captures.

import type { Effect, Hindrance, HindranceCtx, KoalaHugParams, SkyHost, Telegraph, Vec3 } from '../types';

/** Walking pace while hugged (B5 rule 4: 40%). */
export const HUG_SLOW = 0.4;
/** Jumps that shake a hug off (B5 rule 4, B3b Joey ride). */
export const SHAKE_JUMPS = 3;
/** A vertical speed above this, the tick after the feet left the ground, is a jump. */
const JUMP_VY = 2;
/** Half height: height goes with the square of the take-off speed. */
const HALF_JUMP = Math.SQRT1_2;
/** The slow is refreshed each tick, so it ends the moment the ride does. */
const SLOW_REFRESH = 0.15;
/** How far to the side, and how far below, a dropping koala still lands on the player. */
const REACH_SIDE = 1;
const REACH_DOWN = 5;
const SWING_MOTES = 0.2;

/** The first hug of a run says how to shake it off (one host per run). */
const HINTED = new WeakSet<SkyHost>();
/** Every ride that holds the player now (the joey is never chosen while a minion hugs, and back). */
const RIDES = new Set<Ride>();
/** True while a koala (a minion or the joey) rides the player. */
export const ridden = (): boolean => RIDES.size > 0;

/** A koala on the player's back: half-height jumps, and a slow walk when `slow`. Three jumps shake it off. */
export class Ride {
  jumps = 0;
  private t = 0;
  private ground: boolean;

  constructor(private ctx: HindranceCtx, private seconds: number, private slow: boolean, private loose: () => boolean = () => false) {
    this.ground = ctx.host.player().body.onGround;
    RIDES.add(this);
    const b = ctx.host.player().body;
    ctx.host.cue('koala.grab', b.x, b.y + b.h, b.z);
  }

  /** False once it has let go. */
  update(dt: number): boolean {
    if (!RIDES.has(this)) return false;
    if (this.loose()) return this.off();
    this.t += dt;
    if (this.t >= this.seconds) return this.off();
    const b = this.ctx.host.player().body;
    if (this.ground && !b.onGround && b.vy > JUMP_VY) {
      this.jumps++;
      this.ctx.effects.push(0, -b.vy * (1 - HALF_JUMP), 0);
      if (this.jumps >= SHAKE_JUMPS) return this.off();
    }
    this.ground = b.onGround;
    if (this.slow) this.ctx.effects.slow(HUG_SLOW, SLOW_REFRESH);
    return true;
  }

  off(): false {
    if (RIDES.delete(this)) {
      const b = this.ctx.host.player().body;
      this.ctx.host.fx('puff', b.x, b.y + b.h * 0.7, b.z, 4);
    }
    return false;
  }
}

/** Whether a koala dropping from `from` lands on the player: under it within a block to the side, on solid ground. */
export function under(ctx: HindranceCtx, from: Vec3): boolean {
  const b = ctx.host.player().body;
  if (Math.hypot(b.x - from.x, b.z - from.z) > REACH_SIDE + b.hw) return false;
  const drop = from.y - b.y;
  if (drop < -1 || drop > REACH_DOWN) return false;
  return ctx.host.world().solid(Math.floor(b.x), Math.floor(b.y - 0.05), Math.floor(b.z));
}

class Swing implements Telegraph {
  readonly at: Vec3;
  private t = 0;

  constructor(private ctx: HindranceCtx, p: KoalaHugParams) {
    this.at = p.from;
    ctx.host.cue('koala.squeak', p.from.x, p.from.y, p.from.z);
  }

  update(dt: number) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t += SWING_MOTES;
    this.ctx.host.fx('motes', this.at.x, this.at.y, this.at.z, 1);
  }

  end() {}
}

class Hug implements Effect {
  readonly at: Vec3;
  readonly ride: Ride | null = null;

  constructor(ctx: HindranceCtx, p: KoalaHugParams) {
    this.at = p.from;
    if (!p.loose() && under(ctx, p.from)) {
      this.ride = new Ride(ctx, p.seconds, true, p.loose);
      if (!HINTED.has(ctx.host)) { HINTED.add(ctx.host); ctx.host.toast('toast.skyKoalaHug'); }
    }
  }

  update(dt: number): boolean {
    return this.ride ? this.ride.update(dt) : false;
  }

  end() { this.ride?.off(); }
}

export const koalaHug: Hindrance<KoalaHugParams> = {
  id: 'koala-hug',
  telegraph: (ctx, p) => new Swing(ctx, p),
  effect: (ctx, p) => new Hug(ctx, p),
};
