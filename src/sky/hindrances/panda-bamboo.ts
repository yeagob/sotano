// Panda bamboo: air cells that stand as bamboo for a while, then wither (docs/design/not-built/sky/guardians/PANDA.md,
// B3 Bamboo toss and B3b Thicket). The telegraph is the shoots: a bamboo-toned ring on each cell and leaf motes over
// it, with a rustle. The effect grows the cells that are still air into transient bamboo through SkyEffects (never a
// placed or protected cell), one owner per stalk so a positive shot can cut one stalk and leave the rest. A lob
// (`from` set) that meets a solid block on its way stops there and grows nothing. A cell the player's body is in is
// never filled: a stalk that lands on the player gives a soft push instead (`push`). Nothing here damages.

import type { MarkPaint } from '../../enemies/attacks';
import { AIR, MAT } from '../../content/materials';
import { hazardOwner, sketch } from './runner';
import { centreOf, hitsCell } from './effects';
import type { Effect, Hindrance, HindranceCtx, PandaBambooParams, PositiveHit, Telegraph, Vec3 } from '../types';

/** Seconds between the leaf motes over the shoots. */
const LEAF_EVERY = 0.3;
/** The vertical share of a stalk's push. */
const PUSH_UP = 0.45;

/** The bamboo's own tones, darker than the bamboo it grows from so the ring reads on it. */
export const BAMBOO_PAINT: MarkPaint = {
  tell: 'mat.bamboo.dark',
  live: 'mat.bamboo.outline',
  reach: 'mat.bamboo.base',
  motes: ['mat.bamboo.hi', 'mat.skyleaf.base'],
};

/** Stalks (x, z columns) a positive shot cut during the telegraph, by the start's params. */
const CUT = new WeakMap<PandaBambooParams, Set<string>>();
const stalkOf = (ctx: HindranceCtx, i: number): string => {
  const [x, , z] = ctx.host.world().coords(i);
  return `${x},${z}`;
};

/** Whether the player's body overlaps cell `i`. */
function holdsPlayer(ctx: HindranceCtx, i: number): boolean {
  const b = ctx.host.player().body;
  const [x, y, z] = ctx.host.world().coords(i);
  return b.x + b.hw > x && b.x - b.hw < x + 1 && b.z + b.hw > z && b.z - b.hw < z + 1 && b.y + b.h > y && b.y < y + 1;
}

class Shoots implements Telegraph {
  readonly at: Vec3;
  private owner = hazardOwner();
  private t = 0;

  constructor(private ctx: HindranceCtx, readonly p: PandaBambooParams, seconds: number) {
    this.at = centreOf(ctx.host, p.cells);
    const w = ctx.host.world();
    const rings = p.cells.map(i => {
      const [x, y, z] = w.coords(i);
      return { kind: 'ring' as const, x: x + 0.5, y, z: z + 0.5, r: 0.5, grow: 0, width: 0.12, height: 0.6 };
    });
    sketch(ctx, this.owner, rings, seconds, Infinity, BAMBOO_PAINT);
    ctx.host.cue('panda.rustle', this.at.x, this.at.y, this.at.z);
  }

  update(dt: number) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t += LEAF_EVERY;
    const w = this.ctx.host.world();
    const cut = CUT.get(this.p);
    for (const i of this.p.cells) {
      if (cut?.has(stalkOf(this.ctx, i))) continue;
      const [x, y, z] = w.coords(i);
      this.ctx.host.fx('motes', x + 0.5, y + 0.1, z + 0.5, 1);
    }
  }

  end() { this.ctx.hazards.clear(this.owner); }
}

class Stalks implements Effect {
  readonly at: Vec3;
  /** Stalk → the owner of its transient cells. */
  readonly owners = new Map<string, number>();
  /** Cells grown, by stalk. */
  readonly cells = new Map<string, number[]>();
  private t = 0;

  constructor(private ctx: HindranceCtx, private p: PandaBambooParams) {
    this.at = centreOf(ctx.host, p.cells);
    const cut = CUT.get(p);
    CUT.delete(p);
    const w = ctx.host.world();
    // a lob stops at the first solid block between the panda and where it lands
    if (p.from && p.cells.length > 0 && ctx.effects.shelter(p.from, { x: this.at.x, y: this.at.y + 0.5, z: this.at.z })) {
      ctx.host.fx('puff', this.at.x, this.at.y, this.at.z, 3);
      return;
    }
    let pushed = false;
    for (const i of p.cells) {
      const key = stalkOf(ctx, i);
      if (cut?.has(key) || w.getAt(i) !== AIR) continue;
      if (holdsPlayer(ctx, i)) {
        if (!pushed && p.push) { pushed = true; this.kick(i); }
        continue;
      }
      let owner = this.owners.get(key);
      if (owner === undefined) { owner = hazardOwner(); this.owners.set(key, owner); }
      const grown = ctx.effects.transient([i], MAT.bamboo, p.seconds, owner);
      if (grown.length) this.cells.set(key, [...(this.cells.get(key) ?? []), ...grown]);
    }
    if (this.cells.size) ctx.host.cue('panda.rustle', this.at.x, this.at.y, this.at.z);
  }

  /** A soft push away from the stalk's cell (along the lob when the player stands at its centre). */
  private kick(i: number) {
    const b = this.ctx.host.player().body;
    const [x, , z] = this.ctx.host.world().coords(i);
    let dx = b.x - (x + 0.5), dz = b.z - (z + 0.5);
    let d = Math.hypot(dx, dz);
    if (d < 1e-3 && this.p.from) { dx = b.x - this.p.from.x; dz = b.z - this.p.from.z; d = Math.hypot(dx, dz); }
    if (d < 1e-3) { dx = 1; dz = 0; d = 1; }
    const k = this.p.push ?? 0;
    this.ctx.effects.push((dx / d) * k, k * PUSH_UP, (dz / d) * k);
  }

  update(dt: number): boolean {
    this.t += dt;
    return this.t < this.p.seconds;
  }

  /** Cuts one stalk: its cells go back to air at once, with a leaf. */
  cut(key: string) {
    const owner = this.owners.get(key);
    if (owner === undefined) return;
    this.ctx.effects.restore(owner);
    this.owners.delete(key);
    this.cells.delete(key);
  }

  end() {
    for (const o of this.owners.values()) this.ctx.effects.restore(o);
    this.owners.clear();
    this.cells.clear();
  }
}

export const pandaBamboo: Hindrance<PandaBambooParams> = {
  id: 'panda-bamboo',
  telegraph: (ctx, p, seconds) => new Shoots(ctx, p, seconds),
  effect: (ctx, p) => new Stalks(ctx, p),
  answer: (ctx, e, hit: PositiveHit) => {
    if (e instanceof Stalks) {
      for (const [key, cells] of e.cells) {
        if (!cells.some(i => hitsCell(ctx.host, hit, i, 0.8))) continue;
        e.cut(key);
        ctx.host.fx('puff', hit.x, hit.y, hit.z, 2);
        return true;
      }
      return false;
    }
    if (!(e instanceof Shoots)) return false;
    const cut = CUT.get(e.p) ?? new Set<string>();
    for (const i of e.p.cells) {
      const key = stalkOf(ctx, i);
      if (cut.has(key) || !hitsCell(ctx.host, hit, i, 0.8)) continue;
      cut.add(key);
      CUT.set(e.p, cut);
      ctx.host.fx('puff', hit.x, hit.y, hit.z, 2);
      return true;
    }
    return false;
  },
};
