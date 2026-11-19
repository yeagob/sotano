// Bounce practices (docs/design/built/practices/BOUNCE.md): the intentBounce event, the launch queue
// it relies on, Dialectic (split in two) and Reframing (aim and damage), alone and together.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Intents, intentFromStats, type IntentHooks } from '../src/combat/intents';
import { ITEMS } from '../src/content/items';
import dialectic, { HALF, SPLIT_ONCE, SPLIT_TWICE, splitHeadings } from '../src/content/items/dialectic';
import { REFRAME, SEEK_RANGE } from '../src/content/items/reframing';
import { SYNERGIES } from '../src/content/synergies';
import { Rng } from '../src/core/rng';
import { BASE_STATS, StatSheet } from '../src/core/stats';
import { createBus, type GameBus, type IntentBounce, type IntentSpec } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';

type Solid = (x: number, y: number, z: number) => boolean;
const V = (a: number[]) => new THREE.Vector3(a[0], a[1], a[2]);
const deg = (a: THREE.Vector3, b: THREE.Vector3) => THREE.MathUtils.radToDeg(a.angleTo(b));

interface Rig {
  bus: GameBus;
  inv: Inventory;
  intents: Intents;
  /** Every intentBounce payload, read after the hooks ran (priority 300), in order. */
  bounces: (IntentBounce & { damageAfter: number })[];
  /** Intentions the rebounds launched, counted after the hooks. */
  launched: number;
  /** The most intentions in flight at once, sampled after every frame. */
  peak: number;
}

/** A headless world: the real Intents, the real bus and the real Inventory with the named practices.
 *  `solid` is the room; `projections` are points the Reframing aim can find (they take no hits). */
function rig(items: string[], solid: Solid, projections: number[][] = []): Rig {
  const bus = createBus();
  const stats = new StatSheet();
  const api = {
    bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn),
    heal: () => {}, collect: () => true, damagePlayer: () => {}, rng: () => new Rng(1), message: () => {},
    nearestProjection: (x: number, y: number, z: number, r: number) => {
      let best: { id: number; x: number; y: number; z: number } | null = null, bd = r;
      projections.forEach(([px, py, pz], id) => {
        const d = Math.hypot(px - x, py - y, pz - z);
        if (d < bd) { bd = d; best = { id, x: px, y: py, z: pz }; }
      });
      return best;
    },
  } as unknown as HostApi;
  const inv = new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  for (const id of items) inv.gain(id);
  const hooks: IntentHooks = {
    solid,
    hitBlock: () => false,
    tier: () => 0,
    debrisAt: () => -1,
    hitDebris: () => {},
    enemyAt: () => -1,
    hitEnemy: () => {},
    splash: () => {},
    hit: () => {},
    nearestBlock: () => null,
    nearestEnemy: () => null,
    bounced: b => { bus.emit('intentBounce', b); },
  };
  const intents = new Intents(new THREE.Scene(), hooks);
  const r: Rig = { bus, inv, intents, bounces: [], launched: 0, peak: 0 };
  bus.on('intentBounce', {
    priority: 300, source: 'probe', fn: e => {
      r.bounces.push({ ...e, damageAfter: e.intent.damage, launch: e.launch });
      r.launched += e.launch.length;
    },
  });
  return r;
}

/** Fires one shot the way the game does: the `fire` hooks run first, then the intention flies. */
function shoot(r: Rig, from: number[], dir: number[], base: Partial<IntentSpec> = {}) {
  const spec = { ...intentFromStats(BASE_STATS, 'positive'), gravity: 0, flight: 5, speed: 16, ...base };
  const ev = r.bus.emit('fire', { intent: spec });
  r.intents.fire(ev.intent, V(from), V(dir), new THREE.Vector3());
  return ev.intent;
}

/** Runs the world for `seconds` in 1/60 s frames, recording the peak number of intentions in flight. */
function run(r: Rig, seconds: number) {
  for (let f = 0; f < seconds * 60; f++) {
    r.intents.update(1 / 60);
    r.peak = Math.max(r.peak, r.intents.count);
  }
}

const corridor: Solid = (x) => Math.abs(x) >= 3;   // walls at x = ±3, open to the north and south
const box: Solid = (x, _y, z) => Math.abs(x) >= 3 || Math.abs(z) >= 3;
const wallEast: Solid = (x) => x >= 3;

describe('intentBounce event', () => {
  it('is emitted once per rebound, with the bounce point, the face normal and the rebound index', () => {
    const r = rig([], corridor);
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0], { bounces: 2 });
    run(r, 2);
    expect(r.bounces.map(b => b.bounce)).toEqual([1, 2]);
    expect(r.bounces[0].nx).toBeCloseTo(-1);
    expect(r.bounces[0].ny).toBeCloseTo(0);
    expect(r.bounces[0].nz).toBeCloseTo(0);
    expect(r.bounces[0].x).toBeCloseTo(3, 2);
    expect(r.bounces[1].nx).toBeCloseTo(1);
    expect(r.bounces[1].x).toBeCloseTo(-2, 2);
  });

  it('reports the velocity the core will use: a hook that changes it changes the flight', () => {
    const r = rig([], wallEast);
    r.bus.on('intentBounce', { priority: 100, source: 'steer', fn: e => { e.vx = 0; e.vy = 0; e.vz = 6; } });
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0], { bounces: 1 });
    run(r, 0.5);
    expect(r.bounces).toHaveLength(1);
    expect(r.bounces[0].vz).toBe(6);
  });

  it('does not fire for an intention with no bounces left', () => {
    const r = rig([], wallEast);
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0], { bounces: 0 });
    run(r, 1);
    expect(r.bounces).toHaveLength(0);
  });
});

describe('launching from a hook while the intentions are being walked', () => {
  it('a launched intention joins after the walk and keeps flying', () => {
    const r = rig([], wallEast);
    let once = true;
    r.bus.on('intentBounce', {
      priority: 200, source: 'once', fn: e => {
        if (!once) return;
        once = false;
        e.launch.push({ spec: { ...e.intent }, vx: 0, vy: 0, vz: 10, bounce: e.bounce });
      },
    });
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0], { bounces: 1 });
    run(r, 0.3);
    expect(r.launched).toBe(1);
    expect(r.intents.count).toBe(2);
    const looks = r.intents.looks();
    expect(looks).toHaveLength(2);
    run(r, 0.3);
    expect(r.intents.count).toBe(2);
  });

  it('firing from inside a hook is safe: every intention in the list is still walked', () => {
    const r = rig([], wallEast);
    let fired = false;
    r.bus.on('intentBounce', {
      priority: 200, source: 'fire-inside', fn: e => {
        if (fired) return;
        fired = true;
        r.intents.fire({ ...e.intent, bounces: 0 }, V([0.5, 0.5, 0.5]), V([0, 0, 1]), new THREE.Vector3());
      },
    });
    for (let k = 0; k < 5; k++) shoot(r, [0.5, 0.5, 0.5 + k * 0.1], [1, 0, 0], { bounces: 1 });
    expect(() => run(r, 1)).not.toThrow();
    expect(r.bounces.length).toBe(5);
    expect(fired).toBe(true);
  });
});

describe('Dialectic', () => {
  it('turns a reflected heading 40 degrees either side around the normal, keeping its normal component', () => {
    const n: [number, number, number] = [-1, 0, 0];
    const v: [number, number, number] = [-0.6, 0.5, 0.2];
    const [a, b] = splitHeadings(v, n);
    const va = V(v), ha = V(a), hb = V(b), nn = V(n);
    // measured in the plane across the normal, where the turn happens
    const across = (x: THREE.Vector3) => x.clone().addScaledVector(nn, -x.dot(nn));
    expect(deg(across(va), across(ha))).toBeCloseTo(40, 5);
    expect(deg(across(va), across(hb))).toBeCloseTo(40, 5);
    expect(deg(across(ha), across(hb))).toBeCloseTo(80, 5);
    expect(ha.x).toBeCloseTo(va.x, 9);
    expect(hb.x).toBeCloseTo(va.x, 9);
    const side = new THREE.Vector3().crossVectors(nn, va);
    expect(ha.dot(side)).toBeGreaterThan(0);
    expect(hb.dot(side)).toBeLessThan(0);
  });

  it('near the normal it turns around world up instead, and a ceiling turns around world X', () => {
    const wall = splitHeadings([-1, 0, 0.05], [-1, 0, 0]);
    expect(deg(V([-1, 0, 0.05]), V(wall[0]))).toBeCloseTo(40, 5);
    expect(deg(V(wall[0]), V(wall[1]))).toBeCloseTo(80, 5);
    expect(wall[0][1]).toBeCloseTo(0, 9);
    const ceiling = splitHeadings([0, -1, 0.05], [0, 1, 0]);
    expect(deg(V([0, -1, 0.05]), V(ceiling[0]))).toBeCloseTo(40, 5);
    expect(ceiling[0][0]).toBeCloseTo(ceiling[1][0], 9);
    expect(ceiling[0][1]).not.toBeCloseTo(ceiling[1][1], 3);
  });

  it('gives each half half the damage and half the mining, so the total is kept, and marks the lineage', () => {
    const split = dialectic.hooks!.find(h => h.id === 'split')!.fn;
    const spec = { ...intentFromStats(BASE_STATS, 'negative'), damage: 6, mining: 4, bounces: 2, tags: new Set(['x']) };
    const ctx = { intent: spec, x: 3, y: 0.5, z: 0.5, vx: -12, vy: 0, vz: 0, nx: 1, ny: 0, nz: 0, bounce: 1, launch: [] as IntentBounce['launch'], cancelled: false, cancel() {} };
    split(ctx as never, {} as never);
    expect(spec.damage).toBe(6 * HALF);
    expect(spec.mining).toBe(4 * HALF);
    expect(ctx.launch).toHaveLength(1);
    const twin = ctx.launch[0];
    expect(twin.spec.damage + spec.damage).toBe(6);
    expect(twin.spec.mining + spec.mining).toBe(4);
    expect(twin.spec.polarity).toBe('negative');
    expect(twin.spec.bounces).toBe(2);
    expect(twin.spec.tags).not.toBe(spec.tags);
    expect(spec.tags.has('x') && twin.spec.tags.has('x')).toBe(true);
    expect(spec.tags.has(SPLIT_ONCE) && twin.spec.tags.has(SPLIT_ONCE)).toBe(true);
    expect(twin.bounce).toBe(1);
  });

  it('a second generation is marked, and a third is never split', () => {
    const split = dialectic.hooks!.find(h => h.id === 'split')!.fn;
    const spec = { ...intentFromStats(BASE_STATS, 'positive'), tags: new Set([SPLIT_ONCE]) };
    const ctx = { intent: spec, x: 0, y: 0, z: 0, vx: -12, vy: 0, vz: 0, nx: 1, ny: 0, nz: 0, bounce: 2, launch: [] as IntentBounce['launch'], cancelled: false, cancel() {} };
    split(ctx as never, {} as never);
    expect(spec.tags.has(SPLIT_TWICE)).toBe(true);
    expect(spec.tags.has(SPLIT_ONCE)).toBe(false);
    const again = { ...ctx, launch: [] as IntentBounce['launch'] };
    split(again as never, {} as never);
    expect(again.launch).toHaveLength(0);
  });

  it('in a closed room with Bounce Back, one shot makes at most four intentions (three splits)', () => {
    const r = rig(['dialectic', 'bounceback'], box);
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0.37]);
    run(r, 10);
    expect(r.launched).toBe(3);
    expect(r.peak).toBe(4);
    expect(r.intents.count).toBe(0);
  });

  it('a single split keeps the damage of the shot in total', () => {
    const r = rig(['dialectic'], wallEast);
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0]);
    run(r, 1);
    expect(r.bounces).toHaveLength(1);
    const total = r.bounces[0].intent.damage + (r.bounces[0].launch[0]?.spec.damage ?? 0);
    expect(total).toBeCloseTo(BASE_STATS.damage, 9);
  });
});

describe('Reframing', () => {
  it('turns toward a projection within 8 blocks, keeps the speed, and deals 25% more', () => {
    const proj = [-2, 0.5, 4];
    const r = rig(['reframing'], wallEast, [proj]);
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0]);
    run(r, 1);
    expect(r.bounces).toHaveLength(1);
    const b = r.bounces[0];
    expect(Math.hypot(b.x - proj[0], b.y - proj[1], b.z - proj[2])).toBeLessThan(SEEK_RANGE);
    const aim = V([proj[0] - b.x, proj[1] - b.y, proj[2] - b.z]).normalize();
    const v = V([b.vx, b.vy, b.vz]);
    expect(v.length()).toBeCloseTo(16 * 0.75, 6);
    expect(deg(v, aim)).toBeLessThan(0.01);
    expect(b.damageAfter).toBeCloseTo(BASE_STATS.damage * REFRAME, 9);
  });

  it('with nothing within reach it only adds the damage and keeps the reflected heading', () => {
    const r = rig(['reframing'], wallEast, [[-20, 0.5, 0.5]]);
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0]);
    run(r, 1);
    const b = r.bounces[0];
    expect(b.vx).toBeLessThan(0);
    expect(Math.abs(b.vz)).toBeLessThan(1e-9);
    expect(b.damageAfter).toBeCloseTo(BASE_STATS.damage * REFRAME, 9);
  });

  it('the damage multiplier stacks at every bounce', () => {
    const r = rig(['reframing', 'bounceback'], corridor);
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0]);
    run(r, 2);
    // the corridor gives three rebounds to a Reframing and Bounce Back shot (1 + 2 bounces)
    expect(r.bounces).toHaveLength(3);
    r.bounces.forEach((b, i) => expect(b.damageAfter).toBeCloseTo(BASE_STATS.damage * REFRAME ** (i + 1), 9));
  });
});

describe('Dialectic and Reframing together', () => {
  it('both halves of a split leave the aimed heading with the same normal component', () => {
    const proj = [-2, 0.5, 4];
    const r = rig(['dialectic', 'reframing'], wallEast, [proj]);
    shoot(r, [0.5, 0.5, 0.5], [1, 0, 0]);
    run(r, 1);
    expect(r.bounces).toHaveLength(1);
    const first = r.bounces[0];
    const twin = first.launch[0];
    expect(twin).toBeDefined();
    expect(first.vx).toBeCloseTo(twin.vx, 9);
    expect(first.intent.damage + twin.spec.damage).toBeCloseTo(BASE_STATS.damage * REFRAME, 9);
  });

  it('with all three practices, a closed room never grows past four intentions per shot and settles', () => {
    const proj = [-1, 0.5, -1];
    const r = rig(['dialectic', 'reframing', 'bounceback'], box, [proj]);
    for (let k = 0; k < 3; k++) shoot(r, [0.5, 0.5, 0.5 + k * 0.2], [1, 0, 0.37 + k * 0.2]);
    run(r, 12);
    expect(r.launched).toBeLessThanOrEqual(3 * 3);
    expect(r.peak).toBeLessThanOrEqual(12);
    expect(r.intents.count).toBe(0);
  });
});
