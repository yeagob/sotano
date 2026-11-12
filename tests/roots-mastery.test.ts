// The Roots' mastery table (docs/design/not-built/levels/roots/REWARDS.md): level 0 as written, the at-a-glance
// rows, the monotonic and bounded rules, the notice lines, and the rule that the table never touches the
// Sanctuary chest or the way-down pedestal.

import { describe, expect, it } from 'vitest';
import { EN } from '../src/i18n/locales/en';
import { CRATE_DROP, CRATE_DROP_MIN } from '../src/content/tables/crates';
import {
  CRATE_CHANCE_CAP, EXTRA_PRACTICE_BAND, MASTERY_MAX, clampLevel, gainsAt, rootsCrateChance, rootsRewards,
  type RootsRewards,
} from '../src/content/tables/roots-mastery';

const LEVELS = Array.from({ length: MASTERY_MAX + 1 }, (_, i) => i);
const at = (level: number) => rootsRewards(level);

/** The level's table without its `level` field: the shape every spot check compares. */
const shape = ({ level: _level, ...rest }: RootsRewards) => rest;

describe('level 0 (REWARDS §2: poorer than today, nothing extra)', () => {
  it('lays exactly one key or one breakthrough, both counts zero, the crates at factor 0.2', () => {
    const r = at(0);
    expect(r.oneOfKeyOrBreakthrough).toBe(true);
    expect(r.keys).toBe(0);
    expect(r.breakthroughs).toBe(0);
    expect(r.crateFactor).toBe(0.2);
  });

  it('has no hearts, no free chests, no extra practices, no altar and no second Sanctuary', () => {
    const r = at(0);
    expect(r.hearts).toEqual([]);
    expect(r.freeChests).toBe(0);
    expect(r.extraPractices).toBe(0);
    expect(r.altar).toBeNull();
    expect(r.secondSanctuary).toBe(false);
    expect(r.chestDraws).toEqual({ min: 1, max: 3 });
  });

  it('crates give 2 to 6 % of the time (five times lower than the floor\'s 10 to 30 %)', () => {
    expect(rootsCrateChance(CRATE_DROP_MIN, 0)).toBeCloseTo(0.02, 10);
    expect(rootsCrateChance(CRATE_DROP, 0)).toBeCloseTo(0.06, 10);
  });

  it('has no gain line', () => {
    expect(gainsAt(0)).toEqual([]);
  });
});

describe('spot values (REWARDS §2 at-a-glance and the rows)', () => {
  it('level 5: a key, a breakthrough, a red heart, one free chest, crates 4 to 12 %', () => {
    expect(shape(at(5))).toEqual({
      oneOfKeyOrBreakthrough: false, keys: 1, breakthroughs: 1, hearts: ['red'], freeChests: 1,
      chestDraws: { min: 1, max: 3 }, crateFactor: 0.4, extraPractices: 0, altar: null, secondSanctuary: false,
    });
    expect(rootsCrateChance(CRATE_DROP_MIN, 5)).toBeCloseTo(0.04, 10);
    expect(rootsCrateChance(CRATE_DROP, 5)).toBeCloseTo(0.12, 10);
  });

  it('level 10: two keys, two breakthroughs, red and blue hearts, one free chest, one extra practice', () => {
    const r = at(10);
    expect([r.keys, r.breakthroughs, r.hearts, r.freeChests, r.extraPractices, r.crateFactor])
      .toEqual([2, 2, ['red', 'blue'], 1, 1, 0.5]);
  });

  it('level 15: three keys, two breakthroughs, red, blue and stone hearts, two free chests, crates 7 to 21 %', () => {
    const r = at(15);
    expect([r.keys, r.breakthroughs, r.hearts, r.freeChests, r.extraPractices]).toEqual([3, 2, ['red', 'blue', 'stone'], 2, 1]);
    expect(rootsCrateChance(CRATE_DROP, 15)).toBeCloseTo(0.21, 10);
  });

  it('level 22: four keys, three breakthroughs, five hearts, three free chests, crates 9 to 27 %', () => {
    const r = at(22);
    expect([r.keys, r.breakthroughs, r.hearts.length, r.freeChests, r.extraPractices]).toEqual([4, 3, 5, 3, 1]);
    expect(r.hearts).toEqual(['red', 'blue', 'stone', 'red', 'blood']);
    expect(rootsCrateChance(CRATE_DROP, 22)).toBeCloseTo(0.27, 10);
  });

  it('level 25: as 22 with four free chests, crates 10 to 30 % (as every other floor), two extra practices', () => {
    const r = at(25);
    expect([r.keys, r.breakthroughs, r.freeChests, r.extraPractices, r.crateFactor]).toEqual([4, 3, 4, 2, 1.0]);
    expect(rootsCrateChance(CRATE_DROP_MIN, 25)).toBeCloseTo(0.1, 10);
    expect(rootsCrateChance(CRATE_DROP, 25)).toBeCloseTo(0.3, 10);
  });

  it('level 36: five keys, four breakthroughs, eight hearts, six free chests of two to four draws, crates 13 to 39 %', () => {
    const r = at(36);
    expect([r.keys, r.breakthroughs, r.hearts.length, r.freeChests, r.extraPractices]).toEqual([5, 4, 8, 6, 2]);
    expect(r.hearts).toEqual(['red', 'blue', 'stone', 'red', 'blood', 'star', 'blue', 'black']);
    expect(r.chestDraws).toEqual({ min: 2, max: 4 });
    expect(rootsCrateChance(CRATE_DROP_MIN, 36)).toBeCloseTo(0.13, 10);
    expect(rootsCrateChance(CRATE_DROP, 36)).toBeCloseTo(0.39, 10);
  });

  it('level 50: six keys, four breakthroughs, eight hearts, six free chests, crates 16 to 47 %', () => {
    const r = at(50);
    expect([r.keys, r.breakthroughs, r.hearts.length, r.freeChests, r.extraPractices, r.altar]).toEqual([6, 4, 8, 6, 2, null]);
    expect(r.crateFactor).toBe(1.58);
    expect(rootsCrateChance(CRATE_DROP_MIN, 50)).toBeCloseTo(0.158, 10);
    expect(rootsCrateChance(CRATE_DROP, 50)).toBeCloseTo(0.474, 10);
  });

  it('level 100: six keys, five breakthroughs, ten hearts, six free chests, crates 26 to 75 %, an altar up to four stars, a second Sanctuary', () => {
    const r = at(100);
    expect(shape(r)).toEqual({
      oneOfKeyOrBreakthrough: false, keys: 6, breakthroughs: 5,
      hearts: ['red', 'blue', 'stone', 'red', 'blood', 'star', 'blue', 'black', 'stone', 'star'],
      freeChests: 6, chestDraws: { min: 2, max: 4 }, crateFactor: 2.58, extraPractices: 2,
      altar: { min: 2, max: 4 }, secondSanctuary: true,
    });
    expect(rootsCrateChance(CRATE_DROP_MIN, 100)).toBeCloseTo(0.258, 10);
    expect(rootsCrateChance(CRATE_DROP, 100)).toBe(CRATE_CHANCE_CAP);
  });

  it('the altar rises at 80 with stars 1 to 3, and its band moves to 2 to 4 at 90', () => {
    expect(at(79).altar).toBeNull();
    expect(at(80).altar).toEqual({ min: 1, max: 3 });
    expect(at(89).altar).toEqual({ min: 1, max: 3 });
    expect(at(90).altar).toEqual({ min: 2, max: 4 });
  });

  it('the crate factor is 1.32 at 37 and grows by 0.02 a level after 36', () => {
    expect(at(36).crateFactor).toBe(1.3);
    expect(at(37).crateFactor).toBe(1.32);
    expect(at(50).crateFactor).toBe(1.58);
    expect(at(100).crateFactor).toBe(2.58);
  });

  it('the free chests draw two to four from level 33 and one to three before', () => {
    expect(at(32).chestDraws).toEqual({ min: 1, max: 3 });
    expect(at(33).chestDraws).toEqual({ min: 2, max: 4 });
  });
});

describe('monotonic (every level keeps every step of the level below)', () => {
  it('counts, the chest draws, the altar band and the crate factor never go down', () => {
    for (const L of LEVELS.slice(0, -1)) {
      const a = at(L);
      const b = at(L + 1);
      expect(b.keys, `keys at ${L + 1}`).toBeGreaterThanOrEqual(a.keys);
      expect(b.breakthroughs, `breakthroughs at ${L + 1}`).toBeGreaterThanOrEqual(a.breakthroughs);
      expect(b.freeChests, `free chests at ${L + 1}`).toBeGreaterThanOrEqual(a.freeChests);
      expect(b.extraPractices, `extra practices at ${L + 1}`).toBeGreaterThanOrEqual(a.extraPractices);
      expect(b.chestDraws.min, `draws min at ${L + 1}`).toBeGreaterThanOrEqual(a.chestDraws.min);
      expect(b.chestDraws.max, `draws max at ${L + 1}`).toBeGreaterThanOrEqual(a.chestDraws.max);
      expect(b.crateFactor, `crate factor at ${L + 1}`).toBeGreaterThanOrEqual(a.crateFactor);
      expect(rootsCrateChance(CRATE_DROP, L + 1), `crate chance at ${L + 1}`).toBeGreaterThanOrEqual(rootsCrateChance(CRATE_DROP, L));
      expect(b.altar?.min ?? 0, `altar min at ${L + 1}`).toBeGreaterThanOrEqual(a.altar?.min ?? 0);
      expect(b.altar?.max ?? 0, `altar max at ${L + 1}`).toBeGreaterThanOrEqual(a.altar?.max ?? 0);
      expect(Number(b.secondSanctuary), `second Sanctuary at ${L + 1}`).toBeGreaterThanOrEqual(Number(a.secondSanctuary));
    }
  });

  it('the hearts of a level are a prefix of the hearts of the next: nothing is taken away', () => {
    for (const L of LEVELS.slice(0, -1)) {
      const a = at(L).hearts;
      expect(at(L + 1).hearts.slice(0, a.length)).toEqual([...a]);
    }
  });
});

describe('bounded (REWARDS §6)', () => {
  it('counts, bands and the chance stay inside their limits at every level', () => {
    for (const L of LEVELS) {
      const r = at(L);
      expect(r.keys).toBeLessThanOrEqual(6);
      expect(r.breakthroughs).toBeLessThanOrEqual(5);
      expect(r.hearts.length).toBeLessThanOrEqual(10);
      expect(r.freeChests).toBeLessThanOrEqual(6);
      expect(r.extraPractices).toBeLessThanOrEqual(2);
      expect(r.chestDraws.min).toBeGreaterThanOrEqual(1);
      expect(r.chestDraws.max).toBeLessThanOrEqual(4);
      expect(Number.isFinite(r.crateFactor)).toBe(true);
      expect(rootsCrateChance(CRATE_DROP, L)).toBeLessThanOrEqual(CRATE_CHANCE_CAP);
      if (r.altar) {
        expect(r.altar.min).toBeGreaterThanOrEqual(1);
        expect(r.altar.max).toBeLessThanOrEqual(4);
        expect(r.altar.min).toBeLessThanOrEqual(r.altar.max);
      }
      expect(EXTRA_PRACTICE_BAND.min).toBeGreaterThanOrEqual(1);
      expect(EXTRA_PRACTICE_BAND.max).toBeLessThanOrEqual(4);
    }
  });

  it('the crate chance never exceeds the cap, even at the top of the floor\'s range and level 100', () => {
    expect(rootsCrateChance(CRATE_DROP, 100)).toBe(0.75);
    expect(rootsCrateChance(1, 100)).toBe(0.75);
  });

  it('clamps the level: below 0 reads as 0, above 100 as 100, not a number as 0, a fraction is floored', () => {
    expect(clampLevel(-5)).toBe(0);
    expect(clampLevel(250)).toBe(100);
    expect(clampLevel(Number.NaN)).toBe(0);
    expect(clampLevel(Number.POSITIVE_INFINITY)).toBe(100);
    expect(clampLevel(7.9)).toBe(7);
    expect(rootsRewards(-5)).toEqual(rootsRewards(0));
    expect(rootsRewards(250)).toEqual(rootsRewards(100));
  });
});

describe('the Sanctuary chest and the way-down pedestal stay as they are', () => {
  it('the table never names them, at any level', () => {
    for (const L of LEVELS) {
      const text = JSON.stringify(at(L));
      expect(text, `level ${L}`).not.toContain('roots-gift');
      expect(text, `level ${L}`).not.toContain('roots-door');
    }
  });

  it('the table has the same fields at every level and no field for the Sanctuary or the pedestal', () => {
    const fields = Object.keys(at(0)).sort();
    for (const L of LEVELS) expect(Object.keys(at(L)).sort(), `level ${L}`).toEqual(fields);
    expect(fields).toEqual(['altar', 'breakthroughs', 'chestDraws', 'crateFactor', 'extraPractices', 'freeChests', 'hearts', 'keys', 'level', 'oneOfKeyOrBreakthrough', 'secondSanctuary']);
  });
});

describe('gainsAt (REWARDS §7: one named line for each step)', () => {
  it('every level from 1 to 36 names exactly one step', () => {
    for (let L = 1; L <= 36; L++) expect(gainsAt(L), `level ${L}`).toHaveLength(1);
  });

  it('every level from 37 to 100 names at least the crate step', () => {
    for (let L = 37; L <= 100; L++) {
      expect(gainsAt(L).map(g => g.key), `level ${L}`).toContain('mastery.gain.crates');
    }
  });

  it('names the steps of the table at the levels the table gives them', () => {
    expect(gainsAt(1)).toEqual([{ key: 'mastery.gain.both', params: {} }]);
    expect(gainsAt(3)).toEqual([{ key: 'mastery.gain.heart.red', params: {} }]);
    expect(gainsAt(4)).toEqual([{ key: 'mastery.gain.chest', params: { n: 1 } }]);
    expect(gainsAt(6)).toEqual([{ key: 'mastery.gain.key', params: { n: 2 } }]);
    expect(gainsAt(9)).toEqual([{ key: 'mastery.gain.bomb', params: { n: 2 } }]);
    expect(gainsAt(10)).toEqual([{ key: 'mastery.gain.practice', params: { n: 1, stars: 3 } }]);
    expect(gainsAt(25)).toEqual([{ key: 'mastery.gain.practice', params: { n: 2, stars: 3 } }]);
    expect(gainsAt(33)).toEqual([{ key: 'mastery.gain.chestDraws', params: {} }]);
    expect(gainsAt(36)).toEqual([{ key: 'mastery.gain.heart.black', params: {} }]);
  });

  it('names no step above the cap: level 101 and beyond give no line, level 100 still gives its own', () => {
    expect(gainsAt(101)).toEqual([]);
    expect(gainsAt(1000)).toEqual([]);
    expect(gainsAt(100).length).toBeGreaterThan(0);
  });

  it('gives the crate line with its percentages at the levels the factor moves', () => {
    expect(gainsAt(2)).toEqual([{ key: 'mastery.gain.crates', params: { lo: 3, hi: 9 } }]);
    expect(gainsAt(100)).toEqual(expect.arrayContaining([
      { key: 'mastery.gain.crates', params: { lo: 26, hi: 75 } },
      { key: 'mastery.gain.sanctuary', params: {} },
    ]));
  });

  it('gives two lines when a level has two changes, the named step first and the crate line last', () => {
    // factor 2.18 at 80 and 2.38 at 90 (1.3 + 0.02 × (level − 36))
    expect(gainsAt(80)).toEqual([
      { key: 'mastery.gain.altar', params: { stars: 3 } },
      { key: 'mastery.gain.crates', params: { lo: 22, hi: 65 } },
    ]);
    expect(gainsAt(90)).toEqual([
      { key: 'mastery.gain.altarBest', params: { stars: 4 } },
      { key: 'mastery.gain.crates', params: { lo: 24, hi: 71 } },
    ]);
  });

  it('every key of every level is a message key of the English catalogue, with its parameters', () => {
    for (const L of LEVELS.slice(1)) {
      for (const line of gainsAt(L)) {
        expect(line.key in EN.messages, `${line.key} at ${L}`).toBe(true);
        const text = String(EN.messages[line.key as keyof typeof EN.messages]);
        for (const name of Object.keys(line.params)) expect(text, `${line.key} at ${L}`).toContain(`{${name}}`);
      }
    }
  });
});
