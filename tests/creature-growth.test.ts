import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { GROWTH_MAX, GROWTH_STEP, grownScale, setScale } from '../src/entities/growth';
import { CREATURE_BY_ID } from '../src/content/creatures';
import { FlowField, reachOf, type RoomArea } from '../src/enemies/flowfield';
import type { Actor } from '../src/entities/actors';

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
