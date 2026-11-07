// The VoxelSpace contract suite (docs/architecture/SKY.md §3.1, §3.7): what every voxel world must
// do for its consumers (elements, cracks, the chunk renderer), run on the dungeon's VoxelWorld and
// the sky's SkyWorld alike. `make` returns a fresh, empty space (all air, no element) of at least
// 48 cells on each side.

import { describe, expect, it } from 'vitest';
import { EL_WATER, SOURCE, elemByte } from '../../src/content/elements';
import { AIR, MAT, mat } from '../../src/content/materials';
import { CHUNK, chunkKey } from '../../src/world/world';
import type { VoxelSpace } from '../../src/world/space';

const P = CHUNK + 2;

export function voxelSpaceContract(name: string, make: () => VoxelSpace) {
  describe(`VoxelSpace contract: ${name}`, () => {
    const stone = MAT.stone, dirt = MAT.dirt;

    it('starts empty, and reads air and no element outside', () => {
      const w = make();
      expect(w.sx).toBeGreaterThanOrEqual(3 * CHUNK);
      expect(w.sy).toBeGreaterThanOrEqual(3 * CHUNK);
      expect(w.sz).toBeGreaterThanOrEqual(3 * CHUNK);
      expect([w.ncx, w.ncy, w.ncz]).toEqual([Math.ceil(w.sx / CHUNK), Math.ceil(w.sy / CHUNK), Math.ceil(w.sz / CHUNK)]);
      for (let i = 0; i < 200; i++) {
        const x = (i * 7) % 48, y = (i * 13) % 48, z = (i * 29) % 48;
        expect(w.get(x, y, z)).toBe(AIR);
        expect(w.elemAt(x, y, z)).toBe(0);
      }
      expect(w.inside(-1, 0, 0)).toBe(false);
      expect(w.inside(0, 0, w.sz)).toBe(false);
      expect(w.get(-1, 5, 5)).toBe(AIR);
      expect(w.solid(5, -1, 5)).toBe(false);
      expect(w.elemAt(5, 5, -1)).toBe(0);
    });

    it('idx is x + sx·(y + sy·z) and coords inverts it', () => {
      const w = make();
      for (const [x, y, z] of [[0, 0, 0], [1, 2, 3], [47, 31, 17], [w.sx - 1, 40, 47]] as const) {
        const i = w.idx(x, y, z);
        expect(i).toBe(x + w.sx * (y + w.sy * z));
        expect(w.coords(i)).toEqual([x, y, z]);
      }
    });

    it('get, getAt and solid read back what set wrote', () => {
      const w = make();
      w.set(20, 21, 22, stone);
      expect(w.get(20, 21, 22)).toBe(stone);
      expect(w.getAt(w.idx(20, 21, 22))).toBe(stone);
      expect(w.solid(20, 21, 22)).toBe(true);
      w.set(20, 21, 22, dirt);
      expect(w.get(20, 21, 22)).toBe(dirt);
      w.set(20, 21, 22, AIR);
      expect(w.get(20, 21, 22)).toBe(AIR);
      expect(w.solid(20, 21, 22)).toBe(false);
      w.set(-1, 0, 0, stone);
      expect(w.get(-1, 0, 0)).toBe(AIR);
    });

    it('a change bumps the version and calls onChange; writing the same value changes nothing', () => {
      const w = make();
      const seen: number[][] = [];
      w.onChange = (x, y, z) => seen.push([x, y, z]);
      const v0 = w.version;
      w.set(5, 6, 7, stone);
      expect(w.version).toBeGreaterThan(v0);
      expect(seen).toEqual([[5, 6, 7]]);
      const v1 = w.version;
      w.set(5, 6, 7, stone);
      expect(w.version).toBe(v1);
      expect(seen.length).toBe(1);
    });

    it('marks the chunk dirty, and the neighbour across a border', () => {
      const w = make();
      w.dirty.clear();
      w.set(20, 20, 20, stone);
      expect(w.dirty.has(chunkKey(1, 1, 1))).toBe(true);
      expect(w.dirty.has(chunkKey(0, 1, 1))).toBe(false);
      w.dirty.clear();
      w.set(16, 20, 31, stone);
      expect(w.dirty.has(chunkKey(1, 1, 1))).toBe(true);
      expect(w.dirty.has(chunkKey(0, 1, 1))).toBe(true);
      expect(w.dirty.has(chunkKey(1, 1, 2))).toBe(true);
      w.dirty.clear();
      w.markDirty(0, 0, 0);
      expect([...w.dirty]).toEqual([chunkKey(0, 0, 0)]);
      w.elemDirty.clear();
      w.markElemDirty(32, 5, 5);
      expect(w.elemDirty.has(chunkKey(2, 0, 0))).toBe(true);
      expect(w.elemDirty.has(chunkKey(1, 0, 0))).toBe(true);
    });

    it('hp is the material\'s until damaged, and a new block forgets the damage', () => {
      const w = make();
      w.set(8, 8, 8, stone);
      expect(w.hp(8, 8, 8)).toBe(mat(stone).hp);
      const i = w.idx(8, 8, 8);
      w.damaged.set(i, 2);
      expect(w.hp(8, 8, 8)).toBe(2);
      w.set(8, 8, 8, dirt);
      expect(w.damaged.has(i)).toBe(false);
      expect(w.hp(8, 8, 8)).toBe(mat(dirt).hp);
    });

    it('keeps elements in air only, and a block displaces them', () => {
      const w = make();
      const byte = elemByte(EL_WATER, SOURCE);
      w.elemDirty.clear();
      const ev = w.elemVersion;
      w.setElem(10, 11, 12, EL_WATER, SOURCE);
      expect(w.elemAt(10, 11, 12)).toBe(byte);
      expect(w.elemAtIndex(w.idx(10, 11, 12))).toBe(byte);
      expect(w.elemVersion).toBeGreaterThan(ev);
      expect(w.elemDirty.has(chunkKey(0, 0, 0))).toBe(true);
      expect(w.solid(10, 11, 12)).toBe(false);
      w.setElemByte(10, 11, 12, 0);
      expect(w.elemAt(10, 11, 12)).toBe(0);
      w.set(3, 3, 3, stone);
      w.setElem(3, 3, 3, EL_WATER, SOURCE);
      expect(w.elemAt(3, 3, 3)).toBe(0);
      w.setElem(4, 4, 4, EL_WATER, 3, true);
      expect(w.elemAt(4, 4, 4)).toBe(elemByte(EL_WATER, 3, true));
      w.set(4, 4, 4, stone);
      expect(w.elemAt(4, 4, 4)).toBe(0);
    });

    it('paddedChunk copies a chunk and its one-voxel border', () => {
      const w = make();
      // inside chunk (1, 1, 1), on each of its borders, and in its neighbours just across them
      const cells: [number, number, number, number][] = [
        [20, 20, 20, stone], [16, 16, 16, dirt], [31, 31, 31, stone], [15, 20, 20, dirt],
        [32, 20, 20, stone], [20, 15, 20, stone], [20, 32, 20, dirt], [20, 20, 15, dirt], [20, 20, 32, stone],
        [15, 15, 15, stone], [32, 32, 32, dirt], [14, 20, 20, stone], [33, 20, 20, stone],
      ];
      for (const [x, y, z, m] of cells) w.set(x, y, z, m);
      w.setElem(18, 33, 18, EL_WATER, SOURCE);
      w.setElem(18, 32, 18, EL_WATER, SOURCE);
      w.setElem(18, 17, 18, EL_WATER, 4);
      for (const elem of [false, true]) {
        const out = w.paddedChunk(1, 1, 1, elem);
        expect(out.length).toBe(P * P * P);
        for (let z = 0; z < P; z++) for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
          const wx = CHUNK - 1 + x, wy = CHUNK - 1 + y, wz = CHUNK - 1 + z;
          const want = elem ? w.elemAt(wx, wy, wz) : w.get(wx, wy, wz);
          if (out[x + P * (y + P * z)] !== want) expect(out[x + P * (y + P * z)], `${elem ? 'elem' : 'block'} ${wx},${wy},${wz}`).toBe(want);
        }
      }
      // outside the world the border is empty
      w.set(0, 0, 0, stone);
      const corner = w.paddedChunk(0, 0, 0);
      expect(corner[0]).toBe(0);
      expect(corner[1 + P * (1 + P)]).toBe(stone);
    });

    it('emptyChunk, when offered, is true only for a chunk with no block and no element', () => {
      const w = make();
      if (!w.emptyChunk) return;
      expect(w.emptyChunk(1, 1, 1)).toBe(true);
      w.set(20, 20, 20, stone);
      expect(w.emptyChunk(1, 1, 1)).toBe(false);
      w.set(20, 20, 20, AIR);
      expect(w.emptyChunk(1, 1, 1)).toBe(true);
      w.setElem(40, 40, 40, EL_WATER, SOURCE);
      expect(w.emptyChunk(2, 2, 2)).toBe(false);
    });
  });
}
