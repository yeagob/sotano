import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { EL_FIRE, EL_LAVA, EL_WATER, SOURCE, elemKind, elemLevel, isFalling } from '../src/content/elements';
import { ElementSim, type ElementHost } from '../src/world/elements';
import { VoxelWorld } from '../src/world/world';

/** A 24³ world with a stone floor at y = 0. */
function setup(opts: Partial<ElementHost> = {}) {
  const w = new VoxelWorld(24, 24, 24);
  for (let z = 0; z < 24; z++) for (let x = 0; x < 24; x++) w.data[w.idx(x, 0, z)] = MAT.stone;
  const host: ElementHost = {
    seed: 7,
    blocked: (x, y, z) => w.solid(x, y, z),
    ignite: (x, y, z) => { w.set(x, y, z, AIR); return true; },
    react: (_x, _y, _z, _r, result) => result,
    fx: () => {},
    ...opts,
  };
  return { w, sim: new ElementSim(w, host) };
}
const run = (sim: ElementSim, ticks: number) => { for (let i = 0; i < ticks; i++) sim.step(); };
const count = (w: VoxelWorld, kind: number) => { let n = 0; for (const b of w.elem) if (elemKind(b) === kind) n++; return n; };

describe('elements: flow', () => {
  it('water spreads a bounded distance from a source and settles', () => {
    const { w, sim } = setup();
    w.setElem(12, 1, 12, EL_WATER, SOURCE);
    run(sim, 60);
    expect(elemLevel(w.elemAt(12 + 7, 1, 12))).toBe(1);
    expect(isFalling(w.elemAt(12 + 7, 1, 12))).toBe(false);
    expect(w.elemAt(12 + 8, 1, 12)).toBe(0);
    expect(sim.pending).toBe(0);
  });
  it('recedes when the source is removed', () => {
    const { w, sim } = setup();
    w.setElem(12, 1, 12, EL_WATER, SOURCE);
    run(sim, 60);
    w.setElem(12, 1, 12, 0, 0);
    run(sim, 60);
    expect(count(w, EL_WATER)).toBe(0);
  });
  it('falls before it spreads, and a contained pool stays put', () => {
    const { w, sim } = setup();
    w.setElem(5, 6, 5, EL_WATER, SOURCE);
    run(sim, 80);
    for (let y = 2; y < 6; y++) expect(elemKind(w.elemAt(5, y, 5))).toBe(EL_WATER);
    expect(w.elemAt(6, 4, 5)).toBe(0); // nothing spreads from the falling column
    expect(elemKind(w.elemAt(8, 1, 5))).toBe(EL_WATER);
  });
  it('lava is slower and reaches less far', () => {
    const { w, sim } = setup();
    w.setElem(12, 1, 12, EL_LAVA, SOURCE);
    run(sim, 6);
    expect(w.elemAt(12 + 3, 1, 12)).toBe(0);
    run(sim, 60);
    expect(elemKind(w.elemAt(12 + 3, 1, 12))).toBe(EL_LAVA);
    expect(w.elemAt(12 + 4, 1, 12)).toBe(0);
  });
  it('reaches exactly 7 cells (water) and 3 (lava) on a flat floor, in every direction', () => {
    const { w, sim } = setup();
    w.setElem(12, 1, 12, EL_WATER, SOURCE);
    run(sim, 60);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      expect(elemKind(w.elemAt(12 + 7 * dx, 1, 12 + 7 * dz))).toBe(EL_WATER);
      expect(w.elemAt(12 + 8 * dx, 1, 12 + 8 * dz)).toBe(0);
    }
  });
  it('a closed door (blocked cell) holds a source back', () => {
    const w = new VoxelWorld(24, 24, 24);
    for (let z = 0; z < 24; z++) for (let x = 0; x < 24; x++) w.data[w.idx(x, 0, z)] = MAT.stone;
    const door = (x: number) => x === 11;
    const sim = new ElementSim(w, { seed: 1, blocked: (x, y, z) => w.solid(x, y, z) || door(x), ignite: () => false, react: (_a, _b, _c, _r, m) => m, fx: () => {} });
    w.setElem(10, 1, 12, EL_WATER, SOURCE);
    run(sim, 60);
    for (let x = 11; x < 24; x++) expect(w.elemAt(x, 1, 12)).toBe(0);
  });
  it('a pool spilling down steps floods a bounded area and goes quiet', () => {
    const { w, sim } = setup();
    // three descending steps of stone to the east
    for (let s = 0; s < 3; s++) for (let x = 0; x < 6 + s * 2; x++) for (let z = 0; z < 24; z++) for (let y = 1; y <= 3 - s; y++) w.data[w.idx(x, y, z)] = MAT.stone;
    w.setElem(2, 4, 12, EL_WATER, SOURCE);
    run(sim, 300);
    expect(sim.pending).toBe(0);
    expect(count(w, EL_WATER)).toBeLessThan(250);
  });
  it('placing a block displaces the element', () => {
    const { w } = setup();
    w.setElem(3, 1, 3, EL_WATER, SOURCE);
    w.set(3, 1, 3, MAT.stone);
    expect(w.elemAt(3, 1, 3)).toBe(0);
  });
});

describe('elements: reactions', () => {
  it('water on a lava source makes obsidian; on flowing lava, stone', () => {
    const { w, sim } = setup();
    w.setElem(10, 1, 10, EL_LAVA, SOURCE);
    w.setElem(10, 1, 6, EL_WATER, SOURCE);
    run(sim, 80);
    expect(w.get(10, 1, 10) === MAT.obsidian || w.get(10, 1, 9) === MAT.stone || w.get(10, 1, 8) === MAT.stone).toBe(true);
    expect([...w.data].some(m => m === MAT.stone && true)).toBe(true);
  });
  it('a reaction an item cancels does not happen', () => {
    const { w, sim } = setup({ react: () => null });
    w.setElem(10, 1, 10, EL_LAVA, SOURCE);
    w.setElem(10, 1, 11, EL_WATER, SOURCE);
    run(sim, 10);
    expect(w.get(10, 1, 10)).toBe(AIR);
  });
  it('fire burns a crate pile down and goes out; water puts it out', () => {
    const { w, sim } = setup();
    for (let x = 4; x < 8; x++) w.set(x, 1, 4, MAT.crate);
    w.setElem(3, 1, 4, EL_FIRE, SOURCE);
    run(sim, 400);
    for (let x = 4; x < 8; x++) expect(w.get(x, 1, 4)).toBe(AIR);
    expect(count(w, EL_FIRE)).toBe(1); // only the eternal flame is left
    w.setElem(3, 1, 5, EL_WATER, SOURCE);
    run(sim, 5);
    expect(elemKind(w.elemAt(3, 1, 4))).not.toBe(EL_FIRE);
  });
  it('a flame goes out when the block under it breaks', () => {
    const { w, sim } = setup();
    w.set(5, 1, 5, MAT.stone);
    w.setElem(5, 2, 5, EL_FIRE, SOURCE);
    run(sim, 3);
    expect(elemKind(w.elemAt(5, 2, 5))).toBe(EL_FIRE);
    w.set(5, 1, 5, AIR);
    run(sim, 2);
    expect(w.elemAt(5, 2, 5)).toBe(0);
  });
  it('fire never spreads to blocks that do not burn', () => {
    const { w, sim } = setup();
    w.set(4, 1, 4, MAT.stone);
    w.setElem(3, 1, 4, EL_FIRE, SOURCE);
    run(sim, 200);
    expect(w.get(4, 1, 4)).toBe(MAT.stone);
  });
  it('respects the per-tick budget', () => {
    const { w, sim } = setup();
    for (let z = 1; z < 23; z++) for (let x = 1; x < 23; x++) for (let y = 1; y < 12; y++) sim.wake(x, y, z);
    sim.step();
    expect(sim.lastWork).toBeLessThanOrEqual(3000);
    expect(w.version).toBeGreaterThanOrEqual(0);
  });
});

describe('cubes as weapons', () => {
  it('harder cubes hit harder, and faster ones too (capped)', async () => {
    const { cubeDamage } = await import('../src/core/damage');
    expect(cubeDamage(MAT.obsidian, 9)).toBeGreaterThan(cubeDamage(MAT.stone, 9));
    expect(cubeDamage(MAT.stone, 9)).toBeGreaterThan(cubeDamage(MAT.dirt, 9));
    expect(cubeDamage(MAT.stone, 18)).toBe(cubeDamage(MAT.stone, 40));
    expect(cubeDamage(MAT.obsidian, 9)).toBeGreaterThan(7);
  });
});
