import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HEART } from '../src/entities/actors';
import { BLOOD_BUDGET, BLOOD_RATE, BLOOD_SECONDS, BLOOD_SLOT_SOURCE, HEALTH_UNIT, berserk, hasHeartRoom, heartCount, isLayer, landHit, stoneHalve, tickBlood, type BloodRegen, type HeartLayer } from '../src/entities/hearts';
import { floorHeartChances, HEART_CHANCE, RARE_HEARTS, rollHeart } from '../src/content/tables/hearts';
import { Rng, RunRandom } from '../src/core/rng';
import { StatSheet } from '../src/core/stats';
import { createBus } from '../src/game/events';
import type { Game } from '../src/game/game';

// game.ts loads without audio; the sound module is silenced so the real collectHeart can run in node.
vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, sfxHeart: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: () => {}, unlockAudio: () => {}, setEcho: () => {}, starTheme: () => {} };
});

const u = (n: number) => n * HEALTH_UNIT;

describe('stone heart', () => {
  it('halves every hit, rounded down, with no threshold', () => {
    expect(stoneHalve(u(30))).toBeCloseTo(u(15));
    expect(stoneHalve(u(60))).toBeCloseTo(u(30));
    expect(stoneHalve(u(100))).toBeCloseTo(u(50));
    expect(stoneHalve(u(25))).toBeCloseTo(u(12));
    expect(stoneHalve(u(1))).toBe(0);
  });

  it('halves only while it is the heart taking the hit, and is lost for good when spent', () => {
    const layers: HeartLayer[] = [{ kind: 'blue', hp: HEART }, { kind: 'stone', hp: HEART }];
    let r = landHit(layers, u(60));
    expect(r.halved).toBe(true);
    expect(layers[1].hp).toBeCloseTo(u(70));
    r = landHit(layers, u(200));
    expect(r.lost).toEqual(['stone']);
    expect(layers.map(l => l.kind)).toEqual(['blue']);
    expect(layers[0].hp).toBeCloseTo(u(70));
    r = landHit(layers, u(60));
    expect(r.halved).toBe(false);
    expect(layers[0].hp).toBeCloseTo(u(10));
  });
});

describe('layers', () => {
  it('spend the most recently picked up heart first, then red health', () => {
    const layers: HeartLayer[] = [{ kind: 'berserker', hp: HEART }, { kind: 'blue', hp: HEART }];
    const r = landHit(layers, u(150));
    expect(r.lost).toEqual(['blue']);
    expect(layers).toEqual([{ kind: 'berserker', hp: u(50) }]);
    expect(r.rest).toBe(0);
    expect(berserk(layers)).toBe(true);
    const r2 = landHit(layers, u(80));
    expect(r2.lost).toEqual(['berserker']);
    expect(r2.rest).toBeCloseTo(u(30));
    expect(berserk(layers)).toBe(false);
  });

  it('count as hearts beside the red ones', () => {
    expect(heartCount(HEART * 2 + 1, [{ kind: 'blue', hp: HEART }])).toBe(4);
  });

  it('toll payments are never halved', () => {
    const layers: HeartLayer[] = [{ kind: 'stone', hp: HEART }];
    expect(landHit(layers, HEART, false).lost).toEqual(['stone']);
  });
});

describe('black heart', () => {
  it('is an extra heart like the blue one: a layer, one full heart, taken before the red health', () => {
    expect(isLayer('black')).toBe(true);
    const layers: HeartLayer[] = [];
    layers.push({ kind: 'black', hp: HEART });
    expect(heartCount(HEART * 2, layers)).toBe(3);
    const r = landHit(layers, u(60));
    expect(r.rest).toBe(0);
    expect(layers).toEqual([{ kind: 'black', hp: u(40) }]);
  });

  it('is spent before the blue heart under it, and is lost for good', () => {
    const layers: HeartLayer[] = [{ kind: 'blue', hp: HEART }, { kind: 'black', hp: HEART }];
    const r = landHit(layers, u(140));
    expect(r.lost).toEqual(['black']);
    expect(layers.map(l => l.kind)).toEqual(['blue']);
    expect(layers[0].hp).toBeCloseTo(u(60));
    expect(r.rest).toBe(0);
    expect(berserk(layers)).toBe(false);
  });

  it('is never halved (only the stone heart halves) and never a berserker heart', () => {
    const layers: HeartLayer[] = [{ kind: 'black', hp: HEART }];
    const r = landHit(layers, u(60));
    expect(r.halved).toBe(false);
    expect(r.dealt).toBeCloseTo(u(60));
    expect(berserk(layers)).toBe(false);
  });

  it('counts against the room for hearts: containers and extra hearts are at most twelve', () => {
    expect(hasHeartRoom(8, [])).toBe(true);
    expect(hasHeartRoom(10, [{ kind: 'blue', hp: HEART }])).toBe(true);
    expect(hasHeartRoom(10, [{ kind: 'blue', hp: HEART }, { kind: 'black', hp: HEART }])).toBe(false);
  });

  it('is rare: 1 to 2 % of heart drops, below the blue and stone hearts', () => {
    expect(HEART_CHANCE.black).toEqual([0.01, 0.02]);
    expect(HEART_CHANCE.black[1]).toBeLessThan(HEART_CHANCE.blue[0]);
    expect(RARE_HEARTS).toContain('black');
    const chances = floorHeartChances(new RunRandom(3), 4), rng = new Rng(9), n = 40000;
    let black = 0;
    for (let i = 0; i < n; i++) if (rollHeart(rng, chances, 4) === 'black') black++;
    expect(black / n).toBeCloseTo(chances.black, 1);
  });
});

describe('blood heart', () => {
  it('heals 3 per second, up to 200 in all, for at most two minutes', () => {
    const r = { left: BLOOD_BUDGET, t: BLOOD_SECONDS };
    let hp = 0, healed = 0, steps = 0;
    for (;;) {
      const s = tickBlood(r, 0.5, hp, HEART * 10);
      hp += s.heal; healed += s.heal; steps++;
      if (s.done) break;
    }
    expect(BLOOD_RATE).toBeCloseTo(u(3));
    expect(healed).toBeCloseTo(u(200));
    expect(steps * 0.5).toBeLessThanOrEqual(BLOOD_SECONDS);
  });

  it('ends early at maximum health', () => {
    const r = { left: BLOOD_BUDGET, t: BLOOD_SECONDS };
    const s = tickBlood(r, 10, HEART * 3 - u(10), HEART * 3);
    expect(s.heal).toBeCloseTo(u(10));
    expect(s.done).toBe(true);
  });

  it('stops after two minutes even with budget left', () => {
    const r = { left: BLOOD_BUDGET, t: BLOOD_SECONDS };
    let hp = 0;
    for (let i = 0; i < 130; i++) { const s = tickBlood(r, 1, hp, HEART * 100); hp += s.heal; if (s.done) break; }
    expect(hp).toBeLessThanOrEqual(BLOOD_BUDGET + 1e-9);
  });
});

describe('blood heart at full health (#146)', () => {
  const slot = (stats: StatSheet) => stats.add({ stat: 'maxHearts', layer: 'add', value: 1, source: BLOOD_SLOT_SOURCE });

  it('each blood heart taken at full health adds one heart container, and the run clears them', () => {
    const stats = new StatSheet();
    expect(stats.get('maxHearts')).toBe(3);
    slot(stats);
    slot(stats);
    expect(stats.get('maxHearts')).toBe(5);
    stats.removeSource(BLOOD_SLOT_SOURCE);
    expect(stats.get('maxHearts')).toBe(3);
  });

  it('never opens past the twelve heart slots shared with blue, stone and berserker hearts', () => {
    const stats = new StatSheet();
    for (let i = 0; i < 20; i++) slot(stats);
    expect(stats.get('maxHearts')).toBe(12);
    expect(hasHeartRoom(stats.get('maxHearts'), [])).toBe(false);
    expect(hasHeartRoom(10, [{ kind: 'blue', hp: HEART }])).toBe(true);
    expect(hasHeartRoom(11, [{ kind: 'blue', hp: HEART }])).toBe(false);
    expect(hasHeartRoom(3, [])).toBe(true);
  });
});

describe('collecting a blood heart (#146)', () => {
  // The real Game.collectHeart on a stand-in object (Object.create(Game.prototype)) that holds only
  // what it reads: the stat sheet, the player, the bus, the HUD toast and the particles.
  let Game: typeof import('../src/game/game').Game;
  beforeAll(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    try {
      ({ Game } = await import('../src/game/game'));
    } finally {
      vi.unstubAllGlobals();
    }
  }, 120000);

  // `extra` heart containers beyond the three the player starts with; hp is set from the resulting maximum.
  function rig(extra: number, hpOf: (maxHp: number) => number) {
    const stats = new StatSheet();
    for (let i = 0; i < extra; i++) stats.add({ stat: 'maxHearts', layer: 'add', value: 1, source: 'test' });
    const maxHp = Math.floor(stats.get('maxHearts')) * HEART;
    const player = { hp: hpOf(maxHp), layers: [] as HeartLayer[], blood: null as BloodRegen | null, body: { x: 0, y: 0, z: 0 } };
    const toast = vi.fn();
    const g = Object.assign(Object.create(Game.prototype), {
      player, stats, bus: createBus(), hud: { toast }, particles: { burst: () => {} },
    }) as Game;
    return { g, player, stats, toast };
  }

  it('at full health it opens one heart container and fills it to the new maximum', () => {
    const { g, player, stats, toast } = rig(0, max => max);
    expect(g.collectHeart('blood')).toBe(true);
    expect(stats.get('maxHearts')).toBe(4);
    expect(player.hp).toBe(4 * HEART);
    expect(player.blood).toBeNull();
    expect(toast).toHaveBeenCalledWith('heart.bloodSlot');
  });

  it('below full health it still starts the slow healing and opens no container', () => {
    const { g, player, stats, toast } = rig(0, () => HEART);
    expect(g.collectHeart('blood')).toBe(true);
    expect(stats.get('maxHearts')).toBe(3);
    expect(player.hp).toBe(HEART);
    expect(player.blood).toEqual({ left: BLOOD_BUDGET, t: BLOOD_SECONDS });
    expect(toast).toHaveBeenCalledWith('heart.blood');
  });

  it('at the twelve-slot cap it is refused at full health and stays on the floor', () => {
    const { g, player, stats, toast } = rig(9, max => max);
    expect(stats.get('maxHearts')).toBe(12);
    const hp = player.hp;
    expect(g.collectHeart('blood')).toBe(false);
    expect(stats.get('maxHearts')).toBe(12);
    expect(player.hp).toBe(hp);
    expect(player.blood).toBeNull();
    expect(toast).not.toHaveBeenCalled();
  });
});

describe('heart drops', () => {
  it('draw each kind\'s chance inside its range, from the seed, per floor', () => {
    const a = floorHeartChances(new RunRandom(7), 3), b = floorHeartChances(new RunRandom(7), 3), c = floorHeartChances(new RunRandom(8), 3);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    for (const k of RARE_HEARTS) {
      expect(a[k]).toBeGreaterThanOrEqual(HEART_CHANCE[k][0]);
      expect(a[k]).toBeLessThanOrEqual(HEART_CHANCE[k][1]);
    }
  });

  it('are mostly red, and the berserker heart is the rarest', () => {
    const chances = floorHeartChances(new RunRandom(11), 2), rng = new Rng(5), n = 40000;
    const counts = new Map<string, number>();
    for (let i = 0; i < n; i++) { const k = rollHeart(rng, chances, 2); counts.set(k, (counts.get(k) ?? 0) + 1); }
    expect((counts.get('red') ?? 0) / n).toBeGreaterThan(0.6);
    for (const k of RARE_HEARTS) expect((counts.get(k) ?? 0) / n).toBeCloseTo(chances[k], 1);
    expect(Math.min(...RARE_HEARTS.map(k => HEART_CHANCE[k][1]))).toBe(HEART_CHANCE.berserker[1]);
  });
});
