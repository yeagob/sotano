// Opening holes: chosen original cells crack, then turn to transient air for a while, then return (docs/architecture/
// SKY.md §6). The telegraph is the crack itself (the crack overlay through the world's `damaged` map) and a low
// grumble; a positive shot at a cracked cell closes it before it opens. The effect opens what is still cracked
// through SkyEffects (never a placed or protected cell, never a loose cube), and every cell it opened is back
// when it ends. Nothing here damages.

import { AIR } from '../../content/materials';
import { hazardOwner } from './runner';
import { centreOf, hitsCell } from './effects';
import type { Effect, Hindrance, HindranceCtx, OpeningHolesParams, PositiveHit, Telegraph, Vec3 } from '../types';

/** The share of a block's hit points the crack shows (the overlay reads it as deep cracks). */
const CRACK = 0.34;

/** Cells a positive shot closed during the telegraph, by the start's params. */
const CLOSED = new WeakMap<OpeningHolesParams, Set<number>>();

class Cracks implements Telegraph {
  readonly at: Vec3;
  /** The cells cracked now, and what their damage was before the crack. */
  readonly cracked = new Map<number, number | undefined>();

  constructor(private ctx: HindranceCtx, readonly p: OpeningHolesParams) {
    const w = ctx.host.world();
    for (const i of p.cells) {
      if (!ctx.effects.mayChange(i) || w.getAt(i) === AIR) continue;
      const [x, y, z] = w.coords(i);
      this.cracked.set(i, w.damaged.get(i));
      w.damaged.set(i, Math.max(1, Math.ceil(w.hp(x, y, z) * CRACK)));
      w.markDirty(x, y, z);
    }
    this.at = centreOf(ctx.host, [...this.cracked.keys()]);
    ctx.host.cue('core.grumble', this.at.x, this.at.y, this.at.z);
    for (const i of this.cracked.keys()) {
      const [x, y, z] = w.coords(i);
      ctx.host.fx('motes', x + 0.5, y + 1, z + 0.5, 2);
    }
  }

  update() {}

  /** Closes one cracked cell: its damage goes back to what it was. */
  close(i: number, answered = true) {
    if (!this.cracked.has(i)) return;
    const w = this.ctx.host.world();
    const was = this.cracked.get(i);
    if (was === undefined) w.damaged.delete(i); else w.damaged.set(i, was);
    const [x, y, z] = w.coords(i);
    w.markDirty(x, y, z);
    this.cracked.delete(i);
    if (answered) this.ctx.host.fx('gold', x + 0.5, y + 1, z + 0.5);
  }

  end() {
    for (const i of [...this.cracked.keys()]) this.close(i, false);
  }
}

class Holes implements Effect {
  readonly at: Vec3;
  /** The cells it opened. */
  readonly opened: number[];
  private t = 0;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, private p: OpeningHolesParams) {
    const closed = CLOSED.get(p);
    CLOSED.delete(p);
    const w = ctx.host.world();
    const open = p.cells.filter(i => !closed?.has(i) && w.getAt(i) !== AIR);
    this.opened = ctx.effects.transient(open, AIR, p.seconds, this.owner);
    this.at = centreOf(ctx.host, this.opened);
  }

  update(dt: number): boolean {
    this.t += dt;
    return this.t < this.p.seconds;
  }

  end() {
    this.ctx.effects.restore(this.owner);
    if (this.opened.length) this.ctx.host.cue('core.regrow', this.at.x, this.at.y, this.at.z);
  }
}

export const openingHoles: Hindrance<OpeningHolesParams> = {
  id: 'opening-holes',
  telegraph: (ctx, p) => new Cracks(ctx, p),
  effect: (ctx, p) => new Holes(ctx, p),
  answer: (ctx, e, hit: PositiveHit) => {
    if (!(e instanceof Cracks)) return false;
    for (const i of e.cracked.keys()) {
      if (!hitsCell(ctx.host, hit, i)) continue;
      e.close(i);
      let s = CLOSED.get(e.p);
      if (!s) { s = new Set(); CLOSED.set(e.p, s); }
      s.add(i);
      return true;
    }
    return false;
  },
};
