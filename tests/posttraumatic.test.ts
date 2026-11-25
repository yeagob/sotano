// Post-Traumatic Growth (posttraumatic): lavaWalk, the seconds of lava walking. Each copy gives 2 seconds, at most 6. While
// time is left, lava does not hurt the player (playerElements leaves lava out of the damage check), the lava wade is full
// speed (the 0.4 becomes 1), and a lava surface is ground (lavaSurface, read by the simulate's solid test). The time runs
// down while the body stands in lava and is whole again once it is out. Then lava burns as usual. Intentions still go out
// in lava, and fire still hurts. The real Game methods run on a stand-in over an in-memory element grid; the body moves
// with the real moveBody.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Intents, intentFromStats, type IntentHooks } from '../src/combat/intents';
import { SOURCE, EL_FIRE, EL_LAVA, elemByte } from '../src/content/elements';
import { BASE_STATS, computeStats, type StatMod } from '../src/core/stats';
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

/** The stat that `n` copies of the practice give, summed and capped by computeStats. */
const copies = (n: number): StatMod[] =>
  Array.from({ length: n }, (_, i) => growth.stats!.map(m => ({ ...m, source: `item:${i + 1}` }))).flat();
const seconds = (n: number) => computeStats(copies(n)).lavaWalk;

/** A Game stand-in: the element grid, the player's body and what the element methods read. `lavaWalk` is the stat, in seconds. */
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
    lavaSpent: 0,
    fireShields: [],
    stats: { get: (k: string) => (k === 'lavaWalk' ? lavaWalk : k === 'breath' ? 8 : 0) },
    damageActor: vi.fn(),
  });
  const set = (kind: number, x: number, y: number, z: number, level = SOURCE) => cells.set(key(x, y, z), elemByte(kind, level));
  return { g, b, set, damage: g.damageActor as ReturnType<typeof vi.fn> };
}

/** `seconds` of frames, each `dt` long, on the stand-in (playerElements only). */
function stand(g: { playerElements(dt: number): void }, seconds: number, dt = 0.5) {
  for (let f = 0; f < Math.round(seconds / dt); f++) g.playerElements(dt);
}

describe('the item', () => {
  it('passes the validator, gives lavaWalk in seconds (2 per copy), and its effect text is the designed one', () => {
    expect(validateItem(growth)).toEqual([]);
    expect(growth.stats).toEqual([{ stat: 'lavaWalk', layer: 'add', value: 2 }]);
    expect(growth.effect).toBe('Walk on lava for 2 seconds per copy, up to 6 seconds, then the lava burns you as usual. The time comes back once you are out of it. Your intentions still go out in it.');
  });

  it('is a treasure practice on the emotion path and fire', () => {
    expect(growth.pools).toEqual({ treasure: 1 });
    expect(growth.tags).toEqual(expect.arrayContaining(['emotion', 'fire']));
  });

  it('the stat is 0 with no copy, 2 with one, 4 with two, and capped at 6 with three or four', () => {
    expect(BASE_STATS.lavaWalk).toBe(0);
    expect(seconds(0)).toBe(0);
    expect(seconds(1)).toBe(2);
    expect(seconds(2)).toBe(4);
    expect(seconds(3)).toBe(6);
    expect(seconds(4)).toBe(6);
  });
});

describe('playerElements with lavaWalk', () => {
  it('no copy: standing in lava hurts 8 points at once, and the wade is the slow one', () => {
    const { g, set, damage } = rig(0);
    set(EL_LAVA, 5, 0, 5);
    g.playerElements(0.1);
    expect(damage).toHaveBeenCalledWith(g.player, 8, 'fire', 'lava', 'world', 0, 0, undefined, null);
    expect(g.playerMedium.feet.wade).toBe(0.4);
    expect(g.lavaSpent).toBe(0);
  });

  it('one copy: lava does no damage at first, and the wade is full speed', () => {
    const { g, set, damage } = rig(seconds(1));
    set(EL_LAVA, 5, 0, 5);
    g.playerElements(0.5);
    expect(damage).not.toHaveBeenCalled();
    expect(g.playerMedium.feet.key).toBe('lava');
    expect(g.playerMedium.feet.wade).toBe(1);
  });

  it('one copy gives 2 seconds: no damage for 2 seconds in lava, then lava hurts again', () => {
    const { g, set, damage } = rig(seconds(1));
    set(EL_LAVA, 5, 0, 5);
    stand(g, 2);
    expect(damage).not.toHaveBeenCalled();
    g.playerElements(0.5);
    expect(damage).toHaveBeenCalledTimes(1);
    expect(damage).toHaveBeenCalledWith(g.player, 8, 'fire', 'lava', 'world', 0, 0, undefined, null);
  });

  it('once the time is up, the wade is slow again and the surface holds no one', () => {
    const { g, set } = rig(seconds(1));
    set(EL_LAVA, 5, 0, 5);
    stand(g, 2.5);
    expect(g.lavaWalkLeft()).toBe(0);
    expect(g.playerMedium.feet.wade).toBe(0.4);
  });

  it('three copies give the 6-second cap, and a fourth adds nothing', () => {
    for (const n of [3, 4]) {
      const { g, set, damage } = rig(seconds(n));
      set(EL_LAVA, 5, 0, 5);
      stand(g, 6);
      expect(damage).not.toHaveBeenCalled();
      g.playerElements(0.5);
      expect(damage).toHaveBeenCalledTimes(1);
    }
  });

  it('standing in lava forever still kills: every frame hurts once the time is up', () => {
    const { g, set, damage } = rig(seconds(3));
    set(EL_LAVA, 5, 0, 5);
    for (let f = 0; f < 30; f++) g.playerElements(0.5);
    // 15 seconds in lava: the first 6 are walked (12 frames), the other 18 frames hurt
    expect(damage).toHaveBeenCalledTimes(18);
  });

  it('the time comes back once the body is out of lava', () => {
    const { g, set, b, damage } = rig(seconds(1));
    set(EL_LAVA, 5, 0, 5);
    stand(g, 1.5);
    expect(g.lavaSpent).toBeCloseTo(1.5, 5);
    b.x = 20.5;                       // out of the lava: the time is whole again
    g.playerElements(0.5);
    expect(g.lavaSpent).toBe(0);
    expect(g.lavaWalkLeft()).toBe(2);
    b.x = 5.5;
    stand(g, 2);
    expect(damage).not.toHaveBeenCalled();
  });

  it('without the practice nothing is counted', () => {
    const { g, set } = rig(0);
    set(EL_LAVA, 5, 0, 5);
    g.playerElements(0.5);
    expect(g.lavaSpent).toBe(0);
  });

  it('fire still hurts, with the practice', () => {
    const { g, set, damage } = rig(seconds(1));
    set(EL_FIRE, 5, 0, 5, 8);
    g.playerElements(0.1);
    expect(damage).toHaveBeenCalledWith(g.player, 4, 'fire', 'fire', 'world', 0, 0, undefined, null);
  });

  it('a body in lava at full speed is still in the lava (the wade changes speed, not the medium)', () => {
    const { g, set } = rig(seconds(1));
    set(EL_LAVA, 5, 0, 5);
    g.playerElements(0.1);
    expect(g.playerIn.has('lava')).toBe(true);
  });
});

describe('a lava surface is ground while the time lasts (lavaSurface)', () => {
  it('a lava cell with air above it holds a body whose feet were above its top, and not one already in it', () => {
    const { g, set } = rig(seconds(1));
    set(EL_LAVA, 5, 0, 5);
    expect(g.lavaSurface(5, 0, 5, 1)).toBe(true);     // feet above the surface (0.875)
    expect(g.lavaSurface(5, 0, 5, 0.5)).toBe(false);  // already below it: not held
  });

  it('a lava cell with lava above it is not a surface, and neither is water or air', () => {
    const { g, set } = rig(seconds(1));
    set(EL_LAVA, 5, 0, 5);
    set(EL_LAVA, 5, 1, 5);
    expect(g.lavaSurface(5, 0, 5, 1)).toBe(false);
    expect(g.lavaSurface(6, 0, 5, 1)).toBe(false);
  });

  it('a falling body lands on the surface and stays there while the time lasts; once it is up, or with no copy, it sinks in', () => {
    const run = (lavaWalk: number, spent: number) => {
      const { g, set, b } = rig(lavaWalk, { x: 5.5, y: 3, z: 5.5, vy: -10 });
      g.lavaSpent = spent;
      for (let x = 4; x <= 6; x++) for (let z = 4; z <= 6; z++) set(EL_LAVA, x, 0, z);
      // the same test as the simulate's solid predicate: the ground below y 0, and lava surfaces while time is left
      let feet0 = b.y;
      const solid = (x: number, y: number, z: number) => y < 0 || (g.lavaWalkLeft() > 0 && g.lavaSurface(x, y, z, feet0));
      moveBody(solid, b, 0.1);
      feet0 = b.y;
      for (let f = 0; f < 20; f++) { b.vy = -10; moveBody(solid, b, 0.1); feet0 = b.y; }
      return { y: b.y, onGround: b.onGround };
    };
    const walk = run(seconds(1), 0);
    expect(walk.y).toBeCloseTo(1, 5);
    expect(walk.onGround).toBe(true);
    expect(run(seconds(1), 2).y).toBeLessThan(0.5);
    expect(run(0, 0).y).toBeLessThan(0.5);
  });
});

describe('intentions still go out in lava', () => {
  it('with time left, an intention that flies into lava is put out by it, as before', () => {
    const { g, set } = rig(seconds(1));
    for (let x = 3; x <= 8; x++) set(EL_LAVA, x, 0, 5);
    const quenched = vi.fn();
    const hooks: IntentHooks = {
      solid: () => false,
      tier: () => 0,
      hitBlock: () => false,
      debrisAt: () => -1,
      hitDebris: () => {},
      enemyAt: () => -1,
      hitEnemy: () => {},
      nearestEnemy: () => null,
      splash: () => {},
      hit: () => {},
      nearestBlock: () => null,
      elementAt: (x, y, z) => g.elementAt(x, y, z)?.key ?? null,
      quenched,
    };
    const intents = new Intents(new THREE.Scene(), hooks);
    const spec = { ...intentFromStats(BASE_STATS, 'positive'), flight: 10 };
    intents.fire(spec, new THREE.Vector3(1.5, 0.5, 5.5), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let f = 0; f < 40; f++) intents.update(0.01);
    expect(intents.count).toBe(0);
    expect(quenched).toHaveBeenCalled();
  });
});
