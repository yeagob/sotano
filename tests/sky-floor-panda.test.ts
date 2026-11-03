// Sky floor 1, the panda (docs/architecture/SKY.md §7.4; docs/design/not-built/sky/guardians/PANDA.md B6). For fifty seeds:
// the B6 sizes, the routes with nothing (walk, step, jump, drop) and with a cube per step, every link inside the
// jump numbers, the vertical route contiguous to the way up, no route cell fadable or openable, two clear cells
// above every standing place, the spawns and nests on fixed places, the shape budget, and the same plan in any order.

import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { AIR_CONTROL, flight } from '../src/physics/jump';
import { panda } from '../src/sky/floors/panda';
import { SKY_FLOORS } from '../src/sky/floors';
import type { Link, Place, PlatformTag, Shape, SkyFloorPlan } from '../src/sky/types';
import { boundsOf, covers } from '../src/sky/world/shapes';

const O = { x: 128, y: 36, z: 128 };
const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);
/** The shot's straight reach to the seat (B8: about 8 blocks). */
const SHOT_REACH = 8;
/** The margin the brief keeps on every jump (docs/architecture/SKY.md §8: real apex 1.19 against the formula's 1.26). */
const MARGIN = 0.8;

type Mv = 'walk' | 'step' | 'jump' | 'drop' | 'build';

/** The cells a place's footprint covers (x0..x1, z0..z1); w and d are at least 1 and the place is centred on (x, z) as the floors give it. */
function rect(p: Place) {
  const x0 = p.x - ((p.w - 1) >> 1), z0 = p.z - ((p.d - 1) >> 1);
  return { x0, x1: x0 + p.w - 1, z0, z1: z0 + p.d - 1 };
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

/** How a traversal from `a` to `b` may be made, or null. A build is a link the floor marks as one (a placed cube). */
function move(a: Place, b: Place, link?: Link): Mv | null {
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
    if (link?.move === 'build' && dy <= 2 && g <= 2) return 'build';
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

/** Breadth-first search over the links, both ways, with the moves allowed. Returns the places on the path, or null. */
function search(plan: SkyFloorPlan, starts: number[], goal: (p: Place) => boolean, opts: { builds: boolean; without?: Set<number> }): number[] | null {
  const { places, links } = plan.graph;
  const byId = new Map(places.map(p => [p.id, p]));
  const next = new Map<number, [number, Link][]>();
  for (const l of links) {
    (next.get(l.a) ?? next.set(l.a, []).get(l.a)!).push([l.b, l]);
    (next.get(l.b) ?? next.set(l.b, []).get(l.b)!).push([l.a, l]);
  }
  const prev = new Map<number, number>();
  const queue = starts.filter(s => !opts.without?.has(s));
  for (const s of queue) prev.set(s, -1);
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    const p = byId.get(cur)!;
    if (goal(p)) {
      const path = [cur];
      while (prev.get(path[0]) !== -1) path.unshift(prev.get(path[0])!);
      return path;
    }
    for (const [to, l] of next.get(cur) ?? []) {
      if (prev.has(to) || opts.without?.has(to)) continue;
      const m = move(p, byId.get(to)!, l);
      if (m === null || (m === 'build' && !opts.builds)) continue;
      prev.set(to, cur);
      queue.push(to);
    }
  }
  return null;
}

/** The builds on a path: each traversal that needs a placed cube. */
function buildsOn(plan: SkyFloorPlan, path: number[]): number {
  const byId = new Map(plan.graph.places.map(p => [p.id, p]));
  let n = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const a = byId.get(path[i])!, b = byId.get(path[i + 1])!;
    const l = plan.graph.links.find(k => (k.a === a.id && k.b === b.id) || (k.a === b.id && k.b === a.id));
    if (move(a, b, l) === 'build') n++;
  }
  return n;
}

const ground = (plan: SkyFloorPlan) => plan.graph.places.filter(p => p.kind === 'ground' && p.y === plan.y0).map(p => p.id);
const shotGoal = (plan: SkyFloorPlan) => (p: Place) => Math.hypot(p.x - plan.seat.x, p.z - plan.seat.z, p.y - plan.seat.y) <= SHOT_REACH;
const planFor = (seed: number, o = O) => panda.generate(new Rng(seed), o);

describe('sky floor 1, the panda (SKY.md §7.4)', () => {
  it('is the first of the five floors, with the B6 radius and height', () => {
    expect(SKY_FLOORS[0]).toBe(panda);
    const plan = planFor(1);
    expect([plan.index, plan.animal, plan.y0, plan.y1]).toEqual([1, 'panda', O.y, O.y + 28]);
  });

  it('keeps every shape inside the B6 radius of 20 and the hall\'s band (no cell below the ground or above the height)', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      for (const s of plan.shapes) {
        const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
        expect(Math.max(O.x - x0, x1 - O.x, O.z - z0, z1 - O.z), `${s.k} radius`).toBeLessThanOrEqual(20);
        expect(y0, `${s.k} floor`).toBeGreaterThanOrEqual(O.y);
        expect(y1, `${s.k} height`).toBeLessThanOrEqual(O.y + 27);
      }
    }
  });

  it('has the Bamboo Seat, 3 × 3, its top at 24 in the centre', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      expect(plan.seat.kind).toBe('seat');
      expect([plan.seat.x, plan.seat.y, plan.seat.z, plan.seat.w, plan.seat.d]).toEqual([O.x, O.y + 24, O.z, 3, 3]);
      for (const [x, z] of [[O.x - 1, O.z - 1], [O.x + 1, O.z + 1]]) {
        expect(solidAt(plan.shapes, x, O.y + 23, z)).toBe(true);
        expect(solidAt(plan.shapes, x, O.y + 24, z)).toBe(false);
      }
    }
  });

  it('reaches the seat from the ground with nothing but walk, step, jump and drop', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const path = search(plan, ground(plan), shotGoal(plan), { builds: false });
      expect(path, `seed ${seed}`).not.toBeNull();
    }
  });

  it('every link is one the jump numbers allow (a build only as a placed cube, one step of two)', () => {
    const plan = planFor(1);
    const byId = new Map(plan.graph.places.map(p => [p.id, p]));
    for (const l of plan.graph.links) {
      const a = byId.get(l.a)!, b = byId.get(l.b)!;
      if (l.move === 'build') {
        const lo = a.y <= b.y ? a : b, hi = lo === a ? b : a;
        expect(move(lo, hi, l), `${l.a}→${l.b}`).toBe('build');
      } else {
        expect(move(a, b, l) ?? move(b, a, l), `${l.move} ${l.a}→${l.b}`).not.toBeNull();
      }
    }
  });

  it('climbs the gentle path to its last column with jumps alone (no ledge, no cube)', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const ledges = new Set(plan.route.map(p => p.id).filter(id => id !== plan.route[0].id));
      const top = plan.graph.places.find(p => p.kind === 'top' && p.y === O.y + 16 && p.x === O.x - 6 && p.z === O.z)!;
      const path = search(plan, ground(plan), p => p.id === top.id, { builds: false, without: ledges });
      expect(path, `seed ${seed}`).not.toBeNull();
    }
  });

  it('climbs the building path with one cube per step, and the nests on the way hold enough cubes', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const top = plan.graph.places.find(p => p.kind === 'top' && p.y === O.y + 16 && p.x === O.x + 11)!;
      const foot = plan.nests[0];
      const path = search(plan, [foot.id], p => p.id === top.id, { builds: true });
      expect(path, `seed ${seed}`).not.toBeNull();
      const cubes = buildsOn(plan, path!);
      // three cubes per nest on the way: the foot's own nest, and every nest the ground reaches with nothing
      const onTheWay = new Set<number>([foot.id]);
      for (const n of plan.nests) {
        if (search(plan, ground(plan), p => p.id === n.id, { builds: false }) !== null) onTheWay.add(n.id);
      }
      expect(cubes, `seed ${seed}`).toBeLessThanOrEqual(3 * onTheWay.size);
    }
  });

  it('keeps the vertical route contiguous from the ground to a place under the way up', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const byId = new Map(plan.graph.places.map(p => [p.id, p]));
      const route = plan.route;
      expect(route[0].y).toBe(O.y);
      for (let i = 0; i + 1 < route.length; i++) {
        expect(move(route[i], route[i + 1]), `route ${i}`).toBe('step');
        expect(route[i + 1].y - route[i].y).toBe(1);
      }
      const top = route[route.length - 1];
      expect(top.y).toBe(plan.seat.y);
      expect(Math.abs(top.x - plan.gate.x) <= plan.gate.r && Math.abs(top.z - plan.gate.z) <= plan.gate.r, 'under the way up').toBe(true);
      expect(byId.size).toBe(plan.graph.places.length);
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
        if (p.kind === 'ground' || p.kind === 'spawn' || p.kind === 'nest') continue;
        expect(solidAt(plan.shapes, p.x, p.y + 1, p.z), `${p.kind} headroom 1`).toBe(false);
        expect(solidAt(plan.shapes, p.x, p.y + 2, p.z), `${p.kind} headroom 2`).toBe(false);
      }
    }
  });

  it('places the minion spawns and the nests on fixed places only (no platform that fades)', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const fixed = new Set(plan.platforms.filter(t => t.fixed).map(t => t.tag));
      expect(plan.spawns).toHaveLength(2);
      expect(plan.nests).toHaveLength(3);
      for (const p of [...plan.spawns, ...plan.nests]) {
        expect(p.tag === 0 || fixed.has(p.tag), `${p.kind} tag ${p.tag}`).toBe(true);
      }
      // the two spawns are on opposite sides of the seat
      expect([plan.spawns[0].x - O.x, plan.spawns[1].x - O.x].map(Math.sign)).toEqual([-1, 1]);
    }
  });

  it('keeps the platforms the hindrances may act on away from the routes', () => {
    const plan = planFor(1);
    const platforms: PlatformTag[] = plan.platforms;
    expect(platforms.filter(t => !t.fixed).length).toBe(8);
    for (const t of platforms) expect(plan.graph.places[t.place].tag).toBe(t.tag);
  });

  it('keeps the shapes few: fewer than solid cells / 40, and no two shapes share a cell', () => {
    for (const seed of SEEDS) {
      const plan = planFor(seed);
      const cells = new Set<string>();
      let overlap = 0;
      for (const s of plan.shapes) {
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

  it('is built from the bamboo of its floor, with the building path in skywood', () => {
    const plan = planFor(1);
    const mats = new Set(plan.shapes.map(s => (s as { m: number }).m));
    expect([...mats].sort()).toEqual([MAT.bamboo, MAT.skywood].sort());
  });
});
