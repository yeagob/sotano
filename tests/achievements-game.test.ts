// The Roots' achievements in the game (docs/design/built/progression/ACHIEVEMENTS.md §2-4, MASTERY.md, REWARDS.md
// §3-§6): what the session keeper does with the events the game emits, the notice's words in both languages, the toll's
// wait for an open card, the Roots' practices drawn at run start, and the crate chance of floor 0. The Game itself needs
// WebGL, so its wiring is checked in the browser; the rules it calls are checked here.

import { afterEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/content/achievements';
import { ITEM_BY_ID } from '../src/content/items';
import { CRATE_DROP_MIN, crateChanceInBand } from '../src/content/tables/crates';
import { CRATE_CHANCE_CAP, EXTRA_PRACTICE_BAND, gainsAt, rootsRewards, rootsCrateChance } from '../src/content/tables/roots-mastery';
import { AchievementKeeper, gainParams, gainText, noticeKeys, sittingPayload, tollMayOpen, type AchievementNotice } from '../src/game/achievement-keeper';
import { mastery, type Payload } from '../src/game/achievements';
import { defaultMeta, loadMeta, type LoadedMeta, type MetaStore } from '../src/game/meta';
import { drawRootsItems, spotKey } from '../src/game/roots-draws';
import { EN, type MessageKey } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { locale, setLocale, t } from '../src/i18n';
import { SURFACE, pedestalSlots } from '../src/world/floor';
import { buildRun } from './helpers';

const NOW = 1_700_000_000_000;
const BOSS_DOWN: Payload = { boss: 'resistance', floor: 1, how: 'destroyed' };

/** An in-memory store that counts its writes: the save is written through it. */
function memory(initial: string | null = null): MetaStore & { value: string | null; writes: number } {
  const s = { value: initial, writes: 0, read: () => s.value, write: (v: string) => { s.value = v; s.writes++; } };
  return s;
}

/** A fresh record, as the browser store would hand it to the game at start. */
function fresh(store: MetaStore = memory()): { record: LoadedMeta; store: MetaStore & { writes: number } } {
  return { record: loadMeta(store), store: store as MetaStore & { writes: number } };
}

/** The session's keeper on a record, the way the game makes one at start (game.ts constructor). */
function session(record: LoadedMeta, store: MetaStore) {
  return new AchievementKeeper(record, store);
}

const ids = (ns: readonly AchievementNotice[]) => ns.map(n => n.id);

let saved = locale();
afterEach(() => setLocale(saved));

describe('bosses: destroyed and turned to your side (ACHIEVEMENTS §1)', () => {
  it('a boss destroyed unlocks its destroyed achievement once, and queues one notice', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    const fresh1 = k.track('bossOvercome', BOSS_DOWN, NOW);
    expect(ids(fresh1)).toEqual(['boss.resistance.destroyed']);
    expect(record.achievements).toEqual({ 'boss.resistance.destroyed': NOW });
    expect(k.pending).toBe(1);
    expect(k.level).toBe(1);
  });

  it('the save is written at once, with the unlock in it', () => {
    const { record, store } = fresh();
    session(record, store).track('bossOvercome', BOSS_DOWN, NOW);
    expect(store.writes).toBe(1);
    const back = loadMeta(store);
    expect(back.achievements).toEqual({ 'boss.resistance.destroyed': NOW });
  });

  it('the same boss converted in another run unlocks the other achievement, and its own notice', () => {
    const { record, store } = fresh();
    session(record, store).track('bossOvercome', BOSS_DOWN, NOW);
    // a new run is a new session on the same record
    const next = session(loadMeta(store), store);
    const converted = next.track('bossOvercome', { boss: 'resistance', floor: 1, how: 'converted' }, NOW + 1);
    expect(ids(converted)).toEqual(['boss.resistance.converted']);
    expect(next.level).toBe(2);
  });

  it('two bosses in one run give two notices, in the order they were overcome', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    k.track('bossOvercome', BOSS_DOWN, NOW);
    k.track('bossOvercome', { boss: 'verdict', floor: 3, how: 'converted' }, NOW + 1);
    const first = k.peek()!;
    k.confirm(first);
    const second = k.peek()!;
    k.confirm(second);
    expect([first.id, second.id]).toEqual(['boss.resistance.destroyed', 'boss.verdict.converted']);
    expect([first.level, second.level]).toEqual([1, 2]);
    expect(k.peek()).toBeUndefined();
  });

  it('a notice leaves the queue only when its card is confirmed: peeking, or a card cut off, keeps it', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    k.track('bossOvercome', BOSS_DOWN, NOW);
    const card = k.peek()!;
    expect(k.peek()).toBe(card);
    expect(k.pending).toBe(1);
    // the card is cut off (a restart, a death, another banner): nothing confirmed, so it is still the next card
    expect(k.peek()).toBe(card);
    expect(k.pending).toBe(1);
    k.confirm(card);
    expect(k.pending).toBe(0);
    expect(k.peek()).toBeUndefined();
  });

  it('a late confirmation of a card that already left the queue removes nothing else', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    k.track('bossOvercome', BOSS_DOWN, NOW);
    k.track('bossOvercome', { boss: 'verdict', floor: 3, how: 'converted' }, NOW + 1);
    const first = k.peek()!, second = k.peek()!;
    expect(first).toBe(second);
    k.confirm(first);
    const next = k.peek()!;
    k.confirm(first);
    expect(k.peek()).toBe(next);
    expect(k.pending).toBe(1);
  });

  it('a second destruction of the same boss gives nothing: no level, no notice, no write', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    k.track('bossOvercome', BOSS_DOWN, NOW);
    k.confirm(k.peek()!);
    const writes = store.writes;
    expect(k.track('bossOvercome', BOSS_DOWN, NOW + 9)).toEqual([]);
    expect(k.pending).toBe(0);
    expect(k.level).toBe(1);
    expect(store.writes).toBe(writes);
  });

  it('the Shadow ended by stillness is turned to your side, and never destroyed', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    expect(ids(k.track('bossOvercome', { boss: 'shadow', floor: 9, how: 'stillness' }, NOW))).toEqual(['boss.shadow.converted']);
    expect(record.achievements['boss.shadow.destroyed']).toBeUndefined();
  });
});

describe('meditations: three completed sittings, across runs (ACHIEVEMENTS §1)', () => {
  it('three completed sittings of one meditation unlock it; a quick reward and a cancel do not count', () => {
    expect(sittingPayload('quick', 'ground', 'roots')).toBeNull();
    expect(sittingPayload('cancel', 'ground', 'roots')).toBeNull();
    const done = sittingPayload('complete', 'ground', 'roots');
    expect(done).toEqual({ meditation: 'ground', source: 'roots' });

    const { record, store } = fresh();
    const k = session(record, store);
    k.track('meditationComplete', done!, NOW);
    k.track('meditationComplete', sittingPayload('complete', 'ground', 'vault')!, NOW + 1);
    expect(k.pending).toBe(0);
    expect(record.counts).toEqual({ 'meditation.ground': 2 });
    const third = k.track('meditationComplete', done!, NOW + 2);
    expect(ids(third)).toEqual(['meditation.ground']);
    expect(record.counts).toEqual({});
  });

  it('a count is kept in the save while the achievement is locked', () => {
    const { record, store } = fresh();
    session(record, store).track('meditationComplete', { meditation: 'box', source: 'roots' }, NOW);
    expect(loadMeta(store).counts).toEqual({ 'meditation.box': 1 });
    expect(mastery(record)).toBe(0);
  });
});

describe('stations and pages (ACHIEVEMENTS §1)', () => {
  it('the first brew unlocks brew.first once', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    expect(ids(k.track('brew', { potion: 'plain-tonic', iced: false, contents: 1, x: 0, y: 0, z: 0 }, NOW))).toEqual(['brew.first']);
    expect(k.track('brew', { potion: 'plain-tonic', iced: false, contents: 1, x: 0, y: 0, z: 0 }, NOW)).toEqual([]);
  });

  it('the first meal unlocks cook.first', () => {
    const { record, store } = fresh();
    expect(ids(session(record, store).track('cook', { meal: 'meal-small', part: 'flesh' }, NOW))).toEqual(['cook.first']);
  });

  it('reaching page 7 unlocks book.page.7, and no other page', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    expect(k.track('pageReached', { page: 6 }, NOW)).toEqual([]);
    expect(ids(k.track('pageReached', { page: 7 }, NOW))).toEqual(['book.page.7']);
  });

  it('a notice for the page reached at a run\'s end waits in the queue for the next run', () => {
    const { record, store } = fresh();
    const endOfRun = session(record, store);
    endOfRun.track('pageReached', { page: 7 }, NOW);
    expect(endOfRun.pending).toBe(1);
    // the queue is the session's, not the run's: the next run's keeper is the same one
    const card = endOfRun.peek();
    expect(card?.id).toBe('book.page.7');
    endOfRun.confirm(card!);
  });
});

describe('the sandbox and the lab (ACHIEVEMENTS §2)', () => {
  it('unlock nothing, queue nothing and write nothing', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    k.live = false;
    const before = JSON.stringify(record);
    expect(k.track('bossOvercome', BOSS_DOWN, NOW)).toEqual([]);
    expect(k.track('brew', { potion: 'x', iced: false, contents: 1, x: 0, y: 0, z: 0 }, NOW)).toEqual([]);
    expect(k.pending).toBe(0);
    expect(store.writes).toBe(0);
    expect(JSON.stringify(record)).toBe(before);
  });

  it('a record from a newer build is read-only: nothing is tracked or written', () => {
    const store = memory(JSON.stringify({ ...defaultMeta(), v: 3 }));
    const record = loadMeta(store);
    expect(record.readOnly).toBe(true);
    const k = session(record, store);
    expect(k.track('bossOvercome', BOSS_DOWN, NOW)).toEqual([]);
    expect(store.writes).toBe(0);
  });
});

describe('the notice (ACHIEVEMENTS §4)', () => {
  /** Every key a notice of any achievement, at any level from 1 to 100, can use. */
  function everyKey(): Set<MessageKey> {
    const keys = new Set<MessageKey>();
    for (const d of ACHIEVEMENTS) for (let level = 1; level <= 100; level++) {
      for (const k of noticeKeys({ id: d.id, level, gains: gainsAt(level) })) keys.add(k);
    }
    return keys;
  }

  it('every word of every notice exists in English and in Spanish', () => {
    for (const key of everyKey()) {
      expect(key in EN.messages, `English ${key}`).toBe(true);
      expect(key in ES.messages, `Spanish ${key}`).toBe(true);
    }
  });

  it('the gain line of each level names the stars and counts through the table, with no placeholder left', () => {
    for (const lang of ['en', 'es'] as const) {
      setLocale(lang);
      for (let level = 1; level <= 100; level++) {
        const text = gainText(gainsAt(level), t);
        if (gainsAt(level).length) expect(text, `${lang} level ${level}`).not.toMatch(/\{[a-z]+\}/);
      }
    }
  });

  it('stars are drawn with the game\'s own star marks, and percentages stay numbers', () => {
    const params = gainParams({ stars: 3, lo: 5, hi: 30 });
    expect(params.stars).toBe('★★★☆');
    expect(params.lo).toBe(5);
  });

  it('the gain line of a level with a practice names it up to ★★★, as the table gives', () => {
    const level = 10;
    const line = gainsAt(level).find(g => g.key === 'mastery.gain.practice')!;
    expect(line.params.stars).toBe(EXTRA_PRACTICE_BAND.max);
  });

  it('the card reads its words in the language it is drawn in: a change of language changes them', () => {
    const line = gainsAt(10).find(g => g.key === 'mastery.gain.practice')!;
    setLocale('en');
    const en = gainText([line], t);
    setLocale('es');
    const es = gainText([line], t);
    expect(en).not.toBe(es);
    expect(es).toContain('pedestal');
  });

  it('a level past the last step gives no gain line', () => {
    expect(gainsAt(0)).toEqual([]);
  });
});

describe('the toll waits for an open card (ACHIEVEMENTS §4)', () => {
  it('the toll may open with no card queued and none on screen', () => {
    expect(tollMayOpen(0, false)).toBe(true);
  });

  it('it waits while a card is queued, and while one is on screen', () => {
    expect(tollMayOpen(1, false)).toBe(false);
    expect(tollMayOpen(0, true)).toBe(false);
  });

  it('it opens once the queue is empty and the card is closed', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    k.track('bossOvercome', BOSS_DOWN, NOW);
    expect(tollMayOpen(k.showable, false)).toBe(false);
    k.confirm(k.peek()!);
    expect(tollMayOpen(k.showable, false)).toBe(true);
  });

  it('a card queued by a real run does not hold a toll in a sandbox or a lab, which show no card', () => {
    const { record, store } = fresh();
    const k = session(record, store);
    k.track('bossOvercome', BOSS_DOWN, NOW);
    expect(k.pending).toBe(1);
    // the same session now plays a sandbox: its keeper is not live, and the queued card can never be shown there
    k.live = false;
    expect(k.showable).toBe(0);
    expect(tollMayOpen(k.showable, false)).toBe(true);
  });
});

describe('the Roots\' mastery on floor 0 (REWARDS §3-§6)', () => {
  it('the crate chance of floor 0 is the base times the factor at level 0 and at level 100, capped', () => {
    const base = 0.3;
    expect(crateChanceInBand(base, 0, rootsRewards(0).crateFactor, CRATE_CHANCE_CAP)).toBeCloseTo(base * 0.2, 10);
    expect(crateChanceInBand(0.5, 0, rootsRewards(100).crateFactor, CRATE_CHANCE_CAP)).toBe(CRATE_CHANCE_CAP);
    expect(crateChanceInBand(CRATE_DROP_MIN, 0, rootsRewards(100).crateFactor, CRATE_CHANCE_CAP)).toBeCloseTo(CRATE_DROP_MIN * 2.5, 10);
  });

  it('the crate chance of floor 1 and of the surface is unchanged at every level', () => {
    for (const level of [0, 10, 100]) {
      for (const band of [1, 5, SURFACE]) {
        expect(crateChanceInBand(0.2, band, rootsRewards(level).crateFactor, CRATE_CHANCE_CAP)).toBe(0.2);
      }
    }
  });

  it('the game\'s crate chance of floor 0 agrees with the table\'s own rootsCrateChance', () => {
    for (const level of [0, 25, 100]) {
      expect(crateChanceInBand(0.25, 0, rootsRewards(level).crateFactor, CRATE_CHANCE_CAP)).toBeCloseTo(rootsCrateChance(0.25, level), 10);
    }
  });

  it('the Roots\' practices are drawn from the treasure pool, in the band, never a reserved one, and each once', () => {
    const run = buildRun(0xBEEF, 1, undefined, { mastery: 25 });
    const f0 = run.floors[0];
    expect(f0.practices).toHaveLength(2);
    const drawn = drawRootsItems(run.pools, run.rr, f0, 25);
    expect(drawn.size).toBe(2);
    const reserved = new Set(pedestalSlots(run.dungeon).map(s => run.pools.reservedFor(s.key)).filter((x): x is string => !!x));
    const values = [...drawn.values()];
    expect(new Set(values).size).toBe(values.length);
    for (const id of values) {
      expect(reserved.has(id), `${id} is reserved`).toBe(false);
      const q = ITEM_BY_ID.get(id)?.quality ?? 0;
      expect(q).toBeGreaterThanOrEqual(EXTRA_PRACTICE_BAND.min);
      expect(q).toBeLessThanOrEqual(EXTRA_PRACTICE_BAND.max);
    }
    for (const spot of f0.practices) expect(drawn.has(spotKey(spot))).toBe(true);
  });

  it('the draws are a function of the seed and the level: the same run draws the same practices', () => {
    const a = buildRun(7, 1, undefined, { mastery: 10 });
    const b = buildRun(7, 1, undefined, { mastery: 10 });
    const da = [...drawRootsItems(a.pools, a.rr, a.floors[0], 10).values()];
    const db = [...drawRootsItems(b.pools, b.rr, b.floors[0], 10).values()];
    expect(da).toEqual(db);
  });

  it('the level at which the Roots give no practice (0) draws none', () => {
    const run = buildRun(3, 1, undefined, { mastery: 0 });
    expect(drawRootsItems(run.pools, run.rr, run.floors[0], 0).size).toBe(0);
  });
});


// A keeper that is handed a record with the default fields reads them as the save does (SAVE §2).
describe('the record the keeper writes', () => {
  it('reads back as the same fields, version 2', () => {
    const { record, store } = fresh();
    session(record, store).track('cook', { meal: 'meal-small', part: 'flesh' }, NOW);
    const back = loadMeta(store);
    expect(back.v).toBe(2);
    expect(back.achievements).toEqual({ 'cook.first': NOW });
    expect(back.roots.page).toBe(1);
  });

});
