// Totality (docs/architecture/SKY.md §8): the strata, the reach envelope on J0's flight, the chain of hops
// (their rises, gaps, checkpoints, headroom and bounds), the sealed threshold, and the Earth and the Sun.

import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { MATERIALS, MAT } from '../src/content/materials';
import { Rng, hashPath } from '../src/core/rng';
import { AIR_CONTROL, flight, rise } from '../src/physics/jump';
import { buildTotality, CHAIN_RADIUS, CHECKPOINT_EVERY, footprint, gapBetween, HEADROOM, LAST_TOP, PLATFORMS, SPIRAL_RADIUS } from '../src/sky/totality/chain';
import { buildSkyTree, CROWN_Y } from '../src/sky/floors/tree';
import { maxGap, reach, reach2 } from '../src/sky/totality/reach';
import { STRATA, sizeAt, stratumAt } from '../src/sky/totality/strata';
import { Threshold } from '../src/sky/totality/threshold';
import { EarthView } from '../src/sky/render/earth';
import { SunView } from '../src/sky/render/sun';
import type { Place, SkyHost, SkyPlayer, TotalityPlan } from '../src/sky/types';

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

describe('the sealed threshold (SKY.md §8)', () => {
  it('a sun-seal gate, six high and five wide, stands ahead of the last checkpoint', () => {
    for (const seed of [1, 5, 8]) {
      const plan = planFor(seed);
      const last = plan.platforms[plan.platforms.length - 1], before = plan.platforms[plan.platforms.length - 2];
      const th = plan.threshold;
      const alongX = Math.abs(last.x - before.x) >= Math.abs(last.z - before.z);
      const gates = plan.shapes.filter(s => s.k === 'box' && s.m === MAT.sunseal && s.y0 === last.y);
      expect(gates.length).toBe(1);
      const wall = plan.shapes.find(s => s.k === 'box' && s.m === MAT.sunseal && s.y1 === last.y + 5)!;
      expect(wall).toBeDefined();
      if (wall.k !== 'box') throw new Error('gate');
      if (alongX) {
        expect(wall.x0).toBe(wall.x1);
        expect(Math.sign(wall.x0 - last.x)).toBe(Math.sign(th.x - last.x));
        expect(wall.z1 - wall.z0 + 1).toBe(5);
      } else {
        expect(wall.z0).toBe(wall.z1);
        expect(wall.x1 - wall.x0 + 1).toBe(5);
      }
      expect(wall.y1 - wall.y0 + 1).toBe(6);
      expect(th.y).toBe(last.y);
    }
  });

  it('the seal is unbreakable: its material has infinite toughness', () => {
    const seal = MATERIALS.find(m => m.key === 'sunseal')!;
    expect(seal.id).toBe(42);
    expect(seal.hp).toBe(Infinity);
    expect(seal.tier).toBe(Infinity);
  });

  it('touching the gate shows the refusal and pushes the player back, once per approach, and nothing opens', () => {
    const plan = planFor(1);
    const th = plan.threshold;
    const last = plan.platforms[plan.platforms.length - 1], before = plan.platforms[plan.platforms.length - 2];
    const alongX = Math.abs(last.x - before.x) >= Math.abs(last.z - before.z);
    const side = alongX ? Math.sign(th.x - last.x) : Math.sign(th.z - last.z);
    const body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
    const push = vi.fn();
    const host = {
      player: () => ({ body, push } as unknown as SkyPlayer),
      toast: vi.fn(),
      cue: vi.fn(),
      fx: vi.fn(),
    } as unknown as SkyHost;
    const sealedBefore = JSON.stringify(plan.shapes);
    const t = new Threshold(host, plan);
    // far back on the checkpoint: nothing
    Object.assign(body, { x: last.x, y: last.y, z: last.z });
    t.update(0.1);
    expect([t.touched, (host.toast as ReturnType<typeof vi.fn>).mock.calls.length]).toEqual([false, 0]);
    // at the wall: the refusal, the push back toward the checkpoint
    Object.assign(body, { x: th.x - side * 0.9, y: th.y, z: th.z });
    t.update(0.1);
    expect(t.touched).toBe(true);
    expect(host.toast).toHaveBeenCalledWith('toast.sunClosed');
    expect(push).toHaveBeenCalledTimes(1);
    const [vx] = push.mock.calls[0];
    expect(Math.sign(vx)).toBe(-side);
    // still at the wall: no second refusal while it lasts
    t.update(0.1);
    expect(host.toast).toHaveBeenCalledTimes(1);
    // nothing in the plan changed
    expect(JSON.stringify(plan.shapes)).toBe(sealedBefore);
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
