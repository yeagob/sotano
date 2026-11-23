// The minimap (issue #302; docs/design/built/feel/HUD.md "The minimap"): the player is always on the map, a floor's
// explored rooms stay on it for the whole run, and the holes the player digs more than 2 blocks tall are drawn as
// tunnels. The pure parts live in src/game/minimap.ts; the explored rooms are driven through the real `trackPlace`.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { bandRange, gridPoint, MAP_CELL, mapPlace, mapPx, TUNNEL_MIN_HEIGHT, TunnelLog, type MapFloor } from '../src/game/minimap';
import { bandOf, roomOrigin, floorY, levelIndex, ROOM_ID_STRIDE } from '../src/world/floor';

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

const K = 2;
const Y0 = floorY(K);
const id = (i: number) => levelIndex(K) * ROOM_ID_STRIDE + i;

/** One room of a cell, all of it open, on floor K. */
function room(i: number, gx: number, gz: number) {
  const [x0, z0] = roomOrigin(gx, gz);
  return { id: id(i), floor: K, type: 'normal', template: 'plain', gx, gz, x0, z0, hx: x0, hz: z0, y0: Y0, w: 13, d: 7, height: 5, open: new Uint8Array(13 * 7).fill(1) };
}

/** Floor K: room A (cell 1,3) and room B (cell 2,3), side by side with a wall between them. */
function floor() {
  const rooms = [room(0, 1, 3), room(1, 2, 3)];
  const space = new Int16Array(49).fill(-1);
  space[1 + 3 * 7] = 0;
  space[2 + 3 * 7] = 1;
  return { plan: { w: 7, h: 7, rooms: [{ links: {} }, { links: {} }] }, rooms, space };
}

const inside = (r: ReturnType<typeof room>) => ({ x: r.x0 + 6.5, z: r.z0 + 3.5 });

describe('the player on the map', () => {
  const f = floor() as unknown as MapFloor;
  const [a, b] = floor().rooms;

  it('sits on the room cell inside a room', () => {
    const p = mapPlace(f, inside(a).x, Y0, inside(a).z);
    expect(p).toEqual({ room: a.id, u: a.gx + 0.5, v: a.gz + 0.5 });
    // the room cell's centre is where the HUD draws the room
    const [px, pz] = mapPx(p.u, p.v);
    expect(px).toBe(MAP_CELL.gap + a.gx * (MAP_CELL.w + MAP_CELL.gap) + MAP_CELL.w / 2);
    expect(pz).toBe(MAP_CELL.gap + a.gz * (MAP_CELL.h + MAP_CELL.gap) + MAP_CELL.h / 2);
  });

  it('follows the body in the wall between two rooms, in rock and in a dug hole under the floor', () => {
    const wallX = a.x0 + a.w + 0.5;
    const wall = mapPlace(f, wallX, Y0, inside(a).z);
    expect(wall.room).toBe(-1);
    expect(wall.u).toBeGreaterThan(a.gx + 0.5);
    expect(wall.u).toBeLessThan(b.gx + 0.5);
    // a cell with no room (rock) and a hole three blocks under room A's floor
    expect(mapPlace(f, roomOrigin(4, 4)[0] + 3, Y0, roomOrigin(4, 4)[1] + 3).room).toBe(-1);
    const deep = mapPlace(f, inside(a).x, Y0 - 4, inside(a).z);
    expect(deep.room).toBe(-1);
    expect(deep.u).toBeCloseTo(gridPoint(inside(a).x, 0)[0]);
  });
});

describe('the dug tunnels', () => {
  const air = () => true;
  const [lo, hi] = bandRange(K);

  it('band range is the band bandOf gives', () => {
    expect(bandOf(lo)).toBe(K);
    expect(bandOf(hi)).toBe(K);
    expect(bandOf(lo - 1)).toBe(K + 1);
    expect(bandOf(hi + 1)).toBe(K - 1);
  });

  it('a hole 2 blocks tall is not drawn; one more block makes it a tunnel', () => {
    const t = new TunnelLog();
    t.dig(30, Y0, 40); t.dig(30, Y0 + 1, 40);
    expect(t.tiles(lo, hi, air)).toEqual([]);
    const v = t.version;
    t.dig(30, Y0 + 2, 40);
    expect(t.version).toBeGreaterThan(v);
    expect(t.tiles(lo, hi, air)).toEqual([[30, 40]]);
    expect(TUNNEL_MIN_HEIGHT).toBe(3);
  });

  it('counts only blocks one above the other that are still open', () => {
    const t = new TunnelLog();
    // three dug blocks with a gap: two runs of 1 and 2
    t.dig(10, Y0, 10); t.dig(10, Y0 + 2, 10); t.dig(10, Y0 + 3, 10);
    expect(t.tiles(lo, hi, air)).toEqual([]);
    // a tunnel the player fills back in leaves the map
    t.dig(11, Y0, 10); t.dig(11, Y0 + 1, 10); t.dig(11, Y0 + 2, 10);
    expect(t.tiles(lo, hi, air)).toEqual([[11, 10]]);
    expect(t.tiles(lo, hi, (_x, y) => y !== Y0 + 1)).toEqual([]);
  });

  it('a shaft dug through the floor shows on both floors it crosses, and a new run clears it', () => {
    const t = new TunnelLog();
    for (let y = Y0 - 4; y < Y0; y++) t.dig(50, y, 20);
    const [lo2, hi2] = bandRange(K + 1);
    expect(t.tiles(lo, hi, air)).toEqual([[50, 20]]);
    expect(t.tiles(lo2, hi2, air)).toEqual([[50, 20]]);
    const [lo0, hi0] = bandRange(K - 1);
    expect(t.tiles(lo0, hi0, air)).toEqual([]);
    t.clear();
    expect(t.tiles(lo, hi, air)).toEqual([]);
  });
});

describe('explored rooms stay on the map (trackPlace)', () => {
  /** The game's place step with floor K, the player in room A, A explored. */
  function rig() {
    const g: any = Object.create(Game.prototype);
    const f = floor();
    const shown: Set<number>[] = [];
    Object.assign(g, {
      realm: 'dungeon', depth: K, maxDepth: K, room: id(0), visited: new Set([id(0)]),
      floors: new Map([[K, f]]), bossRooms: new Map(), roomState: new Map(),
      player: { room: id(0), body: { x: 0, y: Y0, z: 0 } },
      bus: { emit: (_k: string, e: object) => e, clearDeferred() {} },
      potions: { endFloor: () => [] }, potionsEnded() {}, activate() {}, carve() {},
      hud: { setFloor() {}, toast() {}, setRoom: (_f: unknown, _r: number, v: Set<number>) => shown.push(new Set(v)) },
    });
    return { g, f, shown };
  }
  const at = (g: any, x: number, y: number, z: number) => { Object.assign(g.player.body, { x, y, z }); g.trackPlace(1 / 60); };

  it('a hole dug under room A into the next band, then a wall dug into room B, keeps room A explored', () => {
    const { g, f, shown } = rig();
    const [a, b] = f.rooms;
    // three blocks down: the body is in floor K + 1's band (a new deepest floor)
    at(g, inside(a).x, Y0 - 3, inside(a).z);
    expect(g.maxDepth).toBe(K + 1);
    // back up and through the wall into room B
    at(g, inside(a).x, Y0, inside(a).z);
    at(g, a.x0 + a.w + 0.5, Y0, inside(a).z);
    at(g, inside(b).x, Y0, inside(b).z);
    expect(g.room).toBe(b.id);
    expect([...g.visited].sort()).toEqual([a.id, b.id]);
    expect(shown.at(-1)).toEqual(new Set([a.id, b.id]));
  });

  it('a room entered again is not a first visit after the floor below was reached', () => {
    const { g, f } = rig();
    const [a, b] = f.rooms;
    const firsts: boolean[] = [];
    g.bus.emit = (k: string, e: any) => { if (k === 'roomEnter') firsts.push(e.firstVisit); return e; };
    at(g, inside(b).x, Y0, inside(b).z);
    at(g, inside(a).x, Y0 - 3, inside(a).z);
    at(g, inside(a).x, Y0, inside(a).z);
    expect(firsts).toEqual([true, false]);
  });
});
