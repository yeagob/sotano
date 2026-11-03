// The staircase generator (docs/architecture/SKY.md §10.2): landings, the walk from the chamber
// of silence to the grass, and everything it must never touch.

import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { ENEMY_BUDGET } from '../src/content/enemies';
import { ROOM_D, ROOM_TEMPLATES, ROOM_W } from '../src/content/rooms';
import { RunRandom } from '../src/core/rng';
import { carveFloor, FIRST_FLOOR, floorY, LAST_FLOOR, SURFACE_Y, WORLD_SIZE, planDungeon, type FloorResult, type RoomInfo } from '../src/world/floor';
import { canHostLanding, carveStairNow, carveStair, inWell, silenceTunnel, STAIR_START_FLOOR, STAIR_TOP, stairRoute, stepPos, wellPos, type StairLanding } from '../src/world/staircase';
import { VoxelWorld } from '../src/world/world';
import { buildRun } from './helpers';

const ROUTE_SEEDS = 300;
const WALK_SEEDS = 12;

/** The floors of a seed, carved into a reused world (the routes read only the results). */
const scratch = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
function floorsOf(seed: number): FloorResult[] {
  const rr = new RunRandom(seed);
  const dungeon = planDungeon(rr);
  const out: FloorResult[] = [];
  for (let k = FIRST_FLOOR; k <= LAST_FLOOR; k++)
    out.push(carveFloor(scratch, rr, k, dungeon.plans[k], { templates: ROOM_TEMPLATES, pedestalItem: () => null, enemies: ENEMY_BUDGET }));
  return out;
}

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** The tile just inside the gap a landing opens (null for an alcove). */
function doorTiles(f: FloorResult, l: StairLanding): [number, number, number][] {
  if (l.room < 0) return [];
  const rm = f.rooms.find(r => r.id === l.room)!;
  const y0 = floorY(f.floor);
  const { hx, hz } = rm;
  if (l.side === 'n') return [[hx + 5, y0, hz], [hx + 6, y0, hz]];
  if (l.side === 's') return [[hx + 5, y0, hz + ROOM_D - 1], [hx + 6, y0, hz + ROOM_D - 1]];
  if (l.side === 'w') return [[hx, y0, hz + 2], [hx, y0, hz + 3]];
  return [[hx + ROOM_W - 1, y0, hz + 2], [hx + ROOM_W - 1, y0, hz + 3]];
}

/** Which room's open space holds each (x, z) of a floor: room index + 1, 0 for none. */
function openGrid(f: FloorResult): Int16Array {
  const g = new Int16Array(WORLD_SIZE.sx * WORLD_SIZE.sz);
  f.rooms.forEach((rm, i) => {
    for (let r = 0; r < rm.d; r++) for (let c = 0; c < rm.w; c++) if (rm.open[c + r * rm.w]) g[rm.x0 + c + (rm.z0 + r) * WORLD_SIZE.sx] = i + 1;
  });
  return g;
}

/** The rooms whose shell (two blocks round their open space, floor to ceiling) holds a cell. */
function shellsAt(f: FloorResult, g: Int16Array, x: number, y: number, z: number): RoomInfo[] {
  const out = new Set<RoomInfo>();
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx < 0 || zz < 0 || xx >= WORLD_SIZE.sx || zz >= WORLD_SIZE.sz) continue;
    const i = g[xx + zz * WORLD_SIZE.sx];
    if (!i) continue;
    const rm = f.rooms[i - 1];
    if (y >= rm.y0 - 2 && y <= rm.y0 + rm.height + 1) out.add(rm);
  }
  return [...out];
}

describe('staircase: the well', () => {
  it('turns once every 8 steps and puts every floor and the grass on the SE corner', () => {
    for (let k = FIRST_FLOOR; k <= LAST_FLOOR; k++) expect(stepPos(floorY(k))).toBe(4);
    expect(stepPos(STAIR_TOP)).toBe(4);
    expect(wellPos(4, 4)).toBe(4);
    expect(wellPos(3, 3)).toBe(-1);
    // every position is two cells or more, and the 8 positions follow each other round the core
    const cells = new Map<number, number>();
    for (let z = 1; z <= 5; z++) for (let x = 1; x <= 5; x++) { const p = wellPos(x, z); if (p >= 0) cells.set(p, (cells.get(p) ?? 0) + 1); }
    expect([...cells.keys()].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    for (const n of cells.values()) expect(n).toBeGreaterThanOrEqual(2);
    expect(STAIR_START_FLOOR).toBe(0);
  });
});

describe('staircase: landings (300 seeds)', () => {
  const runs: { seed: number; floors: FloorResult[] }[] = [];
  for (let s = 1; s <= ROUTE_SEEDS; s++) runs.push({ seed: s * 7919, floors: floorsOf(s * 7919) });

  it('every floor finds a landing, almost always a room that never seals, on a side with no door', () => {
    let alcoves = 0, total = 0;
    const sides = { n: 0, w: 0, e: 0, s: 0, alcove: 0 };
    for (const { floors } of runs) for (const f of floors) {
      const l = stairRoute(f);
      total++;
      expect(l.floor).toBe(f.floor);
      expect(l.tunnel.length).toBeGreaterThan(0);
      if (l.room < 0) { alcoves++; sides.alcove++; continue; }
      sides[l.side]++;
      const rm = f.rooms.find(r => r.id === l.room)!;
      expect(canHostLanding(rm)).toBe(true);
      expect(rm.doors[l.side.toUpperCase() as 'N' | 'S' | 'E' | 'W']).toBeUndefined();
      // the same plan, the same landing
      expect(stairRoute(f)).toEqual(l);
    }
    expect(alcoves / total).toBeLessThan(0.05);
  }, 120_000);

  it('the fixed roots plan always has its landing in a room', () => {
    for (const { floors } of runs) expect(stairRoute(floors[0]).room).toBeGreaterThanOrEqual(0);
  });

  it('tunnels stay in the floor band, out of every room space, shell and shaft but the landing gap', () => {
    const bad: string[] = [];
    for (const { seed, floors } of runs) for (const f of floors) {
      const l = stairRoute(f);
      const y0 = floorY(f.floor);
      const g = openGrid(f);
      const target = l.room >= 0 ? f.rooms.find(r => r.id === l.room)! : null;
      const tiles = doorTiles(f, l);
      const say = (what: string, x: number, y: number, z: number) => bad.push(`seed ${seed} floor ${f.floor}: ${what} at ${x},${y},${z}`);
      for (const [x, y, z] of l.tunnel) {
        if (y < y0 || y > y0 + 2) say('out of the band', x, y, z);
        if (inWell(x, z)) say('in the well', x, y, z);
        // never inside a room's open space: door approaches, centre, P, T, K and H are all in it
        if (g[x + z * WORLD_SIZE.sx]) say('in a room', x, y, z);
        // the only shell it cuts is its own room's, right in front of the door tiles
        for (const rm of shellsAt(f, g, x, y, z)) {
          if (rm !== target) say(`in the shell of ${rm.type} ${rm.id}`, x, y, z);
          else if (!tiles.some(([tx, , tz]) => Math.abs(tx - x) <= 2 && Math.abs(tz - z) <= 2)) say('in the shell of its room, away from the gap', x, y, z);
        }
        const h = f.hole;
        if (h && x >= h.x && x < h.x + h.size && z >= h.z && z < h.z + h.size && y >= h.yBottom && y <= h.yTop) say('in the shaft', x, y, z);
      }
      // the silence tunnel stays under floor 9, its two layers of rock and slab untouched
      if (f.silence) for (const [x, y, z] of silenceTunnel(f.silence)) {
        if (y > 3) say('silence tunnel too high', x, y, z);
        if (inWell(x, z)) say('silence tunnel in the well', x, y, z);
        if (x >= f.silence.x0 && x <= f.silence.x1 && z >= f.silence.z0 && z <= f.silence.z1) say('silence tunnel in the chamber', x, y, z);
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 120_000);
});

/** Stand cells reachable from `start` by walking, stepping up one (with room to jump) and dropping. */
function walk(w: VoxelWorld, start: [number, number, number], region: (x: number, y: number, z: number) => boolean) {
  const air = (x: number, y: number, z: number) => w.get(x, y, z) === AIR;
  const stand = (x: number, y: number, z: number) => !air(x, y - 1, z) && air(x, y, z) && air(x, y + 1, z) && air(x, y + 2, z);
  const seen = new Set<string>([key(...start)]);
  const queue: [number, number, number][] = [start];
  while (queue.length) {
    const [x, y, z] = queue.pop()!;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      const go = (ny: number) => {
        if (!region(nx, ny, nz) || !stand(nx, ny, nz)) return;
        const k = key(nx, ny, nz);
        if (!seen.has(k)) { seen.add(k); queue.push([nx, ny, nz]); }
      };
      go(y);
      // a step of one: the jump needs a free head over the step it leaves (1.26 + 1.8 > 3)
      if (air(x, y + 3, z)) go(y + 1);
      // walking off an edge drops to whatever is below
      if (air(nx, y, nz) && air(nx, y + 1, nz) && air(nx, y + 2, nz) && air(nx, y - 1, nz)) {
        let ny = y - 1;
        while (ny > 0 && air(nx, ny - 1, nz)) ny--;
        if (y - ny <= 8) go(ny);
      }
    }
  }
  return seen;
}

describe('staircase: the climb', () => {
  it(`from the chamber of silence to the grass, two wide, through every landing (${WALK_SEEDS} seeds)`, () => {
    for (let s = 1; s <= WALK_SEEDS; s++) {
      const run = buildRun(s * 104729);
      const { w, floors } = run;
      const before = w.data.slice();
      const job = carveStair(w, floors, 'silence', 'surface');
      let frames = 0;
      while (!job.next(400)) frames++;
      expect(frames).toBeGreaterThan(5);
      const sil = floors[LAST_FLOOR].silence!;
      const landings = floors.map(stairRoute);
      const tunnel = new Set<string>();
      for (const l of landings) for (const c of l.tunnel) tunnel.add(key(...c));
      for (const c of silenceTunnel(sil)) tunnel.add(key(...c));
      const goals = new Set<string>();
      landings.forEach((l, k) => { for (const t of doorTiles(floors[k], l)) goals.add(key(...t)); });
      const region = (x: number, y: number, z: number) =>
        inWell(x, z) || tunnel.has(key(x, y, z)) || goals.has(key(x, y, z))
        || (x >= sil.x0 && x <= sil.x1 && z >= sil.z0 && z <= sil.z1 && y <= sil.y1)
        || (y === STAIR_TOP && x <= 12 && z <= 12);
      const start: [number, number, number] = [sil.x0, 1, Math.floor((sil.z0 + sil.z1) / 2)];
      const seen = walk(w, start, region);
      // the grass outside the well
      expect([...seen].some(k => { const [x, y, z] = k.split(',').map(Number); return y === STAIR_TOP && !inWell(x, z); })).toBe(true);
      // every floor's landing, from below
      for (const l of landings) for (const t of doorTiles(floors[l.floor], l)) expect(seen.has(key(...t))).toBe(true);
      // two wide: every place you stand in the well or a tunnel has a neighbour you can stand on at the same height
      for (const k of seen) {
        const [x, y, z] = k.split(',').map(Number);
        // (the core's stump in the grass is not part of the climb)
        if ((!inWell(x, z) && !tunnel.has(k)) || wellPos(x, z) < 0) continue;
        const pair = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => seen.has(key(x + dx, y, z + dz)));
        expect(pair).toBe(true);
      }
      // what changed: only the well, the tunnels and the floors laid under them; never a cell of a
      // room's space or shell but its landing gap, never the rock between bands outside the well
      const tunnelFloor = new Set<string>();
      for (const l of landings) for (const [x, y, z] of l.tunnel) if (y === floorY(l.floor)) tunnelFloor.add(key(x, y - 1, z));
      const between = new Set<number>();
      for (let k = FIRST_FLOOR + 1; k <= LAST_FLOOR; k++) for (let d = 10; d <= 12; d++) between.add(floorY(k) + d);
      for (let d = 10; d <= 12; d++) between.add(floorY(FIRST_FLOOR) + d);
      for (let i = 0; i < before.length; i++) {
        if (before[i] === w.data[i]) continue;
        const x = i % w.sx, y = Math.floor(i / w.sx) % w.sy, z = Math.floor(i / (w.sx * w.sy));
        const k = key(x, y, z);
        expect(inWell(x, z) || tunnel.has(k) || tunnelFloor.has(k)).toBe(true);
        if (!inWell(x, z)) expect(between.has(y)).toBe(false);
      }
      // no room that can seal gains an opening
      for (const f of floors) {
        const g = openGrid(f);
        for (const [x, y, z] of stairRoute(f).tunnel) for (const rm of shellsAt(f, g, x, y, z)) expect(canHostLanding(rm)).toBe(true);
      }
      // the core is living wood all the way and the top step is the grass
      for (let y = 1; y < SURFACE_Y; y++) expect(w.get(3, y, 3)).toBe(MAT.log);
      expect(w.get(4, SURFACE_Y, 4)).toBe(MAT.grass);
    }
  }, 120_000);

  it('the roots\' flight alone reaches the surface from floor 0\'s landing', () => {
    for (let s = 1; s <= WALK_SEEDS; s++) {
      const run = buildRun(s * 15485863, 1);
      const before = run.w.data.slice();
      carveStairNow(run.w, run.floors, STAIR_START_FLOOR);
      const f = run.floors[0], l = stairRoute(f);
      expect(l.room).toBeGreaterThanOrEqual(0);
      expect(f.rooms.find(r => r.id === l.room)!.floor).toBe(0);
      const tunnel = new Set(l.tunnel.map(c => key(...c)));
      const tiles = doorTiles(f, l);
      const goals = new Set(tiles.map(t => key(...t)));
      const region = (x: number, y: number, z: number) =>
        inWell(x, z) || tunnel.has(key(x, y, z)) || goals.has(key(x, y, z)) || (y === STAIR_TOP && x <= 12 && z <= 12);
      const seen = walk(run.w, tiles[0], region);
      expect([...seen].some(k => { const [x, y, z] = k.split(',').map(Number); return y === STAIR_TOP && !inWell(x, z); })).toBe(true);
      // nothing below floor 0's level is touched
      for (let i = 0; i < before.length; i++) if (before[i] !== run.w.data[i]) {
        const y = Math.floor(i / run.w.sx) % run.w.sy;
        expect(y).toBeGreaterThanOrEqual(floorY(0) - 1);
      }
    }
  }, 120_000);
});
