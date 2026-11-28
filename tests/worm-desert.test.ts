import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { RunRandom } from '../src/core/rng';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { BIOME } from '../src/world/biomes';
import { Mountains } from '../src/world/mountains';
import { SandFall, SAND_FALL_BUDGET, type SandSpace } from '../src/world/sand-fall';
import { VoxelWorld } from '../src/world/world';
import { DEEP_SAND, WORM_DESERT_DIST, WORM_DESERT_R, WORM_STEER_R, inWormDesert, wormDesertCentre } from '../src/world/worm-desert';

const CX = WORLD_SIZE.sx >> 1, CZ = WORLD_SIZE.sz >> 1;
const SEED = 0xBEEF;
const make = (seed = SEED) => new Mountains(new RunRandom(seed).fork('mountains'), CX, CZ, SURFACE_Y, WORLD_SIZE);
const at = (a: number, r: number): [number, number] => [Math.round(CX + Math.cos(a) * r), Math.round(CZ + Math.sin(a) * r)];
const EAST = 0, SOUTH = Math.PI / 2, WEST = Math.PI, NORTH = -Math.PI / 2;

describe('the deep desert of the worm lies south, and only south (#354)', () => {
  it('stands due south of the tree (+z), in the desert biome, past its blend', () => {
    const m = make();
    const [x, z] = wormDesertCentre(CX, CZ);
    expect([x, z]).toEqual([CX, CZ + WORM_DESERT_DIST]);
    expect(m.biomeAt(x, z)).toBe(BIOME.desert);
    expect(m.deepAt(x, z)).toBe(true);
    // the whole basin is desert
    for (let k = 0; k < 64; k++) {
      const a = k * 0.4, r = (k % 8) / 8 * WORM_DESERT_R;
      const px = Math.round(x + Math.cos(a) * r), pz = Math.round(z + Math.sin(a) * r);
      expect(m.biomeAt(px, pz), `${px},${pz}`).toBe(BIOME.desert);
    }
  });

  it('is reached by walking south at a fixed distance, and never by walking north, east or west', () => {
    for (const seed of [SEED, 0xF00D, 7]) {
      const m = make(seed);
      const first = (a: number) => { for (let r = 0; r <= 2500; r++) { const [x, z] = at(a, r); if (m.deepAt(x, z)) return r; } return -1; };
      // the same distance whatever the seed: the basin is a formula of the tree's axis
      expect(first(SOUTH)).toBe(WORM_DESERT_DIST - WORM_DESERT_R);
      for (const a of [NORTH, EAST, WEST]) expect(first(a), `seed ${seed} angle ${a}`).toBe(-1);
    }
  });

  it('has about a hundred blocks of sand to the bedrock, no lava sea and no lava trap under it', () => {
    const m = make();
    const [x, z] = wormDesertCentre(CX, CZ);
    const top = SURFACE_Y + m.height(x, z);
    expect(m.block(x, SURFACE_Y - DEEP_SAND, z)).toBe(MAT.bedrock);
    for (let y = SURFACE_Y - DEEP_SAND + 1; y <= top; y++) {
      expect(m.block(x, y, z), `y ${y}`).toBe(MAT.sand);
      expect(m.elemAt(x, y, z)).toBe(0);
    }
    expect(top - (SURFACE_Y - DEEP_SAND)).toBeGreaterThanOrEqual(DEEP_SAND);
    expect(m.block(x, top + 1, z)).toBe(AIR);
    // every cell of the sand can be dug, the bedrock cannot; digging deep never opens the lava trap
    expect(m.breakable(x, SURFACE_Y - DEEP_SAND + 1, z)).toBe(true);
    expect(m.breakable(x, SURFACE_Y - DEEP_SAND, z)).toBe(false);
    expect(m.trapped(x + 0.5, SURFACE_Y - 60, z + 0.5)).toBe(false);
    // outside the basin the desert keeps its lava sea and its trap
    const [ox, oz] = at(SOUTH, WORM_DESERT_DIST - WORM_DESERT_R - 40);
    expect(m.trapped(ox + 0.5, SURFACE_Y + m.height(ox, oz) - 12, oz + 0.5)).toBe(true);
  });

  it('joins the dunes at its rim without a cliff, and the worm steers well inside the deep sand', () => {
    const m = make();
    for (let r = WORM_DESERT_DIST - WORM_DESERT_R - 60; r <= WORM_DESERT_DIST + WORM_DESERT_R + 60; r++) {
      const [x, z] = at(SOUTH, r);
      expect(Math.abs(m.height(x, z + 1) - m.height(x, z)), `r ${r}`).toBeLessThanOrEqual(1);
      expect(Math.abs(m.height(x + 1, z) - m.height(x, z)), `r ${r}`).toBeLessThanOrEqual(1);
    }
    expect(WORM_STEER_R).toBeLessThan(WORM_DESERT_R);
    const [cx, cz] = wormDesertCentre(CX, CZ);
    for (let k = 0; k < 32; k++) {
      const a = k / 32 * Math.PI * 2;
      expect(inWormDesert(CX, CZ, cx + Math.cos(a) * (WORM_STEER_R + 16), cz + Math.sin(a) * (WORM_STEER_R + 16))).toBe(true);
    }
  });
});

describe('falling sand (#354)', () => {
  /** A column of cells in a map: what a sand fall reads and writes. */
  function space(cells: Map<string, number>): SandSpace & { writes: number } {
    const s = {
      writes: 0,
      get: (x: number, y: number, z: number) => cells.get(`${x},${y},${z}`) ?? AIR,
      set: (x: number, y: number, z: number, m: number) => { s.writes++; if (m === AIR) cells.delete(`${x},${y},${z}`); else cells.set(`${x},${y},${z}`, m); },
    };
    return s;
  }

  it('drops the sand above a removed block until it rests, as in Minecraft, and leaves the hole at the top', () => {
    const cells = new Map<string, number>();
    for (let y = 0; y < 10; y++) cells.set(`0,${y},0`, MAT.sand);
    cells.set('0,-1,0', MAT.stone);
    const w = space(cells), fall = new SandFall();
    // dig the block at y 3: the seven above fall one cell each
    w.set(0, 3, 0, AIR);
    fall.changed(w, 0, 3, 0);
    for (let i = 0; i < 40 && fall.pending; i++) fall.step(w);
    for (let y = 0; y < 9; y++) expect(w.get(0, y, 0), `y ${y}`).toBe(MAT.sand);
    expect(w.get(0, 9, 0)).toBe(AIR);
    expect(fall.pending).toBe(0);
  });

  it('never moves more than its budget in one step, and waits for a body in the way', () => {
    const cells = new Map<string, number>();
    for (let x = 0; x < 100; x++) for (let y = 1; y < 4; y++) cells.set(`${x},${y},0`, MAT.sand);
    const w = space(cells), fall = new SandFall();
    for (let x = 0; x < 100; x++) fall.changed(w, x, 0, 0);
    expect(fall.step(w)).toBe(SAND_FALL_BUDGET);
    const body = (x: number, y: number) => x === 150 && y === 0;
    cells.set('150,1,0', MAT.sand);
    fall.changed(w, 150, 0, 0);
    for (let i = 0; i < 40; i++) fall.step(w, SAND_FALL_BUDGET, (x, y) => body(x, y));
    expect(w.get(150, 1, 0)).toBe(MAT.sand);
    expect(w.get(150, 0, 0)).toBe(AIR);
  });

  it('falls through the real terrain of the basin: dig under the surface and the sand above comes down', () => {
    const m = make();
    const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
    w.terrain = m;
    const fall = new SandFall();
    w.onChange = (x, y, z) => fall.changed(w, x, y, z);
    const [x, z] = wormDesertCentre(CX, CZ);
    const top = SURFACE_Y + m.height(x, z);
    // a pocket two cells under the top: the two blocks above fall into it, the top cell is left open
    w.set(x, top - 2, z, AIR);
    for (let i = 0; i < 20 && fall.pending; i++) fall.step(w);
    expect(w.get(x, top - 2, z)).toBe(MAT.sand);
    expect(w.get(x, top - 1, z)).toBe(MAT.sand);
    expect(w.get(x, top, z)).toBe(AIR);
  });
});
