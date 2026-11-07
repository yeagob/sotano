// The game's realm passages, run on real Game methods (SKY.md §2.1, §2.4, §2.5a): the landing of a capture is
// carved and activated only once the dungeon is installed, the minimap comes back when the run leaves the sky,
// the dungeon's damage and blasts pass a sky actor by, a passage clears the leaving world's missiles, and the
// touch router reaches the sky's creatures (SKY.md §5.7) and places blocks with `placing` set (law 3.2).
// As in alembic.test.ts, Game's methods run on a stand-in object that holds only what they read.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Missiles } from '../src/combat/missiles';
import { TouchRouter } from '../src/combat/touch-router';
import { AIR, MAT } from '../src/content/materials';
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
    world: { name: kind, get: () => AIR, solid: () => false, elemAt: () => 0, setElem() {} },
    chunks: { dispose() {} },
    elements: { name: kind, wakeAround() {} },
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
  const skyRealm: Record<string, any> = { set: sky, install() {}, dispose: vi.fn(), leave: vi.fn() };
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
    router: new TouchRouter(),
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

  it('a routed sky deity is met by a missile, and a bomb next to it gives it one puff and no harm', () => {
    const rig = skyRig();
    const d = deity();
    withDeity(rig, d);
    const c = creatures([BOX9]);
    rig.g.router.add(c);
    expect(rig.g.missileMeets(2.5, 1, 2.5)).toBe(true);
    expect(rig.g.missileMeets(9.5, 1, 9.5)).toBe(false);
    rig.g.blast({ x: 2.5, y: 1, z: 2.5, radius: 3, damage: 40, actorDamage: 30, source: 'bomb', owner: 'world' });
    expect(c.touches).toHaveLength(1);
    expect(c.touches[0].slice(0, 3)).toEqual([9, 'negative', true]);
    expect(d.hp).toBe(100);
  });

  it('a parked sky deity is not met by a missile', () => {
    const rig = skyRig();
    withDeity(rig, deity());
    rig.g.router.add(creatures([BOX9], [9]));
    expect(rig.g.missileMeets(2.5, 1, 2.5)).toBe(false);
  });
});

/** A sky deity's box, as the sky's creatures report it (SkyCreatures.targets). */
const BOX9 = { id: 9, x: 2.5, y: 0, z: 2.5, hw: 0.5, h: 1.8 };

/**
 * A fake creature provider (the shape of SkyCreatures for the router): it holds the boxes, owns every
 * id it holds, and routes only the ones not parked. `touches` records each touch it receives.
 */
function creatures(boxes: { id: number; x: number; y: number; z: number; hw: number; h: number }[], parked: number[] = []) {
  const touches: unknown[][] = [];
  const live = () => boxes.filter(b => !parked.includes(b.id));
  return {
    touches,
    owns: (id: number) => boxes.some(b => b.id === id),
    at: (x: number, y: number, z: number, r: number) => {
      for (const b of live()) {
        if (Math.abs(x - b.x) < b.hw + r && Math.abs(z - b.z) < b.hw + r && y > b.y - r && y < b.y + b.h + r) return b.id;
      }
      return -1;
    },
    targets: () => live(),
    touch: (...args: unknown[]) => { touches.push(args); },
  };
}

describe('the touch router reaches sky creatures (SKY.md §5.7)', () => {
  it('the realm hooks route the sky creatures while the sky is installed, and drop them when it is not', () => {
    const rig = skyRig();
    rig.skyRealm.creatures = creatures([BOX9]);
    const host = rig.g.realmHost();
    expect(rig.g.router.owns(9)).toBe(false);
    host.hooks('sky');
    expect(rig.g.router.owns(9)).toBe(true);
    host.hooks('dungeon');
    expect(rig.g.router.owns(9)).toBe(false);
  });

  it('an intention on a routed sky creature goes to the router and is never looked up as an enemy', () => {
    const rig = skyRig();
    const c = creatures([BOX9]);
    rig.g.router.add(c);
    const get = vi.fn();
    rig.g.enemies.get = get;
    rig.g.intentTouch(9, 10, 1, 0, 'intent', 'intent', 'negative', true);
    expect(get).not.toHaveBeenCalled();
    expect(c.touches).toEqual([[9, 'negative', true, { x: 2.5, y: 0.9, z: 2.5 }, 'intent']]);
  });

  it('a parked sky creature is not routed, and is looked up as an enemy (which finds none)', () => {
    const rig = skyRig();
    const c = creatures([BOX9], [9]);
    rig.g.router.add(c);
    const get = vi.fn();
    rig.g.enemies.get = get;
    rig.g.intentTouch(9, 10, 1, 0, 'intent', 'intent', 'positive', true);
    expect(get).toHaveBeenCalledWith(9);
    expect(c.touches).toHaveLength(0);
  });

  it('a love explosion gives one warm touch per deity in range, and none out of range', () => {
    const rig = skyRig();
    const c = creatures([BOX9, { id: 10, x: 9.5, y: 0, z: 9.5, hw: 0.5, h: 1.8 }]);
    rig.g.router.add(c);
    rig.g.hearPresences = vi.fn();
    rig.g.loveBlast(2.5, 1, 2.5);
    expect(c.touches).toHaveLength(1);
    expect(c.touches[0].slice(0, 5)).toEqual([9, 'positive', true, { x: 2.5, y: 1, z: 2.5 }, 'item']);
  });

  it('a love explosion gives a deity one touch, however large its box', () => {
    const rig = skyRig();
    const c = creatures([{ id: 9, x: 2.5, y: 0, z: 2.5, hw: 1.5, h: 3 }]);
    rig.g.router.add(c);
    rig.g.hearPresences = vi.fn();
    rig.g.loveBlast(2.5, 1, 2.5);
    expect(c.touches).toHaveLength(1);
  });

  it('a placement sets the sky world\'s placing only around the placement (law 3.2, SKY.md §3.4)', () => {
    const rig = skyRig();
    const w = rig.sky.world as Record<string, any>;
    const during: boolean[] = [];
    w.inside = () => true;
    w.placing = false;
    w.set = vi.fn(() => { during.push(w.placing); });
    placeFirstBlock(rig);
    expect(w.set).toHaveBeenCalledWith(5, 0, 4, MAT.stone);
    expect(during).toEqual([true]);
    expect(w.placing).toBe(false);
  });

  it('a placement that throws still clears placing', () => {
    const rig = skyRig();
    const w = rig.sky.world as Record<string, any>;
    w.inside = () => true;
    w.placing = false;
    w.set = () => { throw new Error('set failed'); };
    expect(() => placeFirstBlock(rig)).toThrow('set failed');
    expect(w.placing).toBe(false);
  });

  it('a dungeon placement never sets placing on the dungeon world', () => {
    const rig = skyRig();
    const w = rig.g.world as Record<string, any>;
    rig.g.realm = 'dungeon';
    w.inside = () => true;
    w.set = vi.fn();
    placeFirstBlock(rig);
    expect(w.set).toHaveBeenCalledTimes(1);
    expect('placing' in w).toBe(false);
  });

  it('a shot on a routed sky creature is not announced on the bus as an actor hit, and an enemy still is', () => {
    const rig = skyRig();
    rig.g.router.add(creatures([BOX9]));
    const seen = vi.fn();
    rig.g.bus.on('intentHit', { priority: 0, source: 'test', fn: seen });
    const v = new THREE.Vector3(1, 0, 0), n = new THREE.Vector3();
    rig.g.intentHit('actor', 9, new THREE.Vector3(), n, v, {});
    expect(seen).not.toHaveBeenCalled();
    rig.g.intentHit('actor', 3, new THREE.Vector3(), n, v, {});
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen.mock.calls[0][0]).toMatchObject({ kind: 'actor', target: 3 });
  });

  describe('law 3.2 reaches the weapons: a positive stroke takes a placed sky block', () => {
    /** A sky with one placed block at (20,1,20); the fake sky's ownership rule takes a placed cell once. */
    function strokeRig(polarity: 'positive' | 'negative' = 'positive') {
      const rig = skyRig();
      const placed = new Set<number>();
      const w = rig.sky.world as Record<string, any>;
      w.idx = (x: number, y: number, z: number) => x + 100 * y + 10000 * z;
      w.get = (x: number, y: number, z: number) => (placed.has(w.idx(x, y, z)) ? MAT.stone : AIR);
      w.damaged = new Map<number, number>();
      w.set = vi.fn();
      const cell = w.idx(20, 1, 20);
      placed.add(cell);
      rig.skyRealm.positiveHitsBlock = vi.fn((hit: { cell: number }) => {
        if (!placed.has(hit.cell)) return false;
        placed.delete(hit.cell);
        return true;
      });
      rig.g.stroke = { polarity, warmed: new Set(), intent: null, weapon: 'blade' };
      return { rig, host: rig.g.makeWeaponHost(), placed, cell, w };
    }

    it('a positive stroke that reaches the placed block removes it, through breakable and cut', () => {
      const { rig, host, placed } = strokeRig();
      expect(host.breakable(20, 1, 20)).toBe(true);
      expect(placed.size).toBe(0);
      expect(rig.skyRealm.positiveHitsBlock).toHaveBeenCalledWith({ x: 20, y: 1, z: 20, cell: 200120, actor: -1, weapon: 'blade', warm: true });
      host.cut(20, 1, 20, 'greatcut');
      expect(rig.g.world.get(20, 1, 20)).toBe(AIR);
      expect(rig.skyRealm.positiveHitsBlock).toHaveBeenCalledTimes(2);
    });

    it('a beam burn on a placed block returns true, as a broken block does, and removes it', () => {
      const { rig, host, placed } = strokeRig();
      rig.g.stroke.weapon = 'beam';
      expect(host.burn(20, 1, 20, 3, 'beam')).toBe(true);
      expect(placed.size).toBe(0);
    });

    it('a placed block the sky does not take is breakable on a positive stroke only when damaged, as before', () => {
      const { rig, host, w, cell } = strokeRig();
      rig.skyRealm.positiveHitsBlock = vi.fn(() => false);
      expect(host.breakable(20, 1, 20)).toBe(false);
      w.damaged.set(cell, 1);
      expect(host.breakable(20, 1, 20)).toBe(true);
    });

    it('a negative stroke takes no part in law 3.2', () => {
      const { rig, host } = strokeRig('negative');
      expect(host.breakable(20, 1, 20)).toBe(true);
      expect(rig.skyRealm.positiveHitsBlock).not.toHaveBeenCalled();
    });

    it('the dungeon takes no part in law 3.2', () => {
      const { rig, host } = strokeRig();
      rig.g.realm = 'dungeon';
      expect(host.breakable(20, 1, 20)).toBe(false);
      expect(rig.skyRealm.positiveHitsBlock).not.toHaveBeenCalled();
    });
  });
});

/** One placement straight ahead: the camera at x 5.5 looks along +z at a solid cell (5,0,5), so the face is (5,0,4). */
function placeFirstBlock(rig: ReturnType<typeof skyRig>) {
  const g = rig.g;
  g.player.hand = [MAT.stone];
  g.player.top = MAT.stone;
  g.player.body = { x: 20, y: 20, z: 20, hw: 0.3, h: 1.8 };
  g.player.forward = new THREE.Vector3(0, 0, 1);
  g.input = { hit: () => true, hitBy: () => 'mouse', touchTap: null };
  g.camera = { position: new THREE.Vector3(5.5, 0.5, 0.5) };
  g.solid = (x: number, y: number, z: number) => x === 5 && y === 0 && z === 5;
  g.stats = { get: (k: string) => (k === 'reach' ? 10 : 2) };
  g.debris = { clearCell: vi.fn() };
  g.nudge = vi.fn();
  g.hands = { placed: vi.fn() };
  g.doors = { inDoorway: () => false };
  g.tryPlace();
}

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
