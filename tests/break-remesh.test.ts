import { describe, expect, it } from 'vitest';
import { VoxelWorld, chunkKey } from '../src/world/world';

describe('a block change touches the chunks it is meshed in, at once', () => {
  it('keysAround lists exactly the chunks markDirty queues, for every place on the rim and the inside', () => {
    const w = new VoxelWorld(48, 48, 48);
    const points: [number, number, number][] = [[5, 5, 5], [0, 5, 5], [15, 5, 5], [16, 16, 16], [0, 0, 0], [47, 47, 47], [16, 0, 31]];
    for (const [x, y, z] of points) {
      const fresh = new VoxelWorld(48, 48, 48);
      fresh.markDirty(x, y, z);
      expect([...fresh.dirty].sort()).toEqual([...new Set(w.keysAround(x, y, z))].sort());
    }
  });

  it('the block\'s own chunk is always among them', () => {
    const w = new VoxelWorld(48, 48, 48);
    expect(w.keysAround(20, 3, 40)).toContain(chunkKey(1, 0, 2));
  });
});
