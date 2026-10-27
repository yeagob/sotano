// Draws all loose cubes in a single InstancedMesh (each instance picks its atlas tile in the
// shader), and cracks on damaged blocks.

import * as THREE from 'three';
import { mat } from '../content/materials';
import { ATLAS_COLS, ATLAS_ROWS, CRACK_STAGES, tileFor } from '../content/tiles';
import { DEBRIS_SIZE, type DebrisSystem } from '../physics/debris';
import type { VoxelWorld } from '../world/world';
import { crackTexture } from './atlas';
import { buildSeed, disposeSeed, fuseSeed, SEED_H, SEED_VOXEL, type SeedModel } from './seed-model';

const SEED_SCALE = DEBRIS_SIZE / (SEED_H * SEED_VOXEL);

/** Lambert material that picks each instance's atlas tile from the `instTile` attribute. */
function atlasCubeMaterial(atlas: THREE.Texture) {
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
  return material;
}

export class DebrisView {
  private mesh: THREE.InstancedMesh;
  private tile: THREE.InstancedBufferAttribute;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private seeds = new Map<number, SeedModel>();
  private live = new Set<number>();

  constructor(private scene: THREE.Scene, atlas: THREE.Texture, max: number) {
    const geo = new THREE.BoxGeometry(DEBRIS_SIZE, DEBRIS_SIZE, DEBRIS_SIZE);
    this.tile = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    this.tile.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('instTile', this.tile);
    this.mesh = new THREE.InstancedMesh(geo, atlasCubeMaterial(atlas), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
  }

  update(sys: DebrisSystem) {
    let n = 0;
    const tiles = this.tile.array as Float32Array;
    this.live.clear();
    for (let i = 0; i < sys.max; i++) {
      if (!sys.isAlive(i)) continue;
      const i3 = i * 3, i4 = i * 4;
      if (sys.isBomb(i)) { this.seed(sys, i); continue; }
      this.p.set(sys.pos[i3], sys.pos[i3 + 1], sys.pos[i3 + 2]);
      this.q.set(sys.quat[i4], sys.quat[i4 + 1], sys.quat[i4 + 2], sys.quat[i4 + 3]);
      const k = Math.min(1, 0.6 + sys.age[i] * 4) * sys.scale(i); // small spawn "pop", and a slow shrink at the end
      this.s.set(k, k, k);
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(n, this.m);
      tiles[n] = tileFor(sys.material[i], 2);
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.tile.needsUpdate = true;
    for (const [i, m] of this.seeds) if (!this.live.has(i)) { disposeSeed(m); this.seeds.delete(i); }
  }

  private seed(sys: DebrisSystem, i: number) {
    let m = this.seeds.get(i);
    if (!m) {
      m = buildSeed();
      this.scene.add(m.root);
      this.seeds.set(i, m);
    }
    this.live.add(i);
    const i3 = i * 3;
    const k = SEED_SCALE * fuseSeed(m, sys.fuse[i]);
    m.root.position.set(sys.pos[i3], sys.pos[i3 + 1] - DEBRIS_SIZE / 2, sys.pos[i3 + 2]);
    m.root.rotation.set(0, i * 1.3, 0);
    m.root.scale.setScalar(k);
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

/** Seconds a sliced half flies apart before it has shrunk away. */
const HALF_LIFE = 0.7;
const HALF_GRAVITY = 12;

/**
 * Cubes cut by a blade are sliced in two like a Beat Saber block: two half-cubes (cut along the plane
 * of the slash) fly apart, tumble a little and shrink away. Purely visual; a ring of `max` halves.
 */
export class CutHalves {
  private mesh: THREE.InstancedMesh;
  private tile: THREE.InstancedBufferAttribute;
  private n = 0;
  private head = 0;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly quat: Float32Array;
  private readonly spin: Float32Array;
  private readonly age: Float32Array;
  private readonly tiles: Float32Array;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private dq = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private axis = new THREE.Vector3();

  constructor(scene: THREE.Scene, atlas: THREE.Texture, private max = 128) {
    const geo = new THREE.BoxGeometry(DEBRIS_SIZE, DEBRIS_SIZE / 2, DEBRIS_SIZE);
    this.tile = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    this.tile.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('instTile', this.tile);
    this.mesh = new THREE.InstancedMesh(geo, atlasCubeMaterial(atlas), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.quat = new Float32Array(max * 4);
    this.spin = new Float32Array(max * 3);
    this.age = new Float32Array(max).fill(HALF_LIFE);
    this.tiles = new Float32Array(max);
  }

  /**
   * Slices the cube at `at` along the slash: `along` runs down the blade's stroke, `across` is the
   * unit normal of the cut plane (the halves leave along it, one each way), `onward` the aim.
   */
  cut(material: number, at: THREE.Vector3, along: THREE.Vector3, across: THREE.Vector3, onward: THREE.Vector3, speed: number) {
    const depth = new THREE.Vector3().crossVectors(along, across).normalize();
    const basis = new THREE.Matrix4().makeBasis(along, across, depth);
    const q = new THREE.Quaternion().setFromRotationMatrix(basis);
    for (const side of [1, -1]) {
      const i = this.head;
      this.head = (this.head + 1) % this.max;
      const i3 = i * 3, i4 = i * 4;
      this.pos[i3] = at.x + across.x * side * DEBRIS_SIZE * 0.25;
      this.pos[i3 + 1] = at.y + across.y * side * DEBRIS_SIZE * 0.25;
      this.pos[i3 + 2] = at.z + across.z * side * DEBRIS_SIZE * 0.25;
      this.vel[i3] = across.x * side * speed + onward.x * speed * 0.6;
      this.vel[i3 + 1] = across.y * side * speed + onward.y * speed * 0.6 + 1.2;
      this.vel[i3 + 2] = across.z * side * speed + onward.z * speed * 0.6;
      this.quat[i4] = q.x; this.quat[i4 + 1] = q.y; this.quat[i4 + 2] = q.z; this.quat[i4 + 3] = q.w;
      this.spin[i3] = depth.x * side * 4; this.spin[i3 + 1] = depth.y * side * 4; this.spin[i3 + 2] = depth.z * side * 4;
      this.age[i] = 0;
      this.tiles[i] = tileFor(material, 2);
      this.n = Math.min(this.max, this.n + 1);
    }
  }

  update(dt: number) {
    let n = 0;
    const tiles = this.tile.array as Float32Array;
    for (let i = 0; i < this.max; i++) {
      if (this.age[i] >= HALF_LIFE) continue;
      this.age[i] += dt;
      const i3 = i * 3, i4 = i * 4;
      this.vel[i3 + 1] -= HALF_GRAVITY * dt;
      this.pos[i3] += this.vel[i3] * dt; this.pos[i3 + 1] += this.vel[i3 + 1] * dt; this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
      this.q.set(this.quat[i4], this.quat[i4 + 1], this.quat[i4 + 2], this.quat[i4 + 3]);
      const w = Math.hypot(this.spin[i3], this.spin[i3 + 1], this.spin[i3 + 2]);
      if (w > 1e-4) {
        this.axis.set(this.spin[i3] / w, this.spin[i3 + 1] / w, this.spin[i3 + 2] / w);
        this.q.premultiply(this.dq.setFromAxisAngle(this.axis, w * dt));
        this.quat[i4] = this.q.x; this.quat[i4 + 1] = this.q.y; this.quat[i4 + 2] = this.q.z; this.quat[i4 + 3] = this.q.w;
      }
      const left = Math.max(0, 1 - this.age[i] / HALF_LIFE);
      const k = Math.min(1, left * 2.5);
      this.p.set(this.pos[i3], this.pos[i3 + 1], this.pos[i3 + 2]);
      this.s.set(k, k, k);
      this.m.compose(this.p, this.q, this.s);
      this.mesh.setMatrixAt(n, this.m);
      tiles[n] = this.tiles[i];
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.tile.needsUpdate = true;
  }
}
