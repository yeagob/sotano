// The player's verbs for the sky (docs/architecture/SKY.md §6, §9): a push, a hold, a carry,
// the air jumps on the ladder 1× → 2× → 8×, the apex cap and the sky's `minJump`.

import { describe, expect, it } from 'vitest';
import { AIR_JUMP_CLEARANCE, APEX_CAP, Player, type PlayerHooks, type PlayerUpdateOptions } from '../src/entities/player';
import { BASE_STATS, computeStats, type Stats } from '../src/core/stats';
import { AIR_CONTROL, GRAVITY, JUMP_V, LADDER, apex, velocity } from '../src/physics/jump';
import type { Input } from '../src/input/input';

/** Open ground: every cell at y ≤ 0 is solid, so the feet rest at y = 1. */
const flat = (_x: number, y: number) => y <= 0;
const air = () => false;

function rig(stats: Partial<Stats> = {}, solid = flat, opts: PlayerUpdateOptions = {}) {
  const p = new Player();
  p.spawnAt(0.5, 1, 0.5);
  p.body.onGround = solid === flat;
  const pressed = new Set<string>();
  const held = new Set<string>();
  const move = { x: 0, y: 0 };
  const look = { dx: 0 };
  const input = {
    hit: (a: string) => pressed.has(a), held: (a: string) => held.has(a), move,
    get lookDX() { return look.dx; }, lookDY: 0, sensitivity: 1,
  } as unknown as Input;
  const jumps: { v: number; air: number }[] = [];
  const hooks: PlayerHooks = { jump: (v, a) => { jumps.push({ v, air: a }); return v; }, land: () => {}, bump: v => v };
  const s = { ...BASE_STATS, ...stats };
  const step = (dt: number) => { p.update(dt, input, s, solid, hooks, undefined, opts); pressed.clear(); look.dx = 0; };
  const run = (seconds: number, dt = 1 / 60) => { for (let t = 0; t < seconds - 1e-9; t += dt) step(dt); };
  return { p, pressed, held, move, look, jumps, step, run, stats: s };
}

describe('push (SKY.md §6)', () => {
  it('moves the body and fades on the ground', () => {
    const r = rig();
    r.p.push(6, 0, 0);
    r.run(0.1);
    expect(r.p.body.x).toBeGreaterThan(0.5 + 0.2);
    r.run(1);
    const x = r.p.body.x;
    expect(Math.abs(r.p.body.vx)).toBeLessThan(0.01);
    r.run(0.5);
    expect(r.p.body.x - x).toBeLessThan(0.01);      // it has come to rest
    expect(r.p.body.x).toBeLessThan(0.5 + 1.5);     // a short shove, not a slide
  });

  it('carries further in the air and still fades', () => {
    const ground = rig(), flying = rig({}, air);
    ground.p.push(6, 0, 0); flying.p.push(6, 0, 0);
    ground.run(0.4); flying.run(0.4);
    expect(flying.p.body.x).toBeGreaterThan(ground.p.body.x);
    flying.run(3);
    expect(Math.abs(flying.p.body.vx)).toBeLessThan(0.05);
  });

  it('adds to the vertical speed, which gravity takes back', () => {
    const r = rig();
    r.p.push(0, 6, 0);
    r.step(1 / 60);
    expect(r.p.body.y).toBeGreaterThan(1);
    r.run(2);
    expect(r.p.body.onGround).toBe(true);
    expect(r.p.body.y).toBeCloseTo(1, 6);
  });

  it('lies over the walk: walking on keeps its own speed once the push has faded', () => {
    const r = rig();
    r.move.y = 1;                                     // forward: -z at yaw 0
    r.run(0.5);
    r.p.push(5, 0, 0);
    r.run(1.5);
    expect(r.p.body.vz).toBeCloseTo(-4.6, 3);        // the full walking speed
    expect(Math.abs(r.p.body.vx)).toBeLessThan(0.01);
  });

  it('is stopped by a wall and ignores a broken value', () => {
    const wall = (x: number, y: number) => y <= 0 || x >= 2;
    const r = rig({}, wall);
    r.p.body.onGround = true;
    r.p.push(20, 0, 0);
    r.run(1);
    expect(r.p.body.x).toBeLessThanOrEqual(2 - r.p.body.hw);
    expect(Math.abs(r.p.body.vx)).toBeLessThan(0.01);
    r.p.push(NaN, 0, Infinity);
    r.run(0.1);
    expect(Number.isFinite(r.p.body.x) && Number.isFinite(r.p.body.vx)).toBe(true);
  });
});

describe('hold (SKY.md §6)', () => {
  it('stops walking and jumping, keeps looking and the fire cooldown, and ends', () => {
    const r = rig();
    r.p.hold(1);
    r.move.y = 1;
    r.look.dx = 0.3;
    r.pressed.add('jump');
    r.step(1 / 60);
    expect(r.p.yaw).toBeCloseTo(-0.3, 9);            // looking stays
    r.p.fireCooldown = 0.5;
    r.run(0.5);
    expect(r.p.fireCooldown).toBeLessThan(0.05);      // the gun keeps cooling, so shooting stays
    expect(r.jumps).toHaveLength(0);
    expect(Math.hypot(r.p.body.x - 0.5, r.p.body.z - 0.5)).toBeLessThan(1e-6);
    expect(r.p.wishX).toBe(0); expect(r.p.wishZ).toBe(0);
    r.p.hold(0.2);                                    // a shorter hold does not cut the longer one
    r.run(0.6);
    expect(r.p.heldT).toBe(0);
    const z = r.p.body.z;
    r.run(0.3);
    expect(r.p.body.z).toBeLessThan(z - 0.5);         // free again
  });

  it('a held body is still pushed', () => {
    const r = rig();
    r.p.hold(1);
    r.p.push(6, 0, 0);
    r.run(0.3);
    expect(r.p.body.x).toBeGreaterThan(0.7);
  });
});

describe('carry (SKY.md §6)', () => {
  it('arrives in its time, eased, with input held and gravity waiting', () => {
    const r = rig({}, air);
    r.move.y = 1;
    r.p.carry({ x: 5.5, y: 4, z: 0.5 }, 1);
    expect(r.p.carried).toBe(true);
    r.run(0.5);
    expect(r.p.body.x).toBeGreaterThan(1.5);
    expect(r.p.body.x).toBeLessThan(5.5);
    expect(r.p.body.z).toBeCloseTo(0.5, 6);          // walking forward did nothing
    r.run(0.5);
    expect(r.p.carried).toBe(false);
    expect(r.p.body.x).toBeCloseTo(5.5, 6);
    expect(r.p.body.y).toBeCloseTo(4, 6);
    r.move.y = 0;
    r.run(0.3);
    expect(r.p.body.y).toBeLessThan(4);               // gravity again
  });

  it('stops against a block instead of passing through it', () => {
    const wall = (x: number) => x === 3;
    const r = rig({}, wall);
    r.p.carry({ x: 6.5, y: 1, z: 0.5 }, 0.5);
    r.run(0.6);
    expect(r.p.body.x).toBeLessThanOrEqual(3 - r.p.body.hw);
  });
});

/** Jump from the ground, then press again at each apex; returns how high each jump rose from its press. */
function ladder(stats: Partial<Stats>, presses: number, dt = 1 / 2000) {
  const r = rig(stats);
  const rises: number[] = [];
  let from = r.p.body.y, top = from, rising = false;
  r.pressed.add('jump');
  for (let t = 0; t < 12 && rises.length < presses; t += dt) {
    r.step(dt);
    top = Math.max(top, r.p.body.y);
    if (r.p.body.vy > 0) rising = true;
    else if (rising) {
      rising = false;
      rises.push(top - from);
      from = top = r.p.body.y;
      r.pressed.add('jump');
    }
  }
  return { rises, r };
}

describe('air jumps (SKY.md §9)', () => {
  it('with airJumps 2 the three apexes follow 1×, 2× and 8×', () => {
    const { rises, r } = ladder({ airJumps: 2 }, 3);
    expect(rises).toHaveLength(3);
    for (let k = 0; k < 3; k++) expect(rises[k]).toBeCloseTo(apex(k), 1);
    expect(rises[1] / rises[0]).toBeCloseTo(2, 1);
    expect(rises[2] / rises[0]).toBeCloseTo(8, 1);
    expect(r.jumps.map(j => j.air)).toEqual([0, 1, 2]);
    expect(r.jumps[1].v).toBeCloseTo(velocity(1), 9);
    expect(r.jumps[2].v).toBeCloseTo(velocity(2), 9);
  });

  it('with airJumps 0 a press in the air does nothing, as before', () => {
    const { rises, r } = ladder({}, 2);
    expect(r.jumps).toHaveLength(1);
    expect(rises[0]).toBeCloseTo(apex(0), 1);
  });

  it('beyond the ladder each air jump climbs its last step', () => {
    const { r } = ladder({ airJumps: 4 }, 5);
    expect(r.jumps.map(j => j.air)).toEqual([0, 1, 2, 3, 4]);
    expect(r.jumps[4].v).toBeCloseTo(Math.min(velocity(LADDER.length - 1), Math.sqrt(2 * GRAVITY * APEX_CAP)), 9);
  });

  it('no air jump near the ground: the press waits and becomes a ground jump on landing', () => {
    const r = rig({ airJumps: 2 });
    r.p.spawnAt(0.5, 3, 0.5);
    r.p.body.onGround = false;
    r.step(1 / 60);                                  // the coyote time is never earned from the air
    while (r.p.body.y - 1 > AIR_JUMP_CLEARANCE - 0.1) r.step(1 / 240);
    r.pressed.add('jump');
    r.step(1 / 240);
    expect(r.jumps).toHaveLength(0);
    expect(r.p.airStep).toBe(0);
    for (let i = 0; i < 30 && !r.jumps.length; i++) r.step(1 / 240);
    expect(r.jumps).toEqual([{ v: JUMP_V, air: 0 }]);
  });

  it('far from the ground a press spends one, and landing refills them', () => {
    const r = rig({ airJumps: 2 }, (_x, y) => y <= -20);
    r.p.spawnAt(0.5, 1, 0.5);
    r.p.body.onGround = false;
    r.run(0.2);
    r.pressed.add('jump');
    r.step(1 / 60);
    expect(r.jumps).toEqual([{ v: velocity(1), air: 1 }]);
    expect(r.p.airStep).toBe(1);
    r.run(4);
    expect(r.p.body.onGround).toBe(true);
    expect(r.p.airStep).toBe(0);
  });

  it('never while swimming or falling from heaven', () => {
    const water = { fluid: true, swim: true, wade: 0.5 } as never;
    const r = rig({ airJumps: 2 }, air);
    r.p.body.onGround = false;
    r.run(0.2);
    r.pressed.add('jump');
    r.p.update(1 / 60, { hit: () => true, held: () => false, move: { x: 0, y: 0 }, lookDX: 0, lookDY: 0, sensitivity: 0 } as unknown as Input,
      r.stats, air, { jump: v => { r.jumps.push({ v, air: -1 }); return v; }, land: () => {}, bump: v => v }, { feet: water, head: water });
    expect(r.jumps).toHaveLength(0);
    r.p.float = true;
    r.pressed.add('jump');
    r.step(1 / 60);
    expect(r.jumps).toHaveLength(0);
  });

  it('the third jump steers fully and adds no forward speed', () => {
    const r = rig({ airJumps: 2 }, air);
    r.p.body.onGround = false;
    r.run(0.2);
    r.pressed.add('jump'); r.step(1 / 60);
    r.pressed.add('jump'); r.step(1 / 60);
    expect(r.p.airStep).toBe(2);
    const vz = r.p.body.vz;
    expect(vz).toBeCloseTo(0, 9);                     // no boost from the jump itself
    r.move.y = 1;
    r.step(1 / 60);
    const k1 = 1 - Math.exp(-14 * 1 * (1 / 60));
    expect(r.p.body.vz).toBeCloseTo(-4.6 * k1, 6);   // full air control
    expect(-r.p.body.vz).toBeGreaterThan(4.6 * (1 - Math.exp(-14 * AIR_CONTROL / 60)));
  });

  it('no jump rises past the cap, however high the jump stat', () => {
    const { rises, r } = ladder({ jump: 5, airJumps: 2 }, 3);
    expect(rises[0]).toBeCloseTo(apex(0, 5), 1);      // a ground jump is far below the cap
    expect(rises[2]).toBeLessThanOrEqual(APEX_CAP + 0.01);
    expect(rises[2]).toBeGreaterThan(APEX_CAP - 0.1);
    expect(r.jumps[2].v).toBeCloseTo(Math.sqrt(2 * GRAVITY * APEX_CAP), 9);
  });
});

describe('minJump (SKY.md §2.5)', () => {
  it('clamps a lowered jump, and leaves a higher one alone', () => {
    const low = rig({ jump: 0.5 }, flat, { minJump: 1 });
    low.pressed.add('jump'); low.step(1 / 60);
    expect(low.jumps[0].v).toBeCloseTo(JUMP_V, 9);
    const plain = rig({ jump: 0.5 });
    plain.pressed.add('jump'); plain.step(1 / 60);
    expect(plain.jumps[0].v).toBeCloseTo(JUMP_V * Math.sqrt(0.5), 9);
    const high = rig({ jump: 2 }, flat, { minJump: 1 });
    high.pressed.add('jump'); high.step(1 / 60);
    expect(high.jumps[0].v).toBeCloseTo(JUMP_V * Math.SQRT2, 9);
  });
});

describe('the airJumps stat', () => {
  it('is 0 by default, at most 4 and never negative', () => {
    expect(BASE_STATS.airJumps).toBe(0);
    expect(computeStats([{ stat: 'airJumps', layer: 'add', value: 9, source: 't' }]).airJumps).toBe(4);
    expect(computeStats([{ stat: 'airJumps', layer: 'add', value: -3, source: 't' }]).airJumps).toBe(0);
  });
});
