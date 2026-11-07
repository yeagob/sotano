// Sky floor 2, the koala's (docs/architecture/SKY.md §7.4; docs/design/not-built/sky/guardians/KOALA.md, B6):
// the layout respects its B6 numbers, a route with nothing in the hand reaches the Fork, the vertical
// route is contiguous to the gate, no route cell fades, every place stands on solid with headroom,
// the spiral's rise and gaps hold, spawns and nests sit on fixed places, the plan is the same in any
// order of generation, and the shapes stay sparse. Checked on 50 seeds.

import { describe, expect, it } from 'vitest';
import { AIR } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { koala } from '../src/sky/floors/koala';
import { SKY_FLOORS } from '../src/sky/floors';
import type { Place, Shape, SkyFloorPlan, Vec3 } from '../src/sky/types';
import { boundsOf, covers } from '../src/sky/world/shapes';

const O: Vec3 = { x: 128, y: 71, z: 128 };
const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);
const gen = (seed: number, o: Vec3 = O): SkyFloorPlan => koala.generate(new Rng(seed), o);

/** The block and the platform tag of a cell, read from the shapes in their order (air carves). */
function voxel(shapes: readonly Shape[]) {
  return (x: number, y: number, z: number): { m: number; tag: number } => {
    let m = AIR, tag = 0;
    for (const s of shapes) {
      const b = boundsOf(s);
      if (x < b[0] || y < b[1] || z < b[2] || x > b[3] || y > b[4] || z > b[5]) continue;
      if (s.k === 'elem' || !covers(s, x, y, z)) continue;
      m = s.m;
      tag = m === AIR ? 0 : ('tag' in s && s.tag !== undefined ? s.tag : 0);
    }
    return { m, tag };
  };
}

const solid = (v: ReturnType<typeof voxel>, x: number, y: number, z: number) => v(x, y, z).m !== AIR;
const fixedTags = (plan: SkyFloorPlan) => new Set<number>(plan.platforms.filter(p => p.fixed).map(p => p.tag));
const byId = (plan: SkyFloorPlan) => new Map<number, Place>(plan.graph.places.map(p => [p.id, p]));

/** A place stands on solid, with air on its cell and on the cells above (`headroom` of them). */
function standable(v: ReturnType<typeof voxel>, p: Place, headroom: number): boolean {
  if (!solid(v, p.x, p.y - 1, p.z)) return false;
  for (let h = 0; h <= headroom; h++) if (solid(v, p.x, p.y + h, p.z)) return false;
  return true;
}

describe('sky floor 2, the koala', () => {
  it('is the second of the five floors, with the B6 radius and height', () => {
    expect(koala.index).toBe(2);
    expect(koala.animal).toBe('koala');
    expect(koala.radius).toBe(22);
    expect(koala.height).toBe(32);
    expect(SKY_FLOORS[1]).toBe(koala);
    const plan = gen(1);
    expect(plan.index).toBe(2);
    expect(plan.animal).toBe('koala');
    expect(plan.y0).toBe(O.y);
    expect(plan.y1).toBe(O.y + 35);
  });

  it('keeps every shape inside its hall band and the moss inside the radius', () => {
    for (const seed of SEEDS) {
      const plan = gen(seed);
      for (const s of plan.shapes) {
        const b = boundsOf(s);
        expect(b[1]).toBeGreaterThanOrEqual(plan.y0);
        expect(b[4]).toBeLessThanOrEqual(plan.y1);
        expect(b[0]).toBeGreaterThanOrEqual(O.x - 25);
        expect(b[3]).toBeLessThanOrEqual(O.x + 25);
        expect(b[2]).toBeGreaterThanOrEqual(O.z - 25);
        expect(b[5]).toBeLessThanOrEqual(O.z + 25);
      }
      const moss = plan.shapes[0];
      expect(moss.k === 'ring' && moss.r1).toBe(22);
    }
  });

  it('has four 2 by 2 trunks at 14 from the centre, rising from the moss to row 33', () => {
    const plan = gen(3);
    const v = voxel(plan.shapes);
    const g = O.y;
    const trunks: [number, number][] = [[O.x + 14, O.z - 1], [O.x - 14, O.z - 1], [O.x - 1, O.z + 14], [O.x - 1, O.z - 14]];
    // the trunks are 2 by 2 blocks on the tree's rows 1 to 33 (the east and west trunks: x 14–15, z −1 to 0)
    for (const [x, z] of trunks) {
      expect(solid(v, x, g + 1, z)).toBe(true);
      expect(solid(v, x, g + 33, z)).toBe(true);
      expect(solid(v, x, g + 34, z)).toBe(false);
    }
    // the knots: one ledge per row on the outer face
    expect(plan.shapes.filter(s => s.k === 'ledges').length).toBe(4);
    // the moss: solid at row 0 across the disc, open above the centre down to it
    expect(solid(v, O.x, g, O.z)).toBe(true);
    for (let r = 1; r <= 27; r++) for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) {
      if (dx * dx + dz * dz > 64) continue;
      expect(solid(v, O.x + dx, g + r, O.z + dz)).toBe(false);
    }
  });

  it('puts the Fork at 30, its limbs at 28 from the trunks, and a tunnel to each limb', () => {
    const plan = gen(4);
    const v = voxel(plan.shapes);
    const g = O.y;
    expect(plan.seat.kind).toBe('seat');
    expect(plan.seat.y).toBe(g + 30);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) expect(solid(v, O.x + dx, g + 29, O.z + dz)).toBe(true);
    // the east limb runs from the Fork's edge (x 130) to the trunk (x 141), on row 28
    expect(solid(v, O.x + 2, g + 28, O.z)).toBe(true);
    expect(solid(v, O.x + 13, g + 28, O.z)).toBe(true);
    // the tunnel is air on rows 29–31 in the trunk's inner column
    expect(solid(v, O.x + 14, g + 29, O.z)).toBe(false);
    expect(solid(v, O.x + 15, g + 31, O.z)).toBe(false);
    expect(solid(v, O.x + 15, g + 32, O.z)).toBe(true);
  });

  it('gives every place a solid floor and air above it, and three blocks of headroom on the route', () => {
    for (const seed of SEEDS) {
      const plan = gen(seed);
      const v = voxel(plan.shapes);
      const onRoute = new Set(plan.route.map(p => p.id));
      for (const p of plan.graph.places) {
        expect(standable(v, p, onRoute.has(p.id) ? 2 : 1)).toBe(true);
      }
    }
  });

  it('keeps the vertical route contiguous from the ground to the gate, all of it fixed', () => {
    for (const seed of SEEDS) {
      const plan = gen(seed);
      const v = voxel(plan.shapes);
      const fixed = fixedTags(plan);
      const linked = new Set(plan.graph.links.map(l => `${Math.min(l.a, l.b)}-${Math.max(l.a, l.b)}`));
      for (let i = 0; i + 1 < plan.route.length; i++) {
        const a = plan.route[i], b = plan.route[i + 1];
        expect(linked.has(`${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`)).toBe(true);
      }
      expect(plan.route[0].kind).toBe('ground');
      const top = plan.route[plan.route.length - 1];
      expect(top.kind).toBe('top');
      expect(Math.hypot(top.x - plan.gate.x, top.z - plan.gate.z)).toBeLessThanOrEqual(plan.gate.r);
      expect(top.y).toBe(O.y + 34);
      for (const p of plan.route) {
        const t = v(p.x, p.y, p.z).tag;
        expect(t === 0 || fixed.has(t)).toBe(true);
      }
    }
  });

  it('reaches the Fork with nothing in the hand, by walk, step, climb, jump and drop links only', () => {
    const jumpLift = 1.26; // a ground jump rises 1.26 blocks (physics/jump.ts)
    for (const seed of SEEDS) {
      const plan = gen(seed);
      const at = byId(plan);
      const adj = new Map<number, number[]>();
      for (const l of plan.graph.links) {
        const a = at.get(l.a)!, b = at.get(l.b)!;
        const dy = b.y - a.y, dist = Math.max(Math.abs(b.x - a.x), Math.abs(b.z - a.z));
        if (l.move === 'build') { expect(dy).toBe(2); continue; }
        if (l.move === 'walk') expect(dy).toBe(0);
        if (l.move === 'step' || l.move === 'climb') { expect(dy).toBe(1); expect(dy).toBeLessThanOrEqual(jumpLift); expect(dist).toBeLessThanOrEqual(2); }
        if (l.move === 'drop') expect(dy).toBeLessThan(0);
        if (l.move === 'jump') { expect(dy).toBeLessThanOrEqual(1); expect(dist - 1).toBeLessThanOrEqual(2); }
        if (!adj.has(l.a)) adj.set(l.a, []);
        if (!adj.has(l.b)) adj.set(l.b, []);
        adj.get(l.a)!.push(l.b);
        adj.get(l.b)!.push(l.a);
      }
      expect(adj.size).toBeGreaterThan(0);
      const seen = new Set<number>([plan.route[0].id]);
      const queue = [plan.route[0].id];
      while (queue.length) {
        const id = queue.shift()!;
        for (const n of adj.get(id) ?? []) if (!seen.has(n)) { seen.add(n); queue.push(n); }
      }
      expect(seen.has(plan.seat.id)).toBe(true);
    }
  });

  it('builds the spiral: thin branches 4 to 6 long, each 2 higher, every third thick and fixed', () => {
    for (const seed of SEEDS) {
      const plan = gen(seed);
      const at = byId(plan);
      const fixed = new Map<number, boolean>(plan.platforms.map(p => [p.tag, p.fixed]));
      const branches = plan.platforms.filter(p => p.tag >= 7).sort((a, b) => a.tag - b.tag);
      expect(branches.length).toBe(13);
      let prevY: number | null = null;
      branches.forEach((p, i) => {
        const first = at.get(p.place)!;
        if (prevY !== null) expect(first.y).toBe(prevY + 2);
        prevY = first.y;
        expect(fixed.get(p.tag)).toBe(i % 3 === 2);
        const last = plan.graph.links.find(l => (l.a === first.id || l.b === first.id) && l.move === 'walk');
        expect(last).toBeDefined();
        const other = at.get(last!.a === first.id ? last!.b : last!.a)!;
        const len = Math.abs(other.x - first.x) + Math.abs(other.z - first.z) + 1;
        expect(len).toBeGreaterThanOrEqual(4);
        expect(len).toBeLessThanOrEqual(6);
      });
      for (const l of plan.graph.links.filter(l => l.move === 'build')) {
        const a = at.get(l.a)!, b = at.get(l.b)!;
        const gap = Math.abs(b.x - a.x) + Math.abs(b.z - a.z) - 1;
        expect(gap).toBeGreaterThanOrEqual(1);
        expect(gap).toBeLessThanOrEqual(3);
      }
    }
  });

  it('puts three sleeping clusters and four nests on fixed thick branches', () => {
    for (const seed of SEEDS) {
      const plan = gen(seed);
      const v = voxel(plan.shapes);
      const fixed = fixedTags(plan);
      expect(plan.spawns.length).toBe(3);
      expect(plan.nests.length).toBe(4);
      for (const p of [...plan.spawns, ...plan.nests]) {
        expect(standable(v, p, 1)).toBe(true);
        expect(fixed.has(v(p.x, p.y, p.z).tag) || fixed.has(p.tag)).toBe(true);
      }
    }
  });

  it('draws only from its own rng: the same plan in any order of generation', () => {
    const a = JSON.stringify(gen(7));
    gen(8);
    gen(9, { x: 1, y: 0, z: 1 });
    expect(JSON.stringify(gen(7))).toBe(a);
    expect(JSON.stringify(gen(8))).not.toBe(a);
  });

  it('stays sparse: far fewer shapes than solid cells', () => {
    for (const seed of SEEDS) {
      const plan = gen(seed);
      const v = voxel(plan.shapes);
      const cells = new Set<string>();
      for (const s of plan.shapes) {
        const b = boundsOf(s);
        for (let x = b[0]; x <= b[3]; x++) for (let y = b[1]; y <= b[4]; y++) for (let z = b[2]; z <= b[5]; z++) {
          if (covers(s, x, y, z) && solid(v, x, y, z)) cells.add(`${x},${y},${z}`);
        }
      }
      expect(plan.shapes.length).toBeLessThan(cells.size / 40);
    }
  });
});
