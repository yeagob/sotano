import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import doubleJump from '../src/content/items/double-jump';
import tripleJump from '../src/content/items/triple-jump';
import { SYNERGIES } from '../src/content/synergies';
import { BASE_STATS, computeStats, type Stats } from '../src/core/stats';
import type { Input } from '../src/input/input';
import { APEX_CAP, Player, type PlayerHooks } from '../src/entities/player';
import { isSkyGift } from '../src/items/pool';
import { validateCatalogue, validateItem } from '../src/items/validate';
import { AIR_CONTROL, apex, velocity } from '../src/physics/jump';

/** The `airJumps` a set of practices gives on top of the base stat. */
function airJumpsOf(...items: (typeof doubleJump)[]): number {
  return computeStats(items.flatMap(i => (i.stats ?? []).map(s => ({ ...s, source: i.id })))).airJumps;
}

const flat = (_x: number, y: number) => y <= 0;
const air = () => false;

function rig(stats: Partial<Stats>, solid: (x: number, y: number) => boolean) {
  const p = new Player();
  p.spawnAt(0.5, 1, 0.5);
  p.body.onGround = solid === flat;
  const pressed = new Set<string>();
  const move = { x: 0, y: 0 };
  const input = {
    hit: (a: string) => pressed.has(a), held: () => false, move, lookDX: 0, lookDY: 0, sensitivity: 1,
  } as unknown as Input;
  const jumps: { v: number; air: number }[] = [];
  const hooks: PlayerHooks = { jump: (v, a) => { jumps.push({ v, air: a }); return v; }, land: () => {}, bump: v => v };
  const s = { ...BASE_STATS, ...stats };
  const step = (dt: number) => { p.update(dt, input, s, solid, hooks, undefined, {}); pressed.clear(); };
  const run = (seconds: number, dt = 1 / 60) => { for (let t = 0; t < seconds - 1e-9; t += dt) step(dt); };
  return { p, pressed, move, jumps, step, run };
}

/** Jump from the ground, then press again at each apex; returns how high each jump rose from its press. */
function climb(stats: Partial<Stats>, presses: number, dt = 1 / 2000) {
  const r = rig(stats, flat);
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
  return { rises, jumps: r.jumps };
}

describe('the Double Jump item', () => {
  it('validates, and the whole catalogue validates with it', () => {
    expect(validateItem(doubleJump)).toEqual([]);
    expect(validateCatalogue(ITEMS, SYNERGIES)).toEqual([]);
  });

  it('is in the catalogue under its id, in the treasure pool and never a sky gift', () => {
    expect(ITEM_BY_ID.get('double-jump')).toBe(doubleJump);
    expect(Object.keys(doubleJump.pools)).toEqual(['treasure']);
    expect(isSkyGift(doubleJump)).toBe(false);
    expect(doubleJump.quality).toBe(3);
    expect(doubleJump.tags).toEqual(['body']);
  });

  it('gives one air jump on the airJumps stat: the Double Jump alone gives 1', () => {
    expect(airJumpsOf(doubleJump)).toBe(1);
  });

  it('with the Triple Jump held, airJumps is 3: the ground jump plus three in the air', () => {
    expect(airJumpsOf(doubleJump, tripleJump)).toBe(3);
  });

  it('a second copy adds one more air jump, and the stat clamp of 4 is kept', () => {
    expect(airJumpsOf(doubleJump, doubleJump)).toBe(2);
    expect(airJumpsOf(doubleJump, doubleJump, doubleJump, tripleJump)).toBe(4);
  });

  it('the Double Jump alone: one air jump, rising 2× a ground jump; a further press does nothing', () => {
    const { rises, jumps } = climb({ airJumps: 1 }, 3);
    expect(jumps).toEqual([{ v: velocity(0), air: 0 }, { v: velocity(1), air: 1 }]);
    expect(rises).toHaveLength(2);
    expect(rises[1] / rises[0]).toBeCloseTo(2, 1);
  });

  it('with both held the air jumps are 2×, 8×, 8×: the Triple Jump\'s first and second keep their heights', () => {
    const { rises, jumps } = climb({ airJumps: 3 }, 4);
    expect(jumps.map(j => j.air)).toEqual([0, 1, 2, 3]);
    expect(jumps[1].v).toBeCloseTo(velocity(1), 9);
    expect(jumps[2].v).toBeCloseTo(velocity(2), 9);
    expect(jumps[3].v).toBeCloseTo(velocity(2), 9);
    expect(rises).toHaveLength(4);
    expect(rises[1] / rises[0]).toBeCloseTo(2, 1);
    expect(rises[2] / rises[0]).toBeCloseTo(8, 1);
    expect(rises[3] / rises[0]).toBeCloseTo(8, 1);
    expect(rises[2]).toBeCloseTo(apex(2), 1);
  });

  it('no air jump of the combination rises past the 16-block cap, however high the jump stat', () => {
    const { rises } = climb({ jump: 5, airJumps: 3 }, 4);
    for (const h of rises.slice(1)) expect(h).toBeLessThanOrEqual(APEX_CAP + 0.01);
    expect(rises[2]).toBeGreaterThan(APEX_CAP - 0.1);
  });

  it('its air jump steers partly, as the first air jump does; the second one steers fully', () => {
    const k = (dt: number, c: number) => 1 - Math.exp(-14 * c * dt);
    const first = rig({ airJumps: 1 }, air);
    first.p.body.onGround = false;
    first.run(0.2);
    first.pressed.add('jump'); first.step(1 / 60);
    expect(first.p.airStep).toBe(1);
    first.move.y = 1;
    first.step(1 / 60);
    expect(first.p.body.vz).toBeCloseTo(-4.6 * k(1 / 60, AIR_CONTROL), 6);

    const second = rig({ airJumps: 3 }, air);
    second.p.body.onGround = false;
    second.run(0.2);
    second.pressed.add('jump'); second.step(1 / 60);
    second.pressed.add('jump'); second.step(1 / 60);
    expect(second.p.airStep).toBe(2);
    second.move.y = 1;
    second.step(1 / 60);
    expect(second.p.body.vz).toBeCloseTo(-4.6 * k(1 / 60, 1), 6);
  });

  it('landing restores the air jump: after a landing a press in the air climbs again', () => {
    const r = rig({ airJumps: 1 }, (_x, y) => y <= -20);
    r.p.spawnAt(0.5, 1, 0.5);
    r.p.body.onGround = false;
    r.run(0.2);
    r.pressed.add('jump'); r.step(1 / 60);
    expect(r.jumps).toEqual([{ v: velocity(1), air: 1 }]);
    expect(r.p.airStep).toBe(1);
    r.run(4);
    expect(r.p.body.onGround).toBe(true);
    expect(r.p.airStep).toBe(0);
    // back on the ground the next press is a ground jump; once in the air again the air jump is there
    r.pressed.add('jump'); r.step(1 / 60);
    expect(r.jumps[1]).toEqual({ v: velocity(0), air: 0 });
    r.run(0.2);
    r.pressed.add('jump'); r.step(1 / 60);
    expect(r.jumps).toHaveLength(3);
    expect(r.jumps[2]).toEqual({ v: velocity(1), air: 1 });
  });
});
