// The Roots carved by mastery (docs/design/built/levels/roots/REWARDS.md §2–§5, IMPLEMENTATION-PLAN C2).
// Floor 0 lays what `rootsRewards(level)` says; every other floor, the sky and the surface are identical at every
// level for a seed. Counts are compared with the table itself, never with numbers copied from the document.

import { describe, expect, it } from 'vitest';
import { ENEMY_BUDGET } from '../src/content/enemies';
import { ITEMS } from '../src/content/items';
import { AIR, MAT } from '../src/content/materials';
import { ROOM_H, ROOM_TEMPLATES } from '../src/content/rooms';
import { RunRandom } from '../src/core/rng';
import { rootsRewards, rootsCrateChance, CRATE_CHANCE_CAP } from '../src/content/tables/roots-mastery';
import { CRATE_DROP, CRATE_DROP_MIN, crateChanceInBand, floorCrateChance } from '../src/content/tables/crates';
import { floorHeartChances, heartChancesOnBand, heartTable, RARE_HEARTS } from '../src/content/tables/hearts';
import { ItemPools } from '../src/items/pool';
import { bandOf, carveFloor, createDungeonWorld, FIRST_FLOOR, floorY, LAST_FLOOR, pedestalSlots, planDungeon, SURFACE, type FloorResult, type RoomInfo } from '../src/world/floor';
import type { VoxelWorld } from '../src/world/world';

const LEVELS = [0, 10, 22, 100];
const SEEDS = [1, 0xBEEF];

/** A whole run's structure carved at a mastery level (`undefined` is the default, 0), as Game.newRun does it. */
function carve(root: number, mastery?: number) {
  const rr = new RunRandom(root);
  const dungeon = planDungeon(rr);
  const pools = new ItemPools(ITEMS);
  pools.reserve(pedestalSlots(dungeon), rr.fork('reserve'));
  const w = createDungeonWorld(rr, dungeon);
  const floors: FloorResult[] = [];
  for (let k = FIRST_FLOOR; k <= LAST_FLOOR; k++) {
    floors.push(carveFloor(w, rr, k, dungeon.plans[k], {
      templates: ROOM_TEMPLATES,
      pedestalItem: room => pools.reservedFor(String(room)) ?? null,
      enemies: ENEMY_BUDGET,
      mastery,
    }));
  }
  return { rr, w, floors, f0: floors[0] };
}

/** The Roots' band in world heights: the floor's interior, its walls and ceiling. */
const ROOTS_FROM = floorY(0) - 6, ROOTS_TO = floorY(0) + ROOM_H + 8;

/** A hash of the world's materials and elements in heights [from, to). */
function hashHeights(w: VoxelWorld, from: number, to: number): number {
  let h = 0x811c9dc5;
  const mix = (v: number) => { h = Math.imul(h ^ v, 0x01000193) >>> 0; };
  for (let y = Math.max(0, from); y < Math.min(w.sy, to); y++) {
    for (let z = 0; z < w.sz; z++) for (let x = 0; x < w.sx; x++) {
      const i = w.idx(x, y, z);
      mix(w.data[i]);
      mix(w.elem[i]);
    }
  }
  return h;
}

/** Everything of a floor that generation decides, as a comparable string. */
const shape = (f: FloorResult) => JSON.stringify({
  rooms: f.rooms.map(r => [r.id, r.type, r.template, r.flipX, r.flipZ, r.mood, r.enemies, r.doors]),
  pedestals: f.pedestals, chests: f.chests, keys: f.keys, bombs: f.bombs, hearts: f.hearts,
  practices: f.practices, altar: f.altar, hole: f.hole, spawn: f.spawn, doors: f.doors,
});

const rootsRoom = (f: FloorResult, id: number): RoomInfo => f.rooms.find(r => r.id === id)!;
const treasureOf = (f: FloorResult) => f.rooms.find(r => r.type === 'treasure')!;
const wayDownOf = (f: FloorResult) => f.rooms.find(r => r.type === 'boss')!;

/** Every loose or built thing floor 0 lays for the Roots, with its tile. */
function rootsTiles(f: FloorResult) {
  return [
    ...f.keys.map(t => ({ what: 'key', ...t })),
    ...f.bombs.map(t => ({ what: 'bomb', ...t })),
    ...f.hearts.map(t => ({ what: 'heart', ...t })),
    ...f.practices.map(t => ({ what: 'practice', ...t })),
    ...(f.altar ? [{ what: 'altar', ...f.altar }] : []),
    // the treasure room's Sanctuary chest stays where its marker puts it (it is not the Roots' to place)
    ...f.chests.filter(c => c.draws || (c.meditation && c.room !== treasureOf(f).id))
      .map(c => ({ what: c.draws ? 'chest' : 'sanctuary', room: c.room, x: c.x, y: c.y, z: c.z })),
  ];
}

describe('the Roots carved by mastery (C2)', () => {
  it('the same seed and level give an identical floor 0, voxels included', () => {
    for (const seed of SEEDS) for (const level of [0, 22]) {
      const a = carve(seed, level), b = carve(seed, level);
      expect(shape(a.f0), `seed ${seed}, level ${level}`).toBe(shape(b.f0));
      expect(hashHeights(a.w, ROOTS_FROM, ROOTS_TO)).toBe(hashHeights(b.w, ROOTS_FROM, ROOTS_TO));
    }
  });

  it('floors 1 to 9, the sky and the surface are identical at levels 0, 22 and 100 with the same seed', () => {
    for (const seed of SEEDS) {
      const base = carve(seed, 0);
      const outside = (w: VoxelWorld) => `${hashHeights(w, 0, ROOTS_FROM)}/${hashHeights(w, ROOTS_TO, w.sy)}`;
      for (const level of [22, 100]) {
        const other = carve(seed, level);
        for (let k = FIRST_FLOOR + 1; k <= LAST_FLOOR; k++) expect(shape(other.floors[k]), `seed ${seed}, floor ${k}, level ${level}`).toBe(shape(base.floors[k]));
        expect(outside(other.w), `seed ${seed}, level ${level}`).toBe(outside(base.w));
      }
    }
  });

  it('the default mastery is 0', () => {
    for (const seed of SEEDS) expect(shape(carve(seed).f0)).toBe(shape(carve(seed, 0).f0));
  });

  it('the Sanctuary chest in the treasure room and the way-down pedestal are the same at every level', () => {
    for (const seed of SEEDS) {
      const at = (level: number) => {
        const { f0 } = carve(seed, level);
        const t = treasureOf(f0), d = wayDownOf(f0);
        return JSON.stringify({
          sanctuary: f0.chests.filter(c => c.room === t.id),
          wayDown: f0.pedestals.filter(p => p.room === d.id),
        });
      };
      const base = at(0);
      for (const level of LEVELS) expect(at(level), `seed ${seed}, level ${level}`).toBe(base);
    }
  });

  it('counts on floor 0 match rootsRewards at 0, 10, 22 and 100', () => {
    for (const seed of SEEDS) for (const level of LEVELS) {
      const { f0 } = carve(seed, level);
      const R = rootsRewards(level), where = `seed ${seed}, level ${level}`;
      if (R.oneOfKeyOrBomb) expect(f0.keys.length + f0.bombs.length, where).toBe(1);
      else {
        expect(f0.keys.length, where).toBe(R.keys);
        expect(f0.bombs.length, where).toBe(R.bombs);
      }
      expect(f0.hearts.map(h => h.kind), where).toEqual(R.hearts);
      const free = f0.chests.filter(c => c.draws);
      expect(free.length, where).toBe(R.freeChests);
      for (const c of free) expect(c.draws, where).toEqual(R.chestDraws);
      expect(f0.practices.length, where).toBe(R.extraPractices);
      expect(f0.altar !== null, where).toBe(R.altar !== null);
      const sanctuaries = f0.chests.filter(c => c.meditation && c.room !== treasureOf(f0).id);
      expect(sanctuaries.length, where).toBe(R.secondSanctuary ? 1 : 0);
      expect(f0.chests.filter(c => c.meditation && c.room === treasureOf(f0).id), where).toHaveLength(1);
    }
  });

  it('level 0 holds exactly one of a key or a bomb, and across seeds both kinds come up', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 24; seed++) {
      const { f0 } = carve(seed, 0);
      expect(f0.keys.length + f0.bombs.length, `seed ${seed}`).toBe(1);
      kinds.add(f0.keys.length ? 'key' : 'bomb');
      expect(f0.hearts, `seed ${seed}`).toHaveLength(0);
      expect(f0.chests.filter(c => c.draws), `seed ${seed}`).toHaveLength(0);
      expect(f0.practices, `seed ${seed}`).toHaveLength(0);
      expect(f0.altar, `seed ${seed}`).toBeNull();
    }
    expect([...kinds].sort()).toEqual(['bomb', 'key']);
  });

  it('every loose thing lies on a lesson room tile, and no two share a tile', () => {
    for (const seed of SEEDS) for (const level of LEVELS) {
      const { f0 } = carve(seed, level);
      const tiles = rootsTiles(f0);
      const seen = new Set<string>();
      for (const t of tiles) {
        const key = `${t.x},${t.z}`;
        expect(seen.has(key), `${t.what} shares ${key} (seed ${seed}, level ${level})`).toBe(false);
        seen.add(key);
      }
      for (const t of tiles.filter(t => t.what === 'key' || t.what === 'bomb' || t.what === 'heart' || t.what === 'chest')) {
        expect(rootsRoom(f0, t.room).type, `${t.what} (seed ${seed}, level ${level})`).toBe('normal');
      }
    }
  });

  it('at most one free chest and one practice pedestal per room, never on a door approach, the centre or the shaft', () => {
    for (const seed of SEEDS) for (const level of LEVELS) {
      const { f0, w } = carve(seed, level);
      const where = `seed ${seed}, level ${level}`;
      const perRoom = (list: { room: number }[]) => list.reduce((m, t) => m.set(t.room, (m.get(t.room) ?? 0) + 1), new Map<number, number>());
      for (const [room, n] of perRoom(f0.chests.filter(c => c.draws))) expect(n, `${where}, room ${room}`).toBeLessThanOrEqual(1);
      for (const [room, n] of perRoom(f0.practices)) expect(n, `${where}, room ${room}`).toBeLessThanOrEqual(1);
      for (const t of rootsTiles(f0)) {
        const rm = rootsRoom(f0, t.room);
        const hc = t.x - rm.hx, hr = t.z - rm.hz;
        const inHome = hc >= 0 && hr >= 0 && hc < 13 && hr < 7;
        const approach = inHome && ((hr >= 2 && hr <= 4 && (hc <= 2 || hc >= 10)) || (hc >= 5 && hc <= 7 && (hr <= 2 || hr >= 4)));
        const centre = inHome && Math.abs(hc - 6) <= 1 && Math.abs(hr - 3) <= 1;
        // the shaft is the air of the hole's own footprint: `size` tiles each way from its corner (openHole)
        const shaft = f0.hole && f0.hole.room === t.room &&
          t.x >= f0.hole.x && t.x < f0.hole.x + f0.hole.size && t.z >= f0.hole.z && t.z < f0.hole.z + f0.hole.size;
        expect(approach, `${t.what} on a door approach (${where})`).toBe(false);
        expect(centre, `${t.what} in the centre (${where})`).toBe(false);
        expect(shaft, `${t.what} in the shaft (${where})`).toBeFalsy();
        if (t.what === 'chest' || t.what === 'sanctuary') expect(w.get(t.x, t.y, t.z), `${where}: chest block`).toBe(MAT.chest);
        if (t.what === 'practice' || t.what === 'altar') {
          expect(w.get(t.x, t.y, t.z), `${t.what} block (${where})`).toBe(MAT.pedestal);
          for (let dy = 1; dy <= 3; dy++) expect(w.get(t.x, t.y + dy, t.z), `${t.what} clear above (${where})`).toBe(AIR);
        }
      }
    }
  });

  it('the crate chance on floor 0 is the base times the table factor, capped, and only inside floor 0\'s band', () => {
    expect(CRATE_CHANCE_CAP).toBe(0.75);
    for (const seed of SEEDS) {
      const rr = new RunRandom(seed);
      const base = floorCrateChance(rr, 0);
      expect(base).toBeGreaterThanOrEqual(CRATE_DROP_MIN);
      expect(base).toBeLessThanOrEqual(CRATE_DROP);
      for (const level of LEVELS) {
        const factor = rootsRewards(level).crateFactor;
        const chance = crateChanceInBand(base, bandOf(floorY(0) + 2), factor, CRATE_CHANCE_CAP);
        expect(chance, `seed ${seed}, level ${level}`).toBe(Math.min(CRATE_CHANCE_CAP, base * factor));
        expect(chance).toBe(rootsCrateChance(base, level));
        expect(chance).toBeLessThanOrEqual(CRATE_CHANCE_CAP);
      }
      // the factor is not applied outside floor 0's band: floor 1, and the surface (depth 0 for crates, base only)
      for (const band of [1, SURFACE]) expect(crateChanceInBand(base, band, 2.5, CRATE_CHANCE_CAP), `band ${band}`).toBe(base);
    }
    // the cap holds: a crate on the most lucky floor at level 100 never gives more than three quarters of the time
    expect(crateChanceInBand(CRATE_DROP, 0, rootsRewards(100).crateFactor, CRATE_CHANCE_CAP)).toBe(CRATE_CHANCE_CAP);
  });

  it('star hearts are halved on floor 0 only, and the rest of the weights are kept', () => {
    for (const seed of SEEDS) {
      const chances = floorHeartChances(new RunRandom(seed), 0);
      const on0 = heartChancesOnBand(0, chances);
      expect(on0.star).toBeCloseTo(chances.star / 2, 12);
      for (const k of RARE_HEARTS) if (k !== 'star') expect(on0[k]).toBe(chances[k]);
      for (const band of [1, 5, SURFACE]) expect(heartChancesOnBand(band, chances), `band ${band}`).toEqual(chances);
      // the table gives red the rest: the star's weight is halved and the red takes the difference
      const weight = (c: typeof chances, value: string) => heartTable(c).entries.find(e => e.value === value)!.weight;
      expect(weight(on0, 'star')).toBeCloseTo(chances.star / 2, 12);
      expect(weight(on0, 'red')).toBeCloseTo(weight(chances, 'red') + chances.star / 2, 12);
    }
  });

  it('is a pure function of the seed and the level: asking again gives the same floor 0', () => {
    const a = carve(0xBEEF, 36).f0;
    const b = carve(0xBEEF, 36).f0;
    expect(shape(a)).toBe(shape(b));
  });
});
