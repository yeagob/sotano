// Spirit, the outline of the hearts (guardians §6.6, SKY.md §5.2, §19): the drain gate (SpiritLaw), the deity's
// drain (once per attack run, refused by the gate), the choice that skips drain attacks in the closed windows, the
// fall underground at zero, and the refill when a deity is won. Headless: a fake host with a clock the test moves.

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ActorRegistry } from '../src/entities/actors';
import { Rng } from '../src/core/rng';
import type { Body } from '../src/physics/voxel-collide';
import { Puff } from '../src/sky/creatures/puff';
import { SkyCreatures } from '../src/sky/creatures/system';
import { DRAIN_CALM, DRAIN_GAP, SpiritLaw, UNDERGROUND_FLOORS } from '../src/sky/laws/spirit';
import { SkyRealm } from '../src/sky/sky-realm';
import { SkyWorld } from '../src/sky/world/sky-world';
import type {
  AttackDef, CreatureDeps, DeityCtx, DeityDef, DeityModel, FloorGraph, HindranceRunnerApi, Place, SkyActor, SkyEffectsApi,
  SkyFloorPlan, SkyHost, SkyRealmSet, TowerKnockApi,
} from '../src/sky/types';

const DT = 0.1;
const SEAT = { x: 0, y: 10, z: 0 };

/** A host with a clock the test moves, a player it can hold, and a spirit it can drain. */
function fakeHost(spirit = 100) {
  const clock = { t: 0 };
  const state = { held: false, spirit };
  const calls = {
    drainSpirit: [] as number[],
    drainAt: [] as number[],
    sendUnderground: [] as { floors: readonly number[] }[],
    refills: 0,
  };
  const body: Body = { x: 6, y: 10, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const host = {
    time: () => clock.t,
    player: () => ({
      body, eye: { x: 0, y: 0, z: 0 }, aim: { x: 1, y: 0, z: 0 }, hand: [], get held() { return state.held; },
      push() {}, slow() {}, hold() {}, carry() {},
    }),
    fork: (...path: (string | number)[]) => new Rng(path.length * 7 + 1),
    fx() {}, cue() {}, toast() {}, gift() {},
    drainSpirit: (n: number) => { calls.drainSpirit.push(n); calls.drainAt.push(clock.t); state.spirit = Math.max(0, state.spirit - n); },
    spirit: () => state.spirit,
    refillSpirit: () => { calls.refills++; state.spirit = 100; },
    sendUnderground: (floors: readonly number[]) => { calls.sendUnderground.push({ floors }); },
  } as unknown as SkyHost;
  return { host, clock, state, calls };
}

/** An attack of stage 0 with a telegraph; `spirit` makes it a drain attack. */
const attack = (id: string, act: (ctx: DeityCtx) => void, spirit?: number): AttackDef => ({
  id, stage: 0, telegraph: { tell: 'tell', pose: 'raise', cue: 'core.gate' },
  ...(spirit === undefined ? {} : { spirit }), act,
});

/** A test deity: 24 hits, 1 s telegraph, 1 s recovery, 1 s rest, sight 10, levitating on its seat. */
function deityDef(attacks: AttackDef[]): DeityDef {
  const model: DeityModel = { body: [], head: [], hw: 0.5, h: 1, progress: () => {} };
  return {
    animal: 'panda', floor: 1, hits: 24, telegraph: 1, recover: 1, rest: [1, 1, 1], sight: 10, hover: 0, teleport: false,
    attacks, ally: { act: 'sit', every: 4, cap: 2 }, knock: 'nudge', won: { toast: null, play: () => {} }, model,
  };
}

interface Rig {
  h: ReturnType<typeof fakeHost>;
  spirit: SpiritLaw;
  creatures: SkyCreatures;
  actor: SkyActor;
}

function rig(attacks: AttackDef[], h = fakeHost()): Rig {
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const runner = { start: () => 1 } as unknown as HindranceRunnerApi;
  const spirit = new SpiritLaw(h.host);
  const deps: CreatureDeps = {
    actors, runner, effects: {} as SkyEffectsApi, puff: new Puff(h.host), knock: {} as TowerKnockApi, spirit,
  };
  const seat: Place = { id: 0, kind: 'seat', x: SEAT.x, y: SEAT.y, z: SEAT.z, w: 3, d: 3, tag: 0 };
  const graph: FloorGraph = { places: [seat], links: [] };
  const plan = {
    index: 1, animal: 'panda', y0: 0, y1: 30, shapes: [], graph, seat, spawns: [], nests: [], route: [], gate: { x: 0, z: 0, r: 2 }, platforms: [],
  } as unknown as SkyFloorPlan;
  const creatures = new SkyCreatures(new THREE.Group(), h.host, deps);
  const actor = creatures.spawnDeity(deityDef(attacks), plan);
  return { h, spirit, creatures, actor };
}

/** One frame, in the realm's order: the gate notes the hold, then the creatures move. The clock stays on tenths. */
function tick(r: Rig, n = 1) {
  for (let i = 0; i < n; i++) {
    r.h.clock.t = Math.round((r.h.clock.t + DT) * 10) / 10;
    r.spirit.update();
    r.creatures.update(DT, 1);
  }
}
function until(r: Rig, pred: () => boolean, max = 2000) {
  let n = 0;
  while (!pred() && n < max) { tick(r); n++; }
  expect(pred(), 'the condition was reached').toBe(true);
}

describe('the spirit gate (SpiritLaw)', () => {
  it('lands a drain and takes the spirit', () => {
    const h = fakeHost();
    const law = new SpiritLaw(h.host);
    expect(law.drain(6)).toBe(true);
    expect(h.calls.drainSpirit).toEqual([6]);
    expect(h.state.spirit).toBe(94);
  });

  it('refuses a second drain within 6 s, and lands one at 6 s', () => {
    const h = fakeHost();
    const law = new SpiritLaw(h.host);
    h.clock.t = 10;
    expect(law.drain(6)).toBe(true);
    h.clock.t = 15.9;
    expect(law.canDrain()).toBe(false);
    expect(law.drain(6)).toBe(false);
    h.clock.t = 10 + DRAIN_GAP;
    expect(law.drain(6)).toBe(true);
    expect(h.calls.drainSpirit).toEqual([6, 6]);
  });

  it('lands no drain while the player is held, nor within 1 s after the hold', () => {
    const h = fakeHost();
    const law = new SpiritLaw(h.host);
    h.clock.t = 20;
    h.state.held = true;
    law.update();
    expect(law.drain(6)).toBe(false);
    h.state.held = false;
    h.clock.t = 20 + DRAIN_CALM - 0.5;
    expect(law.drain(6)).toBe(false);
    h.clock.t = 20 + DRAIN_CALM;
    expect(law.drain(6)).toBe(true);
    expect(h.calls.drainSpirit).toEqual([6]);
  });

  it('at zero spirit calls sendUnderground once, with the floors 0 to 9 (silence excluded)', () => {
    const h = fakeHost(6);
    const law = new SpiritLaw(h.host);
    h.clock.t = 30;
    expect(law.drain(6)).toBe(true);
    expect(h.state.spirit).toBe(0);
    expect(h.calls.sendUnderground).toEqual([{ floors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }]);
    expect(UNDERGROUND_FLOORS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('does not send the player underground while spirit is left', () => {
    const h = fakeHost(100);
    const law = new SpiritLaw(h.host);
    law.drain(6);
    expect(h.calls.sendUnderground).toEqual([]);
  });
});

describe('a deity drains through the gate', () => {
  it('lands one drain per attack run, however often its act drains', () => {
    let acts = 0;
    const r = rig([attack('d', ctx => { acts++; ctx.drain(6); ctx.drain(6); }, 6)]);
    until(r, () => acts >= 1);
    tick(r, 3);
    expect(r.h.calls.drainSpirit).toEqual([6]);
    expect(r.h.state.spirit).toBe(94);
  });

  it('two landed drains are at least 6 s apart, and the deity waits for the window', () => {
    let drainActs = 0;
    const r = rig([attack('d', ctx => { drainActs++; ctx.drain(6); }, 6), attack('p', () => {})]);
    until(r, () => r.h.calls.drainAt.length >= 3);
    const at = r.h.calls.drainAt;
    for (let i = 1; i < at.length; i++) expect(at[i] - at[i - 1]).toBeGreaterThanOrEqual(DRAIN_GAP - 1e-9);
    expect(drainActs).toBeGreaterThanOrEqual(at.length);
  });

  it('lands no drain while held at the act, and the attack still runs', () => {
    let acts = 0;
    const r = rig([attack('d', ctx => { acts++; ctx.drain(6); }, 6)]);
    until(r, () => r.actor.state === 'Attacking');
    r.h.state.held = true;
    until(r, () => acts >= 1);
    expect(r.h.calls.drainSpirit).toEqual([]);
    expect(r.h.state.spirit).toBe(100);
  });

  it('lands no drain within 1 s after a hold ends', () => {
    let acts = 0;
    const r = rig([attack('d', ctx => { acts++; ctx.drain(6); }, 6)]);
    until(r, () => r.actor.state === 'Attacking');
    r.h.state.held = true;
    tick(r, 2);
    r.h.state.held = false;
    until(r, () => acts >= 1);
    expect(r.h.calls.drainSpirit).toEqual([]);
  });

  it('chooses no drain attack while the window is closed, and one once it opens', () => {
    let drainActs = 0;
    let plainActs = 0;
    const r = rig([
      attack('d', ctx => { drainActs++; ctx.drain(6); }, 6),
      attack('p', () => { plainActs++; }),
    ]);
    r.h.state.held = true;
    tick(r, 300);
    expect(drainActs).toBe(0);
    expect(plainActs).toBeGreaterThan(0);
    r.h.state.held = false;
    until(r, () => drainActs >= 1);
    tick(r, 3);
    expect(r.h.calls.drainSpirit).toEqual([6]);
  });

  it('at zero the deity sends the player underground through the gate', () => {
    const r = rig([attack('d', ctx => ctx.drain(6), 6)], fakeHost(6));
    until(r, () => r.h.calls.sendUnderground.length > 0);
    expect(r.h.calls.sendUnderground).toEqual([{ floors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }]);
  });
});

describe('a won deity refills spirit', () => {
  it('SkyRealm refills spirit when a deity is won, and not before', () => {
    const h = fakeHost(40);
    const actors = new ActorRegistry();
    actors.setRealm('sky');
    const host = { ...h.host, actors: () => actors, debris: () => ({ spawn: () => 0, max: 0 }) } as unknown as SkyHost;
    const realm = SkyRealm.create(host, new THREE.Group(), layout => ({ kind: 'sky', world: new SkyWorld(layout) } as unknown as SkyRealmSet));
    // a test deity on floor 1, touched warm and positive until it is won
    const floor = realm.plans.floors[0];
    const actor = realm.creatures.spawnDeity(deityDef([attack('a', () => {})]), floor);
    realm.creatures.update(DT, 1);
    const p = { x: actor.body.x, y: actor.body.y + 0.5, z: actor.body.z };
    for (let i = 0; i < 23; i++) realm.creatures.touch(actor.id, 'positive', true, p, 'intent');
    expect(h.calls.refills).toBe(0);
    realm.creatures.touch(actor.id, 'positive', true, p, 'intent');
    expect(actor.state).toBe('Won');
    expect(h.calls.refills).toBe(1);
    expect(h.state.spirit).toBe(100);
  });
});
