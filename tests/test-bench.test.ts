// The ?test bench (docs/testing/TEST-BENCH.md): off by default, god mode kept through the console's helpers on the
// real Game methods (collect, heal, refillSpirit), and the floor list jumping through the real Game.debugFloor.
// As in game-realm-passage.test.ts, Game's methods run on a stand-in object that holds only what they read.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { LEVELS } from '../src/content/levels';
import { createBus } from '../src/game/events';
import { EN } from '../src/i18n/locales/en';
import { TestBench, bossesOf, dungeonGuide, skyGuide, testBenchOn, type BenchHelpers } from '../src/debug/test-bench';
import { SPIRIT_MAX } from '../src/sky/types';

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
