// The Roots' mastery table (docs/design/not-built/levels/roots/REWARDS.md): level 0 as written, the at-a-glance
// rows, the monotonic and bounded rules, the notice lines, and the rule that the table never touches the
// Sanctuary chest or the way-down pedestal.

import { describe, expect, it } from 'vitest';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
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
  it('lays exactly one key or one bomb, both counts zero, the crates at factor 0.2', () => {
    const r = at(0);
    expect(r.oneOfKeyOrBomb).toBe(true);
    expect(r.keys).toBe(0);
    expect(r.bombs).toBe(0);
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
  it('level 5: a key, a bomb, a red heart, one free chest, crates 4 to 12 %', () => {
    expect(shape(at(5))).toEqual({
      oneOfKeyOrBomb: false, keys: 1, bombs: 1, hearts: ['red'], freeChests: 1,
      chestDraws: { min: 1, max: 3 }, crateFactor: 0.4, extraPractices: 0, altar: null, secondSanctuary: false,
    });
    expect(rootsCrateChance(CRATE_DROP_MIN, 5)).toBeCloseTo(0.04, 10);
    expect(rootsCrateChance(CRATE_DROP, 5)).toBeCloseTo(0.12, 10);
  });

  it('level 10: two keys, two bombs, red and blue hearts, one free chest, one extra practice', () => {
    const r = at(10);
    expect([r.keys, r.bombs, r.hearts, r.freeChests, r.extraPractices, r.crateFactor])
      .toEqual([2, 2, ['red', 'blue'], 1, 1, 0.5]);
  });

  it('level 15: three keys, two bombs, red, blue and stone hearts, two free chests, crates 7 to 21 %', () => {
    const r = at(15);
    expect([r.keys, r.bombs, r.hearts, r.freeChests, r.extraPractices]).toEqual([3, 2, ['red', 'blue', 'stone'], 2, 1]);
    expect(rootsCrateChance(CRATE_DROP, 15)).toBeCloseTo(0.21, 10);
  });

  it('level 22: four keys, three bombs, five hearts, three free chests, crates 9 to 27 %', () => {
    const r = at(22);
    expect([r.keys, r.bombs, r.hearts.length, r.freeChests, r.extraPractices]).toEqual([4, 3, 5, 3, 1]);
    expect(r.hearts).toEqual(['red', 'blue', 'stone', 'red', 'blood']);
    expect(rootsCrateChance(CRATE_DROP, 22)).toBeCloseTo(0.27, 10);
  });

  it('level 25: as 22 with four free chests, crates 10 to 30 % (as every other floor), two extra practices', () => {
    const r = at(25);
    expect([r.keys, r.bombs, r.freeChests, r.extraPractices, r.crateFactor]).toEqual([4, 3, 4, 2, 1.0]);
    expect(rootsCrateChance(CRATE_DROP_MIN, 25)).toBeCloseTo(0.1, 10);
    expect(rootsCrateChance(CRATE_DROP, 25)).toBeCloseTo(0.3, 10);
  });

  it('level 36: five keys, four bombs, eight hearts, six free chests of two to four draws, crates 13 to 39 %', () => {
    const r = at(36);
    expect([r.keys, r.bombs, r.hearts.length, r.freeChests, r.extraPractices]).toEqual([5, 4, 8, 6, 2]);
    expect(r.hearts).toEqual(['red', 'blue', 'stone', 'red', 'blood', 'star', 'blue', 'black']);
    expect(r.chestDraws).toEqual({ min: 2, max: 4 });
    expect(rootsCrateChance(CRATE_DROP_MIN, 36)).toBeCloseTo(0.13, 10);
    expect(rootsCrateChance(CRATE_DROP, 36)).toBeCloseTo(0.39, 10);
  });

  it('level 40: six keys, five bombs, ten hearts (one star, two blood), six free chests, crates 13 to 39 %', () => {
    const r = at(40);
    expect(shape(r)).toEqual({
      oneOfKeyOrBomb: false, keys: 6, bombs: 5,
      hearts: ['red', 'blue', 'stone', 'red', 'blood', 'star', 'blue', 'black', 'stone', 'blood'],
      freeChests: 6, chestDraws: { min: 2, max: 4 }, crateFactor: 1.3, extraPractices: 2, altar: null, secondSanctuary: false,
    });
    expect(rootsCrateChance(CRATE_DROP_MIN, 40)).toBeCloseTo(0.13, 10);
    expect(rootsCrateChance(CRATE_DROP, 40)).toBeCloseTo(0.39, 10);
  });

  it('level 50: six keys, five bombs, ten hearts, six free chests, crates 15 to 45 %, two extra practices', () => {
    const r = at(50);
    expect([r.keys, r.bombs, r.hearts.length, r.freeChests, r.extraPractices, r.altar]).toEqual([6, 5, 10, 6, 2, null]);
    expect(r.crateFactor).toBe(1.5);
    expect(rootsCrateChance(CRATE_DROP_MIN, 50)).toBeCloseTo(0.15, 10);
    expect(rootsCrateChance(CRATE_DROP, 50)).toBeCloseTo(0.45, 10);
  });

  it('level 100: six keys, five bombs, eleven hearts, six free chests of three to five draws, crates 25 to 75 %, an altar up to four stars, a second Sanctuary', () => {
    const r = at(100);
    expect(shape(r)).toEqual({
      oneOfKeyOrBomb: false, keys: 6, bombs: 5,
      hearts: ['red', 'blue', 'stone', 'red', 'blood', 'star', 'blue', 'black', 'stone', 'blood', 'red'],
      freeChests: 6, chestDraws: { min: 3, max: 5 }, crateFactor: 2.5, extraPractices: 2,
      altar: { min: 2, max: 4 }, secondSanctuary: true,
    });
    expect(rootsCrateChance(CRATE_DROP_MIN, 100)).toBeCloseTo(0.25, 10);
    expect(rootsCrateChance(CRATE_DROP, 100)).toBe(CRATE_CHANCE_CAP);
  });

  it('the altar rises at 80 with stars 1 to 3, and its band moves to 2 to 4 at 90', () => {
    expect(at(79).altar).toBeNull();
    expect(at(80).altar).toEqual({ min: 1, max: 3 });
    expect(at(89).altar).toEqual({ min: 1, max: 3 });
    expect(at(90).altar).toEqual({ min: 2, max: 4 });
  });

  it('the crate factor stays 1.3 from 34 to 40, then grows by 0.02 a level: 1.32 at 41, 1.5 at 50, 2.5 at 100', () => {
    expect(at(34).crateFactor).toBe(1.3);
    expect(at(40).crateFactor).toBe(1.3);
    expect(at(41).crateFactor).toBe(1.32);
    expect(at(50).crateFactor).toBe(1.5);
    expect(at(100).crateFactor).toBe(2.5);
  });

  it('the free chests draw one to three, two to four from level 33 and three to five from level 70', () => {
    expect(at(32).chestDraws).toEqual({ min: 1, max: 3 });
    expect(at(33).chestDraws).toEqual({ min: 2, max: 4 });
    expect(at(69).chestDraws).toEqual({ min: 2, max: 4 });
    expect(at(70).chestDraws).toEqual({ min: 3, max: 5 });
  });

  it('the hearts follow REWARDS §2: the steps of 37 to 40 and the third red heart at 60', () => {
    expect(at(36).hearts.length).toBe(8);
    expect(at(39).hearts.slice(8)).toEqual(['stone']);
    expect(at(40).hearts.slice(8)).toEqual(['stone', 'blood']);
    expect(at(59).hearts.length).toBe(10);
    expect(at(60).hearts.slice(10)).toEqual(['red']);
  });

  it('only one star heart is ever laid (owner, 2026-11-12): the second star step gives a second blood heart', () => {
    for (const L of LEVELS) expect(at(L).hearts.filter(h => h === 'star').length, `level ${L}`).toBeLessThanOrEqual(1);
    expect(at(26).hearts).toContain('star');
    expect(at(40).hearts.filter(h => h === 'blood')).toHaveLength(2);
  });
});

describe('monotonic (every level keeps every step of the level below)', () => {
  it('counts, the chest draws, the altar band and the crate factor never go down', () => {
    for (const L of LEVELS.slice(0, -1)) {
      const a = at(L);
      const b = at(L + 1);
      expect(b.keys, `keys at ${L + 1}`).toBeGreaterThanOrEqual(a.keys);
      expect(b.bombs, `bombs at ${L + 1}`).toBeGreaterThanOrEqual(a.bombs);
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
      expect(r.bombs).toBeLessThanOrEqual(5);
      expect(r.hearts.length).toBeLessThanOrEqual(11);
      expect(r.freeChests).toBeLessThanOrEqual(6);
      expect(r.extraPractices).toBeLessThanOrEqual(2);
      expect(r.chestDraws.min).toBeGreaterThanOrEqual(1);
      expect(r.chestDraws.max).toBeLessThanOrEqual(5);
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
    expect(fields).toEqual(['altar', 'bombs', 'chestDraws', 'crateFactor', 'extraPractices', 'freeChests', 'hearts', 'keys', 'level', 'oneOfKeyOrBomb', 'secondSanctuary']);
  });
});

describe('gainsAt (REWARDS §7: one named line for each step)', () => {
  it('every level from 1 to 40 names exactly one step', () => {
    for (let L = 1; L <= 40; L++) expect(gainsAt(L), `level ${L}`).toHaveLength(1);
  });

  it('every level from 41 to 100 names at least the crate step, the factor growing every level', () => {
    for (let L = 41; L <= 100; L++) {
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

  it('names the steps of levels 37 to 40: a sixth key, a fifth bomb, a second stone and a second blood heart', () => {
    expect(gainsAt(37)).toEqual([{ key: 'mastery.gain.key', params: { n: 6 } }]);
    expect(gainsAt(38)).toEqual([{ key: 'mastery.gain.bomb', params: { n: 5 } }]);
    expect(gainsAt(39)).toEqual([{ key: 'mastery.gain.heartAgain.stone', params: {} }]);
    expect(gainsAt(40)).toEqual([{ key: 'mastery.gain.heartAgain.blood', params: {} }]);
  });

  it('a heart of a kind the Roots already lay gets the "again" line; a first heart of its kind gets the first-time line', () => {
    expect(gainsAt(7)).toEqual([{ key: 'mastery.gain.heart.blue', params: {} }]);
    expect(gainsAt(16)).toEqual([{ key: 'mastery.gain.heartAgain.red', params: {} }]);
    expect(gainsAt(26)).toEqual([{ key: 'mastery.gain.heart.star', params: {} }]);
    expect(gainsAt(32)).toEqual([{ key: 'mastery.gain.heartAgain.blue', params: {} }]);
    expect(gainsAt(60)).toEqual(expect.arrayContaining([
      { key: 'mastery.gain.heartAgain.red', params: {} },
      { key: 'mastery.gain.crates', params: { lo: 17, hi: 51 } },
    ]));
  });

  it('names no step above the cap: level 101 and beyond give no line, level 100 still gives its own', () => {
    expect(gainsAt(101)).toEqual([]);
    expect(gainsAt(1000)).toEqual([]);
    expect(gainsAt(100).length).toBeGreaterThan(0);
  });

  it('gives the crate line with its percentages at the levels the factor moves', () => {
    expect(gainsAt(2)).toEqual([{ key: 'mastery.gain.crates', params: { lo: 3, hi: 9 } }]);
    expect(gainsAt(100)).toEqual(expect.arrayContaining([
      { key: 'mastery.gain.crates', params: { lo: 25, hi: 75 } },
      { key: 'mastery.gain.sanctuary', params: {} },
    ]));
  });

  it('gives two lines when a level has two changes, the named step first and the crate line last', () => {
    // factor 2.1 at 80 and 2.3 at 90 (1.3 + 0.02 × (level − 40))
    expect(gainsAt(80)).toEqual([
      { key: 'mastery.gain.altar', params: { stars: 3 } },
      { key: 'mastery.gain.crates', params: { lo: 21, hi: 63 } },
    ]);
    expect(gainsAt(90)).toEqual([
      { key: 'mastery.gain.altarBest', params: { stars: 4 } },
      { key: 'mastery.gain.crates', params: { lo: 23, hi: 69 } },
    ]);
  });

  it('every key of every level is a message key of the English and the Spanish catalogue, with its parameters', () => {
    for (const L of LEVELS.slice(1)) {
      for (const line of gainsAt(L)) {
        for (const catalogue of [EN, ES]) {
          expect(line.key in catalogue.messages, `${line.key} at ${L} in ${catalogue.code}`).toBe(true);
          const text = String(catalogue.messages[line.key as keyof typeof catalogue.messages]);
          for (const name of Object.keys(line.params)) expect(text, `${line.key} at ${L}`).toContain(`{${name}}`);
        }
      }
    }
  });
});
