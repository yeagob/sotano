// The floors spawn their herds in play (docs/architecture/SKY.md §5.4, docs/design/built/sky/minions/README.md).
// Headless: a real layout, world and realm, the real minion defs and deities, a host with real hazards, and the
// player placed on one floor. Checks: a floor fills within its warning, keeps max and wildMax, spawns only while the
// player is on it (never on the deck), its minions are touchable only when unparked and spawned, the realm drives
// the spawner once a frame, and warm positive hits turn a wild minion into an ally.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { Rng } from '../src/core/rng';
import type { Body } from '../src/physics/voxel-collide';
import { MINIONS } from '../src/sky/creatures/minions';
import { MIN_WARNING } from '../src/sky/creatures/minion';
import type { SkyCreatures } from '../src/sky/creatures/system';
import { SkyRealm } from '../src/sky/sky-realm';
import { SkyWorld } from '../src/sky/world/sky-world';
import type { SkyActor, SkyHost, SkyRealmSet } from '../src/sky/types';

const DT = 1 / 30;

function newRealm() {
  let now = 0;
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const noop = () => {};
  const body: Body = { x: 6, y: 10, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const player = {
    body, eye: { x: 6, y: 11.6, z: 0 }, aim: { x: 1, y: 0, z: 0 }, hand: [], held: false,
    push: noop, slow: noop, hold: noop, carry: noop,
  };
  const pActor = { id: 1, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hazardHost: HazardHost = {
    actors: () => [pActor], hurt: noop as unknown as HazardHost['hurt'], affect: noop as unknown as HazardHost['affect'],
    push: noop as unknown as HazardHost['push'], live: noop, particles: noop,
  };
  const hazards = new Hazards(new THREE.Group(), hazardHost);
  let world: SkyWorld | null = null;
  const debris = { spawn: () => 0, max: 0, isAlive: () => false, pos: new Float32Array(0) };
  const host = {
    time: () => now,
    player: () => player,
    actors: () => actors,
    world: () => world!,
    debris: () => debris,
    hazards: () => hazards,
    fork: (...path: (string | number)[]) => new Rng(path.reduce<number>((h, p) => h * 31 + String(p).length + (typeof p === 'number' ? p : 0), 7)),
    fx: noop, cue: noop, toast: noop, card: noop, bar: noop, place: noop, gift: noop, travel: noop,
    drainSpirit: noop, spirit: () => 100, refillSpirit: noop, takeRandomPractice: () => null, sendUnderground: () => true,
  } as unknown as SkyHost;
  const realm = SkyRealm.create(host, new THREE.Group(), layout => ({ kind: 'sky', world: (world = new SkyWorld(layout)) } as unknown as SkyRealmSet));
  const creatures = realm.creatures as SkyCreatures;
  const step = (dt = DT) => { realm.update(dt); hazards.update(dt); now += dt; };
  const run = (seconds: number) => { for (let t = 0; t < seconds - 1e-9; t += DT) step(); };
  /** Stands the player on floor n (0 the deck), a few blocks off its first spawn place. */
  const standOn = (n: number) => {
    if (n === 0) { body.x = 6; body.y = 10; body.z = 0; return; }
    const s = realm.plans.floors[n - 1].spawns[0];
    body.x = s.x + 6.5; body.y = s.y; body.z = s.z + 0.5;
    player.eye = { x: body.x, y: body.y + 1.6, z: body.z };
  };
  return { realm, creatures, body, step, run, standOn };
}

const minionsOn = (c: SkyCreatures, n: number) => c.minionsOn(n);
const targetIds = (c: SkyCreatures) => new Set(c.targets().map(t => t.id));

describe('the floors spawn their herds in play', () => {
  it('each floor with the player on it shows its first minion within its warning, and fills to wildMax one warning apart', () => {
    for (let n = 1; n <= 5; n++) {
      const r = newRealm();
      r.standOn(n);
      expect(r.realm.floorAt(r.body.y), `floor ${n} height`).toBe(n);
      const def = MINIONS[r.realm.plans.floors[n - 1].animal];
      const warning = Math.max(MIN_WARNING, def.spawn.warning);
      r.step();
      const first = minionsOn(r.creatures, n);
      expect(first.length, `floor ${n} first`).toBe(1);
      expect(first[0].state).toBe('Spawning');
      r.run(warning);
      expect(first[0].spawning, `floor ${n} spawned`).toBe(0);
      expect(targetIds(r.creatures).has(first[0].id)).toBe(true);
      r.run(warning * (def.wildMax + 1));
      expect(minionsOn(r.creatures, n).length, `floor ${n} filled`).toBe(Math.min(def.max, def.wildMax));
    }
  });

  it('never holds more than max minions nor more than wildMax wild ones, turned allies included', () => {
    for (let n = 1; n <= 5; n++) {
      const r = newRealm();
      r.standOn(n);
      const def = MINIONS[r.realm.plans.floors[n - 1].animal];
      for (let round = 0; round < 4; round++) {
        r.run(def.spawn.every + Math.max(MIN_WARNING, def.spawn.warning) * (def.wildMax + 1));
        const all = minionsOn(r.creatures, n);
        expect(all.length, `floor ${n} max`).toBeLessThanOrEqual(def.max);
        expect(all.filter(a => a.side === 'wild').length, `floor ${n} wildMax`).toBeLessThanOrEqual(def.wildMax);
        // turn one spawned wild minion, so the timer brings another while the floor is below max
        const wild = all.find(a => a.side === 'wild' && a.spawning <= 0);
        if (wild) for (let i = 0; i < def.hitsToTurn; i++) r.creatures.touch(wild.id, 'positive', true, wild.body, 'intent');
      }
      r.run(def.spawn.every * 3);
      expect(minionsOn(r.creatures, n).length, `floor ${n} reaches max`).toBe(def.max);
    }
  });

  it('spawns nothing on the deck, and nothing on a floor the player is not on', () => {
    const r = newRealm();
    r.standOn(0);
    r.run(40);
    expect(r.creatures.all().filter(a => a.role === 'minion')).toHaveLength(0);
    r.standOn(1);
    r.run(30);
    expect(minionsOn(r.creatures, 1).length).toBeGreaterThan(0);
    for (let n = 2; n <= 5; n++) expect(minionsOn(r.creatures, n), `floor ${n}`).toHaveLength(0);
  });

  it('the realm drives the spawner once a frame: one update spawns one minion, never two', () => {
    const r = newRealm();
    r.standOn(3);
    let calls = 0;
    const spawn = r.creatures.spawnMinion.bind(r.creatures);
    r.creatures.spawnMinion = (...a) => { calls++; return spawn(...a); };
    r.step(0.01);
    expect(calls).toBe(1);
    const warning = Math.max(MIN_WARNING, MINIONS.elephant.spawn.warning);
    for (let t = 0.01; t < warning - 0.05; t += 0.01) r.step(0.01);
    expect(calls).toBe(1);
  });

  it('a floor\'s minions are touchable only while unparked, and the herd is not doubled on the way back', () => {
    const r = newRealm();
    r.standOn(1);
    r.run(10);
    const herd = minionsOn(r.creatures, 1).filter(a => a.spawning <= 0);
    expect(herd.length).toBeGreaterThan(0);
    const m = herd[0];
    expect(m.parked).toBe(false);
    expect(targetIds(r.creatures).has(m.id)).toBe(true);
    expect(r.creatures.at(m.body.x, m.body.y + m.body.h / 2, m.body.z, 0)).toBe(m.id);
    const count = minionsOn(r.creatures, 1).length;
    r.standOn(2);
    r.step();
    expect(m.parked).toBe(true);
    expect(targetIds(r.creatures).has(m.id)).toBe(false);
    r.standOn(1);
    r.step();
    expect(m.parked).toBe(false);
    expect(targetIds(r.creatures).has(m.id)).toBe(true);
    expect(minionsOn(r.creatures, 1).length).toBe(count);
  });

  it('warm positive hits turn a wild minion into an ally (a puff for a negative one, nothing for a cold one)', () => {
    const r = newRealm();
    r.standOn(4);
    r.run(5);
    const m = minionsOn(r.creatures, 4).find(a => a.spawning <= 0) as SkyActor;
    const def = MINIONS.lion;
    const p = { x: m.body.x, y: m.body.y + 0.5, z: m.body.z };
    r.creatures.touch(m.id, 'negative', true, p, 'intent');
    r.creatures.touch(m.id, 'positive', false, p, 'intent');
    expect(m.hits).toBe(0);
    for (let i = 0; i < def.hitsToTurn - 1; i++) r.creatures.touch(m.id, 'positive', true, p, 'intent');
    expect([m.side, m.state, m.hits]).toEqual(['wild', 'Reacting', def.hitsToTurn - 1]);
    r.creatures.touch(m.id, 'positive', true, p, 'intent');
    expect([m.side, m.faction, m.state]).toEqual(['ally', 'self', 'Ally']);
    r.run(3);
    expect(m.side).toBe('ally');
  });

  it('the herds move: some minion of each walking floor leaves its spawn place', () => {
    for (const n of [1, 3, 4, 5]) {
      const r = newRealm();
      r.standOn(n);
      r.run(12);
      const herd = minionsOn(r.creatures, n);
      const start = herd.map(a => [a.body.x, a.body.z]);
      r.run(10);
      const moved = herd.some((a, i) => Math.hypot(a.body.x - start[i][0], a.body.z - start[i][1]) > 0.5);
      expect(moved, `floor ${n}`).toBe(true);
    }
  });
});
