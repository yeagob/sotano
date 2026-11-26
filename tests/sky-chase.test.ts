import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { DebrisSystem } from '../src/physics/debris';
import type { Body } from '../src/physics/voxel-collide';
import { DIVE_OVER } from '../src/sky/creatures/chase';
import { DEITIES } from '../src/sky/creatures/deities';
import { horseBrain, TRAMPLE_RADIUS } from '../src/sky/creatures/deities/horse';
import { deityOf, FREEZE, FREEZE_GAP, type Deity } from '../src/sky/creatures/deity';
import { harass, hunt, hunter } from '../src/sky/creatures/hunt';
import { CONTACT, RUSH_FREEZE } from '../src/sky/creatures/minion';
import { MINIONS } from '../src/sky/creatures/minions';
import { EFFECT as ELEPHANT_EFFECT, SHOULDER_BLOCKS } from '../src/sky/creatures/minions/elephant';
import { EFFECT as HORSE_EFFECT, KICK_PUSH } from '../src/sky/creatures/minions/horse';
import { EFFECT as KOALA_EFFECT, HUG_SECONDS } from '../src/sky/creatures/minions/koala';
import { EFFECT as LION_EFFECT, POUNCE_PUSH, ROAR_HOLD } from '../src/sky/creatures/minions/lion';
import { HUNTERS, EFFECT as PANDA_EFFECT } from '../src/sky/creatures/minions/panda';
import { SkyRealm } from '../src/sky/sky-realm';
import {
  ANIMALS, SPIRIT_MAX, TELEGRAPH, type Animal, type HindranceRunnerApi, type SkyActor, type SkyHost, type SkyRealmSet,
} from '../src/sky/types';
import { SkyWorld } from '../src/sky/world/sky-world';

const DT = 1 / 30;
const HOVERING: readonly Animal[] = ['panda', 'koala', 'elephant', 'lion'];

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
  return { realm, runner, body, log, frame, run, stand, spot, deity, shoot, now: () => now, floorOf };
}

const flat = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

describe('the deities hunt the player (#357)', () => {
  it('every hovering deity has a hunt, the horse walks its own; the telegraphs of the dives keep the floor of 0.9 to 1.4 s', () => {
    for (const a of HOVERING) {
      const c = DEITIES[a].chase!;
      expect(c, a).toBeDefined();
      expect(c.keep).toBeGreaterThan(c.near);
      expect(c.lift).toBeGreaterThanOrEqual(3);
      const t = TELEGRAPH[DEITIES[a].floor - 1];
      expect(t).toBeGreaterThanOrEqual(0.9);
      expect(t).toBeLessThanOrEqual(1.4);
    }
    expect(DEITIES.horse.chase).toBeUndefined();
    expect(new Set(HOVERING.map(a => DEITIES[a].chase!.dive.kind)).size).toBe(4);
  });

  for (const a of HOVERING) {
    it(`the ${a} follows the player across the floor, holds its distance and stays over their head`, () => {
      const r = rig();
      const near = r.spot(a), far = r.spot(a, -10, -9);
      r.run(6, near);
      const d = r.deity(a), c = DEITIES[a].chase!;
      expect(d.parked).toBe(false);
      r.run(10, far);
      const dist = flat(d.body, r.body);
      expect(dist, `${a} keeps ${c.keep}`).toBeLessThan(c.keep + 4);
      expect(d.body.y - r.body.y, `${a} over the head`).toBeGreaterThan(2);
      let over = 0, n = 0;
      for (let t = 0; t < 15; t += DT) {
        r.stand(far.x, far.y, far.z);
        r.frame();
        n++;
        if (d.body.y > r.body.y + 1.8 + 1 || flat(d.body, r.body) > c.near - 1) over++;
      }
      expect(over / n, `${a} out of easy reach`).toBeGreaterThan(0.85);
    });

    it(`the ${a} dodges when a hit counts, in any state but its naps`, () => {
      const r = rig();
      const at = r.spot(a);
      r.run(8, at);
      const d = r.deity(a), m = deityOf(d)!;
      let moved = 0, tries = 0;
      for (let k = 0; k < 6; k++) {
        r.run(2.2, at);
        if (DEITIES[a].chase!.still?.includes(d.state)) continue;
        const from = { x: d.body.x, y: d.body.y, z: d.body.z };
        const before = m.chaser!.counts.dodges, hits = d.hits;
        r.stand(d.body.x + 1.5, d.body.y - 0.9, d.body.z);
        r.shoot(d);
        if (d.hits === hits || m.chaser!.counts.dodges === before) continue;
        tries++;
        r.run(1, at);
        if (Math.hypot(d.body.x - from.x, d.body.y - from.y, d.body.z - from.z) >= 1) moved++;
      }
      expect(tries).toBeGreaterThan(0);
      expect(moved).toBe(tries);
    });

    it(`the ${a} dives at the player: the floor's telegraph, then down over the spot, then back up`, () => {
      const r = rig();
      const at = r.spot(a);
      r.run(4, at);
      const d = r.deity(a), m = deityOf(d)!;
      const before = m.chaser!.counts.dives;
      const pre = d.body.y - r.body.y;
      let t = 0;
      let seen = new Set<number>();
      while (m.chaser!.counts.dives === before && t < 40) { seen = new Set(r.runner.active().map(h => h.run)); r.run(DT, at); t += DT; }
      expect(m.chaser!.counts.dives, a).toBe(before + 1);
      const fresh = r.runner.active().filter(h => h.source === d.id && h.phase === 'telegraph' && !seen.has(h.run));
      expect(fresh.length, a).toBeGreaterThan(0);
      expect(Math.max(...fresh.map(h => h.left))).toBeGreaterThanOrEqual(TELEGRAPH[DEITIES[a].floor - 1] - 2 * DT);
      r.run(TELEGRAPH[DEITIES[a].floor - 1], at);
      const low = d.body.y - r.body.y;
      expect(low < DIVE_OVER + (DEITIES[a].hover ?? 0) + 1 || low < pre - 1, `${a} came down from ${pre} to ${low}`).toBe(true);
      r.run(2, at);
      expect(d.body.y - r.body.y, `${a} rose again`).toBeGreaterThan(low);
    });

    it(`the ${a} is warded while it winds up: a hit from afar puffs, one from close counts`, () => {
      const r = rig();
      const at = r.spot(a);
      r.run(4, at);
      const d = r.deity(a), m = deityOf(d) as Deity;
      let t = 0;
      while (!(d.state === 'Attacking' || DEITIES[a].chase!.ward?.includes(d.state)) && t < 60) { r.run(DT, at); t += DT; }
      expect(m.warded() || flat(d.body, r.body) <= DEITIES[a].chase!.answer).toBe(true);
      if (m.warded()) {
        const hits = d.hits;
        r.shoot(d);
        expect(d.hits).toBe(hits);
        r.stand(d.body.x + 1, r.body.y, d.body.z);
        expect(m.warded()).toBe(false);
      }
    });
  }

  it('the horse moves when shot: a leap away, a leap onto the player, or a shy to the side', () => {
    const r = rig();
    const at = r.spot('horse', 6, 0);
    r.run(4, at);
    const d = r.deity('horse');
    let moved = 0;
    for (let k = 0; k < 6; k++) {
      r.run(3, at);
      const from = { x: d.body.x, z: d.body.z };
      r.shoot(d);
      let far = 0;
      for (let t = 0; t < 2.5; t += DT) { r.stand(at.x, at.y, at.z); r.frame(); far = Math.max(far, flat(d.body, from)); }
      if (far >= 1) moved++;
    }
    expect(moved).toBeGreaterThanOrEqual(5);
    const b = horseBrain(d)!;
    expect(b.hitLeaps + b.shies).toBeGreaterThan(0);
    expect(TRAMPLE_RADIUS).toBeGreaterThan(3);
  });

  it('a deity won by its hits becomes an ally, settles back over its seat and gives its gift once', () => {
    const r = rig();
    const at = r.spot('panda');
    r.run(4, at);
    const d = r.deity('panda');
    for (let i = 0; i < DEITIES.panda.hits + 10; i++) r.shoot(d);
    r.run(10, at);
    expect([d.side, d.state]).toEqual(['ally', 'Won']);
    expect(r.log.gifts).toEqual(['still-sitting']);
    const seat = r.realm.plans.floors[0].seat;
    expect(flat(d.body, { x: seat.x + 0.5, z: seat.z + 0.5 })).toBeLessThan(2);
  });
});

describe('the allies go for the deity the player shoots at (#357)', () => {
  function allies(r: ReturnType<typeof rig>, a: Animal, n: number) {
    const floor = r.floorOf(a);
    const herd = r.realm.creatures.all().filter(c => c.role === 'minion' && c.animal === a && c.spawning <= 0 && c.side === 'wild') as SkyActor[];
    const out = herd.slice(0, n);
    for (const m of out) for (let i = 0; i < MINIONS[a].hitsToTurn; i++) r.realm.creatures.touch(m.id, 'positive', true, m.body, 'intent');
    expect(floor).toBeGreaterThan(0);
    return out;
  }

  it('an ally walks toward the deity while the player shoots it, and not while the player does not', () => {
    const r = rig();
    const at = r.spot('panda');
    r.run(6, at);
    const d = r.deity('panda');
    const [m] = allies(r, 'panda', 1);
    expect(m.side).toBe('ally');
    r.run(1, at);
    const start = flat(m.body, d.body);
    for (let t = 0; t < 6; t += DT) { if (Math.round(t / DT) % 10 === 0) r.shoot(d); r.stand(at.x, at.y, at.z); r.frame(); }
    expect(deityOf(d)!.targeted).toBe(true);
    const freezes = deityOf(d)!.freezes.length;
    expect(flat(m.body, d.body) < start - 1 || freezes > 0).toBe(true);
    r.run(6, at);
    expect(deityOf(d)!.targeted).toBe(false);
  });

  it('an ally that reaches the deity freezes it for 2 s, then it moves again; not again before the gap', () => {
    const r = rig();
    const at = r.spot('panda');
    r.run(6, at);
    const d = r.deity('panda'), m = deityOf(d)!;
    const [ally] = allies(r, 'panda', 1);
    r.shoot(d);
    ally.body.x = d.body.x; ally.body.z = d.body.z; ally.body.y = d.body.y - 3;
    r.frame();
    expect(m.frozen).toBeGreaterThan(0);
    expect(m.freezes.length).toBe(1);
    expect(RUSH_FREEZE).toBe(FREEZE);
    expect(FREEZE).toBe(2);
    const held = { x: d.body.x, y: d.body.y, z: d.body.z }, state = d.state;
    r.run(FREEZE - 0.1, at);
    expect([d.body.x, d.body.y, d.body.z]).toEqual([held.x, held.y, held.z]);
    expect(d.state).toBe(state);
    r.run(0.2, at);
    expect(m.frozen).toBe(0);
    expect(m.freeze()).toBe(false);
    r.run(FREEZE_GAP, at);
    r.run(2, at);
    expect(Math.hypot(d.body.x - held.x, d.body.y - held.y, d.body.z - held.z)).toBeGreaterThan(0.1);
    expect(CONTACT).toBeGreaterThan(1);
  });
});

describe('the herds are many and hit hard (#357)', () => {
  it('ten times the first counts, and three to four times the first effects', () => {
    const first: Record<Animal, [number, number]> = { panda: [4, 3], koala: [6, 6], elephant: [5, 3], lion: [6, 4], horse: [5, 3] };
    for (const a of ANIMALS) {
      const k = MINIONS[a].max / first[a][0];
      expect(k, a).toBe(10);
      expect(MINIONS[a].wildMax / first[a][1], a).toBe(10);
    }
    for (const e of [PANDA_EFFECT, KOALA_EFFECT, ELEPHANT_EFFECT, LION_EFFECT, HORSE_EFFECT]) { expect(e).toBeGreaterThanOrEqual(3); expect(e).toBeLessThanOrEqual(5); }
    expect([HUG_SECONDS, SHOULDER_BLOCKS, POUNCE_PUSH, ROAR_HOLD, KICK_PUSH]).toEqual([2 * KOALA_EFFECT, 2 * ELEPHANT_EFFECT, 5 * LION_EFFECT, LION_EFFECT, 2.5 * HORSE_EFFECT]);
  });

  it('a floor fills to its wild count within seconds of the player arriving', () => {
    const r = rig();
    const at = r.spot('panda');
    r.run(14, at);
    const herd = r.realm.creatures.all().filter(c => c.role === 'minion' && c.animal === 'panda');
    expect(herd.length).toBe(MINIONS.panda.wildMax);
  });

  it('the hunters go for the player and the panda herd shoves with the floor\'s telegraph', () => {
    const r = rig();
    const at = r.spot('panda');
    r.run(14, at);
    const herd = r.realm.creatures.all().filter(c => c.role === 'minion' && c.animal === 'panda' && c.side === 'wild' && hunter(c as SkyActor, HUNTERS)) as SkyActor[];
    expect(herd.length).toBeGreaterThan(5);
    const close = () => herd.filter(m => flat(m.body, r.body) <= 7).length;
    const pushes = r.log.pushes;
    const starts: number[] = [];
    for (let t = 0; t < 20; t += DT) {
      r.stand(at.x, at.y, at.z);
      const seen = new Set(r.runner.active().map(h => h.run));
      r.frame();
      for (const h of r.runner.active()) if (!seen.has(h.run) && h.source !== r.deity('panda').id && h.id === 'knockback') starts.push(h.left);
    }
    expect(close()).toBeGreaterThanOrEqual(herd.length / 3);
    expect(starts.length).toBeGreaterThan(0);
    for (const s of starts) expect(s).toBeGreaterThanOrEqual(TELEGRAPH[0] - 2 * DT);
    expect(r.log.pushes).toBeGreaterThan(pushes);
    expect(typeof hunt(1)).toBe('function');
    expect(typeof harass({ reach: 1, every: 1, strength: 1, cue: 'panda.huff' })).toBe('function');
  });
});
