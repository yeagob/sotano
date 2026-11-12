// The Sanctuary's clock (docs/design/built/presences/MEDITATION-APP.md): the app counts real time, but a hidden
// tab stops its frames, and when the tab comes back the time it was hidden must not be counted. A sitting cannot
// end while the game is not drawing it.

import { describe, expect, it } from 'vitest';
import { AppClock, MAX_CLOCK_STEP_MS } from '../src/game/meditation-app';

describe('AppClock', () => {
  it('counts ordinary frames in full', () => {
    const c = new AppClock();
    c.now(1000);
    expect(c.now(1016)).toBe(16);
    expect(c.now(1032)).toBe(32);
  });

  it('counts a stalled frame for at most the step limit', () => {
    const c = new AppClock();
    c.now(0);
    expect(c.now(MAX_CLOCK_STEP_MS + 900)).toBe(MAX_CLOCK_STEP_MS);
  });

  it('does not count the time a tab was hidden', () => {
    const c = new AppClock();
    c.now(0);
    for (let t = 16; t <= 1000; t += 16) c.now(t); // a second visible
    const before = c.now(1000);
    const after = c.now(1000 + 10 * 60 * 1000); // ten minutes hidden, then back
    expect(after - before).toBeLessThanOrEqual(MAX_CLOCK_STEP_MS);
  });

  it('adds nothing for the same timestamp, or for a timestamp that goes back', () => {
    const c = new AppClock();
    c.now(500);
    const a = c.now(700);
    expect(c.now(700)).toBe(a);
    expect(c.now(600)).toBe(a);
  });

  it('starts again from zero after reset', () => {
    const c = new AppClock();
    c.now(0);
    c.now(5000);
    c.reset();
    expect(c.now(9000)).toBe(0);
    expect(c.now(9016)).toBe(16);
  });

  it('never runs faster than real time over many small frames', () => {
    const c = new AppClock();
    let t = 0;
    c.now(t);
    for (let i = 0; i < 1000; i++) { t += 16.67; c.now(t); }
    expect(c.now(t)).toBeCloseTo(t, 0);
  });
});
