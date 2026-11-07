// The mountains round the surface (issue #10, docs/architecture/LEVELS.md §13).
import { describe, expect, it } from 'vitest';
import { MAT } from '../src/content/materials';
import { RunRandom } from '../src/core/rng';
import { createDungeonWorld, planDungeon, SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { CREST_R, FOOT_R, Mountains, PASS_HALF, PEAK, PLAIN_R, SHOULDER } from '../src/world/mountains';

const CX = WORLD_SIZE.sx >> 1, CZ = WORLD_SIZE.sz >> 1;
const make = (seed: number) => new Mountains(new RunRandom(seed).fork('mountains'), CX, CZ, SURFACE_Y, WORLD_SIZE);
const diff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const at = (a: number, r: number): [number, number] => [Math.round(CX + Math.cos(a) * r), Math.round(CZ + Math.sin(a) * r)];
const SEEDS = [1, 2, 3, 0xBEEF, 0xC0FFEE];

describe('mountains round the tree', () => {
  it('the plain round the tree is flat, and the whole dungeon square lies inside it', () => {
    const m = make(1);
    for (let a = 0; a < Math.PI * 2; a += 0.02) for (let r = 0; r <= PLAIN_R; r += 1) expect(m.height(...at(a, r))).toBe(0);
    for (const [x, z] of [[0, 0], [WORLD_SIZE.sx - 1, 0], [0, WORLD_SIZE.sz - 1], [WORLD_SIZE.sx - 1, WORLD_SIZE.sz - 1]])
      expect(Math.hypot(x - CX, z - CZ)).toBeLessThan(PLAIN_R);
  });

  for (const seed of SEEDS) it(`a ring of ridges stands at the crest's radius, broken only by the passes (seed ${seed})`, () => {
    const m = make(seed);
    for (let a = 0; a < Math.PI * 2; a += 0.01) {
      if (m.passes.some(p => Math.abs(diff(a, p)) * CREST_R <= PASS_HALF + 23)) continue;
      expect(m.height(...at(a, CREST_R))).toBeGreaterThanOrEqual(Math.floor(PEAK * 0.3));
    }
  });

  for (const seed of SEEDS) it(`each ridge's peak is exactly as tall as the tree and nothing is taller (seed ${seed})`, () => {
    const m = make(seed);
    let max = 0;
    for (const h of m.heights) max = Math.max(max, h);
    expect(max).toBe(PEAK);
    for (const r of m.ridges) expect(m.height(...at(r.peak, CREST_R))).toBe(PEAK);
  });

  for (const seed of SEEDS) it(`every ridge can be climbed from the plain to its crest in one-block steps (seed ${seed})`, () => {
    const m = make(seed);
    expect(m.ridges.length).toBe(m.passes.length);
    for (const ridge of m.ridges) {
      const inRidge = (x: number, z: number) => {
        const a = Math.atan2(z - CZ, x - CX), from = diff(a, ridge.from), to = diff(ridge.to, a);
        return from >= 0 && to >= 0 && Math.hypot(x - CX, z - CZ) <= CREST_R + 2;
      };
      // walk outward from the plain: up at most one block a step (a jump), down any drop
      const [sx, sz] = at(ridge.trail, PLAIN_R - 2);
      const seen = new Set([`${sx},${sz}`]), queue: [number, number][] = [[sx, sz]];
      let top = 0;
      while (queue.length) {
        const [x, z] = queue.pop()!;
        const h = m.height(x, z);
        if (Math.hypot(x - CX, z - CZ) >= CREST_R - 1) top = Math.max(top, h);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
          if (seen.has(k) || !inRidge(nx, nz) || m.height(nx, nz) - h > 1) continue;
          seen.add(k); queue.push([nx, nz]);
        }
      }
      expect(top).toBeGreaterThanOrEqual(SHOULDER);
      // the trail itself is a stair of worn earth
      const [tx, tz] = at(ridge.trail, PLAIN_R + 20);
      expect(m.onTrail(tx, tz)).toBe(true);
      expect(m.block(tx, SURFACE_Y + m.height(tx, tz), tz)).toBe(MAT.dirt);
    }
  });

  for (const seed of SEEDS) it(`every pass is a flat way from the plain through the ring to the far plain (seed ${seed})`, () => {
    const m = make(seed);
    expect(m.passes.length).toBeGreaterThanOrEqual(1);
    for (const p of m.passes) for (let r = PLAIN_R; r <= FOOT_R + 4; r++) expect(m.height(...at(p, r))).toBe(0);
  });

  it('the walls are rugged steps, not smooth: the inner wall has columns of every rise from one block up', () => {
    const m = make(1);
    const rises = new Set<number>();
    for (let a = 0; a < Math.PI * 2; a += 0.01) for (let r = PLAIN_R + 1; r < CREST_R; r++) {
      const [x, z] = at(a, r), [x2, z2] = at(a, r + 1);
      rises.add(m.height(x2, z2) - m.height(x, z));
    }
    for (const d of [1, 2, 3]) expect(rises.has(d)).toBe(true);
  });

  it('is the same for the same seed, and differs for another', () => {
    expect(make(7).heights).toEqual(make(7).heights);
    expect(make(7).passes).toEqual(make(7).passes);
    expect(make(8).heights).not.toEqual(make(7).heights);
  });
});

describe('the dungeon world reads the mountains outside its array', () => {
  const rr = new RunRandom(0xBEEF);
  const w = createDungeonWorld(rr, planDungeon(rr));
  const m = w.terrain!;

  it('outside the array the world answers with the terrain; inside, nothing changed', () => {
    expect(m).toBeTruthy();
    expect(w.get(-1, SURFACE_Y, 10)).toBe(MAT.grass);
    expect(w.get(-1, SURFACE_Y + 1, 10)).toBe(MAT.air);
    expect(w.get(10, SURFACE_Y, 10)).toBe(MAT.grass);
    const [px, pz] = at(m.ridges[0].peak, CREST_R);
    expect(w.solid(px, SURFACE_Y + PEAK, pz)).toBe(true);
    expect(w.solid(px, SURFACE_Y + PEAK + 1, pz)).toBe(false);
    // the mountains cannot be built on or broken: the array keeps every change
    w.set(px, SURFACE_Y + PEAK + 1, pz, MAT.dirt);
    expect(w.solid(px, SURFACE_Y + PEAK + 1, pz)).toBe(false);
    expect(Number.isFinite(w.hp(px, SURFACE_Y + PEAK, pz))).toBe(true);
  });

  it('the rim chunk sees the terrain in its border, so the square no longer shows its sides', () => {
    const P = 18, cy = Math.floor(SURFACE_Y / 16), ly = SURFACE_Y - cy * 16 + 1;
    const pad = w.paddedChunk(0, cy, 0);
    expect(pad[0 + P * (ly + P * 5)]).toBe(MAT.grass);
  });

  it('the chunks to mesh lie outside the array and are queued at creation', () => {
    const list = m.chunks();
    expect(list.length).toBeGreaterThan(100);
    for (const [cx, cy, cz] of list) {
      expect(w.outerChunk(cx, cz)).toBe(true);
      expect(w.dirty.has(`${cx},${cy},${cz}`)).toBe(true);
    }
  });
});
