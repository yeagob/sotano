// The save record, version 2 (docs/design/built/progression/SAVE.md): a round trip through a store, the
// version 1 migration, each field read on its own, and every bad record reads as the default: never an error.
// A record from a newer build is read-only: it reads as the default and is never written over.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { AchievementKeeper } from '../src/game/achievement-keeper';
import type { Payload } from '../src/game/achievements';
import { adoptMeta, browserStore, defaultMeta, loadMeta, resetMeta, saveMeta, type MetaState, type MetaStore } from '../src/game/meta';

/** An in-memory store that remembers the last string written and counts writes. */
function memory(initial: string | null = null): MetaStore & { value: string | null; writes: number } {
  const m = {
    value: initial,
    writes: 0,
    read() { return m.value; },
    write(s: string) { m.writes++; m.value = s; },
  };
  return m;
}

const DEFAULT = { v: 2, staircase: false, roots: { page: 1 }, achievements: {}, counts: {} };
const FULL: MetaState = {
  v: 2,
  staircase: true,
  metAt: 1234,
  roots: { page: 3 },
  achievements: { 'first-brew': 1000, 'three-sittings': 2000.5 },
  // a count only while its achievement is locked (SAVE §1): 'meditation.ground' is not unlocked here
  counts: { 'meditation.ground': 2 },
};

const raw = (o: unknown) => JSON.stringify(o);

describe('loadMeta and saveMeta', () => {
  it('reads the default when nothing was saved', () => {
    expect(loadMeta(memory())).toEqual(DEFAULT);
    expect(loadMeta(memory()).readOnly).toBeUndefined();
  });

  it('round-trips every field', () => {
    const store = memory();
    saveMeta(FULL, store);
    expect(loadMeta(store)).toEqual(FULL);
  });

  it('round-trips the default record without a time', () => {
    const store = memory();
    saveMeta(defaultMeta(), store);
    expect(loadMeta(store)).toEqual(DEFAULT);
    expect(loadMeta(store).metAt).toBeUndefined();
  });

  it('writes version 2 with only the known fields', () => {
    const store = memory();
    saveMeta({ ...FULL, extra: 'x' } as typeof FULL, store);
    expect(JSON.parse(store.value!)).toEqual(FULL);
  });

  it('reads broken JSON as the default', () => {
    expect(loadMeta(memory('{not json'))).toEqual(DEFAULT);
    expect(loadMeta(memory(''))).toEqual(DEFAULT);
  });

  it('reads non-object JSON as the default', () => {
    for (const s of ['null', '42', '"staircase"', 'true', '[]']) {
      expect(loadMeta(memory(s))).toEqual(DEFAULT);
    }
  });

  it('reads a record without a version, or with a bad one, as the default', () => {
    expect(loadMeta(memory(raw({ staircase: true })))).toEqual(DEFAULT);
    expect(loadMeta(memory(raw({ v: 0, staircase: true })))).toEqual(DEFAULT);
    expect(loadMeta(memory(raw({ v: '2', staircase: true })))).toEqual(DEFAULT);
    expect(loadMeta(memory(raw({ v: 1.5, staircase: true })))).toEqual(DEFAULT);
  });

  it('a bad record is still writable: the next save replaces it', () => {
    const store = memory('{not json');
    expect(loadMeta(store).readOnly).toBeUndefined();
    saveMeta({ ...defaultMeta(), staircase: true }, store);
    expect(loadMeta(store).staircase).toBe(true);
  });

  it('drops unknown fields', () => {
    const loaded = loadMeta(memory(raw({ ...FULL, junk: { deep: true } })));
    expect(loaded).toEqual(FULL);
    expect(Object.keys(loaded).sort()).toEqual(Object.keys(FULL).sort());
  });

  it('reads a store that throws on read as the default', () => {
    const throwing: MetaStore = { read() { throw new Error('blocked'); }, write() {} };
    expect(loadMeta(throwing)).toEqual(DEFAULT);
  });

  it('does not throw when the store refuses a write', () => {
    const refusing: MetaStore = { read: () => null, write() { throw new Error('quota'); } };
    expect(() => saveMeta(FULL, refusing)).not.toThrow();
  });
});

describe('version 2, field by field', () => {
  const withField = (field: string, value: unknown) => ({ ...FULL, [field]: value });

  it('a staircase that is not true reads as locked, the rest kept', () => {
    expect(loadMeta(memory(raw(withField('staircase', 'yes'))))).toEqual({ ...FULL, staircase: false });
  });

  it('a time that is not a finite number is dropped, the rest kept', () => {
    expect(loadMeta(memory(raw(withField('metAt', 'soon'))))).toEqual({ ...FULL, metAt: undefined });
  });

  it('a page that is not an integer of at least 1 reads as 1', () => {
    for (const page of [0, -2, 2.5, '3', null, true]) {
      expect(loadMeta(memory(raw(withField('roots', { page })))).roots, String(page)).toEqual({ page: 1 });
    }
    expect(loadMeta(memory(raw(withField('roots', 'three')))).roots).toEqual({ page: 1 });
    expect(loadMeta(memory(raw(withField('roots', null)))).roots).toEqual({ page: 1 });
  });

  it('an achievement whose time is not a finite number is dropped, the others kept', () => {
    const bad = { 'first-brew': 'now', 'three-sittings': 2000, 'boss-one': null };
    expect(loadMeta(memory(raw(withField('achievements', bad)))).achievements).toEqual({ 'three-sittings': 2000 });
  });

  it('achievements that are not an object read as none', () => {
    expect(loadMeta(memory(raw(withField('achievements', ['first-brew'])))).achievements).toEqual({});
    expect(loadMeta(memory(raw(withField('achievements', 7)))).achievements).toEqual({});
  });

  it('a count that is not an integer of at least 0 is dropped, the others kept', () => {
    const bad = { 'three-sittings': -1, 'boss-one': 1.5, 'first-brew': '2', 'cook': 0 };
    expect(loadMeta(memory(raw(withField('counts', bad)))).counts).toEqual({ cook: 0 });
  });

  it('counts that are not an object read as none', () => {
    expect(loadMeta(memory(raw(withField('counts', 'two')))).counts).toEqual({});
  });

  it('a broken field alone leaves the others as they were', () => {
    const loaded = loadMeta(memory(raw({ ...FULL, roots: { page: 0 }, counts: { x: -3 } })));
    expect(loaded).toEqual({ ...FULL, roots: { page: 1 }, counts: {} });
  });

  it('a version 2 record with no roots, achievements or counts reads them as the default', () => {
    expect(loadMeta(memory(raw({ v: 2, staircase: true })))).toEqual({ ...DEFAULT, staircase: true });
  });
});

describe('version 1 migration', () => {
  it('keeps the unlock and its time, and sets the new fields to the default', () => {
    expect(loadMeta(memory(raw({ v: 1, staircase: true, metAt: 99 })))).toEqual({
      v: 2, staircase: true, metAt: 99, roots: { page: 1 }, achievements: {}, counts: {},
    });
    expect(loadMeta(memory(raw({ v: 1, staircase: false })))).toEqual(DEFAULT);
  });

  it('ignores any version 2 field inside a version 1 record', () => {
    const loaded = loadMeta(memory(raw({ v: 1, staircase: true, roots: { page: 4 }, achievements: { x: 1 } })));
    expect(loaded).toEqual({ ...DEFAULT, staircase: true });
  });

  it('is written back as version 2 at the next save', () => {
    const store = memory(raw({ v: 1, staircase: true, metAt: 99 }));
    saveMeta(loadMeta(store), store);
    expect(JSON.parse(store.value!)).toEqual({ v: 2, staircase: true, metAt: 99, roots: { page: 1 }, achievements: {}, counts: {} });
  });
});

describe('a record from a newer build', () => {
  const newer = raw({ ...FULL, v: 3 });

  it('reads as the default, marked read-only', () => {
    expect(loadMeta(memory(newer))).toEqual({ ...DEFAULT, readOnly: true });
  });

  it('refuses every write, so the newer record is never written over', () => {
    const store = memory(newer);
    saveMeta(loadMeta(store), store);
    saveMeta({ ...FULL, readOnly: true }, store);
    expect(store.writes).toBe(0);
    expect(store.value).toBe(newer);
  });

  it('a reset does not write either, and keeps the read-only mark', () => {
    const store = memory(newer);
    const reset = resetMeta(loadMeta(store), store);
    expect(store.writes).toBe(0);
    expect(reset.readOnly).toBe(true);
    expect(store.value).toBe(newer);
  });
});

describe('resetMeta', () => {
  it('clears the page, the achievements and the counts, and keeps the staircase and its time', () => {
    const store = memory();
    const reset = resetMeta(FULL, store);
    const expected = { v: 2, staircase: true, metAt: 1234, roots: { page: 1 }, achievements: {}, counts: {} };
    expect(reset).toEqual(expected);
    expect(loadMeta(store)).toEqual(expected);
  });

  it('keeps a locked staircase locked', () => {
    const store = memory();
    expect(resetMeta({ ...defaultMeta(), roots: { page: 5 } }, store)).toEqual(DEFAULT);
    expect(loadMeta(store)).toEqual(DEFAULT);
  });

  it('does not throw when the store refuses the write', () => {
    const refusing: MetaStore = { read: () => null, write() { throw new Error('quota'); } };
    expect(() => resetMeta(FULL, refusing)).not.toThrow();
  });
});

describe('a store that refuses', () => {
  it('reads as the default and never throws on read or write', () => {
    const throwing: MetaStore = { read() { throw new Error('blocked'); }, write() { throw new Error('blocked'); } };
    expect(loadMeta(throwing)).toEqual(DEFAULT);
    expect(() => saveMeta(FULL, throwing)).not.toThrow();
    expect(() => resetMeta(FULL, throwing)).not.toThrow();
  });
});

describe('browserStore', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the record under the-roots.meta in localStorage', () => {
    const items = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => { items.set(k, v); },
    });
    saveMeta(FULL, browserStore);
    expect(JSON.parse(items.get('the-roots.meta') ?? 'null')).toEqual(FULL);
    expect(loadMeta(browserStore)).toEqual(FULL);
  });

  it('reads as the default and never throws when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('SecurityError'); },
    });
    expect(loadMeta(browserStore)).toEqual(DEFAULT);
    expect(() => saveMeta(FULL, browserStore)).not.toThrow();
  });

  it('reads as the default when there is no localStorage at all (node)', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(browserStore.read()).toBeNull();
    expect(() => browserStore.write('{}')).not.toThrow();
    expect(loadMeta(browserStore)).toEqual(DEFAULT);
  });
});

describe('two tabs never overwrite each other (SAVE §3)', () => {
  const NOW = 1_700_000_000_000;
  const tab = (store: MetaStore) => loadMeta(store);

  it('tab A unlocks an achievement and saves; tab B, loaded before that, advances the page and saves; the store holds both', () => {
    const store = memory();
    const a = tab(store), b = tab(store);
    const keeper = new AchievementKeeper(a, store);
    keeper.track('brew', { potion: 'x', iced: false, contents: 1, x: 0, y: 0, z: 0 }, NOW);
    expect(Object.keys(loadMeta(store).achievements)).toContain('brew.first');

    b.roots.page = 4;
    saveMeta(b, store);
    const stored = loadMeta(store);
    expect(stored.roots.page).toBe(4);
    expect(stored.achievements['brew.first']).toBe(NOW);
  });

  it('an achievement both tabs hold keeps the earlier unlock time', () => {
    const store = memory(raw({ ...defaultMeta(), achievements: { 'a.one': 3000 } }));
    const later = tab(store);
    const earlier = { ...defaultMeta(), achievements: { 'a.one': 1000 } } as MetaState;
    saveMeta(later, store);
    saveMeta(earlier, store);
    expect(loadMeta(store).achievements['a.one']).toBe(1000);
  });

  it('the highest page wins, and the staircase unlock is kept if either tab has it', () => {
    const store = memory(raw({ ...defaultMeta(), staircase: true, roots: { page: 2 } }));
    saveMeta({ ...defaultMeta(), roots: { page: 5 } }, store);
    expect(loadMeta(store).roots.page).toBe(5);
    expect(loadMeta(store).staircase).toBe(true);
  });

  it('a counter keeps the higher of the two counts, and is dropped once its achievement is unlocked by either tab', () => {
    const store = memory(raw({ ...defaultMeta(), counts: { 'med.ground': 2, 'med.dusk': 1 } }));
    saveMeta({ ...defaultMeta(), counts: { 'med.ground': 1, 'med.dusk': 2 } }, store);
    expect(loadMeta(store).counts).toEqual({ 'med.ground': 2, 'med.dusk': 2 });
    saveMeta({ ...defaultMeta(), achievements: { 'med.ground': 9 } }, store);
    expect(loadMeta(store).counts).toEqual({ 'med.dusk': 2 });
  });

  it('a newer build\'s record in the store is never written over', () => {
    const newer = raw({ v: 3, roots: { page: 9 } });
    const store = memory(newer);
    expect(saveMeta(FULL, store)).toBeUndefined();
    expect(store.value).toBe(newer);
    expect(store.writes).toBe(0);
  });

  it('a save returns the merged record it wrote, which a tab takes over', () => {
    const store = memory(raw({ ...defaultMeta(), roots: { page: 6 }, achievements: { 'x.y': 5 } }));
    const merged = saveMeta({ ...defaultMeta(), roots: { page: 2 } }, store);
    expect(merged?.roots.page).toBe(6);
    expect(merged?.achievements).toEqual({ 'x.y': 5 });
    const mine = tab(memory());
    adoptMeta(mine, merged!);
    expect(mine.roots.page).toBe(6);
  });

  it('the debug reset still resets: it replaces the stored progress and does not merge it back', () => {
    const store = memory(raw({ ...defaultMeta(), roots: { page: 6 }, achievements: { 'x.y': 5 }, counts: { 'z': 1 } }));
    resetMeta(loadMeta(store), store);
    expect(loadMeta(store)).toEqual(DEFAULT);
  });
});

describe('the debug reset in one tab (S.meta.reset, SAVE §4)', () => {
  const NOW = 1_700_000_000_000;
  const BREW: Payload = { potion: 'x', iced: false, contents: 1, x: 0, y: 0, z: 0 };
  const BOSS: Payload = { boss: 'resistance', floor: 1, how: 'destroyed' };
  /** A store holding progress: page 4 and one unlock. */
  const progressed = () => memory(raw({ ...defaultMeta(), roots: { page: 4 }, achievements: { 'brew.first': NOW } }));

  it('resets the tab record and the store to the default, and keeps the staircase and its time', () => {
    const store = memory(raw(FULL));
    const record = loadMeta(store);
    expect(new AchievementKeeper(record, store).reset()).toBe(true);
    const expected = { v: 2, staircase: true, metAt: 1234, roots: { page: 1 }, achievements: {}, counts: {} };
    expect(loadMeta(store)).toEqual(expected);
    expect(record).toEqual(expected);
  });

  it('the next save by this tab does not merge the old unlocks and page back', () => {
    const store = progressed();
    const record = loadMeta(store);
    new AchievementKeeper(record, store).reset();
    saveMeta(record, store);
    expect(loadMeta(store)).toEqual(DEFAULT);
  });

  it('after the reset an unlock saves only what happened after it', () => {
    const store = progressed();
    const record = loadMeta(store);
    const keeper = new AchievementKeeper(record, store);
    keeper.reset();
    const fresh = keeper.track('bossOvercome', BOSS, NOW + 1000);
    expect(fresh.map(n => n.id)).toEqual(['boss.resistance.destroyed']);
    const stored = loadMeta(store);
    expect(stored.achievements).toEqual({ 'boss.resistance.destroyed': NOW + 1000 });
    expect(stored.roots.page).toBe(1);
    expect(record.achievements).toEqual(stored.achievements);
  });

  it('the notices still queued are cleared, so no old card is shown', () => {
    const store = memory();
    const keeper = new AchievementKeeper(loadMeta(store), store);
    keeper.track('brew', BREW, NOW);
    expect(keeper.pending).toBe(1);
    keeper.reset();
    expect(keeper.pending).toBe(0);
    expect(keeper.showable).toBe(0);
    expect(keeper.peek()).toBeUndefined();
  });

  it('the sandbox and the lab refuse: nothing is reset and nothing is written', () => {
    const store = progressed();
    const record = loadMeta(store);
    const keeper = new AchievementKeeper(record, store);
    keeper.live = false;
    expect(keeper.reset()).toBe(false);
    expect(store.writes).toBe(0);
    expect(record.roots.page).toBe(4);
    expect(loadMeta(store).roots.page).toBe(4);
  });

  it('a read-only record (a newer build wrote it) refuses and is never written', () => {
    const newer = raw({ v: 3, roots: { page: 9 } });
    const store = memory(newer);
    const record = loadMeta(store);
    expect(new AchievementKeeper(record, store).reset()).toBe(false);
    expect(store.value).toBe(newer);
    expect(store.writes).toBe(0);
  });

  it('a store that now holds a newer build\'s record refuses, and this tab keeps its progress', () => {
    const store = progressed();
    const record = loadMeta(store);
    const newer = raw({ v: 3, roots: { page: 9 } });
    store.value = newer;
    expect(new AchievementKeeper(record, store).reset()).toBe(false);
    expect(store.value).toBe(newer);
    expect(record.roots.page).toBe(4);
    expect(record.achievements).toEqual({ 'brew.first': NOW });
  });
});
