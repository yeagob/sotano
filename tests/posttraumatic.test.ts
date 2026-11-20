// Post-Traumatic Growth (posttraumatic): lavaWalk. With it, lava never hurts the player (playerElements leaves lava
// out of the damage check), the lava wade is full speed (the 0.4 becomes 1), and a lava surface is ground for a body
// that stood above it (lavaSurface, read by the simulate's solid test). Fire still hurts. The real Game methods run on a
// stand-in over an in-memory element grid; the body moves with the real moveBody.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SOURCE, EL_FIRE, EL_LAVA, elemByte } from '../src/content/elements';
import { computeStats } from '../src/core/stats';
import { createBus } from '../src/game/events';
import { ITEM_BY_ID } from '../src/content/items';
import { validateItem } from '../src/items/validate';
import { moveBody, type Body } from '../src/physics/voxel-collide';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: () => {}, unlockAudio: () => {} };
});

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
});

const growth = ITEM_BY_ID.get('posttraumatic')!;
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** A Game stand-in: the element grid, the player's body and what the element methods read. */
function rig(lavaWalk: number, body: Partial<Body> = { x: 5.5, y: 0, z: 5.5 }) {
  const cells = new Map<string, number>();
  const world = { elemAt: (x: number, y: number, z: number) => cells.get(key(x, y, z)) ?? 0, get: () => 0 };
  const b: Body = { x: 5.5, y: 0, z: 5.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: false, ...body };
  const player = { id: 0, hp: 8, breath: 8, body: b, forward: null };
  const g = Object.assign(Object.create(Game.prototype), {
    world,
    bus: createBus(),
    player,
    playerIn: new Set(),
    playerMedium: { feet: null, head: null },
    drownT: 0,
    fireShields: [],
    stats: { get: (k: string) => (k === 'lavaWalk' ? lavaWalk : k === 'breath' ? 8 : 0) },
    damageActor: vi.fn(),
  });
  const set = (kind: number, x: number, y: number, z: number, level = SOURCE) => cells.set(key(x, y, z), elemByte(kind, level));
  return { g, b, set, damage: g.damageActor as ReturnType<typeof vi.fn> };
}

describe('the item', () => {
  it('passes the validator, grants lavaWalk through a stat, and its effect text is the designed one', () => {
    expect(validateItem(growth)).toEqual([]);
    expect(growth.stats).toEqual([{ stat: 'lavaWalk', layer: 'add', value: 1 }]);
    expect(growth.effect).toBe('Lava never hurts you: you walk on its surface and wade through it at full speed. Your intentions still go out in it.');
  });

  it('is a treasure practice on the emotion path and fire', () => {
    expect(growth.pools).toEqual({ treasure: 1 });
    expect(growth.tags).toEqual(expect.arrayContaining(['emotion', 'fire']));
  });

  it('the stat is 0 without it and 1 with it', () => {
    expect(computeStats([]).lavaWalk).toBe(0);
    expect(computeStats(growth.stats!.map(m => ({ ...m, source: 'item:1' }))).lavaWalk).toBe(1);
  });
});

describe('playerElements with lavaWalk', () => {
  it('without it, standing in lava hurts 8 points and the wade is the slow one', () => {
    const { g, set, damage } = rig(0);
    set(EL_LAVA, 5, 0, 5);
    g.playerElements(0.1);
    expect(damage).toHaveBeenCalledWith(g.player, 8, 'fire', 'lava', 'world');
    expect(g.playerMedium.feet.wade).toBe(0.4);
  });

  it('with it, lava does no damage, and the wade is full speed', () => {
    const { g, set, damage } = rig(1);
    set(EL_LAVA, 5, 0, 5);
    g.playerElements(0.1);
    expect(damage).not.toHaveBeenCalled();
    expect(g.playerMedium.feet.key).toBe('lava');
    expect(g.playerMedium.feet.wade).toBe(1);
  });

  it('fire still hurts, with it', () => {
    const { g, set, damage } = rig(1);
    set(EL_FIRE, 5, 0, 5, 8);
    g.playerElements(0.1);
    expect(damage).toHaveBeenCalledWith(g.player, 4, 'fire', 'fire', 'world');
  });

  it('a body in lava at full speed is still in the lava (the wade changes speed, not the medium)', () => {
    const { g, set } = rig(1);
    set(EL_LAVA, 5, 0, 5);
    g.playerElements(0.1);
    expect(g.playerIn.has('lava')).toBe(true);
  });
});

describe('a lava surface is ground (lavaSurface)', () => {
  it('a lava cell with air above it holds a body whose feet were above its top, and not one already in it', () => {
    const { g, set } = rig(1);
    set(EL_LAVA, 5, 0, 5);
    expect(g.lavaSurface(5, 0, 5, 1)).toBe(true);     // feet above the surface (0.875)
    expect(g.lavaSurface(5, 0, 5, 0.5)).toBe(false);  // already below it: not held
  });

  it('a lava cell with lava above it is not a surface, and neither is water or air', () => {
    const { g, set } = rig(1);
    set(EL_LAVA, 5, 0, 5);
    set(EL_LAVA, 5, 1, 5);
    expect(g.lavaSurface(5, 0, 5, 1)).toBe(false);
    expect(g.lavaSurface(6, 0, 5, 1)).toBe(false);
  });

  it('a falling body lands on the surface and stays there; without lavaWalk it sinks in', () => {
    const run = (lavaWalk: number) => {
      const { g, set, b } = rig(lavaWalk, { x: 5.5, y: 3, z: 5.5, vy: -10 });
      for (let x = 4; x <= 6; x++) for (let z = 4; z <= 6; z++) set(EL_LAVA, x, 0, z);
      // the same test as the simulate's solid predicate: the ground below y 0, and lava surfaces when lavaWalk
      let feet0 = b.y;
      const solid = (x: number, y: number, z: number) => y < 0 || (lavaWalk >= 1 && g.lavaSurface(x, y, z, feet0));
      moveBody(solid, b, 0.1);
      feet0 = b.y;
      for (let f = 0; f < 20; f++) { b.vy = -10; moveBody(solid, b, 0.1); feet0 = b.y; }
      return { y: b.y, onGround: b.onGround };
    };
    const walk = run(1);
    expect(walk.y).toBeCloseTo(1, 5);
    expect(walk.onGround).toBe(true);
    expect(run(0).y).toBeLessThan(0.5);
  });
});
