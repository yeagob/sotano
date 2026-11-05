// The passages between the worlds (SKY.md §2.4): which travel a position asks for, and the fade
// that runs it. The check is pure; the gate is driven by a fake host, so no three.js scene is needed.
import { describe, expect, it, vi } from 'vitest';
import { GATE_FADE, GATE_HOLD_MAX, RealmGate, SKY_FLOOR_OUT } from '../src/sky/gate';
import type { RealmGateHost, SkyBounds, Travel } from '../src/sky/types';

const SKY: SkyBounds = { top: 425.5, floorOut: SKY_FLOOR_OUT, deck: [128, 4, 128], crown: [128, 427, 128] };
const pos = (x: number, y: number, z: number) => ({ x, y, z });

describe('RealmGate.check (SKY.md §2.4)', () => {
  it('the dungeon sends the player up past the top of its sky, from anywhere', () => {
    expect(RealmGate.check('dungeon', pos(10, 425.6, 10), null, SKY)).toEqual({ to: 'sky', at: SKY.deck, float: true });
    expect(RealmGate.check('dungeon', pos(200, 500, 3), null, SKY)?.to).toBe('sky');
  });

  it('nothing happens below the top of the dungeon\'s sky, and not exactly at it', () => {
    expect(RealmGate.check('dungeon', pos(10, 425.5, 10), null, SKY)).toBeNull();
    expect(RealmGate.check('dungeon', pos(10, 300, 10), null, SKY)).toBeNull();
    expect(RealmGate.check('dungeon', pos(10, 0, 10), null, SKY)).toBeNull();
  });

  it('the last star leads up even below the top; an ordinary star does not', () => {
    expect(RealmGate.check('dungeon', pos(10, 300, 10), { up: true }, SKY)).toEqual({ to: 'sky', at: SKY.deck, float: true });
    expect(RealmGate.check('dungeon', pos(10, 300, 10), { up: false }, SKY)).toBeNull();
  });

  it('the sky sends the player down to the crown only when they fall below its deck floor', () => {
    expect(RealmGate.check('sky', pos(128, 3.9, 128), null, SKY)).toEqual({ to: 'dungeon', at: SKY.crown, float: true });
    expect(RealmGate.check('sky', pos(128, SKY_FLOOR_OUT, 128), null, SKY)).toBeNull();
    expect(RealmGate.check('sky', pos(128, 120, 128), null, SKY)).toBeNull();
  });

  it('the sky ignores the dungeon\'s top and the star pads', () => {
    expect(RealmGate.check('sky', pos(128, 600, 128), null, SKY)).toBeNull();
    expect(RealmGate.check('sky', pos(128, 120, 128), { up: true }, SKY)).toBeNull();
  });
});

/** A host that records every call, with `ready` set by the test. */
function fakeHost(ready: () => boolean) {
  const log: string[] = [];
  const passed: Travel[] = [];
  const fades: number[] = [];
  const host: RealmGateHost = {
    fade: k => { fades.push(k); log.push(`fade ${k.toFixed(2)}`); },
    pass: t => { passed.push(t); log.push('pass'); },
    ready,
  };
  return { host, log, passed, fades };
}

/** Advances the gate in 1/60 s steps for `seconds`. */
function run(g: RealmGate, seconds: number) {
  for (let t = 0; t < seconds - 1e-9; t += 1 / 60) g.update(1 / 60);
}

describe('RealmGate (the fade of a passage)', () => {
  const up: Travel = { to: 'sky', at: [128, 4, 128], float: true };

  it('is idle until started, and busy from the start until the fade back ends', () => {
    const { host } = fakeHost(() => true);
    const g = new RealmGate(host);
    expect(g.busy).toBe(false);
    g.start(up);
    expect(g.busy).toBe(true);
    run(g, GATE_FADE * 2 + 0.1);
    expect(g.busy).toBe(false);
  });

  it('fades out, passes once at full black, holds until the new world is ready, then fades back', () => {
    let ready = false;
    const { host, log, passed } = fakeHost(() => ready);
    const g = new RealmGate(host);
    g.start(up);
    run(g, GATE_FADE + 0.05);
    expect(passed).toEqual([up]);
    expect(log.indexOf('pass')).toBeGreaterThan(0);
    expect(log[log.indexOf('pass') + 1]).toBe('fade 1.00');
    run(g, 0.5);
    expect(g.busy).toBe(true);
    ready = true;
    run(g, 0.1);
    expect(g.busy).toBe(true);
    run(g, GATE_FADE + 0.05);
    expect(g.busy).toBe(false);
    expect(log[log.length - 1]).toBe('fade 0.00');
    expect(passed.length).toBe(1);
  });

  it('gives up waiting for the meshes after the hold maximum, so a slow world never locks the game', () => {
    const { host, passed } = fakeHost(() => false);
    const g = new RealmGate(host);
    g.start(up);
    run(g, GATE_FADE + GATE_HOLD_MAX + GATE_FADE + 0.2);
    expect(passed.length).toBe(1);
    expect(g.busy).toBe(false);
  });

  it('a second start while busy is ignored', () => {
    const { host, passed } = fakeHost(() => true);
    const g = new RealmGate(host);
    g.start(up);
    g.start({ to: 'dungeon', at: [0, 0, 0], float: true });
    run(g, GATE_FADE * 3);
    expect(passed).toEqual([up]);
  });

  it('cancel drops a travel in progress and clears the fade', () => {
    const { host, passed, fades } = fakeHost(() => true);
    const g = new RealmGate(host);
    g.start(up);
    run(g, 0.1);
    g.cancel();
    expect(g.busy).toBe(false);
    expect(fades[fades.length - 1]).toBe(0);
    run(g, GATE_FADE * 3);
    expect(passed).toEqual([]);
  });
});

describe('the hold starts on the frame after the pass (SKY.md §2.4)', () => {
  it('a world ready on the frame it is passed is not checked, and not faded in, on that frame', () => {
    const up: Travel = { to: 'sky', at: [128, 4, 128], float: true };
    const ready = vi.fn(() => true);
    const { host, passed } = fakeHost(ready);
    const g = new RealmGate(host);
    g.start(up);
    while (passed.length === 0) g.update(1 / 60);
    expect(ready).not.toHaveBeenCalled();
    g.update(1 / 60);
    expect(ready).toHaveBeenCalledTimes(1);
  });
});
