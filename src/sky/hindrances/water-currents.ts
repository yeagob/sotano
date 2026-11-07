// Water currents: timed source water down a channel bed (docs/architecture/SKY.md §6, M5). The telegraph is a
// gathering at the channel's head (motes running down the bed, a rising sound); the effect fills the bed with
// source water it owns, from the head down to the first cell that is not free (a placed block is a dam: nothing
// below it fills), and feet in the water are pushed along the bed. A positive shot at the head stops the current
// for 3 s (the water dries and comes back after); the run still ends on time, and every cell it filled is dry
// when it ends. No drowning, no damage: the sky's no-harm rule holds the rest.

import { AIR } from '../../content/materials';
import { hazardOwner } from './runner';
import type { Effect, Hindrance, HindranceCtx, PositiveHit, Telegraph, Vec3, WaterCurrentsParams } from '../types';

/** Seconds a positive shot at the head stops the current. */
export const STOP = 3;
/** A positive shot counts as the answer when it lands this close to the head. */
export const ANSWER_RANGE = 1.5;
/** Seconds between the warning's motes down the bed. */
const RUN_EVERY = 0.2;

/** Runs a positive shot stopped during the telegraph, by the start's params. */
const STOPPED = new WeakSet<WaterCurrentsParams>();

const headOf = (p: WaterCurrentsParams): Vec3 => ({ x: p.channel.head[0] + 0.5, y: p.channel.head[1] + 0.5, z: p.channel.head[2] + 0.5 });

class Gather implements Telegraph {
  readonly at: Vec3;
  private t = 0;
  private k = 0;

  constructor(private ctx: HindranceCtx, readonly p: WaterCurrentsParams) {
    this.at = headOf(p);
    ctx.host.cue('core.updraft', this.at.x, this.at.y, this.at.z);
  }

  update(dt: number) {
    this.t -= dt;
    if (this.t > 0 || this.p.channel.bed.length === 0) return;
    this.t += RUN_EVERY;
    const [x, y, z] = this.p.channel.bed[this.k++ % this.p.channel.bed.length];
    this.ctx.host.fx('motes', x + 0.5, y + 0.3, z + 0.5, 2);
  }

  end() {}
}

class Current implements Effect {
  readonly at: Vec3;
  /** The cells it holds water in now, bed order. */
  filled: number[] = [];
  private t = 0;
  private stopLeft: number;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, readonly p: WaterCurrentsParams) {
    this.at = headOf(p);
    this.stopLeft = STOPPED.delete(p) ? STOP : 0;
    if (this.stopLeft <= 0) this.fill();
  }

  /** The bed's free cells from the head down, up to the first that is not (a dam or the bed's own end). */
  private stretch(): number[] {
    const w = this.ctx.host.world();
    const out: number[] = [];
    for (const [x, y, z] of this.p.channel.bed) {
      const i = w.idx(x, y, z);
      if (w.get(x, y, z) !== AIR || !this.ctx.effects.mayChange(i)) break;
      out.push(i);
    }
    return out;
  }

  private fill() {
    this.filled = this.ctx.effects.water(this.stretch(), this.owner);
  }

  /** A positive shot at the head: the water dries and the current waits `STOP` seconds. */
  stop() {
    this.ctx.effects.dry(this.owner);
    this.filled = [];
    this.stopLeft = STOP;
    this.ctx.host.fx('gold', this.at.x, this.at.y, this.at.z);
  }

  update(dt: number): boolean {
    this.t += dt;
    if (this.t >= this.p.seconds) return false;
    if (this.stopLeft > 0) {
      this.stopLeft -= dt;
      if (this.stopLeft <= 0) this.fill();
      return true;
    }
    this.carry(dt);
    return true;
  }

  /** Feet in the water are pushed along the bed, toward the next cell down. */
  private carry(dt: number) {
    const b = this.ctx.host.player().body, w = this.ctx.host.world();
    const feet = w.idx(Math.floor(b.x), Math.floor(b.y + 0.1), Math.floor(b.z));
    const k = this.filled.indexOf(feet);
    if (k < 0) return;
    const bed = this.p.channel.bed;
    const a = bed[Math.min(k, bed.length - 2)], c = bed[Math.min(k + 1, bed.length - 1)];
    if (!a || !c) return;
    const dx = c[0] - a[0], dz = c[2] - a[2], d = Math.hypot(dx, dz);
    if (d === 0) return;
    const f = this.p.push * dt;
    this.ctx.effects.push((dx / d) * f, 0, (dz / d) * f);
  }

  end() {
    this.ctx.effects.dry(this.owner);
    this.filled = [];
  }
}

export const waterCurrents: Hindrance<WaterCurrentsParams> = {
  id: 'water-currents',
  telegraph: (ctx, p) => new Gather(ctx, p),
  effect: (ctx, p) => new Current(ctx, p),
  answer: (_ctx, e, hit: PositiveHit) => {
    const p = e instanceof Gather || e instanceof Current ? e.p : null;
    if (!p) return false;
    const h = headOf(p);
    if (Math.hypot(hit.x - h.x, hit.y - h.y, hit.z - h.z) > ANSWER_RANGE) return false;
    if (e instanceof Current) e.stop(); else STOPPED.add(p);
    return true;
  },
};
