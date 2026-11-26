import * as THREE from 'three';
import { Rng } from '../../src/core/rng';
import { BASE_STATS, type Stats } from '../../src/core/stats';
import { Hazards, type HazardHost } from '../../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../../src/entities/actors';
import { Player } from '../../src/entities/player';
import type { Input } from '../../src/input/input';
import { DebrisSystem } from '../../src/physics/debris';
import { deityOf } from '../../src/sky/creatures/deity';
import { horseBrain } from '../../src/sky/creatures/deities/horse';
import { SkyRealm } from '../../src/sky/sky-realm';
import { SPIRIT_MAX, type HindranceRunnerApi, type SkyActor, type SkyHost, type SkyPlayer, type SkyRealmSet } from '../../src/sky/types';
import { SkyWorld } from '../../src/sky/world/sky-world';

const DT = 1 / 30;
const SUB = 4;
const LIFE = 3;

export interface Kit { name: string; stats: Stats; strands: number; spread: number; aimError: number }

export const STARTING: Kit = { name: 'starting kit', stats: { ...BASE_STATS }, strands: 1, spread: 0, aimError: 0.04 };
export const PRACTICES: Kit = {
  name: 'normal practices',
  stats: { ...BASE_STATS, fireRate: 4.3, shotSpeed: 1.3, range: 1.8, moveSpeed: 1.2, jump: 1.5, airJumps: 2, triad: 1 },
  strands: 3, spread: 0.05, aimError: 0.04,
};

export interface DuelResult {
  floor: number; kit: string; won: boolean; seconds: number; projected: number;
  shots: number; deityHits: number; minionHits: number; turned: number;
  deityActs: number; minionActs: number; actsPerMin: number; minionActsPerMin: number;
  drained: number; underground: number; heldShare: number; pushes: number;
  dodges: number; dives: number; landed: number; freezes: number;
  exposure: number; meanDistance: number; minDistance: number; moved: number; reactions: number; reacted: number;
  minions: number; maxWild: number; falls: number; states: Record<string, number>; runs: Record<string, [number, number]>;
}

const forkOf = (seed: number) => (...path: (string | number)[]) => {
  let h = seed >>> 0;
  for (const c of path.join('/')) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return new Rng(h || 1);
};

interface Shot { x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; flight: number; gravity: number }

export function duel(floor: number, kit: Kit, cap = 300, seed = 3): DuelResult {
  let now = 0, spirit = SPIRIT_MAX, underground = 0;
  const p = new Player();
  const events = { push: 0, hold: 0, slow: 0, carry: 0, drain: 0 };
  let frameEvents = 0;
  const player: SkyPlayer = {
    get body() { return p.body; },
    get eye() { return p.eye; },
    get aim() { return p.forward; },
    get hand() { return p.hand; },
    push: (vx, vy, vz) => { events.push++; frameEvents++; p.push(vx, vy, vz); },
    slow: (_f, s) => { if (p.slowT <= 0) { events.slow++; frameEvents++; } p.slowT = Math.max(p.slowT, s); },
    hold: s => { if (p.heldT <= 0) { events.hold++; frameEvents++; } p.hold(s); },
    carry: (to, s) => { events.carry++; frameEvents++; p.carry(to, s); },
    get held() { return p.heldT > 0; },
  };
  const target = { id: 999, kind: 'sky', alive: true, spawning: 0, faction: 'self', body: p.body } as unknown as Actor;
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
    card: () => {}, bar: () => {}, place: () => {}, meetFloor: () => {}, gift: () => {}, travel: () => {},
    drainSpirit: (n: number) => { spirit -= n; events.drain += n; frameEvents++; }, spirit: () => spirit,
    refillSpirit: () => { spirit = SPIRIT_MAX; },
    takeRandomPractice: () => null, sendUnderground: () => { underground++; spirit = SPIRIT_MAX; return true; },
  } as unknown as SkyHost;
  const realm = SkyRealm.create(host, new THREE.Group(), layout => ({ kind: 'sky', world: (world = new SkyWorld(layout)), debris } as unknown as SkyRealmSet));
  const runner = (realm as unknown as { runner: HindranceRunnerApi }).runner;
  const w = world!;
  const solid = (x: number, y: number, z: number) => w.solid(x, y, z);
  const plan = realm.plans.floors[floor - 1];
  const seat = plan.seat;
  const [sx, sy, sz] = realm.placeAt([seat.x + 9, seat.y, seat.z + 3]);
  const start = { x: sx + 0.5, y: sy, z: sz + 0.5 };
  p.spawnAt(start.x, start.y, start.z);
  p.body.onGround = true;
  const deity = realm.creatures.all().find(a => a.role === 'deity' && a.animal === plan.animal) as SkyActor;
  const machine = deityOf(deity);
  const rng = new Rng(seed * 7919 + floor);
  const pressed = new Set<string>();
  const move = { x: 0, y: 0 };
  const input = { hit: (a: string) => pressed.has(a), held: (a: string) => pressed.has(a), move, lookDX: 0, lookDY: 0, sensitivity: 0 } as unknown as Input;
  const hooks = { jump: (v: number) => v, land: () => {}, bump: (v: number) => v };
  const stats = kit.stats;
  const speed = 16 * stats.shotSpeed, flight = 0.5 * stats.range, gravity = 22 * stats.gravity;
  const straight = speed * flight;
  const shots: Shot[] = [];
  let cool = 0, strafe = 1, strafeT = 0, hopT = 1, airLeft = 0;
  const r: DuelResult = {
    floor, kit: kit.name, won: false, seconds: 0, projected: 0, shots: 0, deityHits: 0, minionHits: 0, turned: 0,
    deityActs: 0, minionActs: 0, actsPerMin: 0, minionActsPerMin: 0, drained: 0, underground: 0, heldShare: 0, pushes: 0,
    dodges: 0, dives: 0, landed: 0, freezes: 0, exposure: 0, meanDistance: 0, minDistance: Infinity, moved: 0, reactions: 0,
    reacted: 0, minions: 0, maxWild: 0, falls: 0, states: {}, runs: {},
  };
  const hitRuns = new Set<number>();
  let lastState = '';
  let exposed = 0, distSum = 0, heldFrames = 0, frames = 0, last = { x: deity.body.x, y: deity.body.y, z: deity.body.z };
  let vel = { x: 0, y: 0, z: 0 };
  let quiet = 99, quietBefore = 99;
  let hitsBefore = 0, watchFrom = -1, hitAt = { x: 0, y: 0, z: 0 };
  const seenRuns = new Map<number, number>();
  const centre = (a: SkyActor) => ({ x: a.body.x, y: a.body.y + a.body.h / 2, z: a.body.z });
  const gauss = () => (rng.next() + rng.next() + rng.next() - 1.5) * 1.4;

  const fire = (aim: { x: number; y: number; z: number }) => {
    const e = p.eye;
    const dx = aim.x - e.x, dy = aim.y - e.y, dz = aim.z - e.z, d = Math.hypot(dx, dy, dz) || 1;
    for (let k = 0; k < kit.strands; k++) {
      const off = (k - (kit.strands - 1) / 2) * kit.spread;
      const yaw = Math.atan2(dz, dx) + off + gauss() * kit.aimError, pitch = Math.asin(dy / d) + gauss() * kit.aimError;
      shots.push({
        x: e.x, y: e.y, z: e.z, t: 0, flight, gravity,
        vx: Math.cos(pitch) * Math.cos(yaw) * speed, vy: Math.sin(pitch) * speed, vz: Math.cos(pitch) * Math.sin(yaw) * speed,
      });
      r.shots++;
    }
  };

  const stepShots = () => {
    const h = DT / SUB;
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      let gone = false;
      for (let k = 0; k < SUB && !gone; k++) {
        s.t += h;
        if (s.t > s.flight) s.vy -= s.gravity * h;
        s.x += s.vx * h; s.y += s.vy * h; s.z += s.vz * h;
        if (solid(Math.floor(s.x), Math.floor(s.y), Math.floor(s.z))) { gone = true; break; }
        const id = realm.creatures.at(s.x, s.y, s.z, 0.12 * stats.size);
        if (id >= 0) {
          const a = realm.creatures.all().find(c => c.id === id) as SkyActor | undefined;
          if (a) {
            const wasAlly = a.side === 'ally';
            realm.creatures.touch(id, 'positive', true, { x: s.x, y: s.y, z: s.z }, 'intent');
            if (a === deity) r.deityHits++; else { r.minionHits++; if (!wasAlly && a.side === 'ally') r.turned++; }
          }
          gone = true;
        }
      }
      if (gone || s.t > LIFE) shots.splice(i, 1);
    }
  };

  for (let t = 0; t < cap && deity.state !== 'Won'; t += DT) {
    frames++;
    quietBefore = quiet;
    frameEvents = 0;
    const before = new Map<number, number>();
    for (const a of runner.active()) if (a.phase === 'telegraph') before.set(a.run, a.source);
    const minions = realm.creatures.all().filter(a => a.role === 'minion' && a.animal === plan.animal) as SkyActor[];
    const wild = minions.filter(m => m.side === 'wild' && m.spawning <= 0 && !m.parked);
    r.minions = Math.max(r.minions, minions.length);
    r.maxWild = Math.max(r.maxWild, wild.length);
    const b = p.body, e = p.eye, dc = centre(deity);
    const flat = Math.hypot(dc.x - b.x, dc.z - b.z);
    const d3 = Math.hypot(dc.x - e.x, dc.y - e.y, dc.z - e.z);
    distSum += flat;
    r.minDistance = Math.min(r.minDistance, d3);
    if (d3 <= straight + 1) exposed++;
    const close = wild.filter(m => Math.hypot(m.body.x - b.x, m.body.z - b.z) <= 2.5).sort((m, n) =>
      Math.hypot(m.body.x - b.x, m.body.z - b.z) - Math.hypot(n.body.x - b.x, n.body.z - b.z))[0];
    const aimAt = close ? centre(close) : dc;
    const lead = close ? 0 : Math.min(1.2, d3 / speed);
    const aim = { x: aimAt.x + vel.x * lead, y: aimAt.y + vel.y * lead, z: aimAt.z + vel.z * lead };
    const ax = aim.x - e.x, az = aim.z - e.z;
    p.yaw = Math.atan2(-ax, -az);
    p.pitch = Math.atan2(aim.y - e.y, Math.hypot(ax, az));
    strafeT -= DT;
    if (strafeT <= 0) { strafe = rng.next() < 0.5 ? 0 : rng.next() < 0.5 ? -1 : 1; strafeT = 1.5 + rng.next() * 2; }
    move.x = strafe;
    move.y = flat > 7 ? 1 : flat < 4 && strafe !== 0 ? -1 : 0;
    pressed.clear();
    hopT -= DT;
    if (b.onGround && hopT <= 0) { pressed.add('jump'); hopT = 2 + rng.next() * 3; airLeft = stats.airJumps >= 1 && dc.y > e.y + 3 ? 1 : 0; }
    else if (!b.onGround && b.vy < 0 && airLeft > 0) { pressed.add('jump'); airLeft--; }
    p.update(DT, input, stats, solid, hooks, { feet: null, head: null }, { minJump: 1 });
    if (realm.floorAt(p.body.y) !== floor) { r.falls++; p.spawnAt(start.x, start.y, start.z); p.body.onGround = true; }
    cool -= DT;
    if (cool <= 0 && (close || d3 <= straight + 6)) { fire(aim); cool += 1 / stats.fireRate; }
    if (cool < 0) cool = 0;
    realm.update(DT);
    hazards.update(DT);
    stepShots();
    now += DT;
    w.expire(now);
    if (p.heldT > 0) heldFrames++;
    const landed: number[] = [];
    for (const [run, src] of before) {
      const a = runner.active().find(x => x.run === run);
      if (!a || a.phase === 'effect') landed.push(src);
    }
    for (const a of runner.active()) {
      if (a.source !== deity.id) continue;
      if (!seenRuns.has(a.run)) { seenRuns.set(a.run, a.source); const k = r.runs[a.id] ?? (r.runs[a.id] = [0, 0]); k[0]++; }
      if (a.phase === 'effect' && frameEvents > 0 && !hitRuns.has(a.run)) { hitRuns.add(a.run); r.runs[a.id][1]++; }
    }
    if (frameEvents > 0) quiet = 0; else quiet++;
    if (frameEvents > 0 && quietBefore >= 15) {
      if (landed.some(s => s !== deity.id) && !landed.includes(deity.id)) r.minionActs++;
      else r.deityActs++;
    }
    const db = deity.body;
    vel = { x: (db.x - last.x) / DT, y: (db.y - last.y) / DT, z: (db.z - last.z) / DT };
    if (Math.hypot(vel.x, vel.z) > 0.3) r.moved++;
    if (deity.hits > hitsBefore && watchFrom < 0) { r.reactions++; watchFrom = frames; hitAt = { x: db.x, y: db.y, z: db.z }; }
    hitsBefore = deity.hits;
    if (watchFrom >= 0 && Math.hypot(db.x - hitAt.x, db.y - hitAt.y, db.z - hitAt.z) >= 1) { r.reacted++; watchFrom = -1; }
    else if (watchFrom >= 0 && frames - watchFrom >= 45) watchFrom = -1;
    last = { x: db.x, y: db.y, z: db.z };
    if (deity.state !== lastState) { lastState = deity.state; r.states[lastState] = (r.states[lastState] ?? 0) + 1; }
    r.seconds = t + DT;
  }
  r.won = deity.state === 'Won';
  const mins = r.seconds / 60;
  r.projected = r.won ? r.seconds : (deity.hits > 0 ? r.seconds * machine!.def.hits / deity.hits : Infinity);
  r.actsPerMin = r.deityActs / mins;
  r.minionActsPerMin = r.minionActs / mins;
  r.drained = events.drain;
  r.underground = underground;
  r.heldShare = heldFrames / Math.max(1, frames);
  r.pushes = events.push;
  r.exposure = exposed / Math.max(1, frames);
  r.meanDistance = distSum / Math.max(1, frames);
  r.moved = r.moved / Math.max(1, frames);
  const counts = machine?.chaser?.counts;
  if (counts) { r.dodges = counts.dodges; r.dives = counts.dives; r.landed = counts.landed; }
  r.freezes = machine?.freezes.length ?? 0;
  const brain = plan.animal === 'horse' ? horseBrain(deity) : null;
  if (brain) { r.dodges = brain.hitLeaps; r.landed = brain.tramples; }
  return r;
}
