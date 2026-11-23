import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID } from '../src/content/items';
import { EXTRA_PRACTICE_BAND, FIXED_PRACTICES, fixedPracticeAt, rootsRewards } from '../src/content/tables/roots-mastery';
import { drawRootsItems, drawRootsPractice, rootsFork, rootsSites, spotKey } from '../src/game/roots-draws';
import { isHandedOut, isRootsGift } from '../src/items/pool';
import { buildRun } from './helpers';

const SEEDS = [1, 7, 0xBEEF, 0x5eed];

function roots(seed: number, level: number) {
  const run = buildRun(seed, 1, undefined, { mastery: level });
  const f0 = run.floors[0];
  const drawn = new Set<string>();
  const sites = rootsSites(f0, level);
  const items = drawRootsItems(run.pools, run.rr, f0, level, drawn);
  return { run, f0, drawn, sites, items };
}

describe('the fixed extra practices of the Roots (REWARDS §4, issue #277)', () => {
  it('the table names the run, the crouch and the Book of Secrets at the levels the extra practices start', () => {
    expect(FIXED_PRACTICES.map(p => p.item)).toEqual(['fartlek', 'balasana', 'bookofsecrets']);
    expect(FIXED_PRACTICES.map(p => p.at)).toEqual([10, 25, 30]);
    for (const [i, p] of FIXED_PRACTICES.entries()) {
      expect(rootsRewards(p.at).extraPractices).toBe(i + 1);
      expect(rootsRewards(p.at - 1).extraPractices).toBe(i);
    }
  });

  it('at level 9 there is no extra practice site and no fixed item', () => {
    for (const seed of SEEDS) {
      const { sites, items } = roots(seed, 9);
      expect(sites.filter(s => s.path[0] === 'practice')).toHaveLength(0);
      expect([...items.values()]).not.toContain('fartlek');
      expect([...items.values()]).not.toContain('balasana');
    }
    expect(fixedPracticeAt(0, 9)).toBeNull();
    expect(fixedPracticeAt(1, 24)).toBeNull();
  });

  it('at level 10 site 0 holds Fartlek and site 1 does not exist', () => {
    for (const seed of SEEDS) for (const level of [10, 24]) {
      const { f0, sites, items } = roots(seed, level);
      expect(f0.practices).toHaveLength(1);
      const practice = sites.filter(s => s.path[0] === 'practice');
      expect(practice).toHaveLength(1);
      expect(practice[0].path).toEqual(['practice', 0]);
      expect(practice[0].fixed).toBe('fartlek');
      expect(items.get(spotKey(f0.practices[0]))).toBe('fartlek');
      expect([...items.values()]).not.toContain('balasana');
    }
  });

  it('at level 25 site 0 holds Fartlek and site 1 holds Child\'s Pose, at every higher level too', () => {
    for (const seed of SEEDS) for (const level of [25, 29, 50, 100]) {
      const { f0, items } = roots(seed, level);
      expect(f0.practices).toHaveLength(level >= 30 ? 3 : 2);
      expect(items.get(spotKey(f0.practices[0]))).toBe('fartlek');
      expect(items.get(spotKey(f0.practices[1]))).toBe('balasana');
    }
  });

  it('from level 30 site 2 always holds the Book of Secrets (the Recipe Book), and never below 30', () => {
    for (const seed of SEEDS) {
      expect([...roots(seed, 29).items.values()]).not.toContain('bookofsecrets');
      for (const level of [30, 31, 64, 100]) {
        const { f0, sites, items } = roots(seed, level);
        expect(f0.practices).toHaveLength(3);
        const site = sites.find(s => s.path[0] === 'practice' && s.path[1] === 2)!;
        expect(site.fixed).toBe('bookofsecrets');
        expect(items.get(spotKey(f0.practices[2]))).toBe('bookofsecrets');
        // each pedestal stands in a lesson room of its own
        expect(new Set(f0.practices.map(p => p.room)).size).toBe(3);
      }
    }
    expect(fixedPracticeAt(2, 29)).toBeNull();
    expect(fixedPracticeAt(2, 30)).toBe('bookofsecrets');
  });

  it('the Book of Secrets is a gift of the Roots: no pool draws it, so no seed moves', () => {
    const book = ITEM_BY_ID.get('bookofsecrets')!;
    expect(isRootsGift(book)).toBe(true);
    expect(isHandedOut(book)).toBe(true);
    for (const seed of SEEDS) {
      const { run } = roots(seed, 100);
      for (let i = 0; i < 40; i++) expect(drawRootsPractice(run.pools, rootsFork(run.rr, 'probe-book', i), [1, 4], new Set())).not.toBe('bookofsecrets');
    }
  });

  it('the fixed items count as drawn, so no Roots draw offers them twice', () => {
    for (const seed of SEEDS) {
      const { run, drawn, items } = roots(seed, 100);
      expect(drawn.has('fartlek')).toBe(true);
      expect(drawn.has('balasana')).toBe(true);
      expect(drawn.has('bookofsecrets')).toBe(true);
      const values = [...items.values()];
      expect(new Set(values).size).toBe(values.length);
      for (let i = 0; i < 8; i++) {
        const id = drawRootsPractice(run.pools, rootsFork(run.rr, 'probe', i), [1, 3], drawn);
        expect(id).not.toBe('fartlek');
        expect(id).not.toBe('balasana');
      }
    }
  });

  it('the fixed items are treasure practices, or gifts of the Roots, inside the extra practices\' band', () => {
    for (const p of FIXED_PRACTICES) {
      const def = ITEM_BY_ID.get(p.item);
      expect(def, p.item).toBeDefined();
      expect((def!.pools.treasure ?? 0) + (def!.pools.roots ?? 0), p.item).toBeGreaterThan(0);
      expect(def!.quality).toBeGreaterThanOrEqual(EXTRA_PRACTICE_BAND.min);
      expect(def!.quality).toBeLessThanOrEqual(EXTRA_PRACTICE_BAND.max);
    }
  });

  it('the altar\'s draw keeps its own fork: only the fixed sites change', () => {
    for (const seed of SEEDS) {
      const { run, f0, items } = roots(seed, 100);
      const altar = rootsSites(f0, 100).find(s => s.path[0] === 'altar')!;
      const alone = drawRootsPractice(run.pools, rootsFork(run.rr, ...altar.path), altar.band, new Set(['fartlek', 'balasana', 'bookofsecrets']));
      expect(items.get(altar.key)).toBe(alone);
    }
  });
});
