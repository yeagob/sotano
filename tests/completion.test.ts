// The completion percentage (docs/design/built/progression/COMPLETION.md, issue #180): the pure function over the save
// and the content ids, its parts and weights, the monotone rule, the save migration of the first-time records, and the
// keeper that records them.

import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, ACHIEVEMENT_BOSSES } from '../src/content/achievements';
import { ITEMS } from '../src/content/items';
import { LEVELS } from '../src/content/levels';
import { POTION_IDS } from '../src/content/potions';
import { PART_WEIGHT, PARTS, completion, contentIds, type ContentIds, type CompletionSave } from '../src/game/completion';
import { AchievementKeeper } from '../src/game/achievement-keeper';
import { defaultMeta, loadMeta, mergeMeta, unionFirsts, type LoadedMeta, type MetaStore } from '../src/game/meta';

/** A small content: every count is set, so the expected numbers are plain. */
const CONTENT: ContentIds = {
  floors: ['0', '1', '2', '3'],
  bosses: ['alpha', 'beta'],
  achievements: ['a.one', 'a.two', 'a.three', 'a.four'],
  practices: ['p.one', 'p.two'],
  bestiary: ['e.one', 'e.two'],
  recipes: ['r.one', 'r.two'],
  bookPages: 10,
};

/** Every id of CONTENT, done: a complete save. */
function full(): CompletionSave {
  const achievements: Record<string, number> = {};
  for (const id of CONTENT.achievements) achievements[id] = 1;
  achievements['boss.alpha.destroyed'] = 1;
  achievements['boss.beta.converted'] = 1;
  return {
    achievements,
    roots: { page: CONTENT.bookPages },
    firsts: { floors: [...CONTENT.floors], practices: [...CONTENT.practices], bestiary: [...CONTENT.bestiary], recipes: [...CONTENT.recipes] },
  };
}

const EMPTY: CompletionSave = { achievements: {}, roots: { page: 1 } };

describe('the parts and weights (COMPLETION §2)', () => {
  it('weights add up to 100 and name the seven parts of the proposal', () => {
    const total = PARTS.reduce((sum, p) => sum + PART_WEIGHT[p], 0);
    expect(total).toBe(100);
    expect([...PARTS].sort()).toEqual(['achievements', 'bestiary', 'book', 'bosses', 'floors', 'practices', 'recipes']);
    expect(PART_WEIGHT).toEqual({ floors: 25, bosses: 20, achievements: 20, practices: 15, bestiary: 10, recipes: 5, book: 5 });
  });
});

describe('the completion percentage', () => {
  it('is 0% for an empty save: nothing done, the book at its first page', () => {
    const c = completion(EMPTY, CONTENT);
    expect(c.percent).toBe(0);
    for (const p of PARTS) expect(c.parts[p].done).toBe(p === 'book' ? 1 : 0);
  });

  it('counts a partial state: a floor, a boss by either ending, one achievement, a practice and a page', () => {
    const save: CompletionSave = {
      achievements: { 'boss.alpha.converted': 1, 'a.one': 1 },
      roots: { page: 6 },
      firsts: { floors: ['0', '9'], practices: ['p.one'], bestiary: [], recipes: ['r.one', 'not-in-content'] },
    };
    const c = completion(save, CONTENT);
    expect(c.parts.floors).toEqual({ done: 1, total: 4, weight: 25 });
    expect(c.parts.bosses).toEqual({ done: 1, total: 2, weight: 20 });
    expect(c.parts.achievements).toEqual({ done: 1, total: 4, weight: 20 });
    expect(c.parts.practices).toEqual({ done: 1, total: 2, weight: 15 });
    expect(c.parts.bestiary).toEqual({ done: 0, total: 2, weight: 10 });
    expect(c.parts.recipes).toEqual({ done: 1, total: 2, weight: 5 });
    expect(c.parts.book).toEqual({ done: 6, total: 10, weight: 5 });
    // 25*(1/4) + 20*(1/2) + 20*(1/4) + 15*(1/2) + 0 + 5*(1/2) + 5*(6/10) = 6.25 + 10 + 5 + 7.5 + 2.5 + 3 = 34.25
    expect(c.percent).toBe(34);
  });

  it('is 100% when every part is complete, and not before', () => {
    expect(completion(full(), CONTENT).percent).toBe(100);
    const done = full();
    const almost: CompletionSave = { ...done, firsts: { ...done.firsts, bestiary: ['e.one'] } };
    expect(completion(almost, CONTENT).percent).toBe(95);
    expect(completion({ ...full(), roots: { page: 9 } }, CONTENT).percent).toBe(99);
  });

  it('a bosses share is done by destroyed or converted, and a book page past the book does not count', () => {
    const save: CompletionSave = { achievements: { 'boss.beta.destroyed': 1 }, roots: { page: 500 } };
    const c = completion(save, CONTENT);
    expect(c.parts.bosses.done).toBe(1);
    expect(c.parts.book.done).toBe(10);
  });

  it('counts a part with no content as complete', () => {
    const none: ContentIds = { ...CONTENT, practices: [] };
    expect(completion(EMPTY, none).parts.practices.done).toBe(0);
    expect(completion(full(), none).percent).toBe(100);
  });

  it('adding content changes the totals without a code change', () => {
    const grown: ContentIds = { ...CONTENT, floors: [...CONTENT.floors, '4'], recipes: [...CONTENT.recipes, 'r.three'], bookPages: 12 };
    const before = completion(full(), CONTENT);
    const after = completion(full(), grown);
    expect(before.percent).toBe(100);
    expect(after.parts.floors.total).toBe(5);
    expect(after.parts.recipes.total).toBe(3);
    expect(after.parts.book.total).toBe(12);
    expect(after.percent).toBeLessThan(100);
  });

  it('never goes down as the player does more: each step keeps or raises the number', () => {
    const steps: CompletionSave[] = [
      EMPTY,
      { ...EMPTY, roots: { page: 4 } },
      { ...EMPTY, roots: { page: 4 }, achievements: { 'a.one': 1 } },
      { ...EMPTY, roots: { page: 4 }, achievements: { 'a.one': 1 }, firsts: { floors: ['0'] } },
      { ...EMPTY, roots: { page: 4 }, achievements: { 'a.one': 1, 'boss.alpha.destroyed': 1 }, firsts: { floors: ['0'], recipes: ['r.one'] } },
      full(),
    ];
    let last = -1;
    for (const s of steps) {
      const p = completion(s, CONTENT).percent;
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });

  it('reads the shipped content: 0% at the start of a new save, with the catalogue counts', () => {
    const shipped = contentIds(10);
    expect(shipped.achievements).toHaveLength(ACHIEVEMENTS.length);
    expect(shipped.bosses).toEqual([...ACHIEVEMENT_BOSSES]);
    expect(shipped.floors).toHaveLength(LEVELS.length);
    expect(shipped.practices).toHaveLength(ITEMS.length);
    expect(shipped.recipes).toEqual([...POTION_IDS]);
    expect(completion(defaultMeta(), shipped).percent).toBe(0);
  });
});

describe('the first-time records in the save (SAVE §1, §3)', () => {
  it('a version 2 record without firsts reads as none, and keeps its progress', () => {
    const old = JSON.stringify({ v: 2, staircase: true, roots: { page: 7 }, achievements: { 'a.one': 5 }, counts: {} });
    const loaded = loadMeta({ read: () => old, write: () => undefined });
    expect(loaded.firsts).toBeUndefined();
    expect(loaded.achievements).toEqual({ 'a.one': 5 });
    expect(loaded.roots.page).toBe(7);
    expect(loaded.staircase).toBe(true);
    expect(completion(loaded, CONTENT).parts.achievements.done).toBe(1);
  });

  it('a version 1 record still migrates, with no firsts', () => {
    const loaded = loadMeta({ read: () => JSON.stringify({ v: 1, staircase: true }), write: () => undefined });
    expect(loaded.staircase).toBe(true);
    expect(loaded.firsts).toBeUndefined();
  });

  it('the stored and the tab copies are merged as a union, with no duplicates', () => {
    const stored = { ...defaultMeta(), firsts: { floors: ['0'], practices: ['p.one'], bestiary: [], recipes: [] } };
    const mine = { ...defaultMeta(), firsts: { floors: ['0', '1'], practices: [], bestiary: ['e.one'], recipes: ['r.one'] } };
    const merged = mergeMeta(stored, mine);
    expect(merged.firsts).toEqual({ floors: ['0', '1'], practices: ['p.one'], bestiary: ['e.one'], recipes: ['r.one'] });
    expect(unionFirsts(undefined, undefined)).toBeUndefined();
  });

  it('the keeper records each first time once, saves it, and does nothing in the sandbox', () => {
    let raw: string | null = null;
    const store: MetaStore = { read: () => raw, write: s => { raw = s; } };
    const record: LoadedMeta = defaultMeta();
    const keeper = new AchievementKeeper(record, store);
    expect(keeper.recordFirst('floors', '0')).toBe(true);
    expect(keeper.recordFirst('floors', '0')).toBe(false);
    expect(loadMeta(store).firsts?.floors).toEqual(['0']);

    const sandbox = new AchievementKeeper(defaultMeta(), store);
    sandbox.live = false;
    expect(sandbox.recordFirst('recipes', 'plain-tonic')).toBe(false);
    expect(loadMeta(store).firsts?.recipes ?? []).toEqual([]);
  });
});
