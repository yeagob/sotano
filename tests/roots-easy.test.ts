// The easy layout of the Roots (docs/design/not-built/levels/roots/EASY-LAYOUT.md §9, IMPLEMENTATION-PLAN C3).
// From page 2 on, six rooms carve their easy templates. A walker with no blocks and no intentions (the real
// Player's walk and jump, tests/helpers/walker.ts) crosses every room on foot, forward and in reverse, and the
// same route fails in the teaching layout. With the option off the Roots are byte for byte as before.

import { describe, expect, it } from 'vitest';
import { MAT } from '../src/content/materials';
import {
  centreOf, doorApproach, flipped, needsBuilding, needsBuildingIn, ROOM_H, ROOM_TEMPLATES, rootsRoomKey, strandedTiles,
  TUTORIAL_CELLS, validateTemplate, type RoomTemplate,
} from '../src/content/rooms';
import { rootsRewards } from '../src/content/tables/roots-mastery';
import { tutorialPlan, TUTORIAL_LAYOUT } from '../src/world/floorplan';
import { floorY, freeSpots, LAST_FLOOR, type FloorResult, type RoomInfo } from '../src/world/floor';
import type { VoxelWorld } from '../src/world/world';
import { buildRun } from './helpers';
import { walkRoute, type Waypoint } from './helpers/walker';

const SEEDS = [1, 0xBEEF];
const EASY_IDS = ['roots-step-easy', 'roots-dig-easy', 'roots-pit-easy', 'roots-bridge-easy', 'roots-crates-easy', 'roots-seal-easy'];
const CHANGED = ['roots-step', 'roots-dig', 'roots-pit', 'roots-bridge', 'roots-crates', 'roots-seal'];

/** The plan cell of each Roots room character, and the room that stands on it. */
const CELL_AT: Record<string, [number, number]> = {};
TUTORIAL_LAYOUT.forEach((row, gz) => [...row].forEach((ch, gx) => { if (ch !== '.') CELL_AT[ch] = [gx, gz]; }));
const roomAt = (f0: FloorResult, ch: string): RoomInfo => {
  const [gx, gz] = CELL_AT[ch];
  return f0.rooms.find(r => r.gx === gx && r.gz === gz)!;
};
const templateOf = (id: string): RoomTemplate => ROOM_TEMPLATES.find(t => t.id === id)!;

// ── the same hashes and shape as the baseline recorded before the change (roots-carving's pinned values) ──

const ROOTS_FROM = floorY(0) - 6, ROOTS_TO = floorY(0) + ROOM_H + 8;

function hashHeights(w: VoxelWorld, from: number, to: number): number {
  let h = 0x811c9dc5;
  const mix = (v: number) => { h = Math.imul(h ^ v, 0x01000193) >>> 0; };
  for (let y = Math.max(0, from); y < Math.min(w.sy, to); y++)
    for (let z = 0; z < w.sz; z++) for (let x = 0; x < w.sx; x++) {
      const i = w.idx(x, y, z);
      mix(w.data[i]);
      mix(w.elem[i]);
    }
  return h;
}

const fnv = (s: string) => { let h = 0x811c9dc5; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0; return h; };

const shape = (f: FloorResult) => JSON.stringify({
  rooms: f.rooms.map(r => [r.id, r.type, r.template, r.flipX, r.flipZ, r.mood, r.enemies, r.doors]),
  pedestals: f.pedestals, chests: f.chests, keys: f.keys, bombs: f.bombs, hearts: f.hearts,
  practices: f.practices, altar: f.altar, hole: f.hole, spawn: f.spawn, doors: f.doors,
});

/** Recorded from the code before the easy layout existed: seed/mastery → hashes of floor 0, its band, the world, floors 1–9. */
const BASELINE: Record<string, { shape: number; band: number; world: number; floors1to9: number }> = {
  '1/0': { shape: 3137437004, band: 2497052508, world: 607469066, floors1to9: 3921729983 },
  '1/22': { shape: 358658551, band: 3647524814, world: 3251868360, floors1to9: 3921729983 },
  '48879/0': { shape: 383656768, band: 1383084198, world: 1967347489, floors1to9: 825091795 },
  '48879/22': { shape: 2069991609, band: 492285628, world: 3775088875, floors1to9: 825091795 },
};

// ── the walker's routes: door middles and room centres, in the frame each room is carved in ──

/** A waypoint in a room: a door side's middle tile, the centre, or a tile [col, row]. */
type Spec = 'N' | 'S' | 'E' | 'W' | 'C' | [number, number];
type Walk = [string, Spec[]][];

/** The ring of the Roots in forward order: from the spawn in the start room, round to the start room, then down. */
const FORWARD: Walk = [
  ['S', ['E']],
  ['a', ['W', [3, 3], 'C', [9, 3], 'C', 'N']],
  ['b', ['S', 'C', 'N']],
  ['c', ['S', 'C', 'N']],
  ['d', ['S', 'C', 'W']],
  ['e', ['E', 'C', 'W']],
  ['f', ['E', 'C', 'S']],
  ['g', ['N', 'C', 'S']],
  ['h', ['N', 'C', 'S']],
  ['T', ['N', 'C', 'E']],
  ['S', ['W', 'C', 'S']],
  ['B', ['N', [5, 2], [6, 2]]],
];

/** The same lap in reverse. */
const REVERSE: Walk = [
  ['S', ['W']],
  ['T', ['E', 'C', 'N']],
  ['h', ['S', 'C', 'N']],
  ['g', ['S', 'C', 'N']],
  ['f', ['S', 'C', 'E']],
  ['e', ['W', 'C', 'E']],
  ['d', ['W', 'C', 'S']],
  ['c', ['N', 'C', 'S']],
  ['b', ['N', 'C', 'S']],
  ['a', ['N', 'C', [9, 3], 'C', [3, 3], 'W']],
  ['S', ['E', 'C', 'S']],
  ['B', ['N', [5, 2], [6, 2]]],
];

/** Feet height of the standing tile: the top of its highest block (floor, stack or pedestal), plus one. */
function standY(w: VoxelWorld, x: number, z: number, y0: number): number {
  for (let y = y0 + 3; y >= y0 - 3; y--) if (w.solid(x, y, z)) return y + 1;
  throw new Error(`no ground at ${x},${z}`);
}

/** The room as carved, its template with its flips. */
const frameOf = (rm: RoomInfo) => flipped(templateOf(rm.template), rm.flipX, rm.flipZ);

function spotOf(w: VoxelWorld, rm: RoomInfo, spec: Spec): Waypoint & { label: string } {
  const ft = frameOf(rm);
  const [col, row] = spec === 'C' ? centreOf(ft) : Array.isArray(spec) ? spec : doorApproach(ft)[spec]![1];
  const x = rm.x0 + col, z = rm.z0 + row;
  return { label: `${rootsRoomKey(rm.gx, rm.gz)}:${Array.isArray(spec) ? `${col},${row}` : spec}`, x: x + 0.5, y: standY(w, x, z, rm.y0), z: z + 0.5 };
}

function routeOf(run: ReturnType<typeof buildRun>, walk: Walk) {
  const f0 = run.floors[0];
  return walk.flatMap(([ch, specs]) => specs.map(s => spotOf(run.w, roomAt(f0, ch), s)));
}

/** Walks one lap from the spawn with the real Player and no blocks; names the waypoint it failed at. */
function lap(run: ReturnType<typeof buildRun>, walk: Walk) {
  const f0 = run.floors[0];
  const route = routeOf(run, walk);
  const [x, y, z] = f0.spawn;
  const r = walkRoute((sx, sy, sz) => run.w.solid(sx, sy, sz), { x, y, z }, route);
  return { ok: r.ok, failedAt: r.ok ? null : route[r.reached].label, route };
}

describe('the easy templates (EASY-LAYOUT §2, §9.1)', () => {
  it('every easy template is valid, needs no building, and strands no tile from any door it carves with', () => {
    const plan = tutorialPlan();
    for (const id of EASY_IDS) {
      const t = templateOf(id);
      expect(validateTemplate(t), id).toEqual([]);
      expect(t.weight, `${id} carries no weight`).toBeUndefined();
      expect(needsBuilding(t), id).toBe(false);
      const cells = Object.entries(TUTORIAL_CELLS).filter(([, c]) => c.easy === id);
      expect(cells.length, id).toBe(1);
      for (const [ch, cell] of cells) {
        const [gx, gz] = CELL_AT[ch];
        const sides = Object.keys(plan.rooms.find(r => r.gx === gx && r.gz === gz)!.links);
        const flipZ = !!cell.flipZ;
        expect(needsBuildingIn(t, false, flipZ, sides), `${id} in ${ch}`).toBe(false);
        expect(strandedTiles(t, false, flipZ, sides), `${id} in ${ch}`).toEqual([]);
      }
    }
  });

  it('the teaching twins really need building (the control): five of the six do', () => {
    for (const id of CHANGED.filter(id => id !== 'roots-crates')) expect(needsBuilding(templateOf(id)), id).toBe(true);
  });

  it('each easy template keeps its twin\'s lesson', () => {
    for (const id of EASY_IDS) expect(templateOf(id).lesson, id).toBe(templateOf(id.replace('-easy', '')).lesson);
  });
});

describe('a walker with no blocks crosses the easy Roots (EASY-LAYOUT §9.2)', () => {
  for (const seed of SEEDS) {
    it(`forward and in reverse from the spawn, every room and the way down, seed ${seed}`, () => {
      const run = buildRun(seed, undefined, undefined, { easyRoots: true });
      const forward = lap(run, FORWARD), reverse = lap(run, REVERSE);
      expect({ ok: forward.ok, failedAt: forward.failedAt }).toEqual({ ok: true, failedAt: null });
      expect({ ok: reverse.ok, failedAt: reverse.failedAt }).toEqual({ ok: true, failedAt: null });
    });

    it(`the same forward lap fails in the step room in the teaching layout (the control), seed ${seed}`, () => {
      const run = buildRun(seed);
      const forward = lap(run, FORWARD);
      expect(forward.ok).toBe(false);
      expect(forward.failedAt?.startsWith('roots-step:'), `failed at ${forward.failedAt}`).toBe(true);
    });
  }
});

describe('the option off is the teaching layout, byte for byte (EASY-LAYOUT §9.3–§9.4)', () => {
  it('floor 0, its band, the world and floors 1 to 9 equal the recorded baseline when the option is absent or false', () => {
    for (const seed of SEEDS) for (const level of [0, 22]) for (const carve of [{ mastery: level }, { mastery: level, easyRoots: false }]) {
      const run = buildRun(seed, undefined, undefined, carve);
      const pinned = BASELINE[`${seed}/${level}`];
      const where = `seed ${seed}, level ${level}, ${JSON.stringify(carve)}`;
      expect(fnv(shape(run.floors[0])), `${where}: floor 0`).toBe(pinned.shape);
      expect(hashHeights(run.w, ROOTS_FROM, ROOTS_TO), `${where}: band`).toBe(pinned.band);
      expect(hashHeights(run.w, 0, run.w.sy), `${where}: world`).toBe(pinned.world);
      expect(fnv(JSON.stringify(run.floors.slice(1).map(shape))), `${where}: floors 1 to 9`).toBe(pinned.floors1to9);
    }
  });

  it('floors 1 to 9 and the world outside floor 0\'s band are the same in both layouts, at mastery 0 and 100', () => {
    for (const seed of SEEDS) for (const mastery of [0, 100]) {
      const teaching = buildRun(seed, undefined, undefined, { mastery, easyRoots: false });
      const easy = buildRun(seed, undefined, undefined, { mastery, easyRoots: true });
      const where = `seed ${seed}, mastery ${mastery}`;
      for (let k = 1; k <= LAST_FLOOR; k++) expect(shape(easy.floors[k]), `${where}, floor ${k}`).toBe(shape(teaching.floors[k]));
      const outside = (w: VoxelWorld) => `${hashHeights(w, 0, ROOTS_FROM)}/${hashHeights(w, ROOTS_TO, w.sy)}`;
      expect(outside(easy.w), where).toBe(outside(teaching.w));
    }
  });
});

describe('the rewards fit the easy layout (EASY-LAYOUT §3, §9.5)', () => {
  it('at mastery 100 the easy Roots lay exactly the table, one per room, off the approaches, and the lesson rooms have the tiles', () => {
    const LESSON = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    // the largest number of loose things and fixtures the table ever lays on the lesson rooms, over every level
    let most = 0;
    for (let L = 0; L <= 100; L++) {
      const R = rootsRewards(L);
      most = Math.max(most, (R.oneOfKeyOrBomb ? 1 : R.keys + R.bombs) + R.hearts.length + R.freeChests + R.extraPractices);
    }
    for (const seed of [1, 0xBEEF, 7]) {
      const run = buildRun(seed, undefined, undefined, { mastery: 100, easyRoots: true });
      const f0 = run.floors[0], R = rootsRewards(100), where = `seed ${seed}`;
      expect(f0.keys.length, where).toBe(R.keys);
      expect(f0.bombs.length, where).toBe(R.bombs);
      expect(f0.hearts.map(h => h.kind), where).toEqual(R.hearts);
      const free = f0.chests.filter(c => c.draws);
      expect(free.length, where).toBe(R.freeChests);
      expect(f0.practices.length, where).toBe(R.extraPractices);
      expect(f0.altar !== null, where).toBe(R.altar !== null);
      expect(f0.chests.filter(c => c.meditation && c.room !== f0.rooms.find(r => r.type === 'treasure')!.id), where).toHaveLength(R.secondSanctuary ? 1 : 0);
      const perRoom = (list: { room: number }[]) => list.reduce((m, t) => m.set(t.room, (m.get(t.room) ?? 0) + 1), new Map<number, number>());
      for (const [room, n] of perRoom(free)) expect(n, `${where}, room ${room}`).toBeLessThanOrEqual(1);
      for (const [room, n] of perRoom(f0.practices)) expect(n, `${where}, room ${room}`).toBeLessThanOrEqual(1);
      const loose = [...f0.keys, ...f0.bombs, ...f0.hearts, ...f0.practices, ...free];
      for (const t of loose) {
        const rm = f0.rooms.find(r => r.id === t.room)!;
        const hc = t.x - rm.hx, hr = t.z - rm.hz;
        const inHome = hc >= 0 && hr >= 0 && hc < 13 && hr < 7;
        const approach = inHome && ((hr >= 2 && hr <= 4 && (hc <= 2 || hc >= 10)) || (hc >= 5 && hc <= 7 && (hr <= 2 || hr >= 4)));
        const centre = inHome && Math.abs(hc - 6) <= 1 && Math.abs(hr - 3) <= 1;
        expect(approach || centre, `a loose thing on an approach or the centre (${where})`).toBe(false);
      }
      // the eight lesson rooms of the easy layout offer at least the table's largest total in free tiles
      const offered = LESSON.reduce((n, ch) => {
        const rm = roomAt(f0, ch);
        return n + freeSpots(templateOf(rm.template), rm.flipX, rm.flipZ).length;
      }, 0);
      expect(offered, where).toBeGreaterThanOrEqual(most);
    }
  });
});

describe('the easy cells and the room keys (EASY-LAYOUT §7, §9.6)', () => {
  it('the six changed cells carve their easy template, the others their teaching one, with the cell\'s flips', () => {
    for (const layout of [false, true]) {
      const run = buildRun(1, undefined, undefined, { easyRoots: layout });
      for (const [ch, cell] of Object.entries(TUTORIAL_CELLS)) {
        if (!(ch in CELL_AT)) continue;
        const rm = roomAt(run.floors[0], ch);
        expect(rm.template, `${ch} (easy ${layout})`).toBe(layout && cell.easy ? cell.easy : cell.template);
        expect(rm.flipZ, `${ch} flipZ`).toBe(!!cell.flipZ);
        expect(rm.flipX, `${ch} flipX`).toBe(false);
      }
    }
  });

  it('rootsRoomKey names every room by its teaching template id in both layouts', () => {
    const teaching = new Set(Object.values(TUTORIAL_CELLS).map(c => c.template));
    for (const layout of [false, true]) {
      const f0 = buildRun(1, undefined, undefined, { easyRoots: layout }).floors[0];
      const keys = f0.rooms.map(r => rootsRoomKey(r.gx, r.gz));
      for (const k of keys) expect(teaching.has(k), `${k} (easy ${layout})`).toBe(true);
      expect(keys.length, `easy ${layout}`).toBe(11);
    }
    expect(() => rootsRoomKey(0, 0)).toThrow();
  });

  it('the easy crates room holds exactly 28 crates, in the template and in the carved room', () => {
    expect([...templateOf('roots-crates-easy').rows.join('')].filter(ch => ch === 'c')).toHaveLength(28);
    const run = buildRun(1, undefined, undefined, { easyRoots: true });
    const rm = roomAt(run.floors[0], 'g');
    let crates = 0;
    for (let row = 0; row < rm.d; row++) for (let col = 0; col < rm.w; col++) {
      if (!rm.open[col + row * rm.w]) continue;
      if (run.w.get(rm.x0 + col, rm.y0, rm.z0 + row) === MAT.crate) crates++;
    }
    expect(crates).toBe(28);
  });
});
