// Sky floor 3, the elephant (docs/architecture/SKY.md §7.4; docs/design/not-built/sky/guardians/ELEPHANT.md B6 as resolved).
// For fifty seeds: the B6 sizes, the water in the Basin and the waterhole, the route with nothing (walk, step, jump,
// drop) from the ground to the shot reach of the seat, every link inside the jump numbers, the vertical route
// contiguous to the way up, no route cell fadable or openable, headroom above every standing place, the spawn and
// the nests on fixed places, the shape budget, and the same plan in any order.

import { describe, expect, it } from 'vitest';
import { EL_WATER, SOURCE, elemByte } from '../src/content/elements';
import { AIR, MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { AIR_CONTROL, flight } from '../src/physics/jump';
import { elephant } from '../src/sky/floors/elephant';
import { SKY_FLOORS } from '../src/sky/floors';
import type { Place, PlatformTag, Shape, SkyFloorPlan } from '../src/sky/types';
import { boundsOf, covers } from '../src/sky/world/shapes';

const O = { x: 128, y: 110, z: 128 };
const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);
/** The shot's straight reach to the seat (B8: about 8 blocks). */
const SHOT_REACH = 8;
/** The margin the brief keeps on every jump (SKY.md §8: real apex 1.19 against the formula's 1.26). */
const MARGIN = 0.8;
const WATER = elemByte(EL_WATER, SOURCE);

type Mv = 'walk' | 'step' | 'jump' | 'drop';

/** The cells a place's footprint covers (1 × 1 here). */
function rect(p: Place) {
  return { x0: p.x, x1: p.x, z0: p.z, z1: p.z };
}

/** The empty cells between two footprints, measured in the plane: the gap a jump must cross. */
function gapOf(a: Place, b: Place): number {
  const A = rect(a), B = rect(b);
  const gx = Math.max(0, B.x0 - A.x1 - 1, A.x0 - B.x1 - 1);
  const gz = Math.max(0, B.z0 - A.z1 - 1, A.z0 - B.z1 - 1);
  return Math.hypot(gx, gz);
}

/** The jump numbers' reach for a height change, with the margin (undefined when no jump reaches it). */
const reach = (dy: number) => { const f = flight(dy, 1, AIR_CONTROL, { start: 1 }); return f === undefined ? undefined : f * MARGIN; };

/** How a traversal from `a` to `b` may be made, or null. */
function move(a: Place, b: Place): Mv | null {
  const dy = b.y - a.y, g = gapOf(a, b);
  if (dy === 0) {
    if (g === 0) return 'walk';
    const r = reach(0);
    return r !== undefined && g <= r ? 'jump' : null;
  }
  if (dy > 0) {
    if (dy === 1 && g === 0) return 'step';
    const r = reach(dy);
    if (dy <= 1 && r !== undefined && g <= r) return 'jump';
    return null;
  }
  const r = reach(dy);
  return r !== undefined && g <= r ? 'drop' : null;
}

/** The block (not an element) that fills a cell: the last block shape covering it, or null. */
function blockAt(shapes: readonly Shape[], x: number, y: number, z: number): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (s.k !== 'elem' && covers(s, x, y, z)) return s;
  }
  return null;
}
const solidAt = (shapes: readonly Shape[], x: number, y: number, z: number) => {
  const s = blockAt(shapes, x, y, z);
  return s !== null && (s as { m: number }).m !== AIR;
};
const tagAt = (shapes: readonly Shape[], x: number, y: number, z: number) => {
  const s = blockAt(shapes, x, y, z);
  return s !== null && 'tag' in s ? (s.tag ?? 0) : 0;
};
/** The element byte a cell holds where its block is air (the last element shape covering it), or 0. */
function elemAt(shapes: readonly Shape[], x: number, y: number, z: number): number {
  let byte = 0;
  for (const s of shapes) if (s.k === 'elem' && covers(s, x, y, z)) byte = s.byte;
  return byte;
}

/** Breadth-first search over the links, both ways. Returns the places on the path, or null. */
function search(plan: SkyFloorPlan, starts: number[], goal: (p: Place) => boolean): number[] | null {
  const { places, links } = plan.graph;
  const byId = new Map(places.map(p => [p.id, p]));
  const next = new Map<number, number[]>();
  for (const l of links) {
    (next.get(l.a) ?? next.set(l.a, []).get(l.a)!).push(l.b);
    (next.get(l.b) ?? next.set(l.b, []).get(l.b)!).push(l.a);
  }
  const prev = new Map<number, number>();
  const queue = [...starts];
  for (const s of queue) prev.set(s, -1);
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    const p = byId.get(cur)!;
    if (goal(p)) {
      const path = [cur];
      while (prev.get(path[0]) !== -1) path.unshift(prev.get(path[0])!);
      return path;
    }
    for (const to of next.get(cur) ?? []) {
      if (prev.has(to)) continue;
      if (move(p, byId.get(to)!) === null) continue;
      prev.set(to, cur);
      queue.push(to);
    }
  }
  return null;
}

const ground = (plan: SkyFloorPlan) => plan.graph.places.filter(p => p.kind === 'ground' && p.y === O.y + 2).map(p => p.id);
const shotGoal = (plan: SkyFloorPlan) => (p: Place) => Math.hypot(p.x - plan.seat.x, p.z - plan.seat.z, p.y - plan.seat.y) <= SHOT_REACH;
const planFor = (seed: number, o = O) => elephant.generate(new Rng(seed), o);

describe('sky floor 3, the elephant (SKY.md §7.4)', () => {
  it('is the third of the five floors, with the B6 radius and height', () => {
    expect(SKY_FLOORS[2]).toBe(elephant);
    const plan = planFor(1);
    expect([plan.index, plan.animal, plan.y0, plan.y1]).toEqual([3, 'elephant', O.y, O.y + 33]);
  });

  it('keeps every shape inside the B6 radius of 24 and the floor\'s band (heights 0 to 33)', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      for (const s of plan.shapes) {
        const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
        expect(Math.max(O.x - x0, x1 - O.x, O.z - z0, z1 - O.z), `${s.k} radius`).toBeLessThanOrEqual(24);
        expect(y0, `${s.k} floor`).toBeGreaterThanOrEqual(O.y);
        expect(y1, `${s.k} height`).toBeLessThanOrEqual(O.y + 33);
      }
    }
  });

  it('stands the ground at height 2 on a two-block base, and the rings rise 6 at a time to the Basin at 26', () => {
    const plan = planFor(1);
    const at = (dx: number, dz: number, h: number) => solidAt(plan.shapes, O.x + dx, O.y + h, O.z + dz);
    expect(at(22, 0, 1)).toBe(true);
    expect(at(22, 0, 2)).toBe(false);
    expect(at(16, 0, 7)).toBe(true);
    expect(at(16, 0, 8)).toBe(false);
    expect(at(12, 0, 13)).toBe(true);
    expect(at(8, 0, 19)).toBe(true);
    expect(at(4, 0, 25)).toBe(true);
    expect(at(4, 0, 26)).toBe(false);
  });

  it('cuts the Basin\'s pool 2 deep into the mesa, filled with water to the shore\'s level', () => {
    const plan = planFor(1);
    for (const [dx, dz] of [[0, 0], [2, 1], [-3, 0], [0, 3]]) {
      expect(solidAt(plan.shapes, O.x + dx, O.y + 25, O.z + dz), `pool ${dx},${dz}`).toBe(false);
      expect(elemAt(plan.shapes, O.x + dx, O.y + 25, O.z + dz), `pool water ${dx},${dz}`).toBe(WATER);
      expect(elemAt(plan.shapes, O.x + dx, O.y + 24, O.z + dz)).toBe(WATER);
    }
    expect(solidAt(plan.shapes, O.x + 4, O.y + 25, O.z)).toBe(true);
    expect(elemAt(plan.shapes, O.x + 4, O.y + 25, O.z)).toBe(0);
  });

  it('builds the rim at radius 4, 2 high on the shore, with a spout on each axis at its lower row', () => {
    const plan = planFor(1);
    expect(plan.extra?.rim).toEqual({ x0: O.x - 4, y0: O.y + 26, z0: O.z - 4, x1: O.x + 4, y1: O.y + 27, z1: O.z + 4 });
    expect(solidAt(plan.shapes, O.x + 4, O.y + 26, O.z)).toBe(false);
    expect(solidAt(plan.shapes, O.x + 4, O.y + 27, O.z)).toBe(true);
    expect(solidAt(plan.shapes, O.x, O.y + 26, O.z - 4)).toBe(false);
    expect(solidAt(plan.shapes, O.x + 3, O.y + 26, O.z + 3)).toBe(true);
  });

  it('has the Basin\'s seat on the water line, the deity\'s place above the pool', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      expect(plan.seat.kind).toBe('seat');
      expect([plan.seat.x, plan.seat.y, plan.seat.z]).toEqual([O.x, O.y + 26, O.z]);
      expect(solidAt(plan.shapes, plan.seat.x, plan.seat.y, plan.seat.z)).toBe(false);
    }
  });

  it('cuts the waterhole 2 deep into the base on the ground ring, opposite the tusk line, filled to the ground\'s level', () => {
    const plan = planFor(1);
    const wx = O.x - 15, wz = O.z - 15;
    expect(Math.hypot(wx - O.x, wz - O.z)).toBeGreaterThan(19);
    expect(Math.hypot(wx - O.x, wz - O.z)).toBeLessThan(24);
    expect(elemAt(plan.shapes, wx, O.y, wz)).toBe(WATER);
    expect(elemAt(plan.shapes, wx, O.y + 1, wz)).toBe(WATER);
    expect(solidAt(plan.shapes, wx, O.y, wz)).toBe(false);
    expect(solidAt(plan.shapes, wx, O.y + 1, wz)).toBe(false);
    expect(solidAt(plan.shapes, wx, O.y - 0, wz + 2)).toBe(false);
    expect(plan.spawns).toHaveLength(1);
    expect([plan.spawns[0].x, plan.spawns[0].y, plan.spawns[0].z]).toEqual([wx, O.y + 2, wz]);
  });

  it('lays the tusk line on the (+, +) diagonal in five strips, dry, with the top ledge at 33', () => {
    const plan = planFor(1);
    const ledges = plan.shapes.filter(s => s.k === 'ledges');
    expect(ledges).toHaveLength(5);
    expect(ledges.map(s => s.k === 'ledges' ? [s.y0 - O.y, s.y1 - O.y] : null)).toEqual([[2, 7], [8, 13], [14, 19], [20, 25], [26, 33]]);
    expect(plan.gate).toEqual({ x: plan.route[plan.route.length - 1].x, z: plan.route[plan.route.length - 1].z, r: 1 });
    expect(plan.route[plan.route.length - 1].y).toBe(O.y + 34);
  });

  it('reaches the seat from the ground with nothing but walk, step, jump and drop', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const path = search(plan, ground(plan), shotGoal(plan));
      expect(path, `seed ${seed}`).not.toBeNull();
    }
  });

  it('every link is one the jump numbers allow', () => {
    const plan = planFor(1);
    const byId = new Map(plan.graph.places.map(p => [p.id, p]));
    for (const l of plan.graph.links) {
      const a = byId.get(l.a)!, b = byId.get(l.b)!;
      expect(move(a, b) ?? move(b, a), `${l.move} ${l.a}→${l.b}`).not.toBeNull();
    }
  });

  it('keeps the vertical route contiguous from the ground foot to a place under the way up', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const route = plan.route;
      expect(route[0].kind).toBe('ground');
      expect(route[0].y).toBe(O.y + 2);
      for (let i = 0; i + 1 < route.length; i++) {
        expect(move(route[i], route[i + 1]), `route ${i}`).not.toBeNull();
      }
      const top = route[route.length - 1];
      expect(top.y).toBe(O.y + 34);
      expect(Math.abs(top.x - plan.gate.x) <= plan.gate.r && Math.abs(top.z - plan.gate.z) <= plan.gate.r, 'under the way up').toBe(true);
    }
  });

  it('keeps every route cell unfadable and unopenable: its block is no platform, or a fixed one', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const fixed = new Set(plan.platforms.filter(t => t.fixed).map(t => t.tag));
      for (const p of plan.route) {
        const t = tagAt(plan.shapes, p.x, p.y - 1, p.z);
        expect(t === 0 || fixed.has(t), `route cell ${p.x},${p.y},${p.z} tag ${t}`).toBe(true);
      }
    }
  });

  it('keeps two cells of headroom above every standing place, and no place inside a block', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      for (const p of plan.graph.places) {
        expect(solidAt(plan.shapes, p.x, p.y, p.z), `${p.kind} ${p.x},${p.y},${p.z} is inside a block`).toBe(false);
        if (p.kind === 'spawn' || p.kind === 'nest') continue;
        expect(solidAt(plan.shapes, p.x, p.y + 1, p.z), `${p.kind} headroom 1`).toBe(false);
        expect(solidAt(plan.shapes, p.x, p.y + 2, p.z), `${p.kind} headroom 2`).toBe(false);
      }
    }
  });

  it('places the spawn and the nests on fixed places only (no platform that fades)', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const fixed = new Set(plan.platforms.filter(t => t.fixed).map(t => t.tag));
      expect(plan.spawns).toHaveLength(1);
      expect(plan.nests).toHaveLength(5);
      for (const p of [...plan.spawns, ...plan.nests]) {
        expect(p.tag === 0 || fixed.has(p.tag), `${p.kind} tag ${p.tag}`).toBe(true);
      }
      for (const p of plan.nests) expect(solidAt(plan.shapes, p.x, p.y - 1, p.z), `nest ${p.x},${p.y},${p.z} stands on a block`).toBe(true);
    }
  });

  it('keeps the shapes few: fewer than solid cells / 40, and no two shapes share a cell', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const cells = new Set<string>();
      let overlap = 0;
      for (const s of plan.shapes) {
        // carves (air) and elements are not solid: a carve is meant to cut the shape under it
        if (s.k === 'elem' || (s as { m?: number }).m === AIR) continue;
        const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
        for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          if (!covers(s, x, y, z)) continue;
          const key = `${x},${y},${z}`;
          if (cells.has(key)) overlap++;
          cells.add(key);
        }
      }
      expect(overlap, `seed ${seed}`).toBe(0);
      expect(plan.shapes.length, `seed ${seed}`).toBeLessThan(cells.size / 40);
    }
  });

  it('gives the same plan in any order of generation (the floor draws nothing from the seed)', () => {
    const forward = SEEDS.map(seed => JSON.stringify(planFor(seed)));
    const backward = [...SEEDS].reverse().map(seed => JSON.stringify(planFor(seed)));
    expect(backward.reverse()).toEqual(forward);
    expect(new Set(forward).size).toBe(1);
  });

  it('is built from the pale stone of its rings, the fencewood of its rim and the skywood of its tusk line', () => {
    const plan = planFor(1);
    const mats = new Set(plan.shapes.filter(s => s.k !== 'elem').map(s => (s as { m: number }).m));
    expect([...mats].sort()).toEqual([AIR, MAT.palestone, MAT.fencewood, MAT.skywood].sort());
  });

  it('keeps the platforms all fixed on this floor, the ground ring and the rings alike', () => {
    const plan = planFor(1);
    const platforms: PlatformTag[] = plan.platforms;
    expect(platforms.map(t => t.tag)).toEqual([1, 2, 3, 4, 5]);
    expect(platforms.every(t => t.fixed)).toBe(true);
  });
});
