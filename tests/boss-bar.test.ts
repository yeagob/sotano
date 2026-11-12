// The boss bar at the top of the screen (issue #163). It shows the boss of the room the player is in while
// the fight is on. It hides the frame the player dies, for as long as the death screen is up, and once a reset
// (R or respawn) makes the new world. A menu, the toll or the pause card leaves it as it is. It shows again
// only when a fight resumes.
//
// These tests drive the real `frame()` entry point, so the simulate gate (running = alive, no menu, no toll,
// not transitioning) is the one the game uses. `trackPlace` (the place and boss-room step inside simulate)
// and the boss state are real; the rest of the world, rendering and audio are stand-ins that absorb calls.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BOSS_BY_ID } from '../src/content/bosses';

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

const BOSS = [...BOSS_BY_ID.values()][0];
const ROOM = 4;
/** Six seconds: the R fade (0.45 s) and the reveal hold (at most 2 s). */
const RESTART_FRAMES = 60 * 6;

/** A value that absorbs every use: a call, a property write, a read as a number (0). */
const anything: any = new Proxy(function () {}, {
  get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything),
  apply: () => anything,
  set: () => true,
});

/** A boss room's state as enterBossRoom makes it, its boss already summoned. */
const fight = (room = ROOM) => ({ room, wake: 0, spawned: true, defeated: false, t: 0, open: false, warned: false, dust: 0, asked: false });
const boss = (room = ROOM, hp = 50) => ({ id: room * 10, alive: true, spec: BOSS, room, hp, maxHp: 100 });

/** The game's fields as the frame sees them: the player alive in room ROOM, the HUD and input stand-ins. */
function rig(realm: 'dungeon' | 'sky' = 'dungeon'): any {
  const g: any = Object.create(Game.prototype);
  const hud: any = {
    bar: null as unknown,
    bossBar(b: unknown) { this.bar = b; },
    shakeAmount: () => 0,
    sanctuary: { covering: false },
    sanctuaryOpen: false, screenOpen: false, tollOpen: false, bannerOpen: false, presenceOfferOpen: false,
    update() {}, fadeIn() {}, fadeOut() {}, dismissBanner() {}, screenKey() {}, closeScreen() {}, closeToll() {},
    moveSelection() {}, confirmToll() {}, setFov() {},
  };
  // `restart` is the device that presses R this frame (null: no press)
  const input: any = {
    playing: true, restart: null as string | null,
    poll() {}, endFrame() {}, resume() {}, release() {}, suppress() {},
    hit: () => false,
    hitBy: (name: string) => (name === 'restart' ? input.restart : null),
    navigate: () => ({ x: 0, y: 0 }),
  };
  const player = { dead: false, id: 0, eye: { x: 0, y: 0, z: 0 }, body: { x: 0, y: 0, z: 0 }, walkPhase: 0, pitch: 0, yaw: 0 };
  return Object.assign(g, {
    realm, depth: 1, maxDepth: 99, room: ROOM,
    floors: new Map(), bossRooms: new Map(), enemies: { list: [] as unknown[] },
    player, hud, input,
    simulateUnlocked: false, paused: false, sandbox: undefined,
    restartT: 0, revealT: -1, deadT: 0, fpsAcc: 0, fpsN: 0, fovNow: 0, time: 0,
    world: null, fogColor: anything, camDir: anything, camera: anything, scene: anything, stars: anything,
    renderer: anything, hands: anything, touch: anything, sky: anything,
    // `transitioning` (a getter) reads restartT, revealT and gate.busy: no transition unless a test starts one
    gate: { busy: false, update() {} },
    chunks: { busy: false, update() {}, streamOuter() {}, setVisibleRange() {}, animate() {} },
    // the world's simulation: the real place and boss-room step, and the rest of the world is left out
    simulated: 0,
    simulate(this: any, dt: number) { this.simulated++; if (this.below) this.trackPlace(dt); },
    stream() {},
    // newRun's part in this test: the boss state and the enemies are new, and the player lives again
    newRun() { this.bossRooms.clear(); this.enemies = { list: [] }; this.player.dead = false; },
  });
}

/** Runs n frames of the real `frame()` at 60 fps. */
function frames(g: any, n: number) {
  for (let i = 0; i < n; i++) g.frame(1 / 60);
  return g;
}

/** A boss fight on in this room, its boss alive at half health. */
function fightOn(g: any, room = ROOM, hp = 50) {
  g.bossRooms.set(1, fight(room));
  g.enemies.list = [boss(room, hp)];
}

/** The bar as the player sees it: the last value the HUD was given. */
const bar = (g: any) => g.hud.bar;

/** Press R on a device for one frame, then let the fade and the reveal run out. */
function pressRestart(g: any, device: 'keyboard' | 'gamepad') {
  g.input.restart = device;
  frames(g, 1);
  g.input.restart = null;
  return frames(g, RESTART_FRAMES);
}

describe('the boss bar (issue #163)', () => {
  it('shows the boss of the room while the player fights it', () => {
    const g = rig();
    fightOn(g);
    frames(g, 1);
    expect(bar(g)).toEqual({ name: expect.any(String), ratio: 0.5 });
  });

  it('hides the frame the player dies, while the boss is still alive in the room', () => {
    const g = rig();
    fightOn(g);
    frames(g, 1);
    expect(bar(g)).not.toBeNull();
    const simulated = g.simulated;
    g.player.dead = true;
    frames(g, 1);
    expect(bar(g)).toBeNull();
    expect(g.simulated).toBe(simulated); // the world is frozen while dead: the gate is the one under test
  });

  it('stays hidden for as long as the death screen is up', () => {
    const g = rig();
    fightOn(g);
    g.player.dead = true;
    frames(g, 120);
    expect(bar(g)).toBeNull();
  });

  it('stays hidden after the respawn that follows a death', () => {
    const g = rig();
    fightOn(g);
    frames(g, 1);
    g.player.dead = true;
    frames(g, 1);
    pressRestart(g, 'keyboard');
    expect(g.player.dead).toBe(false);
    expect(g.bossRooms.size).toBe(0);
    expect(bar(g)).toBeNull();
    frames(g, 60);
    expect(bar(g)).toBeNull();
  });

  it('hides when R resets the fight', () => {
    const g = rig();
    fightOn(g);
    frames(g, 1);
    expect(bar(g)).not.toBeNull();
    pressRestart(g, 'keyboard');
    expect(g.bossRooms.size).toBe(0);
    expect(bar(g)).toBeNull();
  });

  it('a pause card does not leave the fight, and the pad restart from the pause card resets it', () => {
    const g = rig();
    fightOn(g);
    frames(g, 1);
    g.input.playing = false;
    frames(g, 1);
    expect(bar(g)).not.toBeNull();
    pressRestart(g, 'gamepad');
    expect(g.bossRooms.size).toBe(0);
    expect(bar(g)).toBeNull();
  });

  it('R from the keyboard while the pause card is open does nothing: the fight and its bar stay', () => {
    const g = rig();
    fightOn(g);
    frames(g, 1);
    g.input.playing = false;
    pressRestart(g, 'keyboard');
    expect(g.restartT).toBe(0);
    expect(g.bossRooms.size).toBe(1);
    expect(bar(g)).not.toBeNull();
  });

  it('R while a menu or the toll is open does not reset the fight, and the bar stays', () => {
    const g = rig();
    fightOn(g);
    frames(g, 1);
    g.hud.screenOpen = true;
    pressRestart(g, 'keyboard');
    expect(g.bossRooms.size).toBe(1);
    expect(bar(g)).not.toBeNull();
    g.hud.screenOpen = false;
    g.hud.tollOpen = true;
    pressRestart(g, 'keyboard');
    expect(g.bossRooms.size).toBe(1);
    expect(bar(g)).not.toBeNull();
  });

  it('shows again only when a fight resumes: the boss must be summoned and alive in this room', () => {
    const g = rig();
    fightOn(g);
    g.player.dead = true;
    frames(g, 1);
    pressRestart(g, 'keyboard');
    // the new run's boss room is still waking: no bar yet
    g.bossRooms.set(1, { ...fight(), spawned: false, wake: 2 });
    frames(g, 1);
    expect(bar(g)).toBeNull();
    // the boss rises and the fight resumes
    fightOn(g);
    frames(g, 1);
    expect(bar(g)).not.toBeNull();
  });

  it('hides when the boss falls', () => {
    const g = rig();
    g.bossRooms.set(1, fight());
    g.enemies.list = [{ ...boss(), alive: false }];
    frames(g, 1);
    expect(bar(g)).toBeNull();
  });

  it('hides while the player is in another room', () => {
    const g = rig();
    g.bossRooms.set(1, fight(7));
    g.enemies.list = [boss(7)];
    frames(g, 1);
    expect(bar(g)).toBeNull();
  });

  it('follows the current room when two boss rooms are known, whatever their order', () => {
    const g = rig();
    // this room's boss (the deeper floor) is inserted first, the other room's boss last
    g.bossRooms.set(2, { ...fight(ROOM), floor: 2 });
    g.bossRooms.set(1, fight(7));
    g.enemies.list = [boss(ROOM, 30), boss(7, 80)];
    frames(g, 1);
    expect(bar(g)).toEqual({ name: expect.any(String), ratio: 0.3 });
  });

  it('leaves the sky alone: the sky sets its own bar for a deity', () => {
    const g = rig('sky');
    fightOn(g);
    const deity = { name: 'deity', ratio: 0.4 };
    g.hud.bar = deity;
    frames(g, 1);
    expect(bar(g)).toBe(deity);
  });
});
