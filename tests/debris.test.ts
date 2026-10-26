import { describe, expect, it } from 'vitest';
import { DebrisSystem, DEBRIS_LIFETIME } from '../src/physics/debris';

const floor = (_x: number, y: number, _z: number) => y < 0;
const step = (d: DebrisSystem, seconds: number) => { for (let t = 0; t < seconds; t += 1 / 60) d.update(1 / 60); };

describe('loose cubes', () => {
  it('fall, land on the floor and come to rest', () => {
    const d = new DebrisSystem(16, floor, () => {});
    const i = d.spawn(1, 0.5, 3, 0.5);
    step(d, 2);
    expect(d.isResting(i)).toBe(true);
    expect(d.pos[i * 3 + 1]).toBeCloseTo(0.36, 2);
  });

  it('stack on top of resting cubes, and fall when their support goes', () => {
    const d = new DebrisSystem(16, floor, () => {});
    const a = d.spawn(1, 0.5, 1, 0.5);
    step(d, 1.5);
    const b = d.spawn(1, 0.5, 4, 0.5);
    step(d, 2);
    expect(d.pos[b * 3 + 1]).toBeCloseTo(d.pos[a * 3 + 1] + 0.72, 2);
    d.remove(a);
    step(d, 2);
    expect(d.pos[b * 3 + 1]).toBeCloseTo(0.36, 2);
  });

  it('reuse the oldest slot when full and despawn after their lifetime', () => {
    const d = new DebrisSystem(4, floor, () => {});
    for (let k = 0; k < 6; k++) d.spawn(1, k, 1, 0);
    expect(d.count).toBe(4);
    step(d, DEBRIS_LIFETIME + 1);
    expect(d.count).toBe(0);
  });

  it('report hard impacts only for tagged cubes', () => {
    const hits: number[] = [];
    const wall = (x: number, y: number) => y < 0 || x >= 5;
    const d = new DebrisSystem(4, wall, i => hits.push(i));
    const plain = d.spawn(1, 0.5, 1, 0.5);
    d.launch(plain, 20, 0, 0);
    const tagged = d.spawn(1, 0.5, 1, 2.5);
    d.launch(tagged, 20, 0, 0);
    d.tags[tagged] = new Set(['volatile']);
    step(d, 0.5);
    expect(hits).toContain(tagged);
    expect(hits).not.toContain(plain);
  });

  it('handle a couple of thousand cubes quickly', () => {
    const d = new DebrisSystem(2000, floor, () => {});
    for (let k = 0; k < 2000; k++) d.spawn(1, (k % 50) + 0.5, 2 + Math.floor(k / 50) * 0.8, 0.5);
    const t0 = performance.now();
    for (let f = 0; f < 60; f++) d.update(1 / 60);
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});
