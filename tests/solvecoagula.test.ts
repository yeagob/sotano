// Solve et Coagula (solvecoagula): a positive intention in lava turns the connected lava into water, a negative one in
// water turns the connected water into lava (never water the player's body touches, unless lavaWalk). The real
// Game.convertFluid runs on a stand-in (Object.create(Game.prototype)) over an in-memory element grid; the item's hook is
// checked against a stub API, and the Intents entry event is checked with the real Intents class.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Intents, intentFromStats, type IntentHooks } from '../src/combat/intents';
import { BASE_STATS } from '../src/core/stats';
import { EL_LAVA, EL_WATER, elemByte, elemKind, elemLevel, isFalling, isSource, SOURCE } from '../src/content/elements';
import { createBus } from '../src/game/events';
import { ITEMS, ITEM_BY_ID } from '../src/content/items';
import { validateItem } from '../src/items/validate';
import type { HookSpec } from '../src/items/types';

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

const solve = ITEM_BY_ID.get('solvecoagula')!;
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** A Game stand-in with only what convertFluid and the element helpers read. `room` says which room a cell is in. */
function rig(opts: { lavaWalk?: number; room?: (x: number, z: number) => number; body?: { x: number; y: number; z: number } } = {}) {
  const cells = new Map<string, number>();
  const world = {
    inside: () => true,
    idx: (x: number, y: number, z: number) => ((x + 500) * 1000 + (y + 100)) * 1000 + (z + 500),
    elemAt: (x: number, y: number, z: number) => cells.get(key(x, y, z)) ?? 0,
    setElemByte: (x: number, y: number, z: number, v: number) => { cells.set(key(x, y, z), v); },
    get: () => 0,
  };
  const at = opts.body ?? { x: 40.5, y: 0, z: 40.5 };
  const body = { ...at, hw: 0.3, h: 1.8, vx: 0, vy: 0, vz: 0, onGround: false };
  const room = opts.room ?? (() => 1);
  const g = Object.assign(Object.create(Game.prototype), {
    world,
    bus: createBus(),
    simFrame: 0,
    fluidFrame: -1,
    elemFx: 0,
    elemSfx: 0,
    particles: { burst() {} },
    elements: { wakeAround() {} },
    roomAt: (x: number, _y: number, z: number) => ({ id: room(x, z) }),
    stats: { get: (k: string) => (k === 'lavaWalk' ? opts.lavaWalk ?? 0 : k === 'breath' ? 8 : 0) },
    player: { id: 0, hp: 8, breath: 8, body },
  });
  /** Fill a box of one element (level and falling as given). */
  const fill = (kind: number, x0: number, x1: number, y: number, z0: number, z1: number, level = SOURCE, falling = false) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cells.set(key(x, y, z), elemByte(kind, level, falling));
  };
  return { g, cells, fill, body };
}

describe('the item', () => {
  it('passes the validator, is a milagros practice with an element and intent tag, and its effect text fits', () => {
    expect(validateItem(solve)).toEqual([]);
    expect(solve.tags).toEqual(expect.arrayContaining(['milagros', 'intent', 'element']));
    expect(solve.effect.length).toBeLessThanOrEqual(260);
    expect(ITEMS.filter(i => i.id === 'solvecoagula')).toHaveLength(1);
  });

  it('is in the treasure and vault pools only', () => {
    expect(solve.pools).toEqual({ treasure: 1, vault: 1 });
  });
});

describe('Game.convertFluid', () => {
  it('turns the connected cells of the touched fluid and leaves a separate pool alone', () => {
    const { g, cells, fill } = rig();
    fill(EL_LAVA, 0, 2, 0, 0, 2);      // 9 cells
    fill(EL_LAVA, 10, 11, 0, 0, 1);    // a separate pool, not touching
    expect(g.convertFluid(1, 0, 1, 'lava', 'water', 256, 'solvecoagula')).toBe(9);
    expect(elemKind(cells.get(key(0, 0, 0))!)).toBe(EL_WATER);
    expect(elemKind(cells.get(key(2, 0, 2))!)).toBe(EL_WATER);
    expect(elemKind(cells.get(key(10, 0, 0))!)).toBe(EL_LAVA);
  });

  it('stops at the cap: a 20 by 20 pool gives 256 cells, nearest the touched one first', () => {
    const { g, cells, fill } = rig();
    fill(EL_LAVA, 0, 19, 0, 0, 19);    // 400 cells
    expect(g.convertFluid(10, 0, 10, 'lava', 'water', 256, 'solvecoagula')).toBe(256);
    const water = [...cells.values()].filter(v => elemKind(v) === EL_WATER).length;
    expect(water).toBe(256);
    expect(elemKind(cells.get(key(10, 0, 10))!)).toBe(EL_WATER);
    expect(elemKind(cells.get(key(0, 0, 0))!)).toBe(EL_LAVA);   // the far corner is the last to go
  });

  it('keeps each cell’s level and falling bit; a source stays a source', () => {
    const { g, cells, fill } = rig();
    fill(EL_LAVA, 1, 1, 0, 0, 0, 3, true);
    fill(EL_LAVA, 2, 2, 0, 0, 0, SOURCE, false);
    expect(g.convertFluid(1, 0, 0, 'lava', 'water', 256, 'solvecoagula')).toBe(2);
    expect(cells.get(key(1, 0, 0))).toBe(elemByte(EL_WATER, 3, true));
    expect(isFalling(cells.get(key(1, 0, 0))!)).toBe(true);
    expect(elemLevel(cells.get(key(1, 0, 0))!)).toBe(3);
    expect(isSource(cells.get(key(2, 0, 0))!)).toBe(true);
  });

  it('converts at most once per frame', () => {
    const { g, fill, cells } = rig();
    fill(EL_LAVA, 0, 1, 0, 0, 0);
    fill(EL_LAVA, 5, 6, 0, 0, 0);
    expect(g.convertFluid(0, 0, 0, 'lava', 'water', 256, 'solvecoagula')).toBe(2);
    expect(g.convertFluid(5, 0, 0, 'lava', 'water', 256, 'solvecoagula')).toBe(0);
    expect(elemKind(cells.get(key(5, 0, 0))!)).toBe(EL_LAVA);
    g.simFrame++;
    expect(g.convertFluid(5, 0, 0, 'lava', 'water', 256, 'solvecoagula')).toBe(2);
  });

  it('does nothing when the cell is not the fluid it converts from, or is in no room', () => {
    const { g, fill } = rig();
    fill(EL_WATER, 0, 1, 0, 0, 0);
    expect(g.convertFluid(0, 0, 0, 'lava', 'water', 256, 'solvecoagula')).toBe(0);
    const outside = rig();
    outside.fill(EL_LAVA, 0, 1, 0, 0, 0);
    outside.g.roomAt = () => null;
    expect(outside.g.convertFluid(0, 0, 0, 'lava', 'water', 256, 'solvecoagula')).toBe(0);
    expect(elemKind(outside.cells.get(key(0, 0, 0))!)).toBe(EL_LAVA);
  });

  it('stays in the touched room', () => {
    const { g, fill } = rig({ room: x => (x < 5 ? 1 : 2) });
    fill(EL_LAVA, 0, 9, 0, 0, 0);
    expect(g.convertFluid(2, 0, 0, 'lava', 'water', 256, 'solvecoagula')).toBe(5);
  });

  it('refuses a negative conversion into lava that the body touches, unless lavaWalk is 1', () => {
    const near = rig({ body: { x: 9.5, y: 0, z: 9.5 } });
    near.fill(EL_WATER, 8, 10, 0, 8, 10);
    expect(near.g.convertFluid(9, 0, 9, 'water', 'lava', 256, 'solvecoagula')).toBe(-1);
    expect(elemKind(near.cells.get(key(9, 0, 9))!)).toBe(EL_WATER);

    const walk = rig({ lavaWalk: 1, body: { x: 9.5, y: 0, z: 9.5 } });
    walk.fill(EL_WATER, 8, 10, 0, 8, 10);
    expect(walk.g.convertFluid(9, 0, 9, 'water', 'lava', 256, 'solvecoagula')).toBe(9);
    expect(elemKind(walk.cells.get(key(9, 0, 9))!)).toBe(EL_LAVA);
  });

  it('a negative conversion far from the body goes ahead', () => {
    const far = rig({ body: { x: 0.5, y: 0, z: 0.5 } });
    far.fill(EL_WATER, 8, 10, 0, 8, 10);
    expect(far.g.convertFluid(9, 0, 9, 'water', 'lava', 256, 'solvecoagula')).toBe(9);
  });
});

describe('the hook', () => {
  const hook = solve.hooks!.find(h => h.id === 'transmute') as HookSpec<'intentElement'>;
  const run = (element: 'water' | 'lava', polarity: 'positive' | 'negative', converted: number) => {
    const api = { convertFluid: vi.fn(() => converted), toast: vi.fn() };
    hook.fn({ intent: { polarity }, x: 1, y: 0, z: 1, element, cancel() {} } as never, api as never);
    return api;
  };

  it('a positive intention in lava converts lava to water, up to 256', () => {
    const api = run('lava', 'positive', 9);
    expect(api.convertFluid).toHaveBeenCalledWith(1, 0, 1, 'lava', 'water', 256, 'solvecoagula');
    expect(api.toast).not.toHaveBeenCalled();
  });

  it('a negative intention in water converts water to lava, and says so when refused', () => {
    expect(run('water', 'negative', 9).convertFluid).toHaveBeenCalledWith(1, 0, 1, 'water', 'lava', 256, 'solvecoagula');
    const refused = run('water', 'negative', -1);
    expect(refused.toast).toHaveBeenCalledWith('refused');
  });

  it('does nothing for the other combinations', () => {
    expect(run('water', 'positive', 9).convertFluid).not.toHaveBeenCalled();
    expect(run('lava', 'negative', 9).convertFluid).not.toHaveBeenCalled();
  });

  it('has an id and sits in the side-effect band', () => {
    expect(hook.id).toBe('transmute');
    expect(hook.priority).toBeGreaterThanOrEqual(200);
  });
});

describe('the intention entry event (Intents)', () => {
  /** An intention flying along +x through a line of lava at y 0, z 1. `convert` turns the lava it enters to water. */
  function flight(convert: boolean) {
    const cells = new Map<string, 'water' | 'lava'>();
    for (let x = 1; x <= 6; x++) cells.set(`${x},0,1`, 'lava');
    const entries: string[] = [];
    const cell = (x: number, y: number, z: number) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
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
      elementAt: (x, y, z) => cells.get(cell(x, y, z)) ?? null,
      quenched: () => {},
      entered: (_spec, x, y, z, element) => {
        entries.push(`${element}@${cell(x, y, z)}`);
        if (convert && element === 'lava') for (const [k, v] of cells) if (v === 'lava') cells.set(k, 'water');
      },
    };
    const intents = new Intents(new THREE.Scene(), hooks);
    const spec = { ...intentFromStats(BASE_STATS, 'positive'), flight: 10 };
    intents.fire(spec, new THREE.Vector3(1.5, 0.5, 1.5), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let f = 0; f < 40; f++) intents.update(0.01);
    return { alive: intents.count, entries };
  }

  it('emits once per entry, and a positive intention that turns the lava to water keeps flying', () => {
    const { alive, entries } = flight(true);
    expect(entries).toEqual(['lava@1,0,1']);
    expect(alive).toBe(1);
  });

  it('lava that is not turned still puts a positive intention out', () => {
    const { alive, entries } = flight(false);
    expect(entries).toEqual(['lava@1,0,1']);
    expect(alive).toBe(0);
  });
});
