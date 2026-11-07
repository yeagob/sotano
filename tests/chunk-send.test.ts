// The ghost mesh (docs/architecture/SKY.md §3.1 [M1]): a world that knows its empty chunks spares the
// mesher, but a chunk emptied by removing its last block still has a mesh, so it is still sent (the
// worker's empty reply removes that mesh). Only an empty chunk with no mesh is skipped.

import * as THREE from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MAT, AIR } from '../src/content/materials';
import { CHUNK, VoxelWorld, chunkKey } from '../src/world/world';
import type { VoxelSpace } from '../src/world/space';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';

// the renderer paints its element textures on a canvas; the node test environment has none
(globalThis as { document?: unknown }).document ??= {
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => new Proxy({}, { get: () => () => {}, set: () => true }),
  }),
};
const { ChunkRenderer, skipChunk } = await import('../src/render/chunks');

type Req = { key: string; version: number; layer: 'blocks' | 'elem' };

/** A worker that keeps what was posted and answers on demand. */
class FakeWorker {
  static last: FakeWorker;
  posted: Req[] = [];
  onmessage: ((e: { data: unknown }) => void) | null = null;
  constructor() { FakeWorker.last = this; }
  postMessage(req: Req) { this.posted.push(req); }
  terminate() {}
  /** Replies to everything posted: a one-triangle mesh, or an empty one. */
  answer(full: boolean) {
    const out = this.posted.splice(0);
    for (const r of out) this.onmessage?.({ data: {
      key: r.key, version: r.version, layer: r.layer, groups: null,
      positions: new Float32Array(full ? 9 : 0), uvs: new Float32Array(full ? 6 : 0),
      colors: new Float32Array(full ? 9 : 0), indices: new Uint32Array(full ? [0, 1, 2] : []),
    } });
    return out;
  }
}

/** A dungeon world that also answers emptyChunk, as the sky's does. */
class SparseWorld extends VoxelWorld {
  emptyChunk(cx: number, cy: number, cz: number) {
    for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) for (let y = cy * CHUNK; y < (cy + 1) * CHUNK; y++)
      for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++) if (this.get(x, y, z) !== AIR || this.elemAt(x, y, z)) return false;
    return true;
  }
}

function setup(world: VoxelSpace) {
  const root = new THREE.Group();
  const r = new ChunkRenderer(world, root, new THREE.Texture(), 99, 99);
  world.dirty.clear(); world.elemDirty.clear();
  return { root, r, worker: FakeWorker.last };
}

const K = chunkKey(1, 1, 1);
const keys = (rs: Req[]) => rs.map(q => `${q.layer} ${q.key}`);

beforeAll(() => { vi.stubGlobal('Worker', FakeWorker); });
afterAll(() => { vi.unstubAllGlobals(); });

describe('skipChunk', () => {
  it('skips only an empty chunk that has no mesh', () => {
    expect(skipChunk(true, false)).toBe(true);
    expect(skipChunk(true, true)).toBe(false);
    expect(skipChunk(false, false)).toBe(false);
    expect(skipChunk(false, true)).toBe(false);
  });
});

describe('chunk sending', () => {
  it('skips an empty chunk with no mesh', () => {
    const { r, worker } = setup(new SparseWorld(48, 48, 48));
    const w = (r as unknown as { world: SparseWorld }).world;
    w.dirty.add(K); w.elemDirty.add(K);
    r.update();
    expect(worker.posted).toEqual([]);
    expect(w.dirty.size + w.elemDirty.size).toBe(0);
    expect(r.busy).toBe(false);
  });

  it('still sends a chunk emptied of its last block, and its empty reply removes the mesh', () => {
    const w = new SparseWorld(48, 48, 48);
    const { root, r, worker } = setup(w);
    w.set(20, 20, 20, MAT.stone);
    r.update();
    expect(keys(worker.answer(true))).toEqual([`blocks ${K}`]);
    expect(root.children.length).toBe(1);
    w.set(20, 20, 20, AIR);
    r.update();
    expect(keys(worker.answer(false))).toEqual([`blocks ${K}`]);
    expect(root.children.length).toBe(0);
    // now it is empty and has no mesh: the next time it is dirty it is skipped
    w.markDirty(20, 20, 20);
    r.update();
    expect(worker.posted).toEqual([]);
  });

  it('decides per layer: a block mesh does not make the element layer send', () => {
    const w = new SparseWorld(48, 48, 48);
    const { r, worker } = setup(w);
    w.set(20, 20, 20, MAT.stone);
    r.update();
    worker.answer(true);
    w.set(20, 20, 20, AIR);
    w.elemDirty.add(K);
    r.update();
    expect(keys(worker.posted)).toEqual([`blocks ${K}`]);
  });

  it('the sky world itself: a block placed and removed in an empty sky chunk leaves no ghost mesh', () => {
    const w = new SkyWorld(buildIndex([]));
    const { root, r, worker } = setup(w);
    expect(w.emptyChunk(1, 1, 1)).toBe(true);
    w.placing = true; w.set(20, 20, 20, MAT.stone); w.placing = false;
    expect(w.emptyChunk(1, 1, 1)).toBe(false);
    r.update();
    expect(keys(worker.answer(true))).toEqual([`blocks ${K}`]);
    expect(root.children.length).toBe(1);
    w.set(20, 20, 20, AIR);
    expect(w.emptyChunk(1, 1, 1)).toBe(true);
    r.update();
    expect(keys(worker.answer(false))).toEqual([`blocks ${K}`]);
    expect(root.children.length).toBe(0);
    w.markDirty(20, 20, 20);
    r.update();
    expect(worker.posted).toEqual([]);
  });

  it('sends every dirty chunk of a world without emptyChunk (the dungeon, unchanged)', () => {
    const w = new VoxelWorld(48, 48, 48);
    const { r, worker } = setup(w);
    w.dirty.add(K); w.elemDirty.add(K);
    r.update();
    expect(keys(worker.posted)).toEqual([`blocks ${K}`, `elem ${K}`]);
  });
});
