// The sky is winnable in order (docs/architecture/SKY.md §7.1, docs/design/built/sky/laws/WAY-UP.md): from the deck
// the foot door and the spiral bring the player into hall 1; on each floor its deity wakes, telegraphs and acts on
// the player, takes positive hits only while the player is on its floor, and is won; its way up then opens and the
// climb's ledges carry the player into the next hall (into Totality's crown after the horse). Headless, with the real
// SkyRealm, SkyCreatures and the five real deities; the climbs are walked by the real Player (tests/helpers/walker.ts).

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { DebrisSystem } from '../src/physics/debris';
import type { Body } from '../src/physics/voxel-collide';
import { FOOT_WELL as W, openGate } from '../src/sky/floors/tree';
import { SkyRealm } from '../src/sky/sky-realm';
import { SPIRIT_MAX, type FloorIndex, type HindranceRunnerApi, type SkyActor, type SkyHost, type SkyRealmSet } from '../src/sky/types';
import { covers } from '../src/sky/world/shapes';
import { SkyWorld } from '../src/sky/world/sky-world';
import { walkRoute, type Waypoint } from './helpers/walker';

const DT = 1 / 30;

/** A fork whose seed is the whole path and a run seed, so each floor draws its own layout. */
const forkOf = (seed: number) => (...path: (string | number)[]) => {
  let h = seed >>> 0;
  for (const c of path.join('/')) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return new Rng(h || 1);
};

/** The real realm on a host that records what the sky does to the player. */
function rig(seed = 1) {
  let now = 0, spirit = SPIRIT_MAX;
  const body: Body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const log = { pushes: 0, slows: 0, holds: 0, carries: 0, drains: 0, refills: 0, toasts: [] as string[] };
  const player = {
    body, get eye() { return { x: body.x, y: body.y + 1.6, z: body.z }; }, aim: { x: 0, y: 0, z: 1 }, hand: [], held: false,
    push: () => { log.pushes++; }, slow: () => { log.slows++; }, hold: () => { log.holds++; }, carry: () => { log.carries++; },
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
    fork: forkOf(seed), fx: () => {}, cue: () => {}, enterUnity: () => {}, toast: (k: string) => { log.toasts.push(k); },
    card: () => {}, bar: () => {}, place: () => {}, gift: () => {}, travel: () => {},
    drainSpirit: (n: number) => { spirit -= n; log.drains++; }, spirit: () => spirit,
    refillSpirit: () => { spirit = SPIRIT_MAX; log.refills++; },
    takeRandomPractice: () => null, sendUnderground: () => { spirit = SPIRIT_MAX; return true; },
  } as unknown as SkyHost;
  const realm = SkyRealm.create(host, new THREE.Group(), layout => ({ kind: 'sky', world: (world = new SkyWorld(layout)), debris } as unknown as SkyRealmSet));
  const frame = () => {
    realm.update(DT);
    hazards.update(DT);
    now += DT;
    world!.expire(now);
  };
  const stand = (x: number, y: number, z: number) => { body.x = x; body.y = y; body.z = z; body.vx = body.vz = 0; body.vy = 0; body.onGround = true; };
  const solid = (x: number, y: number, z: number) => world!.solid(x, y, z);
  const runner = (realm as unknown as { runner: HindranceRunnerApi }).runner;
  return { realm, world: world!, body, log, frame, stand, solid, runner };
}
type Rig = ReturnType<typeof rig>;

const deityOn = (r: Rig, n: number): SkyActor =>
  r.realm.creatures.all().find(a => a.role === 'deity' && a.animal === r.realm.plans.floors[n - 1].animal)!;

/** From the arrival on the deck: through the foot door, up the four treads of the spiral, over the rim, onto hall 1. */
function deckToHall1(r: Rig) {
  const d = r.realm.plans.tree.deck;
  const route: Waypoint[] = [{ x: W.x + 6.5, y: d.y, z: W.z + 1 }];
  const treads = [[W.x + 2.5, W.z + 2], [W.x - 1.5, W.z + 2.5], [W.x - 1.5, W.z - 1.5], [W.x + 2, W.z - 1.5]];
  treads.forEach(([x, z], k) => route.push({ x, y: d.y + 1 + k, z }));
  route.push({ x: W.x + 2.5, y: 37, z: W.z - 4.5 }, { x: W.x + 2.5, y: 36, z: W.z - 6.5 });
  return walkRoute(r.solid, { x: d.x, y: d.y, z: d.z }, route);
}

/** Floor n's climb: every ledge of its steps, bottom to top, from the top of the floor's own route. */
function climb(r: Rig, n: number) {
  const f = r.realm.plans.floors[n - 1], s = r.realm.plans.tree.gates[n - 1].steps!;
  const top = f.route[f.route.length - 1];
  const route: Waypoint[] = [];
  for (let y = s.y0; y <= s.y1; y++)
    for (let z = s.z0; z <= s.z0 + 1; z++) for (let x = s.x0; x <= s.x0 + 1; x++)
      if (covers(s, x, y, z)) route.push({ x: x + 0.5, y: y + 1, z: z + 0.5 });
  return walkRoute(r.solid, { x: top.x + 0.5, y: top.y, z: top.z + 0.5 }, route);
}

/** The membrane's cells that are not the climb's ledge. */
function membrane(r: Rig, n: number): number[] {
  const g = r.realm.plans.tree.gates[n - 1];
  const out: number[] = [];
  for (let z = g.z - g.r; z <= g.z + g.r; z++) for (let x = g.x - g.r; x <= g.x + g.r; x++) {
    if ((x - g.x) ** 2 + (z - g.z) ** 2 > g.r * g.r + g.r) continue;
    if (g.steps && covers(g.steps, x, g.y, z)) continue;
    out.push(r.world.get(x, g.y, z));
  }
  return out;
}

/**
 * The player stands near floor n's seat; the realm runs until the deity telegraphs and acts, then the player lands
 * warm positive touches on it (found the way the touch router finds it, `creatures.at`) until it is won.
 */
function fight(r: Rig, n: number) {
  const seat = r.realm.plans.floors[n - 1].seat;
  const [x, y, z] = r.realm.placeAt([seat.x + Math.ceil(seat.w / 2) + 1, seat.y, seat.z]);
  r.stand(x + 0.5, y, z + 0.5);
  const deity = deityOn(r, n);
  const seen = new Set<string>();
  // acted: one of its hindrances reached its effect, or a drain, hold, carry or push landed after its first telegraph
  // (a hindrance of the floor below may still be ending as the player arrives, so the count starts at the telegraph)
  const effects = () => r.log.pushes + r.log.holds + r.log.carries + r.log.drains;
  let base = -1, acted = false;
  for (let t = 0; t < 90 && !acted; t += DT) {
    r.stand(x + 0.5, y, z + 0.5);
    r.frame();
    seen.add(deity.state);
    if (base < 0 && deity.state === 'Attacking') base = effects();
    acted = base >= 0 && (effects() > base || r.runner.active().some(h => h.source === deity.id && h.phase === 'effect'));
  }
  let touches = 0;
  for (let t = 0; t < 240 && deity.state !== 'Won'; t += DT) {
    r.stand(x + 0.5, y, z + 0.5);
    r.frame();
    seen.add(deity.state);
    if (Math.round(t / DT) % 6 === 0) {
      const b = deity.body;
      const id = r.realm.creatures.at(b.x, b.y + b.h / 2, b.z, 0.2);
      if (id === deity.id) { r.realm.creatures.touch(id, 'positive', true, { x: b.x, y: b.y + b.h / 2, z: b.z }, 'intent'); touches++; }
    }
  }
  return { deity, seen, acted, touches };
}

describe('the deck reaches hall 1', () => {
  it('the arrival stands on the deck in front of the foot door, and the door, the spiral and the rim bring the player into hall 1', () => {
    const r = rig();
    const d = r.realm.plans.tree.deck;
    expect([r.solid(Math.floor(d.x), d.y - 1, Math.floor(d.z)), r.solid(Math.floor(d.x), d.y, Math.floor(d.z)), r.solid(Math.floor(d.x), d.y + 1, Math.floor(d.z))])
      .toEqual([true, false, false]);
    const walk = deckToHall1(r);
    expect(walk.ok, JSON.stringify(walk)).toBe(true);
    expect(r.realm.floorAt(walk.at.y)).toBe(1);
  });

  it('stays reachable after a respawn (the sky left and entered again) and after a restart (a new realm)', () => {
    const r = rig(7);
    r.realm.leave();
    r.frame();
    expect(deckToHall1(r).ok).toBe(true);
    // floor 1 won and the player sent back to the deck: the way into hall 1 is unchanged
    const panda = deityOn(r, 1);
    for (let i = 0; i < 24; i++) r.realm.creatures.touch(panda.id, 'positive', true, panda.body, 'intent');
    expect(deckToHall1(r).ok).toBe(true);
    expect(deckToHall1(rig(7)).ok).toBe(true);
  });
});

describe('the climbs through the ways up', () => {
  it('every floor of every seed has a climb, closed by its membrane until its deity is won, then open into the next hall', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const r = rig(seed);
      for (let n = 1; n <= 5; n++) {
        const g = r.realm.plans.tree.gates[n - 1];
        expect(g.steps, `seed ${seed} floor ${n}`).toBeDefined();
        const closed = climb(r, n);
        expect(closed.ok, `seed ${seed} floor ${n} closed`).toBe(false);
        expect(closed.at.y, `seed ${seed} floor ${n} stays under the membrane`).toBeLessThan(g.y);
      }
      for (let n = 1 as FloorIndex; n <= 5; n = (n + 1) as FloorIndex) {
        openGate(r.world, r.realm.plans.tree, n);
        const open = climb(r, n);
        expect(open.ok, `seed ${seed} floor ${n} open: ${JSON.stringify(open)}`).toBe(true);
        expect(r.realm.floorAt(open.at.y), `seed ${seed} floor ${n} arrives`).toBe(n + 1);
      }
    }
  });
});

describe('the five floors are won in order', () => {
  it('each deity wakes and acts on the player on its floor, takes the player\'s hits, is won, and its way up carries the player on', () => {
    const r = rig(3);
    expect(deckToHall1(r).ok).toBe(true);
    for (let n = 1 as FloorIndex; n <= 5; n = (n + 1) as FloorIndex) {
      const deity = deityOn(r, n);
      // before the player is on its floor, it is parked and cannot be touched
      expect(deity.parked, `floor ${n} parked before`).toBe(true);
      expect(r.realm.creatures.targets().some(t => t.id === deity.id)).toBe(false);
      expect(membrane(r, n).every(m => m === MAT.heartwood), `floor ${n} closed`).toBe(true);
      const before = { ...r.log };
      const f = fight(r, n);
      expect(deity.parked, `floor ${n} awake`).toBe(false);
      expect(f.seen.has('Attacking'), `floor ${n} telegraphs: ${[...f.seen]}`).toBe(true);
      expect(f.acted, `floor ${n} acts on the player`).toBe(true);
      expect(f.touches, `floor ${n} touched`).toBeGreaterThan(0);
      expect(deity.state, `floor ${n} won after ${f.touches} touches, ${deity.hits} hits`).toBe('Won');
      expect(deity.hits).toBeGreaterThan(0);
      expect(r.log.refills).toBeGreaterThan(before.refills);
      expect(membrane(r, n).every(m => m === AIR), `floor ${n} open`).toBe(true);
      // the other deities stay parked while the player is here
      for (let k = 1; k <= 5; k++) if (k !== n) expect(deityOn(r, k).parked, `floor ${k} while on ${n}`).toBe(true);
      const up = climb(r, n);
      expect(up.ok, `floor ${n} climb ${JSON.stringify(up)}`).toBe(true);
      expect(r.realm.floorAt(up.at.y)).toBe(n + 1);
    }
  });
});
