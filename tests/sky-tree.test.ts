// The sky tree (docs/architecture/SKY.md §7.1, TR): the halls are in order with three-layer slabs and
// match the atmosphere's table, the trunk widens as it rises, every slab is whole but its way up, the
// membranes stay closed until their floor is won, the deck's door and well climb into hall 1, the
// same layout materialises in any order, and the layout stays inside its budget.

import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { Rng } from '../src/core/rng';
import { HALLS } from '../src/sky/atmosphere';
import { buildSkyTree, DECK_Y, floorPlans, FOOT_WELL as W, openGate, SKY_AXIS } from '../src/sky/floors/tree';
import { buildSkyLayout } from '../src/sky/layout';
import { formulaAt } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';

const C = SKY_AXIS.x, Z = SKY_AXIS.z;
const P = buildSkyLayout(() => new Rng(3));
const at = (x: number, y: number, z: number) => formulaAt(P.layout, x, y, z);
/** The rounded disc of a ring shape (≤ r² + r). */
const inDisc = (r: number, dx: number, dz: number) => dx * dx + dz * dz <= r * r + r;

describe('the halls', () => {
  it('are in order, with three-layer slabs between them, and the deck is the floor 0 hall', () => {
    const h = P.tree.halls;
    expect(h.map(x => x.floor)).toEqual([0, 1, 2, 3, 4, 5]);
    expect([h[0].y0, h[0].y1, h[0].radius]).toEqual([DECK_Y, DECK_Y, 48]);
    for (let i = 1; i < h.length; i++) {
      expect(h[i].y1, `hall ${h[i].floor}`).toBeGreaterThan(h[i].y0);
      expect(h[i].y0 - h[i - 1].y1 - 1, `slab under hall ${h[i].floor}`).toBe(3);
    }
  });

  it('match the atmosphere table (SKY.md §7.1: ground, top and radius)', () => {
    expect(HALLS.map(x => [x.floor, x.y0, x.y1, x.radius])).toEqual(P.tree.halls.slice(1).map(x => [x.floor, x.y0, x.y1, x.radius]));
  });

  it('have heartwood walls three thick round the air, and air inside', () => {
    for (const h of P.tree.halls.slice(1)) {
      const y = h.y0 + 5;
      expect(at(C + h.radius, y, Z), `hall ${h.floor} air`).toBe(AIR);
      for (let k = 1; k <= 3; k++) expect(at(C + h.radius + k, y, Z), `hall ${h.floor} wall ${k}`).toBe(MAT.heartwood);
      expect(at(C + h.radius + 4, y, Z), `hall ${h.floor} outside`).toBe(AIR);
    }
  });

  it('has knot windows at eye height, one each way in every hall', () => {
    for (const h of P.tree.halls.slice(1)) {
      const k = h.radius + 1;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = C + dx * k, z = Z + dz * k;
        expect([at(x, h.y0, z), at(x, h.y0 + 1, z), at(x, h.y0 + 2, z), at(x, h.y0 + 3, z)], `hall ${h.floor} ${dx},${dz}`)
          .toEqual([MAT.heartwood, AIR, AIR, MAT.heartwood]);
      }
    }
  });
});

describe('the trunk and the deck', () => {
  it('widens as it rises, and stands on the deck only', () => {
    const r = (y: number) => P.tree.trunkRadius(y);
    expect([r(31), r(32), r(40), r(80), r(120), r(160), r(200), r(220), r(221)]).toEqual([0, 26, 26, 28, 30, 32, 36, 36, 0]);
    let last = 0;
    for (let y = DECK_Y; y <= 220; y++) {
      expect(r(y)).toBeGreaterThanOrEqual(last);
      last = r(y);
    }
  });

  it('is a disc of cloud under the trunk, walkable at its surface', () => {
    expect([at(C + 30, DECK_Y - 1, Z), at(C + 30, DECK_Y, Z), at(C - 47, DECK_Y - 3, Z)]).toEqual([MAT.cloud, AIR, MAT.cloud]);
    expect(at(C + 49, DECK_Y - 1, Z)).toBe(AIR);
  });

  it('has the arrival place on the deck and the foot door at the trunk', () => {
    expect([P.tree.deck.kind, P.tree.deck.y, P.tree.deck.x]).toEqual(['ground', DECK_Y, C]);
    expect(inDisc(48, P.tree.deck.x - C, P.tree.deck.z - Z)).toBe(true);
    // the foot door is at the foot of the well, inside the trunk
    expect([P.tree.door.kind, P.tree.door.x, P.tree.door.z]).toEqual(['gate', W.x, W.z]);
    expect(inDisc(P.tree.trunkRadius(DECK_Y), W.x - C, W.z - Z)).toBe(true);
  });

  it('opens a three-high door through the foot wall, and a well up to hall 1 with a spiral of heartwood', () => {
    expect([at(C + 20, DECK_Y, W.z), at(C + 20, DECK_Y + 2, W.z), at(C + 20, DECK_Y + 3, W.z)]).toEqual([AIR, AIR, MAT.heartwood]);
    for (const y of [DECK_Y, DECK_Y + 1, DECK_Y + 2, DECK_Y + 3, 36]) expect(at(W.x, y, W.z), `well ${y}`).toBe(AIR);
    for (let y = DECK_Y; y < 36; y++) {
      let treads = 0;
      for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
        const d2 = dx * dx + dz * dz;
        if (d2 > 6 && d2 <= 20 && at(W.x + dx, y, W.z + dz) === MAT.heartwood) treads++;
      }
      expect(treads, `tread at ${y}`).toBeGreaterThan(0);
    }
  });

  it('opens the well into hall 1 beside the panda seat: a clear column of headroom 3 over its mouth, the seat on whole ground', () => {
    const bad: number[][] = [];
    for (let dz = -W.r; dz <= W.r; dz++) for (let dx = -W.r; dx <= W.r; dx++) {
      if (!inDisc(W.r, dx, dz)) continue;
      for (let y = 36; y < 39; y++) if (at(W.x + dx, y, W.z + dz) !== AIR) bad.push([W.x + dx, y, W.z + dz]);
    }
    expect(bad, 'the well mouth is clear').toEqual([]);
    // the seat (3 × 3 at the centre) stands on the slab, not over the well
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      expect(at(C + dx, 35, Z + dz), `slab under the seat ${dx},${dz}`).toBe(MAT.heartwood);
      expect(at(C + dx, 36, Z + dz), `seat ${dx},${dz}`).not.toBe(AIR);
    }
  });

  it('rims the well mouth with one block of pale stone on the ground, one cell out from its edge, two clear of the seat', () => {
    const rim: [number, number][] = [];
    for (let dz = -W.r - 1; dz <= W.r + 1; dz++) for (let dx = -W.r - 1; dx <= W.r + 1; dx++) {
      const x = W.x + dx, z = W.z + dz;
      if (inDisc(W.r + 1, dx, dz) && !inDisc(W.r, dx, dz)) {
        rim.push([x, z]);
        expect(at(x, 36, z), `rim ${x},${z}`).toBe(MAT.palestone);
      }
      if (inDisc(W.r, dx, dz)) for (const y of [36, 37, 38]) expect(at(x, y, z), `mouth ${x},${y},${z}`).toBe(AIR);
    }
    expect(rim.length).toBe(28);
    for (const [x, z] of rim) {
      const gap = Math.max(Math.max(0, (C - 1) - x, x - (C + 1)), Math.max(0, (Z - 1) - z, z - (Z + 1)));
      expect(gap, `rim ${x},${z} from the seat`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('the slabs and the membranes', () => {
  it('is whole in every slab, except the way up: a membrane on its bottom layer, air above it', () => {
    expect(P.tree.gates.map(g => g.y)).toEqual([68, 107, 148, 191, 218]);
    for (const g of P.tree.gates) {
      for (let dy = 0; dy < 3; dy++) {
        const y = g.y + dy, R = P.tree.trunkRadius(y);
        const bad: number[][] = [];
        for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
          if (!inDisc(R, dx, dz)) continue;
          const x = C + dx, z = Z + dz;
          const want = dy > 0 && inDisc(g.r, x - g.x, z - g.z) ? AIR : MAT.heartwood;
          if (at(x, y, z) !== want) bad.push([x, y, z]);
        }
        expect(bad.length, `slab layer ${y}`).toBe(0);
      }
    }
  });

  it('keeps the membranes closed until their floor is won, and opens each one alone', () => {
    const w = new SkyWorld(P.layout);
    const cell = (g: { x: number; y: number; z: number }) => w.get(g.x, g.y, g.z);
    expect(P.tree.gates.map(cell)).toEqual(P.tree.gates.map(() => MAT.heartwood));
    openGate(w, P.tree, 1);
    expect(cell(P.tree.gates[0])).toBe(AIR);
    expect(P.tree.gates.slice(1).map(cell)).toEqual(P.tree.gates.slice(1).map(() => MAT.heartwood));
    for (const n of [2, 3, 4, 5] as const) openGate(w, P.tree, n);
    expect(P.tree.gates.map(cell)).toEqual(P.tree.gates.map(() => AIR));
  });

  it('has no membrane without plans, and opening one is then a no-op', () => {
    const bare = buildSkyTree(new Rng(1));
    expect(bare.gates).toEqual([]);
    expect(() => openGate(new SkyWorld(P.layout), bare, 1)).not.toThrow();
  });

  it('puts the crown on the roof: the membrane below, the open air above', () => {
    expect([at(C, 218, Z), at(C, 221, Z), at(C + 10, 220, Z)]).toEqual([MAT.heartwood, AIR, MAT.heartwood]);
  });
});

describe('the layout', () => {
  it('takes the floors from their forks, one per floor, in order', () => {
    const fp = floorPlans(() => new Rng(3));
    expect(fp.map(f => f.index)).toEqual([1, 2, 3, 4, 5]);
    expect(P.floors.map(f => f.index)).toEqual([1, 2, 3, 4, 5]);
  });

  it('stays inside its budget: few shapes, few index entries', () => {
    let entries = 0;
    for (const ids of P.layout.index.values()) entries += ids.length;
    expect(P.layout.shapes.length).toBeLessThan(2000);
    expect(entries).toBeLessThanOrEqual(40000);
  });

  it('materialises the same cells in any order of chunks', () => {
    const list: [number, number, number][] = [];
    for (let cy = 2; cy <= 6; cy++) for (let cz = 7; cz <= 9; cz++) for (let cx = 7; cx <= 9; cx++) list.push([cx, cy, cz]);
    const read = (w: SkyWorld, chunks: readonly [number, number, number][]) => chunks.map(([cx, cy, cz]) => {
      const v = new Uint8Array(4096);
      let i = 0;
      for (let z = 0; z < 16; z++) for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++)
        v[i++] = w.get(cx * 16 + x, cy * 16 + y, cz * 16 + z);
      return v;
    });
    const forward = read(new SkyWorld(P.layout), list);
    const backward = read(new SkyWorld(P.layout), [...list].reverse()).reverse();
    forward.forEach((v, i) => expect(backward[i], `chunk ${list[i]}`).toEqual(v));
    expect(forward.some(v => v.includes(MAT.heartwood))).toBe(true);
  });
});
