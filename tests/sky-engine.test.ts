// The sky's creature engine and the six hindrances of H1–H3, headless (docs/architecture/SKY.md §5.3, §5.4, §6).
// Gaits: each moves only where it applies and reaches its place deterministically under a fixed dt. The tower
// knock: nothing before its full warning, then placed cells only, loose cubes and a push off. Minions: the spawn
// warning, rules in order, turning by warm positive hits only, the puff, the stuck guard, ally help with its cap,
// the attitude change when the deity is won, the spawner's counts. Hindrances: no effect before the full
// telegraph, never a placed or protected cell, the positive answer, no damage, and everything they create is gone
// when they end.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { Hazards, type HazardHost } from '../src/enemies/attacks';
import { ActorRegistry, type Actor } from '../src/entities/actors';
import { EL_WATER, SOURCE, elemByte } from '../src/content/elements';
import { AIR, MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { HINDRANCES } from '../src/sky/hindrances';
import { SkyEffects } from '../src/sky/hindrances/effects';
import { HindranceRunner } from '../src/sky/hindrances/runner';
import { CAGE_MAT, cageCells } from '../src/sky/hindrances/cube-cage';
import { HOLD, cellsOfTags } from '../src/sky/hindrances/fading-platforms';
import { STOP } from '../src/sky/hindrances/water-currents';
import { SHORT } from '../src/sky/hindrances/paralysis';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';
import { Puff } from '../src/sky/creatures/puff';
import { SkyCreatures } from '../src/sky/creatures/system';
import { TowerKnock, KNOCK_WARNING } from '../src/sky/creatures/knock';
import {
  ALLY, ASLEEP, CALM, FADE, FADING, Minion, MinionSpawner, REACTING, RETURNING, SPAWNING, STUCK, WILD, helpedHits,
} from '../src/sky/creatures/minion';
import {
  POUNCE_TIME, climbFace, compose, file, gallopLoop, hangUnder, pounce, roll, stalk, walk,
} from '../src/sky/creatures/gaits';
import {
  ExceptionKind, TELEGRAPH, type Channel, type CreatureDeps, type DeityApi, type Gait, type MinionCtx, type MinionDef,
  type Place, type Shape, type SkyActor, type SkyFloorPlan, type SkyHost, type Vec3,
} from '../src/sky/types';
import type { Body } from '../src/physics/voxel-collide';

const { stone } = MAT;
const DT = 1 / 30;
/** A slab of stone from x 0 to 40 and z 0 to 40, two deep: its top is y 2, where everyone stands. */
const FLOOR: Shape = { k: 'box', x0: 0, y0: 0, z0: 0, x1: 40, y1: 1, z1: 40, m: stone };

const worldOf = (...more: Shape[]) => new SkyWorld(buildIndex([FLOOR, ...more]));

/** A player at (x, 2, z) and a host that records what it is asked. */
function rig(world: SkyWorld, x = 20, z = 20) {
  let now = 0;
  const body: Body = { x, y: 2, z, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const pushes: number[][] = [], slows: number[][] = [], holds: number[] = [];
  const bad = new Set<string>();
  const fx: string[] = [];
  const spawned: number[][] = [];
  const player = {
    body, eye: { x, y: 3.6, z }, aim: { x: 0, y: 0, z: 1 }, hand: [], held: false,
    push: (vx: number, vy: number, vz: number) => { pushes.push([vx, vy, vz]); },
    slow: (f: number, s: number) => { slows.push([f, s]); },
    hold: (s: number) => { holds.push(s); },
    carry: () => {},
  };
  const actor = { id: 1, kind: 'sky', alive: true, spawning: 0, faction: 'self', body } as unknown as Actor;
  const hazardHost: HazardHost = {
    actors: () => [actor],
    hurt: (() => bad.add('hazard.hurt')) as unknown as HazardHost['hurt'],
    affect: (() => bad.add('hazard.affect')) as unknown as HazardHost['affect'],
    push: (() => bad.add('hazard.push')) as unknown as HazardHost['push'],
    live: () => {},
    particles: () => {},
  };
  const hazards = new Hazards(new THREE.Group(), hazardHost);
  const actors = new ActorRegistry();
  actors.setRealm('sky');
  const debris = { spawn: (m: number, x: number, y: number, z: number) => { spawned.push([m, x, y, z]); return spawned.length - 1; } };
  const host = {
    time: () => now,
    player: () => player,
    actors: () => actors,
    world: () => world,
    debris: () => debris,
    hazards: () => hazards,
    fork: (...path: (string | number)[]) => new Rng(path.length + 7),
    fx: (k: string) => { fx.push(k); }, cue: () => {}, toast: () => {}, card: () => {}, bar: () => {}, place: () => {}, gift: () => {},
    travel: () => bad.add('travel'), drainSpirit: () => bad.add('drainSpirit'), spirit: () => 100,
    takeRandomPractice: () => { bad.add('takeRandomPractice'); return null; }, sendUnderground: () => { bad.add('sendUnderground'); return true; },
    refillSpirit: () => {}, enterUnity: () => {},
  } as unknown as SkyHost;
  const effects = new SkyEffects(host);
  const runner = new HindranceRunner({ host, effects, hazards, time: () => now });
  const frame = (dt = 0.05) => { runner.update(dt); hazards.update(dt); now += dt; world.expire(now); };
  const run = (seconds: number, dt = 0.05) => { for (let t = 0; t < seconds - 1e-9; t += dt) frame(dt); };
  return { world, body, player, host, hazards, effects, runner, frame, run, pushes, slows, holds, bad, fx, actors, spawned };
}

const HIT = (x: number, y: number, z: number, cell = -1) => ({ x, y, z, cell, actor: -1, weapon: 'intent' as const, warm: true });
const place = (id: number, x: number, z: number, y = 2, kind: Place['kind'] = 'ground'): Place => ({ id, kind, x, y, z, w: 1, d: 1, tag: 0 });

// ───────────────────────── gaits ─────────────────────────

function minionAt(x: number, y: number, z: number, h = 0.9, id = 50): SkyActor {
  return {
    id, kind: 'sky', def: 'panda', role: 'minion', animal: 'panda', faction: 'neutral', hp: 1,
    body: { x, y, z, vx: 0, vy: 0, vz: 0, hw: 0.3, h, onGround: true },
    tags: new Set(), room: -1, alive: true, spawning: 0, side: 'wild', state: WILD, t: 0, hits: 0, parked: false,
  };
}

/** Steps a gait until it arrives; returns the seconds taken (Infinity when it never does). */
function walkTo(g: Gait, m: SkyActor, ctx: MinionCtx, to: Place, max = 20): number {
  for (let t = 0; t < max; t += DT) if (g.step(m, ctx, to, DT)) return t;
  return Infinity;
}

describe('gaits', () => {
  it('walk reaches a place on flat ground at its speed, the same way every time', () => {
    const r = rig(worldOf());
    const ctx = { host: r.host } as unknown as MinionCtx;
    const a = minionAt(5.5, 2, 20.5), b = minionAt(5.5, 2, 20.5, 0.9, 51);
    const ta = walkTo(walk(2), a, ctx, place(1, 11, 20));
    const tb = walkTo(walk(2), b, ctx, place(1, 11, 20));
    expect(ta).toBeGreaterThan(2.5);
    expect(ta).toBeLessThan(3.5);
    expect(tb).toBe(ta);
    expect([a.body.x, a.body.y, a.body.z]).toEqual([b.body.x, b.body.y, b.body.z]);
  });

  it('walk steps up one block', () => {
    const r = rig(worldOf({ k: 'box', x0: 10, y0: 2, z0: 0, x1: 14, y1: 2, z1: 40, m: stone }));
    const ctx = { host: r.host } as unknown as MinionCtx;
    const m = minionAt(6.5, 2, 20.5);
    expect(walkTo(walk(2), m, ctx, place(1, 12, 20, 3))).toBeLessThan(Infinity);
    expect(m.body.y).toBeCloseTo(3, 3);
  });

  it('climbFace rises a block per its seconds up a wall, then stands on top', () => {
    const r = rig(worldOf({ k: 'box', x0: 10, y0: 2, z0: 0, x1: 14, y1: 4, z1: 40, m: stone }));
    const ctx = { host: r.host } as unknown as MinionCtx;
    const m = minionAt(7.5, 2, 20.5);
    const t = walkTo(compose(climbFace(1.2), walk(2)), m, ctx, place(1, 11, 20, 5));
    expect(t).toBeGreaterThan(3 * 1.2);
    expect(t).toBeLessThan(3 * 1.2 + 3);
    expect(m.body.y).toBeCloseTo(5, 3);
  });

  it('climbFace does not apply on level ground', () => {
    const r = rig(worldOf());
    const m = minionAt(5.5, 2, 20.5);
    expect(climbFace(1)!.step(m, { host: r.host } as unknown as MinionCtx, place(1, 11, 20), DT)).toBe(false);
    expect(m.body.x).toBe(5.5);
  });

  it('hangUnder moves along an underside and refuses where there is none', () => {
    const r = rig(worldOf({ k: 'box', x0: 0, y0: 5, z0: 19, x1: 20, y1: 5, z1: 21, m: stone }));
    const ctx = { host: r.host } as unknown as MinionCtx;
    const m = minionAt(5.5, 4.05, 20.5);
    expect(walkTo(hangUnder(), m, ctx, place(1, 12, 20))).toBeLessThan(Infinity);
    expect(m.body.y + m.body.h).toBeLessThanOrEqual(5);
    const off = minionAt(5.5, 4.05, 30.5);
    expect(hangUnder().step(off, ctx, place(1, 12, 30), DT)).toBe(false);
    expect(off.body.x).toBe(5.5);
  });

  it('roll applies only downhill', () => {
    const r = rig(worldOf({ k: 'box', x0: 0, y0: 2, z0: 0, x1: 8, y1: 3, z1: 40, m: stone }));
    const ctx = { host: r.host } as unknown as MinionCtx;
    const level = minionAt(20.5, 2, 20.5);
    expect(roll(4).step(level, ctx, place(1, 30, 20), DT)).toBe(false);
    expect(level.body.x).toBe(20.5);
    const high = minionAt(5.5, 4, 20.5);
    // it rolls off the slope, then walks the last of it
    expect(walkTo(compose(roll(4), walk(1.5)), high, ctx, place(1, 14, 20))).toBeLessThan(4);
  });

  it('stalk holds still while watched and closes in while unseen', () => {
    const r = rig(worldOf(), 20, 10);
    const ctx = { host: r.host } as unknown as MinionCtx;
    const m = minionAt(20.5, 2, 25.5);
    // the player looks along +z, straight at the stalker
    const g = stalk(0, 3, 0.5);
    expect(g.step(m, ctx, place(1, 20, 12), DT)).toBe(false);
    expect(m.body.z).toBe(25.5);
    r.player.aim.z = -1;
    g.step(m, ctx, place(1, 20, 12), DT);
    expect(m.body.z).toBeLessThan(25.5);
  });

  it('pounce lands on its place in one arc, and does not apply out of reach', () => {
    const r = rig(worldOf());
    const ctx = { host: r.host } as unknown as MinionCtx;
    const m = minionAt(10.5, 2, 20.5);
    let peak = 0;
    let t = 0;
    const g = pounce(6);
    while (!g.step(m, ctx, place(1, 15, 20), DT) && t < 3) { t += DT; peak = Math.max(peak, m.body.y); }
    expect(t).toBeCloseTo(POUNCE_TIME - DT, 1);
    expect(peak).toBeGreaterThan(3);
    expect([m.body.x, m.body.y, m.body.z]).toEqual([15.5, 2, 20.5]);
    const far = minionAt(10.5, 2, 20.5, 0.9, 52);
    expect(pounce(6).step(far, ctx, place(1, 30, 20), DT)).toBe(false);
    expect(far.body.x).toBe(10.5);
  });

  it('file keeps behind its leader; gallopLoop veers away from the player', () => {
    const r = rig(worldOf(), 20, 20);
    const ctx = { host: r.host } as unknown as MinionCtx;
    const lead = minionAt(15.5, 2, 10.5, 0.9, 60), tail = minionAt(5.5, 2, 10.5, 0.9, 61);
    const g = file(() => lead);
    for (let i = 0; i < 300; i++) g.step(tail, ctx, place(1, 15, 10), DT);
    expect(Math.hypot(lead.body.x - tail.body.x, lead.body.z - tail.body.z)).toBeCloseTo(1.5, 0);
    expect(file(() => null).step(tail, ctx, place(1, 15, 10), DT)).toBe(false);
    // a horse aimed through the player passes beside them, never through
    const horse = minionAt(20.5, 2, 5.5);
    const gl = gallopLoop(6, 4);
    let closest = Infinity;
    for (let i = 0; i < 200 && !gl.step(horse, ctx, place(1, 20, 35), DT); i++) closest = Math.min(closest, Math.hypot(horse.body.x - 20, horse.body.z - 20));
    expect(closest).toBeGreaterThan(1);
  });

  it('compose lets the first gait that moves win', () => {
    const r = rig(worldOf());
    const ctx = { host: r.host } as unknown as MinionCtx;
    const used: string[] = [];
    const spy = (id: string, inner: Gait): Gait => ({ id, step: (m, c, to, dt) => { used.push(id); return inner.step(m, c, to, dt); } });
    const m = minionAt(5.5, 2, 20.5);
    compose(spy('roll', roll(4)), spy('walk', walk(2)), spy('never', walk(9)))!.step(m, ctx, place(1, 11, 20), DT);
    expect(used).toEqual(['roll', 'walk']);
  });
});

// ───────────────────────── the tower knock ─────────────────────────

describe('the tower knock', () => {
  it('warns for its full length, then knocks only placed cells into loose cubes and pushes the player off', () => {
    const r = rig(worldOf(), 10.5, 10.5);
    const w = r.world;
    w.placing = true;
    for (let y = 2; y < 6; y++) w.set(10, y, 10, MAT.dirt);
    w.placing = false;
    r.body.y = 6;
    const cells = [5, 4, 3, 2].map(y => w.idx(10, y, 10));
    const knock = new TowerKnock(r.host, r.effects);
    knock.start('sun', { cells, height: 4, at: [10, 6, 10] });
    expect(knock.busy).toBe(true);
    for (let t = 0; t < KNOCK_WARNING - 0.1; t += 0.05) knock.update(0.05);
    expect(cells.every(i => w.getAt(i) === MAT.dirt)).toBe(true);
    expect(r.pushes).toEqual([]);
    knock.update(0.2);
    expect(knock.busy).toBe(false);
    expect(cells.every(i => w.getAt(i) === AIR)).toBe(true);
    expect(r.spawned.length).toBe(4);
    expect(r.spawned.every(s => s[0] === MAT.dirt)).toBe(true);
    expect(r.pushes.length).toBe(1);
    expect(w.get(10, 1, 10)).toBe(stone);
    expect(r.bad.size).toBe(0);
  });
});

// ───────────────────────── minions ─────────────────────────

function minionDef(over: Partial<MinionDef> = {}): MinionDef {
  return {
    animal: 'panda', max: 3, wildMax: 2,
    spawn: { where: 'clumps', warning: 1, every: 2 },
    hitsToTurn: 3, gait: walk(2), rules: [], ally: [],
    model: { parts: [], hw: 0.3, h: 0.9, react: () => {} },
    ...over,
  };
}

function minionRig(places: Place[], def: MinionDef) {
  const r = rig(worldOf(), 30.5, 30.5);
  const deps: CreatureDeps = {
    actors: r.actors, runner: r.runner, effects: r.effects, puff: new Puff(r.host), knock: {} as never,
    spirit: { update() {}, canDrain: () => true, drain: () => true },
  };
  const plan = {
    index: 1, animal: 'panda', y0: 0, y1: 30, shapes: [], graph: { places, links: [] }, seat: places[0], spawns: [places[0]],
    nests: [], route: [], gate: { x: 0, z: 0, r: 2 }, platforms: [],
  } as unknown as SkyFloorPlan;
  const creatures = new SkyCreatures(new THREE.Group(), r.host, deps);
  const actor = creatures.spawnMinion(def, plan, places[0]);
  const step = (n = 1) => { for (let i = 0; i < n; i++) { creatures.update(DT, 1); r.frame(DT); } };
  const secs = (s: number) => step(Math.round(s / DT));
  return { ...r, deps, plan, creatures, actor, step, secs };
}

describe('minions', () => {
  it('show their spawn warning first: not touchable, no rules, then wild', () => {
    let ran = 0;
    const m = minionRig([place(0, 5, 20)], minionDef({ rules: [() => { ran++; return true; }] }));
    expect(m.actor.state).toBe(SPAWNING);
    expect(m.creatures.targets()).toEqual([]);
    m.secs(0.9);
    expect(ran).toBe(0);
    m.secs(0.2);
    expect(m.actor.state).toBe(WILD);
    expect(m.creatures.targets().length).toBe(1);
    m.step();
    expect(ran).toBeGreaterThan(0);
  });

  it('a sleeping cluster spawns asleep', () => {
    const m = minionRig([place(0, 5, 20)], minionDef({ spawn: { where: 'clusters', warning: 0.5, every: 2, asleep: true } }));
    m.secs(0.6);
    expect(m.actor.state).toBe(ASLEEP);
  });

  it('runs its rules in order: the first that acts wins the tick', () => {
    const calls: string[] = [];
    const m = minionRig([place(0, 5, 20)], minionDef({
      rules: [() => { calls.push('a'); return false; }, () => { calls.push('b'); return true; }, () => { calls.push('c'); return true; }],
    }));
    m.secs(1.05);
    calls.length = 0;
    m.step();
    expect(calls).toEqual(['a', 'b']);
  });

  it('turns only by warm positive hits; a negative touch puffs; an ally never turns back', () => {
    const m = minionRig([place(0, 5, 20)], minionDef());
    m.secs(1.05);
    const p = { x: 5.5, y: 2.5, z: 20.5 };
    m.creatures.touch(m.actor.id, 'negative', true, p, 'intent');
    expect(m.actor.hits).toBe(0);
    expect(m.fx).toContain('puff');
    m.creatures.touch(m.actor.id, 'positive', false, p, 'beam');
    expect(m.actor.hits).toBe(0);
    m.creatures.touch(m.actor.id, 'positive', true, p, 'intent');
    expect([m.actor.hits, m.actor.state]).toEqual([1, REACTING]);
    m.creatures.touch(m.actor.id, 'positive', true, p, 'intent');
    m.creatures.touch(m.actor.id, 'positive', true, p, 'intent');
    expect([m.actor.side, m.actor.faction, m.actor.state]).toEqual(['ally', 'self', ALLY]);
    for (let i = 0; i < 5; i++) m.creatures.touch(m.actor.id, 'negative', true, p, 'explosion');
    m.secs(1);
    expect([m.actor.side, m.actor.state, m.actor.alive]).toEqual(['ally', ALLY, true]);
  });

  it('hinders through the runner with the floor telegraph, and withdraws its warning when it turns', () => {
    let once = false;
    const m = minionRig([place(0, 5, 20)], minionDef({
      rules: [(a, ctx) => {
        if (once) return false;
        once = true;
        ctx.hinder('knockback', { from: { x: a.body.x, y: 2, z: a.body.z }, shape: 'ring', radius: 3, strength: 6 });
        return true;
      }],
    }));
    m.secs(1.1);
    const run = m.runner.active()[0];
    expect(run).toMatchObject({ id: 'knockback', source: m.actor.id, phase: 'telegraph' });
    expect(run.left).toBeGreaterThan(TELEGRAPH[0] - 0.2);
    for (let i = 0; i < 3; i++) m.creatures.touch(m.actor.id, 'positive', true, { x: 5.5, y: 2.5, z: 20.5 }, 'intent');
    expect(m.runner.active()).toEqual([]);
    expect(m.pushes).toEqual([]);
  });

  it('the stuck guard walks back to the nearest node, then fades and comes back home with its warning', () => {
    const target = place(2, 30, 30, 12);
    const m = minionRig([place(0, 5, 20), place(1, 28, 28), target], minionDef({ gait: walk(6), rules: [(a, ctx) => { ctx.moveTo(a, target); return true; }] }));
    m.secs(1.05);
    m.secs(STUCK + 0.1);
    expect(m.actor.state).toBe(RETURNING);
    // a target with no way to it but itself: it fades at once
    const lone = minionRig([place(0, 5, 20), target], minionDef({ gait: walk(6), rules: [(a, ctx) => { ctx.moveTo(a, target); return true; }] }));
    lone.secs(1.05 + STUCK + 0.1);
    expect(lone.actor.state).toBe(FADING);
    lone.secs(FADE);
    expect(lone.actor.state).toBe(SPAWNING);
    expect([lone.actor.body.x, lone.actor.body.z]).toEqual([5.5, 20.5]);
    expect(lone.actor.alive).toBe(true);
  });

  it('an ally helps at its deity on the floor timer, up to the floor cap; calm on the horse floor adds none', () => {
    for (const calm of [false, true]) {
      const r = rig(worldOf());
      const deps = { actors: r.actors, runner: r.runner, effects: r.effects, puff: new Puff(r.host) } as unknown as CreatureDeps;
      const plan = { index: 1, graph: { places: [place(0, 5, 20)], links: [] } } as unknown as SkyFloorPlan;
      let touched = 0;
      const deityActor = minionAt(6, 2, 20, 1.8, 90);
      const deity = {
        actor: deityActor, won: false, stage: 0,
        def: { ally: { act: 'sit', every: 1, cap: 2, calm } },
        touch: () => { touched++; }, update() {}, onWon: null,
      } as unknown as DeityApi;
      const a = minionAt(5.5, 2, 20.5);
      a.side = 'ally';
      const mn = new Minion(a, minionDef({ spawn: { where: 'clumps', warning: 0.5, every: 1 }, ally: [{ kind: 'help', rule: () => true }] }), plan, deps, r.host, new Rng(3));
      for (let t = 0; t < 10; t += DT) mn.update(DT, deity, []);
      expect(a.state).toBe(ALLY);
      expect(touched).toBe(calm ? 0 : 2);
      expect(helpedHits(deity)).toBe(calm ? 0 : 2);
    }
  });

  it('a wild minion changes its attitude when its deity is won', () => {
    const r = rig(worldOf());
    const deps = { actors: r.actors, runner: r.runner, effects: r.effects, puff: new Puff(r.host) } as unknown as CreatureDeps;
    const plan = { index: 1, graph: { places: [place(0, 5, 20)], links: [] } } as unknown as SkyFloorPlan;
    const a = minionAt(5.5, 2, 20.5);
    const mn = new Minion(a, minionDef({ rules: [() => true] }), plan, deps, r.host, new Rng(3));
    const deity = { actor: minionAt(6, 2, 20, 1.8, 90), won: true, def: { ally: { every: 1, cap: 1 } }, touch() {} } as unknown as DeityApi;
    for (let t = 0; t < 2; t += DT) mn.update(DT, deity, []);
    expect([a.state, a.side]).toEqual([CALM, 'wild']);
    mn.dispose();
  });

  it('protected cells are released when the minion leaves', () => {
    const r = rig(worldOf());
    const deps = { actors: r.actors, runner: r.runner, effects: r.effects, puff: new Puff(r.host) } as unknown as CreatureDeps;
    const plan = { index: 1, graph: { places: [place(0, 5, 20)], links: [] } } as unknown as SkyFloorPlan;
    const cell = r.world.idx(5, 1, 20);
    const mn = new Minion(minionAt(5.5, 2, 20.5), minionDef(), plan, deps, r.host, new Rng(3));
    mn.ctx.protect([cell], 77);
    expect(r.effects.isProtected(cell)).toBe(true);
    mn.dispose();
    expect(r.effects.isProtected(cell)).toBe(false);
  });

  it('the spawner keeps the floor at its counts, one every `every` seconds, at the plan spawns', () => {
    const r = rig(worldOf());
    const plan = { index: 1, spawns: [place(0, 5, 20), place(1, 8, 20)] } as unknown as SkyFloorPlan;
    const living: SkyActor[] = [];
    const sp = new MinionSpawner(minionDef({ max: 3, wildMax: 2 }), plan, new Rng(4), at => {
      const a = minionAt(at.x + 0.5, at.y, at.z + 0.5, 0.9, 100 + living.length);
      living.push(a);
      return a;
    }, () => living);
    for (let t = 0; t < 1.9; t += 0.1) sp.update(0.1);
    expect(living.length).toBe(0);
    for (let t = 0; t < 20; t += 0.1) sp.update(0.1);
    expect(living.length).toBe(2);
    living[0].side = 'ally';
    for (let t = 0; t < 20; t += 0.1) sp.update(0.1);
    expect(living.length).toBe(3);
    expect(r.bad.size).toBe(0);
  });
});

// ───────────────────────── the six hindrances ─────────────────────────

describe('opening holes', () => {
  const cells = (r: ReturnType<typeof rig>) => [r.world.idx(20, 1, 22), r.world.idx(21, 1, 22), r.world.idx(22, 1, 22)];

  it('cracks first, opens only after the full telegraph, never a placed cell, and every cell returns', () => {
    const r = rig(worldOf());
    const c = cells(r);
    r.world.placing = true;
    r.world.set(22, 1, 22, MAT.dirt);
    r.world.placing = false;
    r.runner.start(HINDRANCES['opening-holes'], { cells: c, seconds: 4 }, 1.2, 1);
    r.run(1.1);
    expect(r.world.damaged.has(c[0])).toBe(true);
    expect(r.world.getAt(c[0])).toBe(stone);
    r.run(0.2);
    expect([r.world.getAt(c[0]), r.world.getAt(c[1])]).toEqual([AIR, AIR]);
    expect(r.world.getAt(c[2])).toBe(MAT.dirt);
    r.run(4.1);
    expect(r.runner.active()).toEqual([]);
    expect([r.world.getAt(c[0]), r.world.getAt(c[1])]).toEqual([stone, stone]);
    expect(c.every(i => r.world.kindAt(i) !== ExceptionKind.Transient)).toBe(true);
    expect(r.world.damaged.size).toBe(0);
    expect(r.bad.size).toBe(0);
  });

  it('a positive shot at a cracked cell closes it before it opens', () => {
    const r = rig(worldOf());
    const c = cells(r);
    r.runner.start(HINDRANCES['opening-holes'], { cells: c, seconds: 4 }, 1, 1);
    r.run(0.3);
    expect(r.runner.positiveHit(HIT(20.5, 1.5, 22.5, c[0]))).toBe(true);
    expect(r.world.damaged.has(c[0])).toBe(false);
    r.run(1);
    expect(r.world.getAt(c[0])).toBe(stone);
    expect(r.world.getAt(c[1])).toBe(AIR);
  });

  it('stopping a run cleans up its cracks and holes', () => {
    const r = rig(worldOf());
    const id = r.runner.start(HINDRANCES['opening-holes'], { cells: cells(r), seconds: 4 }, 1, 1);
    r.run(1.5);
    r.runner.stop(id);
    expect(cells(r).every(i => r.world.getAt(i) === stone)).toBe(true);
    expect(r.world.damaged.size).toBe(0);
  });
});

describe('fading platforms', () => {
  const PLATFORM: Shape = { k: 'box', x0: 10, y0: 6, z0: 10, x1: 12, y1: 6, z1: 12, m: stone, tag: 5 };

  it('turns its tagged platform to mist, then air after the full telegraph, then back; held cells never fade', () => {
    const r = rig(worldOf(PLATFORM));
    const cells = cellsOfTags(r.world, [5]);
    expect(cells.length).toBe(9);
    const held = r.world.idx(11, 6, 11);
    r.effects.protect([held], 99);
    r.runner.start(HINDRANCES['fading-platforms'], { tags: [5], seconds: 3 }, 1.2, 1);
    r.run(1.1);
    expect(r.world.get(10, 6, 10)).toBe(MAT.mist);
    expect(r.world.getAt(held)).toBe(stone);
    r.run(0.2);
    expect(r.world.get(10, 6, 10)).toBe(AIR);
    expect(r.world.getAt(held)).toBe(stone);
    r.run(3);
    expect(r.runner.active()).toEqual([]);
    expect(cells.every(i => r.world.getAt(i) === stone && r.world.kindAt(i) === 0)).toBe(true);
  });

  it('a positive shot during the warning holds the platform two more seconds', () => {
    const r = rig(worldOf(PLATFORM));
    r.runner.start(HINDRANCES['fading-platforms'], { tags: [5], seconds: 3 }, 1, 1);
    r.run(0.5);
    expect(r.runner.positiveHit(HIT(10.5, 6.5, 10.5))).toBe(true);
    r.run(0.5 + HOLD - 0.1);
    expect(r.world.get(10, 6, 10)).not.toBe(AIR);
    r.run(0.3);
    expect(r.world.get(10, 6, 10)).toBe(AIR);
    r.run(3.5);
    expect(r.world.get(10, 6, 10)).toBe(stone);
  });

  it('a positive shot on the faded platform brings it back now', () => {
    const r = rig(worldOf(PLATFORM));
    r.runner.start(HINDRANCES['fading-platforms'], { tags: [5], seconds: 3 }, 1, 1);
    r.run(1.2);
    expect(r.world.get(11, 6, 11)).toBe(AIR);
    expect(r.runner.positiveHit(HIT(11.5, 6.5, 11.5))).toBe(true);
    expect(r.world.get(11, 6, 11)).toBe(stone);
  });
});

describe('dense ground', () => {
  it('slows feet on its cells only, only after the telegraph, until a shot or its end', () => {
    const r = rig(worldOf(), 20.5, 20.5);
    const cell = r.world.idx(20, 1, 20);
    r.runner.start(HINDRANCES['dense-ground'], { cells: [cell, r.world.idx(21, 1, 20)], seconds: 3, slow: 0.5 }, 1, 1);
    r.run(0.95);
    expect(r.slows).toEqual([]);
    r.run(0.5);
    expect(r.slows.length).toBeGreaterThan(0);
    expect(r.slows[0][0]).toBe(0.5);
    r.body.x = 30.5;
    const n = r.slows.length;
    r.run(0.5);
    expect(r.slows.length).toBe(n);
    r.body.x = 20.5;
    expect(r.runner.positiveHit(HIT(20.5, 1.5, 20.5, cell))).toBe(true);
    r.run(0.5);
    expect(r.slows.length).toBe(n);
    r.run(2);
    expect(r.runner.active()).toEqual([]);
    expect(r.world.getAt(cell)).toBe(stone);
    expect(r.bad.size).toBe(0);
  });
});

describe('cube cage', () => {
  it('outlines first, then cages the cell two high with no roof, and dissolves when it ends', () => {
    const r = rig(worldOf(), 20.5, 20.5);
    const around: Vec3 = { x: 20.5, y: 2, z: 20.5 };
    const cells = cageCells(r.host, around);
    expect(cells.length).toBe(16);
    r.runner.start(HINDRANCES['cube-cage'], { around, seconds: 3 }, 1, 1);
    r.run(0.95);
    expect(cells.every(i => r.world.getAt(i) === AIR)).toBe(true);
    r.run(0.1);
    expect(cells.every(i => r.world.getAt(i) === CAGE_MAT)).toBe(true);
    expect(r.world.get(20, 4, 20)).toBe(AIR);
    expect(r.world.get(20, 2, 20)).toBe(AIR);
    expect(r.runner.positiveHit(HIT(21.5, 2.5, 20.5))).toBe(true);
    expect(r.world.get(21, 2, 20)).toBe(AIR);
    r.run(3);
    expect(r.runner.active()).toEqual([]);
    expect(cells.every(i => r.world.getAt(i) === AIR && r.world.kindAt(i) === 0)).toBe(true);
    expect(r.spawned).toEqual([]);
  });

  it('is never closed over a drop, and never inside the player', () => {
    const r = rig(worldOf(), 20.5, 20.5);
    expect(cageCells(r.host, { x: 50.5, y: 2, z: 50.5 })).toEqual([]);
    r.runner.start(HINDRANCES['cube-cage'], { around: { x: 20.5, y: 2, z: 20.5 }, seconds: 2 }, 1, 1);
    r.body.x = 21.5;
    r.run(1.1);
    expect(r.world.get(21, 2, 20)).toBe(AIR);
    expect(r.world.get(19, 2, 20)).toBe(CAGE_MAT);
  });
});

describe('water currents', () => {
  const channel = (): Channel => ({
    id: 0, head: [10, 2, 20], nest: -1, bed: [[10, 2, 20], [11, 2, 20], [12, 2, 20], [13, 2, 20], [14, 2, 20]],
  });
  const source = elemByte(EL_WATER, SOURCE);

  it('fills the bed after its telegraph, stops at a dam, pushes feet along the bed, and dries at its end', () => {
    const r = rig(worldOf(), 11.5, 20.5);
    r.world.placing = true;
    r.world.set(13, 2, 20, MAT.dirt);
    r.world.placing = false;
    const ch = channel();
    r.runner.start(HINDRANCES['water-currents'], { channel: ch, seconds: 3, push: 4 }, 1, 1);
    r.run(0.95);
    expect(r.world.elemAt(10, 2, 20)).toBe(0);
    r.run(0.2);
    expect([r.world.elemAt(10, 2, 20), r.world.elemAt(11, 2, 20), r.world.elemAt(12, 2, 20)]).toEqual([source, source, source]);
    expect(r.world.elemAt(14, 2, 20)).toBe(0);
    expect(r.world.get(13, 2, 20)).toBe(MAT.dirt);
    expect(r.pushes.length).toBeGreaterThan(0);
    expect(r.pushes.every(p => p[0] > 0 && p[1] === 0 && p[2] === 0)).toBe(true);
    r.run(3);
    expect(r.runner.active()).toEqual([]);
    expect(ch.bed.every(([x, y, z]) => r.world.elemAt(x, y, z) === 0)).toBe(true);
    expect(r.bad.size).toBe(0);
  });

  it('a positive shot at the head stops it for 3 s', () => {
    const r = rig(worldOf(), 30.5, 30.5);
    r.runner.start(HINDRANCES['water-currents'], { channel: channel(), seconds: 6, push: 4 }, 1, 1);
    r.run(1.2);
    expect(r.runner.positiveHit(HIT(10.5, 2.5, 20.5))).toBe(true);
    expect(r.world.elemAt(10, 2, 20)).toBe(0);
    r.run(STOP - 0.1);
    expect(r.world.elemAt(10, 2, 20)).toBe(0);
    r.run(0.2);
    expect(r.world.elemAt(10, 2, 20)).toBe(source);
  });
});

describe('paralysis', () => {
  const P = { from: { x: 20.5, y: 2, z: 20.5 }, speed: 4, radius: 8, hold: 1.2 };

  it('holds a grounded player its ring passes, once, only after the telegraph; then ends', () => {
    const r = rig(worldOf(), 25.5, 20.5);
    r.runner.start(HINDRANCES.paralysis, { ...P }, 1, 1);
    r.run(1);
    expect(r.holds).toEqual([]);
    r.run(2.2);
    expect(r.holds).toEqual([1.2]);
    expect(r.runner.active()).toEqual([]);
    expect(r.hazards.size).toBe(0);
    expect(r.bad.size).toBe(0);
  });

  it('passes under a player in the air', () => {
    const r = rig(worldOf(), 25.5, 20.5);
    r.body.onGround = false;
    r.runner.start(HINDRANCES.paralysis, { ...P }, 1, 1);
    r.run(3.5);
    expect(r.holds).toEqual([]);
  });

  it('holding the aim on the source halves the ring; a positive shot shortens the hold', () => {
    const r = rig(worldOf(), 25.5, 20.5);
    // the player looks back at the source
    r.player.eye = { x: 25.5, y: 3.6, z: 20.5 };
    r.player.aim = { x: -5, y: -1.6, z: 0 };
    r.runner.start(HINDRANCES.paralysis, { ...P }, 1, 1);
    r.run(3.5);
    expect(r.holds).toEqual([]);
    const s = rig(worldOf(), 23.5, 20.5);
    s.runner.start(HINDRANCES.paralysis, { ...P }, 1, 1);
    s.run(0.5);
    expect(s.runner.positiveHit(HIT(20.5, 2.5, 20.5))).toBe(true);
    s.run(3);
    expect(s.holds).toEqual([1.2 * SHORT]);
  });
});
