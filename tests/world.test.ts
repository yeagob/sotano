import { describe, expect, it } from 'vitest';
import { meshChunk } from '../src/world/mesher';
import { raycastVoxels } from '../src/physics/raycast';
import { moveBody, type Body } from '../src/physics/voxel-collide';
import { generateM0, FLOOR_Y, ROOM } from '../src/world/gen';
import { ROOM_TEMPLATES, validateTemplate, ROOM_W, ROOM_D } from '../src/content/rooms';
import { Rng } from '../src/core/rng';
import { AIR, MAT } from '../src/content/materials';
import { VoxelWorld } from '../src/world/world';

describe('room templates', () => {
  it('are all valid', () => {
    for (const t of ROOM_TEMPLATES) expect(validateTemplate(t)).toEqual([]);
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

describe('M0 generation', () => {
  it('is deterministic and leaves an empty room with a spawn point', () => {
    const a = generateM0(5, new Rng(5), ROOM_TEMPLATES);
    const b = generateM0(5, new Rng(5), ROOM_TEMPLATES);
    expect(a.template).toBe(b.template);
    expect(a.world.data).toEqual(b.world.data);
    const [sx, sy, sz] = a.spawn;
    expect(a.world.get(Math.floor(sx), sy, Math.floor(sz))).toBe(AIR);
    expect(a.world.get(Math.floor(sx), sy - 1, Math.floor(sz))).toBe(MAT.brick);
    expect(a.world.get(ROOM.x0 + ROOM_W, FLOOR_Y, ROOM.z0 + ROOM_D)).toBe(MAT.brick);
  });
  it('marks neighbour chunks dirty when editing a chunk border', () => {
    const w = new VoxelWorld(32, 32, 32);
    w.set(15, 3, 3, MAT.stone);
    expect([...w.dirty].sort()).toEqual(['0,0,0', '1,0,0']);
  });
});
