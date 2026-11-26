// Issue #327, the owner's floor rule (criteria 9 and 10): allies never change floor. Once a floor's boss is
// overcome, or the floor is opened, its allies stand still; changing floor removes them; a room change takes
// allies through the door only inside one floor. Game's methods run on a stand-in (Object.create(Game.prototype))
// that holds only what they read; the movement itself is tested in allies-escort.test.ts.

import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: silent, unlockAudio: () => {} };
});

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
}, 60_000);

/** A value that absorbs every use: a call, a property write, a read as a number (0). */
const anything: any = new Proxy(function () {}, {
  get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything),
  apply: () => anything,
  set: () => true,
});

const being = (id: number, room: number, faction: string) => ({ id, room, faction, alive: true, body: { x: 0, y: 0, z: 0, h: 1 } });

function rig() {
  const g: any = Object.create(Game.prototype);
  g.rooms = new Map([[10, { id: 10, floor: 1 }], [11, { id: 11, floor: 1 }], [20, { id: 20, floor: 2 }]]);
  g.bossRooms = new Map();
  const list = [being(1, 10, 'self'), being(2, 11, 'self'), being(3, 20, 'self'), being(4, 10, 'projection'), being(5, 10, 'neutral')];
  const gone: number[] = [];
  g.enemies = { list, dissolve: (e: any) => { e.alive = false; gone.push(e.id); }, crossDoor: vi.fn() };
  g.actors = { remove: () => {} }; g.contacts = { forget: () => {} }; g.projectionSeq = new Map(); g.bus = anything; g.particles = anything;
  return { g, gone, list };
}

describe('allies never change floor (owner, #327)', () => {
  it('criterion 10: entering a floor removes every ally of another floor, and nothing else', () => {
    const { g, gone } = rig();
    g.dismissAllies(2);
    expect(gone.sort()).toEqual([1, 2]);
  });

  it('criterion 9: a floor is settled once its boss is overcome or it is opened, and only that floor', () => {
    const { g } = rig();
    expect(g.floorSettled(10)).toBe(false);
    g.bossRooms.set(1, { defeated: false, open: false });
    expect(g.floorSettled(10)).toBe(false);
    g.bossRooms.get(1).defeated = true;
    expect(g.floorSettled(10)).toBe(true);
    expect(g.floorSettled(11)).toBe(true);
    expect(g.floorSettled(20)).toBe(false);
    g.bossRooms.set(2, { defeated: false, open: true });
    expect(g.floorSettled(20)).toBe(true);
  });

  it('a room change takes allies through the door inside one floor, never into another floor', () => {
    const { g } = rig();
    let at: any = { id: 10, floor: 1, type: 'normal' };
    Object.assign(g, {
      player: { body: { x: 0, y: 0, z: 0 }, room: 10 }, room: 10, maxDepth: 99, rawBand: 0, visited: new Set(), hud: anything, bus: anything,
      floors: new Map(), roomAt: () => at, clearedRooms: () => new Set(),
    });
    g.rooms.set(10, at); g.rooms.set(11, { id: 11, floor: 1, type: 'normal' }); g.rooms.set(20, { id: 20, floor: 2, type: 'normal' });
    at = g.rooms.get(11);
    g.trackPlace(0);
    expect(g.enemies.crossDoor).toHaveBeenCalledWith(10, 11);
    at = g.rooms.get(20);
    g.trackPlace(0);
    expect(g.enemies.crossDoor).toHaveBeenCalledTimes(1);
    expect(g.room).toBe(20);
  });
});
