// Sky floor 5, the horse's meadow (docs/architecture/SKY.md §7.4): for 50 seeds the floor respects its B6
// numbers, is climbable from the ground with nothing (the jump constants of physics/jump.ts), keeps its
// vertical route whole to the way up, never fades or opens a route cell, stays in its band, and is the
// same plan in any order of generation. Runs, not cubes: shapes < solid cells / 40.
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { AIR_CONTROL, apex, flight } from '../src/physics/jump';
import { horse } from '../src/sky/floors/horse';
import type { Link, Place, Shape, SkyFloorPlan, Vec3 } from '../src/sky/types';
import { boundsOf, covers } from '../src/sky/world/shapes';

const O: Vec3 = { x: 128, y: 194, z: 128 };
const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);
const plan = (seed: number, o: Vec3 = O): SkyFloorPlan => horse.generate(new Rng(seed), o);
const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Every cell a shape covers, with the last shape that covers it (the floor has no air shape). */
function solid(shapes: readonly Shape[]): Map<string, Shape> {
  const out = new Map<string, Shape>();
  for (const s of shapes) {
    const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
      if (covers(s, x, y, z)) out.set(key(x, y, z), s);
  }
  return out;
}
const tagOf = (s: Shape): number => ('tag' in s && s.tag) || 0;

/** The cells a place's extent covers along one axis: [lo, hi]. */
function span(p: Place, axis: 'x' | 'z'): [number, number] {
  const w = axis === 'x' ? p.w : p.d;
  const c = axis === 'x' ? p.x : p.z;
  const lo = c - ((w - 1) >> 1);
  return [lo, lo + w - 1];
}
/** Empty cells between two places (0 when they touch or overlap). */
function gap(a: Place, b: Place): number {
  const [ax0, ax1] = span(a, 'x'), [bx0, bx1] = span(b, 'x');
  const [az0, az1] = span(a, 'z'), [bz0, bz1] = span(b, 'z');
  const gx = Math.max(bx0 - ax1 - 1, ax0 - bx1 - 1, 0);
  const gz = Math.max(bz0 - az1 - 1, az0 - bz1 - 1, 0);
  return Math.max(gx, gz);
}
const byId = (p: SkyFloorPlan, id: number): Place => p.graph.places[id];

/** Place ids reachable from `from` over the links (every move of the nothing-carried climb). */
function reachable(p: SkyFloorPlan, from: number): Set<number> {
  const adj = new Map<number, number[]>();
  for (const l of p.graph.links) {
    adj.set(l.a, [...(adj.get(l.a) ?? []), l.b]);
    adj.set(l.b, [...(adj.get(l.b) ?? []), l.a]);
  }
  const seen = new Set<number>([from]), queue = [from];
  while (queue.length) {
    const at = queue.shift()!;
    for (const b of adj.get(at) ?? []) if (!seen.has(b)) { seen.add(b); queue.push(b); }
  }
  return seen;
}
const linked = (p: SkyFloorPlan, a: number, b: number): Link | undefined =>
  p.graph.links.find(l => (l.a === a && l.b === b) || (l.a === b && l.b === a));

describe('sky floor 5, the horse (SKY.md §7.4)', () => {
  it('the B6 numbers hold for 50 seeds: meadow, paddocks, runs, the mast', () => {
    for (const seed of SEEDS) {
      const p = plan(seed);
      const ring = p.shapes.find(s => s.k === 'ring');
      expect(ring && ring.k === 'ring' && ring.r1).toBe(30);

      const pads = p.extra?.paddocks ?? [];
      expect(pads).toHaveLength(6);
      for (const pad of pads) {
        expect([pad.w, pad.d]).toEqual([5, 5]);
        expect(pad.y - O.y).toBeGreaterThanOrEqual(0);
        expect(pad.y - O.y).toBeLessThanOrEqual(12);
      }
      for (const pad of pads) {
        const d = pads.filter(q => q !== pad).map(q => Math.hypot(q.x - pad.x, q.z - pad.z));
        expect(Math.min(...d)).toBeGreaterThanOrEqual(12);
        expect(Math.min(...d)).toBeLessThanOrEqual(20);
      }

      const runs = p.graph.places.filter(q => q.kind === 'segment');
      expect(runs).toHaveLength(19);
      for (const r of runs) expect([[3, 2], [2, 3], [2, 6]].some(([w, d]) => r.w === w && r.d === d)).toBe(true);
      expect(p.platforms.filter(t => t.fixed)).toHaveLength(11);

      const mast = p.shapes.find(s => s.k === 'ledges');
      expect(mast && mast.k === 'ledges' && mast.y1 - mast.y0).toBe(20);
    }
  });

  it('every link is a move the jump constants allow: a rise within one jump, a gap within its reach', () => {
    for (const seed of SEEDS) {
      const p = plan(seed);
      for (const l of p.graph.links) {
        const a = byId(p, l.a), b = byId(p, l.b);
        const rise = Math.abs(a.y - b.y), g = gap(a, b);
        if (l.move === 'walk') {
          // open ground may be crossed at any distance; a run is walked only when it touches
          expect(rise).toBe(0);
          expect(g === 0 || (a.y === O.y && b.y === O.y)).toBe(true);
        } else if (l.move === 'jump') {
          expect(rise).toBeLessThanOrEqual(apex(0, 1) + 1e-9);
          const reach = flight(rise, 1, AIR_CONTROL);
          expect(reach).toBeDefined();
          expect(g).toBeLessThanOrEqual(reach ?? 0);
        } else throw new Error(`unexpected move ${l.move}`);
      }
    }
  });

  it('with nothing, the ground reaches the seat, every paddock and the top of the mast (no build link)', () => {
    for (const seed of SEEDS) {
      const p = plan(seed);
      expect(p.graph.links.some(l => l.move === 'build')).toBe(false);
      expect(p.seat.kind).toBe('seat');
      expect(p.extra?.paddocks).toContain(p.seat);
      const from = p.route[0].id;
      const reached = reachable(p, from);
      expect(reached.has(p.seat.id)).toBe(true);
      for (const pad of p.extra?.paddocks ?? []) expect(reached.has(pad.id)).toBe(true);
      expect(reached.has(p.route[p.route.length - 1].id)).toBe(true);
    }
  });

  it('the vertical route is contiguous from the meadow to the way up', () => {
    for (const seed of SEEDS) {
      const p = plan(seed);
      expect(p.route[0].kind).toBe('ground');
      for (let i = 0; i + 1 < p.route.length; i++) {
        const l = linked(p, p.route[i].id, p.route[i + 1].id);
        expect(l?.move).toBe('jump');
        expect(Math.abs(p.route[i].y - p.route[i + 1].y)).toBe(1);
      }
      const top = p.route[p.route.length - 1];
      expect(Math.abs(top.x - p.gate.x)).toBeLessThanOrEqual(p.gate.r);
      expect(Math.abs(top.z - p.gate.z)).toBeLessThanOrEqual(p.gate.r);
      expect(top.y).toBe(O.y + 21);
      expect(p.y1 - top.y).toBe(2);
    }
  });

  it('no cell of the route is in a platform that fades, and nothing that fades stands on it', () => {
    for (const seed of SEEDS) {
      const p = plan(seed);
      const fixed = new Map(p.platforms.map(t => [t.tag, t.fixed] as const));
      const cells = solid(p.shapes);
      for (const r of p.route) {
        expect(r.tag === 0 || fixed.get(r.tag) === true).toBe(true);
        const s = cells.get(key(r.x, r.y, r.z));
        expect(s).toBeDefined();
        const t = s ? tagOf(s) : 0;
        expect(t === 0 || fixed.get(t) === true).toBe(true);
      }
    }
  });

  it('the hall stays inside its band and its radius', () => {
    for (const seed of SEEDS) {
      const p = plan(seed);
      for (const s of p.shapes) {
        const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
        expect(y0).toBeGreaterThanOrEqual(p.y0);
        expect(y1).toBeLessThan(p.y1);
        expect(x0).toBeGreaterThanOrEqual(O.x - 33);
        expect(x1).toBeLessThanOrEqual(O.x + 33);
        expect(z0).toBeGreaterThanOrEqual(O.z - 33);
        expect(z1).toBeLessThanOrEqual(O.z + 33);
      }
      expect(p.y0).toBe(O.y);
      expect(p.y1).toBe(O.y + 23);
    }
  });

  it('spawns are on the ground and nests on fixed segments: four nests, two spawns', () => {
    for (const seed of SEEDS) {
      const p = plan(seed);
      const fixed = new Map(p.platforms.map(t => [t.tag, t.fixed] as const));
      expect(p.spawns).toHaveLength(2);
      for (const s of p.spawns) expect(s.tag === 0).toBe(true);
      expect(p.nests).toHaveLength(4);
      for (const n of p.nests) expect(fixed.get(n.tag)).toBe(true);
    }
  });

  it('runs, not cubes: shapes < solid cells / 40 on every seed', () => {
    for (const seed of SEEDS) {
      const p = plan(seed);
      const cells = solid(p.shapes).size;
      expect(p.shapes.length).toBeLessThan(cells / 40);
    }
  });

  it('the seat is one of the three highest paddocks, and varies with the seed', () => {
    const seats = new Set<number>();
    for (const seed of SEEDS) {
      const p = plan(seed);
      expect([4, 6]).toContain(p.seat.y - O.y);
      seats.add(p.seat.id);
    }
    expect(seats.size).toBeGreaterThan(1);
  });

  it('the plan is the same in any order of generation and at any origin', () => {
    const forward = SEEDS.map(s => JSON.stringify(plan(s)));
    const backward = [...SEEDS].reverse().map(s => JSON.stringify(plan(s)));
    expect(backward.reverse()).toEqual(forward);

    const moved = plan(7, { x: O.x + 10, y: O.y, z: O.z - 5 });
    const base = plan(7);
    expect(moved.shapes.length).toBe(base.shapes.length);
    expect(moved.graph.places.length).toBe(base.graph.places.length);
    expect(moved.route[1].x - base.route[1].x).toBe(10);
    expect(moved.route[1].z - base.route[1].z).toBe(-5);
  });
});
