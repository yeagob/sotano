// Issue #301: rooms stayed sealed with no projection left to fight. Three causes, each reproduced
import { Rng } from '../src/core/rng';
// here, and the watchdog that recounts a sealed room from the real state.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Enemies, type EnemyHost } from '../src/entities/enemies';
import { ENEMY_BY_ID } from '../src/content/enemies';
import type { Actor } from '../src/entities/actors';
import { boxHits, freeBody, type Body } from '../src/physics/voxel-collide';
import { cellTaken } from '../src/game/placement';
import { LOST_BELOW, RecountClock, ROOM_WATCHDOG_INTERVAL, strandedIn } from '../src/game/room-watchdog';

const ROOM = { id: 0, x0: 0, y0: 0, z0: 0, w: 13, d: 7, hx: 0, hz: 0 };
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** A room with a floor at y = -1, an optional set of extra blocks, and the player standing at (px, 0, pz). */
function rig(blocks = new Set<string>(), px = 6.5, pz = 3.5) {
  const player = {
    id: 1, kind: 'player', def: 'player', faction: 'self', hp: 24, tags: new Set<string>(), room: 0, alive: true, spawning: 0,
    body: { x: px, y: 0, z: pz, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true },
  } as Actor;
  const solid = (x: number, y: number, z: number) => y < 0 || blocks.has(key(x, y, z));
  const host = {
    solid, worldVersion: () => blocks.size, actors: () => [player], actor: (id: number) => (id === 1 ? player : undefined),
    room: () => ROOM, elemVersion: () => 0, pickupsIn: () => [],
    hazard: () => null, contact: () => {}, practices: () => [], health: () => 48, bombs: () => 0, placeBomb: () => {}, rng: () => new Rng(1), projectileHit: () => {}, projectileBlock: () => false,
    smash: () => false, burst: () => {}, died: () => {}, particles: () => {}, hurtActor: () => {},
    affectActor: () => {}, arena: () => {}, summon: () => {}, cue: () => {}, quake: () => {}, drop: () => {},
  } as EnemyHost;
  const en = new Enemies(new THREE.Scene(), host);
  const add = (def: string, x: number, y: number, z: number, id = 10) => {
    const d = ENEMY_BY_ID.get(def)!;
    const e = en.spawn(d, id, 0, x, y, z, d.hp, d.speed, d.contactDamage, new Set());
    e.spawning = 0;
    return e;
  };
  const run = (seconds: number) => { for (let t = 0; t < seconds; t += 1 / 60) en.update(1 / 60); };
  return { en, add, run, solid, blocks, player };
}

describe('sealed rooms (#301): a projection that hides on its own comes out again', () => {
  it('a shut Avoidance peeks again when the player comes close, so it can be hit and its room can clear', () => {
    const { en, add, run } = rig(new Set(), 6.5, 3.5);
    const e = add('avoidance', 3.5, 0, 3.5);
    // it peeks, then shuts and hides
    run(0.1);
    e.state = 'peek'; e.timer = 0;
    run(0.05);
    expect(e.hidden).toBe(true);
    expect(en.at(3.5, 0.2, 3.5, 0.3)).toBe(-1);
    // before the fix a hidden projection never ran its behaviour again: shut for good, counted, unhittable
    run(4);
    expect(e.state).toBe('peek');
    expect(e.hidden).toBe(false);
    expect(en.at(3.5, 0.2, 3.5, 0.3)).toBe(e.id);
  });
});

describe('sealed rooms (#301): a body caught inside blocks is freed', () => {
  it('freeBody lifts a body out of a block set on its feet, onto the block', () => {
    const blocks = new Set([key(3, 0, 3)]);
    const solid = (x: number, y: number, z: number) => y < 0 || blocks.has(key(x, y, z));
    const b: Body = { x: 3.5, y: 0, z: 3.5, vx: 1, vy: 0, vz: 0, hw: 0.3, h: 0.8, onGround: true };
    expect(freeBody(solid, b)).toBe(true);
    expect(boxHits(solid, b.x, b.y, b.z, b.hw, b.h)).toBe(false);
    expect([b.x, b.y, b.z]).toEqual([3.5, 1, 3.5]);
    expect(b.vx).toBe(0);
  });

  it('freeBody never takes a body to a spot outside what is allowed (its room), and says so when there is none', () => {
    const solid = (_x: number, y: number) => y < 4; // buried four deep, open only above reach
    const b: Body = { x: 3.5, y: 0, z: 3.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 0.8, onGround: true };
    expect(freeBody(solid, b)).toBe(false);
    expect([b.x, b.y, b.z]).toEqual([3.5, 0, 3.5]);
    const wall = (x: number, y: number) => y < 0 || x <= 3;
    const c: Body = { x: 3.5, y: 0, z: 3.5, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 0.8, onGround: true };
    expect(freeBody(wall, c, x => x < 4)).toBe(false);
    expect(freeBody(wall, c)).toBe(true);
    expect(c.x).toBe(4.5);
  });

  it('a projection a stone lands on walks free on the next step, inside its room', () => {
    const { add, run, solid, blocks } = rig();
    const e = add('doubt', 3.5, 0, 3.5);
    run(0.2);
    const cx = Math.floor(e.body.x), cz = Math.floor(e.body.z);
    for (let y = 0; y <= 1; y++) blocks.add(key(cx, y, cz));
    expect(boxHits(solid, e.body.x, e.body.y, e.body.z, e.body.hw, e.body.h)).toBe(true);
    run(1 / 60);
    expect(boxHits(solid, e.body.x, e.body.y, e.body.z, e.body.hw, e.body.h)).toBe(false);
    expect(e.body.x).toBeGreaterThan(ROOM.x0);
    expect(e.body.x).toBeLessThan(ROOM.x0 + ROOM.w);
  });
});

describe('sealed rooms (#301): a block is never set on a projection', () => {
  it('the cell a living body stands in is taken; a dead one leaves it free', () => {
    const body = { x: 3.5, y: 0, z: 3.5, hw: 0.3, h: 0.9 };
    expect(cellTaken([{ alive: true, body }], 3, 0, 3)).toBe(true);
    expect(cellTaken([{ alive: true, body }], 4, 0, 3)).toBe(false);
    expect(cellTaken([{ alive: false, body }], 3, 0, 3)).toBe(false);
  });
});

describe('sealed rooms (#301): the watchdog', () => {
  it('recounts every ROOM_WATCHDOG_INTERVAL seconds of play', () => {
    expect(ROOM_WATCHDOG_INTERVAL).toBe(2);
    const clock = new RecountClock();
    let beats = 0;
    for (let i = 0; i < 60 * 5; i++) if (clock.tick(1 / 60)) beats++;
    expect(beats).toBe(2);
  });

  it('a room whose only projection is buried where it cannot be freed recovers within one interval', () => {
    const { en, add } = rig();
    const e = add('doubt', 3.5, 0, 3.5);
    const buried = (_x: number, y: number) => y < 6;
    const clock = new RecountClock();
    let released: ReturnType<typeof strandedIn> = [];
    for (let t = 0; t <= ROOM_WATCHDOG_INTERVAL + 1e-6 && !released.length; t += 1 / 60) {
      if (clock.tick(1 / 60)) released = strandedIn(en.blockers(0), ROOM.y0, buried);
    }
    expect(released.map(s => [s.e.id, s.why])).toEqual([[e.id, 'buried']]);
  });

  it('a projection fallen out of its room is stranded too', () => {
    const { en, add } = rig();
    add('doubt', 3.5, -LOST_BELOW - 1, 3.5);
    expect(strandedIn(en.blockers(0), ROOM.y0, () => false).map(s => s.why)).toEqual(['fallen']);
  });

  it('releases nothing while any projection of the room can still be reached', () => {
    const { en, add } = rig();
    add('doubt', 3.5, 0, 3.5, 10);
    add('doubt', 8.5, 0, 3.5, 11);
    const buriedLeft = (x: number, y: number) => y < 0 || (x < 6 && y < 6);
    expect(strandedIn(en.blockers(0), ROOM.y0, buriedLeft)).toEqual([]);
  });

  it('never counts a ghost inside a wall, a projection still forming, an ally or the dead', () => {
    const { en, add } = rig();
    const ghost = add('rumination', 3.5, 0, 3.5, 10);
    ghost.ghost = true;
    const forming = add('doubt', 4.5, 0, 3.5, 11);
    forming.spawning = 0.5;
    const ally = add('doubt', 5.5, 0, 3.5, 12);
    ally.faction = 'self';
    const dead = add('doubt', 6.5, 0, 3.5, 13);
    dead.alive = false;
    const all = () => true;
    expect(en.blockers(0).map(e => e.id)).toEqual([10, 11]);
    expect(strandedIn(en.blockers(0), ROOM.y0, all)).toEqual([]);
  });
});
