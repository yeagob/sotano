import { beforeEach, describe, expect, it } from 'vitest';
import { seedFx } from '../src/core/fx';
import { DEBRIS_LIFETIME, DEBRIS_SIZE, DebrisSystem } from '../src/physics/debris';

const floor = (_x: number, y: number, _z: number) => y < 0;
const step = (d: DebrisSystem, seconds: number) => { for (let t = 0; t < seconds; t += 1 / 60) d.update(1 / 60); };

describe('loose cubes', () => {
  // hops and spins draw from fx: seed it, or the physics thresholds below are flaky under Math.random
  beforeEach(() => seedFx(7));
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
      // a jam may lose the cubes that spin in place (#42), but not the pile: most of it stays
      const living = Array.from({ length: count }, (_, i) => i).filter(i => d.isAlive(i)).length;
      expect(living).toBeGreaterThanOrEqual(Math.floor(count * 0.8));
      const S = 0.72 * 0.98;
      let worst = 0;
      // cubes that spun in place in the jam are removed on purpose (#42), so only the living are checked
      for (let i = 0; i < count; i++) {
        if (!d.isAlive(i)) continue;
        for (const k of [0, 2]) { expect(d.pos[i * 3 + k]).toBeGreaterThanOrEqual(0.359); expect(d.pos[i * 3 + k]).toBeLessThanOrEqual(3.641); }
        expect(d.pos[i * 3 + 1]).toBeGreaterThanOrEqual(0.359);
        for (let j = i + 1; j < count; j++) {
          if (!d.isAlive(j)) continue;
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

  it('a shot shatters a loose block at once, and only pushes a bomb', () => {
    const d = new DebrisSystem(4, floor, () => {});
    const c = d.spawn(1, 0.5, 0.4, 0.5);
    expect(d.hit(c, 1, 0, 0)).toBe(true);
    const b = d.spawn(1, 2.5, 0.4, 0.5);
    d.fuse[b] = 1.8;
    expect(d.hit(b, 1, 0, 0)).toBe(false);
    expect(d.fuse[b]).toBeGreaterThan(1.7);
    expect(d.vel[b * 3]).toBeGreaterThan(0);
  });

  it('a cube in a one-block pit climbs out instead of jittering', () => {
    // floor at y<0, with a pit at x 0..1 whose walls are one block high
    const pit = (x: number, y: number) => y < 0 || (y < 1 && (x === -1 || x === 1));
    const d = new DebrisSystem(4, pit, () => {});
    const c = d.spawn(1, 0.5, 0.4, 0.5);
    step(d, 1);
    d.launch(c, 4, 0, 0);
    // hops carry a random nudge (identical hops loop forever): give it a few tries
    step(d, 4);
    expect(d.pos[c * 3]).toBeGreaterThan(1.2);
  });

  it('a cube spinning fast in place gets three upward pushes, one per second, then is removed (#42)', () => {
    // a cube that never settles: it skids in place at low speed while spinning fast
    const d = new DebrisSystem(4, floor, () => {});
    const c = d.spawn(1, 0.5, 0.4, 0.5);
    const keepStuck = () => {
      d.state[c] = 1;
      d.vel[c * 3] = 1.2;
      d.vel[c * 3 + 2] = 0;
      d.spin[c * 4 + 3] = 6;
    };
    let pushes = 0, prevVy = 0;
    const tick = () => {
      keepStuck();
      d.update(1 / 60);
      if (prevVy <= 3 && d.vel[c * 3 + 1] > 3) pushes++; // a rising edge is a push
      prevVy = d.vel[c * 3 + 1];
    };
    for (let t = 0; t < 3.5; t += 1 / 60) tick();
    expect(pushes).toBe(3);
    expect(d.isAlive(c)).toBe(true); // three pushes given, the fourth check has not come yet
    for (let t = 0; t < 1.5; t += 1 / 60) { if (!d.isAlive(c)) break; tick(); }
    expect(pushes).toBe(3);
    expect(d.isAlive(c)).toBe(false);
  });
});

describe('loose cubes beside other cubes always come to rest (#103)', () => {
  beforeEach(() => seedFx(7));
  const S = DEBRIS_SIZE * 0.98;
  const turnsOver = (d: DebrisSystem, ids: number[], seconds: number) => {
    let turns = 0;
    const q = Float32Array.from(d.quat);
    for (let t = 0; t < seconds; t += 1 / 60) {
      d.update(1 / 60);
      for (const i of ids) for (let k = 0; k < 4; k++) if (d.quat[i * 4 + k] !== q[i * 4 + k]) { turns++; break; }
      q.set(d.quat);
    }
    return turns;
  };

  it('two cubes that just touch, a float32 hair under the separation distance, rest and stop turning', () => {
    const d = new DebrisSystem(4, floor, () => {});
    const a = d.spawn(1, 10.3, 0.36, 0.5), b = d.spawn(1, 10.3 + S, 0.36, 0.5);
    expect(d.pos[b * 3] - d.pos[a * 3]).toBeLessThan(S);
    step(d, 1);
    expect(turnsOver(d, [a, b], 3)).toBe(0);
    expect(d.isResting(a) && d.isResting(b)).toBe(true);
  });

  it('a cube on the edge of a resting cube lands on it, rests and stops turning', () => {
    for (const offset of [0.5, 0.65]) {
      const d = new DebrisSystem(4, floor, () => {});
      const below = d.spawn(1, 1.6, 0.36, 0.5);
      step(d, 1);
      const top = d.spawn(1, 1.6 + offset, 0.36 + DEBRIS_SIZE, 0.5);
      step(d, 1);
      expect(d.isAlive(top)).toBe(true);
      expect(d.isResting(top)).toBe(true);
      expect(d.pos[top * 3 + 1]).toBeCloseTo(d.pos[below * 3 + 1] + DEBRIS_SIZE, 2);
      expect(turnsOver(d, [top], 3)).toBe(0);
    }
  });

  it('cubes jammed in a sealed cell keep their heading instead of turning every frame', () => {
    const cell = (x: number, y: number, z: number) => x !== 0 || y !== 0 || z !== 0;
    const d = new DebrisSystem(4, cell, () => {});
    const a = d.spawn(1, 0.4, 0.36, 0.5), b = d.spawn(1, 0.6, 0.36, 0.5);
    step(d, 1);
    expect(turnsOver(d, [a, b].filter(i => d.isAlive(i)), 3)).toBe(0);
  });
});

describe('white bombs: the love flag of a slot', () => {
  beforeEach(() => seedFx(7));

  it('a bomb keeps its polarity flag until its fuse ends, and the fuse hands it to onFuse', () => {
    const seen: [number, boolean][] = [];
    const d = new DebrisSystem(8, floor, () => {});
    d.onFuse = (i, _x, _y, _z, love) => seen.push([i, love]);
    const white = d.spawn(1, 0.5, 1, 0.5);
    d.fuse[white] = 0.2;
    d.love[white] = 1;
    const black = d.spawn(1, 2.5, 1, 0.5);
    d.fuse[black] = 0.2;
    step(d, 0.5);
    expect(seen).toContainEqual([white, true]);
    expect(seen).toContainEqual([black, false]);
  });

  it('a removed bomb clears its flag, and a slot reused by a new cube starts with none', () => {
    const d = new DebrisSystem(2, floor, () => {});
    const a = d.spawn(1, 0.5, 1, 0.5);
    d.fuse[a] = 5;
    d.love[a] = 1;
    d.remove(a);
    expect(d.love[a]).toBe(0);
    // a stale flag left on the free slot next in the ring must not survive the next spawn there
    d.love[1] = 1;
    const b = d.spawn(1, 2.5, 1, 0.5);
    expect(b).toBe(1);
    expect(d.love[b]).toBe(0);
  });
});
