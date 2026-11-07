// Gaits the minions compose: walking, climbing, hanging, rolling, stalking, leaping (docs/architecture/SKY.md §5.4).
// A gait moves one minion's body toward a place for one tick and says whether it is there. A gait that does not
// apply this tick (no face to climb, no slope to roll down) leaves the body untouched, so `compose` can try the
// next one. Every gait is deterministic for a fixed dt: no randomness, and per-minion state is keyed by actor id.
// A place's (x, y, z) is the cell its walker's feet stand in; a minion aims at that cell's centre.

import { moveBody } from '../../physics/voxel-collide';
import type { Gait, MinionCtx, Place, SkyActor, Vec3 } from '../types';

/** Blocks a second squared: the same pull as the player's world. */
export const GRAVITY = 24;
/** Horizontal distance at which a minion counts as arrived. */
export const ARRIVE = 0.35;
/** Vertical distance, in blocks, within which an arrival counts. */
const ARRIVE_Y = 1;
/** Blocks a second along an underside for a hanging minion. */
export const HANG_SPEED = 1.2;
/** Blocks a second for a minion that keeps its place in file. */
export const FILE_SPEED = 1.2;
/** Blocks a file keeps behind its leader. */
export const FILE_GAP = 1.5;
/** Blocks a second for a bounding minion between its leaps. */
export const BOUND_SPEED = 3;
/** Seconds of a pounce's arc. */
export const POUNCE_TIME = 0.7;
/** The arc's peak, in blocks above the higher end. */
const POUNCE_PEAK = 1.5;
/** A pounce needs at least this much distance; closer, the minion walks. */
const POUNCE_MIN = 2;
const MAX_FALL = 30;

type Solid = (x: number, y: number, z: number) => boolean;

const solidOf = (ctx: MinionCtx): Solid => {
  const w = ctx.host.world();
  return (x, y, z) => w.solid(x, y, z);
};

/** The point a minion aims at: the centre of the place's feet cell. */
export const aimAt = (to: Place): Vec3 => ({ x: to.x + 0.5, y: to.y, z: to.z + 0.5 });

/** Whether the body stands at the place (horizontally close, within a block of its height). */
export function arrived(m: SkyActor, to: Place): boolean {
  const b = m.body, p = aimAt(to);
  return Math.hypot(p.x - b.x, p.z - b.z) <= ARRIVE && Math.abs(p.y - b.y) <= ARRIVE_Y;
}

/** Whether a body-sized box at feet (x, y, z) is clear of solid cells. */
function clear(solid: Solid, x: number, y: number, z: number, hw: number, h: number): boolean {
  for (let cy = Math.floor(y); cy < Math.ceil(y + h); cy++)
    for (let cz = Math.floor(z - hw); cz <= Math.floor(z + hw); cz++)
      for (let cx = Math.floor(x - hw); cx <= Math.floor(x + hw); cx++)
        if (solid(cx, cy, cz)) return false;
  return true;
}

/**
 * Walks toward (tx, tz) at `speed` under gravity, colliding with the world; a blocked grounded body hops up to
 * `stepUp` blocks when the cells above the step are clear.
 */
function stride(solid: Solid, m: SkyActor, tx: number, tz: number, speed: number, stepUp: number, dt: number) {
  const b = m.body;
  const x0 = b.x, z0 = b.z;
  const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
  const v = d > 1e-6 && dt > 0 ? Math.min(speed, d / dt) : 0;
  b.vx = d > 1e-6 ? (dx / d) * v : 0;
  b.vz = d > 1e-6 ? (dz / d) * v : 0;
  b.vy = Math.max(-MAX_FALL, b.vy - GRAVITY * dt);
  const grounded = b.onGround;
  moveBody(solid, b, dt);
  const want = v * dt, got = Math.hypot(b.x - x0, b.z - z0);
  if (!grounded || want < 1e-4 || got >= want * 0.5 || stepUp <= 0) return;
  const ax = b.x + (dx / d) * (b.hw + 0.5), az = b.z + (dz / d) * (b.hw + 0.5);
  for (let k = 1; k <= stepUp; k++) {
    const top = Math.floor(b.y) + k;
    if (!solid(Math.floor(ax), top - 1, Math.floor(az))) break;
    if (clear(solid, ax, top, az, b.hw, b.h) && clear(solid, b.x, b.y, b.z, b.hw, b.h + k)) {
      b.vy = Math.sqrt(2 * GRAVITY * (k + 0.3));
      return;
    }
  }
}

/** A walking gait: `speed` blocks a second, stepping up one block. */
export const walk = (speed: number): Gait => ({
  id: 'walk',
  step: (m, ctx, to, dt) => {
    if (arrived(m, to)) return true;
    const p = aimAt(to);
    stride(solidOf(ctx), m, p.x, p.z, speed, 1, dt);
    return arrived(m, to);
  },
});

/**
 * Seconds per block climbed up a face. Applies only when the place is above the minion and a solid face stands
 * beside it toward the place: the minion rises one block per `perBlock`, then steps over the lip.
 */
export const climbFace = (perBlock: number): Gait => ({
  id: 'climbFace',
  step: (m, ctx, to, dt) => {
    if (arrived(m, to)) return true;
    const b = m.body, p = aimAt(to), solid = solidOf(ctx);
    if (p.y <= b.y + 1e-3) return false;
    const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz);
    if (d < 1e-6) return false;
    const fx = Math.floor(b.x + (dx / d) * (b.hw + 0.5)), fz = Math.floor(b.z + (dz / d) * (b.hw + 0.5));
    // a face beside the body, from its feet to its head
    let face = false;
    for (let cy = Math.floor(b.y); cy < Math.ceil(b.y + b.h); cy++) if (solid(fx, cy, fz)) face = true;
    if (!face) return false;
    const rise = Math.min(dt / Math.max(0.05, perBlock), p.y - b.y);
    if (!clear(solid, b.x, b.y + rise, b.z, b.hw, b.h)) return false;
    b.y += rise;
    b.vx = 0; b.vy = 0; b.vz = 0;
    b.onGround = false;
    // at the lip: over the top, onto the face
    if (b.y >= p.y - 1e-6 && clear(solid, fx + 0.5, p.y, fz + 0.5, b.hw, b.h)) {
      b.x = fx + 0.5; b.z = fz + 0.5; b.y = p.y;
      b.onGround = true;
    }
    return arrived(m, to);
  },
});

/**
 * Hangs under a ceiling (a branch's underside) and moves along it. Applies only while a solid cell is directly
 * over the minion's head; the minion keeps its head under it and glides toward the place, ignoring gravity.
 */
export const hangUnder = (): Gait => ({
  id: 'hangUnder',
  step: (m, ctx, to, dt) => {
    const b = m.body, solid = solidOf(ctx), p = aimAt(to);
    const head = Math.floor(b.y + b.h + 0.05);
    if (!solid(Math.floor(b.x), head, Math.floor(b.z))) return false;
    const d = Math.hypot(p.x - b.x, p.z - b.z);
    if (d <= ARRIVE) return true;
    const ny = head - b.h - 0.01;
    const k = Math.min(1, (HANG_SPEED * dt) / d);
    const nx = b.x + (p.x - b.x) * k, nz = b.z + (p.z - b.z) * k;
    // keeps to the underside: never glides out from under it or into a wall
    if (!solid(Math.floor(nx), head, Math.floor(nz)) || !clear(solid, nx, ny, nz, b.hw, b.h)) return false;
    b.x = nx; b.y = ny; b.z = nz;
    b.vx = 0; b.vy = 0; b.vz = 0;
    b.onGround = false;
    return Math.hypot(p.x - b.x, p.z - b.z) <= ARRIVE;
  },
});

/** Tucks and rolls down a slope at `speed`. Applies only when the place is at least a block below. */
export const roll = (speed: number): Gait => ({
  id: 'roll',
  step: (m, ctx, to, dt) => {
    if (arrived(m, to)) return true;
    const p = aimAt(to);
    if (p.y > m.body.y - 1) return false;
    stride(solidOf(ctx), m, p.x, p.z, speed, 0, dt);
    return arrived(m, to);
  },
});

/** Keeps its place in file: walks behind its leader, `FILE_GAP` back. Without a leader it does not apply. */
export const file = (leader: () => SkyActor | null): Gait => ({
  id: 'file',
  step: (m, ctx, to, dt) => {
    const l = leader();
    if (!l || l === m) return false;
    const b = m.body, lb = l.body;
    const dx = lb.x - b.x, dz = lb.z - b.z, d = Math.hypot(dx, dz);
    if (d > FILE_GAP) {
      const k = (d - FILE_GAP) / d;
      stride(solidOf(ctx), m, b.x + dx * k, b.z + dz * k, FILE_SPEED, 1, dt);
    }
    return arrived(l, to) && Math.hypot(lb.x - b.x, lb.z - b.z) <= FILE_GAP + ARRIVE;
  },
});

/** Whether the player's view cone (half-angle `cone`, radians) holds the minion. */
export function seen(m: SkyActor, ctx: MinionCtx, cone: number): boolean {
  const pl = ctx.host.player(), b = m.body;
  const dx = b.x - pl.eye.x, dy = b.y + b.h / 2 - pl.eye.y, dz = b.z - pl.eye.z;
  const d = Math.hypot(dx, dy, dz), a = Math.hypot(pl.aim.x, pl.aim.y, pl.aim.z);
  if (d < 1e-6 || a < 1e-6) return true;
  return (dx * pl.aim.x + dy * pl.aim.y + dz * pl.aim.z) / (d * a) >= Math.cos(cone);
}

/** Speeds while seen and unseen; the half-angle of the player's view cone, radians. A watched stalker at speed 0 does not apply. */
export const stalk = (seenSpeed: number, unseen: number, cone: number): Gait => ({
  id: 'stalk',
  step: (m, ctx, to, dt) => {
    if (arrived(m, to)) return true;
    const speed = seen(m, ctx, cone) ? seenSpeed : unseen;
    if (speed <= 0) return false;
    const p = aimAt(to);
    stride(solidOf(ctx), m, p.x, p.z, speed, 1, dt);
    return arrived(m, to);
  },
});

/** Gallops toward the place; within `turnAt` of the player it veers away (passes close and turns). */
export const gallopLoop = (speed: number, turnAt: number): Gait => ({
  id: 'gallopLoop',
  step: (m, ctx, to, dt) => {
    if (arrived(m, to)) return true;
    const b = m.body, p = aimAt(to), pl = ctx.host.player().body;
    let dx = p.x - b.x, dz = p.z - b.z;
    const d = Math.hypot(dx, dz) || 1;
    dx /= d; dz /= d;
    const ax = b.x - pl.x, az = b.z - pl.z, ad = Math.hypot(ax, az);
    if (ad < turnAt && ad > 1e-6) {
      const w = 2 * (1 - ad / turnAt);
      dx += (ax / ad) * w; dz += (az / ad) * w;
      const n = Math.hypot(dx, dz) || 1;
      dx /= n; dz /= n;
    }
    const reach = Math.min(d, speed * dt + 1);
    stride(solidOf(ctx), m, b.x + dx * reach, b.z + dz * reach, speed, 1, dt);
    return arrived(m, to);
  },
});

/** Bounds: walks at `BOUND_SPEED` and leaps up to `maxStep` blocks onto what blocks it. */
export const bound = (maxStep: number): Gait => ({
  id: 'bound',
  step: (m, ctx, to, dt) => {
    if (arrived(m, to)) return true;
    const p = aimAt(to);
    stride(solidOf(ctx), m, p.x, p.z, BOUND_SPEED, Math.max(1, Math.floor(maxStep)), dt);
    return arrived(m, to);
  },
});

interface Arc { from: Vec3; to: Vec3; t: number }

/**
 * The longest ballistic arc, in blocks across. A grounded minion with the place within `arc` (and not too close)
 * leaps in a parabola that lands on the place's cell in `POUNCE_TIME`; it does not apply otherwise.
 */
export const pounce = (arc: number): Gait => {
  const arcs = new Map<number, Arc>();
  return {
    id: 'pounce',
    step: (m, ctx, to, dt) => {
      const b = m.body;
      let a = arcs.get(m.id);
      if (!a) {
        if (arrived(m, to)) return true;
        const p = aimAt(to);
        const d = Math.hypot(p.x - b.x, p.z - b.z);
        if (!b.onGround || d > arc || d < POUNCE_MIN) return false;
        a = { from: { x: b.x, y: b.y, z: b.z }, to: p, t: 0 };
        arcs.set(m.id, a);
        ctx.host.cue('core.puff', b.x, b.y, b.z);
      }
      a.t = Math.min(POUNCE_TIME, a.t + dt);
      const u = a.t / POUNCE_TIME;
      // a quadratic arc whose middle is the peak
      const c = 2 * (Math.max(a.from.y, a.to.y) + POUNCE_PEAK) - (a.from.y + a.to.y) / 2;
      b.x = a.from.x + (a.to.x - a.from.x) * u;
      b.z = a.from.z + (a.to.z - a.from.z) * u;
      b.y = (1 - u) * (1 - u) * a.from.y + 2 * u * (1 - u) * c + u * u * a.to.y;
      b.vx = 0; b.vy = 0; b.vz = 0;
      b.onGround = false;
      if (u < 1) return false;
      arcs.delete(m.id);
      b.onGround = true;
      ctx.host.fx('puff', b.x, b.y, b.z, 4);
      return true;
    },
  };
};

/** The first gait that moves this tick (or reports arrival) wins; the rest are not asked. */
export const compose = (...gaits: Gait[]): Gait => ({
  id: `compose(${gaits.map(g => g.id).join(',')})`,
  step: (m, ctx, to, dt) => {
    const b = m.body;
    for (const g of gaits) {
      const x = b.x, y = b.y, z = b.z;
      if (g.step(m, ctx, to, dt)) return true;
      if (b.x !== x || b.y !== y || b.z !== z) return false;
    }
    return false;
  },
});
