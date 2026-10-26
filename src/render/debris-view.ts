// Draws all loose cubes in a single InstancedMesh (each instance picks its atlas tile in the
// shader), and cracks on damaged blocks.

import * as THREE from 'three';
import { mat } from '../content/materials';
import { ATLAS_COLS, ATLAS_ROWS, CRACK_STAGES, tileFor } from '../content/tiles';
import { DEBRIS_SIZE, type DebrisSystem } from '../physics/debris';
import type { VoxelWorld } from '../world/world';
import { crackTexture } from './atlas';

export class DebrisView {
  private mesh: THREE.InstancedMesh;
  private tile: THREE.InstancedBufferAttribute;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();

  constructor(scene: THREE.Scene, atlas: THREE.Texture, max: number) {
    const geo = new THREE.BoxGeometry(DEBRIS_SIZE, DEBRIS_SIZE, DEBRIS_SIZE);
    this.tile = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    this.tile.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('instTile', this.tile);
    const material = new THREE.MeshLambertMaterial({ map: atlas });
    material.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float instTile;')
        .replace('#include <uv_vertex>', `#include <uv_vertex>
          {
            vec2 uvc = clamp(uv, 0.02, 0.98);
            float tx = mod(instTile, ${ATLAS_COLS.toFixed(1)});
            float ty = floor(instTile / ${ATLAS_COLS.toFixed(1)});
            vMapUv = vec2((tx + uvc.x) / ${ATLAS_COLS.toFixed(1)}, 1.0 - (ty + 1.0 - uvc.y) / ${ATLAS_ROWS.toFixed(1)});
          }`);
    };
    this.mesh = new THREE.InstancedMesh(geo, material, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
  }

  update(sys: DebrisSystem, time: number) {
    let n = 0;
    const tiles = this.tile.array as Float32Array;
    for (let i = 0; i < sys.max; i++) {
      if (!sys.isAlive(i) || !sys.visible(i, time)) continue;
      const i3 = i * 3, i4 = i * 4;
      this.p.set(sys.pos[i3], sys.pos[i3 + 1], sys.pos[i3 + 2]);
      this.q.set(sys.quat[i4], sys.quat[i4 + 1], sys.quat[i4 + 2], sys.quat[i4 + 3]);
      const k = Math.min(1, 0.6 + sys.age[i] * 4); // small spawn "pop"
      this.s.set(k, k, k);
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(n, this.m);
      tiles[n] = tileFor(sys.material[i], 2);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.tile.needsUpdate = true;
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
      const max = mat(world.data[i]).hp;
      const stage = Math.min(CRACK_STAGES - 1, Math.floor((1 - hp / max) * CRACK_STAGES));
      if (counts[stage] >= this.max) continue;
      const x = i % world.sx, y = Math.floor(i / world.sx) % world.sy, z = Math.floor(i / (world.sx * world.sy));
      this.m.makeTranslation(x + 0.5, y + 0.5, z + 0.5);
      this.layers[stage].setMatrixAt(counts[stage]++, this.m);
    }
    this.layers.forEach((l, s) => { l.count = counts[s]; l.instanceMatrix.needsUpdate = true; });
  }
}
