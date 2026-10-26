// World chunk meshes. Meshing runs in a Web Worker; this side only builds the geometries.

import * as THREE from 'three';
import { CHUNK, parseChunkKey, type VoxelWorld } from '../world/world';
import type { MeshData } from '../world/mesher';
import type { MeshRequest } from '../world/mesher.worker';

export class ChunkRenderer {
  private meshes = new Map<string, THREE.Mesh>();
  private version = new Map<string, number>();
  private inFlight = new Set<string>();
  private worker: Worker;
  readonly material: THREE.MeshBasicMaterial;

  constructor(private world: VoxelWorld, private scene: THREE.Scene, atlas: THREE.Texture, private perFrame = 4) {
    this.material = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true });
    this.worker = new Worker(new URL('../world/mesher.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<MeshData & { key: string; version: number }>) => this.receive(e.data);
  }

  /** Sends at most `perFrame` dirty chunks off to be meshed. */
  update() {
    let n = 0;
    for (const key of this.world.dirty) {
      if (n >= this.perFrame) break;
      if (this.inFlight.has(key)) continue; // it will be sent again once the reply arrives
      this.world.dirty.delete(key);
      const [cx, cy, cz] = parseChunkKey(key);
      const v = (this.version.get(key) ?? 0) + 1;
      this.version.set(key, v);
      const req: MeshRequest = { key, version: v, padded: this.world.paddedChunk(cx, cy, cz), size: CHUNK };
      this.inFlight.add(key);
      this.worker.postMessage(req, [req.padded.buffer]);
      n++;
    }
  }

  get busy() { return this.inFlight.size > 0 || this.world.dirty.size > 0; }

  private receive(d: MeshData & { key: string; version: number }) {
    this.inFlight.delete(d.key);
    if (d.version !== this.version.get(d.key)) return;
    const old = this.meshes.get(d.key);
    if (old) { old.geometry.dispose(); this.scene.remove(old); this.meshes.delete(d.key); }
    if (!d.indices.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(d.positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(d.uvs, 2));
    g.setAttribute('color', new THREE.BufferAttribute(d.colors, 3));
    g.setIndex(new THREE.BufferAttribute(d.indices, 1));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, this.material);
    const [cx, cy, cz] = parseChunkKey(d.key);
    m.position.set(cx * CHUNK, cy * CHUNK, cz * CHUNK);
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    this.scene.add(m);
    this.meshes.set(d.key, m);
  }

  dispose() {
    this.worker.terminate();
    for (const m of this.meshes.values()) { m.geometry.dispose(); this.scene.remove(m); }
    this.meshes.clear();
    this.material.dispose();
  }

  /** Only draw chunks whose rows overlap [y0, y1] (floors far above or below stay hidden). */
  setVisibleRange(y0: number, y1: number) {
    for (const [key, m] of this.meshes) {
      const cy = Number(key.split(',')[1]) * CHUNK;
      m.visible = cy + CHUNK > y0 && cy < y1;
    }
  }

  get triangles() {
    let t = 0;
    for (const m of this.meshes.values()) t += (m.geometry.index?.count ?? 0) / 3;
    return t;
  }
}
