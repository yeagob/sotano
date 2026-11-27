import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { EL_LAVA, EL_WATER, elemKind } from '../src/content/elements';
import { RunRandom } from '../src/core/rng';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { BIOME, BIOME_BLEND, BIOME_R, DECK, DOCK, PEAK_HIGH, TEMPLE_HALF } from '../src/world/biomes';
import { COLUMN_CAP, EDGE_R, Mountains, TERRAIN_CHUNKS } from '../src/world/mountains';
import { BEDROCK, LAVA_FLOOR, LAVA_TOP, RELIEF_LOW, SEA } from '../src/world/void';

const CX = WORLD_SIZE.sx >> 1, CZ = WORLD_SIZE.sz >> 1;
const make = (seed: number) => new Mountains(new RunRandom(seed).fork('mountains'), CX, CZ, SURFACE_Y, WORLD_SIZE);
const at = (a: number, r: number): [number, number] => [Math.round(CX + Math.cos(a) * r), Math.round(CZ + Math.sin(a) * r)];
const EAST = 0, SOUTH = Math.PI / 2, WEST = Math.PI, NORTH = -Math.PI / 2;

function count(m: Mountains, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, test: (b: number, x: number, y: number, z: number) => boolean): number {
  let n = 0;
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (test(m.block(x, y, z), x, y, z)) n++;
  return n;
}

describe('the Outer Void\'s biomes: sea to the east, desert to the south, mountains to the west, ice to the north', () => {
  it('is deterministic: the same seed gives the same biomes, peaks, temple and village', () => {
    const a = make(0xBEEF), b = make(0xBEEF), c = make(0xF00D);
    expect(a.biomes.temple).toEqual(b.biomes.temple);
    expect(a.biomes.village).toEqual(b.biomes.village);
    expect(a.biomes.peaks).toEqual(b.biomes.peaks);
    expect(c.biomes.village).not.toEqual(a.biomes.village);
    for (let k = 0; k < 800; k++) {
      const [x, z] = at(k * 0.731, BIOME_R + ((k * 977) % 900));
      expect(a.height(x, z)).toBe(b.height(x, z));
      expect(a.topAt(x, z)).toBe(b.topAt(x, z));
    }
  });

  it('each cardinal direction past the blend is its own biome', () => {
    for (const seed of [0xBEEF, 7, 99]) {
      const m = make(seed);
      for (let r = BIOME_R + BIOME_BLEND; r <= 2400; r += 50) {
        expect(m.biomeAt(...at(EAST, r))).toBe(BIOME.sea);
        expect(m.biomeAt(...at(SOUTH, r))).toBe(BIOME.desert);
        expect(m.biomeAt(...at(WEST, r))).toBe(BIOME.mountains);
        expect(m.biomeAt(...at(NORTH, r))).toBe(BIOME.ice);
      }
    }
  });

  it('nothing changes closer than BIOME_R: no ice, sand, structure or mountain, and the ground is the plain Void\'s', () => {
    const m = make(0xBEEF);
    const { structures } = m.biomes;
    for (let k = 0; k < 3000; k++) {
      const [x, z] = at(k * 0.0021, EDGE_R + 2 + ((k * 131) % (BIOME_R - EDGE_R - 2)));
      expect(m.biomeAt(x, z)).toBe(BIOME.void);
      expect(m.height(x, z)).toBeLessThanOrEqual(13);
      expect([MAT.ice, MAT.sand]).not.toContain(m.topAt(x, z));
      expect(structures.some(s => x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1)).toBe(false);
    }
    for (const a of [EAST, SOUTH, WEST, NORTH]) {
      const [x, z] = at(a, BIOME_R - 4);
      for (let y = SURFACE_Y + RELIEF_LOW; y <= SURFACE_Y + 20; y++) expect([MAT.ice, MAT.sand]).not.toContain(m.block(x, y, z));
    }
  });

  it('the north is frozen: ice on the ground and on the lakes; the south has none', () => {
    const m = make(0xBEEF);
    const [nx, nz] = at(NORTH, 1500), [sx, sz] = at(SOUTH, 1500);
    let frozenLake = 0;
    const ice = count(m, nx - 40, nx + 40, nz - 40, nz + 40, SURFACE_Y - 4, SURFACE_Y + 8, (b, x, y, z) => {
      if (b === MAT.ice && y <= SURFACE_Y + SEA && m.height(x, z) < y - SURFACE_Y) frozenLake++;
      return b === MAT.ice;
    });
    expect(ice).toBeGreaterThan(1000);
    expect(frozenLake).toBeGreaterThan(0);
    expect(count(m, sx - 40, sx + 40, sz - 40, sz + 40, SURFACE_Y - 4, SURFACE_Y + 14, b => b === MAT.ice)).toBe(0);
    expect(count(m, nx - 40, nx + 40, nz - 40, nz + 40, SURFACE_Y - 4, SURFACE_Y + 8, b => b === MAT.log || b === MAT.leaves)).toBe(0);
  });

  it('the south is a desert: dunes of sand over stone, no trees, no water', () => {
    const m = make(0xBEEF);
    const [x0, z0] = at(SOUTH, 1600);
    let lo = Infinity, hi = -Infinity;
    for (let z = z0 - 50; z <= z0 + 50; z++) for (let x = x0 - 50; x <= x0 + 50; x++) {
      const h = m.height(x, z);
      lo = Math.min(lo, h); hi = Math.max(hi, h);
      expect(m.topAt(x, z)).toBe(MAT.sand);
      expect(m.block(x, SURFACE_Y + h - 5, z)).toBe(MAT.stone);
      expect(m.block(x, SURFACE_Y + h - 2, z)).toBe(MAT.sand);
      expect(elemKind(m.elemAt(x, SURFACE_Y + h + 1, z))).not.toBe(EL_WATER);
      expect([MAT.log, MAT.leaves]).not.toContain(m.block(x, SURFACE_Y + h + 1, z));
    }
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(12);
    expect(hi - lo).toBeGreaterThanOrEqual(5);
  });

  it('the east is open sea with a stilt village: houses on log posts, crate decks, a dock and a boat floating at sea level', () => {
    for (const seed of [0xBEEF, 7]) {
      const m = make(seed);
      const v = m.biomes.village, r = Math.hypot(v.x - CX, v.z - CZ);
      expect(r).toBeGreaterThanOrEqual(1250);
      expect(r).toBeLessThanOrEqual(1400);
      expect(m.biomeAt(v.x, v.z)).toBe(BIOME.sea);
      let deck = 0, posts = 0, roof = 0;
      for (let z = v.z - 13; z <= v.z + 13; z++) for (let x = v.x - 21; x <= v.x + 33; x++) {
        expect(m.height(x, z)).toBeLessThanOrEqual(SEA - 6);
        if (m.block(x, SURFACE_Y + DECK, z) === MAT.crate) deck++;
        if (m.block(x, SURFACE_Y + SEA - 1, z) === MAT.log) posts++;
        for (let y = DECK + 4; y <= DECK + 8; y++) if ([MAT.flagstone, MAT.stone].includes(m.block(x, SURFACE_Y + y, z))) roof++;
      }
      expect(deck).toBeGreaterThan(400);
      expect(posts).toBeGreaterThan(40);
      expect(roof).toBeGreaterThan(5 * 80);
      expect(m.block(v.x + 20, SURFACE_Y + DOCK, v.z)).toBe(MAT.crate);
      let hull = 0;
      for (let u = 20; u <= 26; u++) for (let w = 3; w <= 5; w++) {
        const x = v.x + u, z = v.z + w;
        if (m.block(x, SURFACE_Y + SEA, z) === MAT.crate) { hull++; expect(m.elemAt(x, SURFACE_Y + SEA, z)).toBe(0); }
      }
      expect(hull).toBe(17);
      expect(m.block(v.x + 23, SURFACE_Y + SEA + 1, v.z + 3)).toBe(MAT.log);
      expect(elemKind(m.elemAt(v.x + 23, SURFACE_Y + SEA - 1, v.z + 4))).toBe(EL_WATER);
      expect(elemKind(m.elemAt(v.x + 23, SURFACE_Y + SEA, v.z + 7))).toBe(EL_WATER);
    }
  });

  it('the mountains climb by one-block steps everywhere, up to a summit of PEAK_HIGH', () => {
    for (const seed of [0xBEEF, 7]) {
      const m = make(seed);
      const t = m.biomes.temple;
      let worst = 0, top = 0;
      for (let z = t.z - 260; z <= t.z + 260; z++) for (let x = t.x - 260; x <= t.x + 260; x++) {
        const h = m.height(x, z);
        top = Math.max(top, h);
        worst = Math.max(worst, Math.abs(h - m.height(x + 1, z)), Math.abs(h - m.height(x, z + 1)));
      }
      expect(worst).toBeLessThanOrEqual(1);
      expect(top).toBe(PEAK_HIGH);
      expect(m.height(t.x, t.z)).toBe(PEAK_HIGH);
      expect(m.biomeAt(t.x, t.z)).toBe(BIOME.mountains);
      expect(Math.hypot(t.x - CX, t.z - CZ)).toBeGreaterThan(BIOME_R + 200);
    }
  });

  it('the mountains are stone higher up, ice at the summits, grass and trees in the foothills', () => {
    const m = make(0xBEEF);
    const t = m.biomes.temple, tops = new Map<number, number>();
    let trees = 0;
    for (let z = t.z - 200; z <= t.z + 200; z += 2) for (let x = t.x - 200; x <= t.x + 200; x += 2) {
      const h = m.height(x, z), k = m.topAt(x, z);
      if (m.biomeAt(x, z) !== BIOME.mountains) continue;
      tops.set(k, (tops.get(k) ?? 0) + 1);
      if (h > 90) expect(k).toBe(MAT.ice);
      if (h > 40 && h < 80) expect([MAT.stone, MAT.ice]).toContain(k);
      if (m.block(x, SURFACE_Y + h + 1, z) === MAT.log) { trees++; expect(h).toBeLessThan(40); }
    }
    expect(tops.get(MAT.grass) ?? 0).toBeGreaterThan(100);
    expect(tops.get(MAT.stone) ?? 0).toBeGreaterThan(100);
    expect(tops.get(MAT.ice) ?? 0).toBeGreaterThan(20);
    expect(trees).toBeGreaterThan(0);
  });

  it('a temple of ashlar stands on the highest summit, reached by stairs of one block a step', () => {
    for (const seed of [0xBEEF, 7]) {
      const m = make(seed);
      const t = m.biomes.temple, y0 = SURFACE_Y + t.floor;
      let ashlar = 0, flag = 0, brass = 0;
      for (let z = t.z - TEMPLE_HALF; z <= t.z + TEMPLE_HALF; z++) for (let x = t.x - TEMPLE_HALF; x <= t.x + TEMPLE_HALF; x++) {
        expect(m.height(x, z)).toBe(PEAK_HIGH);
        for (let y = y0; y <= y0 + 15; y++) {
          const b = m.block(x, y, z);
          if (b === MAT.ashlar) ashlar++;
          if (b === MAT.flagstone) flag++;
          if (b === MAT.goldframe) brass++;
        }
      }
      expect(ashlar).toBeGreaterThan(300);
      expect(flag).toBeGreaterThan(100);
      expect(brass).toBe(17);
      expect(m.block(t.x, y0 + 7, t.z)).toBe(MAT.starstone);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let prev = y0 - 1;
        for (let s = TEMPLE_HALF + 2; s >= 0; s--) {
          const x = t.x + dx * s, z = t.z + dz * s;
          let y = y0 + 8;
          while (m.block(x, y, z) === AIR) y--;
          if (s <= 3) break;
          expect(y - prev).toBeLessThanOrEqual(1);
          prev = y;
        }
      }
    }
  });

  it('the chunks match the formula cell by cell in every biome, structures included', () => {
    const m = make(0xBEEF);
    const v = m.biomes.village, t = m.biomes.temple;
    const boxes: [number, number, number, number, number][] = [
      [...at(NORTH, 1500), 20, SURFACE_Y - 12, SURFACE_Y + 14],
      [...at(SOUTH, 1500), 20, SURFACE_Y - 2, SURFACE_Y + 16],
      [...at(WEST, 1300), 20, SURFACE_Y - 2, SURFACE_Y + 40],
      [v.x - 6, v.z, 18, SURFACE_Y - 11, SURFACE_Y + 12],
      [v.x + 24, v.z + 4, 10, SURFACE_Y - 11, SURFACE_Y + 6],
      [t.x, t.z, 12, SURFACE_Y + 95, SURFACE_Y + 118],
    ];
    for (const [cx, cz, half, y0, y1] of boxes)
      for (let z = cz - half; z <= cz + half; z++) for (let x = cx - half; x <= cx + half; x++) for (let y = y0; y <= y1; y++)
        if (m.block(x, y, z) !== m.base(x, y, z)) throw new Error(`cell ${x},${y},${z} differs from its formula`);
  });

  it('the lava sea stays sealed under the biomes, at least ten blocks of soil over it', () => {
    const m = make(0xBEEF);
    const v = m.biomes.village;
    for (const [x0, z0] of [at(NORTH, 1500), at(SOUTH, 1500), at(WEST, 1350), [v.x, v.z] as [number, number]])
      for (let z = z0 - 10; z <= z0 + 10; z++) for (let x = x0 - 10; x <= x0 + 10; x++) {
        expect(m.height(x, z) - LAVA_TOP).toBeGreaterThanOrEqual(10);
        expect(m.block(x, SURFACE_Y + BEDROCK, z)).toBe(MAT.bedrock);
        expect(elemKind(m.elemAt(x, SURFACE_Y + LAVA_FLOOR, z))).toBe(EL_LAVA);
        expect(m.block(x, SURFACE_Y + LAVA_TOP + 1, z)).not.toBe(AIR);
      }
  });

  it('an all-air chunk is the shared empty one, and the caches stay capped after walking every biome', () => {
    const m = make(0xBEEF);
    const [x, z] = at(SOUTH, 1500);
    const sky = SURFACE_Y + 80;
    expect(m.block(x, sky, z)).toBe(AIR);
    const before = m.stats().chunks;
    for (let k = 0; k < 4; k++) m.block(x + 16 * k, sky, z);
    expect(m.stats().chunks - before).toBeLessThanOrEqual(4);
    for (const a of [EAST, SOUTH, WEST, NORTH]) {
      for (let r = EDGE_R; r <= 1800; r += 3) {
        const [px, pz] = at(a + Math.sin(r * 0.01) * 0.2, r);
        for (const [cx, cy, cz] of m.chunksNear(px, pz, 24)) m.block(cx * 16, cy * 16, cz * 16);
      }
      const s = m.stats();
      expect(s.columns).toBeLessThanOrEqual(COLUMN_CAP);
      expect(s.chunks).toBeLessThanOrEqual(TERRAIN_CHUNKS);
    }
  });

  it('the view round the player in the mountains stays within the chunk cache', () => {
    const m = make(0xBEEF);
    const t = m.biomes.temple;
    for (const [x, z] of [[t.x, t.z], [t.x + 60, t.z + 40], [t.x - 80, t.z]]) expect(m.chunksNear(x, z, 96).length).toBeLessThanOrEqual(TERRAIN_CHUNKS);
    const [fx, fz] = at(NORTH, 1500);
    expect(m.chunksNear(fx, fz, 96).length).toBeLessThan(TERRAIN_CHUNKS * 0.75);
  });
});
