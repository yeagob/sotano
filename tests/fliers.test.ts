import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { CREATURE_BY_ID } from '../src/content/creatures';
import distraction from '../src/content/enemies/distraction';
import noise from '../src/content/enemies/noise';
import type { Actor } from '../src/entities/actors';
import { boxHits } from '../src/physics/voxel-collide';
import type { Enemy } from '../src/enemies/types';

const W = 13, D = 7, CEIL = 8;
/** A closed room 13 x 7 with a floor at y = 0 (solid below), a ceiling at CEIL and walls all round. */
const closed = (x: number, y: number, z: number) => y < 0 || y >= CEIL || x < 0 || x >= W || z < 0 || z >= D;

function world(solid: (x: number, y: number, z: number) => boolean = closed) {
  const actors: Actor[] = [];
  const touched: string[] = [];
  const host = {
    solid, worldVersion: () => 1, actors: () => actors, actor: (id: number) => actors.find(a => a.id === id),
    room: () => ({ id: 0, x0: 0, y0: 0, z0: 0, w: W, d: D, hx: 0, hz: 0 }), elemVersion: () => 0,
    pickupsIn: () => [], hazard: () => null, contact: (e: Enemy) => { touched.push(e.def); }, projectileHit: () => {}, projectileBlock: () => false,
    smash: () => false, burst: () => {}, died: () => {}, particles: () => {}, hurtActor: () => {},
    affectActor: () => {}, arena: () => {}, summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
  } as EnemyHost;
  const en = new Enemies(new THREE.Scene(), host);
  const player = {
    id: 1, kind: 'player', def: 'player', faction: 'self', hp: 24, tags: new Set<string>(), room: 0, alive: true, spawning: 0,
    body: { x: 6.5, y: 0, z: 3.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true },
  } as Actor;
  actors.push(player);
  const add = (e: Enemy) => { e.spawning = 0; actors.push(e); return e; };
  return { en, player, add, contacts: () => touched.length, touchedBy: (def: string) => touched.filter(d => d === def).length, actors };
}

describe('Distraction and Noise, the dark winged projections', () => {
  for (const def of [distraction, noise]) {
    it(`${def.id} comes to the player and its touch lands`, () => {
      const w = world();
      w.add(w.en.spawn(def, 2, 0, 2.5, 0, 2.5, def.hp, def.speed, def.contactDamage, new Set()));
      for (let i = 0; i < 60 * 20; i++) w.en.update(1 / 60);
      expect(w.contacts()).toBeGreaterThan(0);
    });
  }
});

/** The same room with the east half raised two blocks: a terrace the flyers must climb over. */
const terrace = (x: number, y: number, z: number) => closed(x, y, z) || (x >= 8 && y < 2);

describe('Wonder, the white winged creature, hovers and keeps off the walls', () => {
  const fly = (solid: (x: number, y: number, z: number) => boolean, seconds: number) => {
    const w = world(solid);
    const e = w.add(w.en.spawn(CREATURE_BY_ID.get('wonder')!, 2, 0, 3, 0, 3, 3, 1.4, 0, new Set(['creature'])));
    e.faction = 'neutral';
    let n = 0, high = 0, pressed = 0, inside = 0;
    for (let i = 0; i < 60 * seconds; i++) {
      w.en.update(1 / 60);
      const b = e.body;
      n++;
      const floor = solid(Math.floor(b.x), 1, Math.floor(b.z)) ? 2 : 0;
      if (b.y - floor >= 0.6) high++;
      if (b.x < 0.45 || b.x > W - 0.45 || b.z < 0.45 || b.z > D - 0.45) pressed++;
      if (boxHits(solid, b.x, b.y, b.z, b.hw, b.h)) inside++;
    }
    return { high: high / n, pressed: pressed / n, inside };
  };

  it('flies over the floor, not along it', () => {
    expect(fly(closed, 60).high).toBeGreaterThan(0.9);
  });

  it('flies over a terrace as it does over the floor', () => {
    expect(fly(terrace, 60).high).toBeGreaterThan(0.9);
  });

  it('turns off the walls instead of pressing on them', () => {
    expect(fly(closed, 60).pressed).toBeLessThan(0.1);
    expect(fly(terrace, 60).pressed).toBeLessThan(0.1);
  });

  it('never ends inside a block', () => {
    expect(fly(terrace, 60).inside).toBe(0);
  });
});

describe('an allied Distraction', () => {
  it('flies at eye height over the terrain and strikes the projection it is hostile to', () => {
    const w = world(terrace);
    const ally = w.add(w.en.spawn(distraction, 2, 0, 2.5, 0, 2.5, distraction.hp, distraction.speed, distraction.contactDamage, new Set()));
    ally.faction = 'self';
    w.add(w.en.spawn(noise, 3, 0, 10.5, 2, 3.5, 99, 0, 0, new Set()));
    let low = 0, n = 0;
    for (let i = 0; i < 60 * 20; i++) {
      w.en.update(1 / 60);
      n++;
      const floor = terrace(Math.floor(ally.body.x), 1, Math.floor(ally.body.z)) ? 2 : 0;
      if (ally.body.y - floor < 0.6) low++;
    }
    expect(low / n).toBeLessThan(0.1);
    expect(w.touchedBy('distraction')).toBeGreaterThan(0);
  });
});
