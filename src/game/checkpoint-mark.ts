// The checkpoint's world marker: a small cairn of light, drawn where the run's checkpoint stands
// (docs/design/built/practices/will/WAYMARK.md). Unlit and baked like every cube of the world (ART-GUIDE §4):
// stones in the bone tones, the light on top in the player's gold, breathing slowly (well under 3 Hz).

import * as THREE from 'three';
import { pal } from '../content/palette';
import type { Spot } from './checkpoint';

const BREATH_HZ = 0.5;
const LIGHT_SIZE = 0.16;

export class CheckpointMark {
  readonly group = new THREE.Group();
  private light: THREE.Mesh;
  private t = 0;

  constructor(parent: THREE.Object3D) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const block = (w: number, h: number, d: number, y: number, color: number) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
      m.scale.set(w, h, d);
      m.position.set(0, y + h / 2, 0);
      this.group.add(m);
      return m;
    };
    block(0.7, 0.3, 0.6, 0, pal('bone.faded'));
    block(0.5, 0.25, 0.45, 0.3, pal('bone.dim'));
    block(0.32, 0.2, 0.3, 0.55, pal('bone.faded'));
    this.light = block(LIGHT_SIZE, LIGHT_SIZE, LIGHT_SIZE, 0.75, pal('light.gold'));
    this.group.visible = false;
    parent.add(this.group);
  }

  /** Draws the marker at a checkpoint, or hides it when there is none. */
  place(at: Spot | null) {
    this.group.visible = at !== null;
    if (at) this.group.position.set(at.x, at.y, at.z);
  }

  update(dt: number) {
    if (!this.group.visible) return;
    this.t += dt;
    const k = (0.9 + 0.1 * Math.sin(this.t * Math.PI * 2 * BREATH_HZ)) * LIGHT_SIZE;
    this.light.scale.set(k, k, k);
  }
}
