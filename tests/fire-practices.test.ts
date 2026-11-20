// The fire practices (Inner Fire, Firewalking, Stolen Fire) and the fire synergy Hearth, driven through the real
// inventory and event bus, with a fake ItemApi that records what the hooks ask the game to do.
// Fire is a damage kind 'fire' whose source is the element: 'fire' (4 points) or 'lava' (8 points).

import { describe, expect, it } from 'vitest';
import { ITEMS, ITEM_BY_ID } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { Rng } from '../src/core/rng';
import { StatSheet } from '../src/core/stats';
import { createBus, type IntentSpec } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';
import { FIRE_SEED } from '../src/content/items/prometheus';
import { BURNING } from '../src/content/items/tummo';

function intent(polarity: 'negative' | 'positive' = 'negative'): IntentSpec {
  return {
    damage: 4, polarity, mining: 3, knock: 1, speed: 20, flight: 1, gravity: 0, radius: 0.2, pierce: 0, pierceTier: 0,
    phase: 0, color: 0, tags: new Set(), volley: 1, bounces: 0, homing: 0, homingTarget: 'block',
  };
}

function setup(ids: string[]) {
  const bus = createBus();
  const stats = new StatSheet();
  const rec = {
    time: 0, hp: 16, maxHp: 24,
    heals: [] as number[], pulses: [] as { x: number; y: number; z: number; r: number; d: number; src: string }[],
    ignites: [] as { x: number; y: number; z: number; r: number }[],
  };
  const api = {
    get bus() { return bus; },
    stats: () => stats.all,
    has: () => false, hasTag: () => false, held: () => [],
    rng: () => new Rng(1),
    time: () => rec.time,
    memory: () => ({}),
    materialAt: () => 0, damageBlock: () => true, explode: () => {}, spawnDebris: () => {},
    message: () => {}, defer: (fn: () => void) => bus.defer(fn),
    heal: (n: number) => { rec.heals.push(n); },
    damagePlayer: () => {}, player: () => 1, isPlayer: (id: number) => id === 1,
    collect: () => true,
    counts: () => ({ keys: 0, bombs: 0, hp: rec.hp, maxHp: rec.maxHp }),
    spawnPickup: () => {},
    pulse: (x: number, y: number, z: number, r: number, d: number, _k: number, _c: number, src: string) => { rec.pulses.push({ x, y, z, r, d, src }); },
    arc: () => {}, nearestProjection: () => null,
    actorAt: () => ({ x: 5, y: 2, z: 5 }),
    shove: () => {}, freeze: () => {}, frighten: () => {},
    igniteArea: (x: number, y: number, z: number, r: number) => { rec.ignites.push({ x, y, z, r }); },
    launch: () => {}, intentsHere: () => 0, tagCube: () => {},
  } as unknown as HostApi;
  const inv = new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  for (const id of ids) inv.gain(id);
  return { bus, stats, inv, rec };
}

const actorDamage = (source: string, targetKind: 'player' | 'projection' = 'player', amount = 4) => ({
  target: targetKind === 'player' ? 1 : 7, targetKind, def: targetKind === 'player' ? 'player' : 'doubt', amount, kind: 'fire' as const,
  source, owner: 'world' as never, knockback: 0, polarity: null,
});

describe('Inner Fire (tummo)', () => {
  it('tags a negative intention as burning and tints it with the fire palette', () => {
    const { bus } = setup(['tummo']);
    const ev = bus.emit('fire', { intent: intent() });
    expect(ev.intent.tags.has(BURNING)).toBe(true);
    expect(ev.intent.color).not.toBe(0);
  });

  it('sets flammable blocks within one block of a negative hit on fire', () => {
    const { bus, rec } = setup(['tummo']);
    const i = intent();
    i.tags.add(BURNING);
    bus.emit('intentHit', { kind: 'block', target: 0, x: 4, y: 2, z: 3, nx: 1, ny: 0, nz: 0, vx: 0, vy: 0, vz: 0, intent: i });
    expect(rec.ignites).toEqual([{ x: 3, y: 2, z: 3, r: 1 }]);
  });

  it('deals +1.5 fire damage to projections in a small sphere on a negative hit, and not on a positive one', () => {
    const { bus, rec } = setup(['tummo']);
    const neg = intent();
    neg.tags.add(BURNING);
    bus.emit('intentHit', { kind: 'actor', target: 7, x: 5, y: 2, z: 5, nx: 0, ny: 0, nz: 0, vx: 0, vy: 0, vz: 0, intent: neg });
    expect(rec.pulses).toEqual([{ x: 5, y: 2, z: 5, r: 0.6, d: 1.5, src: 'tummo' }]);

    const pos = intent('positive');
    pos.tags.add(BURNING);
    bus.emit('intentHit', { kind: 'actor', target: 7, x: 5, y: 2, z: 5, nx: 0, ny: 0, nz: 0, vx: 0, vy: 0, vz: 0, intent: pos });
    bus.emit('intentHit', { kind: 'block', target: 0, x: 4, y: 2, z: 3, nx: 1, ny: 0, nz: 0, vx: 0, vy: 0, vz: 0, intent: pos });
    expect(rec.pulses).toHaveLength(1);
    expect(rec.ignites).toHaveLength(0);
  });

  it('halves fire damage to the player, and never lava', () => {
    const { bus } = setup(['tummo']);
    expect(bus.emit('actorDamage', actorDamage('fire', 'player', 4)).amount).toBe(2);
    expect(bus.emit('actorDamage', actorDamage('lava', 'player', 8)).amount).toBe(8);
    expect(bus.emit('actorDamage', actorDamage('fire', 'projection', 4)).amount).toBe(4);
  });

  it('ignores intentions it did not tag', () => {
    const { bus, rec } = setup(['tummo']);
    bus.emit('intentHit', { kind: 'block', target: 0, x: 4, y: 2, z: 3, nx: 1, ny: 0, nz: 0, vx: 0, vy: 0, vz: 0, intent: intent() });
    expect(rec.ignites).toHaveLength(0);
  });
});

describe('Firewalking', () => {
  it('cancels fire damage to the player, but not lava', () => {
    const { bus } = setup(['firewalking']);
    expect(bus.emit('actorDamage', actorDamage('fire')).cancelled).toBe(true);
    const lava = bus.emit('actorDamage', actorDamage('lava', 'player', 8));
    expect(lava.cancelled).toBe(false);
    expect(lava.amount).toBe(8);
  });

  it('leaves projections to the element as before', () => {
    const { bus } = setup(['firewalking']);
    expect(bus.emit('actorDamage', actorDamage('fire', 'projection')).cancelled).toBe(false);
  });

  it('heals a quarter heart every 3 seconds while in fire', () => {
    const { bus, rec } = setup(['firewalking']);
    bus.emit('actorDamage', actorDamage('fire'));
    expect(rec.heals).toEqual([0.5]);
    rec.time = 1; bus.emit('actorDamage', actorDamage('fire'));
    rec.time = 2.9; bus.emit('actorDamage', actorDamage('fire'));
    expect(rec.heals).toHaveLength(1);
    rec.time = 3; bus.emit('actorDamage', actorDamage('fire'));
    expect(rec.heals).toHaveLength(2);
  });

  it('heals at most one heart (8 points) per room, and the room resets it', () => {
    const { bus, rec } = setup(['firewalking']);
    for (const t of [0, 3, 6, 9, 12, 15]) { rec.time = t; bus.emit('actorDamage', actorDamage('fire')); }
    expect(rec.heals).toHaveLength(4);
    expect(rec.heals.reduce((a, b) => a + b, 0) * 4).toBe(8);
    bus.emit('roomEnter', { room: 2, floor: 1, type: 'normal', template: 'x', firstVisit: true });
    rec.time = 18; bus.emit('actorDamage', actorDamage('fire'));
    expect(rec.heals).toHaveLength(5);
  });

  it('spends neither the timer nor the room cap at full health', () => {
    const { bus, rec } = setup(['firewalking']);
    rec.hp = rec.maxHp;
    bus.emit('actorDamage', actorDamage('fire'));
    rec.hp = 16;
    bus.emit('actorDamage', actorDamage('fire'));
    expect(rec.heals).toEqual([0.5]);
  });
});

describe('Stolen Fire (prometheus)', () => {
  it('makes one intention in five a fire seed, deterministically, over many shots', () => {
    const shots = 5000;
    const counts: number[] = [];
    for (let run = 0; run < 2; run++) {
      const { bus } = setup(['prometheus']);
      let seeds = 0;
      for (let n = 0; n < shots; n++) {
        const ev = bus.emit('fire', { intent: intent() });
        if (ev.intent.tags.has(FIRE_SEED)) seeds++;
      }
      counts.push(seeds);
    }
    expect(counts[0]).toBe(counts[1]);
    expect(counts[0] / shots).toBeGreaterThan(0.18);
    expect(counts[0] / shots).toBeLessThan(0.22);
  });

  it('bursts a negative seed on a projection (1.6 blocks, 5 damage) and ignites within 1.5 blocks', () => {
    const { bus, rec } = setup(['prometheus']);
    const seed = intent();
    seed.tags.add(FIRE_SEED);
    bus.emit('intentHit', { kind: 'actor', target: 7, x: 5, y: 2, z: 5, nx: 0, ny: 0, nz: 0, vx: 0, vy: 0, vz: 0, intent: seed });
    expect(rec.pulses).toEqual([{ x: 5, y: 2, z: 5, r: 1.6, d: 5, src: 'prometheus' }]);
    expect(rec.ignites).toEqual([{ x: 5, y: 2, z: 5, r: 1.5 }]);
  });

  it('bursts on a block at the cell the seed came from', () => {
    const { bus, rec } = setup(['prometheus']);
    const seed = intent();
    seed.tags.add(FIRE_SEED);
    bus.emit('intentHit', { kind: 'block', target: 0, x: 4, y: 2, z: 3, nx: 0, ny: 1, nz: 0, vx: 0, vy: 0, vz: 0, intent: seed });
    expect(rec.ignites).toEqual([{ x: 4, y: 1, z: 3, r: 1.5 }]);
    expect(rec.pulses[0]).toMatchObject({ r: 1.6, d: 5 });
  });

  it('does not burst a positive seed (positive intentions only mend)', () => {
    const { bus, rec } = setup(['prometheus']);
    const seed = intent('positive');
    seed.tags.add(FIRE_SEED);
    bus.emit('intentHit', { kind: 'actor', target: 7, x: 5, y: 2, z: 5, nx: 0, ny: 0, nz: 0, vx: 0, vy: 0, vz: 0, intent: seed });
    expect(rec.pulses).toHaveLength(0);
    expect(rec.ignites).toHaveLength(0);
  });
});

describe('Hearth (fire synergy)', () => {
  it('is active with three fire practices, and Kindling counts', () => {
    const { inv } = setup(['kindling', 'tummo', 'firewalking']);
    expect(inv.synergiesActive.map(s => s.id)).toContain('hearth');
  });

  it('is not active with two', () => {
    const { inv } = setup(['kindling', 'tummo']);
    expect(inv.synergiesActive.map(s => s.id)).not.toContain('hearth');
  });

  it('adds +1 damage and ×1.1 fire rate while it is active', () => {
    const plain = setup(['kindling']);
    const hearth = setup(['kindling', 'tummo', 'firewalking']);
    expect(hearth.stats.get('damage')).toBe(plain.stats.get('damage') + 1);
    expect(hearth.stats.get('fireRate')).toBeCloseTo(plain.stats.get('fireRate') * 1.1, 9);
  });

  it('warms you when a fire burst goes off, at most every 4 seconds', () => {
    const { bus, rec } = setup(['kindling', 'tummo', 'firewalking']);
    const burst = (source: string) => bus.emit('burst', { x: 1, y: 1, z: 1, radius: 2.5, damage: 4, source });
    burst('kindling');
    expect(rec.heals).toEqual([0.5]);
    rec.time = 2; burst('prometheus');
    expect(rec.heals).toHaveLength(1);
    rec.time = 4; burst('kindling');
    expect(rec.heals).toHaveLength(2);
  });

  it('does not react to bursts of other practices, nor heal at full health', () => {
    const { bus, rec } = setup(['kindling', 'tummo', 'firewalking']);
    bus.emit('burst', { x: 1, y: 1, z: 1, radius: 1.6, damage: 5, source: 'tummo' });
    expect(rec.heals).toHaveLength(0);
    rec.hp = rec.maxHp;
    bus.emit('burst', { x: 1, y: 1, z: 1, radius: 2.5, damage: 4, source: 'kindling' });
    expect(rec.heals).toHaveLength(0);
  });
});

describe('the fire practices in the catalogue', () => {
  it('are path practices with the fire tag, quality and credit', () => {
    for (const id of ['tummo', 'firewalking', 'prometheus']) {
      const d = ITEM_BY_ID.get(id);
      expect(d, id).toBeDefined();
      expect(d!.tags).toContain('fire');
      expect(d!.inspiredBy).toBeTruthy();
      expect(d!.pools).toEqual({ treasure: 1 });
    }
    expect(ITEM_BY_ID.get('tummo')!.quality).toBe(2);
    expect(ITEM_BY_ID.get('firewalking')!.quality).toBe(2);
    expect(ITEM_BY_ID.get('prometheus')!.quality).toBe(3);
  });
});
