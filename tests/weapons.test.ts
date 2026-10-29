// Weapons that replace the intention (docs/architecture/WEAPONS.md), tested headless with a fake host.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ITEMS } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { Beam, Blade, BLADE_MAX_REACH, chargeTime, GreatCut, GREATCUT_MAX_REACH, type WeaponHost } from '../src/combat/weapons';
import { Rng } from '../src/core/rng';
import { BASE_STATS, StatSheet, type Stats } from '../src/core/stats';
import { createBus, WEAPONS_KEEPING_SHOT } from '../src/game/events';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** A world of solid blocks around the origin; the player stands at (0.5, 0, 0.5) looking at -Z. */
function fakeHost(opts: { stats?: Partial<Stats>; unbreakable?: Set<string>; fill?: number } = {}) {
  const blocks = new Set<string>();
  const fill = opts.fill ?? 6;
  for (let x = -fill; x <= fill; x++) for (let y = 0; y <= 3; y++) for (let z = -fill * 3; z <= fill; z++)
    if (!(x === 0 && z === 0)) blocks.add(key(x, y, z));
  const state = { casting: false, cuts: [] as string[], burns: 0, strikes: 0, hits: [] as number[], cancel: false, cubes: [] as [number, number, number][], slashes: [] as [THREE.Vector3, THREE.Vector3][] };
  const stats = { ...BASE_STATS, ...opts.stats };
  const host: WeaponHost = {
    stats: () => stats,
    eye: () => new THREE.Vector3(0.5, 1.6, 0.5),
    forward: () => new THREE.Vector3(0, 0, -1),
    casting: () => state.casting,
    strike: (_w, damage, mining, reach) => { state.strikes++; return state.cancel ? null : { damage, mining, reach, tags: new Set() }; },
    solid: (x, y, z) => blocks.has(key(x, y, z)),
    breakable: (x, y, z) => blocks.has(key(x, y, z)) && !opts.unbreakable?.has(key(x, y, z)),
    cut: (x, y, z) => { blocks.delete(key(x, y, z)); state.cuts.push(key(x, y, z)); },
    burn: (x, y, z) => { state.burns++; blocks.delete(key(x, y, z)); return true; },
    targets: () => [{ id: 7, x: 0.5, y: 0.6, z: -1.5, hw: 0.4, h: 1.6 }],
    hit: id => { state.hits.push(id); },
    clearProjectiles: () => {},
    // a loose cube in front of the player, 1.5 blocks ahead at eye height
    clearCubes: inside => { if (inside(0.5, 1.6, -1)) state.cubes.push([0.5, 1.6, -1]); },
    sliceCubes: (inside, along, across) => {
      if (inside(0.5, 1.6, -1)) { state.cubes.push([0.5, 1.6, -1]); state.slashes.push([along.clone(), across.clone()]); }
    },
    particles: () => {}, shake: () => {}, swingHands: () => {}, chargeHands: () => {}, sound: () => {},
  };
  return { host, blocks, state };
}

const run = (w: { update(dt: number): void }, seconds: number, dt: number) => {
  for (let t = 0; t < seconds - 1e-9; t += dt) w.update(dt);
};

describe('active weapon', () => {
  function setup() {
    const bus = createBus();
    const stats = new StatSheet();
    const api = { bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn), rng: () => new Rng(1), message: () => {} } as unknown as HostApi;
    return new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  }

  it('is the intention by default, an item replaces it, and the synergy outranks both', () => {
    const inv = setup();
    expect(inv.weapon).toBe('intent');
    inv.gain('occamsrazor');
    expect(inv.weapon).toBe('blade');
    inv.gain('kiai');
    expect(inv.weapon).toBe('greatcut');
    inv.lose('occamsrazor');
    expect(inv.weapon).toBe('beam');
    inv.lose('kiai');
    expect(inv.weapon).toBe('intent');
  });

  it('survives serialize and restore, and ties go to the latest gained', () => {
    const inv = setup();
    inv.restore(['kiai', 'occamsrazor']);
    expect(inv.weapon).toBe('greatcut');
    inv.restore(['kiai', 'stoic']);
    expect(inv.weapon).toBe('beam');
    expect(inv.serialize()).toEqual(['kiai', 'stoic']);
  });

  it('the razor is used alongside the intention; the other weapons replace it', () => {
    expect(WEAPONS_KEEPING_SHOT.has('blade')).toBe(true);
    expect(WEAPONS_KEEPING_SHOT.has('beam')).toBe(false);
    expect(WEAPONS_KEEPING_SHOT.has('greatcut')).toBe(false);
  });

  it('both weapons are quality 4 and drop only from bosses', () => {
    for (const id of ['occamsrazor', 'kiai']) {
      const d = ITEMS.find(i => i.id === id)!;
      expect(d.quality).toBe(4);
      expect(d.pools).toEqual({ boss: 1 });
    }
  });
});

describe('Cut Ties with Toxic People (blade)', () => {
  it('cuts every breakable block in front, none behind, hits projections, and leaves the unbreakable', () => {
    const { host, state } = fakeHost({ unbreakable: new Set([key(0, 1, -1)]) });
    const b = new Blade(new THREE.Scene(), host);
    state.casting = true;
    b.update(1 / 60);
    expect(state.strikes).toBe(1);
    expect(state.cuts.length).toBeGreaterThan(8);
    expect(state.cuts).not.toContain(key(0, 1, -1));
    expect(state.cuts.every(c => Number(c.split(',')[2]) <= 0)).toBe(true);
    expect(state.cuts).toContain(key(0, 1, -2));
    expect(state.hits).toEqual([7]);
  });

  it('swings at 80% of the fire rate while held, with its reach capped', () => {
    const { host, state } = fakeHost({ stats: { fireRate: 2, size: 5 } });
    const b = new Blade(new THREE.Scene(), host);
    state.casting = true;
    run(b, 2.01, 1 / 60);
    expect(state.strikes).toBe(4); // t = 0, 0.625, 1.25, 1.875
    const far = Math.max(...state.cuts.map(c => -Number(c.split(',')[2])));
    expect(far).toBeLessThanOrEqual(BLADE_MAX_REACH);
  });
});

describe('Remember Breathing (beam)', () => {
  it('charges for 2.7 ÷ fire rate seconds (0.35–2), and only a full charge releases', () => {
    expect(chargeTime({ ...BASE_STATS, fireRate: 2.7 })).toBe(1);
    expect(chargeTime({ ...BASE_STATS, fireRate: 30 })).toBe(0.35);
    expect(chargeTime({ ...BASE_STATS, fireRate: 0.3 })).toBe(2);
    const { host, state } = fakeHost();
    const beam = new Beam(new THREE.Scene(), host);
    state.casting = true; run(beam, 0.5, 1 / 60);
    state.casting = false; beam.update(1 / 60);
    expect(state.strikes).toBe(0);
  });

  for (const fps of [20, 60, 144]) {
    it(`deals exactly 10 ticks per beam at ${fps} fps, burning through blocks as they break`, () => {
      const { host, state } = fakeHost({ stats: { fireRate: 2.7 } });
      const beam = new Beam(new THREE.Scene(), host);
      state.casting = true; run(beam, 1.05, 1 / fps);
      state.casting = false; run(beam, 1.5, 1 / fps);
      expect(state.strikes).toBe(1);
      expect(state.burns).toBe(10);
      expect(state.hits.length).toBeGreaterThan(0);
    });
  }

  it('gives the charge back when a hook cancels the strike', () => {
    const { host, state } = fakeHost({ stats: { fireRate: 2.7 } });
    const beam = new Beam(new THREE.Scene(), host);
    state.cancel = true;
    state.casting = true; run(beam, 1.05, 1 / 60);
    state.casting = false; beam.update(1 / 60);
    state.cancel = false;
    state.casting = true; beam.update(1 / 60);
    state.casting = false; beam.update(1 / 60);
    expect(state.strikes).toBe(2);
  });
});

describe('One Clear Cut (great cut)', () => {
  it('sweeps a capped giant blade, at most 60 cuts per frame, hitting each projection once', () => {
    const { host, state } = fakeHost({ stats: { fireRate: 2.7, size: 5 }, fill: 10 });
    const g = new GreatCut(new THREE.Scene(), host);
    state.casting = true; run(g, 1.25, 1 / 60);
    state.casting = false;
    let before = 0;
    for (let i = 0; i < 120; i++) {
      g.update(1 / 60);
      expect(state.cuts.length - before).toBeLessThanOrEqual(60);
      before = state.cuts.length;
    }
    expect(state.strikes).toBe(1);
    expect(state.cuts.length).toBeGreaterThan(100);
    expect(state.hits).toEqual([7]);
    const far = Math.max(...state.cuts.map(c => { const [x, , z] = c.split(',').map(Number); return Math.hypot(x + 0.5 - 0.5, z + 0.5 - 0.5); }));
    expect(far).toBeLessThanOrEqual(GREATCUT_MAX_REACH + 1);
  });

  it('cuts the same blocks at 20 fps as at 144 fps (the sweep integrates its arc)', () => {
    const cutsAt = (fps: number) => {
      const { host, state } = fakeHost({ stats: { fireRate: 2.7 }, fill: 10 });
      const g = new GreatCut(new THREE.Scene(), host);
      state.casting = true; run(g, 1.25, 1 / fps);
      state.casting = false; run(g, 2, 1 / fps);
      return new Set(state.cuts);
    };
    const a = cutsAt(20), b = cutsAt(144);
    const missing = [...b].filter(c => !a.has(c)).length;
    expect(missing / b.size).toBeLessThan(0.05);
  });
});

describe('weapons clear the rubble', () => {
  it('a strike destroys the loose cubes in its reach', async () => {
    const { createWeapon } = await import('../src/combat/weapons');
    for (const id of ['blade', 'beam'] as const) {
      const { host, state } = fakeHost();
      const w = createWeapon(id, new THREE.Scene(), host)!;
      state.casting = true;
      run(w, 2, 1 / 60);
      state.casting = false;
      run(w, 2, 1 / 60);
      expect(state.cubes.length, id).toBeGreaterThan(0);
    }
  });
});
