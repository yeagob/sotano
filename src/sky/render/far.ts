// Far views (docs/architecture/SKY.md §11): a view that hangs farther than the camera's comfortable reach is drawn
// on the same line at FAR_DRAW, scaled down by the same factor, so its angular size is kept and its centre stays
// inside the camera's far plane. Views are backdrops: their materials never write depth, and they draw before the blocks.

import type * as THREE from 'three';
import type { Vec3 } from '../types';

/**
 * Past this distance (blocks) a view is drawn at this distance, scaled to keep its angular size. The camera's far plane
 * (200 in game) bounds the group's centre, which stays at most this far from the eye. A view's radius adds to that: a
 * sphere whose corona is 90 can reach past 200 at its far edge, but its visible front is inside.
 */
export const FAR_DRAW = 150;

/**
 * Places `group` for the view centred at `centre`, seen from `eye`, whose outer radius is `radius` (blocks at its true
 * distance). Returns the radius as drawn, so the caller can check the angular size: drawn / drawn distance = radius / d.
 */
export function placeFar(group: THREE.Object3D, eye: Vec3, centre: Vec3, radius: number): number {
  const dx = centre.x - eye.x, dy = centre.y - eye.y, dz = centre.z - eye.z;
  const d = Math.hypot(dx, dy, dz);
  if (d <= FAR_DRAW || d === 0) {
    group.position.set(centre.x, centre.y, centre.z);
    group.scale.setScalar(1);
    return radius;
  }
  const k = FAR_DRAW / d;
  group.position.set(eye.x + dx * k, eye.y + dy * k, eye.z + dz * k);
  group.scale.setScalar(k);
  return radius * k;
}

/** A view's meshes as a backdrop, once: no depth writes, drawn before every block (renderOrder -1). */
export function backdrop(group: THREE.Object3D): void {
  group.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.renderOrder = -1;
    for (const m of ([] as THREE.Material[]).concat(mesh.material)) m.depthWrite = false;
  });
}
