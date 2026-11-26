// The branch courses at run time (issue #329, docs/design/built/levels/giant-tree/BRANCHES.md): the pieces that move,
// give way, switch or pulse, written into the world as whole blocks, a block at a time, from the game's clock. Pure: it
// reads and writes a block space and a body, and draws no randomness, so a headless test runs the same courses with the
// real Player. A body standing on a moving piece is carried with it; a block never appears inside a body (the piece
// waits); a block the course did not write is never overwritten, and only the course's own blocks are cleared.

import { AIR } from '../content/materials';
import { boxHits, type Body } from '../physics/voxel-collide';
import type { Cell, CoursePiece } from './branches';

/** The blocks a course writes to. */
export interface CourseSpace {
  get(x: number, y: number, z: number): number;
  set(x: number, y: number, z: number, m: number): void;
  solid(x: number, y: number, z: number): boolean;
}

/** Seconds a body must stand on ground that is not a switch piece before the pairs return to their start (group 0). */
export const SWITCH_RESET = 1;

/** A triangle wave, −1 to 1 and back, for a share `f` of its cycle. */
function tri(f: number): number {
  const g = ((f % 1) + 1) % 1;
  return g < 0.25 ? 4 * g : g < 0.75 ? 2 - 4 * g : 4 * g - 4;
}

/** Where a moving piece is at time `t`, in whole blocks from its home: −range…range sideways, 0…range up. */
export function offsetAt(p: CoursePiece, t: number): number {
  const R = p.range ?? 0, P = p.period ?? 1, f = t / P + (p.phase ?? 0);
  if (p.kind === 'slide') return Math.round(R * tri(f));
  if (p.kind === 'lift') return Math.round((R * (1 + tri(f - 0.25))) / 2);
  return 0;
}

/** Whether a pulse piece is solid at time `t`. */
export function pulseOn(p: CoursePiece, t: number): boolean {
  const P = p.period ?? 1;
  return ((((t - (p.phase ?? 0)) % P) + P) % P) < (p.on ?? P);
}

/** A piece's cells at an offset. */
export function cellsAt(p: CoursePiece, off: number): Cell[] {
  if (!off) return p.cells;
  return p.cells.map(([x, y, z]) => (p.kind === 'lift' ? [x, y + off, z] : [x, y, z + off]) as Cell);
}

interface PieceState { off: number; solid: boolean; touched: number | null; gone: number; written: boolean }

export class CourseRunner {
  private readonly state: PieceState[];
  /** The two switch groups: which is solid, and the group that goes once the body leaves it (−1 none). */
  private groups: [boolean, boolean] = [true, false];
  private held: -1 | 0 | 1 = -1;
  private calm = 0;

  constructor(readonly pieces: readonly CoursePiece[]) {
    this.state = pieces.map(p => ({ off: 0, solid: p.kind !== 'switch' || (p.group ?? 0) === 0, touched: null, gone: -Infinity, written: false }));
  }

  /** The cells a piece fills now (none while it is gone). */
  current(i: number): Cell[] {
    const s = this.state[i];
    return s.solid ? cellsAt(this.pieces[i], s.off) : [];
  }

  /** Is the body standing on piece `i` as it is now? */
  standsOn(i: number, b: Body): boolean {
    if (!b.onGround) return false;
    const fy = Math.floor(b.y - 0.05), e = 1e-3;
    const x0 = Math.floor(b.x - b.hw + e), x1 = Math.floor(b.x + b.hw - e), z0 = Math.floor(b.z - b.hw + e), z1 = Math.floor(b.z + b.hw - e);
    return this.current(i).some(([x, y, z]) => y === fy && x >= x0 && x <= x1 && z >= z0 && z <= z1);
  }

  /** One step of the courses at game time `t`: works out where every piece should be, carries a body standing on a
   *  moving piece, and writes the difference into the world. `b` is the player's body (null: nobody to carry). */
  update(t: number, dt: number, w: CourseSpace, b: Body | null) {
    const on = this.pieces.map((_, i) => !!b && this.standsOn(i, b));
    // the pairs: landing on one group brings the other, leaving the group you stood on takes it away
    const onGroup = (g: number) => this.pieces.some((p, i) => on[i] && p.kind === 'switch' && (p.group ?? 0) === g);
    if (b) {
      for (const g of [0, 1] as const) if (onGroup(g) && !this.groups[1 - g]) { this.groups[1 - g] = true; this.held = g; }
      const h = this.held;
      if (h !== -1 && !onGroup(0) && !onGroup(1)) { this.groups[h] = false; this.held = -1; }
      const elsewhere = b.onGround && !onGroup(0) && !onGroup(1);
      this.calm = elsewhere ? this.calm + dt : 0;
      if (this.calm >= SWITCH_RESET && this.held < 0) { this.groups = [true, false]; }
    }
    for (let i = 0; i < this.pieces.length; i++) {
      const p = this.pieces[i], s = this.state[i];
      if (p.kind === 'static') continue;
      let off = s.off, solid = s.solid;
      if (p.kind === 'slide' || p.kind === 'lift') off = offsetAt(p, t);
      else if (p.kind === 'pulse') solid = pulseOn(p, t);
      else if (p.kind === 'switch') solid = this.groups[p.group ?? 0];
      else if (p.kind === 'crumble') {
        if (s.solid && on[i] && s.touched === null) s.touched = t;
        if (s.solid && s.touched !== null && t - s.touched >= (p.delay ?? 1)) { solid = false; s.gone = t; s.touched = null; }
        if (!s.solid && t - s.gone >= (p.back ?? 3)) solid = true;
      }
      if (s.written && off === s.off && solid === s.solid) continue;
      const old = s.written ? this.current(i) : [];
      const next = solid ? cellsAt(p, off) : [];
      // carry: a body standing on a moving piece moves with it, if it has room to
      let carried = false;
      if (b && on[i] && solid && s.solid && off !== s.off) {
        const d = off - s.off, ox = b.x, oy = b.y, oz = b.z;
        if (p.kind === 'lift') b.y += d; else b.z += d;
        if (boxHits((x, y, z) => w.solid(x, y, z) && !next.some(c => c[0] === x && c[1] === y && c[2] === z), b.x, b.y, b.z, b.hw, b.h)) {
          b.x = ox; b.y = oy; b.z = oz;
        } else carried = true;
      }
      // a block never appears inside a body: the piece waits
      if (b && next.some(([x, y, z]) => !old.some(c => c[0] === x && c[1] === y && c[2] === z) && boxHits((cx, cy, cz) => cx === x && cy === y && cz === z, b.x, b.y, b.z, b.hw, b.h))) {
        if (carried) { if (p.kind === 'lift') b.y -= off - s.off; else b.z -= off - s.off; }
        continue;
      }
      for (const [x, y, z] of old) if (!next.some(c => c[0] === x && c[1] === y && c[2] === z) && w.get(x, y, z) === p.mat) w.set(x, y, z, AIR);
      for (const [x, y, z] of next) if (w.get(x, y, z) === AIR) w.set(x, y, z, p.mat);
      s.off = off; s.solid = solid; s.written = true;
    }
  }
}
