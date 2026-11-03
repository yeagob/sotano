import { describe, expect, it } from 'vitest';
import { AIR_CONTROL, COYOTE, GRAVITY, JUMP_V, LADDER, WALK, apex, flight, rise, velocity } from '../src/physics/jump';
import { Player } from '../src/entities/player';
import { BASE_STATS } from '../src/core/stats';
import type { Input } from '../src/input/input';

describe('the jump numbers (SKY.md §8, §9)', () => {
  it('keeps the player constants', () => {
    expect([WALK, GRAVITY, JUMP_V, AIR_CONTROL, COYOTE]).toEqual([4.6, 28, 8.4, 0.35, 0.1]);
    expect(LADDER).toEqual([1, 2, 8]);
    expect(velocity(0)).toBeCloseTo(8.4, 9);
    expect(velocity(1)).toBeCloseTo(8.4 * Math.SQRT2, 9);
  });

  it('rises 1.26 with one jump, 3.78 with two, about 13.9 with the full ladder', () => {
    expect(apex(0)).toBeCloseTo(1.26, 9);
    expect(rise(1)).toBeCloseTo(1.26, 9);
    expect(rise(2)).toBeCloseTo(3.78, 9);
    expect(rise(3)).toBeCloseTo(13.86, 9);
    expect(Math.abs(rise(3) - 13.9)).toBeLessThan(0.05);
    // the jump stat scales every height linearly
    expect(rise(3, 2)).toBeCloseTo(2 * rise(3), 9);
  });

  it('flight: one jump on the flat clears the running gap, and it is undefined out of reach', () => {
    // one running jump lands back on the flat after 2·v/g seconds at walking speed
    expect(flight(0, 1)).toBeCloseTo(WALK * 2 * JUMP_V / GRAVITY, 9);
    expect(flight(0, 1)!).toBeGreaterThan(2.7);
    expect(flight(1.26, 1)).toBeUndefined();
    expect(flight(3.77, 2)).toBeGreaterThan(0);
    for (const dy of [3.78, 3.79, 4, 10]) expect(flight(dy, 2)).toBeUndefined();
    expect(flight(13.86, 3)).toBeUndefined();
    expect(flight(0, 0)).toBeUndefined();
    expect(flight(0, 4)).toBeUndefined();
  });

  it('flight shrinks as the rise grows and grows with every jump of the ladder', () => {
    for (const n of [1, 2, 3]) {
      let prev = Infinity;
      for (let dy = -2; dy < rise(n) - 0.01; dy += 0.25) {
        const r = flight(dy, n)!;
        expect(r).toBeLessThan(prev);
        prev = r;
      }
    }
    expect(flight(0, 2)!).toBeGreaterThan(flight(0, 1)!);
    expect(flight(0, 3)!).toBeGreaterThan(flight(0, 2)!);
  });

  it('flight: a running take-off ignores air control, a standing one gains from it', () => {
    expect(flight(5, 3, 1)).toBeCloseTo(flight(5, 3, AIR_CONTROL)!, 9);
    const still = { start: 0 };
    expect(flight(5, 3, 1, still)!).toBeGreaterThan(flight(5, 3, AIR_CONTROL, still)!);
    expect(flight(5, 3, 1, still)!).toBeLessThan(flight(5, 3, 1)!);
  });
});

describe('the player jumps by these numbers', () => {
  function simulatedApex(dt: number, jump = 1): number {
    const solid = (_x: number, y: number) => y <= 0;
    const p = new Player();
    p.spawnAt(0.5, 1, 0.5);
    p.body.onGround = true;
    const pressed = new Set(['jump']);
    const input = { hit: (a: string) => pressed.has(a), held: () => false, move: { x: 0, y: 0 }, lookDX: 0, lookDY: 0, sensitivity: 0 } as unknown as Input;
    const hooks = { jump: (v: number) => v, land: () => {}, bump: (v: number) => v };
    const stats = { ...BASE_STATS, jump };
    let top = p.body.y;
    for (let t = 0; t < 2; t += dt) {
      p.update(dt, input, stats, solid, hooks);
      pressed.clear();
      top = Math.max(top, p.body.y);
    }
    return top - 1;
  }

  it('matches apex(0, 1) as the step shrinks, and stays close at 60 fps', () => {
    expect(simulatedApex(1 / 2000)).toBeCloseTo(apex(0, 1), 2);
    const at60 = simulatedApex(1 / 60);
    expect(at60).toBeLessThanOrEqual(apex(0, 1));
    expect(at60).toBeGreaterThan(apex(0, 1) - 0.1);
    expect(simulatedApex(1 / 2000, 2)).toBeCloseTo(apex(0, 2), 2);
  });
});
