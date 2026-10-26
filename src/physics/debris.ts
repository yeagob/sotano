// Loose blocks: a broken block becomes a cube that falls, tumbles, settles, can be picked up,
// kicked or thrown, and despawns after a while (see docs/DESIGN.md §5).
//
// Same approach as the Joel gift project, which handled thousands of cubes smoothly:
// no physics engine, just typed arrays and a ring buffer. Each cube is an axis-aligned box
// moved one axis at a time against the voxel grid; resting cubes act as floor for falling
// ones (via a per-column hash), so piles stack. Rotation is visual only.

export const DEBRIS_SIZE = 0.72;     // loose cube edge length
export const DEBRIS_LIFETIME = 90;   // seconds until it despawns
export const DEBRIS_BLINK = 8;       // blinks for the last seconds

const G = 26;
const HS = DEBRIS_SIZE / 2;
const MOVING = 1, RESTING = 2;

type Solid = (x: number, y: number, z: number) => boolean;

/** Called when a tagged (thrown/kicked) cube hits something hard. */
export type ImpactFn = (i: number, x: number, y: number, z: number, speed: number) => void;

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
  private cursor = 0;
  private alive = 0;
  /** Column hash of resting cubes: key → indices. Rebuilt every frame. */
  private columns = new Map<number, number[]>();

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
  }

  get count() { return this.alive; }
  isAlive(i: number) { return this.state[i] !== 0; }
  isResting(i: number) { return this.state[i] === RESTING; }

  /** Spawns a cube; when the ring is full, the slot at the cursor (the oldest) is reused. */
  spawn(material: number, x: number, y: number, z: number, vx = 0, vy = 0, vz = 0): number {
    let i = this.cursor;
    if (this.alive < this.max) while (this.state[i]) i = (i + 1) % this.max;
    else this.alive--;
    this.alive++;
    this.cursor = (i + 1) % this.max;
    const i3 = i * 3, i4 = i * 4;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z;
    this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.quat[i4] = 0; this.quat[i4 + 1] = 0; this.quat[i4 + 2] = 0; this.quat[i4 + 3] = 1;
    const ax = Math.random() - 0.5, ay = Math.random() - 0.5, az = Math.random() - 0.5;
    const al = Math.hypot(ax, ay, az) || 1;
    this.spin[i4] = ax / al; this.spin[i4 + 1] = ay / al; this.spin[i4 + 2] = az / al; this.spin[i4 + 3] = 3 + Math.random() * 6;
    this.material[i] = material;
    this.state[i] = MOVING;
    this.age[i] = 0;
    this.cooldown[i] = 0.25;
    this.tags[i] = null;
    return i;
  }

  remove(i: number) {
    if (!this.state[i]) return;
    this.state[i] = 0;
    this.tags[i] = null;
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
    const left = DEBRIS_LIFETIME - this.age[i];
    return left > DEBRIS_BLINK || Math.floor(time * (left < 3 ? 12 : 5)) % 2 === 0;
  }

  update(dt: number) {
    this.buildColumns();
    for (let i = 0; i < this.max; i++) {
      const st = this.state[i];
      if (!st) continue;
      this.age[i] += dt;
      this.cooldown[i] -= dt;
      if (this.age[i] > DEBRIS_LIFETIME) { this.remove(i); continue; }
      const i3 = i * 3;
      if (st === RESTING) {
        // lost its support (block broken, cube below picked up)? fall again
        if (this.supportTop(i, this.pos[i3], this.pos[i3 + 1] - HS - 0.04, this.pos[i3 + 2]) === null) this.state[i] = MOVING;
        continue;
      }
      this.step(i, dt);
      if (this.pos[i3 + 1] < -20) this.remove(i);
    }
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
    const yaw = Math.random() * Math.PI * 2;
    this.quat[i4] = 0; this.quat[i4 + 1] = Math.sin(yaw / 2); this.quat[i4 + 2] = 0; this.quat[i4 + 3] = Math.cos(yaw / 2);
  }
}

function colKey(x: number, z: number) { return (x + 4096) * 8192 + (z + 4096); }
