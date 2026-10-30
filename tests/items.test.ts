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
import { ACTOR_EVENTS, defineItem, defineSynergy, hook, type HostApi, type ItemDef, type SynergyDef } from '../src/items/types';

const T = { quality: 0 as const, icon: { rows: [], palette: {} }, effect: '' };

function setup(catalog: readonly ItemDef[] = ITEMS, synergies: readonly SynergyDef[] = SYNERGIES) {
  const bus: GameBus = createBus();
  const stats = new StatSheet();
  const api = {
    bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn),
    heal: () => {}, collect: () => true, damagePlayer: () => {}, rng: () => new Rng(1), message: () => {},
  } as unknown as HostApi;
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
    const r = inv.gain('stoic')!;
    expect(r.changes.find(c => c.stat === 'damage')).toEqual({ stat: 'damage', from: 3.5, to: 5.5 });
  });

  it('keeps effects from other sources on the same sheet', () => {
    const { stats, inv } = setup();
    stats.add({ stat: 'moveSpeed', layer: 'mul', value: 0.5, source: 'curse:slow' });
    inv.gain('flow');
    inv.lose('flow');
    expect(stats.get('moveSpeed')).toBe(0.5);
  });

  it('switches synergies on and off, and suppression replaces the item hook', () => {
    const { bus, inv } = setup();
    inv.gain('habitstack');
    expect(bus.dump().blockBreak.map(h => h.id)).toEqual(['habitstack.spread']);
    const r = inv.gain('exposure')!;
    expect(r.newSynergies.map(s => s.id)).toEqual(['flooding']);
    expect(bus.dump().blockBreak.map(h => h.id)).toEqual(['flooding.shatter']);
    inv.lose('exposure');
    expect(bus.dump().blockBreak.map(h => h.id)).toEqual(['habitstack.spread']);
  });

  it('supports tag requirements with counts', () => {
    const a = defineItem({ id: 'a', name: 'A', description: '', pools: {}, color: 0, ...T, tags: ['x'] });
    const b = defineItem({ id: 'b', name: 'B', description: '', pools: {}, color: 0, ...T, tags: ['x'] });
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
    const once = defineItem({ id: 'once', name: '', description: '', pools: {}, color: 0, ...T, onGain: () => { n++; } });
    const other = defineItem({ id: 'other', name: '', description: '', pools: {}, color: 0, ...T });
    const { inv } = setup([once, other], []);
    inv.gain('once');
    inv.gain('other');
    inv.rebuild();
    inv.restore(inv.serialize());
    expect(n).toBe(1);
  });

  it('a throwing hook is logged and skipped, not fatal', () => {
    const bad = defineItem({ id: 'bad', name: '', description: '', pools: {}, color: 0, ...T,
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
    ['stoic', 'deepfocus', 'secondbrain', 'stoic'].forEach(id => a.inv.gain(id));
    b.inv.restore(a.inv.serialize());
    expect(b.stats.all).toEqual(a.stats.all);
  });
});

describe('split damage', () => {
  it('damage items do not dig faster, and mining items do not hurt more', () => {
    const { stats, inv } = setup();
    inv.gain('meditations');
    expect(stats.get('damage')).toBeGreaterThan(BASE_STATS.damage);
    expect(stats.get('mining')).toBe(BASE_STATS.mining);
    const b = setup();
    b.inv.gain('deepfocus');
    expect(b.stats.get('mining')).toBeCloseTo(BASE_STATS.mining * 2);
    expect(b.stats.get('damage')).toBeLessThan(BASE_STATS.damage);
  });
});

describe('pools', () => {
  it('reserve deterministically, without repeats, and runtime draws skip reserved items', () => {
    const slots = Array.from({ length: 6 }, (_, i) => ({ key: String(i), pool: 'treasure' as const }));
    const p1 = new ItemPools(ITEMS), p2 = new ItemPools(ITEMS);
    p1.reserve(slots, new Rng(3)); p2.reserve(slots, new Rng(3));
    const a = slots.map(s => p1.reservedFor(s.key)), b = slots.map(s => p2.reservedFor(s.key));
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(6);
    for (let i = 0; i < 5; i++) expect(a).not.toContain(p1.drawRuntime('treasure', new Rng(i)));
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
    fire: 0, strike: 0, blockDamage: 0, blockBreak: 0, blockPlace: 0, touchBlock: 0, headBump: 0, explosion: 0, touchCube: 0, kick: 0, throw: 0,
    drop: 0, debrisImpact: 0, jump: 0, land: 0, doorOpen: 0, chestOpen: 0, pickupCollect: 0, itemGained: 0, roomEnter: 0, floorEnter: 0,
    blockLoot: 0, bombPlace: 0, actorDamage: 0, contact: 0, actorDeath: 0, factionChange: 0, heal: 0, death: 0, enemySpawn: 0, roomClear: 0,
    ignite: 0, materialReact: 0, elementEnter: 0, elementLeave: 0, doorBreak: 0, polarityChange: 0, intentHit: 0,
    brew: 0, drink: 0,
  } satisfies Record<keyof GameEvents, 0>);

  it('no content sets keepTags (cube chains would outlive their cause; see ACTORS.md §1)', () => {
    const content = src(join('src', 'content')).map(p => readFileSync(p, 'utf8')).join('\n');
    expect(content).not.toMatch(/keepTags\s*=\s*true/);
  });

  it('no item changes mining with the add layer (mining is absolute: adds need a rebalance)', () => {
    for (const i of [...ITEMS, ...SYNERGIES]) for (const m of i.stats ?? []) {
      expect(m.stat === 'mining' && m.layer === 'add', `${i.id} adds to mining`).toBe(false);
    }
  });

  it('hooks on actor events say which actors they are for', () => {
    for (const d of [...ITEMS, ...SYNERGIES]) for (const h of d.hooks ?? []) {
      if ((ACTOR_EVENTS as readonly string[]).includes(h.event)) expect(h.target, `${d.id}: hook on ${h.event} needs a target`).toBeDefined();
    }
  });

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
