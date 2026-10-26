import { describe, expect, it } from 'vitest';
import { DebrisSystem, DEBRIS_HITS, DEBRIS_LIFETIME } from '../src/physics/debris';

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

  it('repel each other: cubes spawned at the same spot end up apart and never inside walls', () => {
    // a 4×4 well with walls around it
    const well = (x: number, y: number, z: number) => y < 0 || x < 0 || x > 3 || z < 0 || z > 3;
    const worstOverlap = (count: number) => {
      const d = new DebrisSystem(64, well, () => {});
      for (let k = 0; k < count; k++) d.spawn(1, 2, 1 + k * 0.05, 2);
      step(d, 6);
      const S = 0.72 * 0.98;
      let worst = 0;
      for (let i = 0; i < count; i++) {
        expect(d.isAlive(i)).toBe(true);
        for (const k of [0, 2]) { expect(d.pos[i * 3 + k]).toBeGreaterThanOrEqual(0.359); expect(d.pos[i * 3 + k]).toBeLessThanOrEqual(3.641); }
        expect(d.pos[i * 3 + 1]).toBeGreaterThanOrEqual(0.359);
        for (let j = i + 1; j < count; j++) {
          worst = Math.max(worst, Math.min(...[0, 1, 2].map(k => S - Math.abs(d.pos[i * 3 + k] - d.pos[j * 3 + k]))));
        }
      }
      return worst;
    };
    expect(worstOverlap(20)).toBeLessThanOrEqual(0.02);   // fits on the floor: no overlap at all
    expect(worstOverlap(40)).toBeLessThanOrEqual(0.22);   // an overfull, jammed pit: some pressure remains
  });

  it('handle a couple of thousand cubes quickly', () => {
    const d = new DebrisSystem(2000, floor, () => {});
    for (let k = 0; k < 2000; k++) d.spawn(1, (k % 50) + 0.5, 2 + Math.floor(k / 50) * 0.8, 0.5);
    const t0 = performance.now();
    for (let f = 0; f < 60; f++) d.update(1 / 60);
    expect(performance.now() - t0).toBeLessThan(1500);
  });

  it('hop upward instead of staying wedged against a wall', () => {
    const wall = (x: number, y: number) => y < 0 || x >= 3;
    const d = new DebrisSystem(4, wall, () => {});
    const c = d.spawn(1, 2.4, 0.4, 0.5);
    step(d, 0.3); // let it land
    d.launch(c, 6, 0, 0);
    let peak = 0;
    for (let t = 0; t < 0.3; t += 1 / 60) { d.update(1 / 60); peak = Math.max(peak, d.pos[c * 3 + 1]); }
    expect(peak).toBeGreaterThan(0.6);
  });

  it('shatter after enough hits, and a hit sets a bomb off at once', () => {
    const d = new DebrisSystem(4, floor, () => {});
    const c = d.spawn(1, 0.5, 0.4, 0.5);
    for (let k = 1; k < DEBRIS_HITS; k++) expect(d.strike(c, 1, 0, 0)).toBe('pushed');
    expect(d.strike(c, 1, 0, 0)).toBe('shattered');
    const b = d.spawn(1, 2.5, 0.4, 0.5);
    d.fuse[b] = 1.8;
    expect(d.strike(b, 1, 0, 0)).toBe('ignited');
    expect(d.fuse[b]).toBeLessThanOrEqual(0.01);
  });
});
