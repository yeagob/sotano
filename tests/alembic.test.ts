// The laboratory's alembic (docs/design/not-built/practices/potions/BREWING-RULES.md §1, approved
// 2026-10-28): three things in the bulb, a positive intention brews and spends one of three brews,
// a negative one boils the bulb off for nothing, and the third brew leaves it cold.

import { describe, expect, it } from 'vitest';
import { brew, BREWS, BULB, feed, hit, HIT_GAP, newAlembic, tick, tickLabs } from '../src/game/alembic';
import { createBus, type GameEvents } from '../src/game/events';
import { MAT } from '../src/content/materials';
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

describe('the brew event', () => {
  const heart = (source: string) => PARTS.find(p => p.source === source && p.kind === 'heart')!;
  const listen = () => {
    const bus = createBus();
    const seen: GameEvents['brew'][] = [];
    bus.on('brew', { priority: 200, source: 'test', fn: e => { seen.push({ ...e }); } });
    return { bus, seen };
  };

  it('a positive brew emits the potion the bulb resolves to, where the alembic stands, and returns its flask', () => {
    const { bus, seen } = listen();
    const a = newAlembic();
    feed(a, heart('panic'));
    const out = brew(a, 'positive', bus, 4, 5, 6);
    expect(out).toEqual({ result: 'brew', flask: { potion: 'ember-tonic' } });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ potion: 'ember-tonic', iced: false, contents: 1, x: 4, y: 5, z: 6 });
  });

  it('says when ice kept the brew cold', () => {
    const { bus, seen } = listen();
    const a = newAlembic();
    feed(a, heart('panic'));
    feed(a, MAT.ice);
    expect(brew(a, 'positive', bus, 0, 0, 0).flask).toEqual({ potion: 'ember-tonic', iced: true });
    expect(seen[0]).toMatchObject({ iced: true, contents: 2 });
  });

  it('a boil, an empty bulb, a cold alembic or a hit inside the gap emit nothing', () => {
    const { bus, seen } = listen();
    const a = newAlembic();
    feed(a, heart('panic'));
    expect(brew(a, 'negative', bus, 0, 0, 0)).toEqual({ result: 'boil', flask: null });
    tick(a, HIT_GAP);
    expect(brew(a, 'positive', bus, 0, 0, 0)).toEqual({ result: 'empty', flask: null });
    feed(a, 1);
    expect(brew(a, 'positive', bus, 0, 0, 0).result).toBe('cool');
    a.brews = 0;
    tick(a, HIT_GAP);
    expect(brew(a, 'positive', bus, 0, 0, 0).result).toBe('cold');
    expect(seen).toEqual([]);
  });

  it('a fourth brew is refused whatever the bulb holds', () => {
    const { bus, seen } = listen();
    const a = newAlembic();
    for (let i = 0; i < BREWS + 1; i++) {
      feed(a, heart('panic'));
      brew(a, 'positive', bus, 0, 0, 0);
      tick(a, HIT_GAP);
    }
    expect(seen).toHaveLength(BREWS);
    expect(a.brews).toBe(0);
  });
});

describe('the alembic ticks once, however many tiles hold it', () => {
  it('a laboratory registered under two tiles cools at the normal rate', () => {
    const lab = newAlembic();
    hit(lab, 'positive');
    tickLabs([lab, lab], 0.2);
    expect(lab.cool).toBeCloseTo(HIT_GAP - 0.2);
  });
});
