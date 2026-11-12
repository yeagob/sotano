// The surface and its mountains (issue #10, docs/architecture/LEVELS.md §13).
import { describe, expect, it } from 'vitest';
import { MAT } from '../src/content/materials';
import { RunRandom } from '../src/core/rng';
import { createDungeonWorld, planDungeon, SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import {
  COLUMN_CAP, CREST_R, EDGE_R, FOOT_R, Mountains, PASS_HALF, PEAK, PLAIN_R, STAIR_ARC, TERRACE, TERRAIN_CHUNKS,
} from '../src/world/mountains';

const CX = WORLD_SIZE.sx >> 1, CZ = WORLD_SIZE.sz >> 1;
const make = (seed: number) => new Mountains(new RunRandom(seed).fork('mountains'), CX, CZ, SURFACE_Y, WORLD_SIZE);
const diff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const at = (a: number, r: number): [number, number] => [Math.round(CX + Math.cos(a) * r), Math.round(CZ + Math.sin(a) * r)];
const SEEDS = [1, 2, 3, 0xBEEF, 0xC0FFEE];
const MB = 1024 * 1024;

/** Walks from (sx, sz) over the columns `keep` allows, up at most one block a step (a jump), down any
 *  drop; returns the highest column reached past `rMin`. */
function climb(m: Mountains, sx: number, sz: number, keep: (x: number, z: number) => boolean, rMin: number): number {
  const seen = new Set([`${sx},${sz}`]), queue: [number, number][] = [[sx, sz]];
  let top = 0;
  while (queue.length) {
    const [x, z] = queue.pop()!;
    const h = m.height(x, z);
    if (Math.hypot(x - CX, z - CZ) >= rMin) top = Math.max(top, h);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
      if (seen.has(k) || !keep(nx, nz) || m.height(nx, nz) - h > 1) continue;
      seen.add(k); queue.push([nx, nz]);
    }
  }
  return top;
}

describe('the surface round the tree', () => {
  it('the plain is four times wider than the first surface, flat, and holds the dungeon square', () => {
    expect(PLAIN_R).toBe(76 * 4);
    const m = make(1);
    for (let a = 0; a < Math.PI * 2; a += 0.01) for (let r = 0; r <= PLAIN_R; r += 3) expect(m.heightOf(...at(a, r))).toBe(0);
    for (const [x, z] of [[0, 0], [WORLD_SIZE.sx - 1, 0], [0, WORLD_SIZE.sz - 1], [WORLD_SIZE.sx - 1, WORLD_SIZE.sz - 1]])
      expect(Math.hypot(x - CX, z - CZ)).toBeLessThan(PLAIN_R);
  });

  for (const seed of SEEDS) it(`is deterministic for a seed: same columns, cell for cell (seed ${seed})`, () => {
    const a = make(seed), b = make(seed);
    expect(a.passes).toEqual(b.passes);
    expect(a.stairs).toEqual(b.stairs);
    for (let k = 0; k < 400; k++) {
      const [x, z] = at(k * 0.37, PLAIN_R + ((k * 53) % (EDGE_R - PLAIN_R)));
      expect(a.height(x, z)).toBe(b.height(x, z));
      const y = SURFACE_Y + a.height(x, z);
      expect(a.block(x, y, z)).toBe(b.block(x, y, z));
    }
  });

  it('differs for another seed', () => {
    const a = make(7), b = make(8);
    let same = 0;
    for (let k = 0; k < 200; k++) { const [x, z] = at(k * 0.031, CREST_R); if (a.heightOf(x, z) === b.heightOf(x, z)) same++; }
    expect(same).toBeLessThan(150);
  });

  for (const seed of SEEDS) it(`a ring of ridges stands at the crest's radius, broken only by the passes (seed ${seed})`, () => {
    const m = make(seed);
    for (let a = 0; a < Math.PI * 2; a += 0.01) {
      if (m.passes.some(p => Math.abs(diff(a, p)) * CREST_R <= PASS_HALF + 41)) continue;
      expect(m.heightOf(...at(a, CREST_R))).toBeGreaterThanOrEqual(Math.floor(PEAK * 0.3));
    }
  });

  for (const seed of SEEDS) it(`no mountain is taller than the tree, and each ridge's summit is as tall (seed ${seed})`, () => {
    const m = make(seed);
    let max = 0;
    for (let a = 0; a < Math.PI * 2; a += 0.004) for (let r = PLAIN_R; r <= FOOT_R; r += 2) max = Math.max(max, m.heightOf(...at(a, r)));
    expect(max).toBeLessThanOrEqual(PEAK);
    for (const [x, z] of m.summits) expect(m.height(x, z)).toBe(PEAK);
  });

  for (const seed of SEEDS) it(`every pass is a flat way from the plain through the ring to the far plain (seed ${seed})`, () => {
    const m = make(seed);
    for (const p of m.passes) for (let r = PLAIN_R; r <= FOOT_R + 4; r++) expect(m.heightOf(...at(p, r))).toBe(0);
  });
});

describe('the mountain walls can be climbed', () => {
  for (const seed of SEEDS) it(`every stair climbs from the plain to the crest one block a step (seed ${seed})`, () => {
    const m = make(seed);
    expect(m.stairs.length).toBeGreaterThan(30);
    for (const s of m.stairs) {
      const [sx, sz] = at(s, PLAIN_R - 2);
      const near = (x: number, z: number) => Math.abs(diff(Math.atan2(z - CZ, x - CX), s)) * PLAIN_R <= 4;
      const top = climb(m, sx, sz, (x, z) => m.onStair(x, z) || (Math.hypot(x - CX, z - CZ) <= PLAIN_R + 1 && near(x, z)), CREST_R - 2);
      expect(top, `stair at ${s.toFixed(3)}`).toBeGreaterThanOrEqual(Math.floor(m.crest(s)) - 1);
      // the stair is worn earth
      const [tx, tz] = at(s, PLAIN_R + 40);
      expect(m.onStair(tx, tz)).toBe(true);
      expect(m.block(tx, SURFACE_Y + m.height(tx, tz), tz)).toBe(MAT.dirt);
    }
  });

  for (const seed of SEEDS) it(`a stair is never far along the wall, except in the passes (seed ${seed})`, () => {
    const m = make(seed);
    for (let a = 0; a < Math.PI * 2; a += 0.005) {
      if (m.passes.some(p => Math.abs(diff(a, p)) * PLAIN_R <= PASS_HALF + 40)) continue;
      const near = Math.min(...m.stairs.map(s => Math.abs(diff(a, s)) * CREST_R));
      expect(near).toBeLessThanOrEqual(STAIR_ARC);
    }
  });

  for (const seed of [1, 0xBEEF]) it(`from the plain the player reaches the summits' height by jumping (seed ${seed})`, () => {
    const m = make(seed);
    for (const rd of m.ridges) {
      // within the ridge's summit sector, starting from the plain in front of it
      const keep = (x: number, z: number) => Math.abs(diff(Math.atan2(z - CZ, x - CX), rd.peak)) * CREST_R <= STAIR_ARC * 1.5
        && Math.hypot(x - CX, z - CZ) <= CREST_R + 2;
      const [sx, sz] = at(rd.peak, PLAIN_R - 2);
      expect(climb(m, sx, sz, keep, CREST_R - 3)).toBeGreaterThanOrEqual(PEAK - TERRACE - 2);
    }
  });

  it('the walls are ledges and steps, not smooth faces: ledges, one-block steps and cliffs of a terrace', () => {
    const m = make(1);
    const rises = new Map<number, number>();
    for (let a = 0; a < Math.PI * 2; a += 0.01) for (let r = PLAIN_R + 1; r < CREST_R; r++) {
      const d = m.heightOf(...at(a, r + 1)) - m.heightOf(...at(a, r));
      rises.set(d, (rises.get(d) ?? 0) + 1);
    }
    for (const d of [0, 1, TERRACE]) expect(rises.get(d) ?? 0).toBeGreaterThan(0);
    // most of the wall is ledges you can stand on
    const total = [...rises.values()].reduce((s, n) => s + n, 0);
    expect((rises.get(0) ?? 0) / total).toBeGreaterThan(0.5);
  });
});

describe('the surface is a formula with exceptions: memory never grows with its size', () => {
  /** Walks every chunk column of a square of the given half-width round the tree, as a probe would. */
  function walk(m: Mountains, half: number) {
    for (let z = CZ - half; z <= CZ + half; z += 16) for (let x = CX - half; x <= CX + half; x += 16) {
      const h = m.height(x, z);
      if (h >= 0) m.block(x, SURFACE_Y + h, z);
    }
  }

  it('the stored formula and exceptions are the same for a surface 1×, 2× and 4× as wide', () => {
    const sizes = [EDGE_R / 4, EDGE_R / 2, EDGE_R].map(half => {
      const m = make(0xBEEF);
      walk(m, Math.round(half));
      const s = m.stats();
      expect(s.columns).toBeLessThanOrEqual(COLUMN_CAP);
      expect(s.chunks).toBeLessThanOrEqual(TERRAIN_CHUNKS);
      return s;
    });
    expect(new Set(sizes.map(s => s.formula)).size).toBe(1);
    expect(sizes.map(s => s.exceptions)).toEqual([0, 0, 0]);
    expect(sizes.map(s => s.exceptionBytes)).toEqual([0, 0, 0]);
    // the caches are capped: walking four times as far keeps them under their caps
    expect(sizes[2].cacheBytes).toBeLessThanOrEqual(COLUMN_CAP * (18 * 18 * 2 + 256) + TERRAIN_CHUNKS * 4096);
  });

  it('the voxels stay under the 16 MB ceiling on the whole surface, array and caches included', () => {
    const rr = new RunRandom(0xBEEF);
    const w = createDungeonWorld(rr, planDungeon(rr));
    const m = w.terrain!;
    walk(m, EDGE_R);
    const bytes = w.data.byteLength + w.elem.byteLength + m.stats().bytes;
    // measured: the array is 7.5 MB, the formula under 1 KB, the capped caches about 3 MB
    expect(bytes).toBeLessThan(16 * MB);
    expect(m.stats().formula).toBeLessThan(2048);
  });

  it('an exception costs a few bytes a cell, and a cell set back to its formula keeps none', () => {
    const m = make(3);
    const [x, z] = at(m.ridges[0].peak, CREST_R - 20);
    const top = SURFACE_Y + m.height(x, z);
    const ground = m.block(x, top, z);
    m.except(x, top, z, MAT.air);
    expect(m.block(x, top, z)).toBe(MAT.air);
    m.except(x, top + 1, z, MAT.dirt, true);
    expect(m.stats().exceptions).toBe(2);
    expect(m.stats().exceptionBytes).toBeLessThanOrEqual(2 * 4 + 16);
    m.except(x, top, z, ground);
    expect(m.stats().exceptions).toBe(1);
    expect(m.block(x, top, z)).toBe(ground);
    // removing the placed block leaves the formula's air: no exception
    m.except(x, top + 1, z, MAT.air);
    expect(m.stats().exceptions).toBe(0);
  });

  it('a chunk evicted from the cache comes back the same', () => {
    const m = make(5);
    const [x, z] = at(m.ridges[1].peak, CREST_R - 60);
    const ys = Array.from({ length: 40 }, (_, k) => SURFACE_Y - 6 + k);
    const before = ys.map(y => m.block(x, y, z));
    walk(m, EDGE_R); // pushes everything out
    expect(ys.map(y => m.block(x, y, z))).toEqual(before);
  });
});

describe('the dungeon world reads the surface outside its array', () => {
  const rr = new RunRandom(0xBEEF);
  const w = createDungeonWorld(rr, planDungeon(rr));
  const m = w.terrain!;

  it('outside the array the world answers with the terrain; inside, nothing changed', () => {
    expect(m).toBeTruthy();
    expect(w.get(-1, SURFACE_Y, 10)).toBe(MAT.grass);
    expect(w.get(-1, SURFACE_Y + 1, 10)).toBe(MAT.air);
    expect(w.get(-200, SURFACE_Y, 10)).toBe(MAT.grass);
    expect(w.get(10, SURFACE_Y, 10)).toBe(MAT.grass);
    const [px, pz] = m.summits[0];
    expect(w.solid(px, SURFACE_Y + PEAK, pz)).toBe(true);
    expect(w.solid(px, SURFACE_Y + PEAK + 1, pz)).toBe(false);
    // the mountains cannot be built on or broken (decision 8): the world refuses writes outside the array
    w.set(px, SURFACE_Y + PEAK + 1, pz, MAT.dirt);
    expect(w.solid(px, SURFACE_Y + PEAK + 1, pz)).toBe(false);
    expect(Number.isFinite(w.hp(px, SURFACE_Y + PEAK, pz))).toBe(true);
  });

  it('the rim chunk sees the terrain in its border, so the square no longer shows its sides', () => {
    const P = 18, cy = Math.floor(SURFACE_Y / 16), ly = SURFACE_Y - cy * 16 + 1;
    const pad = w.paddedChunk(0, cy, 0);
    expect(pad[0 + P * (ly + P * 5)]).toBe(MAT.grass);
  });

  it('the chunks to mesh are streamed round the viewer, outside the array, nearest first', () => {
    const near = w.outerChunksNear(CX, CZ, 176);
    expect(near.length).toBeGreaterThan(100);
    let last = 0;
    for (const [cx, cy, cz] of near) {
      expect(w.outerChunk(cx, cz)).toBe(true);
      const d = Math.hypot(cx * 16 + 8 - CX, cz * 16 + 8 - CZ);
      expect(d).toBeGreaterThanOrEqual(last - 1e-9);
      expect(d).toBeLessThanOrEqual(176 + 16);
      last = d;
      expect(cy).toBeGreaterThanOrEqual(0);
    }
    // nothing is queued at creation: the surface is far too wide to mesh whole
    expect([...w.dirty].some(k => { const [cx, , cz] = k.split(',').map(Number); return Math.abs(cx) > 20 || Math.abs(cz) > 20; })).toBe(false);
  });
});
