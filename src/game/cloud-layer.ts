// The cloud layer above the route's top pad (STARS.md): a flat sheet of soft cloud the body passes through. It has no solids
// (the voxel world never sees it); the sky opens where the feet pass its height (sky/gate.ts). Unlit and baked, like every
// cube of the world (ART-GUIDE §4), in the cloud tokens of the sky blocks: a dark underside, a base, and a lit top.

import * as THREE from 'three';
import { pal } from '../content/palette';
import type { CloudSpot } from '../world/tree';

export class CloudLayer {
  readonly group = new THREE.Group();

  constructor(parent: THREE.Object3D) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const slab = (w: number, d: number, y: number, h: number, color: number, x: number, z: number) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
      m.scale.set(w, h, d);
      m.position.set(x, y + h / 2, z);
      this.group.add(m);
    };
    // one billow over the top pad's centre, and a ring of eight round it: each a dark underside, a base and a lit crest
    const billows: [number, number, number][] = [[0, 0, 4.4]];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      billows.push([Math.cos(a) * 3.1, Math.sin(a) * 3.1, 2.8]);
    }
    for (const [x, z, w] of billows) {
      slab(w, w * 0.8, -0.1, 0.4, pal('mat.cloud.dark'), x, z);
      slab(w * 0.82, w * 0.66, 0.3, 0.3, pal('mat.cloud.base'), x, z);
      slab(w * 0.5, w * 0.4, 0.6, 0.15, pal('mat.cloud.hi'), x, z);
    }
    this.group.visible = false;
    parent.add(this.group);
  }

  /** Draws the layer at its spot, or hides it when the stars are not grown yet. */
  place(at: CloudSpot | null) {
    this.group.visible = at !== null;
    if (at) this.group.position.set(at.x, at.y, at.z);
  }
}
