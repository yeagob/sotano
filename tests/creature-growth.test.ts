import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { GROWTH_MAX, GROWTH_STEP, grownScale, growsUnder, setScale } from '../src/entities/growth';
import { claimCreatureGrowthGift } from '../src/content/tables/heart-gifts';
import { CREATURE_BY_ID } from '../src/content/creatures';
import { FlowField, reachOf, type RoomArea } from '../src/enemies/flowfield';
import type { Actor } from '../src/entities/actors';
import { TouchRouter } from '../src/combat/touch-router';

// Game is loaded for the wiring tests below (its intention and push methods run on a stand-in).
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
}, 60000);

const host = (): EnemyHost => ({
  solid: () => false, worldVersion: () => 1, actors: () => [] as Actor[], actor: () => undefined,
  room: () => ({ id: 0, x0: 0, y0: 0, z0: 0, w: 13, d: 7, hx: 0, hz: 0 }), elemVersion: () => 0,
  pickupsIn: () => [],
  hazard: () => null, contact: () => {}, projectileHit: () => {}, projectileBlock: () => false,
  smash: () => false, burst: () => {}, died: () => {}, particles: () => {}, hurtActor: () => {},
  affectActor: () => {}, arena: () => {}, summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
} as EnemyHost);

/** A friendly creature (neutral, tagged as a creature) that stands still, so only its size moves. */
const friend = (en: Enemies) => {
  const def = CREATURE_BY_ID.get('huddler')!;
  const e = en.spawn(def, 7, 0, 3, 0, 3, def.hp, def.speed, 0, new Set(['creature']));
  e.faction = 'neutral';
  e.spawning = 0;
  e.hold = 1e6;
  return e;
};

describe('creatures grow under love shots', () => {
  it('each love shot adds one step, and growth stops at three times the birth size', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = friend(en);
    expect(e.scale).toBe(1);
    for (let n = 1; n <= 8; n++) {
      en.grow(e);
      expect(e.scale).toBeCloseTo(1 + GROWTH_STEP * n, 9);
    }
    expect(e.scale).toBe(GROWTH_MAX);
    for (let n = 0; n < 12; n++) en.grow(e);
    expect(e.scale).toBe(GROWTH_MAX);
    expect(e.body.hw).toBeCloseTo(CREATURE_BY_ID.get('huddler')!.size[0] * GROWTH_MAX, 9);
    expect(e.body.h).toBeCloseTo(CREATURE_BY_ID.get('huddler')!.size[1] * GROWTH_MAX, 9);
  });

  it('the scale is clamped to one to three, whatever is asked of it', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = friend(en);
    setScale(e, 0.2);
    expect(e.scale).toBe(1);
    setScale(e, 10);
    expect(e.scale).toBe(GROWTH_MAX);
    expect(grownScale(GROWTH_MAX)).toBe(GROWTH_MAX);
  });

  it('the hitbox and the visual size match at every step', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = friend(en);
    const def = CREATURE_BY_ID.get('huddler')!;
    for (let n = 0; n <= 8; n++) {
      if (n > 0) en.grow(e);
      en.update(1 / 60);
      const b = e.body, v = en.viewOf(e.id)!;
      expect(b.hw).toBeCloseTo(def.size[0] * e.scale, 9);
      expect(b.h).toBeCloseTo(def.size[1] * e.scale, 9);
      expect(v.group.scale.x).toBeCloseTo(e.scale, 9);
      expect(v.group.scale.y).toBeCloseTo(e.scale, 9);
      // a shot just inside the box's edge hits; just outside it misses
      const y = b.y + b.h / 2;
      expect(en.at(b.x + b.hw * 0.99, y, b.z, 0)).toBe(e.id);
      expect(en.at(b.x + b.hw * 1.01, y, b.z, 0)).toBe(-1);
    }
  });

  it('the navigation footprint is derived from the grown box: none at birth, one cell at three times', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = friend(en);
    expect(reachOf(e.body.hw)).toBe(0);
    for (let n = 0; n < 8; n++) en.grow(e);
    expect(reachOf(e.body.hw)).toBe(1);
  });
});

describe('navigation of a grown creature', () => {
  // A 9 × 5 room with a wall across x = 4 (tall, from the floor), and a gap of one or three cells in it.
  const room: RoomArea = { id: 0, x0: 0, y0: 0, z0: 0, w: 9, d: 5 };
  const narrow = (x: number, y: number, z: number) => y < 0 || (x === 4 && z !== 2 && y < 4);
  const wide = (x: number, y: number, z: number) => y < 0 || (x === 4 && (z === 0 || z === 4) && y < 4);

  it('a birth-size body routes through a one-cell gap', () => {
    const f = new FlowField(room, reachOf(0.2));
    f.update(narrow, 7.5, 2.5, 'v1');
    expect(f.direction(1.5, 2.5)).not.toBeNull();
  });

  it('a grown body (reach 1) cannot squeeze through a one-cell gap, so it has no way across', () => {
    const f = new FlowField(room, reachOf(0.6));
    f.update(narrow, 7.5, 2.5, 'v1');
    expect(f.direction(1.5, 2.5)).toBeNull();
    expect(f.direction(6.5, 2.5)).not.toBeNull();
  });

  it('a grown body routes through a three-cell gap', () => {
    const f = new FlowField(room, reachOf(0.6));
    f.update(wide, 7.5, 2.5, 'v1');
    expect(f.direction(1.5, 2.5)).not.toBeNull();
  });
});

describe('friendly actors grow, and negative shots shrink them back (#102)', () => {
  const def = CREATURE_BY_ID.get('huddler')!;

  it('a negative step takes a grown creature down one step, never below its birth size', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = friend(en);
    for (let n = 0; n < 4; n++) en.grow(e);
    en.shrink(e);
    expect(e.scale).toBeCloseTo(1 + GROWTH_STEP * 3, 9);
    expect(e.body.hw).toBeCloseTo(def.size[0] * e.scale, 9);
    expect(e.body.h).toBeCloseTo(def.size[1] * e.scale, 9);
    for (let n = 0; n < 10; n++) en.shrink(e);
    expect(e.scale).toBe(1);
    expect(e.body.hw).toBe(def.size[0]);
    expect(e.body.h).toBe(def.size[1]);
  });

  it('the hitbox and the visual size follow a shrink at every step', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = friend(en);
    for (let n = 0; n < 8; n++) en.grow(e);
    for (let n = 0; n <= 8; n++) {
      if (n > 0) en.shrink(e);
      en.update(1 / 60);
      const b = e.body, v = en.viewOf(e.id)!;
      expect(b.hw).toBeCloseTo(def.size[0] * e.scale, 9);
      expect(v.group.scale.x).toBeCloseTo(e.scale, 9);
      const y = b.y + b.h / 2;
      expect(en.at(b.x + b.hw * 0.99, y, b.z, 0)).toBe(e.id);
      expect(en.at(b.x + b.hw * 1.01, y, b.z, 0)).toBe(-1);
    }
  });

  it('only friendly creatures grow: not converted enemies, bosses, presences, the Boundary or projections', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const make = (id: number, faction: 'neutral' | 'self' | 'projection', tags: string[], kind = def) => {
      const e = en.spawn(kind, id, 0, 3, 0, 3, kind.hp, kind.speed, 0, new Set(tags));
      e.faction = faction;
      e.spawning = 0;
      return e;
    };
    expect(growsUnder(make(20, 'neutral', ['creature']))).toBe(true);
    expect(growsUnder(make(21, 'self', []))).toBe(false);
    expect(growsUnder(make(22, 'neutral', ['presence']))).toBe(false);
    expect(growsUnder(make(23, 'neutral', ['boundary']))).toBe(false);
    expect(growsUnder(make(24, 'projection', []))).toBe(false);
    expect(growsUnder(make(25, 'neutral', [], { ...def, kind: 'boss' } as typeof def))).toBe(false);
  });


  it('the maximum-growth gift is claimed once, even after a shrink and a second growth to three times', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const e = friend(en);
    for (let n = 0; n < 8; n++) en.grow(e);
    expect(claimCreatureGrowthGift(e.tags)).toBe(true);
    en.shrink(e);
    for (let n = 0; n < 8; n++) en.grow(e);
    expect(e.scale).toBe(GROWTH_MAX);
    expect(claimCreatureGrowthGift(e.tags)).toBe(false);
  });
});

/** Game's own intention and push methods on a stand-in: the real enemies and router; damage and gifts are recorded. */
function wiring(en: Enemies) {
  return Object.assign(Object.create(Game.prototype), {
    router: new TouchRouter(),
    enemies: en,
    particles: { burst() {} },
    player: { id: 0, body: { x: 0, y: 0, z: 0, hw: 0.3, h: 1.8 } },
    damageActor: vi.fn(() => true),
    dropCreatureGrowthGift: vi.fn(),
    solid: () => false,
  });
}

describe('the wiring of shots in Game (#102)', () => {
  const def = CREATURE_BY_ID.get('huddler')!;
  const creature = (en: Enemies, id: number, scale = 1, kind = def) => {
    const e = en.spawn(kind, id, 0, 3, 0, 3, kind.hp, kind.speed, 0, new Set(['creature']));
    e.faction = 'neutral';
    e.spawning = 0;
    e.hold = 1e6;
    setScale(e, scale);
    return e;
  };

  it('a warm negative shot shrinks a grown creature one step, and still harms it', () => {
    // bubbler answers both polarities (huddler answers only positive ones)
    const both = CREATURE_BY_ID.get('bubbler')!;
    expect(both.responds).toBeUndefined();
    const en = new Enemies(new THREE.Scene(), host());
    const g = wiring(en);
    const e = en.spawn(both, 40, 0, 3, 0, 3, both.hp, both.speed, 0, new Set(['creature']));
    e.faction = 'neutral';
    e.spawning = 0;
    e.hold = 1e6;
    setScale(e, 2);
    g.intentTouch(e.id, 4, 0, 0, 'cut', 'sword', 'negative', true);
    expect(e.scale).toBeCloseTo(2 - GROWTH_STEP, 9);
    expect(e.body.hw).toBeCloseTo(both.size[0] * e.scale, 9);
    expect(g.damageActor).toHaveBeenCalledTimes(1);
  });

  it('a beam tick (not warm) does not shrink a grown creature', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const g = wiring(en);
    const e = creature(en, 41, 2, CREATURE_BY_ID.get('bubbler')!);
    g.intentTouch(e.id, 4, 0, 0, 'beam', 'beam', 'negative', false);
    expect(e.scale).toBe(2);
    expect(g.damageActor).toHaveBeenCalledTimes(1);
  });

  it('a creature that answers only positive intentions does not shrink under a negative one', () => {
    expect(def.responds).toBe('positive');
    const en = new Enemies(new THREE.Scene(), host());
    const g = wiring(en);
    const e = creature(en, 42, 2);
    g.intentTouch(e.id, 4, 0, 0, 'cut', 'sword', 'negative', true);
    expect(e.scale).toBe(2);
  });

  it('a creature grows under warm love shots and rolls its maximum-growth gift once, off floor 0; a converted ally neither grows nor rolls', () => {
    const en = new Enemies(new THREE.Scene(), host());
    // the stand-in has no rooms, so a floor check would throw: the gift needs no floor
    const g = wiring(en);
    const cr = creature(en, 50);
    for (let n = 0; n < 8; n++) g.intentTouch(cr.id, 8, 0, 0, 'cut', 'love', 'positive', true);
    expect(cr.scale).toBe(GROWTH_MAX);
    expect(g.dropCreatureGrowthGift).toHaveBeenCalledTimes(1);
    expect(g.dropCreatureGrowthGift).toHaveBeenCalledWith(cr);
    for (let n = 0; n < 4; n++) g.intentTouch(cr.id, 8, 0, 0, 'cut', 'love', 'positive', true);
    expect(g.dropCreatureGrowthGift).toHaveBeenCalledTimes(1);

    const ally = en.spawn(def, 51, 0, 3, 0, 3, def.hp, def.speed, 0, new Set());
    ally.faction = 'self';
    ally.spawning = 0;
    for (let n = 0; n < 8; n++) g.intentTouch(ally.id, 8, 0, 0, 'cut', 'love', 'positive', true);
    expect(ally.scale).toBe(1);
    expect(g.dropCreatureGrowthGift).toHaveBeenCalledTimes(1);
  });

  it('the presence push uses the grown box, so a grown presence pushes the player from further out', () => {
    const en = new Enemies(new THREE.Scene(), host());
    const g = wiring(en);
    const pres = en.spawn(def, 60, 0, 10, 0, 10, def.hp, def.speed, 0, new Set(['presence']));
    pres.faction = 'neutral';
    pres.spawning = 0;
    setScale(pres, 3);
    const grown = pres.body.hw / 2 + 0.3;
    // outside the birth push radius, inside the grown one
    expect(def.size[0] / 2 + 0.3).toBeLessThan(grown - 0.05);
    const b = g.player.body;
    b.x = 10 + grown - 0.05;
    b.z = 10;
    g.pushPresences();
    expect(Math.hypot(b.x - 10, b.z - 10)).toBeCloseTo(grown, 6);
  });
});
