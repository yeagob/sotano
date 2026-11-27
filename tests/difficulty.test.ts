// The global difficulty (issue #352, docs/design/built/progression/DIFFICULTY.md): from the Roots' mastery level to the
// tier chances and the number of projections in a room, with the seed contract kept.

import { describe, expect, it } from 'vitest';
import { ENEMY_BUDGET, ENEMY_BY_ID, pickWave } from '../src/content/enemies';
import { Rng, RunRandom } from '../src/core/rng';
import { countMultiplier, difficultyOf, MAX_DIFFICULTY, moreEnemies, surgeChance, SURGE_CHANCE } from '../src/enemies/difficulty';
import { spawnTier, tierChances, TIERS, type Tier } from '../src/enemies/tiers';
import { buildRun, signature } from './helpers';

const rank = (t: Tier) => TIERS.indexOf(t);

describe('the difficulty from the mastery level', () => {
  it('is 1 at levels 0 and below, 2 at level 100 and above, linear in between', () => {
    expect(difficultyOf(0)).toBe(1);
    expect(difficultyOf(-5)).toBe(1);
    expect(difficultyOf(Number.NaN)).toBe(1);
    expect(difficultyOf(1)).toBeCloseTo(1.01, 12);
    expect(difficultyOf(50)).toBeCloseTo(1.5, 12);
    expect(difficultyOf(99)).toBeCloseTo(1.99, 12);
    expect(difficultyOf(100)).toBe(MAX_DIFFICULTY);
    expect(difficultyOf(250)).toBe(2);
    for (let l = 0; l < 100; l++) expect(difficultyOf(l + 1) - difficultyOf(l)).toBeCloseTo(0.01, 12);
  });
});

describe('the tier chances grow with the difficulty, and a seed never loses a tier', () => {
  it('every chance at difficulty d+ is at least the one at d, on every floor', () => {
    for (let f = 1; f <= 13; f++) {
      for (let l = 0; l < 100; l++) {
        const a = tierChances(f, difficultyOf(l)), b = tierChances(f, difficultyOf(l + 1));
        expect(b.red).toBeGreaterThanOrEqual(a.red);
        expect(b.red + b.yellow).toBeGreaterThanOrEqual(a.red + a.yellow - 1e-12);
      }
    }
    expect(tierChances(13, difficultyOf(100)).yellow).toBeCloseTo(0.70, 12);
    expect(tierChances(13, difficultyOf(100)).red).toBeCloseTo(0.30, 12);
  });

  it('the same seed, spawn by spawn, only rises as the level rises (Black to Yellow to Red, never back)', () => {
    const doubt = ENEMY_BY_ID.get('doubt')!;
    let rose = 0;
    for (const root of [1, 7, 42, 2024]) {
      const rr = new RunRandom(root);
      for (let f = 1; f <= 13; f++) for (let seq = 0; seq < 40; seq++) {
        let last = -1;
        for (const level of [0, 1, 25, 50, 98, 99, 100]) {
          const t = rank(spawnTier(rr, f, 3, seq, doubt, difficultyOf(level)));
          expect(t).toBeGreaterThanOrEqual(last);
          if (last >= 0 && t > last) rose++;
          last = t;
        }
      }
    }
    expect(rose).toBeGreaterThan(0);
  });
});

describe('the number of projections in a room', () => {
  it('the multiplier is 1 at level 0 and 1.5 at level 100, linear in between', () => {
    expect(countMultiplier(difficultyOf(0))).toBe(1);
    expect(countMultiplier(difficultyOf(50))).toBeCloseTo(1.25, 12);
    expect(countMultiplier(difficultyOf(100))).toBe(1.5);
    expect(countMultiplier(difficultyOf(500))).toBe(1.5);
    expect(surgeChance(1)).toBe(0);
    expect(surgeChance(2)).toBe(SURGE_CHANCE);
  });

  it('at difficulty 1 a room is the room it always was; above it the usual roster comes first, unchanged', () => {
    for (let s = 1; s <= 300; s++) {
      for (const floor of [1, 4, 9]) {
        const base = ENEMY_BUDGET.pick(new Rng(s), floor, 1);
        expect(ENEMY_BUDGET.pick(new Rng(s), floor, 1, 1)).toEqual(base);
        const hard = ENEMY_BUDGET.pick(new Rng(s), floor, 1, 2);
        expect(hard.slice(0, base.length)).toEqual(base);
        if (!base.length) expect(hard).toEqual([]); // a quiet room stays quiet
      }
    }
  });

  it('at the maximum, about 1.5 times as many, never past the scaled cap plus the surge, every one of the floor', () => {
    let usual = 0, hard = 0;
    for (let s = 1; s <= 2000; s++) {
      const floor = 1 + (s % 9);
      const base = ENEMY_BUDGET.pick(new Rng(s), floor, 1);
      const more = ENEMY_BUDGET.pick(new Rng(s), floor, 1, 2);
      usual += base.length; hard += more.length;
      expect(more.length).toBeLessThanOrEqual(Math.floor(5 * 1.5) + 2);
      for (const id of more) expect(ENEMY_BY_ID.get(id)!.minFloor).toBeLessThanOrEqual(floor);
    }
    expect(hard / usual).toBeGreaterThan(1.4);
    expect(hard / usual).toBeLessThan(1.65);
  });

  it('the extras are seeded: the same seed gives the same extras, different seeds sometimes differ', () => {
    const counts = new Set<number>();
    for (let s = 1; s <= 200; s++) {
      const a = ENEMY_BUDGET.pick(new Rng(s), 5, 1, 1.7), b = ENEMY_BUDGET.pick(new Rng(s), 5, 1, 1.7);
      expect(a).toEqual(b);
      counts.add(a.length - ENEMY_BUDGET.pick(new Rng(s), 5, 1).length);
    }
    expect(counts.size).toBeGreaterThan(1);
  });

  it('the surge adds 1 or 2 more now and then, about 10 % of the rooms at the maximum', () => {
    let surges = 0, n = 0;
    for (let s = 1; s <= 4000; s++) {
      const base = ['doubt', 'doubt'];
      const out = moreEnemies(new Rng(s), 1, base, 2, 99, 5, ENEMY_BY_ID);
      // 2 × 1.5 = 3 exactly: anything past 3 is the surge
      expect(out.length).toBeGreaterThanOrEqual(3);
      expect(out.length).toBeLessThanOrEqual(5);
      if (out.length > 3) surges++;
      n++;
    }
    expect(surges / n).toBeGreaterThan(0.07);
    expect(surges / n).toBeLessThan(0.13);
  });

  it('a challenge wave grows the same way and keeps its seed', () => {
    for (let s = 1; s <= 100; s++) {
      const base = pickWave(new Rng(s), 4, 10);
      expect(pickWave(new Rng(s), 4, 10, 1)).toEqual(base);
      const hard = pickWave(new Rng(s), 4, 10, 2);
      expect(hard.slice(0, base.length)).toEqual(base);
      expect(pickWave(new Rng(s), 4, 10, 2)).toEqual(hard);
    }
  });

  it('a whole run: the same seed at difficulty 1 is the run of today, and at a fixed level the same seed gives the same run', () => {
    expect(signature(buildRun(77, 5, undefined, { difficulty: 1 }))).toBe(signature(buildRun(77, 5)));
    const a = buildRun(77, 5, undefined, { mastery: 60, difficulty: difficultyOf(60) });
    const b = buildRun(77, 5, undefined, { mastery: 60, difficulty: difficultyOf(60) });
    expect(signature(a)).toBe(signature(b));
    const usual = buildRun(77, 5, undefined, { mastery: 60 });
    a.floors.forEach((f, i) => f.rooms.forEach((r, j) => {
      const before = usual.floors[i].rooms[j].enemies;
      expect(r.enemies.slice(0, before.length)).toEqual(before);
    }));
  });
});
