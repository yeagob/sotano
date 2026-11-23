import { describe, expect, it } from 'vitest';
import { BuildCount, CHILD_BUILD_BLOCKS } from '../src/game/build-count';

describe('build count: the blocks placed in a run', () => {
  it('counts only the blocks placed after the mark', () => {
    const c = new BuildCount();
    c.record(); c.record();
    const mark = c.mark();
    expect(c.since(mark)).toBe(0);
    c.record();
    expect(c.since(mark)).toBe(1);
  });

  it('the Child asks for three blocks, and is done only when all three came after its mark', () => {
    expect(CHILD_BUILD_BLOCKS).toBe(3);
    const c = new BuildCount();
    for (let i = 0; i < 10; i++) c.record();
    const mark = c.mark();
    c.record(); c.record();
    expect(c.reached(mark)).toBe(false);
    c.record();
    expect(c.reached(mark)).toBe(true);
  });

  it('a mark from before a run cannot make a build look done (the count never goes negative)', () => {
    const c = new BuildCount();
    expect(c.since(5)).toBe(0);
    expect(c.reached(5)).toBe(false);
  });

  it('every placed block counts, whichever path it came from: the counter is fed one record per event', () => {
    const c = new BuildCount();
    const mark = c.mark();
    for (let i = 0; i < 4; i++) c.record();
    expect(c.since(mark)).toBe(4);
    expect(c.reached(mark, 4)).toBe(true);
  });
});
