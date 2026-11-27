import { describe, expect, it } from 'vitest';
import { EL_WATER, SOURCE, elemByte } from '../src/content/elements';
import likeWater, { LIKE_WATER_SECONDS } from '../src/content/items/like-water';
import { intentFromStats } from '../src/combat/intents';
import { BASE_STATS } from '../src/core/stats';
import type { ItemApi } from '../src/items/types';
import { VoxelWorld } from '../src/world/world';
import { TEMP_WATER_SECONDS, TempWater } from '../src/world/temp-water';

const WATER = elemByte(EL_WATER, SOURCE);

describe('Like Water, the elephant gift (#357)', () => {
  it('leaves water for 3 s, then it dries', () => {
    const w = new VoxelWorld(8, 8, 8);
    const pools = new TempWater();
    expect(TEMP_WATER_SECONDS).toBe(3);
    expect(LIKE_WATER_SECONDS).toBe(3);
    expect(pools.place(w, 2, 3, 2, 0)).toBe(true);
    expect(w.elemAt(2, 3, 2)).toBe(WATER);
    pools.update(2.9);
    expect(w.elemAt(2, 3, 2)).toBe(WATER);
    pools.update(3);
    expect(w.elemAt(2, 3, 2)).toBe(0);
    expect(pools.count).toBe(0);
  });

  it('a second hit on the same water only resets its 3 s', () => {
    const w = new VoxelWorld(8, 8, 8);
    const pools = new TempWater();
    pools.place(w, 2, 3, 2, 0);
    pools.update(2);
    expect(pools.place(w, 2, 3, 2, 2)).toBe(true);
    expect(pools.count).toBe(1);
    pools.update(4.9);
    expect(w.elemAt(2, 3, 2)).toBe(WATER);
    pools.update(5);
    expect(w.elemAt(2, 3, 2)).toBe(0);
  });

  it('never fills a solid cell or a cell that already holds an element it did not make', () => {
    const w = new VoxelWorld(8, 8, 8);
    const pools = new TempWater();
    w.set(1, 1, 1, 2);
    expect(pools.place(w, 1, 1, 1, 0)).toBe(false);
    w.setElemByte(4, 4, 4, WATER);
    expect(pools.place(w, 4, 4, 4, 0)).toBe(false);
    pools.update(10);
    expect(w.elemAt(4, 4, 4)).toBe(WATER);
  });

  it('the hook asks for water in the cell in front of the face a positive intention hit, and only then', () => {
    const calls: number[][] = [];
    const api = { tempWater: (x: number, y: number, z: number, s: number) => { calls.push([x, y, z, s]); return true; } } as unknown as ItemApi;
    const fn = likeWater.hooks![0].fn;
    const hit = (kind: 'block' | 'actor' | 'cube', polarity: 'positive' | 'negative') => fn({
      kind, target: -1, x: 3.4, y: 2, z: 5.5, nx: 0, ny: 1, nz: 0, vx: 0, vy: -1, vz: 0, intent: intentFromStats(BASE_STATS, polarity),
      cancelled: false, cancel() {},
    } as never, api);
    hit('block', 'positive');
    hit('block', 'negative');
    hit('actor', 'positive');
    hit('cube', 'positive');
    expect(calls).toEqual([[3.4, 2.5, 5.5, 3]]);
    expect(Math.floor(calls[0][1])).toBe(2);
  });

  it('marks the water near its source, so the player there moves at half speed underground too', () => {
    const w = new VoxelWorld(8, 8, 8);
    const pools = new TempWater();
    pools.place(w, 3, 4, 3, 0);
    expect(pools.near(w, 3, 4, 3)).toBe(true);
    w.setElemByte(3, 3, 3, elemByte(EL_WATER, 6));
    expect(pools.near(w, 3, 3, 3)).toBe(true);
    w.setElemByte(6, 4, 6, WATER);
    expect(pools.near(w, 6, 4, 6)).toBe(false);
  });
});
