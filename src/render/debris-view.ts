// Draws loose cubes (one InstancedMesh per material) and cracks on damaged blocks.

import * as THREE from 'three';
import { MATERIALS, mat } from '../content/materials';
import { CRACK_STAGES } from '../content/tiles';
import { DEBRIS_SIZE, type DebrisSystem } from '../physics/debris';
import type { VoxelWorld } from '../world/world';
import { crackTexture, materialTexture } from './atlas';

export class DebrisView {
  private meshes = new Map<number, THREE.InstancedMesh>();
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();

  constructor(scene: THREE.Scene, max: number) {
    const geo = new THREE.BoxGeometry(DEBRIS_SIZE, DEBRIS_SIZE, DEBRIS_SIZE);
    for (const def of MATERIALS) {
      if (def.id === 0 || !isFinite(def.hp)) continue;
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ map: materialTexture(def.id) }), max);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.count = 0;
      scene.add(mesh);
      this.meshes.set(def.id, mesh);
    }
  }

  update(sys: DebrisSystem, time: number) {
    const counts = new Map<number, number>();
    for (const d of sys.items) {
      const mesh = this.meshes.get(d.material);
      if (!mesh || !sys.visible(d, time)) continue;
      const t = d.body.translation(), r = d.body.rotation();
      this.p.set(t.x, t.y, t.z); this.q.set(r.x, r.y, r.z, r.w);
      // spawns with a small scale "pop"
      const k = Math.min(1, 0.6 + d.age * 4);
      this.s.set(k, k, k);
      this.m.compose(this.p, this.q, this.s);
      const n = counts.get(d.material) ?? 0;
      mesh.setMatrixAt(n, this.m);
      counts.set(d.material, n + 1);
    }
    for (const [id, mesh] of this.meshes) {
      mesh.count = counts.get(id) ?? 0;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

/** Crack-textured boxes over damaged blocks (one layer per stage). */
export class CrackView {
  private layers: THREE.InstancedMesh[] = [];
  private m = new THREE.Matrix4();

  constructor(scene: THREE.Scene, private max = 96) {
    const geo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    for (let s = 0; s < CRACK_STAGES; s++) {
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({
        map: crackTexture(s), transparent: true, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      }), max);
      mesh.frustumCulled = false;
      mesh.count = 0;
      scene.add(mesh);
      this.layers.push(mesh);
    }
  }

  update(world: VoxelWorld) {
    const counts = new Array(CRACK_STAGES).fill(0);
    for (const [i, hp] of world.damaged) {
      const id = world.data[i];
      const max = mat(id).hp;
      const stage = Math.min(CRACK_STAGES - 1, Math.floor((1 - hp / max) * CRACK_STAGES));
      if (counts[stage] >= this.max) continue;
      const x = i % world.sx, y = Math.floor(i / world.sx) % world.sy, z = Math.floor(i / (world.sx * world.sy));
      this.m.makeTranslation(x + 0.5, y + 0.5, z + 0.5);
      this.layers[stage].setMatrixAt(counts[stage]++, this.m);
    }
    this.layers.forEach((l, s) => { l.count = counts[s]; l.instanceMatrix.needsUpdate = true; });
  }
}
