// The way up opens when its floor's deity is won (owner, 2026-11-05): SkyRealm wires the creatures' onWon to
// openGate (docs/architecture/SKY.md §5.5, §7.1). Headless: a real layout and world, and a test deity on each floor,
// won by warm positive touches through the realm.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { ActorRegistry } from '../src/entities/actors';
import type { Body } from '../src/physics/voxel-collide';
import { openGate } from '../src/sky/floors/tree';
import { SkyRealm } from '../src/sky/sky-realm';
import { covers } from '../src/sky/world/shapes';
import { SkyWorld } from '../src/sky/world/sky-world';
import type { DeityDef, DeityModel, SkyHost, SkyRealmSet, SkyWorldApi } from '../src/sky/types';

const DT = 0.1;

/** A host with the player well away from the deities, and every call the realm and its deities make as a no-op. */
function fakeHost(actors: ActorRegistry): SkyHost {
  const noop = () => {};
  const player: Body = { x: 6, y: 10, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  return {
    time: () => 0,
    player: () => ({ body: player, eye: { x: 0, y: 0, z: 0 }, aim: { x: 1, y: 0, z: 0 }, hand: [], push: noop, slow: noop, hold: noop, carry: noop }),
    actors: () => actors,
    debris: () => ({ spawn: () => 0, max: 0 }),
    fork: (...path: (string | number)[]) => new Rng(path.length * 7 + 1),
    fx: noop, cue: noop, toast: noop, card: noop, bar: noop, place: noop, gift: noop, travel: noop,
    drainSpirit: noop, spirit: () => 100, takeRandomPractice: () => null, sendUnderground: noop,
  } as unknown as SkyHost;
}

/** A test deity on `floor`: 24 hits, its attacks do nothing, levitating on its seat. */
function deityDef(floor: number): DeityDef {
  const model: DeityModel = { body: [], head: [], hw: 0.5, h: 1, progress: () => {} };
  const attack = { telegraph: { tell: 'tell', pose: 'raise', cue: 'core.gate' }, act: () => {} };
  return {
    animal: 'panda', floor, hits: 24, telegraph: 1, recover: 1, rest: [1, 1, 1], sight: 10, hover: 0, teleport: false,
    attacks: [{ id: 'a', stage: 0, ...attack }, { id: 'b', stage: 0, ...attack }], ally: { act: 'sit', every: 4, cap: 2 }, knock: 'nudge',
    won: { toast: null, play: () => {} }, model,
  } as unknown as DeityDef;
}

function newRealm(): SkyRealm {
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  return SkyRealm.create(fakeHost(actors), new THREE.Group(), layout => ({ kind: 'sky', world: new SkyWorld(layout) } as unknown as SkyRealmSet));
}

/** Spawns floor `floor`'s deity on its seat and touches it `touches` times (warm and positive). */
function touchDeity(realm: SkyRealm, floor: number, touches: number) {
  const actor = realm.creatures.spawnDeity(deityDef(floor), realm.plans.floors[floor - 1]);
  realm.creatures.update(DT, floor);
  const p = { x: actor.body.x, y: actor.body.y + 0.5, z: actor.body.z };
  for (let i = 0; i < touches; i++) realm.creatures.touch(actor.id, 'positive', true, p, 'intent');
  return actor;
}

/** Every cell of floor n's membrane disc (the way up, on its bottom layer). */
function membrane(realm: SkyRealm, n: number): [number, number, number][] {
  const g = realm.plans.tree.gates[n - 1];
  const disc = { k: 'ring' as const, cx: g.x, cz: g.z, r0: 0, r1: g.r, y0: g.y, y1: g.y, m: AIR };
  const out: [number, number, number][] = [];
  for (let z = g.z - g.r; z <= g.z + g.r; z++)
    for (let x = g.x - g.r; x <= g.x + g.r; x++)
      if (covers(disc, x, g.y, z)) out.push([x, g.y, z]);
  return out;
}

/** The materials of floor n's membrane, cell by cell. */
function cellsOf(world: SkyWorldApi, realm: SkyRealm, n: number): number[] {
  return membrane(realm, n).map(([x, y, z]) => world.get(x, y, z));
}

describe('the way up opens when its deity is won', () => {
  it('starts closed: every membrane is heartwood before any deity is won', () => {
    const realm = newRealm();
    for (let n = 1; n <= 5; n++) {
      const cells = cellsOf(realm.set.world, realm, n);
      expect(cells.length, `floor ${n} disc`).toBeGreaterThan(0);
      expect(cells.every(m => m === MAT.heartwood), `floor ${n} closed`).toBe(true);
    }
  });

  it('stays closed while its deity is not yet won', () => {
    const realm = newRealm();
    const actor = touchDeity(realm, 1, 23);
    expect([actor.hits, actor.side]).toEqual([23, 'wild']);
    expect(cellsOf(realm.set.world, realm, 1).every(m => m === MAT.heartwood)).toBe(true);
  });

  it('when floor 1 is won, its membrane turns to air and the other four stay heartwood', () => {
    const realm = newRealm();
    const actor = touchDeity(realm, 1, 24);
    expect(actor.state).toBe('Won');
    expect(cellsOf(realm.set.world, realm, 1).every(m => m === AIR)).toBe(true);
    for (let n = 2; n <= 5; n++) {
      expect(cellsOf(realm.set.world, realm, n).every(m => m === MAT.heartwood), `floor ${n}`).toBe(true);
    }
  });

  it('each floor opens by its own deity, and no other', () => {
    const realm = newRealm();
    touchDeity(realm, 2, 24);
    expect(cellsOf(realm.set.world, realm, 2).every(m => m === AIR)).toBe(true);
    for (const n of [1, 3, 4, 5]) expect(cellsOf(realm.set.world, realm, n).every(m => m === MAT.heartwood), `floor ${n}`).toBe(true);
  });

  it('opening is idempotent: a second openGate changes no cell of any membrane', () => {
    const realm = newRealm();
    touchDeity(realm, 1, 24);
    const world = realm.set.world;
    const before = [1, 2, 3, 4, 5].map(n => cellsOf(world, realm, n));
    openGate(world, realm.plans.tree, 1);
    const after = [1, 2, 3, 4, 5].map(n => cellsOf(world, realm, n));
    expect(after).toEqual(before);
  });
});
