import { describe, expect, it } from 'vitest';
import { ENEMY_BY_ID } from '../src/content/enemies';

describe('simplified projections: Procrastination', () => {
  it('splits when it is hit, two splits deep, and not on death', () => {
    const main = ENEMY_BY_ID.get('procrastination')!;
    const b = ENEMY_BY_ID.get('procrastination-b')!;
    const c = ENEMY_BY_ID.get('procrastination-c')!;
    expect(main.splitOnHit).toBe(true);
    expect(main.split).toEqual(['procrastination-b', 'procrastination-b']);
    expect(b.splitOnHit).toBe(true);
    expect(b.split).toEqual(['procrastination-c', 'procrastination-c']);
    expect(c.splitOnHit).toBe(false);
    expect(c.split).toBeUndefined();
  });
});

describe('simplified projections: Avoidance', () => {
  it('hides while shut and shows itself only while peeking', () => {
    const av = ENEMY_BY_ID.get('avoidance')!;
    const hidden: boolean[] = [];
    const ctx = {
      dt: 1 / 60,
      target: () => ({ x: 2, y: 0, z: 0 }),
      dist: () => 2,
      shootAt: () => {},
      hide: (_e: unknown, h: boolean) => hidden.push(h),
    };
    const e = { state: 'peek', timer: 0, pulse: 0, wishX: 0, wishZ: 0, tags: new Set<string>() };
    av.behaviour.update(e as never, ctx as never);
    expect(e.state).toBe('shut');
    expect(e.tags.has('shut')).toBe(true);
    expect(hidden).toEqual([true]);
    e.timer = 0;
    e.state = 'move';
    av.behaviour.update(e as never, ctx as never);
    expect(e.state).toBe('peek');
    expect(e.tags.has('shut')).toBe(false);
    expect(hidden).toEqual([true, false]);
  });
});
