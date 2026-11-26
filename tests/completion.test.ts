// The completion percentage (docs/design/built/progression/COMPLETION.md, issue #180): the pure function over the save
// and the content ids, its parts and weights, the monotone rule, the save migration of the first-time records, and the
// keeper that records them.

import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, ACHIEVEMENT_BOSSES, BESTIARY_ACHIEVEMENT, COMPLETION_ACHIEVEMENT } from '../src/content/achievements';
import { BOSSES } from '../src/content/bosses';
import { ENEMIES } from '../src/content/enemies';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { loadBook } from '../src/content/book';
import { ITEMS } from '../src/content/items';
import { LEVELS } from '../src/content/levels';
import { POTION_IDS } from '../src/content/potions';
import { PART_WEIGHT, PARTS, bestiaryComplete, bestiaryVariations, completion, contentIds, hasVariations, partPercent, seenId, variationId, variationsOf, type ContentIds, type CompletionSave } from '../src/game/completion';
import { AchievementKeeper } from '../src/game/achievement-keeper';
import { BOOK_DOWNLOAD_PERCENT, bookButtonHtml, bookDownloadShown, bookHtml } from '../src/game/book-download';
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
    // the final achievement is the reward for 100%, so the percentage does not count it (COMPLETION §2)
    expect(shipped.achievements).toHaveLength(ACHIEVEMENTS.length - 1);
    expect(shipped.achievements).not.toContain(COMPLETION_ACHIEVEMENT);
    expect(shipped.bosses).toEqual([...ACHIEVEMENT_BOSSES]);
    // three routes: the descent's ten floors, the giant tree's seven stories and the sky's five guardian floors (COMPLETION §2)
    expect(shipped.floors).toHaveLength(22);
    expect(shipped.floors.slice(0, LEVELS.length)).toEqual(LEVELS.map(l => String(l.floor)));
    expect(shipped.floors).toEqual(expect.arrayContaining(['tree.roots', 'tree.canopy', 'tree.stars', 'sky.panda', 'sky.horse']));
    // every projection, creature, presence, guardian and herd the player can meet (the Spiked Entity is not wired yet)
    expect(shipped.bestiary).toHaveLength(76);
    // every presence of #149 counts once met (placed or come), with the Boundary
    for (const id of ['gardener', 'listener', 'trickster', 'echo', 'wanderer', 'elder', 'cartographer', 'child', 'witness', 'boatman', 'mender', 'star-reader', 'boundary']) expect(shipped.bestiary).toContain(id);
    expect(shipped.bestiary).toEqual(expect.arrayContaining(['gardener', 'listener', 'boundary', 'guardian-panda', 'herd-horse', 'wonder', 'procrastination-c']));
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

describe('the book download at 100% (COMPLETION §8)', () => {
  it('is hidden below 100% and shown at 100%', () => {
    expect(BOOK_DOWNLOAD_PERCENT).toBe(100);
    expect(bookDownloadShown(99)).toBe(false);
    expect(bookButtonHtml(99)).toBe('');
    expect(bookDownloadShown(100)).toBe(true);
    expect(bookButtonHtml(100)).toContain('data-act="book-download"');
  });

  it('is offered when the completion of a full save reaches 100', () => {
    expect(bookButtonHtml(completion(full(), CONTENT).percent)).not.toBe('');
    expect(bookButtonHtml(completion(EMPTY, CONTENT).percent)).toBe('');
  });

  it('writes the book as one self-contained page of text: no script, no network, no unreplaced placeholder', () => {
    for (const lang of ['en', 'es'] as const) {
      const html = bookHtml(loadBook(lang), lang);
      expect(html.startsWith('<!doctype html>')).toBe(true);
      expect(html).toContain(`<html lang="${lang}">`);
      expect(html).not.toMatch(/<script|https?:\/\/|<img|<link/i);
      expect(html).not.toMatch(/\{[a-z]+\}/);
      // every book page (kind 'book') is in it, and only those
      const pages = loadBook(lang).pages.filter(p => p.kind === 'book').length;
      expect(html.match(/<section class="page">/g)).toHaveLength(pages);
    }
  });
});

describe('a part shows its own percentage', () => {
  it('is its done count over its total, floored, and complete when it has no content', () => {
    expect(partPercent({ done: 5, total: 22, weight: 25 })).toBe(22);
    expect(partPercent({ done: 0, total: 29, weight: 5 })).toBe(0);
    expect(partPercent({ done: 22, total: 22, weight: 25 })).toBe(100);
    expect(partPercent({ done: 0, total: 0, weight: 5 })).toBe(100);
  });
});

describe('the bestiary counts every variation of every projection (issue #360)', () => {
  /** A bestiary of one projection with variations and one creature without. */
  const VARIED: ContentIds = { ...CONTENT, bestiary: ['e.one', 'c.one'], variations: { 'e.one': variationsOf('e.one') } };
  const withBestiary = (bestiary: string[]): CompletionSave => ({ ...EMPTY, firsts: { bestiary } });

  it('a projection has six variations: Black, Yellow and Red, each hostile and allied', () => {
    expect(variationsOf('doubt')).toEqual(['doubt:black', 'doubt:black:ally', 'doubt:yellow', 'doubt:yellow:ally', 'doubt:red', 'doubt:red:ally']);
    expect(variationId('doubt', 'red', true)).toBe('doubt:red:ally');
  });

  it('every projection of the shipped content has its variations; bosses, creatures and presences have none', () => {
    const shipped = contentIds(10);
    const vars = shipped.variations ?? {};
    expect(Object.keys(vars).sort()).toEqual(ENEMIES.map(e => e.id).sort());
    for (const v of Object.values(vars)) expect(v).toHaveLength(6);
    expect(bestiaryVariations(undefined, shipped)).toEqual({ seen: 0, total: ENEMIES.length * 6, complete: 0, projections: ENEMIES.length });
    for (const b of BOSSES) expect(vars[b.id]).toBeUndefined();
  });

  it('a sighting is kept under its variation for a projection, and under its own id for anything else', () => {
    const doubt = ENEMIES.find(e => e.id === 'doubt')!;
    expect(seenId(doubt, 'yellow', false)).toBe('doubt:yellow');
    expect(seenId(doubt, undefined, false)).toBe('doubt:black');
    expect(seenId(doubt, 'red', true)).toBe('doubt:red:ally');
    expect(seenId(BOSSES[0], 'red', false)).toBe(BOSSES[0].id);
    expect(seenId({ id: 'wonder', kind: 'creature' }, undefined, false)).toBe('wonder');
    expect(hasVariations(doubt)).toBe(true);
    expect(hasVariations({ id: 'shadow', kind: 'boss' })).toBe(false);
  });

  it('a projection counts only when all of its variations are seen, and the percentage follows the count', () => {
    const all = variationsOf('e.one');
    expect(completion(withBestiary(['c.one', ...all.slice(0, 5)]), VARIED).parts.bestiary.done).toBe(1);
    expect(completion(withBestiary(['c.one', ...all]), VARIED).parts.bestiary).toEqual({ done: 2, total: 2, weight: 10 });
    // the bare id is not a variation: it reads as the Black hostile one only (an older save's spawn)
    expect(completion(withBestiary(['e.one', ...all.slice(1)]), VARIED).parts.bestiary.done).toBe(1);
    expect(completion(withBestiary(['e.one']), VARIED).parts.bestiary.done).toBe(0);
    const before = completion(withBestiary(['c.one', ...all.slice(0, 5)]), VARIED).percent;
    const after = completion(withBestiary(['c.one', ...all]), VARIED).percent;
    expect(after - before).toBe(5);
  });

  it('a variation counts once: a repeat in the record changes nothing, and the keeper keeps it once', () => {
    const twice = withBestiary(['e.one:red', 'e.one:red', 'e.one:red:ally']);
    expect(bestiaryVariations(twice.firsts, VARIED).seen).toBe(2);
    let raw: string | null = null;
    const store: MetaStore = { read: () => raw, write: s => { raw = s; } };
    const keeper = new AchievementKeeper(defaultMeta(), store);
    expect(keeper.recordFirst('bestiary', 'doubt:red')).toBe(true);
    expect(keeper.recordFirst('bestiary', 'doubt:red')).toBe(false);
    expect(loadMeta(store).firsts?.bestiary).toEqual(['doubt:red']);
    expect(keeper.variations.seen).toBe(1);
  });

  it('the bestiary is complete only when the last variation of the last projection is seen', () => {
    const two: ContentIds = { ...CONTENT, bestiary: ['e.one', 'e.two'], variations: { 'e.one': variationsOf('e.one'), 'e.two': variationsOf('e.two') } };
    const order = [...variationsOf('e.one'), ...variationsOf('e.two')];
    const seen: string[] = [];
    for (const [i, v] of order.entries()) {
      expect(bestiaryComplete({ bestiary: seen }, two)).toBe(false);
      seen.push(v);
      expect(bestiaryComplete({ bestiary: seen }, two)).toBe(i === order.length - 1);
    }
    // a content without projections never completes it
    expect(bestiaryComplete({ bestiary: ['e.one'] }, CONTENT)).toBe(false);
  });

  it('the shipped record completes the bestiary with every variation, and the keeper says so', () => {
    const bestiary = ENEMIES.flatMap(e => variationsOf(e.id));
    expect(bestiaryComplete({ bestiary })).toBe(true);
    expect(bestiaryComplete({ bestiary: bestiary.slice(1) })).toBe(false);
    const record: LoadedMeta = { ...defaultMeta(), firsts: { floors: [], practices: [], bestiary, recipes: [] } };
    expect(new AchievementKeeper(record, { read: () => null, write: () => undefined }).bestiaryComplete).toBe(true);
  });

  it('the sandbox records no variation and writes nothing', () => {
    let writes = 0;
    const store: MetaStore = { read: () => null, write: () => { writes++; } };
    const sandbox = new AchievementKeeper(defaultMeta(), store);
    sandbox.live = false;
    for (const v of variationsOf('doubt')) expect(sandbox.recordFirst('bestiary', v)).toBe(false);
    expect(sandbox.track('bestiaryComplete', { projections: 40 }, 1)).toEqual([]);
    expect(writes).toBe(0);
    expect(sandbox.variations.seen).toBe(0);
  });

  it('the achievement is one catalogue entry on its own event, named in English and Spanish', () => {
    expect(ACHIEVEMENTS.filter(a => a.on === 'bestiaryComplete')).toEqual([{ id: BESTIARY_ACHIEVEMENT, on: 'bestiaryComplete' }]);
    for (const cat of [EN.messages, ES.messages] as Record<string, unknown>[]) {
      expect(typeof cat[`achievement.${BESTIARY_ACHIEVEMENT}.name`]).toBe('string');
      expect(typeof cat[`achievement.${BESTIARY_ACHIEVEMENT}.desc`]).toBe('string');
    }
    expect((EN.messages as Record<string, unknown>)['achievement.bestiary.full.name']).toBe('Know Thyself');
    expect((ES.messages as Record<string, unknown>)['achievement.bestiary.full.name']).toBe('Conócete a ti mismo');
  });
});
