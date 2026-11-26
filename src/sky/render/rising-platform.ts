// The last checkpoint as it rises into the Sun (the ending of illumination, ILLUMINATION.md). The platform's cells
// leave the voxel world when the rise begins and this box takes their place: the same material, unlit and baked
// with the chunk mesher's face shading (top, sides, bottom), so the platform the player stood on is the one that rises.

import * as THREE from 'three';
import { materialTexture } from '../../render/atlas';
import type { Vec3 } from '../types';

/** The face shading of the chunk mesher (world/elem-mesher.ts): top, sides, bottom. */
const SHADE_TOP = 1, SHADE_SIDE = 0.82, SHADE_BOTTOM = 0.6;
/** The platform's solid: two layers under its walking surface (chain.ts). */
const LAYERS = 2;

export class RisingPlatformView {
  private readonly mesh: THREE.Mesh;
  private readonly mats: THREE.MeshBasicMaterial[];
  private readonly map: THREE.Texture | null;

  /** `w` × `d` cells of `material`; positioned by its top centre. */
  constructor(private readonly root: THREE.Object3D, w: number, d: number, material: number) {
    // the texture needs a canvas: in a test (no document) the box keeps the shading alone
    this.map = typeof document === 'undefined' ? null : materialTexture(material);
    if (this.map) { this.map.wrapS = this.map.wrapT = THREE.RepeatWrapping; }
    const shade = (s: number, rx: number, ry: number) => {
      const map = this.map?.clone() ?? null;
      if (map) { map.repeat.set(rx, ry); map.needsUpdate = true; }
      return new THREE.MeshBasicMaterial({ map, color: new THREE.Color(s, s, s) });
    };
    // BoxGeometry's face order: +x, −x, +y, −y, +z, −z
    this.mats = [
      shade(SHADE_SIDE, d, LAYERS), shade(SHADE_SIDE, d, LAYERS),
      shade(SHADE_TOP, w, d), shade(SHADE_BOTTOM, w, d),
      shade(SHADE_SIDE, w, LAYERS), shade(SHADE_SIDE, w, LAYERS),
    ];
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(w, LAYERS, d), this.mats);
    root.add(this.mesh);
  }

  /** Puts the platform's top centre at `top`. */
  place(top: Vec3) {
    this.mesh.position.set(top.x, top.y - LAYERS / 2, top.z);
  }

  dispose() {
    this.root.remove(this.mesh);
    this.mesh.geometry.dispose();
    for (const m of this.mats) { m.map?.dispose(); m.dispose(); }
    this.map?.dispose();
  }
}
