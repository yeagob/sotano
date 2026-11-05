// The game's realm passages, run on real Game methods (SKY.md §2.1, §2.4, §2.5a): the landing of a capture is
// carved and activated only once the dungeon is installed, the minimap comes back when the run leaves the sky,
// the dungeon's damage and blasts pass a sky actor by, and a passage clears the leaving world's missiles.
// As in alembic.test.ts, Game's methods run on a stand-in object that holds only what they read.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Missiles } from '../src/combat/missiles';
import { AIR } from '../src/content/materials';
import { createBus } from '../src/game/events';
import type { Travel } from '../src/sky/types';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: () => {}, unlockAudio: () => {} };
});

type Blast = { x: number; y: number; z: number; radius: number; damage: number; actorDamage: number; source: string; owner: number | string };
type Internals = {
  passRealm(t: Travel): void;
  leaveSky(): void;
  damageActor(t: unknown, amount: number, kind: string, source: string, owner: number | string): boolean;
  blast(b: Blast): void;
  missileMeets(x: number, y: number, z: number): boolean;
};
type Rig = Internals & Record<string, any>;

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
});

/** One world's loose cubes, pickups, enemies and terrain, as markers the test can read. */
function worldSet(kind: 'dungeon' | 'sky') {
  return {
    kind,
    root: new THREE.Group(),
    world: { name: kind, get: () => AIR, solid: () => false },
    chunks: { dispose() {} },
    elements: { name: kind },
    debris: { name: kind, max: 0, isAlive: () => false },
    pickups: { name: kind, add: vi.fn(), dispose() {} },
    enemies: { name: kind, add: vi.fn(), hurt: vi.fn(), clearHazards() {}, dispose() {} },
  };
}

/** A run in the sky, with the dungeon set aside: the game's fields as a passage leaves them. */
function skyRig() {
  const dungeon = worldSet('dungeon');
  const sky = worldSet('sky');
  const seen: [string, string][] = [];
  const actorList: unknown[] = [];
  const hud = {
    minimap: false,
    toast: vi.fn(),
    shake: () => {},
    setMinimap(on: boolean) { this.minimap = on; },
  };
  const player = { id: 0, float: false, invulnT: 0, starT: 0, spawnAt: vi.fn() };
  const skyRealm = { set: sky, install() {}, dispose: vi.fn(), leave: vi.fn() };
  const g: Rig = Object.assign(Object.create(Game.prototype), {
    realm: 'sky',
    stash: dungeon,
    sky: skyRealm,
    underground: null as number | null,
    floors: new Map<number, unknown>(),
    dungeonRoot: new THREE.Group(),
    skyRoot: new THREE.Group(),
    world: sky.world, chunks: sky.chunks, elements: sky.elements, debris: sky.debris, pickups: sky.pickups, enemies: sky.enemies,
    actors: { setRealm: vi.fn(), all: () => actorList },
    intents: { clear() {} },
    particles: { clear() {}, burst() {} },
    blasts: { clear() {} },
    missiles: new Missiles(),
    doors: { solidAt: () => false },
    bus: createBus(),
    player,
    hud,
    gate: { cancel: vi.fn() },
    zone: '',
    room: -1,
    groundBand: 0,
    stats: { get: () => 2 },
    // stand-ins for the dungeon's carve and activate: they write to the installed world's fields, as the real activate does
    carve(this: Rig, k: number) {
      seen.push(['carve', this.realm]);
      this.floors.set(k, { spawn: [10.5, 4, 10.5] });
    },
    activate(this: Rig, k: number) {
      seen.push(['activate', this.realm]);
      this.pickups.add('key', 1, 1, 1, 0);
      this.enemies.add('creature', k);
    },
  });
  return { g, dungeon, sky, seen, actorList, hud, player, skyRealm };
}

describe('the landing of a capture is carved only once the dungeon is installed (SKY.md §2.5a)', () => {
  it('the sky keeps its pickups and enemies, and the player lands on the captured floor', () => {
    const { g, dungeon, sky, seen, player } = skyRig();
    g.underground = 2;
    g.passRealm({ to: 'dungeon', at: [0, 0, 0], float: true });
    expect(seen).toEqual([['carve', 'dungeon'], ['activate', 'dungeon']]);
    expect(sky.pickups.add).not.toHaveBeenCalled();
    expect(sky.enemies.add).not.toHaveBeenCalled();
    expect(dungeon.pickups.add).toHaveBeenCalledTimes(1);
    expect(player.spawnAt).toHaveBeenLastCalledWith(10.5, 4, 10.5);
    expect(g.underground).toBeNull();
    expect(g.stash.world).toBe(sky.world);
    expect(g.realm).toBe('dungeon');
  });
});

describe('the minimap comes back when the run leaves the sky (SKY.md §2.4)', () => {
  it('after leaveSky the minimap is visible', () => {
    const { g, hud } = skyRig();
    hud.minimap = false;
    g.leaveSky();
    expect(g.realm).toBe('dungeon');
    expect(hud.minimap).toBe(true);
  });

  it('a run that never built the sky still shows the minimap after leaveSky', () => {
    const { g, hud } = skyRig();
    g.sky = null;
    hud.minimap = false;
    g.leaveSky();
    expect(hud.minimap).toBe(true);
  });
});

describe('the dungeon\'s damage and blasts pass a sky actor by (SKY.md §5.2)', () => {
  /** A sky deity in the sky's actors, with no Enemies spec: the sky's Enemies hurt throws without one. */
  function deity(hp = 100) {
    return { kind: 'sky', id: 9, def: 'deity', faction: 'sky', alive: true, spawning: 0, hp, body: { x: 2.5, y: 0, z: 2.5, hw: 0.5, h: 1.8 } };
  }
  function withDeity(rig: ReturnType<typeof skyRig>, d: ReturnType<typeof deity>) {
    rig.actorList.push(d);
    rig.g.enemies.hurt = (e: { spec?: unknown; hp: number }, amount: number) => {
      if (!e.spec) throw new TypeError('sky actor has no Enemies spec');
      e.hp -= amount;
    };
  }

  it('a bomb next to a sky deity neither throws nor hurts it', () => {
    const rig = skyRig();
    const d = deity();
    withDeity(rig, d);
    expect(() => rig.g.blast({ x: 2.5, y: 1, z: 2.5, radius: 3, damage: 40, actorDamage: 30, source: 'bomb', owner: 'world' })).not.toThrow();
    expect(d.hp).toBe(100);
  });

  it('damageActor refuses a sky actor outright', () => {
    const rig = skyRig();
    const d = deity();
    withDeity(rig, d);
    expect(rig.g.damageActor(d, 30, 'explosion', 'bomb', 'world')).toBe(false);
    expect(d.hp).toBe(100);
  });

  it('a missile does not meet a sky deity', () => {
    const rig = skyRig();
    withDeity(rig, deity());
    expect(rig.g.missileMeets(2.5, 1, 2.5)).toBe(false);
  });
});

describe('a passage clears the leaving world\'s missiles and hindrances (SKY.md §2.1)', () => {
  it('a missile in flight does not survive a passage out of the sky, and the sky\'s hindrances end', () => {
    const rig = skyRig();
    rig.g.missiles.launch(0.5, 1, 0.5, 1, 0, 0, 'negative');
    expect(rig.g.missiles.list).toHaveLength(1);
    rig.g.passRealm({ to: 'dungeon', at: [0, 0, 0], float: true });
    expect(rig.g.missiles.list).toHaveLength(0);
    expect(rig.skyRealm.leave).toHaveBeenCalledTimes(1);
  });
});
