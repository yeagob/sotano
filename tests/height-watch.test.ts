// The player's height watch (src/game/height-watch.ts): a height that is not a finite number warns on the console once per
// run, with the value, and a finite height never warns. Pure, so it runs without the game or WebGL.

import { describe, expect, it } from 'vitest';
import { HeightWatch } from '../src/game/height-watch';

function recorder() {
  const messages: string[] = [];
  return { messages, warn: (m: string) => { messages.push(m); } };
}

describe('the height watch warns once per run', () => {
  it('a finite height is accepted and never warns', () => {
    const r = recorder();
    const watch = new HeightWatch(r.warn);
    expect(watch.check(0)).toBe(true);
    expect(watch.check(-7.5)).toBe(true);
    expect(watch.check(120)).toBe(true);
    expect(r.messages).toEqual([]);
  });

  it('a height that is not finite is refused and warns with its value, once, however many frames', () => {
    const r = recorder();
    const watch = new HeightWatch(r.warn);
    expect(watch.check(NaN)).toBe(false);
    expect(watch.check(NaN)).toBe(false);
    expect(watch.check(Infinity)).toBe(false);
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0]).toContain('NaN');
  });

  it('a finite height between two bad ones does not re-arm the warning within the run', () => {
    const r = recorder();
    const watch = new HeightWatch(r.warn);
    watch.check(NaN);
    expect(watch.check(3)).toBe(true);
    watch.check(NaN);
    expect(r.messages).toHaveLength(1);
  });

  it('a new run may warn again', () => {
    const r = recorder();
    const watch = new HeightWatch(r.warn);
    watch.check(NaN);
    watch.reset();
    watch.check(-Infinity);
    expect(r.messages).toHaveLength(2);
    expect(r.messages[1]).toContain('-Infinity');
  });
});
