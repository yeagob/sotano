// The lion's floor (docs/architecture/SKY.md §7.4, docs/design/not-built/sky/guardians/LION.md B6): for 50 seeds
// the layout respects its B6 numbers, a route exists with nothing and with the cubes of the nests, the vertical
// route is contiguous to the gate, no route cell can fade, nests and spawns sit on fixed places, the shapes are
// few, and the plan is the same in any order of generation.

import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { lion, moveOf } from '../src/sky/floors/lion';
import { boundsOf, covers } from '../src/sky/world/shapes';
import type { Place, SkyFloorPlan } from '../src/sky/types';

const O = { x: 128, y: 151, z: 128 };
const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

const plans = SEEDS.map(s => lion.generate(new Rng(s), O));
const plan = plans[0];
const byId = (p: SkyFloorPlan, id: number): Place => p.graph.places[id];
const dist = (p: Place) => Math.hypot(p.x - O.x, p.z - O.z);
const popcount = (n: number) => { let c = 0; for (let m = n; m; m &= m - 1) c++; return c; };

/** Whether the player can get from `from` to `to`, with nothing, or with the cubes of the nests it passes. */
function reachable(p: SkyFloorPlan, from: number, to: number, withBuild: boolean): boolean {
  const nestBit = new Map(p.nests.map((n, i) => [n.id, 1 << i]));
  const seen = new Set([`${from}|0|0`]);
  const queue: [number, number, number][] = [[from, 0, 0]];
  while (queue.length) {
    const [id, mask, spent] = queue.shift()!;
    if (id === to) return true;
    for (const l of p.graph.links) {
      if (l.a !== id) continue;
      if (l.move === 'build' && !withBuild) continue;
      const a = byId(p, l.a), b = byId(p, l.b);
      const cost = l.move === 'build' ? (moveOf(a, b)?.cost ?? Infinity) : 0;
      const nm = mask | (nestBit.get(b.id) ?? 0);
      if (cost > 3 * popcount(nm) - spent) continue;
      const key = `${b.id}|${nm}|${spent + cost}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push([b.id, nm, spent + cost]);
    }
  }
  return false;
}

describe('the lion floor (SKY.md §7.4)', () => {
  it('is the fourth floor, with the B6 radius and height, and its band', () => {
    expect([plan.index, plan.animal, plan.y0, plan.y1]).toEqual([4, 'lion', O.y, O.y + 36]);
    // The hall: the B6 radius plus three of wall, and the height plus four of headroom.
    for (const s of plan.shapes) {
      const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
      expect([x0 - O.x, x1 - O.x, z0 - O.z, z1 - O.z], s.k).toSatisfy((b: number[]) => b.every((v, i) => (i % 2 ? v <= 29 : v >= -29)));
      expect([y0 - O.y, y1 - O.y], s.k).toSatisfy((b: number[]) => b[0] >= 0 && b[1] <= 39);
    }
  });

  it('keeps every place inside the plain (radius 26) and under the ledge height', () => {
    for (const p of plan.graph.places) {
      expect(dist(p), `${p.kind} ${p.id}`).toBeLessThanOrEqual(26);
      expect(p.y - O.y).toBeGreaterThanOrEqual(0);
      expect(p.y - O.y).toBeLessThanOrEqual(34);
    }
  });

  it('has 12 to 16 rocks, 3 to 6 wide, and the Sunning Ledge 6 by 6 at 34', () => {
    const rocks = plan.graph.places.filter(p => p.kind === 'ledge');
    expect(rocks.length).toBeGreaterThanOrEqual(12);
    expect(rocks.length).toBeLessThanOrEqual(16);
    for (const r of rocks) { expect(r.w).toBeGreaterThanOrEqual(3); expect(r.w).toBeLessThanOrEqual(6); }
    expect([plan.seat.w, plan.seat.d, plan.seat.y - O.y]).toEqual([6, 6, 34]);
  });

  it('climbs the nerve line by 1 to 3 blocks between neighbours, and reaches the ledge in them', () => {
    const nerve = plan.graph.places.filter(p => p.kind === 'ledge').slice(0, 14);
    for (let i = 1; i < nerve.length; i++) {
      const d = nerve[i].y - nerve[i - 1].y;
      expect(d, `rock ${i}`).toBeGreaterThanOrEqual(1);
      expect(d, `rock ${i}`).toBeLessThanOrEqual(3);
    }
    expect(plan.seat.y - nerve[nerve.length - 1].y).toBeLessThanOrEqual(3);
  });

  it('has its wide gaps on the nerve line only as 4 or 5 blocks, each with a nest before it', () => {
    const nerve = plan.graph.places.filter(p => p.kind === 'ledge').slice(0, 14);
    const wide = nerve.slice(1).map((p, i) => moveOf(nerve[i], p)).filter(m => m?.move === 'build' && m.cost === 2);
    // The target is six (LION.md B6); the plain's radius and the rock budget give this layout two.
    expect(wide.length).toBe(2);
    expect(plan.nests.length).toBe(wide.length);
    for (const n of plan.nests) expect(byId(plan, n.id).kind).toBe('nest');
  });

  it('has a vertical route of one-block steps, from the ground to the gate', () => {
    expect(plan.route.length).toBe(34);
    const ground = plan.graph.places.filter(p => p.kind === 'ground');
    expect(ground.some(g => plan.graph.links.some(l => l.a === g.id && l.b === plan.route[0].id && (l.move === 'jump' || l.move === 'step')))).toBe(true);
    for (let i = 1; i < plan.route.length; i++) {
      const a = plan.route[i - 1], b = plan.route[i];
      const link = plan.graph.links.find(l => l.a === a.id && l.b === b.id);
      expect(['step', 'jump'], `route ${i}`).toContain(link?.move);
    }
    const top = plan.route[plan.route.length - 1];
    expect(Math.hypot(top.x - plan.gate.x, top.z - plan.gate.z)).toBeLessThanOrEqual(plan.gate.r);
    expect(plan.gate).toEqual({ x: O.x + 14, z: O.z + 2, r: 3 });
  });

  it('reaches the seat from the ground with nothing, and with the cubes of the nests', () => {
    const ground = plan.graph.places.find(p => p.kind === 'ground')!;
    expect(reachable(plan, ground.id, plan.seat.id, false)).toBe(true);
    expect(reachable(plan, ground.id, plan.seat.id, true)).toBe(true);
  });

  it('never fades or opens a route cell, and puts nests and spawns on fixed places', () => {
    const fixed = new Map(plan.platforms.map(t => [t.tag, t.fixed]));
    for (const s of plan.shapes) {
      if (s.k !== 'box' || !s.tag) continue;
      for (const r of plan.route) {
        const under = covers(s, r.x, r.y - 1, r.z);
        expect(under, `route ${r.id} under tag ${s.tag}`).toBe(false);
      }
    }
    for (const n of plan.nests) expect(fixed.get(n.tag), `nest ${n.id}`).toBe(true);
    for (const s of plan.spawns) expect(s.tag).toBe(0);
  });

  it('stands every place in air, on a block of its own or on the plain', () => {
    const blocks = (x: number, y: number, z: number) => plan.shapes.some(s => s.k !== 'elem' && covers(s, x, y, z));
    for (const p of plan.graph.places) {
      expect(blocks(p.x, p.y, p.z), `${p.kind} ${p.id} is in air`).toBe(false);
      if (p.kind === 'ground' || p.kind === 'spawn') expect(p.y, `${p.kind} ${p.id}`).toBe(O.y);
      else expect(blocks(p.x, p.y - 1, p.z), `${p.kind} ${p.id} has a block under it`).toBe(true);
    }
  });

  it('has few shapes: under one per forty solid cells', () => {
    const solid = new Set<string>();
    for (const s of plan.shapes) {
      const [x0, y0, z0, x1, y1, z1] = boundsOf(s);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
        if (covers(s, x, y, z)) solid.add(`${x},${y},${z}`);
      }
    }
    expect(plan.shapes.length).toBeLessThan(solid.size / 40);
  });

  it('is the same plan for every seed and in any order of generation', () => {
    const json = (p: SkyFloorPlan) => JSON.stringify([p.shapes, p.graph, p.seat, p.spawns, p.nests, p.route, p.gate, p.platforms]);
    const again = SEEDS.map(s => lion.generate(new Rng(s), O));
    for (let i = 0; i < SEEDS.length; i++) expect(json(again[i])).toBe(json(plans[0]));
    const reversed = [...SEEDS].reverse().map(s => lion.generate(new Rng(s), O));
    expect(json(reversed[SEEDS.length - 1])).toBe(json(plans[0]));
  });
});
