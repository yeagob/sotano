import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { CREATURES, CREATURE_BY_ID, CREATURE_LIFE, ambientCreatures } from '../src/content/creatures';
import { RunRandom } from '../src/core/rng';
import type { Actor } from '../src/entities/actors';
import type { FloorResult } from '../src/world/floor';

describe('creatures: life by floor', () => {
  it('every creature in the life table is defined, and every creature is a creature', () => {
    for (const life of CREATURE_LIFE) expect(CREATURE_BY_ID.get(life.def), life.def).toBeDefined();
    for (const c of CREATURES) expect(c.kind, c.id).toBe('creature');
  });

  it('every floor from 0 to 9 has creatures living on it', () => {
    for (let k = 0; k <= 9; k++) {
      expect(CREATURE_LIFE.some(l => k >= l.floors[0] && k <= l.floors[1]), `floor ${k}`).toBe(true);
    }
  });

  it('places them with the floor\'s own seed: the same seed gives the same creatures', () => {
    const floor = {
      floor: 1,
      rooms: [0, 1, 2].map(i => ({ id: i, type: 'normal', hx: 4 * i, hz: 2, y0: 136 })),
    } as unknown as FloorResult;
    const a = ambientCreatures(floor, new RunRandom(11).fork('floor', 1, 'creatures'));
    const b = ambientCreatures(floor, new RunRandom(11).fork('floor', 1, 'creatures'));
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    for (const c of a) expect(['chirper', 'delver', 'leafling', 'star-mite']).toContain(c.def);
  });
});

describe('creatures: never killed by a hit', () => {
  const host = (): EnemyHost => ({
    solid: () => false, worldVersion: () => 1, actors: () => [] as Actor[], actor: () => undefined,
    room: () => ({ id: 0, x0: 0, y0: 0, z0: 0, w: 13, d: 7, hx: 0, hz: 0 }), elemVersion: () => 0,
    pickupsIn: () => [],
    hazard: () => null, contact: () => {}, projectileHit: () => {}, projectileBlock: () => false,
    smash: () => false, burst: () => {}, died: () => {}, particles: () => {}, hurtActor: () => {},
    affectActor: () => {}, arena: () => {}, summon: () => {}, cue: () => {},
  } as EnemyHost);

  it('at zero health a creature hides in the blocks instead of dissolving, and comes back whole when its room clears', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = en.spawn(CREATURE_BY_ID.get('rootling')!, 5, 0, 3, 0, 3, 4, 0.9, 0, new Set(['creature']));
    e.faction = 'neutral';
    e.spawning = 0;
    const dissolved = en.hurt(e, 99, 0, 0);
    expect(dissolved).toBe(false);
    expect(e.alive).toBe(true);
    expect(e.hidden).toBe(true);
    expect(e.hp).toBe(1);
    expect(en.at(3, 0.5, 3, 1)).toBe(-1);
    en.hideRoom(0, false);
    expect(e.hidden).toBe(false);
    expect(e.hp).toBe(e.maxHp);
    expect(en.at(3, 0.5, 3, 1)).toBe(5);
  });

  it('a creature is never counted as a projection that keeps a room shut', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = en.spawn(CREATURE_BY_ID.get('chirper')!, 6, 0, 3, 0, 3, 3, 0.8, 0, new Set(['creature']));
    e.faction = 'neutral';
    e.spawning = 0;
    expect(en.blockingIn(0)).toBe(0);
  });
});
