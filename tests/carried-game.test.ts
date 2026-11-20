// The active carried item in the game's own methods (issue #144): every use (place, throw, drink,
// the alembic and the kitchen) targets the chosen item, not the top, and takes only that one.
// Game's methods run on a stand-in object (Object.create(Game.prototype)) that holds only what they
// read; the player is a real Player, so its selection is the one the game uses.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Player, type Carried } from '../src/entities/player';
import { AIR, MAT } from '../src/content/materials';
import { PARTS } from '../src/content/parts';
import { POTIONS, type PotionId } from '../src/content/potions';
import { createBus } from '../src/game/events';
import { newAlembic } from '../src/game/alembic';
import { newKitchen } from '../src/game/kitchen';
import { Input } from '../src/input/input';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { sfx: silent, sfx2: silent, sfx3: silent, easeMaster: () => {}, setMasterTarget: () => {}, spatial: () => {}, unlockAudio: () => {} };
});

type Rig = Record<string, any>;

let Game: typeof import('../src/game/game').Game;
beforeAll(async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  try {
    ({ Game } = await import('../src/game/game'));
  } finally {
    vi.unstubAllGlobals();
  }
}, 240000);

const part = PARTS[0];
const flask = { potion: Object.keys(POTIONS)[0] as PotionId };

/** A game stand-in with a real player holding `hand`, the choice on `active`, and stubs for the rest. */
function rig(hand: Carried[], active: number | null = null, extra: Rig = {}): Rig {
  const player = new Player();
  player.hand = [...hand];
  if (active !== null) player.select(active);
  player.yaw = Math.PI; // forward is +z
  player.body = { x: 20, y: 20, z: 20, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: false };
  const world: Rig = {
    get: () => AIR, set: vi.fn(), inside: () => true, idx: () => 7,
  };
  const hud = { toast: vi.fn(), toastDrinkHint: vi.fn(), carriedChanged: vi.fn() };
  return Object.assign(Object.create(Game.prototype), {
    player, hud, world,
    realm: 'dungeon', room: 0,
    bus: createBus(),
    stats: { get: (k: string) => (k === 'reach' ? 10 : 1), all: {} },
    hands: { placed: vi.fn(), holdUp: vi.fn(), update: vi.fn() },
    particles: { burst: vi.fn() },
    pickups: { add: vi.fn(() => ({})), launch: vi.fn() },
    debris: { clearCell: vi.fn(), spawn: vi.fn(() => 0), launch() {}, tags: [], cooldown: [] },
    potions: { drink: vi.fn() },
    heal: vi.fn(),
    doors: { inDoorway: () => false },
    labs: new Map(),
    kitchens: new Map(),
    nudge: vi.fn(),
    solid: () => false,
    input: { hit: () => true, hitBy: () => 'mouse', touchTap: null },
    camera: { position: new THREE.Vector3(5.5, 0.5, 0.5) },
    ...extra,
  });
}

describe('the game chooses and uses the active carried item', () => {
  it('chooseCarried makes a slot active, announces it once, and ignores slots out of the hand', () => {
    const g = rig([1, 2, 3]);
    (g as Rig).chooseCarried(0);
    expect(g.player.activeIndex).toBe(0);
    expect(g.hud.toast).toHaveBeenCalledWith('hand.active', expect.anything());
    expect(g.hud.carriedChanged).toHaveBeenCalledTimes(1);
    g.hud.toast.mockClear();
    g.chooseCarried(0);
    expect(g.hud.toast).not.toHaveBeenCalled();
    g.chooseCarried(5);
    g.chooseCarried(-1);
    expect(g.player.activeIndex).toBe(0);
    expect(g.player.hand).toEqual([1, 2, 3]);
  });

  it('stepCarried steps the choice and wraps round, and does nothing with one carried item', () => {
    const g = rig([1, 2, 3]);
    g.stepCarried(1);
    expect(g.player.activeIndex).toBe(0);
    g.stepCarried(-1);
    expect(g.player.activeIndex).toBe(2);
    g.stepCarried(1);
    expect(g.player.activeIndex).toBe(0);
    const one = rig([4]);
    one.stepCarried(1);
    expect(one.player.activeIndex).toBe(0);
    expect(one.hud.toast).not.toHaveBeenCalled();
  });

  it('place puts the active block into the world and keeps the rest of the hand', () => {
    const g = rig([MAT.stone, MAT.dirt], 0, {
      solid: (x: number, y: number, z: number) => x === 5 && y === 0 && z === 5,
      nudge: vi.fn(),
    });
    g.tryPlace();
    expect(g.world.set).toHaveBeenCalledWith(5, 0, 4, MAT.stone);
    expect(g.player.hand).toEqual([MAT.dirt]);
  });

  it('throw sends the active part out and keeps the top block in hand', () => {
    const g = rig([part, MAT.stone], 0);
    g.throwTop();
    expect(g.pickups.add).toHaveBeenCalledWith('part', expect.any(Number), expect.any(Number), expect.any(Number), 0, null, expect.any(Number), part);
    expect(g.player.hand).toEqual([MAT.stone]);
  });

  it('drink drinks the active flask, and refuses when the active item is a block even with a flask on top', () => {
    const drinking = rig([flask, MAT.stone], 0);
    drinking.drink();
    expect(drinking.potions.drink).toHaveBeenCalledWith(flask);
    expect(drinking.player.hand).toEqual([MAT.stone]);

    const refusing = rig([MAT.stone, flask], 0);
    refusing.drink();
    expect(refusing.potions.drink).not.toHaveBeenCalled();
    expect(refusing.player.hand).toEqual([MAT.stone, flask]);
  });

  it('the alembic takes the active item, not the top', () => {
    const lab = newAlembic();
    const g = rig([part, MAT.stone], 0, { labs: new Map([[7, lab]]) });
    g.feedLab(1, 1, 1);
    expect(lab.bulb).toEqual([part]);
    expect(g.player.hand).toEqual([MAT.stone]);
  });

  it('the kitchen cooks the active part, and the meal goes on top', () => {
    const kitchen = newKitchen();
    const g = rig([part, MAT.stone], 0, { kitchens: new Map([[7, kitchen]]) });
    g.cookAt(1, 1, 1);
    expect(kitchen.cooks).toBeLessThan(newKitchen().cooks);
    expect(g.player.hand[0]).toBe(MAT.stone);
    expect(g.player.hand).toHaveLength(2);
    expect(typeof g.player.hand[1]).toBe('object');
    expect((g.player.hand[1] as { potion: PotionId }).potion).toBeTruthy();
  });
});

describe('the input reads the carried-item controls', () => {
  type Listener = (e: Record<string, unknown>) => void;

  /** A keyboard, wheel and touch input whose global listeners the test can fire. */
  function input() {
    const listeners = new Map<string, Listener[]>();
    vi.stubGlobal('addEventListener', (type: string, fn: Listener) => { listeners.set(type, [...(listeners.get(type) ?? []), fn]); });
    vi.stubGlobal('document', { addEventListener() {}, pointerLockElement: null });
    vi.stubGlobal('matchMedia', undefined);
    const inp = new Input({} as HTMLElement);
    vi.unstubAllGlobals();
    const fire = (type: string, e: Record<string, unknown>) => listeners.get(type)?.forEach(fn => fn(e));
    return { inp, fire };
  }

  it('a number key reads its slot, and Enter reads none', () => {
    const { inp, fire } = input();
    fire('keydown', { code: 'Digit3', repeat: false, preventDefault() {} });
    expect(inp.hit('pick')).toBe(true);
    expect(inp.digit()).toBe(2);
    inp.endFrame();
    fire('keydown', { code: 'Enter', repeat: false, preventDefault() {} });
    expect(inp.hit('pick')).toBe(true);
    expect(inp.digit()).toBe(-1);
  });

  it('one wheel step per throttle window, so a free-spinning wheel does not skip slots', () => {
    const { inp, fire } = input();
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValue(1000);
    fire('wheel', { deltaY: 120 });
    fire('wheel', { deltaY: 120 });
    fire('wheel', { deltaY: 120 });
    expect(inp.hit('next')).toBe(true);
    inp.endFrame();
    now.mockReturnValue(1050);
    fire('wheel', { deltaY: 120 });
    expect(inp.hit('next')).toBe(false);
    now.mockReturnValue(1200);
    fire('wheel', { deltaY: -120 });
    expect(inp.hit('previous')).toBe(true);
    now.mockRestore();
  });

  it('a tap on a hand slot is a touch pick of that slot', () => {
    const { inp } = input();
    inp.touchSlot = 2;
    inp.touchPressed.add('pick');
    expect(inp.hit('pick')).toBe(true);
    expect(inp.hitBy('pick')).toBe('touch');
  });
});
