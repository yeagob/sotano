// An emptied chest leaves its own world (issue #156): its block is cleared in the dungeon's world, and a realm
// swap between opening and emptying does not clear the same cell in the sky's world. As in game-realm-passage.test.ts,
// Game's methods run on a stand-in object that holds only what they read.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AIR } from '../src/content/materials';
import type { ChestSpec } from '../src/world/floor';

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

const spec: ChestSpec = { room: 0, x: 3, y: 2, z: 3, keys: 0, item: null };

/** A world that records the blocks set in it. */
function worldOf(name: string) {
  return { name, set: vi.fn() };
}

/** The game's fields for a chest emptied in the dungeon, with the realm and its world chosen by the test. */
function rig(realm: 'dungeon' | 'sky', current: ReturnType<typeof worldOf>, chestViews: { remove: ReturnType<typeof vi.fn> }) {
  return Object.assign(Object.create(Game.prototype), { realm, world: current, chestViews, spits: [] as { t: number; run: () => void }[] });
}

describe('an emptied chest leaves its own world', () => {
  it('clears its block and model in the dungeon world when the dungeon is current', () => {
    const dungeon = worldOf('dungeon');
    const views = { remove: vi.fn() };
    const g = rig('dungeon', dungeon, views);
    const c = { spec, view: { id: 'chest' } };
    (g as any).removeChest(c, dungeon);
    expect(dungeon.set).toHaveBeenCalledWith(spec.x, spec.y, spec.z, AIR);
    expect(views.remove).toHaveBeenCalledWith(c.view);
    expect(g.spits).toHaveLength(0);
  });

  it('waits in the queue during a realm swap, and never clears the sky world at the same cell', () => {
    const dungeon = worldOf('dungeon');
    const sky = worldOf('sky');
    const views = { remove: vi.fn() };
    // the sky is current when the removal fires
    const g = rig('sky', sky, views);
    const c = { spec, view: { id: 'chest' } };
    (g as any).removeChest(c, dungeon);
    expect(sky.set).not.toHaveBeenCalled();
    expect(dungeon.set).not.toHaveBeenCalled();
    expect(views.remove).not.toHaveBeenCalled();
    expect(g.spits).toHaveLength(1);

    // time passes in the sky: the removal keeps waiting and the sky's world stays untouched
    for (let i = 0; i < 3; i++) (g as any).updateSpits(0.3);
    expect(sky.set).not.toHaveBeenCalled();
    expect(dungeon.set).not.toHaveBeenCalled();
    expect(g.spits).toHaveLength(1);

    // back in the dungeon, the removal runs in the dungeon's world
    g.realm = 'dungeon';
    g.world = dungeon;
    (g as any).updateSpits(0.3);
    expect(dungeon.set).toHaveBeenCalledTimes(1);
    expect(dungeon.set).toHaveBeenCalledWith(spec.x, spec.y, spec.z, AIR);
    expect(sky.set).not.toHaveBeenCalled();
    expect(views.remove).toHaveBeenCalledWith(c.view);
    expect(g.spits).toHaveLength(0);
  });
});
