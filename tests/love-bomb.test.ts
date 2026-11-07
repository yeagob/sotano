// White bombs (DECISIONS §7.8): a bomb placed while the polarity is positive is white, and its fuse ends in a
// love explosion (mends, breaks nothing, pushes nothing, hurts nothing). A negative bomb is unchanged. The real
// Game methods (placeBomb, newDebris, blast, loveBlast) run on a stand-in (Object.create(Game.prototype)) that
// holds only what they read; the loose cubes are the real DebrisSystem and the blasts the real BlastQueue. The
// world is a small in-memory stand-in: the ground (every cell below y 0) never breaks.

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { BlastQueue } from '../src/combat/blasts';
import type { Polarity } from '../src/combat/polarity';
import { TouchRouter } from '../src/combat/touch-router';
import { seedFx } from '../src/core/fx';
import { AIR, MAT, mat } from '../src/content/materials';
import { createBus } from '../src/game/events';
import type { DebrisSystem } from '../src/physics/debris';
import { EL_LAVA, EL_WATER, elemByte, elemKind, elemLevel } from '../src/content/elements';

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
});

const BRICK = MAT.brick, STONE = MAT.stone, BOMB = MAT.bomb;

/** A world of blocks the test places; the ground below y 0 is stone that never breaks. */
function world() {
  const cells = new Map<string, number>();
  const damaged = new Map<number, number>();
  const idx = (x: number, y: number, z: number) => x + 128 * (y + 16 + 64 * (z + 64));
  const w = {
    damaged,
    idx,
    /** every cell is stored (no terrain outside, which Game.damageBlock refuses to break) */
    inside: () => true,
    get: (x: number, y: number, z: number) => (y < 0 ? STONE : cells.get(`${x},${y},${z}`) ?? AIR),
    set: (x: number, y: number, z: number, m: number) => { cells.set(`${x},${y},${z}`, m); },
    solid: (x: number, y: number, z: number) => w.get(x, y, z) !== AIR,
    hp: (x: number, y: number, z: number) => damaged.get(idx(x, y, z)) ?? mat(w.get(x, y, z)).hp,
    /** a block that was hit and stands with `hp` left */
    hurt: (x: number, y: number, z: number, hp: number) => { damaged.set(idx(x, y, z), hp); },
    /** the element cells (water, lava, fire) by position: a byte, as the element grid stores it */
    elem: new Map<string, number>(),
    elemAt: (x: number, y: number, z: number) => w.elem.get(`${x},${y},${z}`) ?? 0,
    setElem: (x: number, y: number, z: number, kind: number, level: number) => { w.elem.set(`${x},${y},${z}`, elemByte(kind, level)); },
  };
  return w;
}

/**
 * A player at (5.5, 1, 5.5) facing -Z, with the game's methods on a stand-in. The sky is the default realm:
 * in the dungeon a broken block also rolls loot and a blast reaches the doors, which these tests do not model
 * (the love path itself is the same in both realms, and the fuse test runs in both).
 */
function rig(polarity: Polarity, realm: 'dungeon' | 'sky' = 'sky') {
  const w = world();
  const player = { id: 0, hp: 8, bombs: 3, body: { x: 5.5, y: 1, z: 5.5, vx: 0, vz: 0 }, forward: new THREE.Vector3(0, 0, -1) };
  const g: Rig = Object.assign(Object.create(Game.prototype), {
    world: w,
    bus: createBus(),
    polarity,
    router: new TouchRouter(),
    player,
    hud: { shake() {}, toast() {}, presenceCard() {} },
    stats: { get: (k: string) => (k === 'bombRadius' ? 2.6 : k === 'bombDamage' ? 40 : 0) },
    particles: { burst() {} },
    elements: { wakeAround() {} },
    elemFx: 0,
    elemSfx: 0,
    actors: { all: () => [] },
    enemies: { list: [] },
    doors: { solidAt: () => false, list: [] },
    bombCause: new Map(),
    blasts: new BlastQueue(),
    breakFx: 0,
    breakSfx: 0,
    realm,
  });
  g.debris = g.newDebris();
  return { g, w, player };
}

/** The slots of the live bombs. */
const bombs = (d: DebrisSystem) => [...Array(d.max).keys()].filter(i => d.isBomb(i));
/** Two seconds of loose-cube time: enough for any fuse the tests set. */
const runFor = (g: Rig, seconds: number) => { for (let t = 0; t < seconds; t += 1 / 60) g.debris.update(1 / 60); };

describe('white bombs: the love explosion of a placed bomb (DECISIONS §7.8)', () => {
  beforeEach(() => seedFx(7));

  it('a bomb placed at positive polarity is white, and one placed at negative polarity is black', () => {
    const pos = rig('positive');
    pos.g.placeBomb();
    expect(pos.g.debris.love[bombs(pos.g.debris)[0]]).toBe(1);

    const neg = rig('negative');
    neg.g.placeBomb();
    expect(neg.g.debris.love[bombs(neg.g.debris)[0]]).toBe(0);
  });

  it('a placed bomb keeps its colour when the polarity changes after the placement', () => {
    const { g } = rig('positive');
    g.placeBomb();
    const [white] = bombs(g.debris);
    g.polarity = 'negative';
    expect(g.debris.love[white]).toBe(1);
    expect(g.debris.fuse[white]).toBeGreaterThan(0);
  });

  it('a love explosion turns the lava in its sphere into water at the same level, and leaves lava outside it', () => {
    const { g, w } = rig('positive');
    w.setElem(10, 1, 10, EL_LAVA, 6); // the centre of the blast
    w.setElem(10, 1, 12, EL_LAVA, 3); // 2.0 from the centre, inside the radius 2.6
    w.setElem(10, 1, 14, EL_LAVA, 3); // 4.0 from the centre, outside it
    g.loveBlast(10.5, 1.5, 10.5);
    const at = (x: number, y: number, z: number) => w.elemAt(x, y, z);
    expect(elemKind(at(10, 1, 10))).toBe(EL_WATER);
    expect(elemLevel(at(10, 1, 10))).toBe(6);
    expect(elemKind(at(10, 1, 12))).toBe(EL_WATER);
    expect(elemKind(at(10, 1, 14))).toBe(EL_LAVA);
  });

  it('a slot reused by a bomb placed at negative polarity starts black', () => {
    const { g } = rig('positive');
    g.placeBomb();
    const [white] = bombs(g.debris);
    g.debris.remove(white); // the white bomb's fuse ended, and its slot is free
    g.polarity = 'negative';
    g.placeBomb();
    const [black] = bombs(g.debris);
    expect(g.debris.love[black]).toBe(0);
  });

  for (const realm of ['sky', 'dungeon'] as const) {
    it(`a white fuse ends in the love path in the ${realm}: blocks mend, none breaks, no cube is pushed, the player is unhurt`, () => {
      const { g, w, player } = rig('positive', realm);
      w.set(5, 0, 3, BRICK); w.hurt(5, 0, 3, 4);
      w.set(3, 0, 5, STONE); w.hurt(3, 0, 5, 2);
      g.debris.spawn(BRICK, 7.5, 0.36, 4.9); // a loose cube inside the sphere
      g.placeBomb();
      const [bomb] = bombs(g.debris);
      const love = vi.spyOn(g, 'loveBlast');
      const explode = vi.spyOn(g, 'explode');
      const push = vi.spyOn(g.debris, 'push');

      runFor(g, 2);

      expect(love).toHaveBeenCalledTimes(1);
      expect(explode).not.toHaveBeenCalled();
      expect(g.debris.isBomb(bomb)).toBe(false);
      // mended to full: the damage entries are gone, and both blocks still stand
      expect(w.damaged.has(w.idx(5, 0, 3))).toBe(false);
      expect(w.damaged.has(w.idx(3, 0, 5))).toBe(false);
      expect(w.get(5, 0, 3)).toBe(BRICK);
      expect(w.get(3, 0, 5)).toBe(STONE);
      expect(push).not.toHaveBeenCalled();
      expect(player.hp).toBe(8);
      expect(g.blasts.pending).toBe(0);
    });
  }

  it('a negative blast sets off a white bomb as a love explosion', () => {
    const { g } = rig('positive');
    g.placeBomb();
    const [white] = bombs(g.debris);
    const love = vi.spyOn(g, 'loveBlast');
    const explode = vi.spyOn(g, 'explode');

    g.blast({ x: 5.5, y: 0.5, z: 5.5, radius: 2.6, damage: 40, actorDamage: 30, source: 'test', owner: 0 });
    expect(g.debris.fuse[white]).toBeCloseTo(0.12);
    runFor(g, 0.3);

    expect(love).toHaveBeenCalledTimes(1);
    expect(explode).not.toHaveBeenCalled();
  });

  it('a negative blast still sets off a black bomb as a bomb', () => {
    const { g } = rig('negative');
    g.placeBomb();
    expect(g.debris.love[bombs(g.debris)[0]]).toBe(0);
    const explode = vi.spyOn(g, 'explode');
    const love = vi.spyOn(g, 'loveBlast');

    g.blast({ x: 5.5, y: 0.5, z: 5.5, radius: 2.6, damage: 40, actorDamage: 30, source: 'test', owner: 0 });
    runFor(g, 0.3);

    expect(love).not.toHaveBeenCalled();
    expect(explode).toHaveBeenCalledTimes(1);
    expect(explode.mock.calls[0][5]).toBe('bomb');
  });

  it('a love explosion leaves the fuses of other bombs unchanged', () => {
    const { g } = rig('positive');
    g.placeBomb();
    const [white] = bombs(g.debris);
    const black = g.debris.spawn(BOMB, 5.5, 0.5, 3.6);
    g.debris.fuse[black] = 0.9;
    g.debris.fuse[white] = 1.2;

    g.loveBlast(5.5, 0.5, 4.9);

    // the fuses are Float32 cells: compare to a float's precision
    expect(g.debris.fuse[black]).toBeCloseTo(0.9, 6);
    expect(g.debris.fuse[white]).toBeCloseTo(1.2, 6);
  });
});
