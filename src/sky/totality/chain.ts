// Totality's chain of platforms (docs/architecture/SKY.md §8): a spiral of hops from the crown up to the
// Sun's threshold. Every hop is a climb (rise 4–10, the third jump) or a rest (rise 0–3, the first two
// jumps); every sixth platform is a checkpoint; every takeoff and arc keeps a clear column of 15 blocks.
// Pure: integers, the run's fork and the reach envelope. No three.js.

import { MAT } from '../../content/materials';
import type { Fork, Hop, Place, Shape, TotalityPlan, Vec3 } from '../types';
import { maxGap } from './reach';
import { STRATA, sizeAt, stratumAt } from './strata';

/** Every sixth platform is a checkpoint. */
export const CHECKPOINT_EVERY = 6;
/** Blocks of formula air above every takeoff and arc. */
export const HEADROOM = 15;
/** The spiral stays within this radius of the axis. */
export const CHAIN_RADIUS = 100;
/** Radius of the spiral's centres round the axis: outside the crown's roof (radius 36, tree.ts), so the first platform's layers never sit in the roof's. */
export const SPIRAL_RADIUS = 42;
/** The platforms of the chain: 18 checkpoints, the last one before the threshold. */
export const PLATFORMS = 108;
/** The last checkpoint stands at this height: the strata end at 980 and the gate is six high above it. */
export const LAST_TOP = 964;
/** A platform's solid: two layers under its walking cell. */
const LAYERS = 2;
/** The sealed gate: a two-cell floor, then a wall five wide and six high. */
const GATE_WIDTH = 5;
const GATE_HEIGHT = 6;
/** How near (blocks) the player's body must come to the threshold to touch it. */
const TOUCH_RADIUS = 2;
/** Angle step tried when choosing where the next platform stands (radians). */
const STEP = Math.PI / 720;
/** The share of its widest gap a hop is drawn at, by stratum (the higher, the longer), and a rest's share. */
const GAP_SHARE = [0.6, 0.75, 0.85] as const;
const REST_SHARE = 0.6;
/** Rises drawn before the balance: climbs 8–10, rests 1–3 (within the bands of SKY.md §8). */
const CLIMB_DRAW: readonly [number, number] = [8, 10];
const REST_DRAW: readonly [number, number] = [1, 3];

/** A footprint in cells: x0 and z0 inclusive, x1 and z1 exclusive. */
export interface Footprint { x0: number; x1: number; z0: number; z1: number }

/** The cells a platform of centre (x, z) and extent w × d covers: the centre cell and the cells round it. */
export function footprint(p: { x: number; z: number; w: number; d: number }): Footprint {
  const x0 = p.x - Math.floor((p.w - 1) / 2), z0 = p.z - Math.floor((p.d - 1) / 2);
  return { x0, x1: x0 + p.w, z0, z1: z0 + p.d };
}

/** The horizontal gap between two footprints, edge to edge (0 when they touch or overlap). */
export function gapBetween(a: Footprint, b: Footprint): number {
  const gx = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1));
  const gz = Math.max(0, Math.max(a.z0, b.z0) - Math.min(a.z1, b.z1));
  return Math.hypot(gx, gz);
}

/** True for the checkpoints: every sixth platform, counted from the crown (indices 5, 11, …). */
export const isCheckpoint = (i: number) => (i + 1) % CHECKPOINT_EVERY === 0;

/** Moves the rises by one at a time, within each kind's draw range, until they sum to `total`. */
function balance(kinds: readonly ('climb' | 'rest')[], dys: number[], total: number): void {
  let residual = total - dys.reduce((a, b) => a + b, 0);
  for (let pass = 0; residual !== 0; pass++) {
    let moved = false;
    for (let i = 0; i < dys.length && residual !== 0; i++) {
      const [lo, hi] = kinds[i] === 'climb' ? CLIMB_DRAW : REST_DRAW;
      const step = residual > 0 ? 1 : -1;
      if (dys[i] + step < lo || dys[i] + step > hi) continue;
      dys[i] += step;
      residual -= step;
      moved = true;
    }
    if (!moved || pass > 1000) throw new Error(`totality: cannot balance the rises by ${residual}`);
  }
}

/** A platform's solid as a box shape, its two layers under the walking cell `top`. */
function slab(f: Footprint, top: number, m: number, tag: number): Shape {
  return { k: 'box', x0: f.x0, y0: top - LAYERS, z0: f.z0, x1: f.x1 - 1, y1: top - 1, z1: f.z1 - 1, m, tag };
}

/** True when a footprint at height `top` keeps clear of every earlier platform that could sit in its headroom. */
function clearOfEarlier(placed: readonly Place[], f: Footprint, top: number): boolean {
  for (const p of placed) {
    if (Math.abs(p.y - top) > HEADROOM + LAYERS) continue;
    if (gapBetween(footprint(p), f) < 2) return false;
  }
  return true;
}

/**
 * The chain from the crown up to the threshold. `crown` gives the axis (its x and z); the first platform
 * stands SPIRAL_RADIUS from it at the bottom of the strata. The rises draw from fork('sky', 'totality',
 * stratum), so the plan is the same whatever order the forks are asked for.
 */
export function buildTotality(fork: Fork, crown: Vec3): TotalityPlan {
  const axis = { x: Math.round(crown.x), z: Math.round(crown.z) };
  const base = STRATA[0].y0;
  const rngs = STRATA.map(s => fork('sky', 'totality', s.id));

  // 1. the rises: climb, climb, rest, and so on (two thirds climbs), each drawn in the stratum it starts in
  const kinds: ('climb' | 'rest')[] = [];
  const dys: number[] = [];
  let y = base;
  for (let h = 0; h < PLATFORMS - 1; h++) {
    const kind = h % 3 === 2 ? 'rest' : 'climb';
    const rng = rngs[(stratumAt(y) ?? STRATA[STRATA.length - 1]).id];
    const dy = kind === 'climb' ? rng.int(CLIMB_DRAW[0], CLIMB_DRAW[1]) : rng.int(REST_DRAW[0], REST_DRAW[1]);
    kinds.push(kind);
    dys.push(dy);
    y += dy;
  }
  balance(kinds, dys, LAST_TOP - base);

  // 2. the platforms: each on the ring round the axis, its gap set by its hop's envelope
  const tops: number[] = [base];
  for (const dy of dys) tops.push(tops[tops.length - 1] + dy);
  const platforms: Place[] = [];
  const hops: Hop[] = [];
  const shapes: Shape[] = [];
  const angles: number[] = [];
  const place = (i: number, cx: number, cz: number, angle: number) => {
    const top = tops[i], s = stratumAt(top) ?? STRATA[STRATA.length - 1];
    const size = isCheckpoint(i) ? 3 : sizeAt(s, top);
    const p: Place = { id: i, kind: 'top', x: cx, y: top, z: cz, w: size, d: size, tag: i + 1 };
    platforms.push(p);
    angles.push(angle);
    shapes.push(slab(footprint(p), top, s.materials[i % s.materials.length], i + 1));
  };
  place(0, axis.x + SPIRAL_RADIUS, axis.z, 0);

  for (let h = 0; h < PLATFORMS - 1; h++) {
    const to = h + 1, top = tops[to], dy = dys[h], kind = kinds[h];
    const s = stratumAt(top) ?? STRATA[STRATA.length - 1];
    const size = isCheckpoint(to) ? 3 : sizeAt(s, top);
    const reach = maxGap(kind, dy);
    if (reach === undefined) throw new Error(`totality: no reach for a rise of ${dy}`);
    const want = (kind === 'climb' ? GAP_SHARE[s.id] : REST_SHARE) * reach;
    const fromFoot = footprint(platforms[h]);
    // round the ring: keep the candidate whose gap is nearest the drawn one, inside the envelope
    let best: { gap: number; cx: number; cz: number; a: number } | null = null;
    for (let a = angles[h] + STEP; a < angles[h] + Math.PI; a += STEP) {
      const cx = Math.round(axis.x + SPIRAL_RADIUS * Math.cos(a));
      const cz = Math.round(axis.z + SPIRAL_RADIUS * Math.sin(a));
      const f = footprint({ x: cx, z: cz, w: size, d: size });
      const gap = gapBetween(fromFoot, f);
      if (gap < 1 || gap > reach || !clearOfEarlier(platforms, f, top)) continue;
      if (!best || Math.abs(gap - want) < Math.abs(best.gap - want)) best = { gap, cx, cz, a };
      if (gap > want + 1) break;
    }
    if (!best) throw new Error(`totality: no place for platform ${to}`);
    place(to, best.cx, best.cz, best.a);
    hops.push({ from: h, to, dy, gap: best.gap, kind });
  }

  // 3. the threshold: the last checkpoint's floor of sealed light, and the sealed gate beyond it, in the climbing direction
  const last = platforms[platforms.length - 1], before = platforms[platforms.length - 2];
  const lf = footprint(last);
  const seal = MAT.sunseal;
  const alongX = Math.abs(last.x - before.x) >= Math.abs(last.z - before.z);
  const forward = alongX ? last.x >= before.x : last.z >= before.z;
  const lo = alongX ? lf.x0 : lf.z0, hi = alongX ? lf.x1 : lf.z1;
  const acrossLo = alongX ? lf.z0 : lf.x0, acrossHi = alongX ? lf.z1 : lf.x1;
  const laneLo = acrossLo + Math.floor((acrossHi - acrossLo - GATE_WIDTH) / 2), laneHi = laneLo + GATE_WIDTH - 1;
  const floorLo = forward ? hi : lo - 2, floorHi = forward ? hi + 1 : lo - 1;
  const wall = forward ? hi + 2 : lo - 3;
  const floor: Shape = alongX
    ? { k: 'box', x0: floorLo, y0: last.y - LAYERS, z0: laneLo, x1: floorHi, y1: last.y - 1, z1: laneHi, m: seal }
    : { k: 'box', x0: laneLo, y0: last.y - LAYERS, z0: floorLo, x1: laneHi, y1: last.y - 1, z1: floorHi, m: seal };
  const gate: Shape = alongX
    ? { k: 'box', x0: wall, y0: last.y, z0: laneLo, x1: wall, y1: last.y + GATE_HEIGHT - 1, z1: laneHi, m: seal }
    : { k: 'box', x0: laneLo, y0: last.y, z0: wall, x1: laneHi, y1: last.y + GATE_HEIGHT - 1, z1: wall, m: seal };
  shapes.push(floor, gate);
  const across = (laneLo + laneHi + 1) / 2;
  const threshold = alongX
    ? { x: wall + 0.5, y: last.y, z: across, r: TOUCH_RADIUS }
    : { x: across, y: last.y, z: wall + 0.5, r: TOUCH_RADIUS };

  const checkpoints: number[] = [];
  for (let i = 0; i < platforms.length; i++) if (isCheckpoint(i)) checkpoints.push(i);
  return { strata: STRATA, shapes, platforms, hops, checkpoints, threshold };
}
