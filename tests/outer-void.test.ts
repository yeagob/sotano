import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { EL_LAVA, EL_WATER, elemKind } from '../src/content/elements';
import { RunRandom } from '../src/core/rng';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { COLUMN_CAP, EDGE_R, Mountains, TERRAIN_CHUNKS } from '../src/world/mountains';
import { VoxelWorld } from '../src/world/world';
import { BEDROCK, LAVA_FLOOR, LAVA_TOP, RELIEF_HIGH, RELIEF_LOW, SEA, TRAP_DEPTH } from '../src/world/void';

const CX = WORLD_SIZE.sx >> 1, CZ = WORLD_SIZE.sz >> 1;
const make = (seed: number) => new Mountains(new RunRandom(seed).fork('mountains'), CX, CZ, SURFACE_Y, WORLD_SIZE);
const at = (a: number, r: number): [number, number] => [Math.round(CX + Math.cos(a) * r), Math.round(CZ + Math.sin(a) * r)];

describe('the Outer Void: endless procedural ground past the initial zone', () => {
  it('is deterministic and finite: the same seed gives the same ground far out, within the relief', () => {
    const a = make(0xBEEF), b = make(0xBEEF);
    for (let k = 0; k < 1500; k++) {
      const ang = k * 0.731, r = EDGE_R + 1 + ((k * 977) % 7000);
      const [x, z] = at(ang, r);
      const h = a.height(x, z);
      expect(h).toBe(b.height(x, z));
      expect(h).toBeGreaterThanOrEqual(RELIEF_LOW);
      expect(h).toBeLessThanOrEqual(RELIEF_HIGH);
    }
  });

  it('the seam is flat: the far plain ends at grass level and the relief grows from it without a step', () => {
    const m = make(0xBEEF);
    for (let k = 0; k < 24; k++) {
      const ang = k * 0.26;
      const [ix, iz] = at(ang, EDGE_R - 2), [ox, oz] = at(ang, EDGE_R + 2);
      expect(m.height(ix, iz)).toBe(0);
      expect(Math.abs(m.height(ox, oz))).toBeLessThanOrEqual(1);
      let prev = m.height(ox, oz);
      for (let d = 3; d <= 120; d++) {
        const [x, z] = at(ang, EDGE_R + d), h = m.height(x, z);
        expect(Math.abs(h - prev)).toBeLessThanOrEqual(1);
        prev = h;
      }
    }
  });

  it('the ground undulates slightly: hollows and hills, and neighbouring cells never step more than one block', () => {
    const m = make(0xBEEF);
    let lo = Infinity, hi = -Infinity, worst = 0;
    for (let z = CZ - 60; z <= CZ + 60; z++) for (let x = CX + EDGE_R + 4; x <= CX + EDGE_R + 124; x++) {
      const h = m.height(x, z);
      lo = Math.min(lo, h); hi = Math.max(hi, h);
      worst = Math.max(worst, Math.abs(h - m.height(x + 1, z)), Math.abs(h - m.height(x, z + 1)));
    }
    expect(hi - lo).toBeGreaterThanOrEqual(6);
    expect(lo).toBeLessThan(0);
    expect(worst).toBeLessThanOrEqual(1);
  });

  it('the chunks match the formula cell by cell across their seams, so trees and water never tear', () => {
    const m = make(0xBEEF);
    for (let z = CZ - 24; z <= CZ + 24; z++) for (let x = CX + EDGE_R + 4; x <= CX + EDGE_R + 60; x++)
      for (let y = SURFACE_Y + LAVA_FLOOR - 1; y <= SURFACE_Y + RELIEF_HIGH + 2; y++)
        if (m.block(x, y, z) !== m.base(x, y, z)) throw new Error(`cell ${x},${y},${z} differs from its formula`);
  });

  it('it grows trees, bushes and lakes out of the blocks the game has', () => {
    const m = make(0xBEEF);
    let logs = 0, leaves = 0, water = 0, grass = 0;
    for (let z = CZ - 60; z <= CZ + 60; z++) for (let x = CX + EDGE_R + 4; x <= CX + EDGE_R + 124; x++) {
      for (let y = SURFACE_Y + RELIEF_LOW; y <= SURFACE_Y + RELIEF_HIGH + 6; y++) {
        const b = m.block(x, y, z);
        if (b === MAT.log) logs++;
        if (b === MAT.leaves) leaves++;
        if (b === MAT.grass) grass++;
        if (elemKind(m.elemAt(x, y, z)) === EL_WATER) water++;
      }
    }
    expect(logs).toBeGreaterThan(20);
    expect(leaves).toBeGreaterThan(logs);
    expect(grass).toBeGreaterThan(logs);
    expect(water).toBeGreaterThan(0);
  });

  it('the lava sea lies under the ground, sealed by soil above and bedrock below', () => {
    const m = make(0xBEEF);
    let lava = 0;
    for (let z = CZ - 30; z <= CZ + 30; z++) for (let x = CX + EDGE_R + 4; x <= CX + EDGE_R + 64; x++) {
      expect(m.block(x, SURFACE_Y + BEDROCK, z)).toBe(MAT.bedrock);
      for (let y = SURFACE_Y + LAVA_FLOOR; y <= SURFACE_Y + LAVA_TOP; y++) {
        expect(m.block(x, y, z)).toBe(AIR);
        expect(elemKind(m.elemAt(x, y, z))).toBe(EL_LAVA);
        lava++;
      }
      expect(m.block(x, SURFACE_Y + LAVA_TOP + 1, z)).not.toBe(AIR);
    }
    expect(lava).toBeGreaterThan(0);
  });

  it('digging opens the Void only: the soil above the lava breaks, the bedrock and the lava do not', () => {
    const m = make(0xBEEF);
    const [x, z] = at(0.4, EDGE_R + 40);
    const h = m.height(x, z);
    expect(m.breakable(x, SURFACE_Y + h, z)).toBe(true);
    expect(m.breakable(x, SURFACE_Y + LAVA_TOP, z)).toBe(false);
    expect(m.breakable(x, SURFACE_Y + BEDROCK, z)).toBe(false);
    const [px, pz] = at(0.4, EDGE_R - 40);
    expect(m.breakable(px, SURFACE_Y + m.height(px, pz), pz)).toBe(false);
  });

  it('the world digs the Void as an exception of its terrain and leaves the initial zone as it was', () => {
    const terrain = make(0xBEEF);
    const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
    w.terrain = terrain;
    const [x, z] = at(1.1, EDGE_R + 30);
    const y = SURFACE_Y + terrain.height(x, z);
    expect(w.get(x, y, z)).not.toBe(AIR);
    w.set(x, y, z, AIR);
    expect(w.get(x, y, z)).toBe(AIR);
    expect(w.dirty.size).toBeGreaterThan(0);
    expect(terrain.base(x, y, z)).not.toBe(AIR);
    const [px, pz] = at(1.1, 200);
    const py = SURFACE_Y;
    w.set(px, py, pz, AIR);
    expect(w.get(px, py, pz)).toBe(MAT.grass);
  });

  it('blows accumulate on the Void\'s soil, and its damage never shares a key with a cell of the array', () => {
    const terrain = make(0xBEEF);
    const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
    w.terrain = terrain;
    const [x, z] = at(0.9, EDGE_R + 30);
    const y = SURFACE_Y + terrain.height(x, z);
    const full = w.hp(x, y, z);
    expect(full).toBeGreaterThan(1);
    w.damaged.set(w.damageKey(x, y, z), 1);
    expect(w.hp(x, y, z)).toBe(1);
    expect(w.damageKey(x, y, z)).toBeLessThan(0);
    for (let i = 0; i < w.sx * w.sy * w.sz; i += 997) expect(w.damageKey(...w.coords(i))).toBe(w.idx(...w.coords(i)));
    w.set(x, y, z, AIR);
    expect(w.damaged.has(w.damageKey(x, y, z))).toBe(false);
  });

  it('the trap opens when the feet are ten blocks under the local ground, and the shaft reaches the lava', () => {
    const m = make(0xBEEF);
    const [x, z] = at(2.2, EDGE_R + 50);
    const top = SURFACE_Y + m.height(x, z);
    expect(m.trapped(x + 0.5, top - TRAP_DEPTH + 0.5, z + 0.5)).toBe(true);
    expect(m.trapped(x + 0.5, top - TRAP_DEPTH + 1.5, z + 0.5)).toBe(false);
    const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
    w.terrain = m;
    const cells = m.shaft(x + 0.5, top - TRAP_DEPTH + 0.5, z + 0.5);
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every(([cx, cy, cz]) => m.breakable(cx, cy, cz))).toBe(true);
    expect(cells.some(([cx, cy, cz]) => cx === x && cz === z && cy === top - TRAP_DEPTH)).toBe(true);
    for (const [cx, cy, cz] of cells) w.set(cx, cy, cz, AIR);
    const fall = top - TRAP_DEPTH;
    for (let y = fall; y > SURFACE_Y + LAVA_TOP; y--) expect(w.get(x, y, z)).toBe(AIR);
    expect(elemKind(w.elemAt(x, SURFACE_Y + LAVA_TOP, z))).toBe(EL_LAVA);
  });

  it('the water lies up to the grass level and the sea is never deeper than the bed', () => {
    const m = make(0xBEEF);
    for (let z = CZ - 40; z <= CZ + 40; z++) for (let x = CX + EDGE_R + 4; x <= CX + EDGE_R + 104; x++) {
      const h = m.height(x, z);
      for (let y = SURFACE_Y + h + 1; y <= SURFACE_Y + SEA; y++) expect(elemKind(m.elemAt(x, y, z))).toBe(EL_WATER);
      if (h >= SEA) expect(elemKind(m.elemAt(x, SURFACE_Y + h + 1, z))).not.toBe(EL_WATER);
    }
  });

  it('the Void keeps its caches capped however far one walks', () => {
    const m = make(0xBEEF);
    for (let k = 0; k < 6000; k++) {
      const [x, z] = at(k * 0.0137, EDGE_R + 6 + ((k * 31) % 900));
      m.block(x, SURFACE_Y + m.height(x, z), z);
    }
    const s = m.stats();
    expect(s.columns).toBeLessThanOrEqual(COLUMN_CAP);
    expect(s.chunks).toBeLessThanOrEqual(TERRAIN_CHUNKS);
  });
});
