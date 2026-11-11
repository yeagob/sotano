import { describe, expect, it } from 'vitest';
import { HEART } from '../src/entities/actors';
import { BLOOD_BUDGET, BLOOD_RATE, BLOOD_SECONDS, BLOOD_SLOT_SOURCE, HEALTH_UNIT, berserk, hasHeartRoom, heartCount, landHit, stoneHalve, tickBlood, type HeartLayer } from '../src/entities/hearts';
import { floorHeartChances, HEART_CHANCE, RARE_HEARTS, rollHeart } from '../src/content/tables/hearts';
import { Rng, RunRandom } from '../src/core/rng';
import { StatSheet } from '../src/core/stats';

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
