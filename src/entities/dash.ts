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

export interface DashVector { x: number; y: number; z: number }

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
