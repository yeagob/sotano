import { describe, expect, it } from 'vitest';
import { FEAR_REST_MAX, FEAR_REST_MIN, frightenProjection, tickFearRest } from '../src/core/fear';

const fresh = () => ({ fear: 0, fearRest: 0 });

/** Runs the enemy's fear clock as the enemies loop does: the flight counts down, then the rest. */
function run(e: { fear: number; fearRest: number }, seconds: number, dt = 0.5) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    tickFearRest(e, dt);
    if (e.fear > 0) e.fear = Math.max(0, e.fear - dt);
  }
}

describe('a projection scared by Self-Efficacy', () => {
  it('runs for the seconds it is given, and a hit while it runs does not extend the flight', () => {
    const e = fresh();
    expect(frightenProjection(e, 3, 0)).toBe(true);
    expect(e.fear).toBe(3);
    run(e, 2);
    expect(frightenProjection(e, 3, 0)).toBe(false);
    expect(e.fear).toBe(1);
  });

  it('cannot be scared again while its rest runs, and the rest does not count down during the flight', () => {
    const e = fresh();
    frightenProjection(e, 3, 0);
    run(e, 3);
    expect(e.fear).toBe(0);
    expect(e.fearRest).toBe(FEAR_REST_MIN);
    run(e, 2);
    expect(e.fearRest).toBe(FEAR_REST_MIN - 2);
    expect(frightenProjection({ ...e }, 3, 0)).toBe(false);
  });

  it('rests for 5 to 10 seconds after the flight, at random, and can be scared again when the rest is over', () => {
    expect(FEAR_REST_MIN).toBe(5);
    expect(FEAR_REST_MAX).toBe(10);
    for (const [roll, rest] of [[0, 5], [0.5, 7.5], [0.999999, 10]] as const) {
      const e = fresh();
      frightenProjection(e, 3, roll);
      run(e, 3 + rest - 0.5);
      expect(frightenProjection({ ...e }, 3, 0), `roll ${roll}`).toBe(false);
      run(e, 0.5);
      expect(frightenProjection({ ...e }, 3, 0), `roll ${roll}`).toBe(true);
    }
  });

  it('is refused for a length of zero or less', () => {
    const e = fresh();
    expect(frightenProjection(e, 0, 0)).toBe(false);
    expect(frightenProjection(e, -1, 0)).toBe(false);
    expect(e).toEqual(fresh());
  });
});
