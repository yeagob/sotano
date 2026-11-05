// Fall recovery in Totality (SKY.md §4): the updraft remembers the last checkpoint stood on, catches a fall CATCH
// blocks below it and carries the player back onto it in CARRY seconds. Headless: a fake host whose player moves by a
// small simulation (gravity while free, a straight ease while carried, like Player.carry).

import { describe, expect, it } from 'vitest';
import type { Body } from '../src/physics/voxel-collide';
import { CARRY, CATCH, Updraft } from '../src/sky/laws/updraft';
import type { Place, SkyHost, Vec3 } from '../src/sky/types';

const DT = 1 / 60;
const CP: Place = { id: 5, kind: 'top', x: 100, y: 500, z: 100, w: 3, d: 3, tag: 6 };
const OTHER: Place = { id: 11, kind: 'top', x: 140, y: 560, z: 100, w: 3, d: 3, tag: 12 };

function fakeHost() {
  const body: Body = { x: 100.5, y: CP.y, z: 100.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  let carry: { from: Vec3; to: Vec3; s: number; t: number } | null = null;
  const calls = { carry: [] as { to: Vec3; s: number }[], fx: [] as string[], cue: [] as string[], toast: [] as string[] };
  let t = 0;
  const host = {
    time: () => t,
    player: () => ({
      body, eye: { x: 0, y: 0, z: 0 }, aim: { x: 1, y: 0, z: 0 }, hand: [], held: false,
      push() {}, slow() {}, hold() {},
      carry(to: Vec3, s: number) { calls.carry.push({ to, s }); carry = { from: { x: body.x, y: body.y, z: body.z }, to, s, t: 0 }; },
    }),
    fx: (k: string) => calls.fx.push(k),
    cue: (k: string) => calls.cue.push(k),
    toast: (k: string) => calls.toast.push(k),
  } as unknown as SkyHost;
  /** One frame: the body moves (carried or falling), then the updraft runs, as in SkyRealm.update. */
  const step = (u: Updraft) => {
    t += DT;
    if (carry) {
      carry.t = Math.min(carry.s, carry.t + DT);
      const k = carry.t / carry.s, e = k * k * (3 - 2 * k);
      body.x = carry.from.x + (carry.to.x - carry.from.x) * e;
      body.y = carry.from.y + (carry.to.y - carry.from.y) * e;
      body.z = carry.from.z + (carry.to.z - carry.from.z) * e;
      if (carry.t >= carry.s) carry = null;
    } else if (!body.onGround) {
      body.vy = Math.max(body.vy - 30 * DT, -40);
      body.y += body.vy * DT;
    }
    u.update(DT);
  };
  return { host, body, calls, step };
}

describe('the updraft (fall recovery in Totality)', () => {
  it('remembers the checkpoint the player stands on, not one they only fly over', () => {
    const { host, body, step } = fakeHost();
    const u = new Updraft(host, [CP, OTHER]);
    expect(u.checkpoint).toBeNull();
    body.onGround = false;
    body.y = CP.y + 2;
    step(u);
    expect(u.checkpoint).toBeNull();
    body.y = CP.y;
    body.onGround = true;
    step(u);
    expect(u.checkpoint).toBe(CP);
  });

  it('a fall below the line ends on the checkpoint, in CARRY seconds', () => {
    const { host, body, calls, step } = fakeHost();
    const u = new Updraft(host, [CP]);
    step(u);
    // step off the edge and fall
    body.x = 104; body.onGround = false;
    let frames = 0;
    while (!u.carrying && frames++ < 600) step(u);
    expect(u.carrying).toBe(true);
    expect(body.y).toBeLessThan(CP.y - CATCH);
    expect(body.y).toBeGreaterThan(CP.y - CATCH - 1);
    expect(calls.fx).toContain('updraft');
    expect(calls.cue).toEqual(['core.updraft']);
    expect(calls.toast).toEqual(['toast.updraft']);
    let carried = 0;
    while (u.carrying && carried < 600) { step(u); carried++; }
    expect(carried * DT).toBeCloseTo(CARRY, 1);
    const total = calls.carry.reduce((s, c) => s + c.s, 0);
    expect(total).toBeCloseTo(CARRY, 2);
    // two legs: up beside the slab and above its top, then in onto its centre
    expect(calls.carry).toHaveLength(2);
    expect(calls.carry[0].to.y).toBeGreaterThan(CP.y);
    expect(Math.abs(calls.carry[0].to.x - 100.5)).toBeGreaterThan(1.5);
    expect(body.x).toBeCloseTo(100.5, 3);
    expect(body.z).toBeCloseTo(100.5, 3);
    expect(Math.abs(body.y - CP.y)).toBeLessThan(0.1);
  });

  it('a fall that stays above the line is not caught', () => {
    const { host, body, calls, step } = fakeHost();
    const u = new Updraft(host, [CP]);
    step(u);
    body.onGround = false;
    while (body.y > CP.y - CATCH + 1) step(u);
    body.onGround = true; body.vy = 0;
    step(u);
    expect(u.carrying).toBe(false);
    expect(calls.carry).toHaveLength(0);
  });

  it('without a checkpoint nothing is caught', () => {
    const { host, body, calls, step } = fakeHost();
    const u = new Updraft(host, [CP]);
    body.x = 300; body.onGround = false;
    for (let i = 0; i < 300; i++) step(u);
    expect(calls.carry).toHaveLength(0);
  });

  it('arriving far below (a teleport, not a fall) is not carried up', () => {
    const { host, body, calls, step } = fakeHost();
    const u = new Updraft(host, [CP]);
    step(u);
    body.y = 40; body.onGround = false;
    for (let i = 0; i < 30; i++) step(u);
    expect(calls.carry).toHaveLength(0);
  });

  it('the toast shows on the first catch only', () => {
    const { host, body, calls, step } = fakeHost();
    const u = new Updraft(host, [CP]);
    for (let n = 0; n < 2; n++) {
      body.y = CP.y; body.x = 100.5; body.onGround = true; body.vy = 0;
      step(u);
      body.x = 104; body.onGround = false;
      let guard = 0;
      while (!u.carrying && guard++ < 600) step(u);
      while (u.carrying) step(u);
    }
    expect(calls.carry).toHaveLength(4);
    expect(calls.toast).toEqual(['toast.updraft']);
  });
});
