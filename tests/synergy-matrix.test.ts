// Safety layer 3: the synergy matrix. Every item alone and every pair of items is installed in a
// headless sandbox; then every game event is fired at it with a sample payload. Nothing may throw,
// log an error, produce a non-finite stat, or leave an endless chain reaction behind.
// When a new event is added to GameEvents, TypeScript forces a sample payload here.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ITEMS } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { Rng } from '../src/core/rng';
import { STAT_LIMITS, StatSheet, type StatName } from '../src/core/stats';
import { createBus, type GameEvents, type IntentSpec } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { ItemApi } from '../src/items/types';
import { validateCatalogue } from '../src/items/validate';

const intent = (): IntentSpec => ({ damage: 3.5, mining: 1, speed: 16, flight: 0.5, gravity: 22, radius: 0.12, pierce: 0, pierceTier: 0, color: 0, tags: new Set() });

const SAMPLES: { [K in keyof GameEvents]: () => GameEvents[K] } = {
  fire: () => ({ intent: intent() }),
  blockDamage: () => ({ x: 1, y: 1, z: 1, material: 4, amount: 3, kind: 'intent', source: 'intent' }),
  blockBreak: () => ({ x: 1, y: 1, z: 1, material: 4, kind: 'intent', source: 'intent', spawnDebris: true }),
  blockPlace: () => ({ x: 1, y: 1, z: 1, material: 4 }),
  touchBlock: () => ({ x: 1, y: 1, z: 1, material: 1, crush: false }),
  explosion: () => ({ x: 1, y: 1, z: 1, radius: 2, damage: 10, actorDamage: 2, source: 'test', owner: 'player' }),
  blockLoot: () => ({ x: 1, y: 1, z: 1, material: 4, source: 'intent', drops: ['key'] }),
  touchCube: () => ({ cube: 0, material: 1, held: 0, carry: 1, bomb: false, action: 'pickup' }),
  bombPlace: () => ({ fuse: 1.8 }),
  kick: () => ({ cube: 0, material: 1, speed: 5, lift: 3, tags: new Set() }),
  throw: () => ({ cube: 0, material: 1, speed: 9, lift: 2, tags: new Set() }),
  drop: () => ({ material: 1, how: 'throw' }),
  debrisImpact: () => ({ cube: 0, x: 1, y: 1, z: 1, material: 1, speed: 8, tags: new Set(['volatile']), keepTags: false }),
  jump: () => ({ velocity: 8.4 }),
  land: () => ({ fallSpeed: 10, cause: 'fall' }),
  playerDamage: () => ({ amount: 2, kind: 'explosion', source: 'bomb', owner: 'player' }),
  heal: () => ({ amount: 2, source: 'pickup' }),
  death: () => ({ source: 'doubt' }),
  enemySpawn: () => ({ uid: 1, def: 'doubt', hp: 12, speed: 1.7, contactDamage: 1, tags: new Set(), x: 1, y: 1, z: 1 }),
  enemyDamage: () => ({ uid: 1, def: 'doubt', amount: 3.5, kind: 'intent', source: 'intent', owner: 'player', knockback: 3 }),
  enemyContact: () => ({ uid: 1, def: 'doubt', toPlayer: 1, toEnemy: 0 }),
  enemyDeath: () => ({ uid: 1, def: 'doubt', x: 1, y: 1, z: 1, drops: [] }),
  roomClear: () => ({ room: 101, drops: [] }),
  doorOpen: () => ({ door: 0, locked: true, needsKey: true }),
  pickupCollect: () => ({ kind: 'key', amount: 1 }),
  itemGained: () => ({ id: 'x', uid: 1 }),
  roomEnter: () => ({ room: 1, type: 'normal', firstVisit: true }),
  floorEnter: () => ({ depth: 2 }),
};

function sandbox() {
  const bus = createBus();
  const stats = new StatSheet();
  const calls = { damage: 0, explode: 0, spawn: 0 };
  const api: ItemApi = {
    get bus() { return bus; },
    stats: () => stats.all,
    has: id => inv.has(id),
    hasTag: t => inv.hasTag(t),
    held: () => [1],
    rng: () => new Rng(1),
    materialAt: () => 4,
    damageBlock: () => { calls.damage++; return true; },
    explode: () => { calls.explode++; },
    spawnDebris: () => { calls.spawn++; },
    toast: () => {},
    defer: fn => bus.defer(fn),
    heal: () => {},
    damagePlayer: () => {},
    collect: () => true,
    counts: () => ({ keys: 1, bombs: 1, hp: 6, maxHp: 6 }),
    spawnPickup: () => {},
  };
  const inv = new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  return { bus, stats, inv, calls };
}

function exercise(ids: string[]) {
  const { bus, stats, inv, calls } = sandbox();
  for (const id of ids) inv.gain(id);
  for (const k of Object.keys(SAMPLES) as (keyof GameEvents)[]) {
    for (let n = 0; n < 3; n++) bus.emit(k, SAMPLES[k]() as never);
  }
  for (let f = 0; f < 200 && bus.pending; f++) bus.flush(64);
  return { bus, stats, calls };
}

describe('synergy matrix', () => {
  let errors: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => errors.mockRestore());

  it('the catalogue validates', () => {
    expect(validateCatalogue(ITEMS, SYNERGIES)).toEqual([]);
  });

  const ids = ITEMS.map(i => i.id);
  const combos: string[][] = ids.map(a => [a]);
  for (let i = 0; i < ids.length; i++) for (let j = i; j < ids.length; j++) combos.push([ids[i], ids[j]]);

  it(`${combos.length} item combinations survive every event`, () => {
    for (const combo of combos) {
      const { bus, stats } = exercise(combo);
      expect(errors, `errors logged with ${combo.join(' + ')}`).not.toHaveBeenCalled();
      for (const [k, v] of Object.entries(stats.all) as [StatName, number][]) {
        expect(Number.isFinite(v), `${k} with ${combo.join(' + ')}`).toBe(true);
        const lim = STAT_LIMITS[k];
        if (lim) { expect(v).toBeGreaterThanOrEqual(lim[0]); expect(v).toBeLessThanOrEqual(lim[1]); }
      }
      expect(bus.pending, `chain reactions never settle with ${combo.join(' + ')}`).toBe(0);
    }
  });

  it('everything at once still works', () => {
    const { stats } = exercise(ids);
    expect(errors).not.toHaveBeenCalled();
    for (const v of Object.values(stats.all)) expect(Number.isFinite(v)).toBe(true);
  });

  it('a broken stat modifier is neutralised instead of spreading NaN', () => {
    const s = new StatSheet();
    s.add({ stat: 'damage', layer: 'mul', value: NaN, source: 'bad' });
    expect(s.get('damage')).toBe(3.5);
    expect(errors).toHaveBeenCalled();
  });
});
