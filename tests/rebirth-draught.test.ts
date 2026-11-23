// The Rebirth Draught (issue #52): drinking it asks first on the offer card, a yes takes it out of the hand and
// starts a new run that keeps the practices (with their stacks); a no keeps everything; never in the sandbox.
// Game's methods run on a stand-in object (as in carried-game.test.ts). The player is a real Player.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Player, type Carried } from '../src/entities/player';
import { AIR, MAT } from '../src/content/materials';
import { PARTS } from '../src/content/parts';
import { POTION_IDS, POTIONS, type Flask } from '../src/content/potions';
import { brewOf } from '../src/content/recipes';
import { createBus } from '../src/game/events';
import { Kairos } from '../src/game/kairos';
import type { SavedItem } from '../src/items/inventory';

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

const rebirth: Flask = { potion: 'rebirth-draught' };
/** The first part of a bestiary pattern (its source) of a kind: a fixture for the recipe. */
const partOf = (source: string, kind: string): Carried => {
  const p = PARTS.find(x => x.source === source && x.kind === kind);
  if (!p) throw new Error(`no part ${source} ${kind}`);
  return p;
};

/** A game stand-in holding `hand` with the choice on `active`; `sandbox` set makes it the sandbox. */
function rig(hand: Carried[], active: number | null, extra: Rig = {}): Rig {
  const player = new Player();
  player.hand = [...hand];
  if (active !== null) player.select(active);
  player.body = { x: 20, y: 20, z: 20, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: false };
  return Object.assign(Object.create(Game.prototype), {
    player,
    sandbox: null,
    restartT: 0, revealT: -1, gate: { busy: false }, // what the transitioning getter reads
    pendingRebirth: false,
    kairos: new Kairos(), // newRun cancels a running time stop
    rebirthKeep: null,
    hud: { toast: vi.fn(), presenceOfferCard: vi.fn(), closePresenceOffer: vi.fn(), setItems: vi.fn() },
    input: { modal: false, suppress: vi.fn(), resume: vi.fn(), unlockFor: vi.fn() },
    hands: { placed: vi.fn() },
    potions: { drink: vi.fn() },
    heal: vi.fn(),
    requestRestart: vi.fn(),
    bus: createBus(),
    world: { get: () => AIR, set: vi.fn(), inside: () => true, idx: () => 7 },
    stats: { get: () => 1, all: {} },
    particles: { burst: vi.fn() },
    ...extra,
  });
}

describe('the Rebirth Draught: it asks before it does anything', () => {
  it('is a potion with no heal, no stats and no duration, in the list of potions', () => {
    expect(POTION_IDS).toContain('rebirth-draught');
    expect(POTIONS['rebirth-draught']).toMatchObject({ rebirth: true, duration: { kind: 'instant' } });
    expect(POTIONS['rebirth-draught'].heal).toBeUndefined();
    expect(POTIONS['rebirth-draught'].stats).toBeUndefined();
  });

  it('is brewed by one heart of will, one mind of mind and one flesh of body, in any order', () => {
    const bulb: Carried[] = [partOf('panic', 'heart'), partOf('doubt', 'mind'), partOf('impulse', 'flesh')];
    expect(brewOf(bulb)).toBe('rebirth-draught');
    expect(brewOf([...bulb].reverse())).toBe('rebirth-draught');
  });

  it('drinking it opens the offer card and leaves the flask in hand and the potion undrunk', () => {
    const g = rig([rebirth], 0);
    g.drink();
    expect(g.hud.presenceOfferCard).toHaveBeenCalledWith(
      POTIONS['rebirth-draught'].name, undefined, 'potion.rebirth.question', false, undefined,
      { accept: 'potion.rebirth.begin', decline: 'potion.rebirth.stay', controls: 'potion.rebirth.controls' },
    );
    expect(g.pendingRebirth).toBe(true);
    expect(g.player.hand).toEqual([rebirth]);
    expect(g.potions.drink).not.toHaveBeenCalled();
    expect(g.requestRestart).not.toHaveBeenCalled();
  });

  it('never opens in the sandbox: it says so and does nothing', () => {
    const g = rig([rebirth], 0, { sandbox: { name: 'scenario' } });
    g.drink();
    expect(g.hud.presenceOfferCard).not.toHaveBeenCalled();
    expect(g.hud.toast).toHaveBeenCalledWith('potion.rebirth.sandbox');
    expect(g.player.hand).toEqual([rebirth]);
  });
});

describe('the Rebirth Draught: the answer', () => {
  it('yes takes the flask out of the hand and asks for a new run that keeps the practices with their stacks', () => {
    const g = rig([MAT.stone, rebirth], 1, { inventory: { serialize: () => ['fartlek', { id: 'herbalism', stacks: 3 }] as SavedItem[] } });
    g.pendingRebirth = true;
    g.resolveRebirth(true);
    expect(g.player.hand).toEqual([MAT.stone]);
    expect(g.rebirthKeep).toEqual(['fartlek', { id: 'herbalism', stacks: 3 }]);
    expect(g.requestRestart).toHaveBeenCalledTimes(1);
    expect(g.pendingRebirth).toBe(false);
  });

  it('no keeps the flask and everything else, and asks for nothing', () => {
    const g = rig([rebirth], 0);
    g.pendingRebirth = true;
    g.resolveRebirth(false);
    expect(g.player.hand).toEqual([rebirth]);
    expect(g.rebirthKeep).toBeNull();
    expect(g.requestRestart).not.toHaveBeenCalled();
    expect(g.pendingRebirth).toBe(false);
  });
});

describe('a new run keeps only what a Rebirth Draught keeps', () => {
  it('restores the saved practices after the run begins, and resets the hearts to the new run', () => {
    const keep: SavedItem[] = ['fartlek', { id: 'herbalism', stacks: 2 }];
    const restore = vi.fn();
    const g = rig([], null, {
      begin: vi.fn(),
      inventory: { restore, items: [{ def: { id: 'fartlek' } }] },
      syncWeapon: vi.fn(),
      stats: { get: (k: string) => (k === 'maxHearts' ? 3 : 1) },
      player: Object.assign(new Player(), { hp: 1 }),
      seedCode: 'ABCDEFGH',
    });
    g.newRun(undefined, keep);
    expect(g.begin).toHaveBeenCalledTimes(1);
    expect(restore).toHaveBeenCalledWith(keep);
    expect(g.player.hp).toBe(g.maxHp);
    expect(g.hud.setItems).toHaveBeenCalled();
  });

  it('a plain new run restores nothing', () => {
    const restore = vi.fn();
    const g = rig([], null, { begin: vi.fn(), inventory: { restore, items: [] }, syncWeapon: vi.fn(), seedCode: 'ABCDEFGH' });
    g.newRun(undefined);
    expect(restore).not.toHaveBeenCalled();
  });
});

describe('the hand: a choice among six or more carried items', () => {
  it('selects any of six slots by its index and steps through them, wrapping round', () => {
    const hand: Carried[] = [MAT.stone, MAT.dirt, MAT.grass, MAT.obsidian, MAT.ore, rebirth];
    const p = new Player();
    p.hand = [...hand];
    p.select(5);
    expect(p.active).toBe(rebirth);
    p.cycle(1);
    expect(p.activeIndex).toBe(0);
    p.cycle(-1);
    expect(p.activeIndex).toBe(5);
  });

  it('keeps the choice on its item when an item before it leaves the hand', () => {
    const p = new Player();
    p.hand = [MAT.stone, MAT.dirt, MAT.grass, MAT.obsidian, MAT.ore, rebirth];
    p.select(5);
    p.removeAt(0);
    expect(p.active).toBe(rebirth);
  });
});
