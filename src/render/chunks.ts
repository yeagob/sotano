// World chunk meshes. Meshing runs in a Web Worker; this side only builds the geometries.
// Two layers per chunk, each with its own dirty set and budget so a flood never delays the
// feedback of breaking a block: blocks (opaque) and elements (water translucent, drawn after
// everything opaque; lava full-bright; fire alpha-tested). Element textures animate by offset.

import * as THREE from 'three';
import { CHUNK, chunkKey, parseChunkKey, type VoxelWorld } from '../world/world';
import type { MeshData } from '../world/mesher';
import type { MeshRequest } from '../world/mesher.worker';
import { elementTextures } from './element-textures';

type Layer = 'blocks' | 'elem';
type Reply = MeshData & { key: string; version: number; layer: Layer; groups: [number, number][] | null };

/** Fire frames per second (DECISIONS §3.8: 4 frames at 8 fps, shape change only). */
const FIRE_FPS = 8;

export class ChunkRenderer {
  private meshes: Record<Layer, Map<string, THREE.Mesh>> = { blocks: new Map(), elem: new Map() };
  private version: Record<Layer, Map<string, number>> = { blocks: new Map(), elem: new Map() };
  private inFlight: Record<Layer, Set<string>> = { blocks: new Set(), elem: new Set() };
  private worker: Worker;
  readonly material: THREE.MeshBasicMaterial;
  private elemMaterials: THREE.MeshBasicMaterial[];
  private tex = elementTextures();
  private rows: [number, number] | null = null;

  constructor(private world: VoxelWorld, private scene: THREE.Scene, atlas: THREE.Texture, private perFrame = 4, private elemPerFrame = 3) {
    this.material = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true });
    this.elemMaterials = [
      new THREE.MeshBasicMaterial({ map: this.tex.water, vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ map: this.tex.lava, vertexColors: true, side: THREE.DoubleSide }),
      new THREE.MeshBasicMaterial({ map: this.tex.fire, transparent: true, alphaTest: 0.5, depthWrite: false, side: THREE.DoubleSide }),
    ];
    this.worker = new Worker(new URL('../world/mesher.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<Reply>) => this.receive(e.data);
  }

  /** Sends dirty chunks off to be meshed: at most `perFrame` block chunks and `elemPerFrame` element chunks. */
  update() {
    this.send('blocks', this.world.dirty, this.perFrame);
    this.send('elem', this.world.elemDirty, this.elemPerFrame);
  }

  /** Animates the elements: water and lava drift, fire steps through its frames. */
  animate(time: number) {
    this.tex.water.offset.set(time * 0.05, time * 0.03);
    this.tex.lava.offset.set(time * 0.012, time * 0.008);
    this.tex.fire.offset.x = (Math.floor(time * FIRE_FPS) % 4) * 0.25;
  }

  private send(layer: Layer, dirty: Set<string>, max: number) {
    let n = 0;
    for (const key of dirty) {
      if (n >= max) break;
      if (this.inFlight[layer].has(key)) continue; // it will be sent again once the reply arrives
      if (!this.loaded(key)) { dirty.delete(key); continue; }
      dirty.delete(key);
      const [cx, cy, cz] = parseChunkKey(key);
      const v = (this.version[layer].get(key) ?? 0) + 1;
      this.version[layer].set(key, v);
      const req: MeshRequest = {
        key, version: v, layer, size: CHUNK,
        padded: this.world.paddedChunk(cx, cy, cz), elem: this.world.paddedChunk(cx, cy, cz, true),
      };
      this.inFlight[layer].add(key);
      this.worker.postMessage(req, [req.padded.buffer, req.elem.buffer]);
      n++;
    }
  }

  get busy() {
    return this.inFlight.blocks.size > 0 || this.world.dirty.size > 0 || this.inFlight.elem.size > 0 || this.world.elemDirty.size > 0;
  }

  private receive(d: Reply) {
    const layer = d.layer;
    this.inFlight[layer].delete(d.key);
    if (d.version !== this.version[layer].get(d.key) || !this.loaded(d.key)) return;
    const meshes = this.meshes[layer];
    const old = meshes.get(d.key);
    if (old) { old.geometry.dispose(); this.scene.remove(old); meshes.delete(d.key); }
    if (!d.indices.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(d.positions, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(d.uvs, 2));
    g.setAttribute('color', new THREE.BufferAttribute(d.colors, 3));
    g.setIndex(new THREE.BufferAttribute(d.indices, 1));
    if (d.groups) d.groups.forEach(([start, count], i) => { if (count) g.addGroup(start, count, i); });
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, layer === 'blocks' ? this.material : this.elemMaterials);
    // translucent water after everything opaque
    if (layer === 'elem') m.renderOrder = 2;
    const [cx, cy, cz] = parseChunkKey(d.key);
    m.position.set(cx * CHUNK, cy * CHUNK, cz * CHUNK);
    m.matrixAutoUpdate = false;
    m.updateMatrix();
    this.scene.add(m);
    meshes.set(d.key, m);
  }

  dispose() {
    this.worker.terminate();
    for (const layer of ['blocks', 'elem'] as Layer[]) {
      for (const m of this.meshes[layer].values()) { m.geometry.dispose(); this.scene.remove(m); }
      this.meshes[layer].clear();
    }
    this.material.dispose();
    for (const m of this.elemMaterials) m.dispose();
    for (const t of Object.values(this.tex)) t.dispose();
  }

  setLoadedRange(y0: number, y1: number) {
    const r0 = Math.max(0, Math.floor(y0 / CHUNK)), r1 = Math.min(this.world.ncy - 1, Math.floor(y1 / CHUNK));
    const old = this.rows;
    if (old && old[0] === r0 && old[1] === r1) return;
    this.rows = [r0, r1];
    for (const layer of ['blocks', 'elem'] as Layer[]) for (const [key, m] of this.meshes[layer]) {
      if (this.loaded(key)) continue;
      m.geometry.dispose(); this.scene.remove(m); this.meshes[layer].delete(key);
    }
    for (let cy = r0; cy <= r1; cy++) {
      if (old && cy >= old[0] && cy <= old[1]) continue;
      for (let cz = 0; cz < this.world.ncz; cz++) for (let cx = 0; cx < this.world.ncx; cx++) {
        this.world.dirty.add(chunkKey(cx, cy, cz));
        this.world.elemDirty.add(chunkKey(cx, cy, cz));
      }
    }
  }

  private loaded(key: string) {
    if (!this.rows) return true;
    const cy = parseChunkKey(key)[1];
    return cy >= this.rows[0] && cy <= this.rows[1];
  }

  /** Only draw chunks whose rows overlap [y0, y1] (floors far above or below stay hidden). */
  setVisibleRange(y0: number, y1: number) {
    for (const layer of ['blocks', 'elem'] as Layer[]) for (const [key, m] of this.meshes[layer]) {
      const cy = Number(key.split(',')[1]) * CHUNK;
      m.visible = cy + CHUNK > y0 && cy < y1;
    }
  }

  get triangles() {
    let t = 0;
    for (const layer of ['blocks', 'elem'] as Layer[]) for (const m of this.meshes[layer].values()) t += (m.geometry.index?.count ?? 0) / 3;
    return t;
  }
}
