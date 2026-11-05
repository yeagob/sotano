// The sky's laws of this package (docs/architecture/SKY.md §4): regrowth (3.1), ownership (3.2),
// no harm in the sky (owner, 2026-11-03), block nests (6.3) and tower detection (3.9). Each runs on
// a real SkyWorld and a real event bus, with a fake host; no three.js.

import { describe, expect, it, vi } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { createBus, type GameBus } from '../src/game/events';
import { DebrisSystem } from '../src/physics/debris';
import type { Body } from '../src/physics/voxel-collide';
import { NEST_CUBES, NEST_REFILL, Nests } from '../src/sky/laws/nests';
import { installNoHarm } from '../src/sky/laws/no-harm';
import { Ownership } from '../src/sky/laws/ownership';
import { REGROW, Regrowth } from '../src/sky/laws/regrowth';
import { TOWER_HEIGHT, towerUnder } from '../src/sky/laws/tower';
import { ExceptionKind, type Place, type Shape, type SkyHost } from '../src/sky/types';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';

const { stone } = MAT;
/** A stone floor: its top is y = 1 (the formula ground cell is y = 0). */
const GROUND: Shape = { k: 'box', x0: 0, y0: 0, z0: 0, x1: 63, y1: 0, z1: 63, m: stone };
const NEST: Place = { id: 7, kind: 'nest', x: 30, y: 5, z: 30, w: 2, d: 2, tag: 0 };

/** A world with the given formula, a real debris system, a fake host and an empty bus. */
function setup(shapes: Shape[] = [GROUND]) {
  const world = new SkyWorld(buildIndex(shapes));
  const debris = new DebrisSystem(64, () => false, () => {});
  const fx = vi.fn();
  const cue = vi.fn();
  const host = { debris: () => debris, fx, cue } as unknown as SkyHost;
  const bus: GameBus = createBus();
  return { world, debris, host, fx, cue, bus };
}

/** A block the player made: the game sets `placing` around its placement. */
function place(world: SkyWorld, x: number, y: number, z: number) {
  world.placing = true;
  world.set(x, y, z, stone);
  world.placing = false;
}

const body = (x: number, y: number, z: number, onGround = true): Body =>
  ({ x, y, z, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround });

/** Live debris slots, in order. */
function alive(debris: DebrisSystem): number[] {
  const out: number[] = [];
  for (let i = 0; i < 64; i++) if (debris.isAlive(i)) out.push(i);
  return out;
}

describe('3.1 nothing stays broken: regrowth', () => {
  it('a broken block returns after REGROW seconds', () => {
    const { world, host } = setup();
    const reg = new Regrowth(world, host, () => false);
    world.set(10, 0, 10, AIR);
    expect(world.get(10, 0, 10)).toBe(AIR);
    expect(reg.pending).toBe(1);
    reg.update(REGROW - 0.05);
    expect(world.get(10, 0, 10)).toBe(AIR);
    reg.update(0.1);
    expect(world.get(10, 0, 10)).toBe(stone);
    expect(reg.pending).toBe(0);
  });

  it('shimmers once, one second before it returns, at the cell', () => {
    const { world, host, fx, cue } = setup();
    const reg = new Regrowth(world, host, () => false);
    world.set(10, 0, 10, AIR);
    reg.update(REGROW - 1 - 0.05);
    expect(fx).not.toHaveBeenCalled();
    reg.update(0.1);
    expect(fx).toHaveBeenCalledTimes(1);
    expect(fx).toHaveBeenCalledWith('shimmer', 10.5, 0.5, 10.5);
    expect(cue).toHaveBeenCalledWith('core.shimmer', 10.5, 0.5, 10.5);
    reg.update(0.5);
    expect(fx).toHaveBeenCalledTimes(1);
  });

  it('a cell with someone in it waits and is checked again', () => {
    const { world, host } = setup();
    let busy = true;
    const reg = new Regrowth(world, host, () => busy);
    world.set(10, 0, 10, AIR);
    reg.update(REGROW);
    expect(world.get(10, 0, 10)).toBe(AIR);
    reg.update(0.2);
    busy = false;
    expect(world.get(10, 0, 10)).toBe(AIR);
    reg.update(0.1);
    expect(world.get(10, 0, 10)).toBe(stone);
  });

  it('a block the player placed in the gap is not overwritten', () => {
    const { world, host } = setup();
    const reg = new Regrowth(world, host, () => false);
    world.set(10, 0, 10, AIR);
    place(world, 10, 0, 10);
    reg.update(REGROW + 1);
    expect(world.kindAt(world.idx(10, 0, 10))).toBe(ExceptionKind.Placed);
    expect(world.get(10, 0, 10)).toBe(stone);
    expect(reg.pending).toBe(1);
  });
});

describe('3.2 player blocks are the exception: ownership', () => {
  it('a cell is Placed only while placing is set: the same stone set by the world is not the player’s', () => {
    const { world } = setup();
    world.set(20, 1, 20, stone);
    expect(world.kindAt(world.idx(20, 1, 20))).toBe(ExceptionKind.Replaced);
    world.set(20, 1, 20, AIR);
    place(world, 20, 1, 20);
    expect(world.kindAt(world.idx(20, 1, 20))).toBe(ExceptionKind.Placed);
  });

  it.each(['intent', 'crush', 'explosion', 'contact'] as const)('a %s hit does nothing to a placed block', kind => {
    const { world, bus, host } = setup();
    new Ownership(world, host).install(bus);
    place(world, 20, 1, 20);
    const ev = bus.emit('blockDamage', { x: 20, y: 1, z: 20, material: stone, amount: 999, kind, source: 'test' });
    expect(ev.cancelled).toBe(true);
    expect(world.get(20, 1, 20)).toBe(stone);
  });

  it('a positive shot removes a placed block for good, with no cube back', () => {
    const { world, bus, host, fx, debris } = setup();
    const own = new Ownership(world, host);
    own.install(bus);
    place(world, 20, 1, 20);
    const hit = { x: 20, y: 1, z: 20, cell: world.idx(20, 1, 20), actor: -1, weapon: 'intent' as const, warm: true };
    expect(own.positiveHit(hit)).toBe(true);
    expect(world.get(20, 1, 20)).toBe(AIR);
    expect(world.kindAt(world.idx(20, 1, 20))).toBe(0);
    expect(fx).toHaveBeenCalledWith('gold', 20.5, 1.5, 20.5);
    expect(debris.count).toBe(0);
    expect(own.positiveHit(hit)).toBe(false);
  });

  it('a positive shot leaves an original block alone', () => {
    const { world, bus, host } = setup();
    const own = new Ownership(world, host);
    own.install(bus);
    const hit = { x: 10, y: 0, z: 10, cell: world.idx(10, 0, 10), actor: -1, weapon: 'intent' as const, warm: true };
    expect(own.positiveHit(hit)).toBe(false);
    expect(world.get(10, 0, 10)).toBe(stone);
  });

  it('a block broken in the sky gives no loose cube', () => {
    const { world, bus, host } = setup();
    new Ownership(world, host).install(bus);
    const ev = bus.emit('blockBreak', { x: 10, y: 0, z: 10, material: stone, kind: 'intent', source: 'intent', spawnDebris: true });
    expect(ev.spawnDebris).toBe(false);
    expect(ev.cancelled).toBe(false);
  });

  it('a placed block is not broken by a route other than damage', () => {
    const { world, bus, host } = setup();
    new Ownership(world, host).install(bus);
    place(world, 20, 1, 20);
    const ev = bus.emit('blockBreak', { x: 20, y: 1, z: 20, material: stone, kind: 'fire', source: 'fire', spawnDebris: true });
    expect(ev.cancelled).toBe(true);
  });
});

describe('no harm in the sky: the player cannot be hurt', () => {
  const hurt = (bus: GameBus, amount: number, kind: 'explosion' | 'intent' | 'item' = 'explosion') =>
    bus.emit('actorDamage', { target: 1, targetKind: 'player', def: 'player', amount, kind, source: 'test', owner: 'world', knockback: 0, polarity: null });

  it('a bomb under the player does nothing', () => {
    const { bus } = setup();
    installNoHarm(bus);
    expect(hurt(bus, 8).cancelled).toBe(true);
  });

  it('an item that hurts on landing does nothing, whatever it adds', () => {
    const { bus } = setup();
    installNoHarm(bus);
    bus.on('actorDamage', { priority: 20, source: 'item', id: 'self-harm', fn: e => { e.amount += 4; } });
    expect(hurt(bus, 4, 'item').cancelled).toBe(true);
  });

  it('a deferred hit does nothing', () => {
    const { bus } = setup();
    installNoHarm(bus);
    const seen: boolean[] = [];
    bus.defer(() => { seen.push(hurt(bus, 8).cancelled); });
    bus.flush();
    expect(seen).toEqual([true]);
  });

  it('a projection is still hurt by the same hit', () => {
    const { bus } = setup();
    installNoHarm(bus);
    const ev = bus.emit('actorDamage', { target: 2, targetKind: 'projection', def: 'slime', amount: 8, kind: 'intent', source: 'test', owner: 'world', knockback: 3, polarity: null });
    expect(ev.cancelled).toBe(false);
  });

  it('the death of the player is cancelled too (the fallback)', () => {
    const { bus } = setup();
    installNoHarm(bus);
    expect(bus.emit('death', { source: 'fall' }).cancelled).toBe(true);
  });

  it('removing the sky hooks restores the damage', () => {
    const { bus } = setup();
    installNoHarm(bus);
    bus.off(null, 'sky');
    expect(hurt(bus, 8).cancelled).toBe(false);
  });
});

describe('6.3 block nests', () => {
  it('a nest holds three cubes of its material', () => {
    const { debris, host } = setup();
    const nests = new Nests(host, [NEST], stone);
    expect(nests.count(NEST.id)).toBe(NEST_CUBES);
    expect(debris.count).toBe(NEST_CUBES);
    expect(alive(debris).every(i => debris.material[i] === stone)).toBe(true);
  });

  it('a cube taken from the nest is replaced after NEST_REFILL seconds, with a soft pop', () => {
    const { debris, host, fx, cue } = setup();
    const nests = new Nests(host, [NEST], stone);
    debris.remove(alive(debris)[0]);
    nests.update(0.1);
    expect(nests.count(NEST.id)).toBe(NEST_CUBES - 1);
    nests.update(NEST_REFILL - 0.3);
    expect(nests.count(NEST.id)).toBe(NEST_CUBES - 1);
    nests.update(0.4);
    expect(nests.count(NEST.id)).toBe(NEST_CUBES);
    expect(fx).toHaveBeenCalledWith('pop', 30.5, 5.5, 30.5);
    expect(cue).toHaveBeenCalledWith('core.pop', 30.5, 5.5, 30.5);
  });

  it('a cube that drifts beyond reach counts as taken; one within reach does not', () => {
    const { debris, host } = setup();
    const nests = new Nests(host, [NEST], stone);
    const [near, far] = alive(debris);
    debris.pos[near * 3] += 1;
    debris.pos[far * 3] += 5;
    nests.update(0);
    expect(nests.count(NEST.id)).toBe(NEST_CUBES - 1);
    expect(debris.isAlive(far)).toBe(true);
  });

  it('never holds more than three, however long it is left', () => {
    const { debris, host } = setup();
    const nests = new Nests(host, [NEST], stone);
    for (let k = 0; k < 100; k++) nests.update(1);
    expect(nests.count(NEST.id)).toBe(NEST_CUBES);
    expect(debris.count).toBe(NEST_CUBES);
  });

  it('dispose removes its cubes', () => {
    const { debris, host } = setup();
    const nests = new Nests(host, [NEST], stone);
    nests.dispose();
    expect(debris.count).toBe(0);
  });
});

describe('3.9 tower detection', () => {
  it('a stack of two does not count; a stack of three does', () => {
    const { world } = setup();
    place(world, 10, 1, 10);
    place(world, 10, 2, 10);
    expect(towerUnder(world, body(10.5, 3, 10.5))).toBeNull();
    place(world, 10, 3, 10);
    const t = towerUnder(world, body(10.5, 4, 10.5));
    expect(t).not.toBeNull();
    expect(t!.height).toBe(TOWER_HEIGHT);
    expect(t!.cells).toEqual([world.idx(10, 3, 10), world.idx(10, 2, 10), world.idx(10, 1, 10)]);
    expect(t!.at).toEqual([10, 4, 10]);
  });

  it('a placed stair of three rises is a tower; a stair of two is not', () => {
    const { world } = setup();
    place(world, 10, 1, 10);
    place(world, 11, 2, 10);
    place(world, 12, 3, 10);
    expect(towerUnder(world, body(11.5, 3, 10.5))).toBeNull();
    const t = towerUnder(world, body(12.5, 4, 10.5));
    expect(t).not.toBeNull();
    expect(t!.height).toBe(TOWER_HEIGHT);
    expect(t!.cells).toEqual([world.idx(12, 3, 10)]);
  });

  it('formula routes never count, and nothing counts in the air', () => {
    const { world } = setup([GROUND, { k: 'box', x0: 40, y0: 1, z0: 40, x1: 40, y1: 3, z1: 40, m: stone }]);
    expect(towerUnder(world, body(40.5, 4, 40.5))).toBeNull();
    place(world, 10, 1, 10);
    place(world, 10, 2, 10);
    place(world, 10, 3, 10);
    expect(towerUnder(world, body(10.5, 4, 10.5, false))).toBeNull();
  });

  it('the formula scan is bounded: a tower above no formula ground is still found, in few reads', () => {
    const { world } = setup([]);
    place(world, 5, 200, 5);
    const base = vi.spyOn(world, 'base');
    const t = towerUnder(world, body(5.5, 201, 5.5));
    expect(t).not.toBeNull();
    expect(t!.height).toBeGreaterThanOrEqual(TOWER_HEIGHT);
    expect(base.mock.calls.length).toBeLessThanOrEqual(97);
  });
});
