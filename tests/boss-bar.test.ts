// The boss bar at the top of the screen (issue #163): it shows the boss of the room the player is in while
// the fight is on, and it hides on death, on R (a reset clears the boss rooms) and after respawn, showing
// again only when a fight resumes. The real per-frame entry point (`trackPlace`) runs on a stand-in object
// that holds only what it reads, as in game-realm-passage.test.ts; the stand-in HUD keeps the bar it was given.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BOSS_BY_ID } from '../src/content/bosses';

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
}, 60_000);

const BOSS = [...BOSS_BY_ID.values()][0];
const ROOM = 4;

/** A boss room's state as enterBossRoom makes it, with its boss already summoned. */
const fight = (room: number, floor = 1) => ({ floor, room, wake: 0, spawned: true, defeated: false, t: 0, open: false, warned: false, dust: 0, asked: false });
const boss = (room: number, hp = 50) => ({ id: room * 10, alive: true, spec: BOSS, room, hp, maxHp: 100 });

/** The game's fields as one frame of the dungeon sees them, the player standing in room ROOM, alive. */
function rig(): any {
  const g: any = Object.create(Game.prototype);
  Object.assign(g, {
    realm: 'dungeon', depth: 1, maxDepth: 99, room: ROOM,
    floors: new Map(),
    bossRooms: new Map(),
    player: { dead: false, body: { x: 0, y: 0, z: 0 } },
    enemies: { list: [] },
    hud: { bar: null as unknown, bossBar(b: unknown) { this.bar = b; } },
  });
  g.roomAt = () => ({ id: ROOM, floor: 1, type: 'boss' });
  return g;
}

/** One frame of the dungeon, then what the bar shows on screen. */
const frame = (g: any) => { g.trackPlace(1 / 60); return g.hud.bar; };

describe('the boss bar (issue #163)', () => {
  it('shows the boss of the room while the player fights it', () => {
    const g = rig();
    g.bossRooms.set(1, fight(ROOM));
    g.enemies.list = [boss(ROOM)];
    expect(frame(g)).toEqual({ name: expect.any(String), ratio: 0.5 });
  });

  it('hides on death, while the boss is still alive in the room', () => {
    const g = rig();
    g.bossRooms.set(1, fight(ROOM));
    g.enemies.list = [boss(ROOM)];
    expect(frame(g)).not.toBeNull();
    g.player.dead = true;
    expect(frame(g)).toBeNull();
  });

  it('stays hidden after the respawn that follows a death', () => {
    const g = rig();
    g.bossRooms.set(1, fight(ROOM));
    g.enemies.list = [boss(ROOM)];
    frame(g);
    g.player.dead = true;
    frame(g);
    // newRun: a new world, no boss rooms, no enemies, the player alive again
    g.bossRooms.clear(); g.enemies = { list: [] }; g.player.dead = false;
    expect(frame(g)).toBeNull();
  });

  it('hides at once on R during the fight, with the player alive', () => {
    const g = rig();
    g.bossRooms.set(1, fight(ROOM));
    g.enemies.list = [boss(ROOM)];
    expect(frame(g)).not.toBeNull();
    g.bossRooms.clear(); g.enemies = { list: [] };
    expect(frame(g)).toBeNull();
  });

  it('shows again only when a fight resumes: the boss is summoned and alive in this room', () => {
    const g = rig();
    g.bossRooms.set(1, fight(ROOM));
    g.enemies.list = [boss(ROOM)];
    frame(g);
    g.player.dead = true; frame(g);
    g.bossRooms.clear(); g.enemies = { list: [] }; g.player.dead = false;
    // the new run's boss room is still waking: no bar yet
    g.bossRooms.set(1, { ...fight(ROOM), spawned: false, wake: 2 });
    expect(frame(g)).toBeNull();
    // the boss rises and the fight resumes
    g.bossRooms.set(1, fight(ROOM));
    g.enemies.list = [boss(ROOM)];
    expect(frame(g)).not.toBeNull();
  });

  it('hides when the boss is defeated', () => {
    const g = rig();
    g.bossRooms.set(1, fight(ROOM));
    g.enemies.list = [{ ...boss(ROOM), alive: false }];
    expect(frame(g)).toBeNull();
  });

  it('hides while the player is in another room', () => {
    const g = rig();
    g.bossRooms.set(1, fight(7));
    g.enemies.list = [boss(7)];
    expect(frame(g)).toBeNull();
  });

  it('follows the current room when two boss rooms are known, whatever their order', () => {
    const g = rig();
    // the boss of the deeper floor (this room) is inserted first, the other room's boss last
    g.bossRooms.set(2, fight(ROOM, 2));
    g.bossRooms.set(1, fight(7, 1));
    g.enemies.list = [boss(ROOM, 30), boss(7, 80)];
    expect(frame(g)).toEqual({ name: expect.any(String), ratio: 0.3 });
  });
});
