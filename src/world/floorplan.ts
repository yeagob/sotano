// Floor plan generation, Isaac-style (see docs/TECHNICAL.md §1.6 and docs/ROOMS.md).
//
// 1. Start in the middle of a grid and grow outwards with a queue: each room tries its four
//    neighbours, and a new cell is only accepted if it would touch exactly one existing room
//    (so the plan is a tree, no loops) and a coin flip says yes.
// 2. Dead ends (rooms with one neighbour) become special rooms: the farthest one is the boss,
//    another one the treasure room, and a third, if there is one, a locked vault.
// 3. If the plan doesn't have enough rooms or dead ends, try again.
// Pure and deterministic: the same Rng state always gives the same plan.

import type { Rng } from '../core/rng';

/** `path`: a corridor of a Tree-of-Life floor between two emanations (docs/architecture/LEVELS.md §5). */
/** `challenge`: waves of projections every time you walk in, for as long as you like (Isaac's
 *  challenge rooms; docs/design/LEVELS.md). */
export type RoomType = 'start' | 'normal' | 'treasure' | 'boss' | 'vault' | 'path' | 'challenge';
export type Side = 'N' | 'S' | 'E' | 'W';

export const SIDES: Record<Side, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
export const OPPOSITE: Record<Side, Side> = { N: 'S', S: 'N', E: 'W', W: 'E' };

export interface PlanRoom {
  id: number;
  gx: number; gz: number;
  type: RoomType;
  /** Steps from the start room. */
  dist: number;
  /** Neighbouring room id on each side, if any (doors only ever open from the room's own cell). */
  links: Partial<Record<Side, number>>;
  /** A footprint decided with the plan, in grid cells [east, south] from this cell (the great pit's
   *  crown). The extra cells hold no doors and never show on the map. Default [1, 1]. */
  size?: [number, number];
}

/** A room's footprint (cells east, cells south). */
export const sizeOf = (r: PlanRoom): [number, number] => r.size ?? [1, 1];

/**
 * Presets a room's footprint into the empty cells east of it (2×1) or south of it (1×2). Returns false
 * when the cells are taken or off the grid. The grid (the map) is never touched: the room stays one
 * cell on it, and the carver gives it the cells (docs/architecture/LEVELS.md §10.1).
 */
export function growFootprint(plan: FloorPlan, room: PlanRoom, size: [number, number]): boolean {
  const cells: [number, number][] = [];
  for (let dz = 0; dz < size[1]; dz++) for (let dx = 0; dx < size[0]; dx++) if (dx || dz) cells.push([room.gx + dx, room.gz + dz]);
  if (!cells.every(([x, z]) => x >= 0 && z >= 0 && x < plan.w && z < plan.h && plan.grid[x + z * plan.w] === -1)) return false;
  room.size = size;
  return true;
}

export interface FloorPlan {
  w: number; h: number;
  rooms: PlanRoom[];
  /** Room id per grid cell, -1 if empty. */
  grid: Int16Array;
  start: number;
}

export interface PlanOptions { w: number; h: number; minRooms: number; maxRooms: number }

export const DEFAULT_PLAN: PlanOptions = { w: 7, h: 7, minRooms: 8, maxRooms: 11 };

/**
 * `start` is the grid cell of the start room (default: the centre). Floors below the first start
 * under the boss room above, which may be on an edge or a corner: if no valid plan turns up,
 * the minimum room count is relaxed step by step before giving up.
 */
export function generatePlan(rng: Rng, opt: PlanOptions = DEFAULT_PLAN, start?: [number, number], fromExit = false): FloorPlan {
  for (let relax = 0; relax <= opt.minRooms - 5; relax++) {
    const o = { ...opt, minRooms: opt.minRooms - relax };
    for (let attempt = 0; attempt < 150; attempt++) {
      const plan = tryPlan(rng, o, start ?? [opt.w >> 1, opt.h >> 1], fromExit);
      if (plan) return plan;
    }
  }
  throw new Error('floorplan: could not generate a valid plan');
}

/** `fromExit`: the plan grows from its exit (the boss / way-down room) instead of its start, so a
 *  floor can end right above where the next one begins; the farthest dead end becomes the start. */
function tryPlan(rng: Rng, { w, h, minRooms, maxRooms }: PlanOptions, [sx, sz]: [number, number], fromExit = false): FloorPlan | null {
  const target = rng.int(minRooms, maxRooms);
  const grid = new Int16Array(w * h).fill(-1);
  const at = (x: number, z: number) => (x < 0 || z < 0 || x >= w || z >= h ? -2 : grid[x + z * w]);
  const cells: [number, number][] = [];
  const add = (x: number, z: number) => { grid[x + z * w] = cells.length; cells.push([x, z]); };
  const filledNeighbours = (x: number, z: number) =>
    Object.values(SIDES).filter(([dx, dz]) => at(x + dx, z + dz) >= 0).length;

  add(sx, sz);
  const queue: [number, number][] = [[sx, sz]];
  let guard = 0; // a grid corner can leave no valid growth: never spin forever
  while (queue.length && cells.length < target && guard++ < 2000) {
    const [x, z] = queue.shift()!;
    for (const [dx, dz] of Object.values(SIDES)) {
      const nx = x + dx, nz = z + dz;
      if (cells.length >= target) break;
      if (at(nx, nz) !== -1) continue;
      if (filledNeighbours(nx, nz) > 1) continue;
      if (rng.chance(0.5)) continue;
      add(nx, nz);
      queue.push([nx, nz]);
    }
    // keep growing from the start if the queue ran dry too early
    if (!queue.length && cells.length < target) queue.push(cells[rng.int(0, cells.length - 1)]);
  }
  if (cells.length < minRooms) return null;

  const rooms: PlanRoom[] = cells.map(([gx, gz], id) => ({ id, gx, gz, type: 'normal', dist: -1, links: {} }));
  for (const r of rooms) {
    for (const [side, [dx, dz]] of Object.entries(SIDES) as [Side, [number, number]][]) {
      const n = at(r.gx + dx, r.gz + dz);
      if (n >= 0) r.links[side] = n;
    }
  }
  distances(rooms, 0);
  const deadEnds = rooms.filter(r => r.id !== 0 && Object.keys(r.links).length === 1);
  if (deadEnds.length < 2) return null;
  deadEnds.sort((a, b) => b.dist - a.dist || a.id - b.id);
  let rest: PlanRoom[];
  let startId = 0;
  if (fromExit) {
    // grown from the way down: the farthest dead end is where the floor begins
    const start = deadEnds[0];
    if (start.dist < 2) return null;
    rooms[0].type = 'boss';
    start.type = 'start';
    startId = start.id;
    distances(rooms, start.id);
    rest = deadEnds.slice(1);
  } else {
    rooms[0].type = 'start';
    const boss = deadEnds[0];
    if (boss.dist < 2) return null; // the boss should never be next to the start
    boss.type = 'boss';
    rest = deadEnds.slice(1);
  }
  const treasure = rest.splice(rng.int(0, rest.length - 1), 1)[0];
  treasure.type = 'treasure';
  if (rest.length) rest[rng.int(0, rest.length - 1)].type = 'vault';

  return { w, h, rooms, grid, start: startId };
}

/** Steps from `from` to every room (BFS over links). */
function distances(rooms: PlanRoom[], from: number) {
  for (const r of rooms) r.dist = -1;
  rooms[from].dist = 0;
  const bfs = [from];
  while (bfs.length) {
    const r = rooms[bfs.shift()!];
    for (const n of Object.values(r.links) as number[]) if (rooms[n].dist < 0) { rooms[n].dist = r.dist + 1; bfs.push(n); }
  }
}

/**
 * The Tree of Life on the room grid (docs/architecture/LEVELS.md §5.1): ten emanations on three
 * pillars and the paths between them. `L` the kingdom (you land here), `K` the crown (the way down),
 * `T` beauty, the heart (treasure), `Y` foundation (the vault, where the floor keeps one); the other
 * letters are emanations with projections; `+` a path. Names in docs only (meanings, never sacred names).
 */
export const TREE_LAYOUT = [
  '...K...',
  '.B+++C.',
  '.+.+.+.',
  '.G+T+M.',
  '.+.+.+.',
  '.O+Y+N.',
  '..+L+..',
];

/** Where the kingdom (entry) and the crown (exit) sit, unmirrored and mirrored. */
export const TREE_ENTRY: [number, number] = [3, 6];
export const TREE_EXIT: [number, number] = [3, 0];
export const treeCell = ([x, z]: [number, number], mirrored: boolean): [number, number] => [x, mirrored ? 6 - z : z];

/**
 * A Tree-of-Life floor. Deterministic (it draws nothing): every touching pair of cells is joined, so
 * the plan has loops, like the Tree. `mirrored` flips it north–south so the crown of one floor lies
 * over the kingdom of the next (as above, so below). `vault`: does the foundation keep a vault?
 */
export function treePlan(mirrored: boolean, vault: boolean, wideCrown = false): FloorPlan {
  const w = 7, h = 7;
  const grid = new Int16Array(w * h).fill(-1);
  const rooms: PlanRoom[] = [];
  const roles: Record<string, RoomType> = { L: 'start', K: 'boss', T: 'treasure', Y: vault ? 'vault' : 'normal', '+': 'path' };
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const ch = TREE_LAYOUT[r][c];
    if (ch === '.') continue;
    const gz = mirrored ? h - 1 - r : r;
    const room: PlanRoom = { id: rooms.length, gx: c, gz, type: roles[ch] ?? 'normal', dist: -1, links: {} };
    grid[c + gz * w] = room.id;
    rooms.push(room);
  }
  for (const room of rooms) for (const [side, [dx, dz]] of Object.entries(SIDES) as [Side, [number, number]][]) {
    const x = room.gx + dx, z = room.gz + dz;
    if (x < 0 || z < 0 || x >= w || z >= h) continue;
    const n = grid[x + z * w];
    if (n >= 0) room.links[side] = n;
  }
  const start = rooms.find(r => r.type === 'start')!.id;
  distances(rooms, start);
  const plan = { w, h, rooms, grid, start };
  // the last Tree floor ends in the great pit: its crown spreads into the empty cell east of it
  if (wideCrown) growFootprint(plan, rooms.find(r => r.type === 'boss')!, [2, 1]);
  return plan;
}
