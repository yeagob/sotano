// The dash of the Irimi practice (docs/design/built/practices/DASH.md). Pure geometry: the Player moves
// its body through the voxel collision along the displacement this returns.

import type { DashDir } from '../input/gestures';

/** Blocks covered by one dash, on the ground or in the air. */
export const DASH_DIST = 4.5;
/** Seconds the dash lasts: 4.5 blocks in 0.18 s. */
export const DASH_TIME = 0.18;
/** Seconds from the start of one dash to the next. */
export const DASH_COOLDOWN = 0.8;
/** A forward dash follows the camera pitch, up or down, but never by more than this many blocks vertically. */
export const DASH_RISE = 3.5;
/** In water (wading or swimming) a dash covers half the distance. */
export const DASH_FLUID = 0.5;
export const DASH_DAMAGE = 7;
export const DASH_MINING = 27;
export const DASH_REACH = 0.25;
export const DASH_SAMPLE = 0.25;
const EDGE = 1e-3;

export interface DashVector { x: number; y: number; z: number }
export interface DashBox { x: number; y: number; z: number; hw: number; h: number }
export type DashCell = [number, number, number];

export function dashCells(b: DashBox, floorY = -Infinity): DashCell[] {
  const cells: DashCell[] = [];
  const x0 = Math.floor(b.x - b.hw + EDGE), x1 = Math.floor(b.x + b.hw - EDGE);
  const y0 = Math.max(floorY, Math.floor(b.y + EDGE)), y1 = Math.floor(b.y + b.h - EDGE);
  const z0 = Math.floor(b.z - b.hw + EDGE), z1 = Math.floor(b.z + b.hw - EDGE);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) cells.push([x, y, z]);
  return cells;
}

export function dashTouches(from: DashVector, b: DashBox, t: DashBox, reach = DASH_REACH): boolean {
  const dx = b.x - from.x, dy = b.y - from.y, dz = b.z - from.z;
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dy, dz) / DASH_SAMPLE));
  for (let i = 0; i <= n; i++) {
    const k = i / n, x = from.x + dx * k, y = from.y + dy * k, z = from.z + dz * k;
    if (Math.abs(x - t.x) > b.hw + t.hw + reach || Math.abs(z - t.z) > b.hw + t.hw + reach) continue;
    if (y + b.h + reach < t.y || y - reach > t.y + t.h) continue;
    return true;
  }
  return false;
}

/**
 * The displacement of one dash, in blocks. Directions are the camera's: forward is the way you look (its
 * horizontal part, and its vertical part when you look up or down, capped at DASH_RISE); back, left and
 * right stay horizontal. Same axes as Player.walk: forward is (-sin yaw, -cos yaw), right is (cos yaw, -sin yaw).
 */
export function dashDisplacement(dir: DashDir, yaw: number, pitch: number, fluid: boolean): DashVector {
  const k = fluid ? DASH_FLUID : 1;
  const sin = Math.sin(yaw), cos = Math.cos(yaw);
  const fx = -sin, fz = -cos, rx = cos, rz = -sin;
  let hx: number, hz: number, vy = 0;
  switch (dir) {
    case 'forward': {
      const cp = Math.cos(pitch);
      hx = fx * DASH_DIST * cp; hz = fz * DASH_DIST * cp;
      vy = Math.max(-DASH_RISE, Math.min(DASH_RISE, Math.sin(pitch) * DASH_DIST));
      break;
    }
    case 'back': hx = -fx * DASH_DIST; hz = -fz * DASH_DIST; break;
    case 'left': hx = -rx * DASH_DIST; hz = -rz * DASH_DIST; break;
    case 'right': hx = rx * DASH_DIST; hz = rz * DASH_DIST; break;
  }
  return { x: hx * k, y: vy * k, z: hz * k };
}
