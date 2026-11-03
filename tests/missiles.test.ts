// Dr. Launcher's missiles (src/combat/missiles.ts): flight, arming, ends and the muzzle rule.

import { describe, expect, it } from 'vitest';
import { MISSILE_ARM, MISSILE_RANGE, MISSILE_SPEED, MISSILE_SPEED0, Missiles, muzzleBlocked, type MissileWorld } from '../src/combat/missiles';
import { ITEM_BY_ID } from '../src/content/items';
import { computeStats } from '../src/core/stats';
import { DOUBLE_TAP_MS } from '../src/input/bindings';

const open: MissileWorld = { solid: () => false, meets: () => false };
const wallAt = (x: number): MissileWorld => ({ solid: bx => bx >= x, meets: () => false });
const run = (ms: Missiles, w: MissileWorld, seconds: number) => {
  const ends = [];
  for (let t = 0; t < seconds * 60; t++) ends.push(...ms.update(1 / 60, w));
  return ends;
};

describe('missiles', () => {
  it('speed up from the muzzle, then hold a steady line with no drop', () => {
    const ms = new Missiles();
    const m = ms.launch(0.5, 5.5, 0.5, 1, 0, 0, 'negative');
    expect(m.speed).toBe(MISSILE_SPEED0);
    run(ms, open, 0.5);
    expect(m.speed).toBe(MISSILE_SPEED);
    expect(m.y).toBe(5.5);
    expect(m.dx).toBe(1);
  });

  it('end against a block, in front of its face, never inside it', () => {
    const ms = new Missiles();
    ms.launch(0.5, 0.5, 0.5, 1, 0, 0, 'negative');
    const [end] = run(ms, wallAt(10), 2);
    expect(end.why).toBe('block');
    expect(end.x).toBeLessThan(10);
    expect(end.x).toBeGreaterThan(9.5);
    expect(ms.list).toHaveLength(0);
  });

  it('explode in the air at the end of their range', () => {
    const ms = new Missiles();
    ms.launch(0.5, 0.5, 0.5, 0, 0, 1, 'positive');
    const ends = run(ms, open, 3);
    expect(ends).toHaveLength(1);
    expect(ends[0].why).toBe('range');
    expect(ends[0].z).toBeCloseTo(0.5 + MISSILE_RANGE, 6);
  });

  it('pass through what they meet until they are armed', () => {
    const ms = new Missiles();
    ms.launch(0, 0, 0, 1, 0, 0, 'negative');
    // a body standing from x = 1 to x = 4: met only once two blocks have been flown
    const [end] = run(ms, { solid: () => false, meets: x => x > 1 && x < 4 }, 1);
    expect(end.why).toBe('meet');
    expect(end.x).toBeGreaterThanOrEqual(MISSILE_ARM);
  });

  it('never tunnel through a one-block wall at full speed', () => {
    const ms = new Missiles();
    ms.launch(0.5, 0.5, 0.5, 1, 0, 0, 'negative', 80);
    const [end] = run(ms, { solid: bx => bx === 30, meets: () => false }, 2);
    expect(end.why).toBe('block');
    expect(end.x).toBeLessThan(30);
  });

  it('a launch event cannot make a missile that never moves or never ends', () => {
    const ms = new Missiles();
    const m = ms.launch(0, 0, 0, 1, 0, 0, 'negative', NaN, -5);
    expect(m.top).toBe(MISSILE_SPEED);
    expect(m.range).toBe(MISSILE_ARM);
    expect(run(ms, open, 1)).toHaveLength(1);
  });

  it('are refused when a block stands within the arming distance', () => {
    const solid = (x: number) => x >= 2;
    expect(muzzleBlocked(solid, 0.5, 0.5, 0.5, 1, 0, 0)).toBe(true);
    expect(muzzleBlocked((x: number) => x >= 3, 0.5, 0.5, 0.5, 1, 0, 0)).toBe(false);
    expect(muzzleBlocked(solid, 0.5, 0.5, 0.5, -1, 0, 0)).toBe(false);
  });
});

describe('Dr. Launcher', () => {
  it('turns the double tap on through the missile stat, and nothing else changes', () => {
    const d = ITEM_BY_ID.get('drlauncher')!;
    expect(d.quality).toBe(3);
    expect(d.tags).toContain('milagros');
    expect(d.pools).toEqual({ treasure: 1 });
    const s = computeStats((d.stats ?? []).map(m => ({ ...m, source: d.id })));
    expect(s.missile).toBe(1);
    expect(computeStats([]).missile).toBe(0);
  });

  it('says its real numbers', () => {
    const e = ITEM_BY_ID.get('drlauncher')!.effect;
    for (const n of [DOUBLE_TAP_MS / 1000, MISSILE_SPEED, MISSILE_RANGE, MISSILE_ARM]) expect(e).toContain(String(n));
  });
});
