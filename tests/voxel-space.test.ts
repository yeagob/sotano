// The dungeon's VoxelWorld implements VoxelSpace itself (docs/architecture/SKY.md §3.1, V0): K0's
// contract suite runs on it with no adapter, and the index readers agree with the cell readers.

import { describe, expect, it } from 'vitest';
import { EL_WATER, SOURCE, elemByte } from '../src/content/elements';
import { MAT } from '../src/content/materials';
import type { VoxelSpace } from '../src/world/space';
import { VoxelWorld } from '../src/world/world';
import { voxelSpaceContract } from './helpers/voxel-space-contract';

voxelSpaceContract('VoxelWorld (native)', (): VoxelSpace => new VoxelWorld(48, 48, 48));

describe('VoxelWorld as a VoxelSpace', () => {
  it('reads by index exactly what its arrays hold, on a world that is not a cube', () => {
    const w = new VoxelWorld(40, 56, 33);
    w.set(39, 55, 32, MAT.stone);
    w.setElem(1, 2, 3, EL_WATER, SOURCE);
    for (const [x, y, z] of [[0, 0, 0], [39, 55, 32], [1, 2, 3], [17, 40, 9]] as const) {
      const i = w.idx(x, y, z);
      expect(w.coords(i)).toEqual([x, y, z]);
      expect(w.getAt(i)).toBe(w.data[i]);
      expect(w.elemAtIndex(i)).toBe(w.elem[i]);
    }
    expect(w.getAt(w.idx(39, 55, 32))).toBe(MAT.stone);
    expect(w.elemAtIndex(w.idx(1, 2, 3))).toBe(elemByte(EL_WATER, SOURCE));
  });

  it('offers no emptyChunk, so the dungeon meshes every dirty chunk as before', () => {
    const w: VoxelSpace = new VoxelWorld(48, 48, 48);
    expect(w.emptyChunk).toBeUndefined();
  });
});
