import { describe, expect, it } from 'vitest';
import { BOSSES, BOSS_ZONES, bossFor, bossHp } from '../src/content/bosses';
import { ENEMY_BY_ID } from '../src/content/enemies';
import { RunRandom } from '../src/core/rng';
import { phased, PHASE_HOLD } from '../src/enemies/behaviours';
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

describe('bosses: the first five floors always fight (enemies/moves.ts)', () => {
  const EARLY = BOSSES.filter(b => b.minFloor <= 5);
  // a boss alone with a target six blocks away that keeps running: it is fed a fake world that
  // records every attack it makes, a phase at a time
  const run = (id: string, stage: number, seconds: number) => {
    const def = BOSSES.find(b => b.id === id)!;
    const e = {
      id: 7, hp: stage === 0 ? 100 : stage === 1 ? 60 : 30, maxHp: 100, stage, hold: 0, state: 'move', timer: 0, seq: 0, armed: true,
      wishX: 0, wishZ: 0, pulse: 0, flyY: -1, move: -1, act: 0, speed: def.speed || 1, clock: 0, aimX: 0, aimZ: 0,
      body: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: def.size[0], h: def.size[1], onGround: true },
      tags: new Set<string>(), room: 0, faction: 'projection', spec: def, def: def.id,
    } as unknown as Enemy;
    const made: string[] = [];
    let t = 0;
    const target = () => ({ id: 1, x: 6 * Math.cos(t * 0.5), y: 0, z: 6 * Math.sin(t * 0.5), vx: -3 * Math.sin(t * 0.5), vz: 3 * Math.cos(t * 0.5) });
    const ctx = {
      dt: 1 / 60, target, near: target,
      dist: (_e: Enemy, p: { x: number; z: number }) => Math.hypot(p.x - e.body.x, p.z - e.body.z),
      toward: (_e: Enemy, p: { x: number; z: number }) => { const dx = p.x - e.body.x, dz = p.z - e.body.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; },
      bounds: () => [-13, -3, 14, 3], centre: () => [0, 0],
      strike: (_e: Enemy, s: { damage: number; shape: { kind: string } }) => { if (s.damage > 0) made.push(s.shape.kind); },
      bolt: () => made.push('bolt'), shootAt: () => made.push('lob'), rain: () => made.push('rain'),
      rockfall: () => made.push('rock'), quake: () => {}, crash: () => {}, fx: () => {}, cue: () => {}, arena: () => {},
      safe: () => true, burst: () => {}, kill: () => {}, summon: () => {}, hide: () => {}, quiet: () => false, others: () => [],
    } as unknown as EnemyCtx;
    const moves = new Set<number>();
    for (; t < seconds; t += 1 / 60) {
      def.behaviour.update(e, ctx);
      if (e.state === 'windup') moves.add(e.move);
      // the body follows its wish, so a charge stops (as on a wall) only when it is told to
      e.body.x += e.wishX * e.speed / 60; e.body.z += e.wishZ * e.speed / 60;
    }
    return { made, moves };
  };

  for (const b of EARLY) {
    it(`${b.id} attacks in every phase within six seconds, with more than one move`, () => {
      for (const stage of [0, 1, 2]) {
        const { made, moves } = run(b.id, stage, 6);
        expect(made.length, `${b.id} phase ${stage + 1}`).toBeGreaterThan(0);
        expect(moves.size, `${b.id} phase ${stage + 1} moves`).toBeGreaterThan(1);
      }
    });
  }
});

describe('bosses: sequences (combo)', () => {
  it('runs its moves in order, each after its own windup, and recovers only after the last', async () => {
    const { combo, moveset } = await import('../src/enemies/moves');
    const order: string[] = [];
    const step = (name: string) => ({ name, windup: 0.4, recover: 0, aim: () => order.push(`aim ${name}`), act: () => order.push(`act ${name}`) });
    const b = moveset({ gait: { kind: 'still' }, pace: [0, 0], moves: [combo('abc', [step('a'), step('b'), step('c')], { recover: 0.5, gap: 0.1 })] });
    const e = { id: 1, state: 'move', timer: 0, seq: 0, move: -1, act: 0, pulse: 0, wishX: 0, wishZ: 0, flyY: -1, speed: 1, body: { x: 0, y: 0, z: 0, vx: 0, vz: 0 } } as unknown as Enemy;
    const t = { id: 2, x: 5, y: 0, z: 0 };
    const ctx = { dt: 1 / 60, target: () => t, dist: () => 5, toward: () => [1, 0], cue: () => {} } as unknown as EnemyCtx;
    const states: string[] = [];
    for (let k = 0; k < 180; k++) { b.update(e, ctx); if (states[states.length - 1] !== e.state) states.push(e.state); }
    expect(order.slice(0, 6)).toEqual(['aim a', 'act a', 'aim b', 'act b', 'aim c', 'act c']);
    expect(states.slice(0, 4)).toEqual(['windup', 'act', 'recover', 'move']);
  });
});
