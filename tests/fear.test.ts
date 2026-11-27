import { describe, expect, it } from 'vitest';
import { FEAR_FLIGHT, FEAR_REST_MAX, FEAR_REST_MIN, frightenProjection, tickFearRest } from '../src/core/fear';

const fresh = () => ({ fear: 0, fearRest: 0 });
const constant = (v: number) => () => v;

/** Runs the enemy's fear clock as the enemies loop does: the rest counts only after the flight. */
function run(e: { fear: number; fearRest: number }, seconds: number, dt = 0.5) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    tickFearRest(e, dt);
    if (e.fear > 0) e.fear = Math.max(0, e.fear - dt);
  }
}

describe('the fear effect', () => {
  it('runs for the flight, and a new application while it runs does not extend it', () => {
    expect(FEAR_FLIGHT).toBe(3);
    const e = fresh();
    expect(frightenProjection(e, constant(0))).toBe(true);
    expect(e.fear).toBe(FEAR_FLIGHT);
    run(e, 2);
    expect(frightenProjection(e, constant(0))).toBe(false);
    expect(e.fear).toBe(1);
  });

  it('cannot be applied again while its rest runs, and the rest does not count down during the flight', () => {
    const e = fresh();
    frightenProjection(e, constant(0));
    run(e, FEAR_FLIGHT);
    expect(e.fear).toBe(0);
    expect(e.fearRest).toBe(FEAR_REST_MIN);
    run(e, 2);
    expect(e.fearRest).toBe(FEAR_REST_MIN - 2);
    expect(frightenProjection({ ...e }, constant(0))).toBe(false);
  });

  it('rests for 5 to 10 seconds after the flight, drawn when it is applied, and can be applied again when the rest is over', () => {
    expect(FEAR_REST_MIN).toBe(5);
    expect(FEAR_REST_MAX).toBe(10);
    for (const [roll, rest] of [[0, 5], [0.5, 7.5], [0.999999, 10]] as const) {
      const e = fresh();
      frightenProjection(e, constant(roll));
      run(e, FEAR_FLIGHT + rest - 0.5);
      expect(frightenProjection({ ...e }, constant(0)), `roll ${roll}`).toBe(false);
      run(e, 0.5);
      expect(frightenProjection({ ...e }, constant(0)), `roll ${roll}`).toBe(true);
    }
  });

  it('draws its rest only when it is applied: a refused application takes nothing from the stream', () => {
    const e = fresh();
    let draws = 0;
    const counted = () => { draws++; return 0.5; };
    frightenProjection(e, counted);
    expect(draws).toBe(1);
    frightenProjection(e, counted);
    expect(draws).toBe(1);
  });
});
