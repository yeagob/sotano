// The sky's formula world with exceptions (docs/architecture/SKY.md §3.2–§3.7): what each shape
// covers, the formula read through the cache equals the formula itself in any order of
// materialisation, exceptions are kept by who writes, memory stays flat as the probe climbs, the
// mesher's borders are right next to evicted chunks, and SkyWorld passes the VoxelSpace contract.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { EL_WATER, SOURCE, elemByte } from '../src/content/elements';
import { AIR, MAT } from '../src/content/materials';
import { ExceptionKind, type Shape } from '../src/sky/types';
import { ChunkCache } from '../src/sky/world/cache';
import { buildIndex, formulaAt, formulaElemAt, skyChunk } from '../src/sky/world/shape-index';
import { boundsOf, covers, runPoints } from '../src/sky/world/shapes';
import { SKY_SX, SKY_SY, SKY_SZ, SkyWorld } from '../src/sky/world/sky-world';
import { CHUNK } from '../src/world/world';
import { voxelSpaceContract } from './helpers/voxel-space-contract';

const { stone, dirt, grass, log } = MAT;
const WATER = elemByte(EL_WATER, SOURCE);

/** Every kind of shape, overlapping, across a few dozen chunks. */
const RICH: Shape[] = [
  { k: 'box', x0: 10, y0: 100, z0: 10, x1: 60, y1: 103, z1: 60, m: stone, tag: 1 },
  { k: 'box', x0: 30, y0: 100, z0: 30, x1: 35, y1: 103, z1: 35, m: AIR },                       // an opening
  { k: 'ring', cx: 128, cz: 128, r0: 4, r1: 8, y0: 90, y1: 140, m: log, tag: 2 },
  { k: 'ring', cx: 128, cz: 128, r0: 0, r1: 12, y0: 120, y1: 120, m: dirt },
  { k: 'run', ax: 20, ay: 110, az: 20, bx: 70, by: 125, bz: 45, w: 3, h: 2, m: grass, tag: 3 },
  { k: 'helix', cx: 128, cz: 128, r: 14, w: 4, y0: 95, y1: 150, rise: 12, m: stone },
  { k: 'ledges', x0: 100, z0: 60, axis: 'x', y0: 100, y1: 140, m: dirt },
  { k: 'ledges', x0: 90, z0: 70, axis: 'z', y0: 104, y1: 130, m: stone },
  { k: 'blob', cx: 60, cy: 140, cz: 90, rx: 9, ry: 5, rz: 7, seed: 77, m: stone, tag: 4 },
  { k: 'elem', x0: 40, y0: 104, z0: 40, x1: 50, y1: 105, z1: 50, byte: WATER },
  { k: 'elem', x0: 12, y0: 100, z0: 12, x1: 14, y1: 101, z1: 14, byte: WATER },                 // inside the slab: nothing
  { k: 'box', x0: 44, y0: 105, z0: 44, x1: 45, y1: 105, z1: 45, m: stone },                    // over the water: dries it
];
const rich = () => new SkyWorld(buildIndex(RICH));
const chunksOf = (w: SkyWorld) => [...w.layout.index.keys()].map(k => [k % 16, Math.floor(k / 16) % 4096, Math.floor(k / 65536)] as const);

/** Every cell of a chunk, read through `get` and `elemAt`. */
function readChunk(w: SkyWorld, cx: number, cy: number, cz: number) {
  const out: number[] = [];
  for (let z = 0; z < CHUNK; z++) for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
    const wx = cx * CHUNK + x, wy = cy * CHUNK + y, wz = cz * CHUNK + z;
    out.push(w.get(wx, wy, wz), w.elemAt(wx, wy, wz));
  }
  return out;
}

describe('shapes: what each kind covers', () => {
  it('a box is inclusive of both corners, in any order', () => {
    const s: Shape = { k: 'box', x0: 5, y0: 6, z0: 7, x1: 2, y1: 3, z1: 4, m: stone };
    expect(covers(s, 2, 3, 4)).toBe(true);
    expect(covers(s, 5, 6, 7)).toBe(true);
    expect(covers(s, 6, 6, 7)).toBe(false);
    expect(covers(s, 2, 2, 4)).toBe(false);
    expect(boundsOf(s)).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('a ring is round, a disc at r0 0, a single hole at r0 1', () => {
    const disc: Shape = { k: 'ring', cx: 50, cz: 50, r0: 0, r1: 2, y0: 10, y1: 10, m: stone };
    const row = [-3, -2, -1, 0, 1, 2, 3].map(d => covers(disc, 50 + d, 10, 50));
    expect(row).toEqual([false, true, true, true, true, true, false]);
    expect(covers(disc, 52, 10, 52)).toBe(false); // no corner nubs
    expect(covers(disc, 51, 10, 51)).toBe(true);
    expect(covers(disc, 50, 11, 50)).toBe(false);
    const holed: Shape = { ...disc, r0: 1 };
    expect(covers(holed, 50, 10, 50)).toBe(false);
    expect(covers(holed, 51, 10, 50)).toBe(true);
    const tube: Shape = { k: 'ring', cx: 50, cz: 50, r0: 4, r1: 5, y0: 0, y1: 0, m: stone };
    expect([3, 4, 5, 6].map(d => covers(tube, 50 + d, 0, 50))).toEqual([false, true, true, false]);
  });

  it('a run is a connected line carrying its cross-section', () => {
    const s = { k: 'run', ax: 10, ay: 20, az: 30, bx: 25, by: 24, bz: 22, w: 3, h: 2, m: stone } as const;
    const pts = runPoints(s);
    expect(pts.length).toBe(16);
    expect(pts[0]).toEqual([10, 20, 30]);
    expect(pts[pts.length - 1]).toEqual([25, 24, 22]);
    for (let i = 1; i < pts.length; i++) for (let a = 0; a < 3; a++) expect(Math.abs(pts[i][a] - pts[i - 1][a])).toBeLessThanOrEqual(1);
    for (const [x, y, z] of pts) {
      for (const [dx, dz] of [[-1, -1], [1, 1], [0, 0], [1, -1]]) expect(covers(s, x + dx, y + 1, z + dz)).toBe(true);
    }
    expect(covers(s, 10, 19, 30)).toBe(false);
    const even = { ...s, w: 2 } as const; // two wide: p and p + 1
    expect(covers(even, 10, 20, 30) && covers(even, 11, 20, 31)).toBe(true);
    expect(covers({ k: 'run', ax: 10, ay: 20, az: 30, bx: 10, by: 20, bz: 30, w: 1, h: 1, m: stone }, 10, 20, 30)).toBe(true);
  });

  it('a helix has one tread per height, each beside the last, with headroom over every tread', () => {
    const s = { k: 'helix', cx: 64, cz: 64, r: 4, w: 2, y0: 10, y1: 60, rise: 8, m: stone } as const;
    const treads: [number, number][][] = [];
    for (let y = 10; y <= 60; y++) {
      const t: [number, number][] = [];
      for (let z = 58; z <= 70; z++) for (let x = 58; x <= 70; x++) if (covers(s, x, y, z)) t.push([x, z]);
      expect(t.length, `tread at ${y}`).toBeGreaterThan(0);
      treads.push(t);
    }
    for (let n = 1; n < treads.length; n++) {
      const near = treads[n].some(([x, z]) => treads[n - 1].some(([a, b]) => Math.abs(a - x) + Math.abs(b - z) <= 1));
      expect(near, `tread ${n} beside tread ${n - 1}`).toBe(true);
      // a body 1.8 high standing on a tread needs the two cells above it clear
      for (const [x, z] of treads[n - 1]) {
        expect(covers(s, x, 10 + n, z)).toBe(false);
        expect(covers(s, x, 11 + n, z)).toBe(false);
      }
    }
    expect(covers(s, 64, 20, 64)).toBe(false); // w 2 leaves the axis open
  });

  it('ledges turn round a 2 × 2 square: one per height, each beside the last, headroom 3', () => {
    for (const axis of ['x', 'z'] as const) {
      const s = { k: 'ledges', x0: 20, z0: 30, axis, y0: 5, y1: 40, m: stone } as const;
      let last: [number, number] | null = null;
      for (let y = 5; y <= 40; y++) {
        const cells: [number, number][] = [];
        for (let z = 28; z <= 33; z++) for (let x = 18; x <= 23; x++) if (covers(s, x, y, z)) cells.push([x, z]);
        expect(cells.length).toBe(1);
        const [x, z] = cells[0];
        if (last) expect(Math.abs(x - last[0]) + Math.abs(z - last[1])).toBe(1);
        for (const up of [1, 2, 3]) expect(covers(s, x, y + up, z)).toBe(false);
        last = [x, z];
      }
      expect(covers(s, 20, 5, 30)).toBe(true);
      expect(covers(s, axis === 'x' ? 21 : 20, 6, axis === 'x' ? 30 : 31)).toBe(true);
    }
  });

  it('a blob is solid at its core, ragged at its surface, nothing outside, the same every time', () => {
    const s = { k: 'blob', cx: 40, cy: 40, cz: 40, rx: 8, ry: 4, rz: 6, seed: 9, m: stone } as const;
    let inShell = 0, shell = 0;
    for (let z = 30; z <= 50; z++) for (let y = 34; y <= 46; y++) for (let x = 30; x <= 50; x++) {
      const q = ((x - 40) / 8) ** 2 + ((y - 40) / 4) ** 2 + ((z - 40) / 6) ** 2;
      const c = covers(s, x, y, z);
      expect(c).toBe(covers(s, x, y, z));
      if (q > 1) expect(c).toBe(false);
      else if (q <= 0.65) expect(c).toBe(true);
      else { shell++; if (c) inShell++; }
    }
    expect(inShell).toBeGreaterThan(0);
    expect(inShell).toBeLessThan(shell);
  });

  it('the last shape wins: an air shape carves, a block dries the water, water never lands in a block', () => {
    const L = buildIndex(RICH);
    expect(formulaAt(L, 20, 101, 20)).toBe(stone);
    expect(formulaAt(L, 32, 101, 32)).toBe(AIR);
    expect(formulaElemAt(L, 42, 104, 42)).toBe(WATER);
    expect(formulaElemAt(L, 44, 105, 44)).toBe(0);
    expect(formulaAt(L, 44, 105, 44)).toBe(stone);
    expect(formulaElemAt(L, 13, 100, 13)).toBe(0);
    expect(formulaAt(L, -1, 100, 20)).toBe(AIR);
  });

  it('tags name the platform of the shape that wins a cell', () => {
    const L = buildIndex(RICH);
    expect(L.tagAt(20, 101, 20)).toBe(1);
    expect(L.tagAt(32, 101, 32)).toBe(0);
    expect(L.tagAt(20, 110, 20)).toBe(3);
    expect(L.tagAt(60, 140, 90)).toBe(4);
    expect(L.tagAt(100, 100, 60)).toBe(0); // ledges carry no tag
    expect(L.tagAt(5, 5, 5)).toBe(0);
  });

  it('the index files each shape under every chunk it touches, clipped to the world', () => {
    const L = buildIndex([
      { k: 'box', x0: 0, y0: 0, z0: 0, x1: 31, y1: 15, z1: 15, m: stone },
      { k: 'box', x0: -40, y0: -40, z0: -40, x1: -1, y1: -1, z1: -1, m: stone },
      { k: 'box', x0: 250, y0: 10, z0: 250, x1: 300, y1: 10, z1: 300, m: stone },
    ]);
    expect([...L.index.keys()].sort((a, b) => a - b)).toEqual([skyChunk(0, 0, 0), skyChunk(1, 0, 0), skyChunk(15, 0, 15)]);
    expect([...L.index.get(skyChunk(0, 0, 0))!]).toEqual([0]);
    expect([...L.index.get(skyChunk(15, 0, 15))!]).toEqual([2]);
  });
});

describe('the cache', () => {
  it('memoises the last chunk, touches the LRU order only on a miss, and evicts the oldest', () => {
    const c = new ChunkCache(2);
    const a = { blocks: new Uint8Array(1), elem: null }, b = { blocks: new Uint8Array(1), elem: null }, d = { blocks: new Uint8Array(1), elem: null };
    c.put(1, a); c.put(2, b);
    expect(c.get(1)).toBe(a);     // a miss of the memo: 1 becomes the youngest
    c.put(3, d);                  // evicts 2
    expect(c.has(2)).toBe(false);
    expect(c.has(1)).toBe(true);
    expect(c.get(3)).toBe(d);
    expect(c.get(3)).toBe(d);     // the memo
    expect(c.size).toBe(2);
    expect(c.peek(2)).toBeUndefined();
  });
});

describe('SkyWorld: the formula through the cache', () => {
  it('get equals base and elemAt equals the formula\'s element for every cell of the layout\'s chunks', () => {
    const w = rich();
    const chunks = chunksOf(w);
    expect(chunks.length).toBeGreaterThan(20);
    for (const [cx, cy, cz] of chunks) {
      for (let z = 0; z < CHUNK; z++) for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
        const wx = cx * CHUNK + x, wy = cy * CHUNK + y, wz = cz * CHUNK + z;
        const g = w.get(wx, wy, wz), b = w.base(wx, wy, wz);
        if (g !== b) expect(g, `${wx},${wy},${wz}`).toBe(b);
        const e = w.elemAt(wx, wy, wz), f = formulaElemAt(w.layout, wx, wy, wz);
        if (e !== f) expect(e, `elem ${wx},${wy},${wz}`).toBe(f);
      }
    }
    expect(w.stats().exceptions).toBe(0);
  });

  it('materialising in two different orders, with evictions, gives identical bytes', () => {
    const chunks = chunksOf(rich());
    const a = new SkyWorld(buildIndex(RICH));
    const b = new SkyWorld(buildIndex(RICH), { cacheChunks: 3 });
    const edits = (w: SkyWorld) => { w.set(20, 101, 20, AIR); w.placing = true; w.set(32, 101, 32, dirt); w.placing = false; w.setElem(41, 106, 41, EL_WATER, 4); };
    edits(a); edits(b);
    const fromA = chunks.map(([x, y, z]) => readChunk(a, x, y, z));
    const order = [...chunks].reverse();
    for (const [x, y, z] of order) readChunk(b, x, y, z);
    const fromB = new Map(order.map(([x, y, z]) => [`${x},${y},${z}`, readChunk(b, x, y, z)]));
    chunks.forEach(([x, y, z], n) => expect(fromB.get(`${x},${y},${z}`)).toEqual(fromA[n]));
    expect(b.stats().cached).toBeLessThanOrEqual(3);
    for (const [x, y, z] of chunks) for (const elem of [false, true]) expect(b.paddedChunk(x, y, z, elem)).toEqual(a.paddedChunk(x, y, z, elem));
  });

  it('a chunk with no shape and no exception is empty, and reading it allocates nothing', () => {
    const w = rich();
    expect(w.emptyChunk(0, 0, 0)).toBe(true);
    expect(w.emptyChunk(0, 6, 0)).toBe(false); // the slab reaches y 100, chunk row 6
    for (let y = 0; y < 2000; y += 7) expect(w.get(3, y, 200)).toBe(AIR);
    expect(w.stats().cached).toBe(0);
    for (const [cx, cy, cz] of chunksOf(w)) expect(w.emptyChunk(cx, cy, cz)).toBe(false);
    expect(w.emptyChunk(-1, 0, 0)).toBe(true);
    w.set(3, 3000, 3, stone);
    expect(w.emptyChunk(0, 187, 0)).toBe(false);
    expect(w.get(3, 3000, 3)).toBe(stone);
    w.set(3, 3000, 3, AIR);
    expect(w.emptyChunk(0, 187, 0)).toBe(true);
  });

  it('paddedChunk next to an evicted chunk with exceptions matches a fully materialised copy', () => {
    const shapes: Shape[] = [{ k: 'box', x0: 120, y0: 112, z0: 120, x1: 150, y1: 120, z1: 150, m: stone }];
    const small = new SkyWorld(buildIndex(shapes), { cacheChunks: 2 });
    const big = new SkyWorld(buildIndex(shapes));
    for (const w of [small, big]) {
      w.set(144, 114, 130, AIR);             // broken, across the +x border of chunk (8, 7, 8)
      w.placing = true; w.set(144, 121, 131, dirt); w.placing = false;
      w.set(144, 116, 132, AIR);
      w.setElem(144, 116, 132, EL_WATER, SOURCE);
      w.set(130, 128, 130, grass);           // across the +y border
    }
    // touch every cell of the neighbours in the big world; push them out of the small one
    for (const [cx, cy, cz] of [[9, 7, 8], [8, 8, 8]] as const) { readChunk(big, cx, cy, cz); readChunk(small, cx, cy, cz); }
    for (const [cx, cy, cz] of [[0, 7, 0], [1, 7, 1], [2, 7, 2]] as const) small.set(cx * 16, cy * 16, cz * 16, stone);
    for (const [cx, cy, cz] of [[0, 7, 0], [1, 7, 1], [2, 7, 2]] as const) small.get(cx * 16, cy * 16, cz * 16);
    expect(small.stats().cached).toBeLessThanOrEqual(2);
    for (const elem of [false, true]) {
      const got = small.paddedChunk(8, 7, 8, elem), want = big.paddedChunk(8, 7, 8, elem);
      expect(got).toEqual(want);
    }
    const P = CHUNK + 2;
    expect(small.paddedChunk(8, 7, 8)[(144 - 127) + P * ((114 - 111) + P * (130 - 127))]).toBe(AIR);
    expect(small.paddedChunk(8, 7, 8, true)[(144 - 127) + P * ((116 - 111) + P * (132 - 127))]).toBe(elemByte(EL_WATER, SOURCE));
  });
});

describe('SkyWorld: exceptions by who writes', () => {
  it('setting a cell to its formula value leaves no exception', () => {
    const w = rich();
    w.set(20, 101, 20, AIR);
    expect(w.stats().exceptions).toBe(1);
    w.set(20, 101, 20, stone);
    expect(w.stats().exceptions).toBe(0);
    w.set(200, 10, 200, stone);
    w.set(200, 10, 200, AIR);
    expect(w.stats().exceptions).toBe(0);
    expect(w.kindAt(w.idx(200, 10, 200))).toBe(0);
  });

  it('breaking 500 original blocks fires onBroken once each, and regrowth leaves no Broken', () => {
    const w = rich();
    const broken: number[] = [];
    w.onBroken = i => broken.push(i);
    let n = 0;
    for (let z = 10; z <= 60 && n < 500; z++) for (let x = 10; x <= 60 && n < 500; x++) {
      if (w.get(x, 102, z) === AIR) continue;
      w.set(x, 102, z, AIR); n++;
    }
    expect(n).toBe(500);
    expect(w.stats().byKind[ExceptionKind.Broken]).toBe(500);
    expect(broken.length).toBe(500);
    // a second change of a changed cell does not fire again
    w.set(10, 102, 10, dirt);
    expect(w.kindAt(w.idx(10, 102, 10))).toBe(ExceptionKind.Replaced);
    expect(broken.length).toBe(500);
    // regrowth, past its 6 s: every departed cell back to the formula (L1 drives it from onBroken)
    for (const i of broken) w.restore(i);
    const s = w.stats();
    expect(s.byKind[ExceptionKind.Broken]).toBe(0);
    expect(s.byKind[ExceptionKind.Replaced]).toBe(0);
    expect(s.exceptions).toBe(0);
    expect(w.get(10, 102, 10)).toBe(stone);
  });

  it('placing 100 blocks leaves exactly 100 Placed; a write without placing is never Placed', () => {
    const w = rich();
    w.placing = true;
    for (let n = 0; n < 100; n++) w.set(150 + (n % 10), 200 + Math.floor(n / 10), 150, dirt);
    w.placing = false;
    expect(w.stats().byKind[ExceptionKind.Placed]).toBe(100);
    expect(w.stats().exceptions).toBe(100);
    w.set(170, 200, 150, dirt);
    expect(w.kindAt(w.idx(170, 200, 150))).toBe(ExceptionKind.Replaced);
    expect(w.stats().byKind[ExceptionKind.Placed]).toBe(100);
    // a reaction over a placed block keeps it the player's
    w.set(150, 200, 150, stone);
    expect(w.kindAt(w.idx(150, 200, 150))).toBe(ExceptionKind.Placed);
    // removing a placed block from the air leaves nothing; from a broken cell, a Broken that regrows
    w.set(151, 200, 150, AIR);
    expect(w.kindAt(w.idx(151, 200, 150))).toBe(0);
    w.set(20, 101, 20, AIR);
    w.placing = true; w.set(20, 101, 20, dirt); w.placing = false;
    expect(w.kindAt(w.idx(20, 101, 20))).toBe(ExceptionKind.Placed);
    const fired: number[] = [];
    w.onBroken = i => fired.push(i);
    w.set(20, 101, 20, AIR);
    expect(w.kindAt(w.idx(20, 101, 20))).toBe(ExceptionKind.Broken);
    expect(fired).toEqual([w.idx(20, 101, 20)]);
  });

  it('an element-layer write leaves no block exception, and survives eviction', () => {
    const w = new SkyWorld(buildIndex(RICH), { cacheChunks: 1 });
    w.setElem(200, 300, 200, EL_WATER, SOURCE);
    w.setElem(42, 104, 42, EL_WATER, 3);
    w.setElemByte(43, 104, 43, 0);
    const s = w.stats();
    expect(s.exceptions).toBe(0);
    expect(s.elemEdits).toBe(3);
    w.get(0, 100, 0); w.get(128, 130, 128);
    expect(w.elemAt(200, 300, 200)).toBe(WATER);
    expect(w.elemAt(42, 104, 42)).toBe(elemByte(EL_WATER, 3));
    expect(w.elemAt(43, 104, 43)).toBe(0);
    w.setElemByte(43, 104, 43, WATER);
    expect(w.stats().elemEdits).toBe(2);
    // a block displaces the element, and the dry cell is remembered
    w.placing = true; w.set(46, 104, 46, dirt); w.placing = false;
    expect(w.elemAt(46, 104, 46)).toBe(0);
    w.set(46, 104, 46, AIR);
    expect(w.elemAt(46, 104, 46)).toBe(0);
  });

  it('transient cells refuse placed blocks and return at their time, in order', () => {
    const w = rich();
    w.placing = true; w.set(150, 50, 150, dirt); w.placing = false;
    expect(w.setTransient(150, 50, 150, AIR, 5, 1)).toBe(false);
    expect(w.get(150, 50, 150)).toBe(dirt);
    expect(w.setTransient(20, 101, 20, AIR, 5, 1)).toBe(true);   // an opened hole
    expect(w.setTransient(150, 60, 150, stone, 3, 2)).toBe(true); // a cage cube
    expect(w.setTransient(151, 60, 150, stone, 8, 2)).toBe(true);
    expect(w.kindAt(w.idx(20, 101, 20))).toBe(ExceptionKind.Transient);
    expect(w.stats().byKind[ExceptionKind.Transient]).toBe(3);
    w.expire(2.9);
    expect(w.get(150, 60, 150)).toBe(stone);
    w.expire(5);
    expect(w.get(150, 60, 150)).toBe(AIR);
    expect(w.get(20, 101, 20)).toBe(stone);
    expect(w.get(151, 60, 150)).toBe(stone);
    // renewed before its time: the old timer does nothing
    w.setTransient(151, 60, 150, stone, 20, 2);
    w.expire(10);
    expect(w.get(151, 60, 150)).toBe(stone);
    w.expire(20);
    expect(w.get(151, 60, 150)).toBe(AIR);
    expect(w.stats().exceptions).toBe(1); // the placed block
  });

  it('a story change is the new baseline: restore and regrowth return to it', () => {
    const w = rich();
    const gate = w.idx(20, 101, 20), bridge = w.idx(200, 80, 200);
    w.setStory(20, 101, 20, AIR);
    w.setStory(200, 80, 200, stone);
    expect(w.kindAt(gate)).toBe(ExceptionKind.Story);
    expect(w.get(20, 101, 20)).toBe(AIR);
    expect(w.base(20, 101, 20)).toBe(stone);
    w.placing = true; w.set(20, 101, 20, dirt); w.placing = false;
    expect(w.kindAt(gate)).toBe(ExceptionKind.Placed);
    expect(w.knockTower([gate, bridge])).toEqual([gate]);
    expect(w.get(20, 101, 20)).toBe(AIR);
    expect(w.kindAt(gate)).toBe(ExceptionKind.Story);
    const fired: number[] = [];
    w.onBroken = i => fired.push(i);
    w.set(200, 80, 200, AIR);
    expect(fired).toEqual([bridge]);
    w.restore(bridge);
    expect(w.get(200, 80, 200)).toBe(stone);
    expect(w.stats().byKind[ExceptionKind.Story]).toBe(2);
    expect(w.stats().exceptions).toBe(2);
  });

  it('the tower knock turns placed cells to air and returns them', () => {
    const w = rich();
    const cells: number[] = [];
    w.placing = true;
    for (let y = 0; y < 6; y++) { w.set(180, 10 + y, 180, dirt); cells.push(w.idx(180, 10 + y, 180)); }
    w.placing = false;
    w.set(181, 10, 180, dirt); // not the player's
    const knocked = w.knockTower([...cells, w.idx(181, 10, 180), w.idx(5, 5, 5)]);
    expect(knocked).toEqual(cells);
    for (const i of cells) expect(w.getAt(i)).toBe(AIR);
    expect(w.get(181, 10, 180)).toBe(dirt);
    expect(w.stats().byKind[ExceptionKind.Placed]).toBe(0);
  });

  it('an evicted chunk keeps its exceptions, and the mesher hears of changes to it', () => {
    const w = new SkyWorld(buildIndex(RICH), { cacheChunks: 1 });
    w.get(20, 101, 20);
    w.get(128, 130, 128); // evicts the slab's chunk
    w.dirty.clear();
    w.set(20, 101, 20, AIR);
    expect(w.dirty.has('1,6,1')).toBe(true);
    w.get(128, 130, 128);
    expect(w.get(20, 101, 20)).toBe(AIR);
    w.dirty.clear();
    w.get(128, 130, 128);
    w.setStory(21, 101, 21, AIR);
    expect(w.dirty.has('1,6,1')).toBe(true);
    w.get(128, 130, 128);
    expect(w.get(21, 101, 21)).toBe(AIR);
  });

  it('the player\'s block in a broken cell stays Placed even when it is the formula\'s own material', () => {
    const w = rich();
    const i = w.idx(20, 101, 20);
    expect(w.base(20, 101, 20)).toBe(stone);
    w.set(20, 101, 20, AIR);
    expect(w.kindAt(i)).toBe(ExceptionKind.Broken);
    w.placing = true; w.set(20, 101, 20, stone); w.placing = false;
    expect(w.kindAt(i)).toBe(ExceptionKind.Placed);
    expect(w.get(20, 101, 20)).toBe(stone);
    // the tower knock takes it, and the cell is Broken again (regrowth brings the formula back)
    expect(w.knockTower([i])).toEqual([i]);
    expect(w.kindAt(i)).toBe(ExceptionKind.Broken);
    // without placing, the formula's value still leaves no exception
    w.set(20, 101, 20, stone);
    expect(w.kindAt(i)).toBe(0);
  });

  it('restore leaves a placed block alone', () => {
    const w = rich();
    const air = w.idx(150, 200, 150), broken = w.idx(20, 101, 20);
    w.set(20, 101, 20, AIR);
    w.placing = true; w.set(150, 200, 150, dirt); w.set(20, 101, 20, dirt); w.placing = false;
    const version = w.version;
    w.restore(air); w.restore(broken);
    expect(w.kindAt(air)).toBe(ExceptionKind.Placed);
    expect(w.kindAt(broken)).toBe(ExceptionKind.Placed);
    expect(w.get(150, 200, 150)).toBe(dirt);
    expect(w.get(20, 101, 20)).toBe(dirt);
    expect(w.version).toBe(version);
  });
});

describe('SkyWorld: prefetch', () => {
  it('an empty chunk is never prefetched (it is never stored), a chunk with content once', () => {
    const w = rich();
    expect(w.emptyChunk(0, 0, 0)).toBe(true);
    expect(w.prefetch(0, 0, 0)).toBe(false);
    expect(w.prefetch(0, 0, 0)).toBe(false);
    expect(w.prefetch(-1, 0, 0)).toBe(false);
    expect(w.stats().cached).toBe(0);
    expect(w.prefetch(0, 6, 0)).toBe(true);    // the slab reaches y 100, chunk row 6
    expect(w.prefetch(0, 6, 0)).toBe(false);
    expect(w.stats().cached).toBe(1);
    // an exception makes an empty chunk worth prefetching
    w.set(3, 3000, 3, stone);
    expect(w.prefetch(0, 187, 0)).toBe(true);
  });
});

describe('SkyWorld: memory stays flat', () => {
  /** A Totality-like climb: a stone every 6 blocks of height round the axis, a thin column beside it. */
  const climb = (height: number): Shape[] => {
    const out: Shape[] = [{ k: 'ring', cx: 128, cz: 128, r0: 2, r1: 3, y0: 0, y1: height, m: log }];
    for (let y = 6; y <= height; y += 6) {
      const a = (y * 37) % 360 * Math.PI / 180;
      const x = 128 + Math.round(Math.cos(a) * 8), z = 128 + Math.round(Math.sin(a) * 8);
      out.push({ k: 'box', x0: x - 1, y0: y, z0: z - 1, x1: x + 1, y1: y, z1: z + 1, m: stone, tag: y });
    }
    return out;
  };
  /** Walks a probe up the axis, prefetching the chunks within two of its chunk, at most 8 a step. */
  const walk = (w: SkyWorld, top: number) => {
    for (let y = 0; y <= top; y += 4) {
      let budget = 8;
      const cy = y >> 4;
      for (let dz = -2; dz <= 2 && budget; dz++) for (let dy = -2; dy <= 2 && budget; dy++) for (let dx = -2; dx <= 2 && budget; dx++)
        if (!w.emptyChunk(8 + dx, cy + dy, 8 + dz) && w.prefetch(8 + dx, cy + dy, 8 + dz)) budget--;
      w.get(128, y, 128);
    }
  };

  it('walking a probe up 20 000 blocks keeps the cache at its cap and the exceptions unchanged', () => {
    const w = new SkyWorld(buildIndex(climb(20000)));
    w.placing = true; w.set(130, 7, 130, dirt); w.placing = false;
    const before = w.stats();
    walk(w, 20000);
    const after = w.stats();
    expect(after.cached).toBeLessThanOrEqual(1024);
    expect(after.cached).toBe(1024);
    expect(after.exceptions).toBe(before.exceptions);
    expect(w.get(130, 7, 130)).toBe(dirt);
    expect(w.get(128, 19990, 126)).toBe(log);
  });

  it('three times the height is three times the shapes, not three times the bytes per block', () => {
    const h = 1000;
    const one = new SkyWorld(buildIndex(climb(h)), { cacheChunks: 64 });
    const three = new SkyWorld(buildIndex(climb(3 * h)), { cacheChunks: 64 });
    walk(one, h); walk(three, 3 * h);
    const a = one.stats(), b = three.stats();
    expect(b.shapes / a.shapes).toBeGreaterThan(2.9);
    expect(b.shapes / a.shapes).toBeLessThan(3.1);
    expect(a.cached).toBe(64);
    expect(b.cached).toBe(64);
    expect(b.bytes).toBeLessThan(3 * a.bytes);
    expect(b.bytes / (3 * h)).toBeLessThan(a.bytes / h);
    // a flat array would cost 256 × 256 bytes per block of height
    expect(b.bytes / (3 * h)).toBeLessThan(SKY_SX * SKY_SZ / 50);
    expect(SKY_SY).toBe(65536);
  });

  it('indices reach 2^32 exactly and coords inverts them at the top of the world', () => {
    const w = new SkyWorld(buildIndex([]));
    const i = w.idx(SKY_SX - 1, SKY_SY - 1, SKY_SZ - 1);
    expect(i).toBe(2 ** 32 - 1);
    expect(w.coords(i)).toEqual([SKY_SX - 1, SKY_SY - 1, SKY_SZ - 1]);
    w.set(SKY_SX - 1, SKY_SY - 1, SKY_SZ - 1, stone);
    expect(w.getAt(i)).toBe(stone);
    w.damaged.set(i, 3);
    expect(w.hp(SKY_SX - 1, SKY_SY - 1, SKY_SZ - 1)).toBe(3);
  });
});

describe('SkyWorld: speed', () => {
  // Deterministic, not a wall-clock ratio (which flakes on a loaded machine): a read of the memoised
  // chunk must cost one comparison, so it never reaches the LRU map nor reorders it (cache.ts [m4]).
  it('a read of the memoised chunk never touches the LRU: no map access, no reorder', () => {
    const w = rich();
    const cache = (w as unknown as { cache: ChunkCache }).cache;
    const map = (cache as unknown as { map: Map<number, unknown> }).map;
    const own = skyChunk(1, 6, 1), other = skyChunk(2, 6, 2);
    const cells: number[] = [];
    let expected = 0;
    for (let z = 0; z < CHUNK; z++) for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
      cells.push(w.idx(16 + x, 96 + y, 16 + z));
      expected += w.base(16 + x, 96 + y, 16 + z);
    }
    w.get(16, 96, 16); w.get(32, 96, 32); w.get(16, 96, 16);   // both materialised, own memoised and youngest
    expect([...cache.keys()]).toEqual([other, own]);
    const calls = [vi.spyOn(cache, 'get'), vi.spyOn(map, 'get'), vi.spyOn(map, 'set'), vi.spyOn(map, 'delete')];
    let sum = 0;
    for (let n = 0; n < 50; n++) for (const i of cells) sum += w.getAt(i);
    for (let z = 0; z < CHUNK; z++) for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) sum += w.get(16 + x, 96 + y, 16 + z);
    expect(sum).toBe(expected * 51);
    expect(sum).toBeGreaterThan(0);
    for (const c of calls) expect(c).not.toHaveBeenCalled();
    expect([...cache.keys()]).toEqual([other, own]);
    // a memo miss does reach the map, once, and moves that chunk to the young end
    w.get(32, 96, 32);
    expect(calls[0]).toHaveBeenCalledTimes(1);
    expect([...cache.keys()]).toEqual([own, other]);
    for (const c of calls) c.mockRestore();
  });
});

describe('SkyWorld: structure code stays pure', () => {
  it('src/sky/world never imports fx or three.js and never draws randomness', () => {
    const dir = join('src', 'sky', 'world');
    for (const f of readdirSync(dir)) {
      const text = readFileSync(join(dir, f), 'utf8');
      expect(text, f).not.toMatch(/from ['"].*core\/fx['"]/);
      expect(text, f).not.toMatch(/from ['"]three['"]/);
      expect(text, f).not.toMatch(/Math\.random\(/);
    }
  });
});

voxelSpaceContract('SkyWorld', () => new SkyWorld(buildIndex([])));
