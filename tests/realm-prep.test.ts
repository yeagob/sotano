// Realm prep (SKY.md §2.2, §2.4): the actor filter by realm, the clears of intentions and particles,
// and the one star pad that leads up. Each piece is small; the passage itself is tested in realm-gate.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { Intents, intentFromStats, type IntentHooks } from '../src/combat/intents';
import { BASE_STATS } from '../src/core/stats';
import { Particles } from '../src/render/particles';
import { Rng } from '../src/core/rng';
import { WORLD_SIZE, SURFACE_Y } from '../src/world/floor';
import { GiantTree, TREE_STORIES } from '../src/world/tree';
import { VoxelWorld } from '../src/world/world';

const actor = (id: number, kind: 'player' | 'projection' = 'projection'): Actor => ({
  id, kind, def: kind === 'player' ? 'player' : 'walker', faction: kind === 'player' ? 'self' : 'projection',
  body: {} as Actor['body'], hp: 10, tags: new Set(), room: -1, alive: true, spawning: 0,
});

describe('actors by realm (SKY.md §2.2)', () => {
  it('the dungeon is the default realm: add and register without a realm both put actors there', () => {
    const r = new ActorRegistry();
    r.add(actor(1));
    r.register(actor(2));
    expect(r.realm(1)).toBe('dungeon');
    expect(r.realm(2)).toBe('dungeon');
    expect([...r.all()].map(a => a.id)).toEqual([1, 2]);
  });

  it('all() yields the player and only the active realm\'s actors', () => {
    const r = new ActorRegistry();
    r.register(actor(1, 'player'));
    r.register(actor(2), 'dungeon');
    r.register(actor(3), 'sky');
    expect([...r.all()].map(a => a.id)).toEqual([1, 2]);
    r.setRealm('sky');
    expect(r.activeRealm).toBe('sky');
    expect([...r.all()].map(a => a.id)).toEqual([1, 3]);
    r.setRealm('dungeon');
    expect([...r.all()].map(a => a.id)).toEqual([1, 2]);
  });

  it('get is by id and does not filter, so a stale id from the other realm still resolves', () => {
    const r = new ActorRegistry();
    r.register(actor(5), 'dungeon');
    r.setRealm('sky');
    expect(r.get(5)?.id).toBe(5);
    expect(r.get('world')).toBeUndefined();
  });

  it('removing an actor forgets its realm; reset empties the registry and returns to the dungeon', () => {
    const r = new ActorRegistry();
    r.register(actor(1), 'sky');
    r.remove(1);
    expect(r.realm(1)).toBeUndefined();
    expect(r.size).toBe(0);
    r.register(actor(2), 'sky');
    r.setRealm('sky');
    r.reset();
    expect(r.activeRealm).toBe('dungeon');
    expect(r.size).toBe(0);
    expect(r.newId()).toBe(1);
  });
});

function intentRig() {
  const hooks: IntentHooks = {
    solid: () => false,
    hitBlock: () => false,
    tier: () => 0,
    debrisAt: () => -1,
    hitDebris: () => {},
    enemyAt: () => -1,
    hitEnemy: () => {},
    splash: () => {},
    hit: () => {},
    nearestBlock: () => null,
  };
  const scene = new THREE.Scene();
  const intents = new Intents(scene, hooks);
  const meshes = () => scene.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh);
  return { intents, meshes };
}

describe('intentions and particles clear on a passage (SKY.md §2.2)', () => {
  it('Intents.clear drops every intention in flight and hides its meshes; nothing comes back', () => {
    const { intents, meshes } = intentRig();
    const spec = intentFromStats(BASE_STATS, 'positive');
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3());
    intents.update(1 / 60);
    expect(intents.count).toBeGreaterThan(0);
    expect(meshes().some(m => m.count > 0)).toBe(true);
    intents.clear();
    expect(intents.count).toBe(0);
    expect(meshes().every(m => m.count === 0)).toBe(true);
    intents.update(1 / 60);
    expect(meshes().every(m => m.count === 0)).toBe(true);
  });

  it('Particles.clear drops every mote and hides the mesh; nothing comes back', () => {
    const scene = new THREE.Scene();
    const p = new Particles(scene);
    const mesh = scene.children.find((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh)!;
    p.burst(0, 0, 0, 0xffffff, 12);
    p.update(1 / 60);
    expect(mesh.count).toBe(12);
    p.clear();
    expect(mesh.count).toBe(0);
    p.update(1 / 60);
    expect(mesh.count).toBe(0);
    // motes added after the clear are the only ones drawn
    p.burst(0, 0, 0, 0xffffff, 3);
    p.update(1 / 60);
    expect(mesh.count).toBe(3);
  });
});

describe('the up pad (SKY.md §2.4)', () => {
  it('exactly one star pad is up, and it is the last star of the built tree', () => {
    const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
    const t = new GiantTree(w, SURFACE_Y, i => new Rng(5 * 31 + i));
    TREE_STORIES.forEach((_, i) => t.grow(i));
    const pads = t.pads;
    expect(pads.length).toBeGreaterThan(1);
    const up = pads.filter(p => p.up);
    expect(up).toHaveLength(1);
    expect(up[0]).toBe(pads[pads.length - 1]);
    expect(pads.slice(0, -1).some(p => p.up)).toBe(false);
  });

  it('the cycle and every `to` are unchanged by the flag: the last star leads back to the first', () => {
    const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
    const t = new GiantTree(w, SURFACE_Y, i => new Rng(5 * 31 + i));
    TREE_STORIES.forEach((_, i) => t.grow(i));
    const n = t.pads.length;
    t.pads.forEach((p, i) => expect(p.to).toBe((i + 1) % n));
    expect(t.pads[n - 1].to).toBe(0);
  });
});
