// The world swap (SKY.md §2.1): the fields change worlds, the leaving world's transient work is cleared
// first, the sky's hooks follow the world, and the stash comes back intact. Tested with a fake host.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { swapRealm } from '../src/sky/realm';
import type { RealmHost, RealmKind, RealmSet } from '../src/sky/types';
import type { ChunkRenderer } from '../src/render/chunks';
import type { ElementSim } from '../src/world/elements';
import type { DebrisSystem } from '../src/physics/debris';
import type { Pickups } from '../src/entities/pickups';
import type { Enemies } from '../src/entities/enemies';
import type { VoxelSpace } from '../src/world/space';

/** A set whose objects are markers: the swap never looks inside them. */
function marker(kind: RealmKind, name: string): RealmSet {
  return {
    kind,
    root: new THREE.Group(),
    world: { name } as unknown as VoxelSpace,
    chunks: { name } as unknown as ChunkRenderer,
    elements: { name } as unknown as ElementSim,
    debris: { name } as unknown as DebrisSystem,
    pickups: { name } as unknown as Pickups,
    enemies: { name } as unknown as Enemies,
  };
}

/** The game's fields as a fake host sees them, with every call logged in order. */
function fakeHost(start: RealmSet) {
  let fields: RealmSet = start;
  const calls: string[] = [];
  const hooks: RealmKind[] = [];
  const host: RealmHost = {
    install: set => { fields = set; calls.push(`install ${set.kind}`); },
    current: () => fields,
    clearTransient: () => { calls.push('clear'); },
    hooks: kind => { hooks.push(kind); calls.push(`hooks ${kind}`); },
  };
  return { host, calls, hooks, fields: () => fields };
}

describe('swapRealm (SKY.md §2.1)', () => {
  it('installs the stashed world and returns the one that was active, as the new stash', () => {
    const dungeon = marker('dungeon', 'dungeon');
    const sky = marker('sky', 'sky');
    const f = fakeHost(dungeon);
    const dRoot = new THREE.Group(), sRoot = new THREE.Group();
    const stash = swapRealm(f.host, sky, dRoot, sRoot);
    expect(f.fields()).toBe(sky);
    expect(stash).toBe(dungeon);
  });

  it('clears the leaving world\'s transient work before the fields change, then installs and hooks the sky', () => {
    const f = fakeHost(marker('dungeon', 'dungeon'));
    swapRealm(f.host, marker('sky', 'sky'), new THREE.Group(), new THREE.Group());
    expect(f.calls).toEqual(['clear', 'install sky', 'hooks sky']);
  });

  it('removes the sky\'s hooks when the player goes back down', () => {
    const f = fakeHost(marker('dungeon', 'dungeon'));
    const dRoot = new THREE.Group(), sRoot = new THREE.Group();
    const stash = swapRealm(f.host, marker('sky', 'sky'), dRoot, sRoot);
    f.calls.length = 0;
    swapRealm(f.host, stash, dRoot, sRoot);
    expect(f.calls).toEqual(['clear', 'install dungeon', 'hooks dungeon']);
    expect(f.hooks).toEqual(['sky', 'dungeon']);
  });

  it('shows only the active world\'s group', () => {
    const f = fakeHost(marker('dungeon', 'dungeon'));
    const dRoot = new THREE.Group(), sRoot = new THREE.Group();
    const stash = swapRealm(f.host, marker('sky', 'sky'), dRoot, sRoot);
    expect([dRoot.visible, sRoot.visible]).toEqual([false, true]);
    swapRealm(f.host, stash, dRoot, sRoot);
    expect([dRoot.visible, sRoot.visible]).toEqual([true, false]);
  });

  it('a round trip returns every set as it was: the same objects, the same contents', () => {
    const dungeon = marker('dungeon', 'dungeon');
    const sky = marker('sky', 'sky');
    const f = fakeHost(dungeon);
    const dRoot = new THREE.Group(), sRoot = new THREE.Group();
    let stash = swapRealm(f.host, sky, dRoot, sRoot);
    stash = swapRealm(f.host, stash, dRoot, sRoot);
    stash = swapRealm(f.host, stash, dRoot, sRoot);
    expect(f.fields()).toBe(sky);
    expect(stash).toBe(dungeon);
    expect(stash.world).toBe(dungeon.world);
    expect(stash.chunks).toBe(dungeon.chunks);
    expect(sky.world).toEqual({ name: 'sky' });
  });
});
