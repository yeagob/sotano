// Totality (docs/architecture/SKY.md §8): the strata, the reach envelope on J0's flight, the chain of hops
// (their rises, gaps, checkpoints, headroom and bounds), the Sun's entrance, and the Earth and the Sun.

import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { MATERIALS, MAT } from '../src/content/materials';
import { Rng, hashPath } from '../src/core/rng';
import { AIR_CONTROL, flight, rise } from '../src/physics/jump';
import { buildTotality, CHAIN_RADIUS, CHECKPOINT_EVERY, footprint, gapBetween, HEADROOM, LAST_TOP, PLATFORMS, SPIRAL_RADIUS, SUN_GAP, SUN_RADIUS } from '../src/sky/totality/chain';
import type { Footprint } from '../src/sky/totality/chain';
import { buildSkyTree, CROWN_Y } from '../src/sky/floors/tree';
import { maxGap, reach, reach2 } from '../src/sky/totality/reach';
import { STRATA, sizeAt, stratumAt } from '../src/sky/totality/strata';
import { Threshold } from '../src/sky/totality/threshold';
import { SkyRealm } from '../src/sky/sky-realm';
import { EarthView } from '../src/sky/render/earth';
import { SunView } from '../src/sky/render/sun';
import type { Place, SkyHost, SkyPlayer, SkyRealmSet, TotalityPlan } from '../src/sky/types';

const AXIS = { x: 128, y: 221, z: 128 };
const forkFor = (seed: number) => (...path: (string | number)[]) => new Rng(hashPath(seed, path));

function planFor(seed: number): TotalityPlan {
  return buildTotality(forkFor(seed), AXIS);
}

/** The hops with their platforms, the way a player walks them. */
function hopsOf(plan: TotalityPlan) {
  return plan.hops.map(h => ({ h, a: plan.platforms[h.from], b: plan.platforms[h.to] }));
}

/** True when the cells of a platform (a box shape, tags kept) sit inside the region [x0,x1) × [z0,z1) × [y0,y1]. */
function boxOverlaps(s: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }, r: { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number }) {
  return !(s.x1 < r.x0 || s.x0 >= r.x1 || s.z1 < r.z0 || s.z0 >= r.z1 || s.y1 < r.y0 || s.y0 > r.y1);
}

describe('the strata (SKY.md §8)', () => {
  it('three bands above the crown: lower 221–420, mid 420–700, upper 700–980', () => {
    expect(STRATA.map(s => [s.name, s.y0, s.y1])).toEqual([['lower', 221, 420], ['mid', 420, 700], ['upper', 700, 980]]);
    expect(stratumAt(220)).toBeNull();
    expect(stratumAt(221)?.name).toBe('lower');
    expect(stratumAt(420)?.name).toBe('mid');
    expect(stratumAt(699)?.name).toBe('mid');
    expect(stratumAt(980)).toBeNull();
  });

  it('platforms are 3 and 2 low, 2 in the void, 2 narrowing to 1 near the summit', () => {
    const [lower, mid, upper] = STRATA;
    expect(sizeAt(lower, 230)).toBe(3);
    expect(sizeAt(lower, 400)).toBe(2);
    expect(sizeAt(mid, 500)).toBe(2);
    expect(sizeAt(upper, 710)).toBe(2);
    expect(sizeAt(upper, 960)).toBe(1);
  });

  it('every stratum has materials from the sky set', () => {
    const sky = new Set(MATERIALS.filter(m => m.id >= 30 && m.id <= 42).map(m => m.id));
    for (const s of STRATA) for (const m of s.materials) expect(sky.has(m)).toBe(true);
  });
});

describe('the reach envelope (on physics/jump.ts)', () => {
  it('reach is the 1× → 2× → 8× sequence with the third jump at full control', () => {
    expect(reach(10)).toBeCloseTo(flight(10, 3, 1)!, 9);
    expect(reach(0)).toBeCloseTo(flight(0, 3, 1)!, 9);
    expect(reach(rise(3) - 0.5)).toBeGreaterThan(0);
    expect(reach(rise(3))).toBeUndefined();
  });

  it('reach2 is the first two jumps only: defined below 3.78 and undefined above', () => {
    expect(reach2(0)).toBeCloseTo(flight(0, 2, AIR_CONTROL)!, 9);
    expect(reach2(3)).toBeGreaterThan(0);
    expect(reach2(3.77)).toBeGreaterThan(0);
    expect(reach2(3.78)).toBeUndefined();
    expect(reach2(4)).toBeUndefined();
    expect(reach2(10)).toBeUndefined();
  });

  it('a climb may be wider than a rest, and the widest gap shrinks as the rise grows', () => {
    expect(maxGap('climb', 4)!).toBeGreaterThan(maxGap('climb', 10)!);
    expect(maxGap('rest', 0)!).toBeGreaterThan(maxGap('rest', 3)!);
    expect(maxGap('rest', 2)!).toBeLessThan(maxGap('climb', 4)!);
    expect(maxGap('rest', 4)).toBeUndefined();
  });
});

describe('the chain (SKY.md §8)', () => {
  const seeds = [1, 2, 3, 7, 11];

  it('has 108 platforms and 107 hops, the last platform a checkpoint before the threshold', () => {
    const plan = planFor(1);
    expect(plan.platforms.length).toBe(PLATFORMS);
    expect(plan.hops.length).toBe(PLATFORMS - 1);
    expect(plan.checkpoints).toEqual(Array.from({ length: PLATFORMS / CHECKPOINT_EVERY }, (_, k) => k * CHECKPOINT_EVERY + CHECKPOINT_EVERY - 1));
    expect(plan.checkpoints[plan.checkpoints.length - 1]).toBe(PLATFORMS - 1);
  });

  it('climbs rise 4–10 and rests rise 0–3, each hop matching its platforms', () => {
    for (const seed of seeds) {
      const plan = planFor(seed);
      for (const { h, a, b } of hopsOf(plan)) {
        expect(b.y - a.y).toBe(h.dy);
        if (h.kind === 'climb') expect([h.dy >= 4 && h.dy <= 10, h.dy]).toEqual([true, h.dy]);
        else expect([h.dy >= 0 && h.dy <= 3, h.dy]).toEqual([true, h.dy]);
      }
    }
  });

  it('at least 60% of all hops are climbs', () => {
    for (const seed of seeds) {
      const plan = planFor(seed);
      const climbs = plan.hops.filter(h => h.kind === 'climb').length;
      expect(climbs / plan.hops.length).toBeGreaterThanOrEqual(0.6);
    }
  });

  it('every gap is at least 1 block and at most 0.8 of the reach of its hop', () => {
    for (const seed of seeds) {
      for (const { h, a, b } of hopsOf(planFor(seed))) {
        const gap = gapBetween(footprint(a), footprint(b));
        expect(gap).toBeCloseTo(h.gap, 9);
        expect(gap).toBeGreaterThanOrEqual(1);
        expect(gap).toBeLessThanOrEqual(maxGap(h.kind, h.dy)! + 1e-9);
      }
    }
  });

  it('every takeoff and arc keeps a clear column of 15 blocks above it', () => {
    for (const seed of seeds) {
      const plan = planFor(seed);
      for (const { a, b } of hopsOf(plan)) {
        const fa = footprint(a), fb = footprint(b);
        const region = {
          x0: Math.min(fa.x0, fb.x0), x1: Math.max(fa.x1, fb.x1),
          z0: Math.min(fa.z0, fb.z0), z1: Math.max(fa.z1, fb.z1),
          y0: a.y, y1: a.y + HEADROOM - 1,
        };
        for (const s of plan.shapes) {
          if (s.k !== 'box') continue;
          if (s.tag !== undefined && (s.tag === a.tag || s.tag === b.tag)) continue;
          expect(boxOverlaps(s, region), `seed ${seed}, platform ${a.id} to ${b.id}`).toBe(false);
        }
      }
    }
  });

  it('checkpoints are 3 × 3, and the summit platforms narrow to 1 × 1', () => {
    const plan = planFor(4);
    for (const i of plan.checkpoints) expect(plan.platforms[i].w).toBe(3);
    const summit = plan.platforms.filter((p: Place) => p.y >= 840 && !plan.checkpoints.includes(p.id));
    expect(summit.length).toBeGreaterThan(0);
    for (const p of summit) expect(p.w).toBe(1);
  });

  it('the crown stands at the bottom of the strata, the last checkpoint at the top of the climb', () => {
    for (const seed of seeds) {
      const plan = planFor(seed);
      expect(plan.platforms[0].y).toBe(221);
      expect(plan.platforms[plan.platforms.length - 1].y).toBe(LAST_TOP);
      for (const p of plan.platforms) expect(stratumAt(p.y)).not.toBeNull();
    }
  });

  it('the spiral stays within its radius of the axis and within the world', () => {
    for (const seed of seeds) {
      const plan = planFor(seed);
      for (const p of plan.platforms) {
        const d = Math.hypot(p.x - AXIS.x, p.z - AXIS.z);
        expect(d).toBeLessThanOrEqual(CHAIN_RADIUS);
        expect(d).toBeGreaterThanOrEqual(SPIRAL_RADIUS - 2);
      }
      for (const s of plan.shapes) {
        if (s.k !== 'box') continue;
        expect([s.x0 >= 0, s.x1 < 256, s.z0 >= 0, s.z1 < 256, s.y0 >= 0]).toEqual([true, true, true, true, true]);
      }
    }
  });

  it('the same seed gives the same plan, whatever the order the forks are asked for', () => {
    const plain = planFor(9);
    const noisy = buildTotality((...path) => {
      // ask for unrelated streams first: the chain must not depend on them
      new Rng(hashPath(9, ['other', ...path])).next();
      return new Rng(hashPath(9, path));
    }, AXIS);
    expect(noisy).toEqual(plain);
    expect(planFor(9)).toEqual(plain);
  });

  it('the first platform stands beside the roof of the crown, its layers never inside it', () => {
    const roofRadius = buildSkyTree(new Rng(1)).trunkRadius(CROWN_Y - 2);
    for (const seed of seeds) {
      const first = footprint(planFor(seed).platforms[0]);
      const corners = [[first.x0, first.z0], [first.x1 - 1, first.z0], [first.x0, first.z1 - 1], [first.x1 - 1, first.z1 - 1]];
      for (const [x, z] of corners) expect(Math.hypot(x - AXIS.x, z - AXIS.z)).toBeGreaterThan(roofRadius);
    }
  });

  it('a different seed gives a different climb', () => {
    expect(planFor(1).hops).not.toEqual(planFor(2).hops);
  });
});

describe('the Sun\'s entrance (SKY.md §8; owner, 2026-11-05)', () => {
  const SEEDS = [1, 5, 8];

  /** The distance in the plane from a point to a footprint (0 inside it). */
  const planeDistance = (c: { x: number; z: number }, f: Footprint) => Math.hypot(
    Math.max(f.x0 - c.x, 0, c.x - f.x1), Math.max(f.z0 - c.z, 0, c.z - f.z1),
  );

  /** A plan with a body the test moves by hand, and the host it stands in. */
  function rig(seed: number) {
    const plan = planFor(seed);
    const body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
    const push = vi.fn();
    const host = {
      player: () => ({ body, push } as unknown as SkyPlayer),
      enterUnity: vi.fn(),
      toast: vi.fn(),
      cue: vi.fn(),
      fx: vi.fn(),
    } as unknown as SkyHost;
    const t = new Threshold(host, plan);
    /** Puts the feet at (x, y, z), on the ground or in the air with a vertical speed. */
    const put = (x: number, y: number, z: number, onGround: boolean, vy = 0) => Object.assign(body, { x, y, z, onGround, vy });
    const last = plan.platforms[plan.platforms.length - 1];
    return { plan, host, t, push, put, last, sun: plan.sun, enter: host.enterUnity as ReturnType<typeof vi.fn> };
  }

  it('the Sun lies beyond the last checkpoint: its near surface SUN_GAP blocks past the far edge, at the checkpoint\'s height', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const last = plan.platforms[plan.platforms.length - 1];
      expect([plan.sun.r, plan.sun.y]).toEqual([SUN_RADIUS, last.y]);
      expect(planeDistance(plan.sun, footprint(last)) - plan.sun.r).toBeCloseTo(SUN_GAP, 9);
    }
  });

  it('the last jump reaches the Sun: its gap is within the reach of a rest at rise 0', () => {
    expect(SUN_GAP).toBeLessThanOrEqual(maxGap('rest', 0)!);
  });

  it('no other platform lies inside the Sun, so only a jump from the last checkpoint can enter it', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      for (const p of plan.platforms.slice(0, -1)) {
        // a lower bound of the distance to the platform's solid (two layers under its top): its plane gap and its height gap
        const dy = Math.max(0, Math.abs(p.y - plan.sun.y) - 2);
        expect(Math.hypot(planeDistance(plan.sun, footprint(p)), dy), `seed ${seed}, platform ${p.id}`).toBeGreaterThan(plan.sun.r);
      }
    }
  });

  it('the last checkpoint\'s jump into the Sun calls enterUnity exactly once, and nothing is refused or pushed', () => {
    const { t, put, last, sun, enter, host, push } = rig(1);
    put(last.x, last.y, last.z, true);
    t.update(0.1);
    expect(enter).not.toHaveBeenCalled();
    // the jump: in the air, rising, the body inside the Sun
    put(sun.x, sun.y - 0.9, sun.z, false, 8);
    t.update(0.1);
    expect(enter).toHaveBeenCalledTimes(1);
    expect(t.entered).toBe(true);
    // still inside: no second entry
    t.update(0.1);
    t.update(0.1);
    expect(enter).toHaveBeenCalledTimes(1);
    expect(host.toast).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('the first hop cannot enter the Sun: only a jump begun on the last checkpoint arms the entrance', () => {
    const { plan, t, put, sun, enter } = rig(2);
    const first = plan.platforms[0];
    put(first.x, first.y, first.z, true);
    t.update(0.1);
    put(sun.x, sun.y - 0.9, sun.z, false, 8);
    t.update(0.1);
    expect(enter).not.toHaveBeenCalled();
    expect(t.entered).toBe(false);
  });

  it('walking off the last checkpoint does not enter the Sun: the entrance needs a jump', () => {
    const { t, put, last, sun, enter } = rig(3);
    put(last.x, last.y, last.z, true);
    t.update(0.1);
    put(sun.x, sun.y - 0.9, sun.z, false, 0);
    t.update(0.1);
    expect(enter).not.toHaveBeenCalled();
  });

  it('the hum comes from the Sun near its surface; the old gate is gone, so touching its place refuses nothing', () => {
    const { plan, t, put, last, host, push } = rig(4);
    put(last.x, last.y, last.z, true);
    t.update(0.1);
    expect(host.cue).toHaveBeenCalledWith('totality.hum', plan.sun.x, plan.sun.y, plan.sun.z);
    // where the sealed wall stood, two blocks past the far edge, on the ground
    const alongX = Math.abs(plan.sun.x - last.x) >= Math.abs(plan.sun.z - last.z);
    const wallSide = alongX ? Math.sign(plan.sun.x - last.x) : Math.sign(plan.sun.z - last.z);
    put(alongX ? last.x + wallSide * 3 : last.x, last.y, alongX ? last.z : last.z + wallSide * 3, true);
    t.update(0.1);
    expect(host.toast).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(plan.shapes.some(s => s.k === 'box' && s.m === MAT.sunseal)).toBe(false);
    expect((host.cue as ReturnType<typeof vi.fn>).mock.calls.every(([kind]) => kind === 'totality.hum')).toBe(true);
  });

  it('the realm records the entrance as a flag, and nothing else', () => {
    const set = { world: {} } as unknown as SkyRealmSet;
    const host = {
      fork: (...path: (string | number)[]) => new Rng(hashPath(3, path)),
      actors: () => ({}),
      debris: () => ({ spawn: () => 0 }),
    } as unknown as SkyHost;
    const realm = SkyRealm.create(host, new THREE.Group(), () => set);
    expect(realm.enteredUnity).toBe(false);
    realm.enterUnity();
    expect(realm.enteredUnity).toBe(true);
  });

  it('the seal is unbreakable: its material has infinite toughness', () => {
    const seal = MATERIALS.find(m => m.key === 'sunseal')!;
    expect(seal.id).toBe(42);
    expect(seal.hp).toBe(Infinity);
    expect(seal.tier).toBe(Infinity);
  });
});


describe('the Earth and the Sun (SKY.md §11)', () => {
  it('the Earth hangs below the void and shows only from the middle of Totality', () => {
    const root = new THREE.Group();
    const earth = new EarthView(root);
    earth.update({ x: 0, y: 500, z: 0 }, 0);
    expect(root.children[0].visible).toBe(true);
    expect(root.children[0].position.y).toBeLessThan(500);
    earth.update({ x: 0, y: 100, z: 0 }, 0);
    expect(root.children[0].visible).toBe(false);
    earth.dispose();
    expect(root.children.length).toBe(0);
  });

  it('the Sun stands above the solar approach and not below it', () => {
    const root = new THREE.Group();
    const sun = new SunView(root);
    sun.update({ x: 0, y: 800, z: 0 }, 0);
    expect(root.children[0].visible).toBe(true);
    expect(root.children[0].position.y).toBeGreaterThan(800);
    sun.update({ x: 0, y: 300, z: 0 }, 0);
    expect(root.children[0].visible).toBe(false);
    sun.dispose();
    expect(root.children.length).toBe(0);
  });
});
