// The achievement catalogue (docs/design/built/progression/ACHIEVEMENTS.md) and its tracker (MASTERY.md):
// the 40 entries, their ids and message keys, the events they wait for, and the rules of the tracker: unlock
// once, `times` across runs, no double award, which boss ending counts for which achievement, the mastery count.

import { describe, expect, it } from 'vitest';
import { BOSSES } from '../src/content/bosses';
import { ACHIEVEMENTS, ACHIEVEMENT_BOSSES, ACHIEVEMENT_EVENTS, ACHIEVEMENT_MEDITATIONS, type AchievementDef } from '../src/content/achievements';
import { SEQUENCES } from '../src/content/presences/meditations';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';
import { catalogueErrors, isUnlocked, mastery, matches, track, type AchievementState, type Payload } from '../src/game/achievements';

/** The payloads the tracker tests feed. The sample of every event lives in the synergy matrix (tests/synergy-matrix.test.ts),
 *  which also checks that each `where` field is in its event's sample. */
const BREW = { potion: 'spring-tonic', iced: false, contents: 1, x: 0, y: 0, z: 0 };
const COOK = { meal: 'meal-small', part: 'fruit' };

const EMPTY: AchievementState = { achievements: {}, counts: {} };
const NOW = 1_700_000_000_000;

/** Feeds one event and returns the result, keeping the state along for the next call. */
function run(state: AchievementState, event: string, payload: Payload, now = NOW) {
  return track(state, event, payload, now);
}

const boss = (id: string, how: string) => ({ event: 'bossOvercome', payload: { boss: id, floor: 1, how } });
const ids = (defs: readonly AchievementDef[]) => defs.map(d => d.id);

describe('the catalogue (ACHIEVEMENTS §1-2)', () => {
  it('holds the 40 achievements that ship with #147 (36 plus the 4 book pages), and is well formed', () => {
    expect(ACHIEVEMENTS).toHaveLength(40);
    expect(catalogueErrors(ACHIEVEMENTS)).toEqual([]);
  });

  it('has unique ids, shaped like ^[a-z0-9.-]+$, never more than 100', () => {
    const all = ids(ACHIEVEMENTS);
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(id).toMatch(/^[a-z0-9.-]+$/);
    expect(all.length).toBeLessThanOrEqual(100);
  });

  it('has 28 boss achievements, one destroyed and one converted for each of the 14 bosses', () => {
    const bosses = ACHIEVEMENTS.filter(d => d.on === 'bossOvercome');
    expect(bosses).toHaveLength(28);
    expect(new Set(ACHIEVEMENT_BOSSES).size).toBe(14);
    for (const id of ACHIEVEMENT_BOSSES) {
      expect(ids(bosses)).toContain(`boss.${id}.destroyed`);
      expect(ids(bosses)).toContain(`boss.${id}.converted`);
    }
  });

  it('names exactly the bosses of src/content/bosses', () => {
    expect([...ACHIEVEMENT_BOSSES].sort()).toEqual(BOSSES.map(b => b.id).sort());
  });

  it('names exactly the meditations of src/content/presences/meditations.ts, three completions each', () => {
    expect([...ACHIEVEMENT_MEDITATIONS].sort()).toEqual(SEQUENCES.map(s => s.id).sort());
    const meds = ACHIEVEMENTS.filter(d => d.on === 'meditationComplete');
    expect(meds).toHaveLength(6);
    for (const d of meds) expect(d.times).toBe(3);
  });

  it('has the first brew and the first meal', () => {
    expect(ACHIEVEMENTS.find(d => d.id === 'brew.first')).toEqual({ id: 'brew.first', on: 'brew' });
    expect(ACHIEVEMENTS.find(d => d.id === 'cook.first')).toEqual({ id: 'cook.first', on: 'cook' });
  });

  it('has the four book-page achievements, each on pageReached with its page number', () => {
    const pages = ACHIEVEMENTS.filter(d => d.on === 'pageReached');
    expect(pages.map(d => d.id)).toEqual(['book.page.7', 'book.page.54', 'book.page.69', 'book.page.100']);
    for (const d of pages) expect(d.where).toEqual({ page: Number(d.id.slice('book.page.'.length)) });
  });

  it('the Shadow\'s converted entry also takes the stillness ending, and its destroyed entry does not', () => {
    const converted = ACHIEVEMENTS.find(d => d.id === 'boss.shadow.converted');
    const destroyed = ACHIEVEMENTS.find(d => d.id === 'boss.shadow.destroyed');
    expect(converted?.where).toEqual({ boss: 'shadow', how: ['converted', 'stillness'] });
    expect(destroyed?.where).toEqual({ boss: 'shadow', how: 'destroyed' });
  });

  it('every event is one the catalogue declares', () => {
    for (const d of ACHIEVEMENTS) expect(ACHIEVEMENT_EVENTS).toContain(d.on);
  });

  it('every id has its two message keys in English and in Spanish', () => {
    for (const d of ACHIEVEMENTS) {
      for (const suffix of ['name', 'desc']) {
        const key = `achievement.${d.id}.${suffix}`;
        expect(key in EN.messages, `English ${key}`).toBe(true);
        expect(key in ES.messages, `Spanish ${key}`).toBe(true);
      }
    }
  });

  it('the catalogue validator refuses a broken catalogue', () => {
    const broken: AchievementDef[] = [
      { id: 'a.one', on: 'brew' },
      { id: 'a.one', on: 'brew' },
      { id: 'Bad Id', on: 'brew' },
      { id: 'a.two', on: 'brew', times: 0 },
      { id: 'a.three', on: 'nothing' as never },
      { id: 'a.four', on: 'brew', where: { potion: { nested: true } as never } },
    ];
    const errors = catalogueErrors(broken);
    expect(errors.some(e => e.includes('duplicate'))).toBe(true);
    expect(errors.some(e => e.includes('must match'))).toBe(true);
    expect(errors.some(e => e.includes('times'))).toBe(true);
    expect(errors.some(e => e.includes('unknown event'))).toBe(true);
    expect(errors.some(e => e.includes('where.potion'))).toBe(true);
    const many = Array.from({ length: 101 }, (_, i) => ({ id: `x.${i}`, on: 'brew' as const }));
    expect(catalogueErrors(many).some(e => e.includes('cap is 100'))).toBe(true);
  });
});

describe('matching (where, and a list means any of its values)', () => {
  it('a destroyed Resistance matches its destroyed entry and not its converted one', () => {
    const d = ACHIEVEMENTS.find(x => x.id === 'boss.resistance.destroyed')!;
    const c = ACHIEVEMENTS.find(x => x.id === 'boss.resistance.converted')!;
    expect(matches(d, 'bossOvercome', { boss: 'resistance', floor: 1, how: 'destroyed' })).toBe(true);
    expect(matches(d, 'bossOvercome', { boss: 'resistance', floor: 1, how: 'converted' })).toBe(false);
    expect(matches(c, 'bossOvercome', { boss: 'resistance', floor: 1, how: 'destroyed' })).toBe(false);
  });

  it('a missing payload field does not match', () => {
    const d = ACHIEVEMENTS.find(x => x.id === 'boss.resistance.destroyed')!;
    expect(matches(d, 'bossOvercome', { boss: 'resistance' })).toBe(false);
  });

  it('another event never matches', () => {
    const d = ACHIEVEMENTS.find(x => x.id === 'brew.first')!;
    expect(matches(d, 'cook', {})).toBe(false);
  });
});

describe('the tracker (ACHIEVEMENTS §2, MASTERY §1)', () => {
  it('unlocks an achievement once, at the given time', () => {
    const first = run(EMPTY, 'brew', BREW);
    expect(ids(first.unlocked)).toEqual(['brew.first']);
    expect(first.state.achievements).toEqual({ 'brew.first': NOW });
    const again = run(first.state, 'brew', BREW, NOW + 5);
    expect(again.unlocked).toEqual([]);
    expect(again.state).toBe(first.state);
    expect(again.state.achievements['brew.first']).toBe(NOW);
  });

  it('brew.first counts any potion, the Plain Tonic included', () => {
    expect(ids(run(EMPTY, 'brew', { ...BREW, potion: 'plain-tonic' }).unlocked)).toEqual(['brew.first']);
  });

  it('each book-page achievement unlocks on pageReached with its own page, and on no other', () => {
    for (const page of [7, 54, 69, 100]) {
      const id = `book.page.${page}`;
      for (const other of [1, 6, 8, 53, 55, 99]) {
        expect(run(EMPTY, 'pageReached', { page: other }).unlocked.map(d => d.id), `page ${other}`).not.toContain(id);
      }
      const reached = run(EMPTY, 'pageReached', { page });
      expect(reached.unlocked.map(d => d.id), `page ${page}`).toEqual([id]);
      expect(run(reached.state, 'pageReached', { page }).unlocked, `second time at ${page}`).toEqual([]);
    }
  });

  it('cook.first unlocks on the first meal', () => {
    expect(ids(run(EMPTY, 'cook', COOK).unlocked)).toEqual(['cook.first']);
  });

  it('a meditation with times 3 needs three completed sittings, and counts them', () => {
    const one = run(EMPTY, 'meditationComplete', { meditation: 'ground', source: 'roots' });
    expect(one.unlocked).toEqual([]);
    expect(one.state.counts).toEqual({ 'meditation.ground': 1 });
    const two = run(one.state, 'meditationComplete', { meditation: 'ground', source: 'vault' });
    expect(two.unlocked).toEqual([]);
    expect(two.state.counts).toEqual({ 'meditation.ground': 2 });
    const three = run(two.state, 'meditationComplete', { meditation: 'ground', source: 'roots' });
    expect(ids(three.unlocked)).toEqual(['meditation.ground']);
    expect(three.state.achievements).toEqual({ 'meditation.ground': NOW });
    expect(three.state.counts).toEqual({});
  });

  it('a sitting of another meditation does not count toward this one', () => {
    const r = run(EMPTY, 'meditationComplete', { meditation: 'dusk', source: 'roots' });
    expect(r.state.counts).toEqual({ 'meditation.dusk': 1 });
    expect(r.state.counts['meditation.ground']).toBeUndefined();
  });

  it('a locked times achievement keeps its count across calls with the state it was given', () => {
    const start: AchievementState = { achievements: {}, counts: { 'meditation.box': 2 } };
    const done = run(start, 'meditationComplete', { meditation: 'box', source: 'roots' });
    expect(ids(done.unlocked)).toEqual(['meditation.box']);
    expect(start.counts).toEqual({ 'meditation.box': 2 });
  });

  it('a destroyed boss unlocks only its destroyed achievement, a converted one only its converted one', () => {
    const d = run(EMPTY, boss('inertia', 'destroyed').event, boss('inertia', 'destroyed').payload);
    expect(ids(d.unlocked)).toEqual(['boss.inertia.destroyed']);
    const c = run(EMPTY, boss('inertia', 'converted').event, boss('inertia', 'converted').payload);
    expect(ids(c.unlocked)).toEqual(['boss.inertia.converted']);
  });

  it('the second destruction of the same boss gives nothing', () => {
    const first = run(EMPTY, 'bossOvercome', { boss: 'hoard', floor: 2, how: 'destroyed' });
    const second = run(first.state, 'bossOvercome', { boss: 'hoard', floor: 2, how: 'destroyed' });
    expect(second.unlocked).toEqual([]);
    expect(second.state).toBe(first.state);
  });

  it('the Shadow turned by stillness unlocks boss.shadow.converted, and not boss.shadow.destroyed', () => {
    const r = run(EMPTY, 'bossOvercome', { boss: 'shadow', floor: 9, how: 'stillness' });
    expect(ids(r.unlocked)).toEqual(['boss.shadow.converted']);
    expect(isUnlocked(r.state, 'boss.shadow.destroyed')).toBe(false);
  });

  it('the Shadow turned by a conversion unlocks boss.shadow.converted too', () => {
    expect(ids(run(EMPTY, 'bossOvercome', { boss: 'shadow', floor: 9, how: 'converted' }).unlocked)).toEqual(['boss.shadow.converted']);
  });

  it('the Shadow destroyed unlocks only boss.shadow.destroyed', () => {
    expect(ids(run(EMPTY, 'bossOvercome', { boss: 'shadow', floor: 9, how: 'destroyed' }).unlocked)).toEqual(['boss.shadow.destroyed']);
  });

  it('several first times in one run each count, in any order', () => {
    let s = EMPTY;
    s = run(s, 'bossOvercome', { boss: 'verdict', floor: 3, how: 'converted' }).state;
    s = run(s, 'bossOvercome', { boss: 'grudge', floor: 4, how: 'destroyed' }).state;
    s = run(s, 'brew', BREW).state;
    expect(mastery(s)).toBe(3);
  });

  it('an event that unlocks two entries at once gives both, in catalogue order', () => {
    const pair: AchievementDef[] = [
      { id: 'x.first', on: 'brew' },
      { id: 'x.second', on: 'brew' },
    ];
    const r = track(EMPTY, 'brew', BREW, NOW, pair);
    expect(ids(r.unlocked)).toEqual(['x.first', 'x.second']);
  });

  it('an event no entry waits for changes nothing and returns the same state', () => {
    const r = run(EMPTY, 'roomEnter', { room: 1, floor: 0, type: 'normal', template: 't', firstVisit: true });
    expect(r.unlocked).toEqual([]);
    expect(r.state).toBe(EMPTY);
  });

  it('never modifies the state it is given', () => {
    const before: AchievementState = { achievements: { 'brew.first': 1 }, counts: { 'meditation.ground': 1 } };
    const snapshot = JSON.stringify(before);
    run(before, 'meditationComplete', { meditation: 'ground', source: 'roots' });
    run(before, 'cook', COOK);
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('an unknown id in the save is kept, not counted and not an error', () => {
    const state: AchievementState = { achievements: { 'boss.gone.destroyed': 5, 'brew.first': 6 }, counts: {} };
    expect(mastery(state)).toBe(1);
    expect(run(state, 'cook', COOK).state.achievements['boss.gone.destroyed']).toBe(5);
  });
});

describe('mastery (MASTERY §1)', () => {
  it('counts the unlocked catalogue ids: 0 at the start, 40 with every achievement', () => {
    expect(mastery(EMPTY)).toBe(0);
    const all: Record<string, number> = {};
    for (const d of ACHIEVEMENTS) all[d.id] = NOW;
    expect(mastery({ achievements: all })).toBe(40);
  });

  it('a book-page achievement counts toward the level like any other', () => {
    expect(mastery({ achievements: { 'book.page.7': NOW } })).toBe(1);
  });

  it('is capped at 100 even when the catalogue is longer', () => {
    const big: AchievementDef[] = Array.from({ length: 120 }, (_, i) => ({ id: `big.${i}`, on: 'brew' as const }));
    const all: Record<string, number> = {};
    for (const d of big) all[d.id] = NOW;
    expect(mastery({ achievements: all }, big)).toBe(100);
  });

  it('counts only ids the catalogue has', () => {
    expect(mastery({ achievements: { 'boss.gone.destroyed': 1, 'meditation.river': 1 } })).toBe(1);
  });

  it('a locked times achievement with a count of two does not count toward the level', () => {
    const state: AchievementState = { achievements: {}, counts: { 'meditation.ground': 2 } };
    expect(mastery(state)).toBe(0);
    expect(isUnlocked(state, 'meditation.ground')).toBe(false);
  });
});
