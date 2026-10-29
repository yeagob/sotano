// The laboratory's alembic (docs/design/not-built/practices/potions/BREWING-RULES.md §1, approved
// 2026-10-28): three things in the bulb, a positive intention brews and spends one of three brews,
// a negative one boils the bulb off for nothing, and the third brew leaves it cold.

import { describe, expect, it } from 'vitest';
import { BREWS, BULB, feed, hit, HIT_GAP, newAlembic, tick } from '../src/game/alembic';
import { PARTS } from '../src/content/parts';

describe('the alembic bulb', () => {
  it('takes three things from the hand and refuses a fourth', () => {
    const a = newAlembic();
    expect([feed(a, 1), feed(a, 2), feed(a, PARTS[0])]).toEqual(['fed', 'fed', 'fed']);
    expect(a.bulb).toHaveLength(BULB);
    expect(feed(a, 3)).toBe('full');
    expect(a.bulb).toHaveLength(BULB);
  });

  it('a positive intention on a loaded bulb brews: one brew is spent and what was fed is gone', () => {
    const a = newAlembic();
    feed(a, 1);
    expect(hit(a, 'positive')).toBe('brew');
    expect(a.brews).toBe(BREWS - 1);
    expect(a.bulb).toEqual([]);
  });

  it('a negative intention boils the bulb off and spends no brew', () => {
    const a = newAlembic();
    feed(a, 1);
    feed(a, PARTS[1]);
    expect(hit(a, 'negative')).toBe('boil');
    expect(a.brews).toBe(BREWS);
    expect(a.bulb).toEqual([]);
  });

  it('an intention on an empty bulb does nothing and spends nothing', () => {
    const a = newAlembic();
    expect(hit(a, 'positive')).toBe('empty');
    tick(a, HIT_GAP);
    expect(hit(a, 'negative')).toBe('empty');
    expect(a.brews).toBe(BREWS);
  });

  it('three brews per run, then the alembic goes cold and takes nothing more', () => {
    const a = newAlembic();
    for (let i = 0; i < BREWS; i++) {
      expect(feed(a, i)).toBe('fed');
      tick(a, HIT_GAP);
      expect(hit(a, 'positive')).toBe('brew');
      tick(a, HIT_GAP);
    }
    expect(a.brews).toBe(0);
    expect(feed(a, 9)).toBe('cold');
    expect(a.bulb).toEqual([]);
    tick(a, HIT_GAP);
    expect(hit(a, 'positive')).toBe('cold');
  });

  it('counts one intention per HIT_GAP, so a swing or a beam tick does not brew twice', () => {
    const a = newAlembic();
    feed(a, 1);
    feed(a, 2);
    expect(hit(a, 'positive')).toBe('brew');
    feed(a, 3);
    expect(hit(a, 'positive')).toBe('cool');
    expect(a.bulb).toHaveLength(1);
    tick(a, HIT_GAP / 2);
    expect(hit(a, 'positive')).toBe('cool');
    tick(a, HIT_GAP / 2);
    expect(hit(a, 'positive')).toBe('brew');
    expect(a.brews).toBe(BREWS - 2);
  });
});
