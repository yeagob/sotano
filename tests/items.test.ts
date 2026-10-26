import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { Rng } from '../src/core/rng';
import { BASE_STATS, StatSheet, type StatName } from '../src/core/stats';
import { createBus, type GameBus, type GameEvents } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import { ItemPools } from '../src/items/pool';
import { defineItem, defineSynergy, hook, type ItemApi, type ItemDef, type SynergyDef } from '../src/items/types';

function setup(catalog: readonly ItemDef[] = ITEMS, synergies: readonly SynergyDef[] = SYNERGIES) {
  const bus: GameBus = createBus();
  const stats = new StatSheet();
  const api = { bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn) } as unknown as ItemApi;
  const inv = new Inventory(new Map(catalog.map(i => [i.id, i])), synergies, stats, () => bus, () => api);
  return { bus, stats, inv };
}

describe('item catalogue', () => {
  it('has unique ids, shared with no synergy', () => {
    const ids = ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SYNERGIES) expect(ids).not.toContain(s.id);
    expect(new Set(SYNERGIES.map(s => s.id)).size).toBe(SYNERGIES.length);
  });

  it('every synergy requirement names a real item or a tag some item has', () => {
    const tags = new Set(ITEMS.flatMap(i => i.tags ?? []));
    for (const s of SYNERGIES) for (const r of s.requires) {
      if (typeof r === 'string') expect(ITEM_BY_ID.has(r), `${s.id} requires ${r}`).toBe(true);
      else expect(tags.has(r.tag), `${s.id} requires tag ${r.tag}`).toBe(true);
    }
  });

  it('every suppress points at an existing item hook, and synergy hooks have ids', () => {
    for (const s of SYNERGIES) {
      for (const key of s.suppress ?? []) {
        const [item, hookId] = key.split('.');
        expect(ITEM_BY_ID.get(item)?.hooks?.some(h => h.id === hookId), `${s.id} suppresses ${key}`).toBe(true);
      }
      for (const h of s.hooks ?? []) expect(h.id, `${s.id} has a hook without id`).toBeTruthy();
    }
  });

  it('no hook is suppressed by two different synergies', () => {
    const owners = new Map<string, string[]>();
    for (const s of SYNERGIES) for (const k of s.suppress ?? []) owners.set(k, [...(owners.get(k) ?? []), s.id]);
    for (const [key, list] of owners) expect(list, `${key} suppressed by ${list.join(', ')}`).toHaveLength(1);
  });
});

describe('inventory', () => {
  it('applies stats, and losing the item leaves no residue (stats, hooks, deferred)', () => {
    const { bus, stats, inv } = setup();
    const before = { stats: { ...stats.all }, hooks: JSON.stringify(bus.dump()), pending: bus.pending };
    for (const item of ITEMS) {
      inv.gain(item.id);
      inv.lose(item.id);
      expect(stats.all).toEqual(before.stats);
      expect(JSON.stringify(bus.dump())).toBe(before.hooks);
      expect(bus.pending).toBe(before.pending);
    }
  });

  it('reports the stat changes of a pickup', () => {
    const { inv } = setup();
    const r = inv.gain('heavy')!;
    expect(r.changes.find(c => c.stat === 'damage')).toEqual({ stat: 'damage', from: 3.5, to: 5.5 });
  });

  it('keeps effects from other sources on the same sheet', () => {
    const { stats, inv } = setup();
    stats.add({ stat: 'moveSpeed', layer: 'mul', value: 0.5, source: 'curse:slow' });
    inv.gain('swift');
    inv.lose('swift');
    expect(stats.get('moveSpeed')).toBe(0.5);
  });

  it('switches synergies on and off, and suppression replaces the item hook', () => {
    const { bus, inv } = setup();
    inv.gain('chain');
    expect(bus.dump().blockBreak.map(h => h.id)).toEqual(['chain.spread']);
    const r = inv.gain('bulldozer')!;
    expect(r.newSynergies.map(s => s.id)).toEqual(['wrecking_ball']);
    expect(bus.dump().blockBreak.map(h => h.id)).toEqual(['wrecking_ball.shatter']);
    inv.lose('bulldozer');
    expect(bus.dump().blockBreak.map(h => h.id)).toEqual(['chain.spread']);
  });

  it('supports tag requirements with counts', () => {
    const a = defineItem({ id: 'a', name: 'A', description: '', pools: {}, color: 0, tags: ['x'] });
    const b = defineItem({ id: 'b', name: 'B', description: '', pools: {}, color: 0, tags: ['x'] });
    const two = defineSynergy({ id: 'two_x', name: '', description: '', requires: [{ tag: 'x', count: 2 }],
      stats: [{ stat: 'luck', layer: 'add', value: 1 }] });
    const { stats, inv } = setup([a, b], [two]);
    inv.gain('a');
    expect(stats.get('luck')).toBe(0);
    inv.gain('b');
    expect(stats.get('luck')).toBe(1);
  });

  it('runs onGain once, never on rebuild or restore', () => {
    let n = 0;
    const once = defineItem({ id: 'once', name: '', description: '', pools: {}, color: 0, onGain: () => { n++; } });
    const other = defineItem({ id: 'other', name: '', description: '', pools: {}, color: 0 });
    const { inv } = setup([once, other], []);
    inv.gain('once');
    inv.gain('other');
    inv.rebuild();
    inv.restore(inv.serialize());
    expect(n).toBe(1);
  });

  it('a throwing hook is logged and skipped, not fatal', () => {
    const bad = defineItem({ id: 'bad', name: '', description: '', pools: {}, color: 0,
      hooks: [
        hook('jump', () => { throw new Error('boom'); }, { id: 'oops' }),
        hook('jump', e => { e.velocity = 99; }, { id: 'ok', priority: 60 }),
      ] });
    const { bus, inv } = setup([bad], []);
    inv.gain('bad');
    const err = console.error; console.error = () => {};
    const ev = bus.emit('jump', { velocity: 1 });
    console.error = err;
    expect(ev.velocity).toBe(99);
  });

  it('serialize then restore gives the same stats', () => {
    const a = setup(), b = setup();
    ['heavy', 'miner', 'builder', 'heavy'].forEach(id => a.inv.gain(id));
    b.inv.restore(a.inv.serialize());
    expect(b.stats.all).toEqual(a.stats.all);
  });
});

describe('pools', () => {
  it('draw without repeats, deterministically', () => {
    const p1 = new ItemPools(ITEMS, new Rng(3)), p2 = new ItemPools(ITEMS, new Rng(3));
    const a: string[] = [], b: string[] = [];
    for (let k = 0; k < ITEMS.length; k++) { a.push(p1.draw('treasure')!); b.push(p2.draw('treasure')!); }
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(ITEMS.length);
    expect(p1.draw('treasure')).toBeNull();
  });
});

// The "everything is a stat or an event" contract: every event must be emitted by the game and
// every stat must be read somewhere outside its definition, otherwise items cannot affect it.
describe('contract', () => {
  const src = (dir: string): string[] => readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? src(p) : p.endsWith('.ts') ? [p] : [];
  });
  const code = src('src')
    .filter(p => !p.includes('content') && !p.endsWith('stats.ts') && !p.endsWith(join('game', 'events.ts')))
    .map(p => readFileSync(p, 'utf8')).join('\n');
  const eventNames = Object.keys({
    fire: 0, blockDamage: 0, blockBreak: 0, blockPlace: 0, touchBlock: 0, explosion: 0, touchCube: 0, kick: 0, throw: 0,
    drop: 0, debrisImpact: 0, jump: 0, land: 0, doorOpen: 0, keyPickup: 0, itemGained: 0, roomEnter: 0, floorEnter: 0,
  } satisfies Record<keyof GameEvents, 0>);

  it('every game event has an emit site', () => {
    for (const e of eventNames) expect(code, `no emit('${e}')`).toMatch(new RegExp(`emit\\('${e}'`));
  });

  it('every stat is read by the game', () => {
    for (const s of Object.keys(BASE_STATS) as StatName[]) {
      if (s === 'luck') continue; // no luck-based effects yet (documented in ITEMS.md)
      expect(code, `stat ${s} is never read`).toMatch(new RegExp(`(get\\('${s}'\\)|\\.${s}\\b)`));
    }
  });
});
