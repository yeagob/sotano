import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { MAT } from '../src/content/materials';
import { EYE_STAND } from '../src/entities/stance';
import { arrivalYaw } from '../src/game/checkpoint';
import { FOV_MAX, FOV_MIN } from '../src/game/settings';
import { MASTERY_STONE, MASTERY_ZERO, masteryStoneBlocks, masteryStoneMount, masteryStoneWidth, romanNumeral } from '../src/render/mastery-layout';
import { panelMount } from '../src/render/panel-layout';
import type { FloorResult, RoomInfo } from '../src/world/floor';
import type { VoxelWorld } from '../src/world/world';
import { buildRun } from './helpers';

type V = [number, number, number];

function cellsAlong(a: V, b: V): V[] {
  const d: V = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const cell: V = [Math.floor(a[0]), Math.floor(a[1]), Math.floor(a[2])];
  const end: V = [Math.floor(b[0]), Math.floor(b[1]), Math.floor(b[2])];
  const step = d.map(Math.sign) as V;
  const tMax = [0, 1, 2].map(i => d[i] === 0 ? Infinity : ((step[i] > 0 ? cell[i] + 1 : cell[i]) - a[i]) / d[i]);
  const tDelta = [0, 1, 2].map(i => d[i] === 0 ? Infinity : Math.abs(1 / d[i]));
  const cells: V[] = [[cell[0], cell[1], cell[2]]];
  for (let n = 0; n < 1000 && (cell[0] !== end[0] || cell[1] !== end[1] || cell[2] !== end[2]); n++) {
    const i = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : (tMax[1] < tMax[2] ? 1 : 2);
    if (tMax[i] > 1) break;
    cell[i] += step[i];
    tMax[i] += tDelta[i];
    cells.push([cell[0], cell[1], cell[2]]);
  }
  return cells;
}

interface Box { min: V; max: V; what: string }

function hitsBox(a: V, b: V, box: Box): boolean {
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 3; i++) {
    const d = b[i] - a[i];
    if (d === 0) { if (a[i] < box.min[i] || a[i] > box.max[i]) return false; continue; }
    let lo = (box.min[i] - a[i]) / d, hi = (box.max[i] - a[i]) / d;
    if (lo > hi) [lo, hi] = [hi, lo];
    t0 = Math.max(t0, lo); t1 = Math.min(t1, hi);
    if (t0 > t1) return false;
  }
  return true;
}

function pickupBoxes(f: FloorResult, rooms: number[]): Box[] {
  const on = (room: number) => rooms.includes(room);
  const tile = (x: number, z: number, y0: number, y1: number, what: string): Box =>
    ({ min: [x + 0.15, y0, z + 0.15], max: [x + 0.85, y1, z + 0.85], what });
  const boxes: Box[] = [];
  for (const p of f.pedestals) if (on(p.room)) boxes.push(tile(p.x, p.z, p.y, p.y + 1.1, 'pedestal practice'));
  for (const p of [...f.practices, ...(f.altar ? [f.altar] : [])]) if (on(p.room)) boxes.push(tile(p.x, p.z, p.y, p.y + 2.1, 'roots practice'));
  for (const c of f.chests) if (on(c.room)) {
    boxes.push({ min: [c.x, c.y, c.z], max: [c.x + 1, c.y + 1.3, c.z + 1], what: 'chest' });
    if (c.meditation) boxes.push({ min: [c.x + 0.25, c.y + 1, c.z + 0.25], max: [c.x + 0.75, c.y + 3.6, c.z + 0.75], what: 'the Boundary over its chest' });
  }
  for (const p of [...f.keys, ...f.bombs, ...f.hearts]) if (on(p.room)) boxes.push(tile(p.x, p.z, p.y, p.y + 1, 'loose pickup'));
  return boxes;
}

function stoneSamples(way: RoomInfo, level: number): V[] {
  const m = masteryStoneMount(way.hx, way.y0, way.hz, level);
  const pts: V[] = [];
  const nx = 9, ny = 5, e = 0.02;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x = m.x - m.w / 2 + e + (m.w - 2 * e) * i / (nx - 1);
    const y = m.y - m.h / 2 + e + (m.h - 2 * e) * j / (ny - 1);
    pts.push([x, y, m.z]);
  }
  return pts;
}

function sightLines(w: VoxelWorld, f: FloorResult, level: number): string[] {
  const start = f.rooms.find(r => r.type === 'start')!;
  const way = f.rooms.find(r => r.type === 'boss')!;
  const eye: V = [f.spawn[0], f.spawn[1] + EYE_STAND, f.spawn[2]];
  const boxes = pickupBoxes(f, [start.id, way.id]);
  const blocked: string[] = [];
  for (const p of stoneSamples(way, level)) {
    const cell = cellsAlong(eye, p).find(([x, y, z]) => w.solid(x, y, z));
    if (cell) { blocked.push(`(${p.map(v => v.toFixed(2)).join(', ')}) by block ${cell.join(',')}`); continue; }
    const box = boxes.find(b => hitsBox(eye, p, b));
    if (box) blocked.push(`(${p.map(v => v.toFixed(2)).join(', ')}) by ${box.what}`);
  }
  return blocked;
}

function inView(f: FloorResult, target: V, fov: number, aspect: number): boolean {
  const cam = new PerspectiveCamera(fov, aspect, 0.05, 200);
  cam.position.set(f.spawn[0], f.spawn[1] + EYE_STAND, f.spawn[2]);
  cam.rotation.set(0, arrivalYaw(f), 0, 'YXZ');
  cam.updateMatrixWorld();
  const n = new Vector3(...target).project(cam);
  return Math.abs(n.x) < 1 && Math.abs(n.y) < 1 && n.z > -1 && n.z < 1;
}

describe('the mastery stone: its numeral', () => {
  it('cuts the level in Roman numerals, N for level 0', () => {
    const cases: [number, string][] = [[0, 'N'], [1, 'I'], [4, 'IV'], [9, 'IX'], [40, 'XL'], [90, 'XC'], [100, 'C']];
    for (const [level, glyph] of cases) expect(romanNumeral(level)).toBe(glyph);
    expect(MASTERY_ZERO).toBe('N');
  });

  it('gives the classical form for every level and clamps outside 0 to 100', () => {
    const value: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
    for (let n = 1; n <= 100; n++) {
      const s = romanNumeral(n);
      expect(s).toMatch(/^C?(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/);
      let sum = 0;
      for (let i = 0; i < s.length; i++) {
        const v = value[s[i]], next = value[s[i + 1]] ?? 0;
        sum += v < next ? -v : v;
      }
      expect(sum).toBe(n);
    }
    expect(romanNumeral(-3)).toBe('N');
    expect(romanNumeral(150)).toBe('C');
    expect(romanNumeral(12.7)).toBe('XII');
    expect(romanNumeral(Number.NaN)).toBe('N');
    expect(Math.max(...Array.from({ length: 101 }, (_, n) => romanNumeral(n).length))).toBe(8);
  });
});

describe('the mastery stone: where it is cut', () => {
  it('sits on the way-down room south wall, facing north, sized to its numeral and clear of the south panel', () => {
    for (let level = 0; level <= 100; level++) {
      const m = masteryStoneMount(100, 50, 200, level);
      expect(m).toMatchObject({ x: 106.5, z: 207 - MASTERY_STONE.inset, rotY: Math.PI, h: 1.5 });
      expect(m.y).toBeCloseTo(53.6);
      expect(m.w).toBeGreaterThanOrEqual(MASTERY_STONE.minW);
      expect(m.w).toBeLessThanOrEqual(MASTERY_STONE.maxW);
      for (const layout of ['teaching', 'easy'] as const) {
        const p = panelMount('roots-door', 'south', 100, 50, 200, layout);
        expect(m.x + m.w / 2).toBeLessThan(p.x - p.w / 2);
      }
      expect(m.y + m.h / 2).toBeLessThan(50 + 5);
      expect(masteryStoneBlocks(100, 50, 200, level).length).toBe((Math.ceil(6.5 + m.w / 2) - Math.floor(6.5 - m.w / 2)) * 3);
    }
    expect(masteryStoneWidth(88)).toBe(MASTERY_STONE.maxW);
    expect(masteryStoneWidth(100)).toBe(MASTERY_STONE.minW);
    expect(masteryStoneWidth(88)).toBeGreaterThan(masteryStoneWidth(38));
  });

  for (const easyRoots of [false, true]) {
    for (const mastery of [0, 38, 88, 100]) {
      it(`is in sight of the spawn, through the open doors, in the ${easyRoots ? 'easy' : 'teaching'} layout at level ${mastery}`, () => {
        for (const seed of [1, 2, 3, 7, 11, 0xBEEF]) {
          const run = buildRun(seed, 1, undefined, { mastery, easyRoots });
          const f = run.floors[0];
          const way = f.rooms.find(r => r.type === 'boss')!;
          expect(way.template).toBe('roots-door');
          for (const [x, y, z] of masteryStoneBlocks(way.hx, way.y0, way.hz, mastery)) {
            expect(run.w.solid(x, y, z), `wall block ${x},${y},${z}`).toBe(true);
            expect(run.w.solid(x, y, z - 1), `air in front of ${x},${y},${z}`).toBe(false);
          }
          expect(sightLines(run.w, f, mastery)).toEqual([]);
        }
      });
    }
  }

  for (const easyRoots of [false, true]) {
    for (const mastery of [0, 38, 88, 100]) {
      it(`is in front of the player at the first frame, in the ${easyRoots ? 'easy' : 'teaching'} layout at level ${mastery}`, () => {
        for (const seed of [1, 2, 3, 7, 11, 0xBEEF]) {
          const run = buildRun(seed, 1, undefined, { mastery, easyRoots });
          const f = run.floors[0];
          const way = f.rooms.find(r => r.type === 'boss')!;
          const m = masteryStoneMount(way.hx, way.y0, way.hz, mastery);
          const centre: V = [m.x, m.y, m.z];
          const eye: V = [f.spawn[0], f.spawn[1] + EYE_STAND, f.spawn[2]];
          expect(cellsAlong(eye, centre).filter(([x, y, z]) => run.w.solid(x, y, z))).toEqual([]);
          for (const fov of [FOV_MIN, FOV_MAX]) for (const aspect of [1, 16 / 9]) {
            for (const p of [centre, [m.x - m.w / 2, m.y, m.z] as V, [m.x + m.w / 2, m.y, m.z] as V])
              expect(inView(f, p, fov, aspect), `seed ${seed}, fov ${fov}, aspect ${aspect.toFixed(2)}, point ${p.join(',')}`).toBe(true);
          }
        }
      });
    }
  }

  it('would be hidden if the start room had no door to the way down (the test can fail)', () => {
    const run = buildRun(1, 1, undefined, { mastery: 0 });
    const f = run.floors[0];
    const door = f.doors.find(d => d.rooms.includes(f.rooms.find(r => r.type === 'boss')!.id))!;
    for (let x = door.x0; x <= door.x1; x++) for (let y = door.y0; y <= door.y1; y++) for (let z = door.z0; z <= door.z1; z++)
      run.w.data[run.w.idx(x, y, z)] = MAT.brick;
    expect(sightLines(run.w, f, 0).length).toBe(9 * 5);
  });
});
