// Lullaby (KOALA.md B3b, 9): the koala hums, and the branch the player stands on glows soft and sleepy, from its
// far end toward the player. A player still standing on that branch's original wood when the glow reaches the end
// has their spirit drained through the attack's `drain`. The glow covers only the branch's own cells, so a trunk
// knot or a player block is a way off. A positive shot on a glowing cell during the warning breaks the hum: no
// drain. No block changes; nothing here pushes, slows or damages.

import { cellUnderFeet, centreOf, hitsCell } from './effects';
import type { Effect, Hindrance, HindranceCtx, KoalaLullabyParams, PositiveHit, Telegraph, Vec3 } from '../types';

const GLOW_EVERY = 0.2;
const END_SECONDS = 0.5;

/** Runs a positive shot broke, by the start's params. */
const BROKEN = new WeakSet<KoalaLullabyParams>();

/** Whether the player stands on one of the branch's cells now. */
export function onBranch(ctx: HindranceCtx, p: KoalaLullabyParams): boolean {
  return ctx.host.player().body.onGround && p.cells.includes(cellUnderFeet(ctx.host));
}

class Glow implements Telegraph {
  readonly at: Vec3;
  /** The cells, the far end first: the glow walks toward the player. */
  readonly order: number[];
  private t = 0;
  private seconds: number;

  constructor(private ctx: HindranceCtx, readonly p: KoalaLullabyParams, seconds: number) {
    this.seconds = seconds;
    this.at = centreOf(ctx.host, p.cells);
    const b = ctx.host.player().body, w = ctx.host.world();
    const d = (i: number) => { const [x, , z] = w.coords(i); return Math.hypot(x + 0.5 - b.x, z + 0.5 - b.z); };
    this.order = [...p.cells].sort((a, c) => d(c) - d(a) || a - c);
    ctx.host.cue('koala.hum', this.at.x, this.at.y, this.at.z);
  }

  update(dt: number, left: number) {
    if (BROKEN.has(this.p)) return;
    this.t -= dt;
    if (this.t > 0) return;
    this.t += GLOW_EVERY;
    const lit = Math.ceil(this.order.length * (1 - left / this.seconds));
    const w = this.ctx.host.world();
    for (let k = Math.max(0, lit - 3); k < lit && k < this.order.length; k++) {
      const [x, y, z] = w.coords(this.order[k]);
      this.ctx.host.fx('motes', x + 0.5, y + 1.1, z + 0.5, 1);
    }
  }

  end() {}
}

class Hush implements Effect {
  readonly at: Vec3;
  private t = 0;

  constructor(ctx: HindranceCtx, p: KoalaLullabyParams) {
    this.at = centreOf(ctx.host, p.cells);
    if (BROKEN.delete(p)) return;
    if (onBranch(ctx, p)) {
      const b = ctx.host.player().body;
      ctx.host.fx('motes', b.x, b.y + 1, b.z, 8);
      p.drain();
    }
  }

  update(dt: number): boolean {
    this.t += dt;
    return this.t < END_SECONDS;
  }

  end() {}
}

export const koalaLullaby: Hindrance<KoalaLullabyParams> = {
  id: 'koala-lullaby',
  telegraph: (ctx, p, seconds) => new Glow(ctx, p, seconds),
  effect: (ctx, p) => new Hush(ctx, p),
  answer: (ctx, e, hit: PositiveHit) => {
    if (!(e instanceof Glow) || BROKEN.has(e.p)) return false;
    if (!e.p.cells.some(i => hitsCell(ctx.host, hit, i))) return false;
    BROKEN.add(e.p);
    ctx.host.fx('gold', hit.x, hit.y, hit.z);
    return true;
  },
};
