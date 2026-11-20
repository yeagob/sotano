// Affirmation's copy, the two aim practices (Dowsing and Eye Contact) and the rule that the one gained last guides.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Intents, intentFromStats, type IntentHooks } from '../src/combat/intents';
import { ITEM_BY_ID } from '../src/content/items';
import affirmation, { COPIED } from '../src/content/items/affirmation';
import { AIR, MAT, isPlaceable } from '../src/content/materials';
import { BASE_STATS, StatSheet } from '../src/core/stats';
import { Rng } from '../src/core/rng';
import type { HostApi, ItemDef } from '../src/items/types';
import { Inventory } from '../src/items/inventory';
import { createBus } from '../src/game/events';
import type { GameBus, IntentSpec } from '../src/game/events';

const AIM = ['affirmation', 'dowsing', 'eyecontact'] as const;

/** An inventory over the three practices, with the game's pieces faked: placements and toasts are recorded. */
function rig(ids: readonly string[] = [], material: number = MAT.stone) {
  const bus: GameBus = createBus();
  const stats = new StatSheet();
  const toasts: string[] = [];
  const placed: [number, number, number, number, string][] = [];
  const state = { accept: true };
  const api = {
    bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn),
    heal: () => {}, collect: () => true, damagePlayer: () => {}, rng: () => new Rng(1),
    has: (id: string) => inv.has(id), hasTag: (t: string) => inv.hasTag(t),
    materialAt: () => material,
    placeBlock: (x: number, y: number, z: number, m: number, src: string) => { placed.push([x, y, z, m, src]); return state.accept; },
    message: (owner: ItemDef, id: string) => toasts.push(`${owner.id}:${id}`),
  } as unknown as HostApi;
  const catalog = new Map(AIM.map(id => [id, ITEM_BY_ID.get(id)!] as const));
  const inv = new Inventory(catalog, [], stats, () => bus, () => api);
  for (const id of ids) inv.gain(id);
  return { bus, inv, toasts, placed, api, state };
}

/** A fresh shot, before any item has aimed it. */
const shot = (polarity: 'positive' | 'negative' = 'positive'): IntentSpec => intentFromStats(BASE_STATS, polarity);

/** Fires one shot through the bus, as the player's fire does, and returns the spec the hooks left. */
function fire(bus: GameBus, spec: IntentSpec = shot()) {
  bus.emit('fire', { intent: spec });
  return spec;
}

describe('placeable materials (Affirmation copies only ordinary blocks)', () => {
  it('copies ordinary blocks', () => {
    for (const k of ['dirt', 'grass', 'brick', 'stone', 'deepstone', 'crate', 'obsidian', 'ore', 'loam', 'ice', 'log'] as const) {
      expect(isPlaceable(MAT[k]), k).toBe(true);
    }
  });

  it('never copies air, the unbreakable blocks, the models, the door frames, the pedestal or the bomb', () => {
    for (const k of ['bedrock', 'chest', 'chestopen', 'alembic', 'kitchen', 'heartwood', 'sunseal', 'frame', 'goldframe', 'bossframe', 'pedestal', 'bomb'] as const) {
      expect(isPlaceable(MAT[k]), k).toBe(false);
    }
    expect(isPlaceable(AIR)).toBe(false);
    expect(isPlaceable(9999)).toBe(false);
  });
});

describe('Affirmation: a copy beside the block it hits', () => {
  /** A block hit on the face n of the stone at (9,3,7): the hit point is on that face, the copy goes into (9,3,7) + n. */
  function hitFace(bus: GameBus, spec: IntentSpec, kind: 'block' | 'actor' = 'block', n: [number, number, number] = [1, 0, 0]) {
    bus.emit('intentHit', {
      kind, target: -1, x: 9.5 + n[0] * 0.5, y: 3.5 + n[1] * 0.5, z: 7.5 + n[2] * 0.5, nx: n[0], ny: n[1], nz: n[2], vx: 0, vy: 0, vz: 0, intent: spec,
    } as never);
  }

  it('places a copy of the same material into the cell the hit face looks onto', () => {
    const { bus, placed } = rig(['affirmation']);
    const spec = shot();
    hitFace(bus, spec);
    expect(placed).toEqual([[10, 3, 7, MAT.stone, 'affirmation']]);
    expect(spec.tags.has(COPIED)).toBe(true);
  });

  it('uses the face normal in every direction', () => {
    const { bus, placed } = rig(['affirmation']);
    hitFace(bus, shot(), 'block', [0, -1, 0]);
    hitFace(bus, shot(), 'block', [0, 0, 1]);
    expect(placed.map(p => p.slice(0, 3))).toEqual([[9, 2, 7], [9, 3, 8]]);
  });

  it('places at most one copy per intention', () => {
    const { bus, placed } = rig(['affirmation']);
    const spec = shot();
    hitFace(bus, spec);
    hitFace(bus, spec);
    expect(placed).toHaveLength(1);
  });

  it('a refused copy costs nothing and the same intention may try again', () => {
    const { bus, placed, state } = rig(['affirmation']);
    const spec = shot();
    state.accept = false;
    hitFace(bus, spec);
    expect(spec.tags.has(COPIED)).toBe(false);
    state.accept = true;
    hitFace(bus, spec);
    expect(spec.tags.has(COPIED)).toBe(true);
    expect(placed).toHaveLength(2);
  });

  it('never places for a negative intention, for a shot that hits an actor, or without the item', () => {
    const { bus, placed } = rig(['affirmation']);
    hitFace(bus, shot('negative'));
    hitFace(bus, shot(), 'actor');
    expect(placed).toHaveLength(0);
    const none = rig();
    hitFace(none.bus, shot());
    expect(none.placed).toHaveLength(0);
  });

  it('asks for a material that the placement itself refuses (chests), so the world decides', () => {
    const { bus, placed } = rig(['affirmation'], MAT.chest);
    hitFace(bus, shot());
    expect(placed[0][3]).toBe(MAT.chest);
    expect(isPlaceable(MAT.chest)).toBe(false);
  });

  it('gives no homing: Affirmation aims nothing any more', () => {
    const { bus } = rig(['affirmation']);
    const spec = fire(bus);
    expect(spec.homing).toBe(0);
    expect(spec.homingTarget).toBe('block');
    expect(affirmation.hooks?.some(h => h.event === 'fire')).toBe(false);
  });
});

describe('aim: Dowsing aims at blocks, Eye Contact at projections', () => {
  /** Intents with recording hooks: which reach each aim asks for, and with which polarity. */
  function steering(extra: Partial<IntentHooks> = {}) {
    const calls = { block: [] as number[], enemy: [] as { r: number; pol: string }[] };
    const hooks: IntentHooks = {
      solid: () => false, hitBlock: () => false, tier: () => 0, debrisAt: () => -1, hitDebris: () => {},
      enemyAt: () => -1, hitEnemy: () => {}, splash: () => {}, hit: () => {},
      nearestBlock: (_p, r) => { calls.block.push(r); return null; },
      nearestEnemy: (_p, r, pol) => { calls.enemy.push({ r, pol }); return null; },
      ...extra,
    };
    return { intents: new Intents(new THREE.Scene(), hooks), calls };
  }

  it('Dowsing asks for blocks within 6, never for projections', () => {
    const { bus } = rig(['dowsing']);
    const spec = fire(bus);
    expect(spec.homing).toBe(3);
    expect(spec.homingTarget).toBe('block');
    const { intents, calls } = steering();
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    intents.update(1 / 60);
    expect(calls.block).toEqual([6]);
    expect(calls.enemy).toEqual([]);
  });

  it('Eye Contact asks for projections within 8, never for blocks', () => {
    const { bus } = rig(['eyecontact']);
    const spec = fire(bus);
    expect(spec.homing).toBe(10);
    expect(spec.homingTarget).toBe('projection');
    const { intents, calls } = steering();
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    intents.update(1 / 60);
    expect(calls.enemy).toEqual([{ r: 8, pol: 'positive' }]);
    expect(calls.block).toEqual([]);
  });

  it('a projection in reach bends the shot toward it, a block elsewhere does not', () => {
    const { bus } = rig(['eyecontact']);
    const spec = fire(bus);
    const { intents } = steering({ nearestEnemy: () => new THREE.Vector3(0, 0, 4), nearestBlock: () => new THREE.Vector3(0, 0, -4) });
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let i = 0; i < 20; i++) intents.update(1 / 60);
    const shotNow = (intents as unknown as { list: { vel: THREE.Vector3 }[] }).list[0];
    expect(shotNow.vel.z).toBeGreaterThan(0);
  });

  it('a block in reach bends a Dowsing shot toward the block, not a projection', () => {
    const { bus } = rig(['dowsing']);
    const spec = fire(bus);
    const { intents } = steering({ nearestEnemy: () => new THREE.Vector3(0, 0, 4), nearestBlock: () => new THREE.Vector3(0, 0, -4) });
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let i = 0; i < 20; i++) intents.update(1 / 60);
    const shotNow = (intents as unknown as { list: { vel: THREE.Vector3 }[] }).list[0];
    expect(shotNow.vel.z).toBeLessThan(0);
  });

  it('a negative intention asks for projections with its polarity (hostile only, decided by the game)', () => {
    const { bus } = rig(['eyecontact']);
    const spec = fire(bus, shot('negative'));
    const { intents, calls } = steering();
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    intents.update(1 / 60);
    expect(calls.enemy).toEqual([{ r: 8, pol: 'negative' }]);
  });
});

describe('the one gained last guides', () => {
  const guide = (ids: readonly string[]) => {
    const { bus, inv } = rig();
    for (const id of ids) inv.gain(id);
    return fire(bus).homingTarget;
  };

  it('Dowsing then Eye Contact: projection', () => {
    expect(guide(['dowsing', 'eyecontact'])).toBe('projection');
  });

  it('Eye Contact then Dowsing: block', () => {
    expect(guide(['eyecontact', 'dowsing'])).toBe('block');
  });

  it('Dowsing, Eye Contact, Dowsing again: block', () => {
    expect(guide(['dowsing', 'eyecontact', 'dowsing'])).toBe('block');
  });

  it('a single one guides by itself, and with neither the shot aims at blocks', () => {
    expect(guide(['dowsing'])).toBe('block');
    expect(guide(['eyecontact'])).toBe('projection');
    expect(guide([])).toBe('block');
  });

  it('losing the later one gives the guidance back to the earlier one', () => {
    const { bus, inv } = rig(['dowsing', 'eyecontact']);
    expect(fire(bus).homingTarget).toBe('projection');
    inv.lose('eyecontact');
    expect(fire(bus).homingTarget).toBe('block');
  });

  it('restoring a run keeps the acquisition order', () => {
    const { bus, inv } = rig();
    inv.restore(['eyecontact', 'dowsing']);
    expect(fire(bus).homingTarget).toBe('block');
    inv.restore(['dowsing', 'eyecontact']);
    expect(fire(bus).homingTarget).toBe('projection');
  });

  it('the one gained last sets the strength too, and neither lowers damage', () => {
    const a = fire(rig(['dowsing', 'eyecontact']).bus);
    expect(a.homing).toBe(10);
    expect(a.damage).toBe(BASE_STATS.damage);
    const b = fire(rig(['eyecontact', 'dowsing']).bus);
    expect(b.homing).toBe(3);
    expect(b.damage).toBe(BASE_STATS.damage);
  });

  it('the toast comes from the practice gained last, when the other is held (both orders)', () => {
    const a = rig(['dowsing']);
    a.inv.gain('eyecontact');
    expect(a.toasts).toEqual(['eyecontact:takesOver']);
    const b = rig(['eyecontact']);
    b.inv.gain('dowsing');
    expect(b.toasts).toEqual(['dowsing:takesOver']);
    const alone = rig(['dowsing']);
    expect(alone.toasts).toEqual([]);
  });
});
