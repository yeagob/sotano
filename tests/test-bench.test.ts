// The ?test bench (docs/testing/TEST-BENCH.md): off by default, god mode kept through the console's helpers on the
// real Game methods (collect, heal, refillSpirit), and the floor list jumping through the real Game.debugFloor.
// As in game-realm-passage.test.ts, Game's methods run on a stand-in object that holds only what they read.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../src/content/levels';
import { createBus } from '../src/game/events';
import { EN } from '../src/i18n/locales/en';
import { TestBench, bossesOf, dungeonGuide, skyGuide, testBenchOn, type BenchHelpers } from '../src/debug/test-bench';
import { SPIRIT_MAX } from '../src/sky/types';
import { BASE_STATS } from '../src/core/stats';
import { Player } from '../src/entities/player';
import type { Input } from '../src/input/input';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: () => {}, unlockAudio: () => {} };
});

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
});

/** A Game with only the fields the bench's paths read; its prototype's methods and getters are the real ones. */
function rig(realm: 'dungeon' | 'sky' = 'dungeon') {
  const g = Object.create(Game.prototype) as Record<string, any>;
  const floors = new Map(LEVELS.map(l => [l.floor, { floor: l.floor, spawn: [10.5, 100 - l.floor * 16, 10.5] }]));
  Object.assign(g, {
    realm, spirit: 40, sandbox: null, underground: null, maxDepth: 0, visited: new Set(),
    bus: createBus(),
    stats: { get: (k: string) => (k === 'maxHearts' ? 3 : 0) },
    player: { invulnT: 0, keys: 0, bombs: 1, hp: 4 },
    gate: { busy: false, start: vi.fn() },
    floors,
    carve: vi.fn(), activate: vi.fn(), teleport: vi.fn(),
    hud: { setFloor: vi.fn() },
    skyBounds: () => ({ crown: [1, 2, 3] }),
  });
  return g as Record<string, any> & import('../src/debug/test-bench').BenchGame;
}

/** main.ts's S helpers, written the same way over the stand-in. */
function helpers(g: Record<string, any>): BenchHelpers {
  return {
    god: (on = true) => { g.player.invulnT = on ? 1e9 : 0; },
    keys: (n = 1) => { g.collect('key', n); },
    bombs: (n = 1) => { g.collect('bomb', n); },
    heal: (n = 6) => { g.heal(n * 4, 'console'); },
  };
}

describe('the ?test flag', () => {
  it('is off by default and with the other flags', () => {
    expect(testBenchOn(new URLSearchParams(''))).toBe(false);
    expect(testBenchOn(new URLSearchParams('?sky&sandbox&seed=ABCD-EFGH'))).toBe(false);
    expect(testBenchOn(new URLSearchParams('?test'))).toBe(true);
    expect(testBenchOn(new URLSearchParams('?sky&test'))).toBe(true);
  });
});

describe('god mode', () => {
  it('turns on through the helpers: no damage, full counters, full health and spirit', () => {
    const g = rig('sky');
    const bench = new TestBench(g, helpers(g));
    expect(bench.god).toBe(false);
    bench.setGod(true);
    expect(bench.god).toBe(true);
    expect(g.player.invulnT).toBeGreaterThan(1e8);
    expect(g.player.keys).toBe(99);
    expect(g.player.bombs).toBe(99);
    expect(g.player.hp).toBe(g.maxHp);
    expect(g.spiritNow).toBe(SPIRIT_MAX);
  });

  it('keeps itself applied on each tick, and stops when turned off', () => {
    const g = rig();
    const bench = new TestBench(g, helpers(g));
    bench.setGod(true);
    // a new run clears invulnerability; a toll or a chest spends things
    g.player.invulnT = 0; g.player.keys = 3; g.player.hp = 1;
    bench.tick();
    expect(g.player.invulnT).toBeGreaterThan(1e8);
    expect(g.player.keys).toBe(99);
    expect(g.player.hp).toBe(g.maxHp);
    bench.setGod(false);
    expect(g.player.invulnT).toBe(0);
    g.player.keys = 3;
    bench.tick();
    expect(g.player.keys).toBe(3);
  });
});

describe('the floor list', () => {
  it('jumps to every underground floor through Game.debugFloor (carve, activate, teleport to its start)', () => {
    const g = rig();
    const bench = new TestBench(g, helpers(g));
    for (const l of LEVELS) {
      expect(bench.floor(l.floor)).toBe(true);
      expect(g.carve).toHaveBeenCalledWith(l.floor);
      expect(g.activate).toHaveBeenCalledWith(l.floor);
      const [x, y, z] = g.floors.get(l.floor).spawn;
      expect(g.teleport).toHaveBeenLastCalledWith(Math.floor(x), Math.floor(y), Math.floor(z));
    }
    expect(bench.floor(LEVELS.length)).toBe(false);
    expect(bench.floor(-1)).toBe(false);
  });

  it('goes down from the sky through the gate, as a spirit fall does, and waits while a passage runs', () => {
    const g = rig('sky');
    const bench = new TestBench(g, helpers(g));
    expect(bench.floor(4)).toBe(true);
    expect(g.underground).toBe(4);
    expect(g.gate.start).toHaveBeenCalledWith({ to: 'dungeon', at: [1, 2, 3], float: true });
    g.gate.busy = true;
    expect(bench.floor(2)).toBe(false);
  });

  it('refuses the sandbox', () => {
    const g = rig();
    g.sandbox = {};
    expect(new TestBench(g, helpers(g)).floor(1)).toBe(false);
  });
});

describe('the guide', () => {
  it('has one entry per floor and silence, and every key it names is in the catalog', () => {
    const below = dungeonGuide(), above = skyGuide();
    expect(below).toHaveLength(LEVELS.length + 1);
    expect(above.filter(e => e.n !== undefined).map(e => e.n)).toEqual([1, 2, 3, 4, 5]);
    for (const e of [...below, ...above]) {
      expect(EN.messages[e.title], e.title).toBeDefined();
      for (const r of e.rows) {
        if (r.label) expect(EN.messages[r.label], r.label).toBeDefined();
        if (typeof r.text === 'string') expect(EN.messages[r.text], r.text).toBeDefined();
        else if ('key' in r.text) expect(EN.messages[r.text.key], r.text.key).toBeDefined();
      }
    }
  });

  it('reads the toll and the bosses from the content', () => {
    const asks = (k: number) => dungeonGuide()[k].rows.find(r => r.label === 'test.guide.asks')!.text;
    expect(asks(0)).toEqual({ key: 'test.toll.things', params: { n: 1 } });
    expect(asks(5)).toEqual({ key: 'test.toll.practices', params: { n: 1 } });
    expect(asks(9)).toBe('test.toll.none');
    expect(bossesOf(0).ids).toEqual([]);
    expect(bossesOf(5)).toMatchObject({ ids: ['threshold-guardian'], fixed: true });
    expect(bossesOf(1).ids).toHaveLength(3);
  });
});

function skyPlans() {
  const place = (x: number, y: number, z: number) => ({ id: 0, kind: 'ground', x, y, z, w: 1, d: 1, tag: 0 });
  const floors = [1, 2, 3, 4, 5].map(k => ({ route: [place(k * 10 + 0.5, 40 + k + 0.2, 0.5), place(k * 10 + 0.5, 60, 0.5)] }));
  const platforms = Array.from({ length: 12 }, (_, i) => place(100 + i, 200 + i, 100));
  return { floors, totality: { platforms, checkpoints: [5, 11] } };
}

describe('the sky floors', () => {
  it('goes to each guardian floor and to Totality, at the foot of its route (Totality at its first checkpoint)', () => {
    const plans = skyPlans();
    const cell = (p: { x: number; y: number; z: number }) => [Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)];
    const g = rig('dungeon');
    g.skyRealm = () => ({ plans });
    const bench = new TestBench(g, helpers(g));
    for (let k = 1; k <= 5; k++) {
      expect(bench.skyFloor(k)).toBe(true);
      expect(g.gate.start).toHaveBeenLastCalledWith({ to: 'sky', at: cell(plans.floors[k - 1].route[0]), float: true });
    }
    expect(bench.skyFloor(6)).toBe(true);
    expect(g.gate.start).toHaveBeenLastCalledWith({ to: 'sky', at: cell(plans.totality.platforms[5]), float: true });
    expect(bench.skyFloor(0)).toBe(false);
    expect(bench.skyFloor(7)).toBe(false);
    g.gate.busy = true;
    expect(bench.skyFloor(1)).toBe(false);
  });

  it('places the player directly when already in the sky', () => {
    const plans = skyPlans();
    const g = rig('sky');
    g.skyRealm = () => ({ plans });
    const bench = new TestBench(g, helpers(g));
    expect(bench.skyFloor(3)).toBe(true);
    const at = plans.floors[2].route[0];
    expect(g.teleport).toHaveBeenLastCalledWith(Math.floor(at.x), Math.floor(at.y), Math.floor(at.z));
    expect(g.gate.start).not.toHaveBeenCalled();
  });
});

describe('the fly and walk-through-walls toggles', () => {
  it('switch the player flags on and off from the bench', () => {
    const g = rig();
    g.player.flying = false;
    g.player.ghost = false;
    const bench = new TestBench(g, helpers(g));
    expect(bench.fly).toBe(false);
    expect(bench.ghost).toBe(false);
    bench.setFly(true);
    expect(g.player.flying).toBe(true);
    expect(bench.fly).toBe(true);
    bench.setGhost(true);
    expect(bench.ghost).toBe(true);
    bench.setFly(false);
    bench.setGhost(false);
    expect(g.player.flying).toBe(false);
    expect(g.player.ghost).toBe(false);
  });
});

function headless(solid: (x: number, y: number, z: number) => boolean, x: number, y: number, z: number) {
  const p = new Player();
  p.spawnAt(x, y, z);
  p.body.onGround = true;
  const move = { x: 0, y: 0 };
  const input = { hit: () => false, held: () => false, move, lookDX: 0, lookDY: 0, sensitivity: 0 } as unknown as Input;
  const hooks = { jump: (v: number) => v, land: () => {}, bump: (v: number) => v };
  const run = (seconds: number, dt = 1 / 60) => { for (let t = 0; t < seconds; t += dt) p.update(dt, input, { ...BASE_STATS }, solid, hooks); };
  return { p, move, run };
}

describe('the flags in the body', () => {
  it('flying: no gravity, and the body moves where the view points', () => {
    const { p, move, run } = headless(() => false, 5.5, 10, 5.5);
    p.flying = true;
    run(1);
    expect(p.body.y).toBeCloseTo(10, 5);
    move.y = 1;
    run(0.5);
    expect(p.body.z).toBeLessThan(5.5);
    expect(p.body.y).toBeCloseTo(10, 5);
    p.pitch = 0.6;
    run(0.5);
    expect(p.body.y).toBeGreaterThan(10.5);
  });

  it('walk through walls: a wall stops the body unless ghost, and the floor still holds it', () => {
    const solid = (x: number, y: number) => y < 9 || (x === 7 && y >= 9);
    const blocked = headless(solid, 5.5, 9, 5.5);
    blocked.move.x = 1;
    blocked.run(2);
    expect(blocked.p.body.x).toBeLessThan(7);
    const ghost = headless(solid, 5.5, 9, 5.5);
    ghost.p.ghost = true;
    ghost.move.x = 1;
    ghost.run(2);
    expect(ghost.p.body.x).toBeGreaterThan(8);
    expect(ghost.p.body.y).toBeCloseTo(9, 1);
  });
});
