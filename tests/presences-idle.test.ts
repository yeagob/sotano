import { describe, expect, it } from 'vitest';
import { RunRandom } from '../src/core/rng';
import { IDLE_MAX_S, IDLE_MIN_S, IDLE_PRESENCES, IdleTimer, idleWindowOf } from '../src/content/presences/idle';

describe('the idle window (REQUESTS.md): a seeded wait, then the presence leaves', () => {
  it('draws thirty to sixty seconds, the same for the same seed and presence, and never more than a minute', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const a = idleWindowOf(new RunRandom(seed), 'gardener');
      expect(a).toBeGreaterThanOrEqual(IDLE_MIN_S);
      expect(a).toBeLessThanOrEqual(IDLE_MAX_S);
      expect(Number.isInteger(a)).toBe(true);
      expect(idleWindowOf(new RunRandom(seed), 'gardener')).toBe(a);
    }
  });

  it('spreads across the range over many seeds, and the presences draw from their own forks', () => {
    const seen = new Set<number>();
    let differs = 0;
    for (let seed = 1; seed <= 300; seed++) {
      seen.add(idleWindowOf(new RunRandom(seed), 'gardener'));
      if (idleWindowOf(new RunRandom(seed), 'gardener') !== idleWindowOf(new RunRandom(seed), 'boatman')) differs++;
    }
    expect(seen.size).toBeGreaterThan(20);
    expect(differs).toBeGreaterThan(100);
  });

  it('is drawn only from the run root: no other fork of the run moves it', () => {
    const run = new RunRandom(77);
    const before = idleWindowOf(run, 'gardener');
    run.fork('floor', 3, 'room', 2, 'layout').next();
    run.stream('drops').next();
    expect(idleWindowOf(run, 'gardener')).toBe(before);
  });

  it('only the requesting presences have an idle window', () => {
    expect([...IDLE_PRESENCES].sort()).toEqual(['boatman', 'gardener']);
  });

  it('counts a window down on game time and reports it once when it runs out', () => {
    const t = new IdleTimer();
    t.start(4, 1);
    expect(t.tick(0.4)).toEqual([]);
    expect(t.has(4)).toBe(true);
    expect(t.tick(0.4)).toEqual([]);
    expect(t.tick(0.4)).toEqual([4]);
    expect(t.has(4)).toBe(false);
    expect(t.tick(10)).toEqual([]);
  });

  it('runs several windows at once, and clear forgets them all', () => {
    const t = new IdleTimer();
    t.start(1, 0.5);
    t.start(2, 2);
    expect(t.tick(0.5)).toEqual([1]);
    expect(t.has(2)).toBe(true);
    t.clear();
    expect(t.has(2)).toBe(false);
    expect(t.tick(100)).toEqual([]);
  });

  it('holds still while nothing is ticked (a paused game)', () => {
    const t = new IdleTimer();
    t.start(9, 30);
    for (let i = 0; i < 5; i++) expect(t.tick(0)).toEqual([]);
    expect(t.has(9)).toBe(true);
  });
});
