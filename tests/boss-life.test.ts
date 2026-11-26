// Boss life (issue #315): bossHp(floor) × 1.3 × a factor from 0.7 to 1.5, drawn from a fork of the run's root
// keyed by the boss, so the same seed gives the same life and no other stream moves.
//
// The spawn and the bar are driven through the real Game methods on a stand-in rig (as tests/boss-bar.test.ts does).

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BOSSES, BOSS_BY_ID, BOSS_ZONES, bossHp, bossLife, bossLifeFactor, bossLifeRange, bossSpawnLife } from '../src/content/bosses';
import { RunRandom } from '../src/core/rng';
import { tierStats } from '../src/enemies/tiers';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: silent, unlockAudio: () => {} };
});

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
}, 60_000);

const SEEDS = Array.from({ length: 300 }, (_, i) => 0x1000 + i * 7919);
const zone = (floor: number) => BOSS_ZONES.find(z => floor >= z.floors[0] && floor <= z.floors[1])!;

describe('boss life: the curve and the factor', () => {
  it('a floor 9 boss has more life than any floor 1 boss, on every seed', () => {
    for (const seed of SEEDS) {
      const rr = new RunRandom(seed);
      const floor9 = Math.min(...BOSSES.map(b => bossLife(9, rr, b.id)));
      const floor1 = Math.max(...BOSSES.map(b => bossLife(1, rr, b.id)));
      expect(floor9, `seed ${seed}`).toBeGreaterThan(floor1);
    }
  });

  it('two bosses of one floor can have different life', () => {
    let differing = 0;
    for (const seed of SEEDS) {
      const rr = new RunRandom(seed);
      const lives = new Set(zone(2).pool.map(id => bossLife(2, rr, id)));
      if (lives.size > 1) differing++;
    }
    expect(differing).toBeGreaterThan(SEEDS.length * 0.95);
  });

  it('the same seed gives the same life, every time, whatever was drawn before', () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const plain = new RunRandom(seed);
      const busy = new RunRandom(seed);
      busy.stream('drops').next(); busy.fork('floor', 1, 'boss').u32(); busy.fork('boss', 'life', 'hoard').next();
      for (const b of BOSSES) {
        expect(bossLife(5, busy, b.id), `${b.id} seed ${seed}`).toBe(bossLife(5, plain, b.id));
        expect(bossLife(5, plain, b.id)).toBe(bossLife(5, new RunRandom(seed), b.id));
      }
    }
  });

  it('a different seed gives a different life for the same boss', () => {
    const lives = new Set(SEEDS.map(seed => bossLife(4, new RunRandom(seed), 'hoard')));
    expect(lives.size).toBeGreaterThan(SEEDS.length / 2);
  });

  it('the factor is between 0.7 and 1.5, and a range of seeds reaches both ends', () => {
    let lo = Infinity, hi = -Infinity;
    for (const seed of Array.from({ length: 2000 }, (_, i) => i + 1)) {
      for (const b of BOSSES) {
        const f = bossLifeFactor(new RunRandom(seed), b.id);
        expect(f).toBeGreaterThanOrEqual(0.7);
        expect(f).toBeLessThan(1.5);
        lo = Math.min(lo, f); hi = Math.max(hi, f);
      }
    }
    expect(lo).toBeLessThan(0.72);
    expect(hi).toBeGreaterThan(1.48);
  });

  it('the life stays between 0.7 and 1.5 times the base curve times 1.3, on every floor and seed', () => {
    for (let floor = 1; floor <= 9; floor++) {
      const base = bossHp(floor) * 1.3;
      const [min, max] = bossLifeRange(floor);
      expect(min).toBe(Math.round(base * 0.7));
      expect(max).toBe(Math.round(base * 1.5));
      for (const seed of SEEDS) {
        const rr = new RunRandom(seed);
        for (const b of BOSSES) {
          const life = bossLife(floor, rr, b.id);
          expect(life, `${b.id} floor ${floor} seed ${seed}`).toBeGreaterThanOrEqual(min);
          expect(life).toBeLessThanOrEqual(max);
          expect(Math.abs(life - base * bossLifeFactor(rr, b.id)), `${b.id} floor ${floor}`).toBeLessThanOrEqual(0.5);
        }
      }
    }
  });

  it('the life fork moves no other stream', () => {
    const a = new RunRandom(77), b = new RunRandom(77);
    for (const id of ['hoard', 'verdict', 'shadow']) bossLife(5, b, id);
    expect(b.stream('drops').u32()).toBe(a.stream('drops').u32());
    expect(b.stream('ai').u32()).toBe(a.stream('ai').u32());
    expect(b.fork('floor', 3, 'boss').u32()).toBe(a.fork('floor', 3, 'boss').u32());
    expect(b.fork('plan', 1).u32()).toBe(a.fork('plan', 1).u32());
  });

  it('no boss definition keeps a birth health: its life is set at its spawn', () => {
    for (const b of BOSSES) expect(b.hp, b.id).toBeUndefined();
  });
});

describe('boss life in the game', () => {
  /** The boss's life of its floor and seed (the Shadow's: your health, #339), times its colour tier when it rose in
   *  one (#338: health only). */
  const expected = (g: any, e: any, floor: number, seed: number, id: string) => {
    const life = bossSpawnLife(BOSS_BY_ID.get(id)!, floor, new RunRandom(seed), HEALTH), tier = g.projectionTier.get(e.id);
    return tier ? tierStats(BOSS_BY_ID.get(id)!, tier, life).hp : life;
  };
  const HEALTH = 48;
  const rig = (seed: number, floor: number): any => {
    const g: any = Object.create(Game.prototype);
    g.player = { hp: HEALTH, layers: [] };
    g.keeper = { recordFirst: () => false }; // the bestiary's first-time record (#360): nothing new to show
    g.rng = new RunRandom(seed);
    g.actors = { newId: () => 1, add: () => {} };
    g.bus = { emit: (_kind: string, payload: object) => ({ cancelled: false, ...payload }) };
    g.projectionSeq = new Map();
    g.projectionTier = new Map();
    g.enemies = { list: [] as any[], spawn: (def: any, id: number, room: number, _x: number, _y: number, _z: number, hp: number) => {
      const e = { id, def: def.id, spec: def, room, hp, maxHp: hp, alive: true };
      g.enemies.list.push(e);
      return e;
    } };
    g.floor = floor;
    return g;
  };

  it('spawning a boss gives it the life of its floor, its seed and its boss', () => {
    for (const seed of SEEDS.slice(0, 30)) {
      for (const [floor, id] of [[1, 'resistance'], [4, 'downpour'], [9, 'shadow']] as const) {
        const g = rig(seed, floor);
        const e = (Game.prototype as any).spawnEnemy.call(g, id, { id: 3, floor, type: 'boss' }, 0, 1, 1, 1);
        expect(e.maxHp, `${id} floor ${floor} seed ${seed}`).toBe(expected(g, e, floor, seed, id));
        expect(e.hp).toBe(e.maxHp);
      }
    }
  });

  it('the health bar reads the boss\'s own maximum', () => {
    const g = rig(12345, 2);
    const boss = (Game.prototype as any).spawnEnemy.call(g, 'resistance', { id: 4, floor: 2, type: 'boss' }, 0, 1, 1, 1);
    boss.spec = BOSS_BY_ID.get('resistance');
    boss.hp = boss.maxHp / 2;
    const bar: any = { bar: null as unknown, bossBar(b: unknown) { this.bar = b; } };
    Object.assign(g, {
      hud: bar,
      room: 4,
      player: { dead: false },
      bossRooms: new Map([[4, { spawned: true, room: 4 }]]),
    });
    (Game.prototype as any).syncBossBar.call(g);
    expect(bar.bar.ratio).toBeCloseTo(0.5);
    expect(boss.maxHp).toBe(expected(g, boss, 2, 12345, 'resistance'));
  });
});
