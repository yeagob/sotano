// Rooms that use height and elements (docs/design/LEVELS.md): every room stays inside its band,
// no element ever sits inside a block, and the template features carve what they promise.

import { describe, expect, it } from 'vitest';
import { ENEMY_BUDGET } from '../src/content/enemies';
import { EL_FIRE, EL_LAVA, EL_WATER, elemKind } from '../src/content/elements';
import { level } from '../src/content/levels';
import { AIR, MAT } from '../src/content/materials';
import { cellAt, MAX_PIT, MAX_ROOM_H, ROOM_D, ROOM_TEMPLATES, ROOM_W, validateTemplate, type RoomTemplate } from '../src/content/rooms';
import { RunRandom } from '../src/core/rng';
import { carveFloor, ceilingRise, createDungeonWorld, FIRST_FLOOR, floorY, LAST_FLOOR, planDungeon } from '../src/world/floor';
import type { RoomType } from '../src/world/floorplan';

/** Templates that use height or elements; for each room type, only those (when there are any). */
const TALL = ROOM_TEMPLATES.filter(t => (t.height ?? 5) > 5 || t.layers || /[wWlLf_]/.test(t.rows.join('')));
const only = (types: RoomType[]) => types.flatMap(type => {
  const own = TALL.filter(t => t.types.includes(type));
  return own.length ? own : ROOM_TEMPLATES.filter(t => t.types.includes(type));
});

function carveAll(root: number, templates: readonly RoomTemplate[]) {
  const rr = new RunRandom(root);
  const dungeon = planDungeon(rr);
  const w = createDungeonWorld(rr, dungeon);
  const floors = [];
  for (let k = FIRST_FLOOR; k <= LAST_FLOOR; k++) floors.push(carveFloor(w, rr, k, dungeon.plans[k], { templates, pedestalItem: () => null, enemies: ENEMY_BUDGET }));
  return { w, floors };
}

describe('levels: rooms with height and elements', () => {
  const types: RoomType[] = ['start', 'normal', 'treasure', 'vault', 'boss', 'path', 'challenge'];
  const templates = [...new Set(only(types))];

  it('there are element rooms for every room type', () => {
    for (const type of types) expect(TALL.some(t => t.types.includes(type)), type).toBe(true);
    for (const el of ['w', 'W', 'l', 'L', 'f']) expect(TALL.some(t => t.rows.join('').includes(el)), el).toBe(true);
  });

  it('never reach the floor above or below: rock remains between every pair of bands', { timeout: 60000 }, () => {
    for (const root of [1, 2, 3, 0xBEEF, 0xC0FFEE]) {
      const { w } = carveAll(root, templates);
      for (let k = FIRST_FLOOR + 1; k <= LAST_FLOOR; k++) {
        // between floor k (below) and floor k-1 (above): the tallest room of k and the deepest pit of k-1
        const top = floorY(k) + MAX_ROOM_H + 1, bottom = floorY(k - 1) - MAX_PIT - 1;
        expect(bottom - top - 1, 'rock layers left').toBeGreaterThanOrEqual(1);
        let holes = 0;
        for (let z = 0; z < w.sz; z++) for (let x = 0; x < w.sx; x++) for (let y = top + 1; y < bottom; y++) if (w.get(x, y, z) === AIR) holes++;
        expect(holes, `air between floors ${k - 1} and ${k} (seed ${root})`).toBe(0);
      }
    }
  });

  it('no element ever sits inside a block', () => {
    const { w } = carveAll(7, templates);
    let bad = 0;
    for (let i = 0; i < w.data.length; i++) if (w.elem[i] && w.data[i] !== AIR) bad++;
    expect(bad).toBe(0);
  });

  it('pools are dug into the floor and filled; flames stand on it; tall rooms are tall', () => {
    const { w, floors } = carveAll(11, templates);
    const seen = new Set<number>();
    for (const f of floors) for (const r of f.rooms) {
      for (let z = r.z0; z < r.z0 + ROOM_D; z++) for (let x = r.x0; x < r.x0 + ROOM_W; x++)
        for (let y = r.y0 - 2; y <= r.y0 + 4; y++) { const k = elemKind(w.elemAt(x, y, z)); if (k) seen.add(k); }
      // the centre of a room is open to its full height (vaults rise above it)
      const t = ROOM_TEMPLATES.find(q => q.id === r.template)!;
      expect(r.height).toBe(t.height ?? 5);
      // the middle of the room (of its whole footprint) rises to its full height
      const cx = r.x0 + (r.w >> 1), cz = r.z0 + (r.d >> 1);
      expect(w.get(cx, r.y0 + r.height - 1, cz), `${r.template} top`).toBe(AIR);
      expect(w.get(cx, r.y0 + r.height, cz), `${r.template} ceiling`).not.toBe(AIR);
    }
    expect([...seen].sort()).toEqual([EL_WATER, EL_LAVA, EL_FIRE]);
  });

  it('deep pools are lined with the floor of their level', () => {
    const { w, floors } = carveAll(5, templates);
    for (const f of floors) for (const r of f.rooms) for (let z = r.z0; z < r.z0 + r.d; z++) for (let x = r.x0; x < r.x0 + r.w; x++)
      if (w.elemAt(x, r.y0 - 2, z)) expect(w.get(x, r.y0 - 3, z)).toBe(MAT[level(f.floor).palette.floor]);
  });

  it('vaults and domes rise highest in the middle', () => {
    expect(ceilingRise('flat', 3, 0, 0)).toBe(3);
    expect(ceilingRise('dome', 3, 6, 3)).toBe(3);
    expect(ceilingRise('dome', 3, 0, 0)).toBe(0);
    expect(ceilingRise('vault-x', 3, 0, 3)).toBe(3);
    expect(ceilingRise('vault-z', 3, 0, 3)).toBeLessThan(2);
  });

  it('the validator rejects rooms that break the rules of height and elements', () => {
    const base = Array(7).fill('.............');
    const row = (r: number, s: string) => base.map((x, i) => (i === r ? s : x));
    const v = (t: Partial<RoomTemplate>) => validateTemplate({ id: 't', types: ['treasure'], rows: row(3, '......T......'), ...t }).join();
    expect(v({ height: 9 })).toMatch(/never reach the floor above/);
    expect(v({ ceiling: 'dome' })).toMatch(/needs a height/);
    expect(v({ rows: row(3, '.wl...T......') })).toMatch(/water next to lava/);
    expect(v({ rows: row(3, '.fc...T......') })).toMatch(/flame next to something that burns/);
    expect(v({ layers: [{ y: 1, rows: row(2, 'b............') }] })).toMatch(/blocks the W door/);
    expect(v({ layers: [{ y: 2, rows: row(1, '.....b.......') }] })).toMatch(/lone floating block/);
    expect(v({ height: 6, layers: [{ y: 4, rows: base }] })).toMatch(/headroom/);
    expect(v({ height: 7, layers: [{ y: 2, rows: row(1, '...f.........') }] })).toMatch(/terrace 2 high/);
  });
});

describe('rooms as carved, with their real doors (L3c)', () => {
  it('over many seeds, at least half the fighting rooms with two or more doors need building, on every hostile floor', { timeout: 240000 }, async () => {
    const { needsBuildingIn } = await import('../src/content/rooms');
    const { buildRun } = await import('./helpers');
    const tally = new Map<number, [number, number]>();
    for (let s = 1; s <= 24; s++) {
      const run = buildRun(s * 7717);
      for (const f of run.floors) for (const r of f.rooms) {
        if (r.type !== 'normal' && r.type !== 'path') continue;
        const sides = Object.keys(r.doors);
        if (sides.length < 2) continue;
        const t = ROOM_TEMPLATES.find(q => q.id === r.template)!;
        const [n, b] = tally.get(f.floor) ?? [0, 0];
        tally.set(f.floor, [n + 1, b + (needsBuildingIn(t, r.flipX, r.flipZ, sides) ? 1 : 0)]);
      }
    }
    for (const [floor, [n, b]] of tally) expect(b / n, `floor ${floor}: ${b} of ${n}`).toBeGreaterThanOrEqual(0.5);
  });

  it('a template mirrored is still the same room (the flip of a flip is the template)', async () => {
    const { flipped } = await import('../src/content/rooms');
    for (const t of ROOM_TEMPLATES) expect(flipped(flipped(t, true, true), true, true).rows).toEqual(t.rows);
  });
});

describe('big rooms and the great pit (L3a, L3b)', () => {
  it('floor 5 ends in a wide crown whose 4×4 shaft lands in the centre of the start room of floor 6', async () => {
    const { buildRun } = await import('./helpers');
    const { openHole } = await import('../src/world/floor');
    for (const seed of [3, 9, 27]) {
      const run = buildRun(seed, 7);
      const f5 = run.floors[5], f6 = run.floors[6];
      const crown = f5.rooms.find(r => r.type === 'boss')!;
      expect(crown.w, 'the crown spans two cells').toBe(28);
      expect(f5.hole!.size).toBe(4);
      openHole(run.w, f5.hole!);
      const start = f6.rooms.find(r => r.type === 'start')!;
      for (let dz = 0; dz < 4; dz++) for (let dx = 0; dx < 4; dx++) {
        const x = f5.hole!.x + dx, z = f5.hole!.z + dz;
        expect(x >= start.x0 && x < start.x0 + start.w && z >= start.z0 && z < start.z0 + start.d).toBe(true);
        expect(run.w.get(x, start.y0, z)).toBe(AIR);
      }
    }
  });

  it('deeper floors grow bigger rooms, and a big room is open where its cells meet', async () => {
    const { buildRun } = await import('./helpers');
    let big = 0;
    for (let s = 1; s <= 8; s++) {
      const run = buildRun(s * 4243);
      for (const f of run.floors.slice(1)) for (const r of f.rooms) {
        if (r.w === 13 && r.d === 7) continue;
        big++;
        // a big room's interior is open from wall to wall where its cells meet
        const midX = r.w > 13 ? r.x0 + 13 : r.x0 + 6, midZ = r.d > 7 ? r.z0 + 8 : r.z0 + 3;
        expect(run.w.get(midX, r.y0 + 3, midZ), `${r.template}`).toBe(AIR);
      }
    }
    expect(big).toBeGreaterThan(5);
  });
});

describe('rooms bigger than their cell (L7)', () => {
  it('a room spreads only into empty cells, never into another room, and the map keeps one cell per room', async () => {
    const { buildRun } = await import('./helpers');
    const { inRoomSpace } = await import('../src/world/floor');
    let big = 0;
    for (const seed of [5, 77, 901]) {
      const run = buildRun(seed);
      for (const f of run.floors) {
        expect(f.plan.grid.filter(i => i >= 0).length, 'one cell per room on the map').toBe(f.plan.rooms.length);
        f.space.forEach((i, c) => { if (i >= 0 && f.plan.grid[c] < 0) big++; if (f.plan.grid[c] >= 0) expect(i).toBe(f.plan.grid[c]); });
        const owner = new Map<string, number>();
        for (const r of f.rooms) {
          expect(inRoomSpace(r, r.hx + 6, r.hz + 3), `${r.template}: its home centre is open`).toBe(true);
          for (let z = r.z0; z < r.z0 + r.d; z++) for (let x = r.x0; x < r.x0 + r.w; x++) {
            if (!inRoomSpace(r, x, z)) continue;
            const key = `${x},${z}`;
            expect(owner.get(key), `${r.template} overlaps another room at ${key}`).toBeUndefined();
            owner.set(key, r.id);
            // every open tile but a wall piece has air above its floor (no shell carved into a room)
            const t = ROOM_TEMPLATES.find(q => q.id === r.template)!;
            if ('#DE'.includes(cellAt(t, x - r.x0, z - r.z0, r.flipX, r.flipZ))) continue;
            let air = false;
            for (let y = r.y0; y < r.y0 + r.height && !air; y++) air = run.w.get(x, y, z) === AIR;
            expect(air, `${r.template} open tile ${key} is solid to the ceiling`).toBe(true);
          }
        }
      }
    }
    expect(big, 'rooms do spread').toBeGreaterThan(10);
  });

  it('big rooms appear on every hostile floor, the Tree floors included', async () => {
    const { buildRun } = await import('./helpers');
    const seen = new Set<number>();
    for (let s = 1; s <= 6; s++) for (const f of buildRun(s * 131).floors) if (f.rooms.some(r => r.w > ROOM_W || r.d > ROOM_D)) seen.add(f.floor);
    for (let k = 1; k <= LAST_FLOOR; k++) expect(seen.has(k), `floor ${k}`).toBe(true);
  });

  it('the new ceilings stay under the room\'s height and rise in the middle', () => {
    for (const shape of ['pointed-x', 'pointed-z', 'cross', 'stepped', 'cave'] as const) {
      expect(ceilingRise(shape, 3, 6, 3), shape).toBe(3);
      for (let r = 0; r < ROOM_D; r++) for (let c = 0; c < ROOM_W; c++) {
        const v = ceilingRise(shape, 3, c, r);
        expect(v >= 0 && v <= 3, `${shape} ${c},${r}`).toBe(true);
      }
    }
  });
});

