// Fartlek (run) and Child's Pose (crouch): the stance rules and the player's pace (RUN-AND-CROUCH.md).
import { describe, expect, it } from 'vitest';
import { BASE_STATS, type Stats } from '../src/core/stats';
import { Player } from '../src/entities/player';
import { CROUCH_H, CROUCH_SPEED, EYE_CROUCH, RUN_SPEED, STAND_H, crouchedContact, roomToStand, supportedAt } from '../src/entities/stance';
import type { Input } from '../src/input/input';
import type { Body } from '../src/physics/voxel-collide';

type Solid = (x: number, y: number, z: number) => boolean;
type Move = { x: number; y: number };

const STILL: Move = { x: 0, y: 0 };
const EAST: Move = { x: 1, y: 0 };   // +x at yaw 0
const body = (over: Partial<Body> = {}): Body => ({ x: 0.5, y: 0, z: 0.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: STAND_H, onGround: true, ...over });

/** A fake of the input: only what Player.update reads. `held` are the actions held. */
function fakeInput(held: string[] = [], move: Move = STILL): Input {
  return {
    lookDX: 0, lookDY: 0, sensitivity: 0.0022, dashDir: null,
    hit: () => false,
    held: (a: string) => held.includes(a),
    move,
  } as unknown as Input;
}

const hooks = { jump: (v: number) => v, land: () => {}, bump: (s: number) => s };
const stats = (over: Partial<Stats> = {}): Stats => ({ ...BASE_STATS, run: 0, crouch: 0, ...over });

/** Floor: every cell below y = 0 is solid. */
const floor: Solid = (_x, y) => y < 0;

function frames(p: Player, s: Stats, solid: Solid, input: Input, seconds: number) {
  for (let i = 0; i < Math.round(seconds * 60); i++) p.update(1 / 60, input, s, solid, hooks);
}

/** A player standing still on the floor, with the given held actions. */
function standing(s: Stats, x = 0.5, solid: Solid = floor, held: string[] = []): Player {
  const p = new Player();
  p.spawnAt(x, 0, 0.5);
  frames(p, s, solid, fakeInput(held), 0.5);
  return p;
}

/** Walks east: a warm-up so the walk blend has reached its pace, then the distance covered over `seconds`. */
function eastDistance(p: Player, s: Stats, solid: Solid, held: string[], seconds: number) {
  frames(p, s, solid, fakeInput(held, EAST), 0.5);
  const x0 = p.body.x;
  frames(p, s, solid, fakeInput(held, EAST), seconds);
  return p.body.x - x0;
}

describe('the stance rules', () => {
  it('crouching is one block shorter, and fits a gap one block high', () => {
    expect(CROUCH_H).toBeCloseTo(STAND_H - 1);
    expect(CROUCH_H).toBeLessThan(1);
  });

  it('crouched contact damage is halved and rounded up to whole points', () => {
    expect(crouchedContact(8)).toBe(4);
    expect(crouchedContact(3)).toBe(2);
    expect(crouchedContact(1)).toBe(1);
    expect(crouchedContact(0)).toBe(0);
  });

  it('a standing body has room only when the band above its crouched top is free under its footprint', () => {
    const b = body();
    expect(roomToStand(floor, b)).toBe(true);
    // a block one up, over the body's footprint: no room to stand
    const ceiling: Solid = (x, y, z) => floor(x, y, z) || (y === 1 && x === 0 && z === 0);
    expect(roomToStand(ceiling, b)).toBe(false);
    // the same block beside the footprint: room
    const beside: Solid = (x, y, z) => floor(x, y, z) || (y === 1 && x === 1 && z === 0);
    expect(roomToStand(beside, b)).toBe(true);
  });

  it('a crouched body is held by ground under any part of its footprint', () => {
    const edge: Solid = (x, y) => y < 0 && x <= 5;
    const b = body({ x: 5.5 });
    expect(supportedAt(edge, b, 5.5, 0.5)).toBe(true);   // footprint 5.2..5.8 touches cell 5
    expect(supportedAt(edge, b, 6.5, 0.5)).toBe(false);  // footprint 6.2..6.8 is over nothing
  });
});

describe('the player: run and crouch', () => {
  it('running is 45% faster on the ground, and is off without the stat', () => {
    const s = stats({ run: 1 });
    const plain = eastDistance(standing(stats()), stats(), floor, [], 0.5);
    const running = eastDistance(standing(s), s, floor, ['run'], 0.5);
    expect(running / plain).toBeCloseTo(RUN_SPEED, 1);
    // without the stat, holding the key changes nothing
    const none = eastDistance(standing(stats()), stats(), floor, ['run'], 0.5);
    expect(none).toBeCloseTo(plain, 3);
  });

  it('crouching lowers the body and the eye, and slows the walk to 45%', () => {
    const s = stats({ crouch: 1 });
    const plain = eastDistance(standing(s), s, floor, [], 0.5);
    const q = standing(s, 0.5, floor, ['crouch']);
    expect(q.crouching).toBe(true);
    expect(q.body.h).toBeCloseTo(CROUCH_H);
    expect(q.eyeHeight).toBeCloseTo(EYE_CROUCH);
    const crouched = eastDistance(q, s, floor, ['crouch'], 0.5);
    expect(crouched / plain).toBeCloseTo(CROUCH_SPEED, 1);
  });

  it('crouch without the stat does nothing', () => {
    const p = standing(stats(), 0.5, floor, ['crouch']);
    expect(p.crouching).toBe(false);
    expect(p.body.h).toBe(STAND_H);
  });

  it('running is refused while crouched: the crouch pace wins', () => {
    const s = stats({ crouch: 1, run: 1 });
    const onlyCrouch = eastDistance(standing(s), s, floor, ['crouch'], 0.5);
    const both = eastDistance(standing(s), s, floor, ['crouch', 'run'], 0.5);
    expect(both).toBeCloseTo(onlyCrouch, 3);
  });

  it('standing up is refused under a ceiling and happens once there is room', () => {
    const s = stats({ crouch: 1 });
    const ceiling: Solid = (x, y, z) => floor(x, y, z) || (y === 1 && x === 0 && z === 0);
    const p = standing(s, 0.5, floor, ['crouch']);
    expect(p.crouching).toBe(true);
    // the key is let go under the ceiling: the body stays crouched
    frames(p, s, ceiling, fakeInput([]), 0.5);
    expect(p.crouching).toBe(true);
    expect(p.body.h).toBeCloseTo(CROUCH_H);
    // the ceiling is gone: it stands up
    frames(p, s, floor, fakeInput([]), 0.2);
    expect(p.crouching).toBe(false);
    expect(p.body.h).toBe(STAND_H);
  });

  it('a crouched body never walks off a ledge; a standing one does', () => {
    // solid cells up to x = 5 (the ledge edge is at x = 6), nothing beyond
    const ledge: Solid = (x, y) => y < 0 && x <= 5;
    const crouched = standing(stats({ crouch: 1 }), 4.5, ledge, ['crouch']);
    frames(crouched, stats({ crouch: 1 }), ledge, fakeInput(['crouch'], EAST), 3);
    expect(crouched.body.y).toBe(0);
    // the feet stop where the footprint still touches ground: centre about 0.3 short of the edge
    expect(crouched.body.x).toBeGreaterThan(6.0);
    expect(crouched.body.x).toBeLessThan(6.35);

    const standingP = standing(stats(), 4.5, ledge);
    frames(standingP, stats(), ledge, fakeInput([], EAST), 3);
    expect(standingP.body.y).toBeLessThan(0);
  });
});
