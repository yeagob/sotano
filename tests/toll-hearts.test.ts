// The toll takes the exact hearts chosen (issue #155): each base heart with the health it holds, each bonus heart
// whole, and nothing else. The rules are pure (src/game/toll.ts); payToll runs on the real Game method over a
// stand-in that holds only what it reads, as in game-realm-passage.test.ts.

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HEART } from '../src/entities/actors';
import type { HeartLayer } from '../src/entities/hearts';
import { createBus } from '../src/game/events';
import { baseFill, heartTollIds, heartTollPlan, splitHeartPicks } from '../src/game/toll';
import { StatSheet } from '../src/core/stats';

vi.mock('../src/audio/sfx', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return {
    sfx: silent, sfx2: silent, sfx3: silent, sfxHeart: silent, easeMaster: () => {}, setMasterTarget: () => {},
    spatial: () => {}, unlockAudio: () => {}, setEcho: () => {}, starTheme: silent,
  };
});
vi.mock('../src/world/floor', async importOriginal => ({ ...(await importOriginal<typeof import('../src/world/floor')>()), openHole: vi.fn() }));

const blue = (hp = HEART): HeartLayer => ({ kind: 'blue', hp });
const stone = (hp = HEART): HeartLayer => ({ kind: 'stone', hp });

describe('the toll lists each heart on its own', () => {
  it('offers one base heart per container that holds health, then one tile per bonus heart', () => {
    expect(heartTollIds(20, [blue(), stone()], 3)).toEqual(['heart:0', 'heart:1', 'heart:2', 'layer:0', 'layer:1']);
  });

  it('offers no base heart while a single base container is left, since that one must stay', () => {
    expect(heartTollIds(8, [blue()], 1)).toEqual(['layer:0']);
    expect(heartTollIds(8, [], 1)).toEqual([]);
  });

  it('charges a partly filled base heart with the health it holds, never rounded to a whole one', () => {
    expect([0, 1, 2].map(i => baseFill(20, i))).toEqual([8, 8, 4]);
    expect(baseFill(20, 3)).toBe(0);
  });
});

describe('the toll plan: exactly the hearts chosen', () => {
  it('mixed types: a base heart takes its capacity and its health, a bonus heart goes whole', () => {
    const plan = heartTollPlan(20, 3, [blue(), stone()], [2], [1]);
    expect(plan).toEqual({ hp: 16, maxHearts: 2, layers: [1], lost: 4 });
  });

  it('a bonus heart alone leaves base health and capacity as they are', () => {
    expect(heartTollPlan(24, 3, [blue(), stone()], [], [0])).toEqual({ hp: 24, maxHearts: 3, layers: [0], lost: 0 });
  });

  it('duplicate types are separate hearts: two blue hearts can both be given, one index each', () => {
    const plan = heartTollPlan(16, 2, [blue(), blue(), stone()], [], [0, 1]);
    expect(plan?.layers).toEqual([0, 1]);
    expect(plan?.hp).toBe(16);
  });

  it('a repeated index is refused, not paid twice', () => {
    expect(heartTollPlan(16, 2, [blue()], [], [0, 0])).toBeNull();
    expect(heartTollPlan(16, 3, [], [1, 1], [])).toBeNull();
  });

  it('insufficient eligible hearts are refused: a heart that is not there, or the last base container', () => {
    expect(heartTollPlan(8, 3, [blue()], [], [1])).toBeNull();
    expect(heartTollPlan(8, 3, [], [1], [])).toBeNull();
    expect(heartTollPlan(16, 1, [], [0], [])).toBeNull();
    expect(heartTollPlan(16, 2, [], [0, 1], [])).toBeNull();
  });

  it('a payment that would leave no health is refused', () => {
    expect(heartTollPlan(4, 2, [], [0], [])).toBeNull();
    expect(heartTollPlan(4, 2, [blue()], [], [0])).toEqual({ hp: 4, maxHearts: 2, layers: [0], lost: 0 });
  });

  it('a partly filled base heart at the top leaves the full ones beneath it', () => {
    expect(heartTollPlan(20, 3, [], [2], [])).toEqual({ hp: 16, maxHearts: 2, layers: [], lost: 4 });
  });

  it('no choice spends nothing: the plan keeps every point and container', () => {
    expect(heartTollPlan(20, 3, [blue()], [], [])).toEqual({ hp: 20, maxHearts: 3, layers: [], lost: 0 });
  });
});

describe('the heart picks read back from their tiles', () => {
  it('splits base and bonus indexes, and ignores tiles that are not hearts', () => {
    expect(splitHeartPicks(['heart:2', 'key:0', 'layer:1', 'layer:0', 'hand:3'])).toEqual({ base: [2], bonus: [1, 0] });
    expect(splitHeartPicks(['heart:x', 'layer:-1'])).toEqual({ base: [], bonus: [] });
  });
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
}, 120_000);

/** A run at floor `k` with the hole open to pay: the player's hearts, keys and bombs, and a real stat sheet. */
function tollRig(k: number, p: { hp: number; layers: HeartLayer[]; keys?: number; bombs?: number; capacityLost?: number }): Rig {
  const stats = new StatSheet();
  if (p.capacityLost) stats.add({ stat: 'maxHearts', layer: 'add', value: -p.capacityLost, source: 'test' });
  const hole = { x: 0, z: 0, size: 2, yTop: 0 };
  const st = { open: false };
  const player = { id: 1, dead: false, hp: p.hp, layers: p.layers, hand: [] as unknown[], keys: p.keys ?? 2, bombs: p.bombs ?? 1, body: { x: 0, y: 0, z: 0 }, invulnT: 0 };
  return Object.assign(Object.create(Game.prototype), {
    player, stats, st,
    floors: new Map([[k, { hole }]]), bossRooms: new Map([[k, st]]),
    inventory: { items: [], lose: vi.fn() },
    hud: { setItems: vi.fn(), shake: vi.fn(), toast: vi.fn() },
    particles: { burst: vi.fn() },
    bus: createBus(),
    dw: {},
  });
}

describe('paying the toll on the game', () => {
  it('a bonus heart is given whole and base health is left alone', () => {
    const g = tollRig(1, { hp: 16, layers: [blue(), stone()] });
    expect(Game.prototype.payToll.call(g, 1, ['layer:1', 'key:0'])).toBe(true);
    expect(g.player.hp).toBe(16);
    expect(g.player.layers).toEqual([blue()]);
    expect(g.player.keys).toBe(1);
    expect(g.stats.get('maxHearts')).toBe(3);
  });

  it('a base heart takes its capacity and the health it holds, not a bonus heart', () => {
    const g = tollRig(1, { hp: 20, layers: [blue()] });
    expect(Game.prototype.payToll.call(g, 1, ['heart:2', 'bomb:0'])).toBe(true);
    expect(g.player.hp).toBe(16);
    expect(g.player.layers).toEqual([blue()]);
    expect(g.stats.get('maxHearts')).toBe(2);
    expect(g.player.bombs).toBe(0);
  });

  it('mixed types and duplicates are paid together: the chosen hearts go and no others', () => {
    const g = tollRig(2, { hp: 24, layers: [blue(), blue(), stone()] });
    expect(Game.prototype.payToll.call(g, 2, ['layer:0', 'layer:1', 'heart:1'])).toBe(true);
    expect(g.player.hp).toBe(16);
    expect(g.player.layers).toEqual([stone()]);
    expect(g.stats.get('maxHearts')).toBe(2);
  });

  it('insufficient eligible hearts spend nothing', () => {
    const g = tollRig(1, { hp: 16, layers: [blue()], capacityLost: 2 });
    expect(Game.prototype.payToll.call(g, 1, ['heart:0', 'layer:0'])).toBe(false);
    expect(g.player.hp).toBe(16);
    expect(g.player.layers).toEqual([blue()]);
    expect(g.player.keys).toBe(2);
    expect(g.stats.get('maxHearts')).toBe(1);
  });

  it('a payment that would leave no health is refused and spends nothing', () => {
    const g = tollRig(1, { hp: 4, layers: [] });
    expect(Game.prototype.payToll.call(g, 1, ['heart:0', 'key:0'])).toBe(false);
    expect(g.player.hp).toBe(4);
    expect(g.player.keys).toBe(2);
    expect(g.stats.get('maxHearts')).toBe(3);
  });

  it('the lost capacity comes back with a new run, which removes the toll source', () => {
    const g = tollRig(1, { hp: 20, layers: [] });
    expect(Game.prototype.payToll.call(g, 1, ['heart:2', 'key:0'])).toBe(true);
    expect(g.stats.get('maxHearts')).toBe(2);
    g.stats.removeSource('toll');
    expect(g.stats.get('maxHearts')).toBe(3);
  });

  it('a practice floor still asks for practices, not hearts', () => {
    const g = tollRig(5, { hp: 16, layers: [blue()] });
    expect(Game.prototype.payToll.call(g, 5, ['layer:0'])).toBe(false);
    expect(g.player.layers).toEqual([blue()]);
  });
});
