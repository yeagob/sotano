// The running and crouching body (docs/design/built/practices/RUN-AND-CROUCH.md). Pure functions over the
// voxel solid test, so the tests drive them with plain numbers.

import * as THREE from 'three';
import type { Body } from '../physics/voxel-collide';

type Solid = (x: number, y: number, z: number) => boolean;

/** The standing body (Player.body.h) and eye height. */
export const STAND_H = 1.8;
export const EYE_STAND = 1.62;
/** Crouched: one block shorter, so it fits a gap one block high. The eye drops with the head. */
export const CROUCH_H = STAND_H - 1;
export const EYE_CROUCH = EYE_STAND - 1;

/** Horizontal speed multipliers (on top of the moveSpeed stat). Crouching wins over running. */
export const RUN_SPEED = 1.45;
export const CROUCH_SPEED = 0.45;

/**
 * Where an intention leaves the body: from the eye, a little to the side of the casting hand, a little below and ahead.
 * The eye drops with the crouch (EYE_CROUCH), so a crouched body casts from its crouched height (Walk Slowly, #364).
 */
export function castOrigin(eye: THREE.Vector3, right: THREE.Vector3, side: number, dir: THREE.Vector3): THREE.Vector3 {
  return eye.clone().addScaledVector(right, 0.18 * side).add(new THREE.Vector3(0, -0.12, 0)).addScaledVector(dir, 0.3);
}

/** A crouched body takes half the contact damage of a projection, rounded up to whole points. */
export function crouchedContact(points: number): number {
  return Math.ceil(points / 2);
}

/**
 * Whether the head has room to stand: no solid cell in the band the standing body fills above the crouched
 * top, under its footprint. A ceiling one block up keeps the body crouched until there is room.
 */
export function roomToStand(solid: Solid, b: Pick<Body, 'x' | 'y' | 'z' | 'hw'>): boolean {
  const e = 1e-4;
  const x0 = Math.floor(b.x - b.hw + e), x1 = Math.floor(b.x + b.hw - e);
  const z0 = Math.floor(b.z - b.hw + e), z1 = Math.floor(b.z + b.hw - e);
  const top = b.y + STAND_H - e;
  for (let y = Math.floor(b.y + CROUCH_H); y < top; y++)
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
      if (solid(x, y, z)) return false;
  return true;
}

/**
 * Whether a body standing on the ground at (x, z) has ground under any part of its footprint, the cell
 * just below its feet. A crouched body is held on the ledge with this test (Minecraft's sneak).
 */
export function supportedAt(solid: Solid, b: Pick<Body, 'y' | 'hw'>, x: number, z: number): boolean {
  const e = 1e-4;
  const y = Math.floor(b.y - e);
  const x0 = Math.floor(x - b.hw + e), x1 = Math.floor(x + b.hw - e);
  const z0 = Math.floor(z - b.hw + e), z1 = Math.floor(z + b.hw - e);
  for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++)
    if (solid(xx, y, zz)) return true;
  return false;
}
