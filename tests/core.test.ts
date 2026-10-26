import { describe, expect, it } from 'vitest';
import { EventBus } from '../src/core/events';
import { Rng, RunRng } from '../src/core/rng';
import { computeStats, BASE_STATS, StatSheet } from '../src/core/stats';
import { blockDamage, hitsToBreak } from '../src/core/damage';
import { MAT, mat, MATERIALS } from '../src/content/materials';

describe('EventBus', () => {
  it('runs hooks by priority and lets them mutate the payload', () => {
    const bus = new EventBus<{ hit: { amount: number } }>();
    bus.on('hit', { priority: 10, source: 'b', fn: e => { e.amount *= 2; } });
    bus.on('hit', { priority: 0, source: 'a', fn: e => { e.amount += 1; } });
    expect(bus.emit('hit', { amount: 1 }).amount).toBe(4);
  });

  it('stops at cancel and removes hooks by source', () => {
    const bus = new EventBus<{ hit: { n: number } }>();
    bus.on('hit', { priority: 0, source: 'shield', fn: e => e.cancel() });
    bus.on('hit', { priority: 1, source: 'other', fn: e => { e.n = 99; } });
    const ev = bus.emit('hit', { n: 0 });
    expect(ev.cancelled).toBe(true);
    expect(ev.n).toBe(0);
    bus.off(null, 'shield');
    expect(bus.emit('hit', { n: 0 }).n).toBe(99);
  });

  it('caps nested emits so chain reactions cannot recurse forever', () => {
    const bus = new EventBus<{ boom: { d: number } }>();
    let calls = 0;
    bus.on('boom', { priority: 0, source: 'loop', fn: e => { calls++; bus.emit('boom', { d: e.d + 1 }); } });
    const warn = console.warn; console.warn = () => {};
    bus.emit('boom', { d: 0 });
    console.warn = warn;
    expect(calls).toBe(8);
  });

  it('runs deferred work within a budget', () => {
    const bus = new EventBus<{}>();
    let n = 0;
    for (let i = 0; i < 10; i++) bus.defer(() => n++);
    bus.flush(4);
    expect(n).toBe(4);
    expect(bus.pending).toBe(6);
  });
});

describe('Rng', () => {
  it('is deterministic per seed', () => {
    const a = new Rng(42), b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.u32()).toBe(b.u32());
  });
  it('keeps streams independent', () => {
    const r1 = new RunRng(7), r2 = new RunRng(7);
    for (let i = 0; i < 50; i++) r1.get('combat').next(); // lots of combat randomness...
    expect(r1.get('loot').next()).toBe(r2.get('loot').next()); // ...does not change loot
  });
  it('stays in range', () => {
    const r = new Rng(1);
    for (let i = 0; i < 1000; i++) { const v = r.next(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe('stats', () => {
  it('applies add, then mul, then clamps, then final overrides', () => {
    const s = computeStats([
      { stat: 'damage', layer: 'add', value: 1.5, source: 'a' },
      { stat: 'damage', layer: 'mul', value: 2, source: 'b' },
      { stat: 'fireRate', layer: 'mul', value: 100, source: 'c' },
      { stat: 'luck', layer: 'final', value: 7, source: 'd' },
    ]);
    expect(s.damage).toBe((BASE_STATS.damage + 1.5) * 2);
    expect(s.fireRate).toBe(30);
    expect(s.luck).toBe(7);
  });
  it('recomputes from scratch when a source is removed', () => {
    const sheet = new StatSheet();
    sheet.add({ stat: 'damage', layer: 'mul', value: 3, source: 'x' });
    expect(sheet.get('damage')).toBeCloseTo(10.5);
    sheet.removeSource('x');
    expect(sheet.get('damage')).toBe(BASE_STATS.damage);
  });
});

describe('block damage', () => {
  it('matches the design targets for starting intents', () => {
    expect(hitsToBreak(3.5, 1, mat(MAT.dirt))).toBe(1);
    expect(hitsToBreak(3.5, 1, mat(MAT.brick))).toBe(4);
    expect(hitsToBreak(3.5, 1, mat(MAT.deepstone))).toBe(13);
  });
  it('always deals at least 10%, so everything breakable breaks eventually', () => {
    for (const m of MATERIALS) {
      if (m.id === 0 || !isFinite(m.hp)) continue;
      expect(blockDamage(0.5, 1, m)).toBeGreaterThan(0);
      expect(isFinite(hitsToBreak(0.5, 1, m))).toBe(true);
    }
  });
  it('bedrock never breaks', () => {
    expect(blockDamage(1e6, 100, mat(MAT.bedrock))).toBe(0);
  });
});
