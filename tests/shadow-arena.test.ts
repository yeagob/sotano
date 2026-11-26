// The Shadow's arena (floor 9): the biggest room a floor can hold, the fight started across it, and cover of every
// material the frozen floor has, spread so the fight stays readable (docs/design/built/bosses/ARENAS.md).

import { describe, expect, it } from 'vitest';
import { BOSSES } from '../src/content/bosses';
import { shadowLife } from '../src/content/bosses/mirror';
import { level } from '../src/content/levels';
import { MAT, mat } from '../src/content/materials';
import {
  CELL_STACK, MAX_ROOM_H, ROOM_TEMPLATES, doorApproach, spawnPockets, templateDims, validateTemplate, type RoomTemplate,
} from '../src/content/rooms';
import { FlowField, reachOf } from '../src/enemies/flowfield';
import type { Enemy, EnemyCtx } from '../src/enemies/types';
import { farthestCell, type Cell } from '../src/game/omens';
import { moveBody, boxHits } from '../src/physics/voxel-collide';
import { RunRandom } from '../src/core/rng';
import { fitTemplates, LAST_FLOOR, planDungeon, type FloorResult, type RoomInfo } from '../src/world/floor';
import type { VoxelWorld } from '../src/world/world';
import { buildRun } from './helpers';

const ARENA = ROOM_TEMPLATES.find(t => t.id === 'mirror-hall')!;
const SHADOW = BOSSES.find(b => b.id === 'shadow')!;
/** The distance, in blocks, the fight now starts at from either door (the old two-cell halls drew a random tile at least 3.5 away). */
const FAR = 25;

/** The material a template character carves on floor 9: built pieces take the floor's palette, ore its zone's ore, shallow water freezes. */
function materialOf(ch: string): number | null {
  const lv = level(LAST_FLOOR);
  if (ch === 'w') return MAT.ice;
  const s = CELL_STACK[ch];
  if (!s) return null;
  if (s.m === MAT.brick) return MAT[ch === '#' ? lv.palette.wall : lv.palette.trim];
  if (s.m === MAT.ore) return MAT[lv.ore];
  return s.m;
}

/** Blocks a line of sight at eye height: anything two blocks high or more (the rule the corners use, LAYOUT-RULES). */
const tall = (ch: string | undefined) => ch === undefined || ch === '#' || ch === 'X' || (CELL_STACK[ch]?.h ?? 0) >= 2;

/** Tiles of the template where the boss may rise: open floor at the floor's level (what `spawnSpot` lists in the game). */
function floorTiles(t: RoomTemplate): Cell[] {
  const out: Cell[] = [];
  t.rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '.' || ch === 'H' || ch === 'K' || ch === 'w') out.push({ x: c + 0.5, z: r + 0.5 }); }));
  return out;
}

/** Where you stand as you come in through a door of the home cell (the middle tile of its approach), and the doorway beyond it. */
function entries(t: RoomTemplate): { side: string; you: Cell; door: Cell }[] {
  const out = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] } as const;
  return Object.entries(doorApproach(t)).map(([side, tiles]) => {
    const [c, r] = tiles![1], [dc, dr] = out[side as keyof typeof out];
    return { side, you: { x: c + 0.5, z: r + 0.5 }, door: { x: c + 0.5 + dc, z: r + 0.5 + dr } };
  });
}

/** True when nothing two blocks high stands between a and b (a line that only grazes a block's edge still sees). */
function sees(t: RoomTemplate, a: Cell, b: Cell): boolean {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) * 8);
  for (let i = 1; i < n; i++) {
    const x = a.x + (b.x - a.x) * i / n, z = a.z + (b.z - a.z) * i / n, c = Math.floor(x), r = Math.floor(z);
    if (!tall(t.rows[r]?.[c])) continue;
    if (Math.min(x - c, c + 1 - x, z - r, r + 1 - z) < 0.2) continue;
    return false;
  }
  return true;
}

/** The pieces of cover: groups of blocks touching side by side (a two-by-two pillar is one piece). */
function coverPieces(t: RoomTemplate): string[][] {
  const [W, D] = templateDims(t);
  const seen = new Set<number>(), pieces: string[][] = [];
  const cover = (c: number, r: number) => c >= 0 && r >= 0 && c < W && r < D && (!!CELL_STACK[t.rows[r][c]] || t.rows[r][c] === 'w');
  for (let r = 0; r < D; r++) for (let c = 0; c < W; c++) {
    if (!cover(c, r) || seen.has(c + r * W)) continue;
    const piece: string[] = [], q = [[c, r]];
    seen.add(c + r * W);
    while (q.length) {
      const [x, z] = q.pop()!;
      piece.push(t.rows[z][x]);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (cover(nx, nz) && !seen.has(nx + nz * W)) { seen.add(nx + nz * W); q.push([nx, nz]); }
      }
    }
    pieces.push(piece);
  }
  return pieces;
}

describe('the Shadow arena: the template', () => {
  it('passes the validator and the open-corner rules', () => {
    expect(validateTemplate(ARENA)).toEqual([]);
    expect(spawnPockets(ARENA)).toEqual([]);
  });

  it('is the biggest room a floor holds: four cells (28 by 16 blocks) at the band\'s full height', () => {
    expect(ARENA.size).toEqual([2, 2]);
    expect(templateDims(ARENA)).toEqual([28, 16]);
    expect(ARENA.height).toBe(MAX_ROOM_H);
    expect(ARENA.ceiling ?? 'flat').toBe('flat');
    // a template is at most two cells each way: nothing bigger passes the validator
    expect(validateTemplate({ ...ARENA, size: [3, 2] }).join()).toMatch(/1–2 cells each way/);
    expect(validateTemplate({ ...ARENA, height: MAX_ROOM_H + 1 }).join()).toMatch(/never reach the floor above/);
  });

  it('is the only boss room of floor 9 and appears on no other floor', () => {
    const own = ROOM_TEMPLATES.filter(t => t.types.includes('boss') && (t.size ?? [1, 1])[0] * (t.size ?? [1, 1])[1] > 1 && (!t.floors || (t.floors[0] <= 9 && t.floors[1] >= 9)));
    expect(own.map(t => t.id)).toEqual(['mirror-hall']);
    expect(ARENA.floors).toEqual([9, 9]);
    expect(ARENA.bossStart).toBe('far');
  });

  it('holds plenty of cover, of at least six materials, some a shot breaks and some it does not', () => {
    const pieces = coverPieces(ARENA);
    expect(pieces.length).toBeGreaterThanOrEqual(20);
    const mats = new Set(pieces.flat().map(materialOf).filter((m): m is number => m !== null));
    expect(mats.size).toBeGreaterThanOrEqual(6);
    for (const key of ['darkbrick', 'ashlar', 'stone', 'crate', 'obsidian', 'leadore', 'dirt', 'ice'] as const) expect(mats.has(MAT[key]), key).toBe(true);
    // a shot breaks tier-0 blocks on hit (the game's projectileBlock), and stops on anything harder
    const soft = [...mats].filter(m => mat(m).tier === 0), hard = [...mats].filter(m => mat(m).tier >= 1);
    expect(soft.length).toBeGreaterThanOrEqual(2);
    expect(hard.length).toBeGreaterThanOrEqual(4);
    // full cover (two blocks or more) and low cover you jump on, both
    const tallPieces = pieces.filter(p => p.some(tall)).length, low = pieces.filter(p => !p.some(tall)).length;
    expect(tallPieces).toBeGreaterThanOrEqual(8);
    expect(low).toBeGreaterThanOrEqual(8);
    // high ledges: terraces three blocks high reached by steps
    expect(ARENA.rows.join('')).toMatch(/123/);
  });

  it(`the fight starts at least ${FAR} blocks apart, from either door, and the Shadow is in plain sight`, () => {
    for (const { side, you, door } of entries(ARENA)) {
      const start = farthestCell(floorTiles(ARENA), [door], you)!;
      const d = Math.hypot(start.x - you.x, start.z - you.z);
      expect(d, `door ${side}`).toBeGreaterThanOrEqual(FAR);
      expect(sees(ARENA, you, start), `door ${side}: line to ${start.x},${start.z}`).toBe(true);
    }
  });
});

/** A standable column at (x, z): the height a projection stands at there, as the flow field reads it, or null. */
function standAt(w: VoxelWorld, room: RoomInfo, x: number, z: number): number | null {
  const y0 = room.y0;
  let y = y0;
  while (y < y0 + 4 && w.solid(x, y, z)) y++;
  while (y > y0 - 2 && !w.solid(x, y - 1, z)) y--;
  return !w.solid(x, y, z) && !w.solid(x, y + 1, z) && y < y0 + 4 ? y : null;
}

/** Floor 9 of a run, its arena, where you come in and where the Shadow rises (`spawnSpot` with `bossStart: 'far'`). */
function arenaOf(root: number) {
  const run = buildRun(root);
  const f: FloorResult = run.floors[LAST_FLOOR];
  const room = f.rooms.find(r => r.type === 'boss')!;
  const w = run.w;
  const spec = f.doors.find(d => d.rooms.includes(room.id))!;
  // the doorway's middle, and the first tile inside the room in front of it
  const door = { x: (spec.x0 + spec.x1 + 1) / 2, z: (spec.z0 + spec.z1 + 1) / 2 };
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi - 0.5, Math.max(lo + 0.5, v));
  const you = { x: Math.floor(clamp(door.x, room.x0, room.x0 + room.w)) + 0.5, z: Math.floor(clamp(door.z, room.z0, room.z0 + room.d)) + 0.5 };
  const cells: Cell[] = [];
  for (let r = 0; r < room.d; r++) for (let c = 0; c < room.w; c++) {
    const x = room.x0 + c, z = room.z0 + r;
    if (!w.solid(x, room.y0 - 1, z) || w.solid(x, room.y0, z) || w.solid(x, room.y0 + 1, z)) continue;
    if (w.elemAt(x, room.y0, z) || w.elemAt(x, room.y0 - 1, z)) continue;
    cells.push({ x: x + 0.5, z: z + 0.5 });
  }
  const start = farthestCell(cells, [door], you)!;
  return { w, room, you, start, f };
}

const SEEDS = [1, 7, 42, 2024, 0xC0FFEE, 0x9E3779B1];

describe('the Shadow arena: the plan always has room for it', () => {
  it('on 200 seeds, floor 9\'s boss room sits at the corner of an empty 2×2 block and gets the arena', { timeout: 120000 }, () => {
    for (let i = 1; i <= 200; i++) {
      const root = Math.imul(0x9E3779B1, i) >>> 0;
      const rr = new RunRandom(root);
      const plan = planDungeon(rr).plans[LAST_FLOOR];
      const boss = plan.rooms.find(r => r.type === 'boss')!;
      const { t } = fitTemplates(rr, LAST_FLOOR, plan, ROOM_TEMPLATES).fitted.get(boss.id)!;
      expect(t.id, `seed ${root}`).toBe('mirror-hall');
    }
  });
});

describe('the Shadow arena: in the world', () => {
  it('floor 9 always holds the arena, whole, and its silence below matches it', { timeout: 120000 }, () => {
    for (const root of SEEDS) {
      const { room, f } = arenaOf(root);
      expect(room.template, `seed ${root}`).toBe('mirror-hall');
      expect([room.w, room.d, room.height], `seed ${root}`).toEqual([28, 16, 8]);
      expect(f.silence && [f.silence.x1 - f.silence.x0 + 1, f.silence.z1 - f.silence.z0 + 1]).toEqual([28, 16]);
    }
  });

  it(`the Shadow rises at least ${FAR} blocks from you, and from every place you can stand there is a way to it`, { timeout: 120000 }, () => {
    for (const root of SEEDS) {
      const { w, room, you, start } = arenaOf(root);
      expect(Math.hypot(start.x - you.x, start.z - you.z), `seed ${root}`).toBeGreaterThanOrEqual(FAR);
      // the field the Shadow walks (its footprint, a step of one block), toward the place it rises
      const field = new FlowField(room, reachOf(SHADOW.size[0]), 1);
      field.update((x, y, z) => w.solid(x, y, z), start.x, start.z, 0);
      const stranded: string[] = [];
      let starts = 0;
      // a grid of player start points: every column of the room you can stand on
      for (let r = 0; r < room.d; r++) for (let c = 0; c < room.w; c++) {
        const x = room.x0 + c, z = room.z0 + r;
        if (standAt(w, room, x, z) === null) continue;
        starts++;
        if (Math.floor(start.x) === x && Math.floor(start.z) === z) continue;
        if (!field.direction(x + 0.5, z + 0.5)) stranded.push(`${c},${r}`);
      }
      expect(starts, `seed ${root}`).toBeGreaterThan(300);
      expect(stranded, `seed ${root}: tiles with no way to the Shadow`).toEqual([]);
    }
  });

  it('the Shadow, fighting as it does, crosses the arena from the far start to you', { timeout: 120000 }, () => {
    for (const root of SEEDS.slice(0, 3)) {
      const { w, room, you, start } = arenaOf(root);
      const solid = (x: number, y: number, z: number) => w.solid(x, y, z);
      const field = new FlowField(room, reachOf(SHADOW.size[0]), 1);
      const maxHp = shadowLife(48);
      const e = {
        id: 9, hp: maxHp, maxHp, stage: 0, hold: 0, state: 'move', timer: 0, seq: 0, armed: true, hidden: false,
        wishX: 0, wishZ: 0, pulse: 0, flyY: -1, move: -1, act: 0, speed: SHADOW.speed, clock: 0, aimX: 0, aimZ: 0, volley: 0,
        body: { x: start.x, y: room.y0, z: start.z, vx: 0, vy: 0, vz: 0, hw: SHADOW.size[0], h: SHADOW.size[1], onGround: true },
        tags: new Set<string>(), room: room.id, faction: 'projection', spec: SHADOW, def: SHADOW.id,
      } as unknown as Enemy;
      const b = e.body;
      const target = { id: 1, x: you.x, y: room.y0, z: you.z, vx: 0, vz: 0 };
      const ctx = {
        dt: 1 / 60, target: () => target, near: () => null, practices: () => [], health: () => 48, bombs: () => 0,
        placeBomb: () => {}, rain: () => {}, bolt: () => {}, strike: () => {},
        dist: (_e: Enemy, p: Cell) => Math.hypot(p.x - b.x, p.z - b.z),
        toward: (_e: Enemy, p: Cell) => {
          field.update(solid, p.x, p.z, 0);
          const d = field.direction(b.x, b.z);
          if (d) return d;
          const dx = p.x - b.x, dz = p.z - b.z, l = Math.hypot(dx, dz) || 1;
          return [dx / l, dz / l];
        },
        bounds: () => [room.x0, room.z0, room.x0 + room.w - 1, room.z0 + room.d - 1], centre: () => [room.hx + 6.5, room.hz + 3.5],
        shootAt: () => {}, rockfall: () => {}, summon: () => {}, quake: () => {}, cue: () => {}, crash: () => {}, fx: () => {},
        arena: () => {}, burst: () => {}, quiet: () => false, others: () => [], safe: () => true, hide: () => {}, kill: () => {},
      } as unknown as EnemyCtx;
      let closest = Infinity;
      for (let k = 0; k < 60 * 30; k++) {
        SHADOW.behaviour.update(e, ctx);
        b.vx = e.wishX * e.speed; b.vz = e.wishZ * e.speed;
        b.vy = Math.max(b.vy - 26 / 60, -30);
        const wantX = b.vx, wantZ = b.vz;
        moveBody(solid, b, 1 / 60);
        // the step the game gives a hostile blocked by one block (enemies.ts)
        if (b.onGround && ((Math.abs(wantX) > 0.05 && b.vx === 0) || (Math.abs(wantZ) > 0.05 && b.vz === 0))) {
          const fx = b.x + Math.sign(wantX) * (b.hw + 0.2), fz = b.z + Math.sign(wantZ) * (b.hw + 0.2);
          if (boxHits(solid, fx, b.y, fz, b.hw, b.h) && !boxHits(solid, fx, b.y + 1.05, fz, b.hw, b.h)) b.vy = 7.6;
        }
        closest = Math.min(closest, Math.hypot(b.x - you.x, b.z - you.z));
        if (closest < 8.5) break;
      }
      // it fights from three and a half to eight blocks away with no practices: it has come into its range
      expect(closest, `seed ${root}`).toBeLessThan(8.5);
    }
  });
});
