// The sky's realm across a passage (SKY.md §2.1, §2.5): its nests are built on the sky's first update, in the
// sky's own loose cubes (the realm can be made lazily while the dungeon is the active world), and leaving the
// sky ends every hindrance in flight. Headless: two real DebrisSystems and a host whose debris() is whichever
// world is active, as the game's is.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { ActorRegistry } from '../src/entities/actors';
import type { Body } from '../src/physics/voxel-collide';
import { DebrisSystem } from '../src/physics/debris';
import { SkyRealm } from '../src/sky/sky-realm';
import { MIN_TELEGRAPH, type Hindrance, type HindranceId, type HindranceRunnerApi, type SkyHost, type SkyRealmSet } from '../src/sky/types';
import { SkyWorld } from '../src/sky/world/sky-world';

const DT = 1 / 60;

/** The game's two loose-cube sets; `active` is the world the game has installed. */
function worlds() {
  const dungeon = new DebrisSystem(256, () => false, () => {});
  const sky = new DebrisSystem(256, () => false, () => {});
  const w = { dungeon, sky, active: 'dungeon' as 'dungeon' | 'sky' };
  return w;
}

/** A host with the player well away from everything; `debris()` answers for the active world, as the game's does. */
function fakeHost(actors: ActorRegistry, w: ReturnType<typeof worlds>, sky: () => SkyWorld): SkyHost {
  const noop = () => {};
  const player: Body = { x: 6, y: 10, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  return {
    time: () => 0,
    player: () => ({ body: player, eye: { x: 0, y: 0, z: 0 }, aim: { x: 1, y: 0, z: 0 }, hand: [], push: noop, slow: noop, hold: noop, carry: noop }),
    actors: () => actors,
    world: sky,
    debris: () => (w.active === 'sky' ? w.sky : w.dungeon),
    fork: (...path: (string | number)[]) => new Rng(path.length * 7 + 1),
    fx: noop, cue: noop, toast: noop, card: noop, bar: noop, place: noop, gift: noop, travel: noop,
    drainSpirit: noop, spirit: () => 100, refillSpirit: noop, takeRandomPractice: () => null, sendUnderground: noop,
  } as unknown as SkyHost;
}

function makeRealm(w: ReturnType<typeof worlds>): SkyRealm {
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  let world: SkyWorld | null = null;
  return SkyRealm.create(fakeHost(actors, w, () => world!), new THREE.Group(), layout => ({ kind: 'sky', world: (world = new SkyWorld(layout)), debris: w.sky } as unknown as SkyRealmSet));
}

describe('the sky builds its nests on its first update, in the sky\'s own loose cubes', () => {
  it('making the realm while the dungeon is the active world spawns nothing into either set', () => {
    const w = worlds();
    makeRealm(w);
    expect(w.dungeon.count).toBe(0);
    expect(w.sky.count).toBe(0);
  });

  it('the first update in the sky spawns the nests into the sky\'s set and nothing into the dungeon\'s', () => {
    const w = worlds();
    const realm = makeRealm(w);
    w.active = 'sky';
    realm.update(DT);
    expect(w.sky.count).toBeGreaterThan(0);
    expect(w.dungeon.count).toBe(0);
  });

  it('the nests are built once: later updates spawn no more cubes while the nests are full', () => {
    const w = worlds();
    const realm = makeRealm(w);
    w.active = 'sky';
    realm.update(DT);
    const first = w.sky.count;
    realm.update(DT);
    expect(w.sky.count).toBe(first);
  });
});

describe('leaving the sky ends its hindrances (SKY.md §2.1)', () => {
  it('leave() ends every telegraph and effect in flight, and none survives the passage', () => {
    const w = worlds();
    const realm = makeRealm(w);
    const ended: string[] = [];
    const at = { x: 0, y: 0, z: 0 };
    const runner = (realm as unknown as { runner: HindranceRunnerApi }).runner;
    const telegraphing = {
      id: 'probe' as HindranceId,
      telegraph: () => ({ at, update() {}, end() { ended.push('tell'); } }),
      effect: () => ({ at, update: () => true, end() { ended.push('effect'); } }),
    } as unknown as Hindrance<null>;
    runner.start(telegraphing, null, 2, 0);
    runner.start(telegraphing, null, MIN_TELEGRAPH, 0);
    runner.update(MIN_TELEGRAPH + 0.05);
    expect(runner.active().map(a => a.phase).sort()).toEqual(['effect', 'telegraph']);
    realm.leave();
    expect(runner.active()).toHaveLength(0);
    expect([...ended].sort()).toEqual(['effect', 'tell', 'tell']);
  });
});
