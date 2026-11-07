// Gold marks where each positive hit landed on a deity (docs/architecture/SKY.md §5.3, §11): tiny quads of
// light.gold that stay where they landed, in the deity's local frame. At most `max` of them (its hit target).

import * as THREE from 'three';
import { pal } from '../../content/palette';
import type { SkyHitMarksApi, Vec3 } from '../types';

/** Side of one mark, in blocks. */
export const MARK_SIZE = 0.2;

export class HitMarks implements SkyHitMarksApi {
  private mesh: THREE.InstancedMesh;
  private n = 0;
  private m = new THREE.Matrix4();

  constructor(private parent: THREE.Object3D, max: number) {
    const geo = new THREE.PlaneGeometry(MARK_SIZE, MARK_SIZE);
    const mat = new THREE.MeshBasicMaterial({ color: pal('light.gold'), side: THREE.DoubleSide });
    this.mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, max));
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
  }

  /** A mark where a hit landed (`local` in the deity's frame). Past the target nothing more is drawn. */
  add(local: Vec3) {
    if (this.n >= this.mesh.instanceMatrix.count) return;
    this.m.makeTranslation(local.x, local.y, local.z);
    this.mesh.setMatrixAt(this.n, this.m);
    this.n++;
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    this.n = 0;
    this.mesh.count = 0;
  }

  dispose() {
    this.parent.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
