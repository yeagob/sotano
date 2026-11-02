// Crates (issue #6): most broken crates give nothing, some give a key, heart or small bomb.
// Issue #48: each floor has its own chance, drawn from the run's seed within [CRATE_DROP / 3, CRATE_DROP].

import { describe, expect, it } from 'vitest';
import { Rng, RunRandom } from '../src/core/rng';
import { CRATE_CONTENTS, CRATE_DROP, CRATE_DROP_MIN, floorCrateChance, rollCrate } from '../src/content/tables/crates';

const SEEDS = [1, 2, 0xBEEF, 0xC0FFEE, 77];
const FLOORS = Array.from({ length: 10 }, (_, k) => k);

describe('crate drops', () => {
  it('only gives keys, hearts and small bombs', () => {
    expect(CRATE_CONTENTS.entries.map(e => e.value).sort()).toEqual(['bomb', 'heart', 'key']);
  });

  it('gives nothing most of the time, and about the floor chance of the time', () => {
    const rng = new Rng(7);
    const n = 20000;
    for (const chance of [CRATE_DROP_MIN, CRATE_DROP]) {
      let drops = 0;
      for (let i = 0; i < n; i++) if (rollCrate(rng, chance, { floor: 1 })) drops++;
      expect(Math.abs(drops / n - chance)).toBeLessThan(0.02);
    }
  });

  it('is deterministic for the same stream', () => {
    const a = new Rng(42), b = new Rng(42);
    for (let i = 0; i < 200; i++) expect(rollCrate(a, CRATE_DROP, { floor: 3 })).toBe(rollCrate(b, CRATE_DROP, { floor: 3 }));
  });

  it('the range is a third of CRATE_DROP up to CRATE_DROP', () => {
    expect(CRATE_DROP).toBe(0.3);
    expect(CRATE_DROP_MIN * 3).toBeCloseTo(CRATE_DROP, 12);
  });

  it('every floor of every seed has a chance within [CRATE_DROP / 3, CRATE_DROP]', () => {
    for (const seed of SEEDS) {
      const rr = new RunRandom(seed);
      for (const k of FLOORS) {
        const c = floorCrateChance(rr, k);
        expect(c).toBeGreaterThanOrEqual(CRATE_DROP_MIN);
        expect(c).toBeLessThanOrEqual(CRATE_DROP);
      }
    }
  });

  it('the chances spread over the whole range across many seeds', () => {
    const all: number[] = [];
    for (let seed = 1; seed <= 200; seed++) for (const k of FLOORS) all.push(floorCrateChance(new RunRandom(seed), k));
    expect(Math.min(...all)).toBeLessThan(CRATE_DROP_MIN + 0.02);
    expect(Math.max(...all)).toBeGreaterThan(CRATE_DROP - 0.02);
  });

  it('the same seed always gives the same floor chance', () => {
    for (const seed of SEEDS) {
      const a = new RunRandom(seed), b = new RunRandom(seed);
      for (const k of FLOORS) {
        const first = floorCrateChance(a, k);
        expect(floorCrateChance(b, k)).toBe(first);
        expect(floorCrateChance(a, k)).toBe(first); // asking again gives the same answer
      }
    }
  });

  it('different floors of one seed have different chances (seeds 1, 0xBEEF, 0xC0FFEE)', () => {
    for (const seed of [1, 0xBEEF, 0xC0FFEE]) {
      const rr = new RunRandom(seed);
      expect(new Set(FLOORS.map(k => floorCrateChance(rr, k))).size).toBe(FLOORS.length);
    }
  });

  it('the same floor differs between seeds', () => {
    const chances = SEEDS.map(seed => floorCrateChance(new RunRandom(seed), 3));
    expect(new Set(chances).size).toBe(SEEDS.length);
  });

  it('drawing the floor chances never shifts the drops stream', () => {
    const drawn = new RunRandom(9), untouched = new RunRandom(9);
    for (const k of FLOORS) floorCrateChance(drawn, k);
    const a = drawn.stream('drops'), b = untouched.stream('drops');
    for (let i = 0; i < 300; i++) {
      expect(rollCrate(a, CRATE_DROP, { floor: 2 })).toBe(rollCrate(b, CRATE_DROP, { floor: 2 }));
    }
  });

  it('a floor chance rolls about as often as it says', () => {
    const rr = new RunRandom(0xBEEF);
    const chance = floorCrateChance(rr, 3);
    const rng = rr.stream('drops');
    const n = 20000;
    let drops = 0;
    for (let i = 0; i < n; i++) if (rollCrate(rng, chance, { floor: 3 })) drops++;
    expect(Math.abs(drops / n - chance)).toBeLessThan(0.02);
  });
});
