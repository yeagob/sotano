// Rooms that use height and elements (docs/design/LEVELS.md): every room stays inside its band,
// no element ever sits inside a block, and the template features carve what they promise.

import { describe, expect, it } from 'vitest';
import { ENEMY_BUDGET } from '../src/content/enemies';
import { EL_FIRE, EL_LAVA, EL_WATER, elemKind } from '../src/content/elements';
import { AIR, MAT } from '../src/content/materials';
import { MAX_PIT, MAX_ROOM_H, ROOM_D, ROOM_TEMPLATES, ROOM_W, validateTemplate, type RoomTemplate } from '../src/content/rooms';
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
  const types: RoomType[] = ['start', 'normal', 'treasure', 'vault', 'boss'];
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
      expect(w.get(r.x0 + 6, r.y0 + r.height - 1, r.z0 + 3), `${r.template} top`).toBe(AIR);
      expect(w.get(r.x0 + 6, r.y0 + r.height, r.z0 + 3), `${r.template} ceiling`).not.toBe(AIR);
    }
    expect([...seen].sort()).toEqual([EL_WATER, EL_LAVA, EL_FIRE]);
  });

  it('deep pools have a brick lining', () => {
    const { w, floors } = carveAll(5, templates);
    for (const f of floors) for (const r of f.rooms) for (let z = r.z0; z < r.z0 + ROOM_D; z++) for (let x = r.x0; x < r.x0 + ROOM_W; x++)
      if (w.elemAt(x, r.y0 - 2, z)) expect(w.get(x, r.y0 - 3, z)).toBe(MAT.brick);
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
