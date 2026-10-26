// Loose blocks: a broken block becomes a cube that falls, tumbles, settles, can be picked up,
// kicked or thrown, and despawns after a while (see docs/DESIGN.md §5).
//
// Same approach as the Joel gift project, which handled thousands of cubes smoothly:
// no physics engine, just typed arrays and a ring buffer. Each cube is an axis-aligned box
// moved one axis at a time against the voxel grid; resting cubes act as floor for falling
// ones (via a per-column hash), so piles stack. Rotation is visual only.

import { fx } from '../core/fx';

export const DEBRIS_SIZE = 0.72;     // loose cube edge length
export const DEBRIS_LIFETIME = 90;   // seconds until it despawns
export const DEBRIS_BLINK = 8;       // blinks for the last seconds

const G = 26;
const HS = DEBRIS_SIZE / 2;
const MOVING = 1, RESTING = 2;

type Solid = (x: number, y: number, z: number) => boolean;

/** Called when a tagged (thrown/kicked) cube hits something hard. */
export type ImpactFn = (i: number, x: number, y: number, z: number, speed: number) => void;
/** Called when a bomb's fuse runs out (the cube is removed right after). */
export type FuseFn = (i: number, x: number, y: number, z: number) => void;

export class DebrisSystem {
  readonly max: number;
  readonly pos: Float32Array;
  readonly vel: Float32Array;
  /** Visual rotation quaternion, plus a spin axis (xyz) and speed (w). */
  readonly quat: Float32Array;
  readonly spin: Float32Array;
  readonly material: Uint8Array;
  readonly state: Uint8Array;
  readonly age: Float32Array;
  /** Can't be picked up or kicked until this runs out (so you don't grab what you just kicked). */
  readonly cooldown: Float32Array;
  /** Item-defined labels ('volatile'…) on cubes that were thrown or kicked. Sparse. */
  readonly tags: (Set<string> | null)[];
  /** Seconds left on a bomb's fuse (0 = not a bomb). Bombs are pinned: never recycled, never age out. */
  readonly fuse: Float32Array;
  onFuse: FuseFn = () => {};
  private cursor = 0;
  private alive = 0;
  /** Column hash of resting cubes: key → indices. Rebuilt every frame. */
  private columns = new Map<number, number[]>();
  /** Cubes that moved this frame (they are the ones that may overlap others). */
  private stepped = new Uint8Array(0);
  /** Cubes pushed by the separation pass: re-checked every frame until they're clear. */
  private unsettled = new Uint8Array(0);
  /** Cell hash of every live cube, for the separation pass. */
  private cells = new Map<number, number[]>();

  constructor(max: number, private solid: Solid, private onImpact: ImpactFn) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.quat = new Float32Array(max * 4);
    this.spin = new Float32Array(max * 4);
    this.material = new Uint8Array(max);
    this.state = new Uint8Array(max);
    this.age = new Float32Array(max);
    this.cooldown = new Float32Array(max);
    this.tags = new Array(max).fill(null);
    this.fuse = new Float32Array(max);
    this.stepped = new Uint8Array(max);
    this.unsettled = new Uint8Array(max);
  }

  isBomb(i: number) { return this.fuse[i] > 0; }

  get count() { return this.alive; }
  isAlive(i: number) { return this.state[i] !== 0; }
  isResting(i: number) { return this.state[i] === RESTING; }

  /** Spawns a cube; when the ring is full, the slot at the cursor (the oldest) is reused. */
  spawn(material: number, x: number, y: number, z: number, vx = 0, vy = 0, vz = 0): number {
    let i = this.cursor;
    if (this.alive < this.max) while (this.state[i]) i = (i + 1) % this.max;
    else {
      // full: reuse the oldest slot that isn't a live bomb
      for (let k = 0; k < this.max && this.fuse[i] > 0; k++) i = (i + 1) % this.max;
      this.alive--;
    }
    this.alive++;
    this.cursor = (i + 1) % this.max;
    const i3 = i * 3, i4 = i * 4;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.quat[i4] = 0; this.quat[i4 + 1] = 0; this.quat[i4 + 2] = 0; this.quat[i4 + 3] = 1;
    const ax = fx.random() - 0.5, ay = fx.random() - 0.5, az = fx.random() - 0.5;
    const al = Math.hypot(ax, ay, az) || 1;
    this.spin[i4] = ax / al; this.spin[i4 + 1] = ay / al; this.spin[i4 + 2] = az / al; this.spin[i4 + 3] = 3 + fx.random() * 6;
    this.material[i] = material;
    this.state[i] = MOVING;
    this.age[i] = 0;
    this.cooldown[i] = 0.25;
    this.tags[i] = null;
    this.fuse[i] = 0;
    this.unsettled[i] = 1;
    return i;
  }

  remove(i: number) {
    if (!this.state[i]) return;
    this.state[i] = 0;
    this.tags[i] = null;
    this.fuse[i] = 0;
    this.alive--;
  }

  /** Sets the velocity and wakes the cube, with fresh tumbling. */
  launch(i: number, vx: number, vy: number, vz: number, spin = 10) {
    const i3 = i * 3;
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.spin[i * 4 + 3] = spin;
    this.state[i] = MOVING;
  }

  /** Adds to the velocity (an intention or explosion hitting it). */
  push(i: number, vx: number, vy: number, vz: number) {
    const i3 = i * 3;
    this.launch(i, this.vel[i3] + vx, this.vel[i3 + 1] + vy, this.vel[i3 + 2] + vz, this.spin[i * 4 + 3] + 3);
  }

  /** Wakes every resting cube near a cell (its support may be gone). */
  wake(x: number, y: number, z: number, r = 1.6) {
    for (let i = 0; i < this.max; i++) {
      if (this.state[i] !== RESTING) continue;
      const i3 = i * 3;
      if (Math.abs(this.pos[i3] - x - 0.5) < r && Math.abs(this.pos[i3 + 1] - y - 0.5) < r + 0.5 && Math.abs(this.pos[i3 + 2] - z - 0.5) < r)
        this.state[i] = MOVING;
    }
  }

  /** Lifts cubes out of a cell that has just been filled. */
  clearCell(x: number, y: number, z: number) {
    for (let i = 0; i < this.max; i++) {
      if (!this.state[i]) continue;
      const i3 = i * 3;
      if (Math.abs(this.pos[i3] - x - 0.5) < 0.5 + HS && Math.abs(this.pos[i3 + 1] - y - 0.5) < 0.5 + HS && Math.abs(this.pos[i3 + 2] - z - 0.5) < 0.5 + HS) {
        this.pos[i3 + 1] = y + 1 + HS + 0.01;
        this.state[i] = MOVING;
      }
    }
  }

  /** Visible this frame? (blinks near the end of its life) */
  visible(i: number, time: number) {
    if (this.fuse[i] > 0) return this.fuse[i] > 1.2 || Math.floor(time * (this.fuse[i] < 0.5 ? 16 : 8)) % 2 === 0;
    const left = DEBRIS_LIFETIME - this.age[i];
    return left > DEBRIS_BLINK || Math.floor(time * (left < 3 ? 12 : 5)) % 2 === 0;
  }

  update(dt: number) {
    this.buildColumns();
    this.stepped.fill(0);
    for (let i = 0; i < this.max; i++) {
      const st = this.state[i];
      if (!st) continue;
      this.age[i] += dt;
      this.cooldown[i] -= dt;
      const i3 = i * 3;
      if (this.fuse[i] > 0) {
        this.fuse[i] -= dt;
        if (this.fuse[i] <= 0) {
          this.fuse[i] = 0;
          const x = this.pos[i3], y = this.pos[i3 + 1], z = this.pos[i3 + 2];
          this.remove(i);
          this.onFuse(i, x, y, z);
          continue;
        }
      } else if (this.age[i] > DEBRIS_LIFETIME) { this.remove(i); continue; }
      // walls never hold a cube: if something solid overlaps it (a block placed on it, a door
      // closing, a throw that started too close to a wall), push it out to the nearest free spot
      if (this.boxSolid(this.pos[i3], this.pos[i3 + 1], this.pos[i3 + 2])) { this.depenetrate(i); continue; }
      if (st === RESTING) {
        // lost its support (block broken, cube below picked up)? fall again
        if (this.supportTop(i, this.pos[i3], this.pos[i3 + 1] - HS - 0.04, this.pos[i3 + 2]) === null) this.state[i] = MOVING;
        continue;
      }
      this.step(i, dt);
      this.stepped[i] = 1;
      if (this.pos[i3 + 1] < -20) this.remove(i);
    }
    this.separate();
  }

  /**
   * Cubes never share space. Every cube that moved this frame is checked against its
   * neighbours (a cell hash); overlapping pairs are pushed apart along the axis of least
   * overlap, half each (all of it on the moving one when the other is resting), and the
   * push is cancelled for a cube if it would put it into a wall. A vertical overlap puts the
   * upper cube on top of the lower one. Pushed cubes stay "unsettled" and are re-checked on
   * the next frames until nothing overlaps them, so fresh spawns (several cubes created at the
   * same spot) and piles sort themselves out within a few frames.
   */
  private separate() {
    const S = DEBRIS_SIZE * 0.98;
    for (let i = 0; i < this.max; i++) if (this.stepped[i]) this.unsettled[i] = 1;
    for (let pass = 0; pass < 6; pass++) {
      this.cells.clear();
      for (let i = 0; i < this.max; i++) {
        if (!this.state[i]) continue;
        const k = cellKey(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
        let l = this.cells.get(k);
        if (!l) this.cells.set(k, (l = []));
        l.push(i);
      }
      let moved = false;
      for (let i = 0; i < this.max; i++) {
        if (!this.state[i] || !this.unsettled[i]) continue;
        let touched = false;
        const i3 = i * 3;
        const cx = Math.floor(this.pos[i3]), cy = Math.floor(this.pos[i3 + 1]), cz = Math.floor(this.pos[i3 + 2]);
        for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const l = this.cells.get(cellKeyInt(cx + dx, cy + dy, cz + dz));
          if (!l) continue;
          for (const j of l) {
            if (j === i || !this.state[j]) continue;
            if (this.unsettled[j] && j < i) continue; // each unsettled pair once
            if (this.pushApart(i, j, S)) { moved = true; touched = true; this.unsettled[j] = 1; }
          }
        }
        if (!touched && pass === 0) this.unsettled[i] = 0;
      }
      if (!moved) break;
    }
  }

  private pushApart(i: number, j: number, S: number): boolean {
    const i3 = i * 3, j3 = j * 3;
    const ox = this.pos[i3] - this.pos[j3], oy = this.pos[i3 + 1] - this.pos[j3 + 1], oz = this.pos[i3 + 2] - this.pos[j3 + 2];
    const px = S - Math.abs(ox), py = S - Math.abs(oy), pz = S - Math.abs(oz);
    if (px <= 0 || py <= 0 || pz <= 0) return false;
    // axis of least penetration; exact overlaps (same spawn spot) get a deterministic nudge
    let axis = px < py && px < pz ? 0 : py < pz ? 1 : 2;
    let d = axis === 0 ? ox : axis === 1 ? oy : oz;
    let pen = axis === 0 ? px : axis === 1 ? py : pz;
    if (Math.abs(d) < 1e-4) { axis = (i + j) % 2 === 0 ? 0 : 2; d = i < j ? 1 : -1; pen = S; }
    if (axis === 1) {
      // stacked: the upper cube sits on the lower one
      const up = oy > 0 ? i : j, low = up === i ? j : i;
      const u3 = up * 3, l3 = low * 3, old = this.pos[u3 + 1];
      this.pos[u3 + 1] = this.pos[l3 + 1] + DEBRIS_SIZE;
      if (this.boxSolid(this.pos[u3], this.pos[u3 + 1], this.pos[u3 + 2])) {
        // no room above: slide it sideways instead
        this.pos[u3 + 1] = old;
        axis = Math.abs(ox) > Math.abs(oz) ? 0 : 2;
        d = axis === 0 ? ox : oz;
        if (Math.abs(d) < 1e-4) d = i < j ? 1 : -1;
        pen = S - Math.abs(axis === 0 ? ox : oz);
      } else {
        if (this.vel[u3 + 1] < this.vel[l3 + 1]) this.vel[u3 + 1] = this.vel[l3 + 1];
        return true;
      }
    }
    const dir = Math.sign(d) || 1;
    const jRests = this.state[j] === RESTING && !this.stepped[j];
    if (this.state[i] === RESTING && this.state[j] === RESTING) this.state[i] = MOVING;
    const shareI = jRests ? 1 : 0.5, shareJ = 1 - shareI;
    const tryMove = (k: number, amount: number) => {
      if (amount === 0) return 0;
      const k3 = k * 3, old = this.pos[k3 + axis];
      this.pos[k3 + axis] = old + amount;
      if (this.boxSolid(this.pos[k3], this.pos[k3 + 1], this.pos[k3 + 2])) { this.pos[k3 + axis] = old; return 0; }
      return amount;
    };
    const gotI = tryMove(i, dir * pen * shareI);
    // whatever the first cube couldn't take (a wall behind it), the other one takes
    const gotJ = tryMove(j, -dir * (pen * shareJ + (pen * shareI - Math.abs(gotI))));
    if (Math.abs(gotI) + Math.abs(gotJ) < pen * 0.5) {
      // boxed in sideways (a full pit): climb on top of the other cube instead
      const up = this.pos[i3 + 1] >= this.pos[j3 + 1] ? i : j, low = up === i ? j : i;
      const u3 = up * 3, old = this.pos[u3 + 1];
      this.pos[u3 + 1] = this.pos[low * 3 + 1] + DEBRIS_SIZE;
      if (this.boxSolid(this.pos[u3], this.pos[u3 + 1], this.pos[u3 + 2])) this.pos[u3 + 1] = old;
      else { this.state[up] = MOVING; this.vel[u3 + 1] = Math.max(0, this.vel[u3 + 1]); }
    }
    // kill the closing speed along that axis so they don't keep pressing into each other
    const rel = this.vel[i3 + axis] - this.vel[j3 + axis];
    if (rel * dir < 0) {
      this.vel[i3 + axis] -= rel * shareI;
      if (!jRests) this.vel[j3 + axis] += rel * shareJ;
    }
    if (jRests && axis !== 1) this.state[i] = MOVING;
    return true;
  }

  private step(i: number, dt: number) {
    const i3 = i * 3;
    let vx = this.vel[i3], vy = this.vel[i3 + 1] - G * dt, vz = this.vel[i3 + 2];
    let impact = 0;
    // substeps so fast cubes don't tunnel through walls
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(vx), Math.abs(vy), Math.abs(vz)) * dt / 0.3));
    const h = dt / n;
    let landed = false;
    for (let s = 0; s < n; s++) {
      let x = this.pos[i3] + vx * h;
      if (this.boxSolid(x, this.pos[i3 + 1], this.pos[i3 + 2])) { impact = Math.max(impact, Math.abs(vx)); vx *= -0.35; x = this.pos[i3]; }
      this.pos[i3] = x;
      let z = this.pos[i3 + 2] + vz * h;
      if (this.boxSolid(this.pos[i3], this.pos[i3 + 1], z)) { impact = Math.max(impact, Math.abs(vz)); vz *= -0.35; z = this.pos[i3 + 2]; }
      this.pos[i3 + 2] = z;
      let y = this.pos[i3 + 1] + vy * h;
      if (vy > 0) {
        if (this.boxSolid(this.pos[i3], y, this.pos[i3 + 2])) { impact = Math.max(impact, vy); vy = 0; y = this.pos[i3 + 1]; }
      } else {
        const top = this.supportTop(i, this.pos[i3], y - HS, this.pos[i3 + 2]);
        if (top !== null) {
          y = top + HS;
          impact = Math.max(impact, -vy);
          vy = -vy * 0.28;
          vx *= 0.72; vz *= 0.72;
          this.spin[i * 4 + 3] *= 0.6;
          landed = true;
          if (vy < 1.6) vy = 0;
        }
      }
      this.pos[i3 + 1] = y;
    }
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    if (landed && vy === 0 && vx * vx + vz * vz < 0.5) {
      this.state[i] = RESTING;
      this.vel[i3] = 0; this.vel[i3 + 2] = 0;
      this.settleRotation(i);
    } else this.integrateSpin(i, dt);
    if (this.tags[i] && impact > 3.5) this.onImpact(i, this.pos[i3], this.pos[i3 + 1], this.pos[i3 + 2], impact);
  }

  /**
   * Moves an overlapping cube to the closest free position (searching outwards along the six
   * axes, up first on ties) and gives it a little push that way. If nothing is free within
   * two blocks the cube is removed rather than left inside the wall.
   */
  private depenetrate(i: number) {
    const i3 = i * 3;
    const x = this.pos[i3], y = this.pos[i3 + 1], z = this.pos[i3 + 2];
    const dirs: [number, number, number][] = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]];
    for (let d = 0.05; d <= 2; d += 0.05) {
      for (const [dx, dy, dz] of dirs) {
        const nx = x + dx * d, ny = y + dy * d, nz = z + dz * d;
        if (this.boxSolid(nx, ny, nz)) continue;
        this.pos[i3] = nx; this.pos[i3 + 1] = ny; this.pos[i3 + 2] = nz;
        this.vel[i3] = dx * 2; this.vel[i3 + 1] = Math.max(0, dy * 2); this.vel[i3 + 2] = dz * 2;
        this.state[i] = MOVING;
        return;
      }
    }
    this.remove(i);
  }

  /** Is the cube's box (centre x,y,z) overlapping a solid voxel? */
  private boxSolid(x: number, y: number, z: number) {
    const e = 0.001;
    const x0 = Math.floor(x - HS + e), x1 = Math.floor(x + HS - e);
    const y0 = Math.floor(y - HS + e), y1 = Math.floor(y + HS - e);
    const z0 = Math.floor(z - HS + e), z1 = Math.floor(z + HS - e);
    for (let zz = z0; zz <= z1; zz++) for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++)
      if (this.solid(xx, yy, zz)) return true;
    return false;
  }

  /** Top of whatever is right below `bottom` (a voxel or a resting cube), or null in free fall. */
  private supportTop(self: number, x: number, bottom: number, z: number): number | null {
    let best: number | null = null;
    const fy = Math.floor(bottom);
    const e = 0.02;
    for (const cx of [x - HS + e, x + HS - e]) for (const cz of [z - HS + e, z + HS - e]) {
      if (this.solid(Math.floor(cx), fy, Math.floor(cz))) {
        const t = fy + 1;
        if (bottom <= t && bottom > t - 0.6) best = best === null ? t : Math.max(best, t);
      }
    }
    const list = this.columns.get(colKey(Math.floor(x), Math.floor(z)));
    if (list) for (const j of list) {
      if (j === self || this.state[j] !== RESTING) continue;
      const j3 = j * 3;
      if (Math.abs(this.pos[j3] - x) > DEBRIS_SIZE * 0.8 || Math.abs(this.pos[j3 + 2] - z) > DEBRIS_SIZE * 0.8) continue;
      const t = this.pos[j3 + 1] + HS;
      if (bottom <= t && bottom > t - 0.5) best = best === null ? t : Math.max(best, t);
    }
    return best;
  }

  private buildColumns() {
    this.columns.clear();
    for (let i = 0; i < this.max; i++) {
      if (this.state[i] !== RESTING) continue;
      const i3 = i * 3;
      // register in every column the cube overlaps, so neighbours find it
      const xa = Math.floor(this.pos[i3] - HS), xb = Math.floor(this.pos[i3] + HS);
      const za = Math.floor(this.pos[i3 + 2] - HS), zb = Math.floor(this.pos[i3 + 2] + HS);
      for (let cx = xa; cx <= xb; cx++) for (let cz = za; cz <= zb; cz++) {
        const k = colKey(cx, cz);
        let l = this.columns.get(k);
        if (!l) this.columns.set(k, (l = []));
        l.push(i);
      }
    }
  }

  private integrateSpin(i: number, dt: number) {
    const i4 = i * 4;
    const a = this.spin[i4 + 3] * dt * 0.5, s = Math.sin(a);
    const dx = this.spin[i4] * s, dy = this.spin[i4 + 1] * s, dz = this.spin[i4 + 2] * s, dw = Math.cos(a);
    const qx = this.quat[i4], qy = this.quat[i4 + 1], qz = this.quat[i4 + 2], qw = this.quat[i4 + 3];
    this.quat[i4] = qw * dx + qx * dw + qy * dz - qz * dy;
    this.quat[i4 + 1] = qw * dy - qx * dz + qy * dw + qz * dx;
    this.quat[i4 + 2] = qw * dz + qx * dy - qy * dx + qz * dw;
    this.quat[i4 + 3] = qw * dw - qx * dx - qy * dy - qz * dz;
  }

  /** Resting cubes sit flat: keep only a random yaw so piles look like real blocks. */
  private settleRotation(i: number) {
    const i4 = i * 4;
    const yaw = fx.random() * Math.PI * 2;
    this.quat[i4] = 0; this.quat[i4 + 1] = Math.sin(yaw / 2); this.quat[i4 + 2] = 0; this.quat[i4 + 3] = Math.cos(yaw / 2);
  }
}

function colKey(x: number, z: number) { return (x + 4096) * 8192 + (z + 4096); }
function cellKeyInt(x: number, y: number, z: number) { return ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512); }
function cellKey(x: number, y: number, z: number) { return cellKeyInt(Math.floor(x), Math.floor(y), Math.floor(z)); }
