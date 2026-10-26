import { describe, expect, it } from 'vitest';
import { BlastQueue } from '../src/combat/blasts';
import type { Cause } from '../src/game/events';
import { EventBus } from '../src/core/events';
import { Rng, RunRandom } from '../src/core/rng';
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

  it('fails closed past the depth cap: a protective hook is never bypassed', () => {
    const bus = new EventBus<{ hurt: { d: number; amount: number } }>();
    let landed = 0;
    // a shield that cancels every hurt, and a chain that re-emits hurt from inside itself
    bus.on('hurt', { priority: 0, source: 'chain', fn: e => { if (e.d < 20) { const r = bus.emit('hurt', { d: e.d + 1, amount: 1 }); if (!r.cancelled) landed++; } } });
    bus.on('hurt', { priority: 100, source: 'shield', fn: e => e.cancel() });
    const warn = console.warn; console.warn = () => {};
    const top = bus.emit('hurt', { d: 0, amount: 1 });
    console.warn = warn;
    expect(top.cancelled).toBe(true);
    expect(landed).toBe(0);
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
    const r1 = new RunRandom(7), r2 = new RunRandom(7);
    for (let i = 0; i < 50; i++) r1.stream('ai').next(); // lots of AI randomness...
    expect(r1.stream('loot').next()).toBe(r2.stream('loot').next()); // ...does not change loot
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

describe('BlastQueue (chain safety)', () => {
  type B = { source: string; cause: Cause; n: number };
  const quiet = (fn: () => void) => { const w = console.warn; console.warn = () => {}; try { fn(); } finally { console.warn = w; } };

  it('runs a few blasts per frame, never nested', () => {
    const q = new BlastQueue<B>(8);
    for (let i = 0; i < 20; i++) q.push({ source: 'bomb', n: i });
    let ran = 0;
    q.run(() => ran++);
    expect(ran).toBe(8);
    expect(q.pending).toBe(12);
  });

  it('links blasts queued during a blast into its chain and stops long chains', () => {
    const q = new BlastQueue<B>(1000, 1000, 12);
    const gens: number[] = [];
    // "every blast sets off another one": an endless chain
    q.push({ source: 'bomb', n: 0 });
    quiet(() => { for (let f = 0; f < 50; f++) q.run(b => { gens.push(b.cause.gen); q.push({ source: 'volatile', n: 0 }); }); });
    expect(gens).toEqual(Array.from({ length: 13 }, (_, i) => i));
    expect(q.pending).toBe(0);
  });

  it('keeps the chain origin and caps the queue', () => {
    const q = new BlastQueue<B>(8, 5);
    quiet(() => { for (let i = 0; i < 10; i++) q.push({ source: 'x', n: i }); });
    expect(q.pending).toBe(5);
    const origins: string[] = [];
    q.run(b => { origins.push(b.cause.origin); });
    expect(origins.every(o => o === 'x')).toBe(true);
  });
});

describe('block damage', () => {
  it('matches the design targets for starting intents', () => {
    expect(hitsToBreak(3.5, mat(MAT.dirt))).toBe(1);
    expect(hitsToBreak(3.5, mat(MAT.brick))).toBe(4);
    expect(hitsToBreak(3.5, mat(MAT.deepstone))).toBe(13);
  });
  it('always deals at least 10%, so everything breakable breaks eventually', () => {
    for (const m of MATERIALS) {
      if (m.id === 0 || !isFinite(m.hp)) continue;
      expect(blockDamage(0.5, m)).toBeGreaterThan(0);
      expect(isFinite(hitsToBreak(0.5, m))).toBe(true);
    }
  });
  it('bedrock never breaks', () => {
    expect(blockDamage(1e6, mat(MAT.bedrock))).toBe(0);
  });
});
