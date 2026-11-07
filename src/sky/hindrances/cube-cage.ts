// Cube cage: transient cubes round the player's cell, never over a drop (docs/architecture/SKY.md §6). The telegraph
// outlines the cage's cells one by one (motes and a soft pop each); the effect fills the outlined cells with
// transient cloud for its seconds, two high round the cell, with no roof. A cage is never closed over a drop: with
// no solid ground under its centre it is not built at all. A cell the player's body overlaps is left open, so the
// cage never closes inside them. Any positive shot at a cube breaks it at once (no loose cube), during the warning
// or after. Every cube is gone when it ends. Nothing here damages.

import { AIR, MAT } from '../../content/materials';
import { hazardOwner } from './runner';
import { hitsCell } from './effects';
import type { CubeCageParams, Effect, Hindrance, HindranceCtx, PositiveHit, SkyHost, Telegraph, Vec3 } from '../types';

/** The cage's material: soft cloud, the sky's own. */
export const CAGE_MAT = MAT.cloud;
/** The cage's height above the floor, in blocks. */
const HEIGHT = 2;
const RING: readonly [number, number][] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

/** Cells a positive shot broke during the telegraph, by the start's params. */
const BROKEN = new WeakMap<CubeCageParams, Set<number>>();

/** The cage's cells round `around`, in a fixed order: none when there is no ground under its centre. */
export function cageCells(host: SkyHost, around: Vec3): number[] {
  const w = host.world();
  const cx = Math.floor(around.x), cy = Math.floor(around.y), cz = Math.floor(around.z);
  if (!w.solid(cx, cy - 1, cz)) return [];
  const out: number[] = [];
  for (let k = 0; k < HEIGHT; k++) for (const [dx, dz] of RING) {
    const x = cx + dx, y = cy + k, z = cz + dz;
    if (w.inside(x, y, z) && w.get(x, y, z) === AIR) out.push(w.idx(x, y, z));
  }
  return out;
}

/** Whether a cell overlaps the player's body. */
function inPlayer(host: SkyHost, i: number): boolean {
  const b = host.player().body;
  const [x, y, z] = host.world().coords(i);
  return b.x + b.hw > x && b.x - b.hw < x + 1 && b.z + b.hw > z && b.z - b.hw < z + 1 && b.y + b.h > y && b.y < y + 1;
}

class Outline implements Telegraph {
  readonly at: Vec3;
  readonly cells: number[];
  /** How many cells are outlined so far. */
  shown = 0;
  private t = 0;
  private every: number;

  constructor(private ctx: HindranceCtx, readonly p: CubeCageParams, seconds: number) {
    this.at = p.around;
    this.cells = cageCells(ctx.host, p.around);
    // every cell is outlined before the last quarter of the warning
    this.every = this.cells.length ? (seconds * 0.75) / this.cells.length : Infinity;
    this.next();
  }

  private next() {
    if (this.shown >= this.cells.length) return;
    const [x, y, z] = this.ctx.host.world().coords(this.cells[this.shown++]);
    this.ctx.host.fx('motes', x + 0.5, y + 0.5, z + 0.5, 3);
    this.ctx.host.cue('core.pop', x + 0.5, y + 0.5, z + 0.5);
  }

  update(dt: number) {
    this.t += dt;
    while (this.shown < this.cells.length && this.t >= this.every * this.shown) this.next();
  }

  end() {}
}

class Cage implements Effect {
  readonly at: Vec3;
  readonly cubes: Set<number>;
  private t = 0;
  private owner = hazardOwner();

  constructor(private ctx: HindranceCtx, private p: CubeCageParams) {
    const broken = BROKEN.get(p);
    BROKEN.delete(p);
    this.at = p.around;
    const cells = cageCells(ctx.host, p.around).filter(i => !broken?.has(i) && !inPlayer(ctx.host, i));
    this.cubes = new Set(ctx.effects.transient(cells, CAGE_MAT, p.seconds, this.owner));
  }

  /** Breaks one cube now: it goes back to air with a puff and no loose cube. */
  breakCube(i: number) {
    const w = this.ctx.host.world();
    w.restore(i);
    this.cubes.delete(i);
    const [x, y, z] = w.coords(i);
    this.ctx.host.fx('puff', x + 0.5, y + 0.5, z + 0.5, 4);
    this.ctx.host.cue('core.puff', x + 0.5, y + 0.5, z + 0.5);
  }

  update(dt: number): boolean {
    this.t += dt;
    return this.t < this.p.seconds;
  }

  end() {
    this.ctx.effects.restore(this.owner);
    this.cubes.clear();
  }
}

export const cubeCage: Hindrance<CubeCageParams> = {
  id: 'cube-cage',
  telegraph: (ctx, p, seconds) => new Outline(ctx, p, seconds),
  effect: (ctx, p) => new Cage(ctx, p),
  answer: (ctx, e, hit: PositiveHit) => {
    if (e instanceof Cage) {
      for (const i of e.cubes) if (hitsCell(ctx.host, hit, i, 0.75)) { e.breakCube(i); return true; }
      return false;
    }
    if (e instanceof Outline) {
      const broken = BROKEN.get(e.p) ?? new Set<number>();
      const i = e.cells.slice(0, e.shown).find(c => !broken.has(c) && hitsCell(ctx.host, hit, c, 0.75));
      if (i === undefined) return false;
      broken.add(i);
      BROKEN.set(e.p, broken);
      ctx.host.fx('puff', hit.x, hit.y, hit.z, 2);
      return true;
    }
    return false;
  },
};
