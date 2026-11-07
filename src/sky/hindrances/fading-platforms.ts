// Fading platforms: a whole platform (its tag) or chosen cells turn to mist, then to transient air, then return
// (docs/architecture/SKY.md §6, law 3.6: platforms that disappear always warn first). The telegraph swaps the cells
// to mist (a solid, grey look) and ticks faster as the moment nears; the effect turns them to air for its seconds
// and brings them back with a chime. Held cells (an ally's protect) and placed cells never fade. A positive shot
// at the platform holds it: during the warning it stays solid 2 s longer; once faded, it returns at once and stays
// for the rest of the run. Every cell it changed is back when it ends. Nothing here damages.

import { AIR, MAT } from '../../content/materials';
import { hazardOwner } from './runner';
import { centreOf, hitsCell } from './effects';
import type { Effect, FadingPlatformsParams, Hindrance, HindranceCtx, PositiveHit, Shape, SkyWorldApi, Telegraph, Vec3 } from '../types';

/** Seconds a positive shot holds the platform. */
export const HOLD = 2;
/** The most cells one fade may touch (a guard against a tag that names half the floor). */
export const MAX_CELLS = 4096;
/** The tick's interval far from the fade and right before it. */
const TICK_SLOW = 0.5;
const TICK_FAST = 0.1;

/** Runs a positive shot held during the telegraph, by the start's params. */
const HELD = new WeakSet<FadingPlatformsParams>();

/** The inclusive bounds of a tagged shape, or null for a shape that carries no tag. */
function boundsOf(s: Shape): [number, number, number, number, number, number] | null {
  switch (s.k) {
    case 'box': return [s.x0, s.y0, s.z0, s.x1, s.y1, s.z1];
    case 'ring': return [Math.floor(s.cx - s.r1), s.y0, Math.floor(s.cz - s.r1), Math.ceil(s.cx + s.r1), s.y1, Math.ceil(s.cz + s.r1)];
    case 'run': {
      const w = Math.ceil(s.w), h = Math.ceil(s.h);
      return [Math.min(s.ax, s.bx) - w, Math.min(s.ay, s.by) - h, Math.min(s.az, s.bz) - w, Math.max(s.ax, s.bx) + w, Math.max(s.ay, s.by) + h, Math.max(s.az, s.bz) + w];
    }
    case 'blob': return [Math.floor(s.cx - s.rx), Math.floor(s.cy - s.ry), Math.floor(s.cz - s.rz), Math.ceil(s.cx + s.rx), Math.ceil(s.cy + s.ry), Math.ceil(s.cz + s.rz)];
    default: return null;
  }
}

/** The solid cells of the platforms with these tags, in a fixed order (shapes in layout order, then x, z, y). */
export function cellsOfTags(world: SkyWorldApi, tags: readonly number[]): number[] {
  const want = new Set(tags);
  const out = new Set<number>();
  for (const s of world.layout.shapes) {
    if (!('tag' in s) || s.tag === undefined || !want.has(s.tag)) continue;
    const b = boundsOf(s);
    if (!b) continue;
    for (let x = b[0]; x <= b[3]; x++) for (let z = b[2]; z <= b[5]; z++) for (let y = b[1]; y <= b[4]; y++) {
      if (!world.inside(x, y, z) || world.layout.tagAt(x, y, z) !== s.tag || !world.solid(x, y, z)) continue;
      out.add(world.idx(x, y, z));
      if (out.size >= MAX_CELLS) return [...out];
    }
  }
  return [...out];
}

/** The cells a run fades: the chosen ones, or else every cell of its tags. */
function cellsOf(ctx: HindranceCtx, p: FadingPlatformsParams): number[] {
  return p.cells ? p.cells.slice(0, MAX_CELLS) : cellsOfTags(ctx.host.world(), p.tags);
}

class Mist implements Telegraph {
  readonly at: Vec3;
  readonly cells: number[];
  private owner = hazardOwner();
  private tick = 0;

  constructor(private ctx: HindranceCtx, readonly p: FadingPlatformsParams, seconds: number) {
    // the mist holds a little longer than the warning so it never flickers back to its block between the two
    this.cells = ctx.effects.transient(cellsOf(ctx, p), MAT.mist, seconds + HOLD + 1, this.owner);
    this.at = centreOf(ctx.host, this.cells);
    ctx.host.cue('core.shimmer', this.at.x, this.at.y, this.at.z);
  }

  update(dt: number, left: number) {
    this.tick -= dt;
    if (this.tick > 0 || this.cells.length === 0) return;
    this.tick += Math.max(TICK_FAST, Math.min(TICK_SLOW, left / 4));
    this.ctx.host.cue('core.hit', this.at.x, this.at.y, this.at.z);
    const w = this.ctx.host.world();
    // the edges flicker: a few cells shed motes each tick, in a fixed walk
    for (let k = 0; k < Math.min(4, this.cells.length); k++) {
      const [x, y, z] = w.coords(this.cells[(Math.floor(left * 37) + k * 7) % this.cells.length]);
      this.ctx.host.fx('motes', x + 0.5, y + 1, z + 0.5, 1);
    }
  }

  end() {
    this.ctx.effects.restore(this.owner);
  }
}

class Fade implements Effect {
  readonly at: Vec3;
  private t = 0;
  private hold: number;
  private faded = false;
  private back = false;
  private owner = hazardOwner();
  readonly cells: number[];

  constructor(private ctx: HindranceCtx, readonly p: FadingPlatformsParams) {
    this.hold = HELD.delete(p) ? HOLD : 0;
    this.cells = cellsOf(ctx, p);
    this.at = centreOf(ctx.host, this.cells);
    if (this.hold > 0) this.ctx.effects.transient(this.cells, MAT.mist, this.hold + 0.5, this.owner);
    else this.fade();
  }

  private fade() {
    this.faded = true;
    this.ctx.effects.restore(this.owner);
    this.ctx.effects.transient(this.cells, AIR, this.p.seconds, this.owner);
    this.ctx.host.fx('puff', this.at.x, this.at.y, this.at.z, 8);
  }

  /** A positive shot on the faded platform brings it back now, for the rest of the run. */
  answerFaded() {
    this.back = true;
    this.ctx.effects.restore(this.owner);
    this.ctx.host.cue('core.regrow', this.at.x, this.at.y, this.at.z);
  }

  get open(): boolean { return this.faded && !this.back; }

  update(dt: number): boolean {
    this.t += dt;
    if (!this.faded && this.t >= this.hold) this.fade();
    return this.t < this.hold + this.p.seconds;
  }

  end() {
    this.ctx.effects.restore(this.owner);
    if (this.faded && !this.back) this.ctx.host.cue('core.regrow', this.at.x, this.at.y, this.at.z);
  }
}

export const fadingPlatforms: Hindrance<FadingPlatformsParams> = {
  id: 'fading-platforms',
  telegraph: (ctx, p, seconds) => new Mist(ctx, p, seconds),
  effect: (ctx, p) => new Fade(ctx, p),
  answer: (ctx, e, hit: PositiveHit) => {
    if (e instanceof Mist) {
      if (HELD.has(e.p) || !e.cells.some(i => hitsCell(ctx.host, hit, i))) return false;
      HELD.add(e.p);
      ctx.host.fx('gold', hit.x, hit.y, hit.z);
      return true;
    }
    if (e instanceof Fade) {
      if (!e.open || !e.cells.some(i => hitsCell(ctx.host, hit, i))) return false;
      e.answerFaded();
      return true;
    }
    return false;
  },
};
