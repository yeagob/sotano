// The Wall Jump (issue #294, docs/design/built/practices/body/WALL-JUMP.md): one more air jump, usable only with a solid
// block touching the body's side. It is the last of the airJumps counter, so it refreshes on landing like the others.

import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import wallJump from '../src/content/items/wall-jump';
import { SYNERGIES } from '../src/content/synergies';
import { computeStats, BASE_STATS, type Stats } from '../src/core/stats';
import { Player, type PlayerHooks } from '../src/entities/player';
import type { Input } from '../src/input/input';
import { velocity } from '../src/physics/jump';
import { copyMods } from '../src/items/types';
import { validateCatalogue, validateItem } from '../src/items/validate';

type Solid = (x: number, y: number, z: number) => boolean;

/** Open air: no block anywhere near (the floor is far below). */
const openAir: Solid = (_x, y) => y <= -200;
/** A wall whose face is at x = 1 (the body stands at x = 0.7 with its right side against it), the floor far below. */
const wall: Solid = (x, y) => y <= -200 || x >= 1;
/** A wall that stands on a floor at y ≤ 0 (feet rest at y = 1), for the landing test. */
const wallOnFloor: Solid = (x, y) => y <= 0 || (x >= 1 && y >= 1 && y <= 30);
/** The body's x that puts its right side against the wall at x = 1 (half width 0.3). */
const AT_WALL = 0.7;

function rig(stats: Partial<Stats>, solid: Solid) {
  const p = new Player();
  p.spawnAt(0.5, 5, 0.5);
  p.body.onGround = false;
  const pressed = new Set<string>();
  const move = { x: 0, y: 0 };
  const input = { hit: (a: string) => pressed.has(a), held: () => false, move, lookDX: 0, lookDY: 0, sensitivity: 1 } as unknown as Input;
  const jumps: { v: number; air: number }[] = [];
  const hooks: PlayerHooks = { jump: (v, a) => { jumps.push({ v, air: a }); return v; }, land: () => {}, bump: v => v };
  const s = { ...BASE_STATS, ...stats };
  /** One frame, with jump pressed if asked. */
  const frame = (press = false, dt = 1 / 240) => {
    if (press) pressed.add('jump');
    p.update(dt, input, s, solid, hooks);
    pressed.clear();
  };
  const run = (seconds: number, dt = 1 / 240) => { for (let t = 0; t < seconds - 1e-9; t += dt) frame(false, dt); };
  return { p, frame, run, jumps, stats: s };
}

/** Presses jump once in the air, where the body is, and reports the jumps it made. */
function pressOnce(stats: Partial<Stats>, solid: Solid, x = AT_WALL, y = 5) {
  const r = rig(stats, solid);
  r.p.body.x = x; r.p.body.y = y;
  r.frame(true);
  return r;
}

describe('the Wall Jump item', () => {
  it('validates, and the whole catalogue validates with it', () => {
    expect(validateItem(wallJump)).toEqual([]);
    expect(validateCatalogue(ITEMS, SYNERGIES)).toEqual([]);
  });

  it('is in the catalogue under its id, a quality 3 body practice in the treasure pool (the common one)', () => {
    expect(ITEM_BY_ID.get('wall-jump')).toBe(wallJump);
    expect(Object.keys(wallJump.pools)).toEqual(['treasure']);
    expect(wallJump.tags).toEqual(['body']);
    expect(wallJump.quality).toBe(3);
  });

  it('adds one air jump, and marks it as a wall one; two copies add two of each, and the stat caps at three', () => {
    const held = (copies: number) => computeStats(Array.from({ length: copies }, (_, k) => copyMods(wallJump, k).map(s => ({ ...s, source: `wall-jump-${k}` }))).flat());
    expect([0, 1, 2].map(held).map(s => [s.airJumps, s.wallJumps])).toEqual([[0, 0], [1, 1], [2, 2]]);
    expect(held(5).airJumps).toBe(3);
  });

  it('stacks with the Triple Jump on the same counter: its last air jump is the wall one', () => {
    const triple = [{ stat: 'airJumps' as const, layer: 'add' as const, value: 2, source: 'triple-jump-0' }, { stat: 'airJumps' as const, layer: 'add' as const, value: 1, source: 'triple-jump-1' }];
    const one = computeStats([...triple.slice(0, 1), { stat: 'airJumps', layer: 'add', value: 1, source: 'wall-jump-0' }, { stat: 'wallJumps', layer: 'add', value: 1, source: 'wall-jump-0' }]);
    expect([one.airJumps, one.wallJumps]).toEqual([3, 1]);
  });
});

describe('the Wall Jump in play', () => {
  it('is usable on a wall, and rises like the next air jump (2x a ground jump as the first)', () => {
    const r = pressOnce({ airJumps: 1, wallJumps: 1 }, wall);
    expect(r.jumps).toEqual([{ v: velocity(1), air: 1 }]);
    expect(r.p.airStep).toBe(1);
  });

  it('is not usable in open air without a wall: the press does nothing and spends nothing', () => {
    const r = pressOnce({ airJumps: 1, wallJumps: 1 }, openAir, 0.5);
    expect(r.jumps).toEqual([]);
    expect(r.p.airStep).toBe(0);
  });

  it('pushes nowhere forward: the body keeps its place and speed through the jump', () => {
    const r = pressOnce({ airJumps: 1, wallJumps: 1 }, wall);
    expect(r.p.body.x).toBeCloseTo(AT_WALL, 6);
    expect(r.p.body.vx).toBeCloseTo(0, 6);
    expect(r.p.body.vz).toBeCloseTo(0, 6);
  });

  it('is never a ground jump: a press beside the wall but near the ground waits (as every air jump does)', () => {
    const r = rig({ airJumps: 1, wallJumps: 1 }, wallOnFloor);
    r.p.body.x = AT_WALL; r.p.body.y = 1.2;
    r.frame(true);
    expect(r.jumps).toEqual([]);
    expect(r.p.airStep).toBe(0);
  });

  it('refreshes on landing: after the wall jump, the next wall jump is possible again once the body lands', () => {
    const r = rig({ airJumps: 1, wallJumps: 1 }, wallOnFloor);
    r.p.body.x = AT_WALL; r.p.body.y = 4;
    r.frame(true);
    expect(r.jumps).toEqual([{ v: velocity(1), air: 1 }]);
    r.p.body.x = AT_WALL;
    r.frame(true);
    expect(r.jumps).toHaveLength(1);                 // spent: the second press finds no air jump left
    r.run(4);
    expect(r.p.body.onGround).toBe(true);
    expect(r.p.airStep).toBe(0);
    // a ground jump from the floor, then a press at the wall in the air: the air jump is back
    r.frame(true);
    for (let t = 0; t < 2 && r.p.body.y < 1.8; t += 1 / 240) r.frame(false);
    r.p.body.x = AT_WALL;
    r.frame(true);
    expect(r.jumps).toEqual([{ v: velocity(1), air: 1 }, { v: velocity(0), air: 0 }, { v: velocity(1), air: 1 }]);
  });

  it('stacks with the Triple Jump: the two open air jumps need no wall, and the last one needs one', () => {
    const r = rig({ airJumps: 3, wallJumps: 1 }, wall);
    // presses every sixth of a second, in open air (the body is at x 0.5, well clear of the wall)
    for (let f = 0; f < 600; f++) r.frame(f % 40 === 0);
    expect(r.jumps.map(j => j.air)).toEqual([1, 2]);  // the two open ones, in open air
    r.p.body.x = AT_WALL;
    r.frame(true);
    expect(r.jumps.map(j => j.air)).toEqual([1, 2, 3]);
    expect(r.jumps[2].v).toBeCloseTo(velocity(3), 9); // the third rises 16×, the top of the ladder
  });
});
