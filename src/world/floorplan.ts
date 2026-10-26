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

export type RoomType = 'start' | 'normal' | 'treasure' | 'boss' | 'vault';
export type Side = 'N' | 'S' | 'E' | 'W';

export const SIDES: Record<Side, [number, number]> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
export const OPPOSITE: Record<Side, Side> = { N: 'S', S: 'N', E: 'W', W: 'E' };

export interface PlanRoom {
  id: number;
  gx: number; gz: number;
  type: RoomType;
  /** Steps from the start room. */
  dist: number;
  /** Neighbouring room id on each side, if any. */
  links: Partial<Record<Side, number>>;
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
export function generatePlan(rng: Rng, opt: PlanOptions = DEFAULT_PLAN, start?: [number, number]): FloorPlan {
  for (let relax = 0; relax <= opt.minRooms - 5; relax++) {
    const o = { ...opt, minRooms: opt.minRooms - relax };
    for (let attempt = 0; attempt < 150; attempt++) {
      const plan = tryPlan(rng, o, start ?? [opt.w >> 1, opt.h >> 1]);
      if (plan) return plan;
    }
  }
  throw new Error('floorplan: could not generate a valid plan');
}

function tryPlan(rng: Rng, { w, h, minRooms, maxRooms }: PlanOptions, [sx, sz]: [number, number]): FloorPlan | null {
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
  // distances from the start (BFS over links)
  rooms[0].type = 'start';
  rooms[0].dist = 0;
  const bfs = [0];
  while (bfs.length) {
    const r = rooms[bfs.shift()!];
    for (const n of Object.values(r.links) as number[]) {
      if (rooms[n].dist < 0) { rooms[n].dist = r.dist + 1; bfs.push(n); }
    }
  }

  const deadEnds = rooms.filter(r => r.id !== 0 && Object.keys(r.links).length === 1);
  if (deadEnds.length < 2) return null;
  deadEnds.sort((a, b) => b.dist - a.dist || a.id - b.id);
  const boss = deadEnds[0];
  if (boss.dist < 2) return null; // the boss should never be next to the start
  boss.type = 'boss';
  const rest = deadEnds.slice(1);
  const treasure = rest.splice(rng.int(0, rest.length - 1), 1)[0];
  treasure.type = 'treasure';
  if (rest.length) rest[rng.int(0, rest.length - 1)].type = 'vault';

  return { w, h, rooms, grid, start: 0 };
}
