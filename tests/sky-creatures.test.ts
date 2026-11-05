// The sky's creatures, headless (docs/architecture/SKY.md §5.2, §5.3, §5.6, §5.7): the deity machine on a test
// deity, positive and negative touches, stages, levitation, teleport far, won, parking, the touch provider and
// the floor graph's helpers. Attacks here are test attacks: the real ones come with each animal (B1–B5).

import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { Polarity } from '../src/combat/polarity';
import { ActorRegistry } from '../src/entities/actors';
import { Rng } from '../src/core/rng';
import type { Body } from '../src/physics/voxel-collide';
import { BOB, DRIFT_RADIUS, MIN_TELEGRAPH, TELEPORT_MIN, aimOf, reachOf, stageOf } from '../src/sky/creatures/deity';
import { DEITIES } from '../src/sky/creatures/deities';
import { Puff } from '../src/sky/creatures/puff';
import { SkyCreatures } from '../src/sky/creatures/system';
import { linksOf, nearest, placeById, route } from '../src/sky/floors/graph';
import { SkyRealm } from '../src/sky/sky-realm';
import { SkyWorld } from '../src/sky/world/sky-world';
import type {
  AttackDef, CreatureDeps, CustomState, DeityCtx, DeityDef, DeityModel, FloorGraph, HindranceRunnerApi, Link, Place,
  SkyActor, SkyEffectsApi, SkyFloorPlan, SkyHost, SkyRealmSet, Stage, TowerKnockApi,
} from '../src/sky/types';

const DT = 0.1;
const SEAT = { x: 0, y: 10, z: 0 };
const WIND = { from: { x: 0, y: 10, z: 0 }, to: { x: 1, y: 10, z: 0 }, radius: 2, strength: 1, seconds: 1 };

/** A host with the player standing at (6, 10, 0) and every call the creatures make, logged. */
function fakeHost() {
  const log = { fx: [] as string[], cues: [] as string[], toasts: [] as string[], gifts: [] as string[] };
  const player: Body = { x: 6, y: 10, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const host = {
    time: () => 0,
    player: () => ({ body: player, eye: { x: 0, y: 0, z: 0 }, aim: { x: 1, y: 0, z: 0 }, hand: [], push() {}, slow() {}, hold() {}, carry() {} }),
    fork: (...path: (string | number)[]) => new Rng(path.length * 7 + 1),
    fx: (k: string) => { log.fx.push(k); },
    cue: (k: string) => { log.cues.push(k); },
    toast: (k: string) => { log.toasts.push(k); },
    gift: (id: string) => { log.gifts.push(id); },
  } as unknown as SkyHost;
  return { host, player, log };
}

const attack = (id: string, stage: Stage, act: (ctx: DeityCtx) => void = () => {}): AttackDef =>
  ({ id, stage, telegraph: { tell: 'tell', pose: 'raise', cue: 'core.gate' }, act });

/** A test deity: 24 hits, 1 s telegraph, 1 s recovery, 1 s rest, sight 10, levitating on its seat. */
function deityDef(over: Partial<DeityDef> = {}): DeityDef {
  const model: DeityModel = { body: [], head: [], hw: 0.5, h: 1, progress: () => {} };
  return {
    animal: 'panda', floor: 1, hits: 24, telegraph: 1, recover: 1, rest: [1, 1, 1], sight: 10, hover: 0, teleport: false,
    attacks: [attack('a', 0), attack('b', 0)], ally: { act: 'sit', every: 4, cap: 2 }, knock: 'nudge',
    won: { toast: null, play: () => {} }, model,
    ...over,
  };
}

interface Rig {
  host: SkyHost;
  player: Body;
  log: ReturnType<typeof fakeHost>['log'];
  actors: ActorRegistry;
  runnerCalls: { telegraph: number; source: number }[];
  root: THREE.Group;
  plan: SkyFloorPlan;
  creatures: SkyCreatures;
  actor: SkyActor;
}

function rig(over: Partial<DeityDef> = {}, places: Place[] = []): Rig {
  const h = fakeHost();
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const runnerCalls: { telegraph: number; source: number }[] = [];
  const runner = {
    start: (_h: unknown, _p: unknown, telegraph: number, source: number) => { runnerCalls.push({ telegraph, source }); return runnerCalls.length; },
  } as unknown as HindranceRunnerApi;
  const deps: CreatureDeps = {
    actors, runner, effects: {} as SkyEffectsApi, puff: new Puff(h.host), knock: {} as TowerKnockApi,
  };
  const seat: Place = { id: 0, kind: 'seat', x: SEAT.x, y: SEAT.y, z: SEAT.z, w: 3, d: 3, tag: 0 };
  const graph: FloorGraph = { places: [seat, ...places], links: [] };
  const plan = {
    index: 1, animal: 'panda', y0: 0, y1: 30, shapes: [], graph, seat, spawns: [], nests: [], route: [], gate: { x: 0, z: 0, r: 2 }, platforms: [],
  } as unknown as SkyFloorPlan;
  const root = new THREE.Group();
  const creatures = new SkyCreatures(root, h.host, deps);
  const actor = creatures.spawnDeity(deityDef(over), plan);
  return { host: h.host, player: h.player, log: h.log, actors, runnerCalls, root, plan, creatures, actor };
}

/** Advances the creatures of floor 1 by `n` steps. */
function step(r: Rig, n = 1) {
  for (let i = 0; i < n; i++) r.creatures.update(DT, 1);
}
/** Steps until `pred` holds; returns the steps taken. */
function until(r: Rig, pred: () => boolean, max = 300): number {
  let n = 0;
  while (!pred() && n < max) { step(r); n++; }
  return n;
}
/** Positive (warm) touches on the deity's body, or other touches. */
function touch(r: Rig, n: number, polarity: Polarity = 'positive', warm = true) {
  for (let i = 0; i < n; i++) r.creatures.touch(r.actor.id, polarity, warm, { x: 0.5, y: 11, z: 0.5 }, 'intent');
}
function marks(r: Rig): number {
  let count = -1;
  r.root.traverse(o => { const m = o as THREE.InstancedMesh; if (m.isInstancedMesh) count = m.count; });
  return count;
}

describe('the deity machine', () => {
  it('watches a player in sight, attacks after its rest, recovers, and watches again', () => {
    const acts: string[] = [];
    const r = rig({ attacks: [attack('a', 0, () => { acts.push('a'); })] });
    expect(r.actor.state).toBe('Idle');
    step(r);
    expect(r.actor.state).toBe('Watching');
    until(r, () => r.actor.state === 'Attacking');
    until(r, () => r.actor.state === 'Recovering');
    expect(acts).toEqual(['a']);
    until(r, () => r.actor.state === 'Watching');
    expect(acts).toEqual(['a']);
  });

  it('shows a telegraph for its full length, a hit only overlays Hurt, and the attack acts once', () => {
    const acts: string[] = [];
    const r = rig({ attacks: [attack('a', 0, ctx => { acts.push('a'); ctx.hinder('wind', WIND); })] });
    until(r, () => r.actor.state === 'Attacking');
    step(r, 3);
    touch(r, 1);
    expect(r.actor.state).toBe('Hurt');
    step(r, 2);
    expect(r.actor.state).toBe('Hurt');
    step(r, 3);
    expect(r.actor.state).toBe('Attacking');
    expect(acts).toEqual([]);
    until(r, () => acts.length > 0);
    expect(acts).toEqual(['a']);
    until(r, () => r.actor.state === 'Recovering');
    expect(acts).toEqual(['a']);
    // the hindrance's own telegraph is the runner's: never shorter than MIN_TELEGRAPH (law 3.6)
    expect(r.runnerCalls).toEqual([{ telegraph: MIN_TELEGRAPH, source: r.actor.id }]);
  });

  it('never repeats an attack back to back, and uses only the attacks of its stage', () => {
    const seq: string[] = [];
    const r = rig({
      rest: [0.1, 0.1, 0.1],
      attacks: [attack('a', 0, () => { seq.push('a'); }), attack('b', 0, () => { seq.push('b'); }), attack('c', 2, () => { seq.push('c'); })],
    });
    step(r, 300);
    expect(seq.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
    expect(seq).not.toContain('c');
  });

  it('a rule adds to the rest before the next attack', () => {
    const r = rig({ rules: [{ id: 'rest', delay: () => 2 }], attacks: [attack('a', 0)] });
    step(r);
    const n = until(r, () => r.actor.state === 'Attacking');
    expect(n * DT).toBeGreaterThan(2.8);
  });

  it('a custom state that replaces Idle runs only once', () => {
    const asleep: CustomState = { name: 'Asleep', replaces: 'Idle', once: true, next: () => 'Idle' };
    const r = rig({ states: [asleep] });
    expect(r.actor.state).toBe('Asleep');
    step(r);
    expect(r.actor.state).toBe('Idle');
    step(r);
    expect(r.actor.state).toBe('Watching');
  });

  it('a rule scales an attack’s reach through the context helper', () => {
    const scales: number[] = [];
    const roar = attack('a', 0, ctx => { scales.push(reachOf(ctx, roar)); expect(aimOf(ctx)).toBeNull(); });
    const r = rig({ rules: [{ id: 'roar', scale: () => 0.5 }], attacks: [roar] });
    until(r, () => scales.length > 0);
    expect(scales).toEqual([0.5]);
  });

  it('the attack context sees the minions of its floor, and only those', () => {
    const seen: number[] = [];
    const r = rig({ attacks: [attack('a', 0, ctx => { seen.push(ctx.minions.length); })] });
    const minion = { id: 999, kind: 'sky', def: 'panda', role: 'minion', animal: 'panda', faction: 'neutral', hp: 1, tags: new Set(), room: -1, alive: true, spawning: 0, body: { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1, onGround: true }, side: 'wild', state: 'Idle', t: 0, hits: 0, parked: false } as unknown as SkyActor;
    r.actors.register(minion, 'sky');
    until(r, () => seen.length > 0);
    expect(seen).toEqual([1]);
  });
});

describe('stages and positive hits', () => {
  it('a third and two thirds of the target are the stages', () => {
    expect([stageOf(0, 24), stageOf(7, 24), stageOf(8, 24), stageOf(15, 24), stageOf(16, 24), stageOf(48, 48)]).toEqual([0, 0, 1, 1, 2, 2]);
  });

  it('a stage change rallies at once from Watching', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    touch(r, 7);
    step(r, 4);
    expect(r.actor.state).toBe('Watching');
    touch(r, 1);
    expect(r.actor.hits).toBe(8);
    step(r, 4);
    expect(r.actor.state).toBe('Rallying');
    step(r, 25);
    expect(r.actor.state).toBe('Watching');
  });

  it('a stage change during a telegraph waits for the attack to recover, then rallies', () => {
    const r = rig({ rest: [0, 0, 0], attacks: [attack('a', 0)] });
    until(r, () => r.actor.state === 'Attacking');
    touch(r, 8);
    until(r, () => ['Rallying', 'Watching'].includes(r.actor.state));
    expect(r.actor.state).toBe('Rallying');
  });

  it('a warm positive hit counts, leaves a gold mark each time, and plays the gold tick', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    touch(r, 3);
    expect(r.actor.hits).toBe(3);
    expect(r.log.fx.filter(k => k === 'gold')).toHaveLength(3);
    expect(r.log.cues.filter(k => k === 'core.gold')).toHaveLength(3);
    expect(marks(r)).toBe(3);
  });

  it('a beam’s cold repeat ticks add nothing: no hit, no mark, no puff', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    touch(r, 5, 'positive', false);
    expect(r.actor.hits).toBe(0);
    expect(r.log.fx).toEqual([]);
    expect(marks(r)).toBe(0);
  });

  it('a guarded deity takes no hit and only puffs', () => {
    const r = rig({ guard: () => true, rest: [100, 100, 100] });
    step(r);
    touch(r, 3);
    expect(r.actor.hits).toBe(0);
    expect(r.log.fx.filter(k => k === 'puff')).toHaveLength(3);
  });

  it('a rule can make a hit worth more', () => {
    const r = rig({ rules: [{ id: 'gentle', worth: () => 2 }], rest: [100, 100, 100] });
    step(r);
    touch(r, 4);
    expect(r.actor.hits).toBe(8);
  });

  it('the marks never exceed the target', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    touch(r, 30);
    expect(marks(r)).toBe(24);
  });
});

describe('negative touches (law 3.3)', () => {
  it('change nothing and puff once each; the first puff of a run shows the toast once', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    const before = { hits: r.actor.hits, state: r.actor.state, side: r.actor.side, faction: r.actor.faction, hp: r.actor.hp };
    touch(r, 3, 'negative');
    expect(r.log.fx.filter(k => k === 'puff')).toHaveLength(3);
    expect(r.log.cues.filter(k => k === 'core.puff')).toHaveLength(3);
    expect(r.log.toasts).toEqual(['toast.skyPuff']);
    expect({ hits: r.actor.hits, state: r.actor.state, side: r.actor.side, faction: r.actor.faction, hp: r.actor.hp }).toEqual(before);
    expect(r.actor.faction).toBe('neutral');
  });
});

describe('won', () => {
  it('an ally, its outcome plays once, its gift is given, onWon fires once, and nothing sets it dead', () => {
    const play = vi.fn();
    const r = rig({ won: { toast: null, play, gift: 'triple-jump' } });
    const onWon = vi.fn();
    r.creatures.onWon = onWon;
    step(r);
    touch(r, 24);
    expect(r.actor.hits).toBe(24);
    expect(r.actor.side).toBe('ally');
    expect(r.actor.faction).toBe('self');
    expect(r.actor.state).toBe('Won');
    expect(play).toHaveBeenCalledTimes(1);
    expect(r.log.gifts).toEqual(['triple-jump']);
    expect(onWon).toHaveBeenCalledTimes(1);
    expect(onWon.mock.calls[0][0]).toBe(r.actor);
    expect(onWon.mock.calls[0][1]).toBe(1);
    touch(r, 5);
    touch(r, 2, 'negative');
    step(r, 30);
    expect(r.actor.hits).toBe(24);
    expect(r.actor.state).toBe('Won');
    expect(play).toHaveBeenCalledTimes(1);
    expect(onWon).toHaveBeenCalledTimes(1);
    expect(r.actor.alive).toBe(true);
    expect(r.actor.hp).toBe(1);
  });

  it('a toast of the outcome shows once', () => {
    const r = rig({ won: { toast: 'toast.newRun', play: () => {} } });
    step(r);
    touch(r, 24);
    expect(r.log.toasts).toEqual(['toast.newRun']);
  });
});

describe('levitation', () => {
  it('bobs over its seat without gravity', () => {
    const r = rig({ hover: 1.5 });
    const ys: number[] = [];
    for (let i = 0; i < 40; i++) { step(r); ys.push(r.actor.body.y); }
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(SEAT.y + 1.5 - 0.15 - 1e-9);
    expect(Math.max(...ys)).toBeLessThanOrEqual(SEAT.y + 1.5 + 0.15 + 1e-9);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.1);
    expect(r.actor.body.vy).toBe(0);
  });

});

describe('teleport far (provisional, koala and horse)', () => {
  const far: Place = { id: 1, kind: 'ledge', x: 30, y: 10, z: 0, w: 2, d: 2, tag: 0 };
  const near: Place = { id: 2, kind: 'ledge', x: 2, y: 10, z: 0, w: 2, d: 2, tag: 0 };

  it('warns for one telegraph, then lands on the plan’s place farthest from the player', () => {
    const r = rig({ teleport: true, rest: [0, 0, 0], attacks: [attack('t', 0, ctx => ctx.go('Teleporting'))] }, [far, near]);
    until(r, () => r.actor.state === 'Teleporting');
    until(r, () => r.actor.body.x > 20);
    const d = Math.hypot(r.actor.body.x - r.player.x, r.actor.body.z - r.player.z);
    expect(d).toBeGreaterThanOrEqual(TELEPORT_MIN);
    expect(r.actor.body.x).toBeGreaterThan(29);
  });

  it('never lands within the teleport distance: with only a near place it stays put', () => {
    const r = rig({ teleport: true, rest: [0, 0, 0], attacks: [attack('t', 0, ctx => ctx.go('Teleporting'))] }, [near]);
    until(r, () => r.actor.state === 'Teleporting');
    until(r, () => r.actor.state === 'Watching');
    expect(Math.abs(r.actor.body.x - 0.5)).toBeLessThan(1.2);
  });

  it('a deity that cannot teleport ignores the call', () => {
    const r = rig({ teleport: false, rest: [0, 0, 0], attacks: [attack('t', 0, ctx => ctx.go('Teleporting'))] }, [far]);
    until(r, () => r.actor.state === 'Recovering');
    expect(r.actor.body.x).toBeLessThan(2);
  });
});

describe('parking and the touch provider (SKY.md §5.2, §5.7)', () => {
  it('a creature of another floor is parked: hidden, not targeted, not updated', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    expect(r.creatures.targets()).toHaveLength(1);
    r.creatures.update(DT, 2);
    expect(r.actor.parked).toBe(true);
    expect(r.creatures.targets()).toEqual([]);
    expect(r.creatures.at(0.5, 11, 0.5, 1)).toBe(-1);
    r.creatures.update(DT, 1);
    expect(r.actor.parked).toBe(false);
    expect(r.creatures.targets()).toHaveLength(1);
  });

  it('at() finds the creature a point is inside, grown by the reach', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    expect(r.creatures.owns(r.actor.id)).toBe(true);
    expect(r.creatures.owns(12345)).toBe(false);
    // the body drifts about its seat: points are taken from where it is now
    const b = r.actor.body;
    const mid = b.y + b.h / 2;
    expect(r.creatures.at(b.x, mid, b.z, 0)).toBe(r.actor.id);
    expect(r.creatures.at(b.x + 3, mid, b.z, 0)).toBe(-1);
    expect(r.creatures.at(b.x + 3, mid, b.z, 5)).toBe(r.actor.id);
    expect(r.creatures.at(b.x, 30, b.z, 1)).toBe(-1);
  });

  it('a touch on a creature it does not own does nothing', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    r.creatures.touch(999, 'positive', true, { x: 0, y: 0, z: 0 }, 'intent');
    expect(r.actor.hits).toBe(0);
    expect(r.log.fx).toEqual([]);
  });

  it('dispose removes the deity from the registry and the touch provider', () => {
    const r = rig({ rest: [100, 100, 100] });
    r.creatures.dispose();
    expect(r.actors.get(r.actor.id)).toBeUndefined();
    expect([...r.actors.all()].filter(a => a.kind === 'sky')).toEqual([]);
    expect(r.creatures.owns(r.actor.id)).toBe(false);
    expect(r.creatures.all()).toEqual([]);
  });

  it('the deity never gets a health that can reach zero: alive and hp stay as they are under any touch', () => {
    const r = rig({ rest: [100, 100, 100] });
    step(r);
    touch(r, 40, 'negative');
    touch(r, 40);
    expect(r.actor.alive).toBe(true);
    expect(r.actor.hp).toBe(1);
  });
});

describe('the floor graph (SKY.md §5.6)', () => {
  const place = (id: number, kind: Place['kind'], x: number, y: number): Place =>
    ({ id, kind, x, y, z: 0, w: 1, d: 1, tag: 0 });
  const links: Link[] = [{ a: 0, b: 1, move: 'jump' }, { a: 1, b: 2, move: 'walk' }, { a: 2, b: 3, move: 'drop' }];
  const g: FloorGraph = { places: [place(0, 'ground', 0, 0), place(1, 'ledge', 4, 4), place(2, 'top', 8, 8), place(3, 'nest', 9, 2)], links };

  it('finds a place by id, and the links of a place', () => {
    expect(placeById(g, 2)?.kind).toBe('top');
    expect(placeById(g, 9)).toBeNull();
    expect(linksOf(g, 1).map(l => l.move)).toEqual(['jump', 'walk']);
    expect(linksOf(g, 9)).toEqual([]);
  });

  it('the nearest place, of the kinds asked for', () => {
    expect(nearest(g, 8.5, 8.5, 0.5)?.id).toBe(2);
    expect(nearest(g, 8.5, 8.5, 0.5, ['nest'])?.id).toBe(3);
    expect(nearest({ places: [], links: [] }, 0, 0, 0)).toBeNull();
  });

  it('a route uses only the moves asked for, the fewest links first', () => {
    expect(route(g, 0, 2, ['jump', 'walk'])).toEqual([0, 1, 2]);
    expect(route(g, 0, 2, ['jump'])).toBeNull();
    expect(route(g, 2, 0, ['jump', 'walk'])).toEqual([2, 1, 0]);
    expect(route(g, 0, 0, ['walk'])).toEqual([0]);
    expect(route(g, 0, 9, ['jump', 'walk'])).toBeNull();
    expect(route(g, 3, 0, ['drop', 'jump', 'walk'])).toEqual([3, 2, 1, 0]);
  });
});

/** A sky realm headless: a real layout and world, the player well away, and the host calls the realm makes as no-ops. */
function newRealm(seed = 1): SkyRealm {
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const noop = () => {};
  const player: Body = { x: 6, y: 10, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const host = {
    time: () => 0,
    player: () => ({ body: player, eye: { x: 0, y: 0, z: 0 }, aim: { x: 1, y: 0, z: 0 }, hand: [], push: noop, slow: noop, hold: noop, carry: noop }),
    actors: () => actors,
    debris: () => ({ spawn: () => 0, max: 0 }),
    fork: (...path: (string | number)[]) => new Rng(path.length * 7 + seed),
    fx: noop, cue: noop, toast: noop, card: noop, bar: noop, place: noop, gift: noop, travel: noop,
    drainSpirit: noop, spirit: () => 100, takeRandomPractice: () => null, sendUnderground: noop,
  } as unknown as SkyHost;
  return SkyRealm.create(host, new THREE.Group(), layout => ({ kind: 'sky', world: new SkyWorld(layout) } as unknown as SkyRealmSet));
}

describe('the five deities of the sky (SKY.md §5.3)', () => {
  it('a new sky holds exactly five deities, one per floor, each on its floor plan’s seat', () => {
    const realm = newRealm();
    const all = realm.creatures.all();
    expect(all.map(a => a.animal)).toEqual(realm.plans.floors.map(f => f.animal));
    expect(new Set(all.map(a => a.id)).size).toBe(5);
    realm.plans.floors.forEach((f, i) => {
      const a = all[i];
      expect(a.role).toBe('deity');
      // a deity drifts round its seat (DRIFT_RADIUS) and bobs over it (BOB); the seat is its home
      expect(Math.hypot(a.body.x - (f.seat.x + 0.5), a.body.z - (f.seat.z + 0.5))).toBeLessThanOrEqual(DRIFT_RADIUS + 1e-9);
      expect(Math.abs(a.body.y - (f.seat.y + (DEITIES[f.animal].hover ?? 0)))).toBeLessThanOrEqual(BOB + 1e-9);
      expect(a.body.hw).toBeGreaterThan(0);
      expect(a.body.h).toBeGreaterThan(0);
    });
  });

  it('two sky realms from the same seed hold the same deities, with the same ids and bodies', () => {
    const summary = (realm: SkyRealm) => realm.creatures.all().map(a => [a.id, a.animal, a.body.x, a.body.y, a.body.z]);
    expect(summary(newRealm(7))).toEqual(summary(newRealm(7)));
  });

  it('every deity starts parked, and only the player’s floor’s deity is unparked', () => {
    const realm = newRealm();
    expect(realm.creatures.all().every(a => a.parked)).toBe(true);
    realm.creatures.update(DT, 3);
    expect(realm.creatures.all().map(a => a.parked)).toEqual([true, true, false, true, true]);
    realm.creatures.update(DT, 1);
    expect(realm.creatures.all().map(a => a.parked)).toEqual([false, true, true, true, true]);
  });

  it('a won deity stays won after leave() and the next update, and is never respawned', () => {
    const realm = newRealm();
    realm.creatures.update(DT, 1);
    const [a] = realm.creatures.all();
    const ids = realm.creatures.all().map(x => x.id);
    const p = { x: a.body.x, y: a.body.y + 0.5, z: a.body.z };
    for (let i = 0; i < 24; i++) realm.creatures.touch(a.id, 'positive', true, p, 'intent');
    expect([a.state, a.side]).toEqual(['Won', 'ally']);
    realm.leave();
    realm.creatures.update(DT, 1);
    expect([a.state, a.side]).toEqual(['Won', 'ally']);
    realm.creatures.update(DT, 4);
    expect([a.state, a.side]).toEqual(['Won', 'ally']);
    expect(realm.creatures.all().map(x => x.id)).toEqual(ids);
  });
});

describe('the puff (law 3.3)', () => {
  it('shows the first puff toast once, and reports it as shown', () => {
    const h = fakeHost();
    const puff = new Puff(h.host);
    expect(puff.shown).toBe(false);
    puff.at({ x: 1, y: 1, z: 1 });
    puff.at({ x: 1, y: 1, z: 1 });
    expect(puff.shown).toBe(true);
    expect(h.log.toasts).toEqual(['toast.skyPuff']);
    expect(h.log.fx).toEqual(['puff', 'puff']);
  });
});
