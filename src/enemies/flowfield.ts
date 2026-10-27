// Per-room navigation: a flow field over the room's interior (13×7, or bigger for a footprint) towards the target. Each cell gets
// a standing height: up over terraces (the first free 2-block gap), down into dips and pools (down to
// two blocks below the floor); neighbours connect when the step is at most one block. Elements shape
// it per projection (docs/architecture/ELEMENTS.md §9.3): cells it avoids are not walkable, and neither are
// the cells within two blocks of them (lava flows faster than a walker, so it keeps well back from a front);
// cells it lives in are cheap and everything else costs more, so a projection that dwells in water keeps to
// the water. Recomputed only when the target changes cell or the world or its elements change.

import { ROOM_D, ROOM_W } from '../content/rooms';

type Solid = (x: number, y: number, z: number) => boolean;
/** How the projection treats the element at a standing cell (null: no element there). */
export type Hazard = (x: number, y: number, z: number) => 'avoid' | 'cross' | 'dwell' | null;

/** `hx`, `hz`: the home cell's interior corner (its centre is always open). */
export interface RoomArea { id: number; x0: number; y0: number; z0: number; height?: number; w?: number; d?: number; hx?: number; hz?: number }

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
/** Deepest standing height below the floor (pits and pools are at most 2 deep). */
const PIT = 2;
/** Highest terrace a projection may stand on. */
const TERRACE = 4;
/** Blocks a projection keeps from what it avoids. Lava flows about three blocks a second, faster than a walker,
 *  so it steps back as soon as the front is two blocks away. */
const KEEP_AWAY = 2;

export class FlowField {
  /** The room's interior in tiles (13 × 7, up to 43 × 25 for a big room). */
  private readonly W: number;
  private readonly D: number;
  private dist: Int16Array;
  private height: Int16Array;
  private cost: Uint8Array;
  private done: Uint8Array;
  /** Cells whose element the projection avoids (the lava it keeps away from). */
  private avoided: Uint8Array;
  private key = '';

  constructor(readonly room: RoomArea) {
    this.W = room.w ?? ROOM_W; this.D = room.d ?? ROOM_D;
    const n = this.W * this.D;
    this.dist = new Int16Array(n); this.height = new Int16Array(n); this.cost = new Uint8Array(n); this.done = new Uint8Array(n);
    this.avoided = new Uint8Array(n);
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
      this.avoided[i] = h === 'avoid' ? 1 : 0;
      this.height[i] = free && h !== 'avoid' ? y : -1;
      this.cost[i] = h === 'dwell' ? 1 : 3;
      if (h === 'dwell') dwells = true;
    }
    // it keeps one block from what it avoids: a lava front that spreads finds it already gone
    for (let i = 0; i < this.W * this.D; i++) if (this.height[i] >= 0 && this.touchesAvoided(i)) this.height[i] = -1;
    // without a dwelling element every step costs the same (a plain breadth-first search)
    if (!dwells) this.cost.fill(1);
    this.dist.fill(-1);
    if (cx < 0 || cz < 0 || cx >= this.W || cz >= this.D) return;
    // Dijkstra with a bucket queue (Dial's): steps cost 1 or 3, and big rooms reach a thousand cells
    const done = this.done;
    done.fill(0);
    const start = cx + cz * this.W;
    this.dist[start] = 0;
    const buckets: number[][] = [[start]];
    for (let d0 = 0; d0 < buckets.length; d0++) {
      const bucket = buckets[d0];
      if (!bucket) continue;
      for (let q = 0; q < bucket.length; q++) {
        const i = bucket[q];
        if (done[i] || this.dist[i] !== d0) continue;
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
          const d = d0 + this.cost[n];
          if (this.dist[n] < 0 || d < this.dist[n]) { this.dist[n] = d; (buckets[d] ??= []).push(n); }
        }
      }
    }
  }

  /** Is the cell it stands on, or a cell beside it, something it avoids (then it must step back out)? */
  unsafe(x: number, z: number): boolean {
    const c = Math.floor(x) - this.room.x0, r = Math.floor(z) - this.room.z0;
    if (c < 0 || r < 0 || c >= this.W || r >= this.D) return false;
    const i = c + r * this.W;
    return !!this.avoided[i] || this.touchesAvoided(i);
  }

  private touchesAvoided(i: number): boolean {
    const c = i % this.W, r = (i / this.W) | 0;
    for (let dr = -KEEP_AWAY; dr <= KEEP_AWAY; dr++) for (let dc = -KEEP_AWAY; dc <= KEEP_AWAY; dc++) {
      const nc = c + dc, nr = r + dr;
      if (nc >= 0 && nr >= 0 && nc < this.W && nr < this.D && this.avoided[nc + nr * this.W]) return true;
    }
    return false;
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

  /** Unit direction to the nearest cell it may stand on, for a projection that is already standing in what
   *  it avoids: it climbs out the short way. Null if the room has no such cell. */
  escape(x: number, z: number): [number, number] | null {
    const c = Math.floor(x) - this.room.x0, r = Math.floor(z) - this.room.z0;
    if (c < 0 || r < 0 || c >= this.W || r >= this.D) return null;
    const start = c + r * this.W;
    const parent = new Int32Array(this.W * this.D).fill(-1);
    parent[start] = start;
    const queue = [start];
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q];
      if (i !== start && this.height[i] >= 0) {
        let step = i;
        while (parent[step] !== start) step = parent[step];
        const dx = (step % this.W) + 0.5 - (x - this.room.x0), dz = ((step / this.W) | 0) + 0.5 - (z - this.room.z0);
        const l = Math.hypot(dx, dz);
        return l > 1e-3 ? [dx / l, dz / l] : null;
      }
      const ci = i % this.W, ri = (i / this.W) | 0;
      for (const [dc, dr] of DIRS) {
        const nc = ci + dc, nr = ri + dr;
        if (nc < 0 || nr < 0 || nc >= this.W || nr >= this.D) continue;
        const n = nc + nr * this.W;
        if (parent[n] >= 0) continue;
        parent[n] = i;
        queue.push(n);
      }
    }
    return null;
  }
}
