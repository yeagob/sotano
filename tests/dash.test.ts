// Irimi (docs/design/built/practices/DASH.md): the gestures, the dash geometry, and the Player moving through the
// real voxel collision. Every number here is one the design document states.
import { describe, expect, it } from 'vitest';
import { DoubleFlick, DoubleTap, stickDir, swipeDir, type DashDir } from '../src/input/gestures';
import { dashDisplacement, DASH_COOLDOWN, DASH_DIST, DASH_RISE, DASH_TIME } from '../src/entities/dash';
import { Player, type PlayerHooks, type PlayerMedium } from '../src/entities/player';
import { BASE_STATS, computeStats, fmtStat, STAT_LIMITS, type Stats } from '../src/core/stats';
import { swipeStartsAt } from '../src/input/touch';
import { CONTROL_ROWS } from '../src/input/bindings';
import { ITEMS } from '../src/content/items';
import type { Input } from '../src/input/input';

const DT = 1 / 60;
const hooks: PlayerHooks = { jump: v => v, land: () => {}, bump: v => v };
const dry: PlayerMedium = { feet: null, head: null };

describe('the double tap (keyboard)', () => {
  it('two presses of one direction within 0.25 s dash that way', () => {
    const t = new DoubleTap();
    expect(t.press('forward', 0)).toBeNull();
    expect(t.press('forward', 0.2)).toBe('forward');
  });

  it('a single tap, a slow double tap and two different directions do not dash', () => {
    const single = new DoubleTap();
    expect(single.press('left', 0)).toBeNull();
    expect(single.press('left', 1)).toBeNull();
    const slow = new DoubleTap();
    expect(slow.press('back', 0)).toBeNull();
    expect(slow.press('back', 0.3)).toBeNull();
    const mixed = new DoubleTap();
    expect(mixed.press('forward', 0)).toBeNull();
    expect(mixed.press('back', 0.1)).toBeNull();
  });

  it('a third press starts a new pair', () => {
    const t = new DoubleTap();
    expect(t.press('right', 0)).toBeNull();
    expect(t.press('right', 0.1)).toBe('right');
    expect(t.press('right', 0.2)).toBeNull();
    expect(t.press('right', 0.25)).toBe('right');
  });
});

describe('the double flick (gamepad left stick)', () => {
  it('push past 0.8, return under 0.3, push the same way within 0.25 s dashes', () => {
    const f = new DoubleFlick();
    expect(f.update(0, -0.9, 0)).toBeNull();
    expect(f.update(0, 0, 0.1)).toBeNull();
    expect(f.update(0, -0.9, 0.2)).toBe('forward');
  });

  it('a slow second flick, a flick that never returns, a flick the other way and a single push do not dash', () => {
    const slow = new DoubleFlick();
    slow.update(0, -0.9, 0); slow.update(0, 0, 0.1);
    expect(slow.update(0, -0.9, 0.3)).toBeNull();

    const held = new DoubleFlick();
    held.update(0.9, 0, 0); held.update(0.5, 0, 0.1);
    expect(held.update(0.9, 0, 0.2)).toBeNull();

    const other = new DoubleFlick();
    other.update(0.9, 0, 0); other.update(0, 0, 0.1);
    expect(other.update(-0.9, 0, 0.2)).toBeNull();

    const single = new DoubleFlick();
    expect(single.update(0, 0.9, 0)).toBeNull();
    expect(single.update(0, 0, 0.5)).toBeNull();
  });

  it('a stick pushed down is back, pushed right is right, pushed left is left', () => {
    expect(stickDir(0.5, 0.9)).toBe('back');
    expect(stickDir(0.9, 0.1)).toBe('right');
    expect(stickDir(-0.9, 0.1)).toBe('left');
    expect(stickDir(0, -0.9)).toBe('forward');
  });
});

describe('the swipe (touch)', () => {
  it('60 px within 0.25 s: up is forward, down is back, sideways is right or left', () => {
    expect(swipeDir(0, -60, 0.2)).toBe('forward');
    expect(swipeDir(0, 80, 0.1)).toBe('back');
    expect(swipeDir(80, 5, 0.1)).toBe('right');
    expect(swipeDir(-70, 10, 0.1)).toBe('left');
  });

  it('a short or slow stroke is not a dash', () => {
    expect(swipeDir(0, -59, 0.2)).toBeNull();
    expect(swipeDir(0, -200, 0.3)).toBeNull();
  });

  it('a swipe starts on the left half, outside the stick zone (42 % of the width)', () => {
    const w = 1280;
    expect(swipeStartsAt(600, w)).toBe(true);
    expect(swipeStartsAt(540, w)).toBe(true);
    expect(swipeStartsAt(500, w)).toBe(false);
    expect(swipeStartsAt(640, w)).toBe(false);
    expect(swipeStartsAt(900, w)).toBe(false);
  });
});

describe('the dash geometry', () => {
  it('a dash is 4.5 blocks in 0.18 s, and each direction is the camera\'s (yaw 0 looks north, -z)', () => {
    expect(DASH_DIST).toBe(4.5);
    expect(DASH_TIME).toBe(0.18);
    const at = (d: DashDir) => dashDisplacement(d, 0, 0, false);
    expect(at('forward').z).toBeCloseTo(-4.5, 9);
    expect(at('back').z).toBeCloseTo(4.5, 9);
    expect(at('right').x).toBeCloseTo(4.5, 9);
    expect(at('left').x).toBeCloseTo(-4.5, 9);
    expect(at('right').z).toBeCloseTo(0, 9);
  });

  it('forward follows the pitch: looking up rises, the rise is capped at 3.5 blocks, and the length stays 4.5', () => {
    expect(DASH_RISE).toBe(3.5);
    const up = dashDisplacement('forward', 0, Math.PI / 2, false);
    expect(up.y).toBeCloseTo(3.5, 9);
    expect(Math.abs(up.x) + Math.abs(up.z)).toBeLessThan(0.1);
    const tilted = dashDisplacement('forward', 0, 0.3, false);
    expect(tilted.y).toBeGreaterThan(0);
    expect(Math.hypot(tilted.x, tilted.y, tilted.z)).toBeCloseTo(4.5, 9);
    expect(dashDisplacement('forward', 0, -Math.PI / 2, false).y).toBeCloseTo(-3.5, 9);
    expect(dashDisplacement('back', 0, Math.PI / 2, false).y).toBe(0);
  });

  it('in water a dash covers half the distance', () => {
    const d = dashDisplacement('forward', 0, 0, true);
    expect(d.z).toBeCloseTo(-2.25, 9);
    expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(2.25, 9);
  });
});

// A world of blocks: a floor under y = 0, an optional wall at block x, an optional ceiling at block y.
function world(o: { wallX?: number; ceilingY?: number } = {}) {
  return (x: number, y: number) =>
    y < 0 || (o.wallX !== undefined && x === o.wallX && y >= 0) || (o.ceilingY !== undefined && y >= o.ceilingY);
}

function rig(solid: ReturnType<typeof world>, dash = 1) {
  const p = new Player();
  const stats: Stats = computeStats(dash ? [{ stat: 'dash', layer: 'add', value: 1, source: 'test' }] : []);
  let pending: DashDir | null = null;
  const input = {
    hit: (a: string) => a === 'dash' && pending !== null,
    get dashDir() { return pending; },
    held: () => false,
    move: { x: 0, y: 0 },
    lookDX: 0, lookDY: 0, sensitivity: 0.0022,
  } as unknown as Input;
  const step = (dt = DT, dir: DashDir | null = null) => {
    pending = dir;
    p.update(dt, input, stats, solid, hooks, dry);
    pending = null;
  };
  const run = (seconds: number, dt = DT) => { for (let t = 0; t < seconds - 1e-9; t += dt) step(dt); };
  return { p, step, run, stats };
}

describe('the Player dashes through the voxel collision', () => {
  it('on open floor a forward dash moves 4.5 blocks in 0.18 s, then the body stops', () => {
    const r = rig(world());
    r.p.spawnAt(1.5, 0.5, 0.5); r.p.yaw = -Math.PI / 2;
    r.run(0.3);
    expect(r.p.body.onGround).toBe(true);
    const x0 = r.p.body.x;
    r.step(0.01, 'forward');
    for (let i = 0; i < 17; i++) r.step(0.01);
    expect(r.p.body.x - x0).toBeCloseTo(4.5, 1);
    expect(r.p.dashT).toBe(0);
  });

  it('into a wall the dash stops at its face and never clips into the block', () => {
    const r = rig(world({ wallX: 6 }));
    r.p.spawnAt(1.5, 0.5, 0.5); r.p.yaw = -Math.PI / 2;
    r.run(0.3);
    r.step(DT, 'forward');
    r.run(0.5);
    expect(r.p.body.x + r.p.body.hw).toBeLessThanOrEqual(6 + 1e-6);
    expect(Math.abs(r.p.body.x - 5.7)).toBeLessThan(0.05);
  });

  it('looking straight up, a forward dash rises 3.5 blocks and stops at a ceiling', () => {
    const r = rig(world());
    r.p.spawnAt(2.5, 0, 0.5); r.p.yaw = 0; r.p.pitch = Math.PI / 2;
    r.run(0.3);
    const y0 = r.p.body.y;
    r.step(DT, 'forward');
    r.run(0.18);
    expect(Math.abs(r.p.body.y - y0 - 3.5)).toBeLessThan(0.05);

    const low = rig(world({ ceilingY: 2 }));
    low.p.spawnAt(2.5, 0, 0.5); low.p.yaw = 0; low.p.pitch = Math.PI / 2;
    low.run(0.3);
    low.step(DT, 'forward');
    low.run(0.25);
    expect(low.p.body.y + low.p.body.h).toBeLessThanOrEqual(2 + 1e-6);
  });

  it('after a dash the vertical speed restarts at 0: no fall build-up', () => {
    const r = rig(world());
    r.p.spawnAt(2.5, 3, 0.5); r.p.yaw = 0; r.p.pitch = 0.2;
    r.step(0.01, 'forward');
    for (let i = 0; i < 17; i++) r.step(0.01);
    // the frame the dash ends: the rise is over and the vertical speed is back at 0 (gravity has not yet run)
    expect(r.p.dashT).toBe(0);
    expect(r.p.body.vy).toBe(0);
  });

  it('the cooldown is 0.8 s from the start of a dash', () => {
    expect(DASH_COOLDOWN).toBe(0.8);
    const r = rig(world());
    r.p.spawnAt(1.5, 0.5, 0.5); r.p.yaw = -Math.PI / 2;
    r.run(0.3);
    expect(r.p.startDash('forward', 1, dry)).toBe(true);
    expect(r.p.startDash('forward', 1, dry)).toBe(false);
    r.run(0.5);
    expect(r.p.startDash('forward', 1, dry)).toBe(false);
    r.run(0.4);
    expect(r.p.startDash('forward', 1, dry)).toBe(true);
  });

  it('one dash in the air: a second one is refused until landing, and landing refreshes it', () => {
    // spawned high enough that the fall outlasts the cooldown: the refusal is the air rule, not the timer
    const air = rig(world());
    air.p.spawnAt(1.5, 20, 0.5); air.p.yaw = -Math.PI / 2;
    expect(air.p.body.onGround).toBe(false);
    expect(air.p.startDash('right', 1, dry)).toBe(true);
    air.run(0.9);
    expect(air.p.body.onGround).toBe(false);
    expect(air.p.startDash('right', 1, dry)).toBe(false);
    let t = 0;
    while (!air.p.body.onGround && t < 10) { air.run(DT); t += DT; }
    expect(air.p.body.onGround).toBe(true);
    expect(air.p.startDash('right', 1, dry)).toBe(true);
  });

  it('a dash makes the player invulnerable for its length, and never shortens a longer invulnerability', () => {
    const r = rig(world());
    r.p.spawnAt(1.5, 0.5, 0.5); r.p.yaw = -Math.PI / 2;
    r.run(0.3);
    r.p.startDash('forward', 1, dry);
    expect(r.p.invulnT).toBeGreaterThanOrEqual(DASH_TIME - 1e-9);
    r.run(0.25);
    expect(r.p.invulnT).toBe(0);
    r.p.invulnT = 0.9;
    r.p.startDash('back', 1, dry);
    expect(r.p.invulnT).toBeCloseTo(0.9, 9);
  });

  it('in water a dash covers half the distance', () => {
    const r = rig(world());
    r.p.spawnAt(1.5, 0.5, 0.5); r.p.yaw = -Math.PI / 2;
    r.run(0.3);
    const wet = { feet: { fluid: { wade: 0.5 } }, head: null } as unknown as PlayerMedium;
    const x0 = r.p.body.x;
    r.p.startDash('forward', 1, wet);
    r.run(0.25);
    expect(Math.abs(r.p.body.x - x0 - 2.25)).toBeLessThan(0.1);
  });

  it('without the dash stat nothing happens: no dash, no cooldown, no invulnerability, no motion', () => {
    expect(BASE_STATS.dash).toBe(0);
    const r = rig(world(), 0);
    r.p.spawnAt(1.5, 0.5, 0.5); r.p.yaw = -Math.PI / 2;
    r.run(0.3);
    const x0 = r.p.body.x;
    expect(r.p.startDash('forward', r.stats.dash, dry)).toBe(false);
    r.step(DT, 'forward');
    expect(r.p.dashT).toBe(0);
    expect(r.p.dashCool).toBe(0);
    expect(r.p.invulnT).toBe(0);
    expect(r.p.body.x - x0).toBeCloseTo(0, 1);
  });

  it('the dash stat is a 0 or 1 switch with its own label and format', () => {
    expect(STAT_LIMITS.dash).toEqual([0, 1]);
    expect(fmtStat('dash', 0)).not.toBe(fmtStat('dash', 1));
  });
});

describe('the Irimi practice', () => {
  it('is a body practice on the treasure pool that grants the dash stat', () => {
    const irimi = ITEMS.find(i => i.id === 'irimi');
    expect(irimi).toBeDefined();
    expect(irimi!.tags).toContain('body');
    expect(irimi!.pools).toEqual({ treasure: 1 });
    expect(irimi!.stats).toMatchObject([{ stat: 'dash', layer: 'add', value: 1 }]);
  });

  it('has its row on the pause card', () => {
    expect(CONTROL_ROWS).toContain('dash');
  });
});
