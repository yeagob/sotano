// SkyEffects: the shared rules every hindrance effect goes through (docs/architecture/SKY.md §6). Nothing
// here damages: the player is pushed, slowed or held; the world changes only in cells the sky may change
// (never a placed block, never a cell a holding ally protects), and every change is undone by its owner.

import { EL_WATER, SOURCE, elemByte } from '../../content/elements';
import { AIR } from '../../content/materials';
import { ExceptionKind, type SkyEffectsApi, type SkyHost, type Vec3 } from '../types';

/** A shelter ray is sampled every quarter block. */
const SHELTER_STEP = 0.25;

/** The middle of the player's body, where a hindrance aims. */
export function playerPoint(host: SkyHost): Vec3 {
  const b = host.player().body;
  return { x: b.x, y: b.y + b.h / 2, z: b.z };
}

/** Whether two points are within `r` of each other. */
export function near(a: Vec3, b: Vec3, r: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= r;
}

/** Whether a positive hit landed on cell `i`: its voxel, or a point within `r` of the cell's centre. */
export function hitsCell(host: SkyHost, hit: { x: number; y: number; z: number; cell: number }, i: number, r = 1): boolean {
  if (hit.cell === i) return true;
  const [x, y, z] = host.world().coords(i);
  return Math.hypot(hit.x - (x + 0.5), hit.y - (y + 0.5), hit.z - (z + 0.5)) <= r;
}

/** The centre of a set of cells (where a hindrance's sound and motes come from). */
export function centreOf(host: SkyHost, cells: readonly number[]): Vec3 {
  if (cells.length === 0) return { x: 0, y: 0, z: 0 };
  const w = host.world();
  let sx = 0, sy = 0, sz = 0;
  for (const i of cells) {
    const [x, y, z] = w.coords(i);
    sx += x + 0.5; sy += y + 0.5; sz += z + 0.5;
  }
  return { x: sx / cells.length, y: sy / cells.length, z: sz / cells.length };
}

/** The cell the player stands on (just under their feet). */
export function cellUnderFeet(host: SkyHost): number {
  const b = host.player().body;
  return host.world().idx(Math.floor(b.x), Math.floor(b.y - 0.05), Math.floor(b.z));
}

export class SkyEffects implements SkyEffectsApi {
  /** Cell → the owners that protect it. */
  private protectedBy = new Map<number, Set<number>>();
  /** Owner → the cells it protects. */
  private protectedOf = new Map<number, number[]>();
  /** Owner → the cells it made transient. */
  private transients = new Map<number, Set<number>>();
  /** Owner → the cells it filled with source water. */
  private waters = new Map<number, number[]>();

  constructor(private host: SkyHost) {}

  push(vx: number, vy: number, vz: number) { this.host.player().push(vx, vy, vz); }
  slow(f: number, s: number) { this.host.player().slow(f, s); }
  hold(s: number) { this.host.player().hold(s); }

  /** A solid block strictly between the two points (the end cells, where either stands, do not count). */
  shelter(from: Vec3, to: Vec3): boolean {
    const w = this.host.world();
    const n = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) / SHELTER_STEP));
    const a = cellOf(from), b = cellOf(to);
    for (let k = 1; k < n; k++) {
      const t = k / n;
      const x = Math.floor(from.x + (to.x - from.x) * t), y = Math.floor(from.y + (to.y - from.y) * t), z = Math.floor(from.z + (to.z - from.z) * t);
      if (sameCell(x, y, z, a) || sameCell(x, y, z, b)) continue;
      if (w.solid(x, y, z)) return true;
    }
    return false;
  }

  /** Not placed by the player and not protected by an ally. */
  mayChange(i: number): boolean {
    return this.host.world().kindAt(i) !== ExceptionKind.Placed && !this.isProtected(i);
  }

  transient(cells: readonly number[], m: number, seconds: number, owner: number): number[] {
    const w = this.host.world();
    const until = this.host.time() + seconds;
    const done: number[] = [];
    for (const i of cells) {
      if (!this.mayChange(i)) continue;
      const [x, y, z] = w.coords(i);
      if (w.setTransient(x, y, z, m, until, owner)) done.push(i);
    }
    if (done.length) {
      let own = this.transients.get(owner);
      if (!own) { own = new Set(); this.transients.set(owner, own); }
      for (const i of done) own.add(i);
    }
    return done;
  }

  /** Ends the owner's transient cells now: each one that is still transient goes back to the formula. */
  restore(owner: number) {
    const w = this.host.world();
    for (const i of this.transients.get(owner) ?? []) if (w.kindAt(i) === ExceptionKind.Transient) w.restore(i);
    this.transients.delete(owner);
  }

  protect(cells: readonly number[], owner: number) {
    let own = this.protectedOf.get(owner);
    if (!own) { own = []; this.protectedOf.set(owner, own); }
    for (const i of cells) {
      let s = this.protectedBy.get(i);
      if (!s) { s = new Set(); this.protectedBy.set(i, s); }
      s.add(owner);
      own.push(i);
    }
  }

  release(owner: number) {
    for (const i of this.protectedOf.get(owner) ?? []) {
      const s = this.protectedBy.get(i);
      if (!s) continue;
      s.delete(owner);
      if (s.size === 0) this.protectedBy.delete(i);
    }
    this.protectedOf.delete(owner);
  }

  isProtected(i: number): boolean {
    return (this.protectedBy.get(i)?.size ?? 0) > 0;
  }

  /** Air cells with no element become source water, which the owner removes with `dry`. */
  water(cells: readonly number[], owner: number): number[] {
    const w = this.host.world();
    const source = elemByte(EL_WATER, SOURCE);
    const filled: number[] = [];
    for (const i of cells) {
      if (!this.mayChange(i) || w.getAt(i) !== AIR || w.elemAtIndex(i) !== 0) continue;
      const [x, y, z] = w.coords(i);
      w.setElemByte(x, y, z, source);
      filled.push(i);
    }
    if (filled.length) this.waters.set(owner, [...(this.waters.get(owner) ?? []), ...filled]);
    return filled;
  }

  dry(owner: number) {
    const w = this.host.world();
    const source = elemByte(EL_WATER, SOURCE);
    for (const i of this.waters.get(owner) ?? []) {
      if (w.elemAtIndex(i) !== source) continue;
      const [x, y, z] = w.coords(i);
      w.setElemByte(x, y, z, 0);
    }
    this.waters.delete(owner);
  }

  /** Nothing ticks here: the runner ends each effect, and the world expires its transient cells. */
  update(_dt: number) {}
}

function cellOf(p: Vec3): [number, number, number] {
  return [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)];
}

function sameCell(x: number, y: number, z: number, c: [number, number, number]): boolean {
  return x === c[0] && y === c[1] && z === c[2];
}
