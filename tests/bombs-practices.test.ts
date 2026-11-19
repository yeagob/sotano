// The four bomb practices (docs/design/built/practices/BOMBS.md): Pressure Valve, Controlled Burn, Bolt from
// the Blue and Serendipity. They act only on blasts of the player's own bombs and missiles (both polarities),
// never on a volatile cube, an enemy's burst or another item's explosion. The item hooks run through the real
// Inventory against a host stub that records what they ask for; the emission of `bombBlast` runs through the
// real Game methods (blast, loveBlast) on a stand-in, as tests/love-bomb.test.ts does.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ITEMS } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { MAT, AIR, mat } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { StatSheet } from '../src/core/stats';
import { seedFx } from '../src/core/fx';
import { createBus } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';
import { TouchRouter } from '../src/combat/touch-router';

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

// ───────────────────────── item hooks through the real Inventory ─────────────────────────

interface Proj { id: number; x: number; y: number; z: number }
interface Calls {
  shield: unknown[][]; igniteArea: unknown[][]; pulse: unknown[][]; arc: { to: number; d: number; src: string; pol: string }[];
  spawn: unknown[][]; collect: unknown[][]; explode: unknown[][]; nearest: number[];
}

/** A host with the projections the test places; every call an item makes is recorded. */
function host(projections: Proj[] = []) {
  const bus = createBus();
  const stats = new StatSheet();
  const calls: Calls = { shield: [], igniteArea: [], pulse: [], arc: [], spawn: [], collect: [], explode: [], nearest: [] };
  const api: HostApi = {
    get bus() { return bus; },
    stats: () => stats.all,
    has: id => inv.has(id),
    hasTag: t => inv.hasTag(t),
    held: () => [],
    rng: () => new Rng(3),
    materialAt: () => 0,
    damageBlock: () => true,
    explode: (...a) => { calls.explode.push(a); },
    spawnDebris: () => {},
    message: () => {},
    defer: fn => bus.defer(fn),
    heal: () => {},
    damagePlayer: () => {},
    player: () => 1,
    isPlayer: id => id === 1,
    collect: (kind, n) => { calls.collect.push([kind, n]); return true; },
    counts: () => ({ keys: 0, bombs: 0, hp: 24, maxHp: 24 }),
    spawnPickup: (kind, x, y, z) => { calls.spawn.push([kind, x, y, z]); },
    pulse: (...a) => { calls.pulse.push(a); },
    arc: (_x, _y, _z, to, d, src, pol) => { calls.arc.push({ to, d, src, pol }); },
    nearestProjection: (x, y, z, r, except) => {
      calls.nearest.push(r);
      let best: Proj | null = null, bd = r;
      for (const p of projections) {
        if (except.includes(p.id)) continue;
        const d = Math.hypot(p.x - x, p.y - y, p.z - z);
        if (d < bd) { bd = d; best = p; }
      }
      return best ? { id: best.id, x: best.x, y: best.y, z: best.z } : null;
    },
    actorAt: () => null,
    shove: () => {},
    freeze: () => {},
    frighten: () => {},
    igniteArea: (...a) => { calls.igniteArea.push(a); },
    shieldFire: (...a) => { calls.shield.push(a); },
    launch: () => {},
    intentsHere: () => 0,
    tagCube: () => {},
    time: () => 0, memory: () => ({}), placeBlock: () => false, consumeCopy: () => {}, playerFeet: () => ({ x: 0, y: 0, z: 0 }),
    checkpoint: () => null, setCheckpoint: () => {}, teleportPlayer: () => {}, invulnerable: () => {}, burst: () => {}, chime: () => {},
  };
  const inv = new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  return { bus, stats, inv, calls };
}

/** A player bomb blast, as the game emits it (the `acted` set starts empty). */
const blast = (over: Partial<{ x: number; y: number; z: number; radius: number; polarity: 'negative' | 'positive'; source: string }> = {}) =>
  ({ x: 10.5, y: 2.5, z: 10.5, radius: 2.6, polarity: 'negative' as const, source: 'bomb', acted: new Set<string>(), ...over });

/** Emits a blast on the bus and runs the chain reactions it started, as a frame does. */
function explodeOnBus(bus: ReturnType<typeof createBus>, b: ReturnType<typeof blast>) {
  bus.emit('bombBlast', b);
  bus.flush();
}

describe('Pressure Valve: stats and two bombs on gain', () => {
  it('blast radius +0.8 and damage ×1.6, and two bombs once', () => {
    const h = host();
    h.inv.gain('pressurevalve');
    expect(h.stats.all.bombRadius).toBeCloseTo(2.6 + 0.8, 6);
    expect(h.stats.all.bombDamage).toBeCloseTo(40 * 1.6, 6);
    expect(h.calls.collect).toEqual([['bomb', 2]]);
    // a rebuild does not give the bombs again
    h.inv.gain('serendipity');
    expect(h.calls.collect).toEqual([['bomb', 2]]);
  });

  it('has no hooks: it changes stats only, and its blasts are plain blasts', () => {
    const h = host([{ id: 5, x: 11, y: 2, z: 10.5 }]);
    h.inv.gain('pressurevalve');
    explodeOnBus(h.bus, blast());
    expect(h.calls.pulse).toEqual([]);
    expect(h.calls.arc).toEqual([]);
    expect(h.calls.igniteArea).toEqual([]);
  });
});

describe('Controlled Burn: fire of your own blasts', () => {
  it('a negative blast shields fire, ignites the flammable blocks and burns projections for +4', () => {
    const h = host();
    h.inv.gain('controlledburn');
    const b = blast({ radius: 2.6 });
    explodeOnBus(h.bus, b);
    // shield: radius + 4 for 8 seconds, at the blast's centre
    expect(h.calls.shield).toEqual([[10.5, 2.5, 10.5, 2.6 + 4, 8]]);
    // the blocks are whole coordinates: the centre's block, floored
    expect(h.calls.igniteArea).toEqual([[10, 2, 10, 2.6]]);
    expect(h.calls.pulse).toEqual([[10.5, 2.5, 10.5, 2.6, 4, 0, expect.any(Number), 'controlledburn']]);
  });

  it('a love blast (positive) sets nothing alight and shields nothing', () => {
    const h = host();
    h.inv.gain('controlledburn');
    explodeOnBus(h.bus, blast({ polarity: 'positive' }));
    expect(h.calls.shield).toEqual([]);
    expect(h.calls.igniteArea).toEqual([]);
    expect(h.calls.pulse).toEqual([]);
  });

  it('the fire work runs at the end of the frame, not inside the blast', () => {
    const h = host();
    h.inv.gain('controlledburn');
    h.bus.emit('bombBlast', blast());
    expect(h.calls.igniteArea).toEqual([]);
    h.bus.flush();
    expect(h.calls.igniteArea).toHaveLength(1);
  });
});

describe('Bolt from the Blue: lightning to up to three projections', () => {
  const near: Proj[] = [
    { id: 1, x: 13.5, y: 2, z: 10.5 },   // 3.0 from the blast
    { id: 2, x: 10.5, y: 2, z: 15.5 },   // 5.0
    { id: 3, x: 7.5, y: 2, z: 10.5 },    // 3.0
    { id: 4, x: 10.5, y: 2, z: 19.5 },   // 9.0, the fourth: not reached
    { id: 5, x: 30.5, y: 2, z: 10.5 },   // far away: never
  ];

  it('arcs to the three nearest within radius + 3, nearest first, 6 each', () => {
    const h = host(near);
    h.inv.gain('boltfromtheblue');
    explodeOnBus(h.bus, blast());
    expect(h.calls.arc.map(a => a.to)).toEqual([1, 3, 2]);
    expect(h.calls.arc.every(a => a.d === 6 && a.src === 'boltfromtheblue')).toBe(true);
    // the search is bounded by the blast's radius + 3
    expect(h.calls.nearest.every(r => r === 2.6 + 3)).toBe(true);
  });

  it('a projection beyond radius + 3 is never arced to', () => {
    const h = host([{ id: 9, x: 10.5, y: 2, z: 10.5 + 2.6 + 3.5 }]);
    h.inv.gain('boltfromtheblue');
    explodeOnBus(h.bus, blast());
    expect(h.calls.arc).toEqual([]);
  });

  it('the arc takes the polarity of the blast: a love explosion arcs positive', () => {
    const h = host(near);
    h.inv.gain('boltfromtheblue');
    explodeOnBus(h.bus, blast({ polarity: 'positive' }));
    expect(h.calls.arc.length).toBe(3);
    expect(h.calls.arc.every(a => a.pol === 'positive')).toBe(true);
  });
});

describe('Serendipity: a find after your bomb blasts', () => {
  it('luck +1 with one copy, +1 more per copy', () => {
    const one = host();
    one.inv.gain('serendipity');
    expect(one.stats.all.luck).toBe(1);
    const two = host();
    two.inv.gain('serendipity');
    two.inv.gain('serendipity');
    expect(two.stats.all.luck).toBe(2);
  });

  it('the chance is 25% + 5% per luck, capped at 60%', () => {
    // a long seeded run: the share of blasts that leave something is close to the chance
    const share = (copies: number) => {
      const h = host();
      for (let i = 0; i < copies; i++) h.inv.gain('serendipity');
      const N = 4000;
      for (let i = 0; i < N; i++) explodeOnBus(h.bus, blast());
      return h.calls.spawn.length / N;
    };
    expect(share(1)).toBeCloseTo(0.30, 1);   // luck 1
    expect(share(2)).toBeCloseTo(0.35, 1);   // luck 2
    expect(share(8)).toBeCloseTo(0.60, 1);   // luck 8: 25 + 40 = 65, capped at 60
  });

  it('a find is a key, a bomb or a heart, at the blast centre', () => {
    const h = host();
    h.inv.gain('serendipity');
    for (let i = 0; i < 300; i++) explodeOnBus(h.bus, blast());
    expect(h.calls.spawn.length).toBeGreaterThan(0);
    const kinds = new Set(h.calls.spawn.map(s => s[0]));
    expect([...kinds].every(k => k === 'key' || k === 'bomb' || k === 'heart')).toBe(true);
    expect(kinds.size).toBe(3);
    expect(h.calls.spawn.every(s => s[1] === 10.5 && s[2] === 2.5 && s[3] === 10.5)).toBe(true);
  });

  it('two copies roll once per blast, not twice', () => {
    const one = host();
    one.inv.gain('serendipity');
    const two = host();
    two.inv.gain('serendipity');
    two.inv.gain('serendipity');
    // one copy at luck 1 (30%) and two copies at luck 2 (35%): the second copy never rolls again
    for (let i = 0; i < 2000; i++) { explodeOnBus(one.bus, blast()); explodeOnBus(two.bus, blast()); }
    expect(two.calls.spawn.length / 2000).toBeCloseTo(0.35, 1);
  });
});

describe('the four practices only act on the player\'s own bombs and missiles', () => {
  it('a volatile cube or an enemy burst is not a bomb blast: no effect from any of the four', () => {
    const h = host([{ id: 1, x: 11, y: 2, z: 10.5 }]);
    for (const id of ['pressurevalve', 'controlledburn', 'boltfromtheblue', 'serendipity']) h.inv.gain(id);
    // the explosion event (not bombBlast) is what volatile cubes and enemy bursts emit
    h.bus.emit('explosion', { x: 10.5, y: 2.5, z: 10.5, radius: 2, damage: 10, actorDamage: 8, source: 'volatile', owner: 1, cause: { origin: 'volatile', gen: 0 } });
    h.bus.flush();
    expect(h.calls.shield).toEqual([]);
    expect(h.calls.igniteArea).toEqual([]);
    expect(h.calls.pulse).toEqual([]);
    expect(h.calls.arc).toEqual([]);
    expect(h.calls.spawn).toEqual([]);
  });

  it('with all four held, a blast settles: a finite, bounded set of effects, no loop', () => {
    const h = host([{ id: 1, x: 11, y: 2, z: 10.5 }, { id: 2, x: 12, y: 2, z: 10.5 }]);
    for (const id of ['pressurevalve', 'controlledburn', 'boltfromtheblue', 'serendipity', 'serendipity']) h.inv.gain(id);
    // emitting the same blast again must not multiply effects beyond one per practice
    explodeOnBus(h.bus, blast());
    expect(h.calls.shield.length).toBe(1);
    expect(h.calls.igniteArea.length).toBe(1);
    expect(h.calls.pulse.length).toBe(1);
    expect(h.calls.arc.length).toBeLessThanOrEqual(3);
    expect(h.calls.spawn.length).toBeLessThanOrEqual(1);
  });
});

// ───────────────────────── the game emits bombBlast for player blasts only ─────────────────────────

/** The game methods on a stand-in with the parts `blast` and `loveBlast` read. */
function gameRig() {
  seedFx(7);
  const bus = createBus();
  const emitted: unknown[] = [];
  bus.on('bombBlast', { fn: (e: unknown) => { emitted.push(e); }, priority: 300, source: 'test' } as never);
  const g: Record<string, any> = Object.assign(Object.create(Game.prototype), {
    bus,
    player: { id: 1, body: { x: 5.5, y: 1, z: 5.5 } },
    realm: 'sky',
    debris: { max: 0, isAlive: () => false, push() {}, isBomb: () => false },
    router: Object.assign(new TouchRouter(), { blast() {} }),
    actors: { all: () => [] },
    particles: { burst() {} },
    hud: { shake() {} },
    stats: { get: (k: string) => (k === 'bombRadius' ? 2.6 : k === 'bombDamage' ? 40 : 0) },
    world: { get: () => AIR, elemAt: () => 0, idx: () => 0, damaged: new Map() },
    damageBlock: () => true,
    hearPresences: () => {},
    fireShields: [] as { x: number; y: number; z: number; r: number; until: number }[],
    time: 0,
    ignite: () => false,
    breakFx: 0, breakSfx: 0, elemFx: 0, elemSfx: 0,
  });
  return { g, emitted };
}

describe('bombBlast is emitted by the game for the player\'s own blasts', () => {
  it('a player bomb blast (source bomb, owner player) emits a negative bombBlast', () => {
    const { g, emitted } = gameRig();
    g.blast({ x: 5.5, y: 1.5, z: 5.5, radius: 2.6, damage: 40, actorDamage: 8, source: 'bomb', owner: 1, cause: { origin: 'bomb', gen: 0 } });
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({ polarity: 'negative', source: 'bomb', radius: 2.6 });
  });

  it('a missile blast emits too, with its own source', () => {
    const { g, emitted } = gameRig();
    g.blast({ x: 5.5, y: 1.5, z: 5.5, radius: 2.6, damage: 40, actorDamage: 8, source: 'missile', owner: 1, cause: { origin: 'missile', gen: 0 } });
    expect(emitted).toMatchObject([{ source: 'missile', polarity: 'negative' }]);
  });

  it('a volatile cube, an enemy burst and an item blast emit nothing', () => {
    const { g, emitted } = gameRig();
    g.blast({ x: 5.5, y: 1.5, z: 5.5, radius: 2, damage: 10, actorDamage: 8, source: 'volatile', owner: 1, cause: { origin: 'volatile', gen: 0 } });
    g.blast({ x: 5.5, y: 1.5, z: 5.5, radius: 2, damage: 10, actorDamage: 8, source: 'enemy:burnout', owner: 7, cause: { origin: 'enemy', gen: 0 } });
    g.blast({ x: 5.5, y: 1.5, z: 5.5, radius: 2, damage: 10, actorDamage: 8, source: 'bomb', owner: 7, cause: { origin: 'x', gen: 0 } });
    expect(emitted).toEqual([]);
  });

  it('a love explosion (positive) emits a positive bombBlast from either source', () => {
    const { g, emitted } = gameRig();
    g.loveBlast(5.5, 1.5, 5.5, 'bomb');
    g.loveBlast(5.5, 1.5, 5.5, 'missile');
    expect(emitted).toMatchObject([{ polarity: 'positive', source: 'bomb' }, { polarity: 'positive', source: 'missile' }]);
  });
});

describe('fire shields (Controlled Burn): the player is not hurt by a blast\'s fire near it', () => {
  it('a shield covers its radius for its seconds and then ends', () => {
    const { g } = gameRig();
    g.shieldFire(10, 2, 10, 6, 8);
    expect(g.fireShielded(10, 2, 13)).toBe(true);          // 3 away, inside
    expect(g.fireShielded(10, 2, 17)).toBe(false);         // 7 away, outside
    g.time = 7.9;
    expect(g.fireShielded(10, 2, 13)).toBe(true);
    g.time = 8.1;
    expect(g.fireShielded(10, 2, 13)).toBe(false);
  });

  it('only the last eight shields are kept, and non-finite values are refused', () => {
    const { g } = gameRig();
    for (let i = 0; i < 12; i++) g.shieldFire(i, 0, 0, 1, 8);
    expect(g.fireShields).toHaveLength(8);
    g.shieldFire(NaN, 0, 0, 1, 8);
    expect(g.fireShields).toHaveLength(8);
  });

  it('igniteArea takes a fractional radius: blocks within it catch, blocks beyond it do not', () => {
    const flammable = Object.values(MAT).find(id => mat(id).flammable)!;
    const { g } = gameRig();
    const lit: number[][] = [];
    g.world = { get: () => flammable, elemAt: () => 0, idx: () => 0, damaged: new Map() };
    g.ignite = (x: number, y: number, z: number) => { lit.push([x, y, z]); return true; };
    g.igniteArea(0, 0, 0, 2.6);
    expect(lit.some(([x, y, z]) => x === 2 && y === 0 && z === 0)).toBe(true);     // 2 away
    expect(lit.some(([x, y, z]) => x === 3 && y === 0 && z === 0)).toBe(false);    // 3 away: beyond 2.6
    expect(lit.every(([x, y, z]) => x * x + y * y + z * z <= 2.6 * 2.6 + 1e-9)).toBe(true);
  });
});
