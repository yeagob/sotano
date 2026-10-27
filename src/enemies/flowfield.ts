// Per-room navigation: a flow field over the room's interior (13×7, or bigger for a footprint) towards the target. Each cell gets
// a standing height: up over terraces (the first free 2-block gap), down into dips and pools (down to
// two blocks below the floor); neighbours connect when the step is at most one block. Elements shape
// it per projection (docs/architecture/ELEMENTS.md §9.3): cells it avoids are not walkable, cells it
// lives in are cheap and everything else costs more, so a projection that dwells in water keeps to
// the water. Recomputed only when the target changes cell or the world or its elements change.

import { ROOM_D, ROOM_W } from '../content/rooms';

type Solid = (x: number, y: number, z: number) => boolean;
/** How the projection treats the element at a standing cell (null: no element there). */
export type Hazard = (x: number, y: number, z: number) => 'avoid' | 'cross' | 'dwell' | null;

export interface RoomArea { id: number; x0: number; y0: number; z0: number; height?: number; w?: number; d?: number }

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
/** Deepest standing height below the floor (pits and pools are at most 2 deep). */
const PIT = 2;
/** Highest terrace a projection may stand on. */
const TERRACE = 4;

export class FlowField {
  /** The room's interior in tiles (13 × 7, bigger for a footprint). */
  private readonly W: number;
  private readonly D: number;
  private dist: Int16Array;
  private height: Int16Array;
  private cost: Uint8Array;
  private done: Uint8Array;
  private key = '';

  constructor(readonly room: RoomArea) {
    this.W = room.w ?? ROOM_W; this.D = room.d ?? ROOM_D;
    const n = this.W * this.D;
    this.dist = new Int16Array(n); this.height = new Int16Array(n); this.cost = new Uint8Array(n); this.done = new Uint8Array(n);
  }

  /** Rebuilds if the target cell, the world or its elements changed. */
  update(solid: Solid, tx: number, tz: number, worldVersion: number | string, hazard: Hazard = () => null) {
    const cx = Math.floor(tx) - this.room.x0, cz = Math.floor(tz) - this.room.z0;
    const key = `${cx},${cz},${worldVersion}`;
    if (key === this.key) return;
    this.key = key;
    const { x0, y0, z0 } = this.room;
    let dwells = false;
    for (let r = 0; r < this.D; r++) for (let c = 0; c < this.W; c++) {
      const x = x0 + c, z = z0 + r, i = c + r * this.W;
      let y = y0;
      while (y < y0 + TERRACE && solid(x, y, z)) y++;
      while (y > y0 - PIT && !solid(x, y - 1, z)) y--;
      const free = !solid(x, y, z) && !solid(x, y + 1, z) && y < y0 + TERRACE;
      const h = free ? hazard(x, y, z) : null;
      this.height[i] = free && h !== 'avoid' ? y : -1;
      this.cost[i] = h === 'dwell' ? 1 : 3;
      if (h === 'dwell') dwells = true;
    }
    // without a dwelling element every step costs the same (a plain breadth-first search)
    if (!dwells) this.cost.fill(1);
    this.dist.fill(-1);
    if (cx < 0 || cz < 0 || cx >= this.W || cz >= this.D) return;
    // Dijkstra over 91 cells: a linear scan for the next cell is cheaper than a heap at this size
    const done = this.done;
    done.fill(0);
    const start = cx + cz * this.W;
    this.dist[start] = 0;
    for (;;) {
      let i = -1;
      for (let k = 0; k < this.dist.length; k++) if (!done[k] && this.dist[k] >= 0 && (i < 0 || this.dist[k] < this.dist[i])) i = k;
      if (i < 0) break;
      done[i] = 1;
      const c = i % this.W, r = (i / this.W) | 0, h = this.height[i];
      for (const [dc, dr] of DIRS) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= this.W || nr >= this.D) continue;
        const n = nc + nr * this.W;
        if (done[n] || this.height[n] < 0) continue;
        if (h >= 0 && Math.abs(this.height[n] - h) > 1) continue;
        // no cutting corners diagonally past an obstacle
        if (dc && dr && (this.height[c + dc + r * this.W] < 0 || this.height[c + (r + dr) * this.W] < 0)) continue;
        const d = this.dist[i] + this.cost[n];
        if (this.dist[n] < 0 || d < this.dist[n]) this.dist[n] = d;
      }
    }
  }

  /** Unit direction to walk from (x, z), or null if this cell isn't connected to the target. */
  direction(x: number, z: number): [number, number] | null {
    const c = Math.floor(x) - this.room.x0, r = Math.floor(z) - this.room.z0;
    if (c < 0 || r < 0 || c >= this.W || r >= this.D) return null;
    const here = this.dist[c + r * this.W];
    if (here < 0) return null;
    let best = here, bx = 0, bz = 0;
    for (const [dc, dr] of DIRS) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= this.W || nr >= this.D) continue;
      const d = this.dist[nc + nr * this.W];
      if (d >= 0 && d < best) { best = d; bx = nc + 0.5 - (x - this.room.x0); bz = nr + 0.5 - (z - this.room.z0); }
    }
    const l = Math.hypot(bx, bz);
    return l > 1e-3 ? [bx / l, bz / l] : null;
  }
}
