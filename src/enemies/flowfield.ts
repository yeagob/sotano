// Per-room navigation: a breadth-first flow field over the room's 13×7 interior towards the
// player. Each cell gets a standing height (the first free 2-block gap above the floor);
// neighbours connect when the step is at most one block. Recomputed only when the player
// changes cell or the world changes (VoxelWorld.version), so it costs nothing most frames.

import { ROOM_D, ROOM_W } from '../content/rooms';

type Solid = (x: number, y: number, z: number) => boolean;

export interface RoomArea { id: number; x0: number; y0: number; z0: number }

const DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export class FlowField {
  private dist = new Int16Array(ROOM_W * ROOM_D);
  private height = new Int16Array(ROOM_W * ROOM_D);
  private key = '';

  constructor(readonly room: RoomArea) {}

  /** Rebuilds if the target cell or the world changed. */
  update(solid: Solid, tx: number, tz: number, worldVersion: number) {
    const cx = Math.floor(tx) - this.room.x0, cz = Math.floor(tz) - this.room.z0;
    const key = `${cx},${cz},${worldVersion}`;
    if (key === this.key) return;
    this.key = key;
    const { x0, y0, z0 } = this.room;
    for (let r = 0; r < ROOM_D; r++) for (let c = 0; c < ROOM_W; c++) {
      let y = y0;
      while (y < y0 + 3 && solid(x0 + c, y, z0 + r)) y++;
      const free = !solid(x0 + c, y, z0 + r) && !solid(x0 + c, y + 1, z0 + r);
      this.height[c + r * ROOM_W] = free && y < y0 + 3 ? y : -1;
    }
    this.dist.fill(-1);
    if (cx < 0 || cz < 0 || cx >= ROOM_W || cz >= ROOM_D) return;
    const q: number[] = [cx + cz * ROOM_W];
    this.dist[q[0]] = 0;
    while (q.length) {
      const i = q.shift()!;
      const c = i % ROOM_W, r = (i / ROOM_W) | 0, h = this.height[i];
      for (const [dc, dr] of DIRS) {
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= ROOM_W || nr >= ROOM_D) continue;
        const n = nc + nr * ROOM_W;
        if (this.dist[n] >= 0 || this.height[n] < 0) continue;
        if (h >= 0 && Math.abs(this.height[n] - h) > 1) continue;
        // no cutting corners diagonally past an obstacle
        if (dc && dr && (this.height[c + dc + r * ROOM_W] < 0 || this.height[c + (r + dr) * ROOM_W] < 0)) continue;
        this.dist[n] = this.dist[i] + 1;
        q.push(n);
      }
    }
  }

  /** Unit direction to walk from (x, z), or null if this cell isn't connected to the target. */
  direction(x: number, z: number): [number, number] | null {
    const c = Math.floor(x) - this.room.x0, r = Math.floor(z) - this.room.z0;
    if (c < 0 || r < 0 || c >= ROOM_W || r >= ROOM_D) return null;
    const here = this.dist[c + r * ROOM_W];
    if (here < 0) return null;
    let best = here, bx = 0, bz = 0;
    for (const [dc, dr] of DIRS) {
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= ROOM_W || nr >= ROOM_D) continue;
      const d = this.dist[nc + nr * ROOM_W];
      if (d >= 0 && d < best) { best = d; bx = nc + 0.5 - (x - this.room.x0); bz = nr + 0.5 - (z - this.room.z0); }
    }
    const l = Math.hypot(bx, bz);
    return l > 1e-3 ? [bx / l, bz / l] : null;
  }
}
