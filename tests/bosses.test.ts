import { describe, expect, it } from 'vitest';
import { BOSSES, BOSS_ZONES, bossFor, bossHp } from '../src/content/bosses';
import { ENEMY_BY_ID } from '../src/content/enemies';
import { RunRandom } from '../src/core/rng';
import { emitter, phased, PHASE_HOLD, volley } from '../src/enemies/behaviours';
import type { Enemy, EnemyCtx } from '../src/enemies/types';

describe('bosses: floors and pools', () => {
  it('every floor from 1 to 9 is in a zone, and the peaceful floor has none', () => {
    for (let k = 1; k <= 9; k++) expect(BOSS_ZONES.some(z => k >= z.floors[0] && k <= z.floors[1]), `floor ${k}`).toBe(true);
    expect(BOSS_ZONES.some(z => 0 >= z.floors[0] && 0 <= z.floors[1])).toBe(false);
  });

  it('every pool entry is a built boss, and every boss is in a pool or a keystone', () => {
    const pooled = BOSS_ZONES.flatMap(z => [...z.pool, ...(z.keystone ? [z.keystone] : [])]);
    for (const id of pooled) if (BOSSES.some(b => b.id === id)) expect(ENEMY_BY_ID.get(id)?.kind, id).toBe('boss');
    for (const b of BOSSES) expect(pooled.includes(b.id), b.id).toBe(true);
  });

  it('a run never meets the same boss twice, and a floor draws only from its zone', () => {
    const rng = new RunRandom(7);
    const used = new Set<string>();
    for (const k of [1, 2]) {
      const id = bossFor(k, rng.fork('floor', k, 'boss'), used);
      expect(id).not.toBeNull();
      expect(BOSS_ZONES.find(z => k >= z.floors[0] && k <= z.floors[1])!.pool).toContain(id);
      used.add(id!);
    }
    const [a, b] = [...used];
    expect(a).not.toBe(b);
  });

  it('is seeded: the same seed draws the same boss', () => {
    const pick = (seed: number) => bossFor(1, new RunRandom(seed).fork('floor', 1, 'boss'), new Set());
    expect(pick(3)).toBe(pick(3));
  });

  it('health grows from about 140 on floor 1 to about 1000 on floor 9', () => {
    expect(bossHp(1)).toBe(140);
    expect(bossHp(9)).toBe(1000);
    for (let k = 2; k <= 9; k++) expect(bossHp(k)).toBeGreaterThan(bossHp(k - 1));
  });
});

describe('bosses: phases', () => {
  const boss = (hp: number, maxHp: number) => ({
    hp, maxHp, stage: 0, hold: 0, state: 'move', timer: 0, seq: 0, armed: true, wishX: 1, wishZ: 1, pulse: 0,
    body: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.5, h: 2, onGround: true }, aimX: 0, aimZ: 0, speed: 1, tags: new Set<string>(),
    room: 0, faction: 'projection', spec: { id: 'test' },
  }) as unknown as Enemy;
  const ctx = (arena: string[], cues: string[]) => ({
    dt: 1 / 60,
    target: () => null,
    arena: (_e: Enemy, what: string) => arena.push(what),
    cue: (_e: Enemy, kind: string) => cues.push(kind),
    dist: () => 0,
    toward: () => [0, 0],
    strike: () => {},
    near: () => null,
    safe: () => true,
    shootAt: () => {},
    burst: () => {},
    kill: () => {},
    bolt: () => {},
  }) as unknown as EnemyCtx;

  it('changes phase at two thirds and at one third, each time pausing and changing the arena', () => {
    const idle = { name: 'idle', update: () => {} };
    const behaviour = phased({ phases: [idle, idle, idle], arena: ['walls', 'rolls'] });
    const arena: string[] = [], cues: string[] = [];
    const e = boss(100, 100);
    behaviour.update(e, ctx(arena, cues));
    expect(e.stage).toBe(0);
    e.hp = 60; behaviour.update(e, ctx(arena, cues));
    expect(e.stage).toBe(1);
    expect(e.hold).toBe(PHASE_HOLD);
    expect(arena).toEqual(['walls']);
    e.hp = 20; behaviour.update(e, ctx(arena, cues));
    expect(e.stage).toBe(2);
    expect(arena).toEqual(['walls', 'rolls']);
    expect(cues.filter(c => c === 'phase')).toHaveLength(2);
  });
});

describe('bosses: they move towards you', () => {
  it('every boss can walk, so its phases can follow the player (shadow mirrors instead)', () => {
    for (const b of BOSSES) if (b.id !== 'shadow') expect(b.speed, b.id).toBeGreaterThan(0);
  });

  it('every boss that walks breaks the blocks at its sides, so no block holds it', () => {
    for (const b of BOSSES) if (b.id !== 'shadow' && b.id !== 'downpour') expect(b.breaks, b.id).toBeDefined();
  });

  it('an emitter with follow walks towards its target until it is within keep, and fires', () => {
    const shots: number[] = [];
    const behaviour = emitter({ every: 1, follow: { speed: 2, keep: 4 }, shot: () => { shots.push(1); } });
    const ctx = (dist: number) => ({
      dt: 1 / 60,
      target: () => ({ x: dist, z: 0, y: 0 }),
      dist: () => dist,
      toward: () => [1, 0],
    }) as unknown as EnemyCtx;
    const e = { wishX: 0, wishZ: 0, timer: 0, pulse: 0, speed: 1 } as unknown as Enemy;
    behaviour.update(e, ctx(10));
    expect(e.wishX).toBeCloseTo(2);
    expect(e.wishZ).toBe(0);
    behaviour.update(e, ctx(3));
    expect(e.wishX).toBe(0);
    expect(shots.length).toBeGreaterThan(0);
  });
});

describe('bosses: volleys', () => {
  it('a volley waits its own time, shows its aim in the last half second, then fires once per period', () => {
    const shots: number[] = [];
    const idle = { name: 'idle', update: () => {} };
    const behaviour = volley({ every: 1, shot: () => { shots.push(1); }, then: idle });
    const ctx = { dt: 0.25 } as unknown as EnemyCtx;
    const e = { volley: 1, pulse: 0, state: 'move' } as unknown as Enemy;
    behaviour.update(e, ctx);
    behaviour.update(e, ctx);
    behaviour.update(e, ctx);
    expect(e.pulse).toBeGreaterThan(0);
    expect(shots).toEqual([]);
    behaviour.update(e, ctx);
    expect(shots).toEqual([1]);
    e.state = 'stun';
    for (let i = 0; i < 4; i++) behaviour.update(e, ctx);
    expect(shots).toEqual([1]);
  });
});
