import { describe, expect, it } from 'vitest';
import { meshChunk } from '../src/world/mesher';
import { raycastVoxels } from '../src/physics/raycast';
import { moveBody, type Body } from '../src/physics/voxel-collide';
import { bandOf, FLOORS, openHole } from '../src/world/floor';
import { generatePlan, DEFAULT_PLAN } from '../src/world/floorplan';
import { ROOM_TEMPLATES, validateTemplate } from '../src/content/rooms';
import { Rng } from '../src/core/rng';
import { buildRun } from './helpers';
import { AIR, MAT } from '../src/content/materials';
import { VoxelWorld } from '../src/world/world';

describe('room templates', () => {
  it('are all valid', () => {
    for (const t of ROOM_TEMPLATES) expect(validateTemplate(t)).toEqual([]);
  });
  it('cover every room type', () => {
    for (const type of ['start', 'normal', 'treasure', 'boss', 'vault'])
      expect(ROOM_TEMPLATES.some(t => t.types.includes(type as never))).toBe(true);
  });
  it('reject blocked doorways', () => {
    const bad = { id: 'bad', types: ['normal' as const], rows: ['.....r.......', ...Array(6).fill('.............')] };
    expect(validateTemplate(bad).join()).toMatch(/N door is blocked/);
  });
});

describe('mesher', () => {
  it('emits 6 faces for a lone block and culls shared faces', () => {
    const P = 4;
    const one = new Uint8Array(P ** 3);
    one[1 + P * (1 + P * 1)] = MAT.stone;
    expect(meshChunk(one, 2).indices.length).toBe(6 * 6);
    const two = one.slice();
    two[2 + P * (1 + P * 1)] = MAT.stone;
    expect(meshChunk(two, 2).indices.length).toBe(10 * 6);
  });
});

describe('raycast', () => {
  it('finds the block and the face it entered through', () => {
    const solid = (x: number, y: number, z: number) => x === 5 && y === 0 && z === 0;
    const hit = raycastVoxels(solid, 0.5, 0.5, 0.5, 1, 0, 0, 10)!;
    expect([hit.x, hit.y, hit.z, hit.nx]).toEqual([5, 0, 0, -1]);
    expect(hit.t).toBeCloseTo(4.5);
    expect(raycastVoxels(solid, 0.5, 0.5, 0.5, 1, 0, 0, 3)).toBeNull();
  });
});

describe('voxel collision', () => {
  it('lands on the floor and stops at walls', () => {
    const solid = (x: number, y: number, _z: number) => y < 0 || x >= 3;
    const b: Body = { x: 0.5, y: 2, z: 0.5, vx: 10, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: false };
    for (let i = 0; i < 120; i++) { b.vy -= 28 / 60; b.vx = 10; moveBody(solid, b, 1 / 60); }
    expect(b.onGround).toBe(true);
    expect(b.y).toBeCloseTo(0, 3);
    expect(b.x).toBeLessThanOrEqual(3 - 0.3);
    expect(b.x).toBeGreaterThan(2.6);
  });
});

function dungeon(seed: number, floors = 2) {
  const run = buildRun(seed, floors);
  return { w: run.w, floors: run.floors };
}

describe('dungeon generation', () => {
  it('is deterministic per seed', () => {
    const a = dungeon(5), b = dungeon(5);
    expect(a.floors.map(f => f.rooms.map(r => r.template))).toEqual(b.floors.map(f => f.rooms.map(r => r.template)));
    expect(a.w.data).toEqual(b.w.data);
  });

  it('always has a start, a treasure room and a boss room far from the start', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const plan = generatePlan(new Rng(seed));
      const types = plan.rooms.map(r => r.type);
      expect(types.filter(t => t === 'start')).toHaveLength(1);
      expect(types.filter(t => t === 'treasure')).toHaveLength(1);
      expect(types.filter(t => t === 'boss')).toHaveLength(1);
      const boss = plan.rooms.find(r => r.type === 'boss')!;
      expect(boss.dist).toBeGreaterThanOrEqual(2);
      expect(Object.keys(boss.links)).toHaveLength(1);
      expect(plan.rooms.length).toBeGreaterThanOrEqual(DEFAULT_PLAN.minRooms);
    }
  });

  it('can start a plan from any of the 49 grid cells (floors start under the boss above)', () => {
    for (let gz = 0; gz < 7; gz++) for (let gx = 0; gx < 7; gx++) for (let seed = 1; seed <= 6; seed++) {
      const plan = generatePlan(new Rng(seed * 100 + gx * 7 + gz), DEFAULT_PLAN, [gx, gz]);
      expect(plan.rooms[0]).toMatchObject({ gx, gz, type: 'start' });
      expect(plan.rooms.some(r => r.type === 'boss')).toBe(true);
    }
  });

  it('connects every room (a tree reachable from the start)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const plan = generatePlan(new Rng(seed));
      expect(plan.rooms.every(r => r.dist >= 0)).toBe(true);
      const links = plan.rooms.reduce((n, r) => n + Object.keys(r.links).length, 0) / 2;
      expect(links).toBe(plan.rooms.length - 1);
    }
  });

  it('carves walkable doorways, spawn, pedestals and unique global room ids on every floor', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const { w, floors } = dungeon(seed, FLOORS);
      const ids = new Set<number>();
      for (const f of floors) {
        const [sx, sy, sz] = f.spawn;
        if (f.floor === 1) expect(w.get(Math.floor(sx), sy, Math.floor(sz))).toBe(AIR);
        for (const d of f.doors) {
          for (let x = d.x0; x <= d.x1; x++) for (let y = d.y0; y <= d.y1; y++) for (let z = d.z0; z <= d.z1; z++)
            expect(w.get(x, y, z)).toBe(AIR);
          expect(w.get(d.x0, d.y0 - 1, d.z0)).not.toBe(AIR);
        }
        expect(f.pedestals.length).toBeGreaterThanOrEqual(1);
        expect(f.keys.length).toBe(f.doors.some(d => d.locked) ? 1 : 0);
        expect(f.doors).toHaveLength(f.rooms.length - 1);
        for (const r of f.rooms) { expect(ids.has(r.id)).toBe(false); ids.add(r.id); expect(bandOf(r.y0)).toBe(f.floor); }
        expect(f.hole === null).toBe(f.floor === FLOORS);
      }
    }
  });

  it('the hole drops you from the boss room straight into the next start room', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { w, floors } = dungeon(seed, 2);
      const hole = floors[0].hole!;
      openHole(w, hole);
      // the shaft is open from the boss room floor down into floor 2
      for (let y = hole.yBottom; y <= hole.yTop; y++) expect(w.get(hole.x, y, hole.z)).toBe(AIR);
      // and it ends inside floor 2's start room
      const start = floors[1].rooms.find(r => r.type === 'start')!;
      expect(hole.x).toBeGreaterThanOrEqual(start.x0);
      expect(hole.x + 1).toBeLessThan(start.x0 + 13);
      expect(hole.z).toBeGreaterThanOrEqual(start.z0);
      expect(hole.z + 1).toBeLessThan(start.z0 + 7);
      expect(w.solid(hole.x, start.y0 - 1, hole.z)).toBe(true); // you land on its floor
    }
  });
  it('marks neighbour chunks dirty when editing a chunk border', () => {
    const w = new VoxelWorld(32, 32, 32);
    w.set(15, 3, 3, MAT.stone);
    expect([...w.dirty].sort()).toEqual(['0,0,0', '1,0,0']);
  });
});
