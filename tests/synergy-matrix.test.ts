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
import type { HostApi } from '../src/items/types';
import { validateCatalogue } from '../src/items/validate';

const intent = (): IntentSpec => ({ damage: 3.5, mining: 3.5, knock: 0.46, speed: 16, flight: 0.5, gravity: 22, radius: 0.12, pierce: 0, pierceTier: 0, phase: 0, color: 0, tags: new Set(), polarity: 'positive', volley: 1, bounces: 0, homing: 0 });

const SAMPLES: { [K in keyof GameEvents]: () => GameEvents[K] } = {
  fire: () => ({ intent: intent() }),
  polarityChange: () => ({ from: 'positive', to: 'negative' }),
  intentHit: () => ({ kind: 'actor', target: 2, x: 1, y: 1, z: 1, nx: 0, ny: 0, nz: 0, vx: 8, vy: 0, vz: 0, intent: intent() }),
  strike: () => ({ weapon: 'blade', damage: 10, mining: 3, reach: 2.5, color: 0, tags: new Set(), polarity: 'positive' }),
  blockDamage: () => ({ x: 1, y: 1, z: 1, material: 4, amount: 3, kind: 'intent', source: 'intent' }),
  blockBreak: () => ({ x: 1, y: 1, z: 1, material: 4, kind: 'intent', source: 'intent', spawnDebris: true }),
  blockPlace: () => ({ x: 1, y: 1, z: 1, material: 4 }),
  touchBlock: () => ({ x: 1, y: 1, z: 1, material: 1, crush: false }),
  headBump: () => ({ x: 1, y: 2, z: 1, material: 4, speed: 6, breaks: false }),
  explosion: () => ({ x: 1, y: 1, z: 1, radius: 2, damage: 10, actorDamage: 8, source: 'test', owner: 1, cause: { origin: 'test', gen: 0 } }),
  blockLoot: () => ({ x: 1, y: 1, z: 1, material: 4, source: 'intent', drops: ['key'] }),
  touchCube: () => ({ cube: 0, material: 1, held: 0, carry: 1, bomb: false, action: 'pickup' }),
  bombPlace: () => ({ fuse: 1.8 }),
  kick: () => ({ cube: 0, material: 1, speed: 5, lift: 3, tags: new Set() }),
  throw: () => ({ cube: 0, material: 1, speed: 9, lift: 2, tags: new Set() }),
  drop: () => ({ material: 1, how: 'throw' }),
  debrisImpact: () => ({ cube: 0, x: 1, y: 1, z: 1, material: 1, speed: 8, tags: new Set(['volatile']), keepTags: false }),
  jump: () => ({ velocity: 8.4 }),
  land: () => ({ fallSpeed: 10, cause: 'fall', x: 1, y: 1, z: 1 }),
  actorDamage: () => ({ target: 1, targetKind: 'player', def: 'player', amount: 8, kind: 'explosion', source: 'bomb', owner: 1, knockback: 0, polarity: null }),
  contact: () => ({ attacker: 2, attackerDef: 'doubt', target: 1, targetKind: 'player', toTarget: 4, toAttacker: 0 }),
  factionChange: () => ({ target: 2, targetKind: 'projection', def: 'doubt', from: 'projection', to: 'self', source: 'test' }),
  actorDeath: () => ({ target: 2, targetKind: 'projection', def: 'doubt', x: 1, y: 1, z: 1, drops: [] }),
  heal: () => ({ amount: 2, source: 'pickup' }),
  death: () => ({ source: 'doubt' }),
  enemySpawn: () => ({ id: 2, def: 'doubt', hp: 12, speed: 1.7, contactDamage: 4, tags: new Set(), x: 1, y: 1, z: 1 }),
  roomClear: () => ({ room: 101, drops: [] }),
  doorOpen: () => ({ door: 0, locked: true, needsKey: true }),
  chestOpen: () => ({ x: 1, y: 1, z: 1, cost: 2 }),
  pickupCollect: () => ({ kind: 'key', amount: 1 }),
  itemGained: () => ({ id: 'x', uid: 1 }),
  roomEnter: () => ({ room: 1, type: 'normal', firstVisit: true }),
  floorEnter: () => ({ depth: 2 }),
  doorBreak: () => ({ door: 101, locked: false, source: 'bomb' }),
  ignite: () => ({ x: 1, y: 1, z: 1, material: 6, by: 'fire' }),
  materialReact: () => ({ x: 1, y: 1, z: 1, reaction: 'quench', result: 7 }),
  elementEnter: () => ({ target: 1, targetKind: 'player', def: 'player', element: 'water', depth: 'head' }),
  elementLeave: () => ({ target: 1, targetKind: 'player', def: 'player', element: 'water' }),
};

function sandbox() {
  const bus = createBus();
  const stats = new StatSheet();
  const calls = { damage: 0, explode: 0, spawn: 0 };
  const api: HostApi = {
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
    message: () => {},
    defer: fn => bus.defer(fn),
    heal: () => {},
    damagePlayer: () => {},
    player: () => 1,
    isPlayer: id => id === 1,
    collect: () => true,
    counts: () => ({ keys: 1, bombs: 1, hp: 24, maxHp: 24 }),
    spawnPickup: () => {},
    pulse: () => {},
    arc: () => {},
    nearestProjection: () => null,
    actorAt: () => null,
    shove: () => {},
    freeze: () => {},
    frighten: () => {},
    igniteArea: () => {},
    launch: () => {},
    tagFlying: () => {},
    tagCube: () => {},
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

  // Actor events cover the player and projections: the same sample aimed at a projection
  // must never be blocked by a hook meant for the player (e.g. Radical Acceptance vs your bombs).
  it('with every item held, your bomb still hurts a projection and its contact still reaches you', () => {
    const { bus } = exercise(ids);
    const toEnemy = bus.emit('actorDamage', { ...SAMPLES.actorDamage(), target: 2, targetKind: 'projection', def: 'doubt', knockback: 3 });
    expect(toEnemy.cancelled).toBe(false);
    expect(toEnemy.amount).toBeGreaterThan(0);
    // contact aimed at another projection (an ally later) is untouched by player-only hooks
    const ally = bus.emit('contact', { ...SAMPLES.contact(), target: 3, targetKind: 'projection' });
    expect(ally.toTarget).toBe(4);
    expect(ally.toAttacker).toBe(0);
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
