import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { EL_WATER, SOURCE, elemByte } from '../src/content/elements';
import { FREEZE_CADENCE } from '../src/core/freeze';
import { Rng } from '../src/core/rng';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { DebrisSystem } from '../src/physics/debris';
import { Player } from '../src/entities/player';
import { SkyEffects } from '../src/sky/hindrances/effects';
import type { Body } from '../src/physics/voxel-collide';
import { deityOf } from '../src/sky/creatures/deity';
import { HINDRANCES } from '../src/sky/hindrances';
import { SkyRealm } from '../src/sky/sky-realm';
import {
  SPIRIT_MAX, type Animal, type HindranceRunnerApi, type SkyActor, type SkyHost, type SkyPlayer, type SkyRealmSet,
} from '../src/sky/types';
import { SkyWorld } from '../src/sky/world/sky-world';

const DT = 1 / 30;

const forkOf = (seed: number) => (...path: (string | number)[]) => {
  let h = seed >>> 0;
  for (const c of path.join('/')) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return new Rng(h || 1);
};

function rig(seed = 3) {
  let now = 0;
  const body: Body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const log = { pushes: 0, holds: 0, slows: 0, gifts: [] as string[] };
  const player = {
    body, get eye() { return { x: body.x, y: body.y + 1.6, z: body.z }; }, aim: { x: 0, y: 0, z: 1 }, hand: [], held: false,
    push: () => { log.pushes++; }, slow: () => { log.slows++; }, hold: () => { log.holds++; }, carry: () => {},
  };
  const target = { id: 999, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hazardHost: HazardHost = {
    actors: () => [target], hurt: (() => {}) as unknown as HazardHost['hurt'], affect: (() => {}) as unknown as HazardHost['affect'],
    push: (() => {}) as unknown as HazardHost['push'], live: () => {}, particles: () => {},
  };
  const hazards = new Hazards(new THREE.Group(), hazardHost);
  const debris = new DebrisSystem(512, () => false, () => {});
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  let world: SkyWorld | null = null;
  const host = {
    time: () => now, player: () => player, actors: () => actors, world: () => world!, debris: () => debris, hazards: () => hazards,
    fork: forkOf(seed), fx: () => {}, cue: () => {}, enterUnity: () => {}, toast: () => {},
    card: () => {}, bar: () => {}, place: () => {}, meetFloor: () => {}, gift: (id: string) => { log.gifts.push(id); }, travel: () => {},
    drainSpirit: () => {}, spirit: () => SPIRIT_MAX, refillSpirit: () => {},
    takeRandomPractice: () => null, sendUnderground: () => true,
  } as unknown as SkyHost;
  const realm = SkyRealm.create(host, new THREE.Group(), layout => ({ kind: 'sky', world: (world = new SkyWorld(layout)), debris } as unknown as SkyRealmSet));
  const runner = (realm as unknown as { runner: HindranceRunnerApi }).runner;
  const frame = () => { realm.update(DT); hazards.update(DT); now += DT; world!.expire(now); };
  const stand = (x: number, y: number, z: number) => { body.x = x; body.y = y; body.z = z; body.vx = body.vz = body.vy = 0; body.onGround = true; };
  const floorOf = (a: Animal) => realm.plans.floors.findIndex(f => f.animal === a) + 1;
  const spot = (a: Animal, dx = 9, dz = 3) => {
    const f = realm.plans.floors[floorOf(a) - 1], s = f.seat, w = world!;
    for (let k = 0; k <= 8; k++) for (let dz2 = -k; dz2 <= k; dz2++) for (let dx2 = -k; dx2 <= k; dx2++) {
      if (Math.max(Math.abs(dx2), Math.abs(dz2)) !== k) continue;
      const x = s.x + dx + dx2, z = s.z + dz + dz2;
      for (let y = f.y0 - 4; y <= f.y0 + 4; y++) {
        if (realm.floorAt(y) !== f.index) continue;
        if (w.solid(x, y - 1, z) && !w.solid(x, y, z) && !w.solid(x, y + 1, z)) return { x: x + 0.5, y, z: z + 0.5 };
      }
    }
    const [x, y, z] = realm.placeAt([s.x + dx, f.y0, s.z + dz]);
    return { x: x + 0.5, y, z: z + 0.5 };
  };
  const deity = (a: Animal) => realm.creatures.all().find(c => c.role === 'deity' && c.animal === a) as SkyActor;
  const run = (s: number, at?: { x: number; y: number; z: number }) => {
    for (let t = 0; t < s - 1e-9; t += DT) { if (at) stand(at.x, at.y, at.z); frame(); }
  };
  const shoot = (d: SkyActor) => realm.creatures.touch(d.id, 'positive', true, { x: d.body.x, y: d.body.y + d.body.h / 2, z: d.body.z }, 'intent');
  return { realm, runner, body, log, frame, run, stand, spot, deity, shoot, now: () => now, floorOf, world: () => world! };
}


const minionsOf = (r: ReturnType<typeof rig>, a: Animal) =>
  r.realm.creatures.all().filter(c => c.role === 'minion' && c.animal === a && !c.parked && c.state !== 'Spawning' && c.state !== 'Fading');

describe('the freeze family in the sky (#357)', () => {
  it('a deity frozen by the sphere (3 s) cannot be frozen by an ally during the next 3 s, and can after', () => {
    const r = rig();
    const at = r.spot('panda');
    r.run(6, at);
    const d = r.deity('panda'), m = deityOf(d)!;
    expect(r.realm.creatures.freeze(d.id, 3)).toBe(true);
    const held = { x: d.body.x, y: d.body.y, z: d.body.z };
    r.run(2.9, at);
    expect([d.body.x, d.body.y, d.body.z]).toEqual([held.x, held.y, held.z]);
    expect(m.freeze(2)).toBe(false);
    r.run(0.2, at);
    expect(m.frozen).toBe(0);
    expect(m.freeze(2)).toBe(false);
    expect(r.realm.creatures.freeze(d.id, 3)).toBe(false);
    r.run(FREEZE_CADENCE, at);
    expect(m.freeze(2)).toBe(true);
  });

  it('a minion frozen stays still and keeps its state, then thaws into the same cadence', () => {
    const r = rig();
    const at = r.spot('panda');
    r.run(12, at);
    const [mn] = minionsOf(r, 'panda');
    expect(mn).toBeDefined();
    expect(r.realm.creatures.freeze(mn.id, 3)).toBe(true);
    const held = { x: mn.body.x, z: mn.body.z }, state = mn.state;
    r.run(2.9, at);
    expect([mn.body.x, mn.body.z]).toEqual([held.x, held.z]);
    expect(mn.state).toBe(state);
    r.run(0.2, at);
    expect(r.realm.creatures.freeze(mn.id, 3)).toBe(false);
    r.run(FREEZE_CADENCE, at);
    expect(r.realm.creatures.freeze(mn.id, 3)).toBe(true);
  });

  it('the paralysis ring (the lion roar) freezes the player in the family: a ring within the cadence does nothing', () => {
    const p = new Player();
    p.spawnAt(2.5, 1, 0.5);
    p.body.onGround = true;
    const player: SkyPlayer = {
      get body() { return p.body; }, eye: { x: 0, y: 0, z: 0 }, aim: { x: 0, y: 0, z: 1 }, hand: [],
      push: () => {}, slow: () => {}, hold: s => p.hold(s), carry: () => {}, freeze: s => p.freeze(s),
      get held() { return p.heldT > 0; }, get shielded() { return p.shielded; },
    };
    const hazardHost: HazardHost = {
      actors: () => [], hurt: (() => {}) as unknown as HazardHost['hurt'], affect: (() => {}) as unknown as HazardHost['affect'],
      push: (() => {}) as unknown as HazardHost['push'], live: () => {}, particles: () => {},
    };
    const host = { player: () => player, cue: () => {}, fx: () => {}, time: () => 0 } as unknown as SkyHost;
    const ctx = { host, effects: new SkyEffects(host), hazards: new Hazards(new THREE.Group(), hazardHost), time: () => 0 };
    const ring = () => {
      const e = HINDRANCES.paralysis.effect(ctx, { from: { x: 0.5, y: 1, z: 0.5 }, speed: 8, radius: 4, hold: 1 });
      for (let k = 0; k < 120 && e.update(DT); k++);
      e.end();
    };
    ring();
    expect(p.ice.frozen).toBe(true);
    expect(p.heldT).toBe(1);
    for (let t = 0; t < 1.1; t += DT) p.ice.tick(DT);
    p.heldT = 0;
    ring();
    expect(p.heldT).toBe(0);
    for (let t = 0; t < FREEZE_CADENCE; t += DT) p.ice.tick(DT);
    ring();
    expect(p.heldT).toBe(1);
  });
});

describe('water slows the sky creatures (#357)', () => {
  it('a deity whose body is in water has pace 0.5 (1 out of it), the lion and the horse included', () => {
    const r = rig();
    for (const a of ['panda', 'lion', 'horse'] as Animal[]) {
      const at = r.spot(a);
      r.run(2, at);
      const d = r.deity(a), m = deityOf(d)!;
      expect(m.pace, a).toBe(1);
      const w = r.world(), x = Math.floor(d.body.x), y = Math.floor(d.body.y + 0.1), z = Math.floor(d.body.z);
      if (w.solid(x, y, z)) continue;
      w.setElemByte(x, y, z, elemByte(EL_WATER, SOURCE));
      const before = { x: d.body.x, z: d.body.z };
      r.frame();
      if (Math.floor(before.x) === x && Math.floor(before.z) === z) expect(m.pace, a).toBe(0.5);
      w.setElemByte(x, y, z, 0);
    }
  });

  it('a minion walking in water covers half the ground of one walking on dry ground', () => {
    const r = rig();
    const at = r.spot('panda');
    r.run(12, at);
    const [mn] = minionsOf(r, 'panda');
    const w = r.world();
    const step = (wet: boolean) => {
      const x0 = mn.body.x, z0 = mn.body.z;
      const x = Math.floor(x0), y = Math.floor(mn.body.y + 0.1), z = Math.floor(z0);
      if (wet && !w.solid(x, y, z)) w.setElemByte(x, y, z, elemByte(EL_WATER, SOURCE));
      r.frame();
      if (wet) w.setElemByte(x, y, z, 0);
      return Math.hypot(mn.body.x - x0, mn.body.z - z0);
    };
    let dry = 0, wet = 0;
    for (let k = 0; k < 30; k++) { dry = Math.max(dry, step(false)); }
    for (let k = 0; k < 30; k++) { wet = Math.max(wet, step(true)); }
    expect(wet).toBeLessThanOrEqual(dry * 0.5 + 1e-6);
  });
});
