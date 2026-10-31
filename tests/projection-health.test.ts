import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/content/enemies';
import { BASE_STATS } from '../src/core/stats';

// Balance pass of issue #45 (2026-10-31): every hostile projection has twice the health it had
// before. These are the health values before the pass; the current values are twice these.
// Bosses, creatures and the rooted multiplier (ROOTED_HP) are not in this table.
const HEALTH_BEFORE_BALANCE: Record<string, number> = {
  alarm: 14, autopilot: 10, avoidance: 10, backlog: 60, burnout: 26, comparison: 30, craving: 9,
  critic: 9, cynicism: 26, distraction: 6, dogma: 60, doubt: 12, dread: 40, gloom: 14,
  'hall-of-mirrors': 22, impulse: 8, isolation: 36, margin: 28, noise: 4, 'not-yet': 40,
  numbness: 30, panic: 7, paralysis: 50, perfectionism: 14, pretence: 16,
  'procrastination-c': 4, 'procrastination-b': 9, procrastination: 18, reactivity: 24,
  resentment: 14, rumination: 16, scarcity: 10, 'second-guessing': 26, shortcut: 9, shoulds: 16,
  spark: 12, sulk: 18, tribunal: 72, undertow: 14, 'what-if': 34,
};

/** Hits a starting intention (BASE_STATS.damage, no polarity halving) needs to kill a projection of this health. */
const hitsToKill = (hp: number) => Math.ceil(hp / BASE_STATS.damage);

describe('projection health after the balance pass (issue #45)', () => {
  it('the table covers every projection, once', () => {
    expect(ENEMIES.map(e => e.id).sort()).toEqual(Object.keys(HEALTH_BEFORE_BALANCE).sort());
  });

  it('every projection has twice its health from before the balance pass', () => {
    for (const def of ENEMIES) {
      expect(def.hp, def.id).toBe(2 * HEALTH_BEFORE_BALANCE[def.id]);
    }
  });

  it('a fight with the starting intention takes twice as many hits (rounded up), not fewer', () => {
    for (const def of ENEMIES) {
      const before = hitsToKill(HEALTH_BEFORE_BALANCE[def.id]);
      expect(hitsToKill(def.hp), def.id).toBeGreaterThanOrEqual(2 * before - 1);
    }
  });

  it('the examples in the design documents hold: Panic takes four starting hits, Doubt seven', () => {
    const hp = (id: string) => ENEMIES.find(e => e.id === id)!.hp;
    expect(hitsToKill(hp('panic'))).toBe(4);
    expect(hitsToKill(hp('doubt'))).toBe(7);
  });
});
