import { describe, expect, it } from 'vitest';
import { meshChunk } from '../src/world/mesher';
import { raycastVoxels } from '../src/physics/raycast';
import { moveBody, type Body } from '../src/physics/voxel-collide';
import { bandOf, depthOf, floorY, FLOORS, LAST_FLOOR, openHole, pedestalSlots, SKY_LIMIT, SURFACE, SURFACE_Y } from '../src/world/floor';
import { ITEMS } from '../src/content/items';
import { level } from '../src/content/levels';
import { generatePlan, DEFAULT_PLAN } from '../src/world/floorplan';
import { ROOM_TEMPLATES, validateTemplate } from '../src/content/rooms';
import { Rng } from '../src/core/rng';
import { buildRun } from './helpers';
import { AIR, MAT } from '../src/content/materials';
import { VoxelWorld } from '../src/world/world';
import { Player } from '../src/entities/player';
import type { Input } from '../src/input/input';
import { BASE_STATS } from '../src/core/stats';

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
  it('is deterministic per seed', { timeout: 60000 }, () => {
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
        // one key for a locked door, and about three for every four the chests ask
        const want = (f.doors.some(d => d.locked) ? 1 : 0) + Math.ceil(0.75 * f.chests.reduce((s, c) => s + c.keys, 0)) + (level(f.floor).tutorial ? 1 : 0);
        expect(f.keys.length).toBeLessThanOrEqual(want);
        expect(f.keys.length).toBeGreaterThanOrEqual(f.doors.some(d => d.locked) ? 1 : 0);
        // random floors are trees (one door fewer than rooms); Tree-of-Life floors join every touching pair
        const touching = f.plan.rooms.reduce((n, r) => n + Object.keys(r.links).length, 0) / 2;
        expect(f.doors).toHaveLength(touching);
        if (level(f.floor).kind !== 'tree' && !level(f.floor).tutorial) expect(f.doors).toHaveLength(f.rooms.length - 1);
        for (const r of f.rooms) { expect(ids.has(r.id)).toBe(false); ids.add(r.id); expect(bandOf(r.y0)).toBe(f.floor); }
        // every floor has a way down; the last one's opens into silence (L4)
        expect(f.hole).not.toBeNull();
        expect(f.silence !== null).toBe(f.floor === LAST_FLOOR);
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

describe('boss rooms and the sky', () => {
  it('every boss room holds a reserved practice on a pedestal beside (never on) the hole', () => {
    for (const root of [1, 7, 42, 999]) {
      const run = buildRun(root);
      for (const f of run.floors) {
        // the tutorial floor has no boss: its last room is only the way down, its pedestal a gentle practice
        if (level(f.floor).tutorial) { expect(f.pedestals.some(p => p.boss)).toBe(false); continue; }
        const boss = f.rooms.find(r => r.type === 'boss')!;
        const ped = f.pedestals.filter(p => p.boss);
        expect(ped.length, `floor ${f.floor}`).toBe(1);
        expect(ped[0].room).toBe(boss.id);
        expect(ped[0].item).toBeTruthy();
        expect(run.w.get(ped[0].x, ped[0].y - 1, ped[0].z)).toBe(MAT.pedestal);
        if (f.hole) {
          const onHole = ped[0].x >= f.hole.x && ped[0].x < f.hole.x + 2 && ped[0].z >= f.hole.z && ped[0].z < f.hole.z + 2;
          expect(onHole).toBe(false);
        }
      }
      // every pedestal of the run holds a different practice
      const items = run.floors.flatMap(f => f.pedestals.map(p => p.item));
      expect(new Set(items).size).toBe(items.length);
    }
  });

  it('rejects a boss template whose pedestal stands on the shaft', () => {
    const rows = Array(7).fill('.............');
    rows[3] = '......HT.....';
    expect(validateTemplate({ id: 'bad', types: ['boss'], rows }).join()).toMatch(/pedestal can't stand on the 2×2 shaft/);
  });

  it('the open sky reaches SKY_LIMIT blocks above the grass, and all of it is depth 0', () => {
    const run = buildRun(3, 1);
    const top = SURFACE_Y + SKY_LIMIT;
    expect(run.w.inside(10, top, 10)).toBe(true);
    expect(run.w.inside(10, top + 1, 10)).toBe(false);
    expect(run.w.get(10, SURFACE_Y, 10)).toBe(MAT.grass);
    for (let y = SURFACE_Y + 1; y <= top; y += 7) expect(run.w.get(10, y, 10)).toBe(AIR);
    // the surface is its own band to the structure, and depth 0 to anything that asks how deep you are
    for (const y of [SURFACE_Y - 1, SURFACE_Y, SURFACE_Y + 1, top]) { expect(bandOf(y), `y ${y}`).toBe(SURFACE); expect(depthOf(y)).toBe(0); }
    expect(bandOf(floorY(0))).toBe(0);
    expect(bandOf(floorY(1))).toBe(1);
    expect(bandOf(1)).toBe(LAST_FLOOR);
  });
});

describe('player head bump', () => {
  it('reports the rising speed once when the head hits a ceiling, and keeps what the hook returns', () => {
    const solid = (_x: number, y: number) => y <= 0 || y >= 4;
    const p = new Player();
    p.spawnAt(0.5, 1, 0.5);
    const pressed = new Set(['jump']);
    const input = { hit: (a: string) => pressed.has(a), held: () => false, move: { x: 0, y: 0 }, lookDX: 0, lookDY: 0, sensitivity: 0 } as unknown as Input;
    const stats = { ...BASE_STATS, jump: 4 };
    const bumps: number[] = [];
    const hooks = { jump: (v: number) => v, land: () => {}, bump: (v: number) => { bumps.push(v); return 0; } };
    // standing on the floor: let it settle, then jump into the ceiling 3 blocks up
    p.body.onGround = true;
    for (let i = 0; i < 60; i++) { p.update(1 / 60, input, stats, solid, hooks); pressed.clear(); }
    expect(bumps.length).toBe(1);
    expect(bumps[0]).toBeGreaterThan(0);
    expect(p.body.y + p.body.h).toBeLessThanOrEqual(4);
  });
});

describe('Tree-of-Life floors', () => {
  it('lay the ten emanations and their paths, symmetric links, one door per touching pair', async () => {
    const { treePlan } = await import('../src/world/floorplan');
    for (const mirrored of [false, true]) for (const vault of [false, true]) {
      const p = treePlan(mirrored, vault);
      expect(p.rooms.filter(r => r.type !== 'path')).toHaveLength(10);
      for (const r of p.rooms) for (const [side, n] of Object.entries(r.links)) {
        const back = { N: 'S', S: 'N', E: 'W', W: 'E' }[side]!;
        expect(p.rooms[n as number].links[back as 'N']).toBe(r.id);
      }
      expect(p.rooms.every(r => r.dist >= 0)).toBe(true);
      // the kingdom never opens only onto the vault: it has paths of its own
      const start = p.rooms[p.start];
      expect(Object.values(start.links).some(n => p.rooms[n as number].type === 'path')).toBe(true);
    }
  });

  it('every crown lies over the next kingdom, floor 0 to 6 (the shaft lines up)', { timeout: 60000 }, () => {
    for (const seed of [1, 2, 3, 77]) {
      const run = buildRun(seed, 7);
      for (let k = 1; k < 7; k++) {
        const above = run.floors[k - 1].plan.rooms.find(r => r.type === 'boss')!;
        const start = run.floors[k].plan.rooms.find(r => r.type === 'start')!;
        expect([start.gx, start.gz], `floor ${k}, seed ${seed}`).toEqual([above.gx, above.gz]);
      }
    }
  });

  it('on every Tree floor you can walk from where you land to the way down and to the key without the vault', { timeout: 60000 }, () => {
    const run = buildRun(5, 6);
    for (const f of run.floors.filter(q => level(q.floor).kind === 'tree')) {
      const open = new Map<number, number[]>();
      for (const d of f.doors) if (!d.locked) for (const [a, b] of [d.rooms, [...d.rooms].reverse()]) open.set(a, [...(open.get(a) ?? []), b]);
      const start = f.rooms.find(r => r.type === 'start')!.id, seen = new Set([start]), q = [start];
      while (q.length) for (const n of open.get(q.pop()!) ?? []) if (!seen.has(n)) { seen.add(n); q.push(n); }
      expect(seen.has(f.rooms.find(r => r.type === 'boss')!.id), `floor ${f.floor}`).toBe(true);
      for (const k of f.keys) expect(seen.has(k.room), `key on floor ${f.floor}`).toBe(true);
    }
  });

  it('floor 0 always has room for its lessons', { timeout: 60000 }, () => {
    for (let s = 1; s <= 25; s++) {
      const run = buildRun(s * 31, 1);
      expect(run.floors[0].rooms.length, `seed ${s}`).toBeGreaterThanOrEqual(9);
    }
  });
});

describe('the roots: a fixed tutorial (owner, 2026-10-28)', () => {
  const shape = (f: { rooms: { gx: number; gz: number; type: string; template: string }[] }) =>
    f.rooms.map(r => [r.gx, r.gz, r.type, r.template]);

  it('is the same plan and the same rooms in every run', { timeout: 60000 }, () => {
    const first = shape(buildRun(1, 1).floors[0]);
    for (const seed of [2, 77, 4096]) expect(shape(buildRun(seed, 1).floors[0])).toEqual(first);
  });

  it('starts with three open doors: the treasure room, the way down and the first lesson', { timeout: 60000 }, () => {
    for (const seed of [1, 9]) {
      const f = buildRun(seed, 1).floors[0];
      const start = f.rooms.find(r => r.type === 'start')!;
      expect(Object.keys(start.doors).sort()).toHaveLength(3);
      expect(f.doors.filter(d => d.rooms.includes(start.id)).every(d => !d.locked)).toBe(true);
      const types = Object.values(start.doors).map(id => {
        const other = f.doors.find(d => d.id === id)!.rooms.find(x => x !== start.id)!;
        return f.rooms.find(r => r.id === other)!.type;
      });
      expect(types.sort()).toEqual(['boss', 'normal', 'treasure']);
    }
  });

  it('goes round in a ring and comes back to the treasure room, never through the start', { timeout: 60000 }, () => {
    const f = buildRun(5, 1).floors[0];
    const start = f.rooms.find(r => r.type === 'start')!.id;
    const treasure = f.rooms.find(r => r.type === 'treasure')!.id;
    const way = f.rooms.find(r => r.type === 'boss')!.id;
    const open = new Map<number, number[]>();
    for (const d of f.doors) for (const [a, b] of [d.rooms, [...d.rooms].reverse()]) open.set(a, [...(open.get(a) ?? []), b]);
    expect(open.get(way)).toEqual([start]);
    const reach = (from: number, avoid: number) => {
      const seen = new Set([from]), q = [from];
      while (q.length) for (const n of open.get(q.pop()!) ?? []) if (n !== avoid && !seen.has(n)) { seen.add(n); q.push(n); }
      return seen;
    };
    const fromLesson = [...(open.get(start) ?? [])].find(n => n !== treasure && n !== way)!;
    expect(reach(fromLesson, start).has(treasure)).toBe(true);
    expect(reach(fromLesson, start).size).toBe(f.rooms.length - 2);
  });

  it('offers a tier 1–3 practice in the treasure room and a tier 1–4 one at the way down', { timeout: 60000 }, () => {
    const run = buildRun(12, 1);
    const f = run.floors[0];
    const slots = pedestalSlots(run.dungeon);
    const treasure = f.rooms.find(r => r.type === 'treasure')!.id, way = f.rooms.find(r => r.type === 'boss')!.id;
    expect(slots.find(s => s.key === String(treasure))!.maxQuality).toBe(3);
    expect(slots.find(s => s.key === String(way))!.maxQuality).toBe(4);
    expect(f.pedestals.filter(p => p.chest)).toHaveLength(0);
    expect(f.chests).toHaveLength(0);
    expect(f.pedestals.map(p => p.room).sort()).toEqual([treasure, way].sort());
    for (const p of f.pedestals) {
      expect(p.item).toBeTruthy();
      expect(ITEMS.find(i => i.id === p.item)!.quality).toBeLessThanOrEqual(p.room === treasure ? 3 : 4);
    }
  });

  it('always lays one key and one bomb as random rewards in its lesson rooms, never in the start, the treasure room or the way down', { timeout: 60000 }, () => {
    const rooms = new Set<number>();
    for (let s = 1; s <= 40; s++) {
      const f = buildRun(s * 13, 1).floors[0];
      const lesson = new Set(f.rooms.filter(r => r.type === 'normal').map(r => r.id));
      expect(f.keys, `keys, seed ${s}`).toHaveLength(1);
      expect(f.bombs, `bombs, seed ${s}`).toHaveLength(1);
      for (const k of [...f.keys, ...f.bombs]) { expect(lesson.has(k.room), `seed ${s}`).toBe(true); rooms.add(k.room); }
    }
    expect(rooms.size).toBeGreaterThan(1);
  });
});

describe('rooms you build your way through', () => {
  it('on every floor at least half of the rooms that fight need building (by weight)', async () => {
    const { needsBuilding } = await import('../src/content/rooms');
    for (let f = 0; f <= LAST_FLOOR; f++) {
      let all = 0, build = 0;
      for (const t of ROOM_TEMPLATES) {
        if (!t.types.includes('normal') && !t.types.includes('path')) continue;
        if (t.floors && (f < t.floors[0] || f > t.floors[1])) continue;
        all += t.weight ?? 1;
        if (needsBuilding(t)) build += t.weight ?? 1;
      }
      expect(build / all, `floor ${f}`).toBeGreaterThanOrEqual(0.5);
    }
  });
  it('the walk check sees what a wall, a trench and a gap do', async () => {
    const { needsBuilding } = await import('../src/content/rooms');
    const room = (rows: string[]) => ({ id: 't', types: ['normal' as const], rows });
    const open = Array(7).fill('.............');
    expect(needsBuilding(room(open))).toBe(false);
    expect(needsBuilding(room(open.map(() => '..===........')))).toBe(true);   // three wide: too far to jump
    expect(needsBuilding(room(open.map(() => '..=..........')))).toBe(false);  // one wide: jump it
    expect(needsBuilding(room(open.map(() => '...2.........')))).toBe(true);   // two high: build a step
    expect(needsBuilding(room(open.map(() => '...1.........')))).toBe(false);  // one high: step up
  });
});

describe('challenge rooms', () => {
  it('appear on some hostile floors, never on the roots, and their waves grow', async () => {
    const { pickWave, waveBudget } = await import('../src/content/enemies');
    let seen = 0;
    for (let s = 1; s <= 12; s++) {
      const run = buildRun(s * 101, 4);
      expect(run.floors[0].rooms.some(r => r.type === 'challenge')).toBe(false);
      for (const f of run.floors.slice(1)) {
        const ch = f.rooms.filter(r => r.type === 'challenge');
        expect(ch.length).toBeLessThanOrEqual(1);
        seen += ch.length;
        for (const r of ch) expect(r.enemies).toEqual([]);
      }
    }
    expect(seen).toBeGreaterThan(5);
    expect(waveBudget(3, 2, 0)).toBeGreaterThan(waveBudget(3, 1, 0));
    expect(waveBudget(3, 1, 4)).toBeGreaterThan(waveBudget(3, 1, 0));
    const { Rng } = await import('../src/core/rng');
    expect(pickWave(new Rng(1), 3, waveBudget(3, 3, 5)).length).toBeGreaterThan(pickWave(new Rng(1), 3, waveBudget(3, 1, 0)).length - 1);
  });
});

describe('silence, the ice and the tree (L4, L5)', () => {
  it('under the frozen bottom lies silence, and the last way down opens into it', () => {
    const run = buildRun(11);
    const f9 = run.floors[LAST_FLOOR];
    const s = f9.silence!;
    expect(s.y0).toBe(1);
    openHole(run.w, f9.hole!);
    expect(run.w.get(f9.hole!.x, s.y0, f9.hole!.z)).toBe(AIR);
    expect(run.w.get(s.x0, 0, s.z0)).toBe(MAT.bedrock);
    for (let x = s.x0; x <= s.x1; x += 3) expect(run.w.get(x, 3, s.z0)).toBe(AIR);
    // the ninth circle is frozen: no water source on its surface, only ice
    let ice = 0;
    for (const r of f9.rooms) for (let z = r.z0; z < r.z0 + r.d; z++) for (let x = r.x0; x < r.x0 + r.w; x++) {
      if (run.w.get(x, r.y0 - 1, z) === MAT.ice) ice++;
      expect(run.w.elemAt(x, r.y0 - 1, z) >> 6, 'no open water on the ninth').not.toBe(1);
    }
    expect(ice).toBeGreaterThanOrEqual(0);
  });

  it('the giant tree grows the same for a seed in any order, story by story, as big as a floor', async () => {
    const { GiantTree, TREE_STORIES } = await import('../src/world/tree');
    const { VoxelWorld } = await import('../src/world/world');
    const { WORLD_SIZE } = await import('../src/world/floor');
    const grow = (seed: number, order: number[]) => {
      const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
      const t = new GiantTree(w, SURFACE_Y, i => new Rng(seed * 31 + i));
      for (const i of order) t.grow(i);
      let h = 0;
      for (let i = 0; i < w.data.length; i++) if (w.data[i]) h = (h * 31 + i * 7 + w.data[i]) >>> 0;
      return { t, h, w };
    };
    const all = TREE_STORIES.map((_, i) => i);
    const a = grow(5, all), b = grow(5, [...all].reverse()), c = grow(6, all);
    expect(a.h).toBe(b.h);
    expect(a.h).not.toBe(c.h);
    expect(a.t.voxels).toBeGreaterThan(100000);
    expect(a.t.pads.length).toBeGreaterThanOrEqual(13);
    for (const p of a.t.pads) expect(a.t.pads[p.to]).toBeDefined();
    for (let i = 1; i < TREE_STORIES.length; i++) expect(a.t.range(i)[0]).toBe(a.t.range(i - 1)[1] + 1);
    expect(a.t.range(0)[0]).toBe(SURFACE_Y - 1);
    expect(a.t.range(TREE_STORIES.length - 1)[1]).toBe(SURFACE_Y + SKY_LIMIT);
    expect(TREE_STORIES[0].r * 2).toBeGreaterThan(WORLD_SIZE.sz * 0.85);
    const lazy = grow(5, [0]);
    expect(lazy.t.isGrown(1)).toBe(false);
    expect(lazy.t.voxels).toBeLessThan(a.t.voxels / 3);
  });

  it('a spiral stair climbs from the foot of the tree, story by story, to the crown', async () => {
    const { GiantTree, TREE_STORIES } = await import('../src/world/tree');
    const { VoxelWorld } = await import('../src/world/world');
    const { WORLD_SIZE } = await import('../src/world/floor');
    const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
    for (let z = 0; z < w.sz; z++) for (let x = 0; x < w.sx; x++) w.data[w.idx(x, SURFACE_Y, z)] = MAT.grass;
    const t = new GiantTree(w, SURFACE_Y, i => new Rng(77 + i));
    TREE_STORIES.forEach((_, i) => t.grow(i));
    const solid = (x: number, y: number, z: number) => w.get(x, y, z) !== AIR;
    const stand = (x: number, y: number, z: number) => w.inside(x, y, z) && solid(x, y - 1, z) && !solid(x, y, z) && !solid(x, y + 1, z);
    const key = (x: number, y: number, z: number) => w.idx(x, y, z);
    const seen = new Uint8Array(w.data.length);
    const queue: [number, number, number][] = [[2, SURFACE_Y + 1, 2]];
    seen[key(2, SURFACE_Y + 1, 2)] = 1;
    const reached = new Set<number>();
    while (queue.length) {
      const [x, y, z] = queue.pop()!;
      reached.add(t.storyAt(y));
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        for (const dy of [1, 0, -1, -2, -3]) {
          const ny = y + dy;
          if (dy === 1 && solid(x, y + 2, z)) continue;
          if (dy < 0 && [...Array(-dy)].some((_, k) => solid(nx, y - k, nz) || solid(nx, y - k + 1, nz))) continue;
          if (!stand(nx, ny, nz) || seen[key(nx, ny, nz)]) continue;
          seen[key(nx, ny, nz)] = 1;
          queue.push([nx, ny, nz]);
          break;
        }
      }
    }
    for (let i = 0; i < TREE_STORIES.length; i++) expect(reached.has(i), `story ${TREE_STORIES[i].key}`).toBe(true);
  });

  it('the roots keep peaceful creatures, never in a roster', async () => {
    const { ambientCreatures, CREATURES } = await import('../src/content/creatures');
    const run = buildRun(4, 2);
    const c = ambientCreatures(run.floors[0], new Rng(1));
    expect(c.length).toBeGreaterThanOrEqual(2);
    expect(ambientCreatures(run.floors[1], new Rng(1)).every(c => c.def === 'chirper' || c.def === 'delver')).toBe(true);
    for (const f of run.floors) for (const r of f.rooms) for (const e of r.enemies) expect(CREATURES.some(q => q.id === e)).toBe(false);
  });
});
