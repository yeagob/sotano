import { describe, expect, it } from 'vitest';
import { meshChunk } from '../src/world/mesher';
import { raycastVoxels } from '../src/physics/raycast';
import { moveBody, type Body } from '../src/physics/voxel-collide';
import { buildFloor } from '../src/world/floor';
import { generatePlan, DEFAULT_PLAN } from '../src/world/floorplan';
import { ROOM_TEMPLATES, validateTemplate } from '../src/content/rooms';
import { Rng, RunRng } from '../src/core/rng';
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

describe('floor generation', () => {
  it('is deterministic per seed', () => {
    const a = buildFloor(new RunRng(5), 1, ROOM_TEMPLATES);
    const b = buildFloor(new RunRng(5), 1, ROOM_TEMPLATES);
    expect(a.rooms.map(r => r.template)).toEqual(b.rooms.map(r => r.template));
    expect(a.world.data).toEqual(b.world.data);
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

  it('connects every room (a tree reachable from the start)', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const plan = generatePlan(new Rng(seed));
      expect(plan.rooms.every(r => r.dist >= 0)).toBe(true);
      const links = plan.rooms.reduce((n, r) => n + Object.keys(r.links).length, 0) / 2;
      expect(links).toBe(plan.rooms.length - 1);
    }
  });

  it('carves walkable doorways, a spawn, a pedestal, a trapdoor and a key when a door is locked', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const f = buildFloor(new RunRng(seed), 1, ROOM_TEMPLATES);
      const [sx, sy, sz] = f.spawn;
      expect(f.world.get(Math.floor(sx), sy, Math.floor(sz))).toBe(AIR);
      for (const d of f.doors) {
        for (let x = d.x0; x <= d.x1; x++) for (let y = d.y0; y <= d.y1; y++) for (let z = d.z0; z <= d.z1; z++)
          expect(f.world.get(x, y, z)).toBe(AIR);
        expect(f.world.get(d.x0, d.y0 - 1, d.z0)).not.toBe(AIR);
      }
      expect(f.pedestals.length).toBeGreaterThanOrEqual(1);
      expect(f.trapdoor).not.toBeNull();
      expect(f.keys.length).toBe(f.doors.some(d => d.locked) ? 1 : 0);
      expect(f.doors).toHaveLength(f.rooms.length - 1);
    }
  });
  it('marks neighbour chunks dirty when editing a chunk border', () => {
    const w = new VoxelWorld(32, 32, 32);
    w.set(15, 3, 3, MAT.stone);
    expect([...w.dirty].sort()).toEqual(['0,0,0', '1,0,0']);
  });
});
