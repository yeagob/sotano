// Builds a whole floor in voxels from a floor plan and the room templates.
//
// Rooms sit on a grid: each cell is a 13×7 interior plus a 2-block brick wall shared with the
// neighbour, so the room pitch is 15 × 9 blocks. Neighbouring rooms are joined by a 3×3
// doorway through the shared wall; the door itself is an entity (see entities/doors.ts).
//
//   y 25        grass (surface, open sky above)
//   y 23–24     dirt
//   y 15–22     stone with dirt pockets and ore veins
//   y 13–14     brick ceiling
//   y  8–12     room interiors (5 high)
//   y  6–7      brick floor
//   y  1–5      deepstone
//   y  0        bedrock

import { AIR, MAT } from '../content/materials';
import { CELL_STACK, cellAt, ROOM_D, ROOM_H, ROOM_W, type RoomTemplate } from '../content/rooms';
import { hash3, type RunRng } from '../core/rng';
import { generatePlan, OPPOSITE, type FloorPlan, type RoomType, type Side } from './floorplan';
import { VoxelWorld } from './world';

export const FLOOR_Y = 8;            // first air layer inside rooms
export const SURFACE_Y = 25;
export const PITCH_X = ROOM_W + 2;   // 15
export const PITCH_Z = ROOM_D + 2;   // 9
export const MARGIN = 6;             // solid rock around the whole floor
export const DOOR_H = 3;

export type DoorKind = 'normal' | 'treasure' | 'boss' | 'vault';

export interface RoomInfo {
  id: number;
  type: RoomType;
  gx: number; gz: number;
  /** Interior corner (inclusive) in world blocks. */
  x0: number; z0: number;
  template: string;
  flipX: boolean; flipZ: boolean;
  doors: Partial<Record<Side, number>>;
}

export interface DoorSpec {
  id: number;
  rooms: [number, number];
  kind: DoorKind;
  locked: boolean;
  /** Axis you walk along to pass through it. */
  axis: 'x' | 'z';
  /** Doorway cells (inclusive). */
  x0: number; x1: number; y0: number; y1: number; z0: number; z1: number;
}

export interface FloorResult {
  world: VoxelWorld;
  plan: FloorPlan;
  rooms: RoomInfo[];
  doors: DoorSpec[];
  spawn: [number, number, number];
  pedestals: { room: number; x: number; y: number; z: number }[];
  keys: { room: number; x: number; y: number; z: number }[];
  trapdoor: { room: number; x: number; y: number; z: number } | null;
}

export function roomOrigin(gx: number, gz: number): [number, number] {
  return [MARGIN + 2 + gx * PITCH_X, MARGIN + 2 + gz * PITCH_Z];
}

/** Grid cell under a world position (may be outside the plan). */
export function cellOf(x: number, z: number): [number, number] {
  return [Math.floor((x - MARGIN - 1) / PITCH_X), Math.floor((z - MARGIN - 1) / PITCH_Z)];
}

export function buildFloor(rng: RunRng, depth: number, templates: readonly RoomTemplate[]): FloorResult {
  const plan = generatePlan(rng.get('floorplan'));
  const sx = MARGIN * 2 + 2 + plan.w * PITCH_X;
  const sz = MARGIN * 2 + 2 + plan.h * PITCH_Z;
  const sy = SURFACE_Y + 1;
  const w = new VoxelWorld(sx, sy, sz);
  const seed = rng.seed + depth * 7919;
  fillRock(w, seed);

  const roomRng = rng.get('rooms');
  const rooms: RoomInfo[] = [];
  const doors: DoorSpec[] = [];
  const pedestals: FloorResult['pedestals'] = [];
  const keySpots: { room: number; x: number; y: number; z: number }[] = [];
  let spawn: [number, number, number] = [0, FLOOR_Y, 0];
  let trapdoor: FloorResult['trapdoor'] = null;

  // 1. room shells and interiors
  for (const r of plan.rooms) {
    const [x0, z0] = roomOrigin(r.gx, r.gz);
    const x1 = x0 + ROOM_W - 1, z1 = z0 + ROOM_D - 1, y0 = FLOOR_Y, y1 = FLOOR_Y + ROOM_H - 1;
    fillBox(w, x0 - 2, y0 - 2, z0 - 2, x1 + 2, y1 + 2, z1 + 2, MAT.brick);
    fillBox(w, x0, y0, z0, x1, y1, z1, AIR);
    const t = pickTemplate(templates, r.type, roomRng);
    const mirror = t.mirror !== false && r.type !== 'start';
    const flipX = mirror && roomRng.chance(0.5), flipZ = mirror && roomRng.chance(0.5);
    for (let row = 0; row < ROOM_D; row++) for (let col = 0; col < ROOM_W; col++) {
      const ch = cellAt(t, col, row, flipX, flipZ);
      const x = x0 + col, z = z0 + row;
      const s = CELL_STACK[ch];
      if (s) for (let h = 0; h < s.h; h++) w.data[w.idx(x, y0 + h, z)] = s.m;
      if (ch === 'P') spawn = [x + 0.5, y0, z + 0.5];
      if (ch === 'T') { w.data[w.idx(x, y0, z)] = MAT.pedestal; pedestals.push({ room: r.id, x, y: y0 + 1, z }); }
      if (ch === 'K') keySpots.push({ room: r.id, x, y: y0, z });
      if (ch === 'H') trapdoor = { room: r.id, x, y: y0, z };
    }
    rooms.push({ id: r.id, type: r.type, gx: r.gx, gz: r.gz, x0, z0, template: t.id, flipX, flipZ, doors: {} });
  }

  // 2. doorways between linked rooms (each pair once: only east and south links)
  for (const r of plan.rooms) {
    for (const side of ['E', 'S'] as Side[]) {
      const other = r.links[side];
      if (other === undefined) continue;
      const a = rooms[r.id], b = rooms[other];
      const special = [a.type, b.type].find(t => t === 'treasure' || t === 'boss' || t === 'vault');
      const kind: DoorKind = (special as DoorKind) ?? 'normal';
      const id = doors.length;
      const y0 = FLOOR_Y, y1 = FLOOR_Y + DOOR_H - 1;
      const spec: DoorSpec = side === 'E'
        ? { id, rooms: [a.id, b.id], kind, locked: kind === 'vault', axis: 'x',
            x0: a.x0 + ROOM_W, x1: a.x0 + ROOM_W + 1, y0, y1, z0: a.z0 + 2, z1: a.z0 + 4 }
        : { id, rooms: [a.id, b.id], kind, locked: kind === 'vault', axis: 'z',
            x0: a.x0 + 5, x1: a.x0 + 7, y0, y1, z0: a.z0 + ROOM_D, z1: a.z0 + ROOM_D + 1 };
      carveDoorway(w, spec);
      doors.push(spec);
      a.doors[side] = id;
      b.doors[OPPOSITE[side]] = id;
    }
  }

  // 3. one key on the floor if there is a locked door, in a normal room (prefer K spots)
  const keys: FloorResult['keys'] = [];
  if (doors.some(d => d.locked)) {
    const normal = new Set(rooms.filter(r => r.type === 'normal').map(r => r.id));
    const spots = keySpots.filter(k => normal.has(k.room));
    const keyRng = rng.get('loot');
    if (spots.length) keys.push(keyRng.pick(spots));
    else {
      const r = keyRng.pick(rooms.filter(r => r.type === 'normal'));
      keys.push({ room: r.id, x: r.x0 + 6, y: FLOOR_Y, z: r.z0 + 3 });
    }
  }

  w.markAllDirty();
  return { world: w, plan, rooms, doors, spawn, pedestals, keys, trapdoor };
}

function pickTemplate(templates: readonly RoomTemplate[], type: RoomType, rng: ReturnType<RunRng['get']>): RoomTemplate {
  const options = templates.filter(t => t.types.includes(type));
  if (!options.length) throw new Error(`no room template for type "${type}"`);
  const total = options.reduce((s, t) => s + (t.weight ?? 1), 0);
  let r = rng.next() * total;
  for (const t of options) { r -= t.weight ?? 1; if (r <= 0) return t; }
  return options[options.length - 1];
}

function fillRock(w: VoxelWorld, seed: number) {
  const n = (x: number, y: number, z: number, s = 1) => hash3(seed + s, x, y, z);
  for (let z = 0; z < w.sz; z++) for (let y = 0; y < w.sy; y++) for (let x = 0; x < w.sx; x++) {
    let m: number;
    if (y === 0) m = MAT.bedrock;
    else if (y === SURFACE_Y) m = MAT.grass;
    else if (y >= 23) m = MAT.dirt;
    else if (y <= 5) m = n(x >> 1, y >> 1, z >> 1) < 0.12 ? MAT.obsidian : MAT.deepstone;
    else {
      m = MAT.stone;
      const v = n(x >> 1, y >> 1, z >> 1, 7);
      if (v < 0.12) m = MAT.dirt;
      else if (v > 0.93) m = MAT.ore;
    }
    if (y < SURFACE_Y && (x === 0 || z === 0 || x === w.sx - 1 || z === w.sz - 1)) m = MAT.bedrock;
    w.data[w.idx(x, y, z)] = m;
  }
}

const FRAME: Record<DoorKind, number> = {
  normal: MAT.frame, treasure: MAT.goldframe, boss: MAT.bossframe, vault: MAT.goldframe,
};

/** Frame the doorway (one block around it, through the whole wall) and carve the opening. */
function carveDoorway(w: VoxelWorld, d: DoorSpec) {
  const f = FRAME[d.kind];
  if (d.axis === 'x') fillBox(w, d.x0, d.y0, d.z0 - 1, d.x1, d.y1 + 1, d.z1 + 1, f);
  else fillBox(w, d.x0 - 1, d.y0, d.z0, d.x1 + 1, d.y1 + 1, d.z1, f);
  fillBox(w, d.x0, d.y0, d.z0, d.x1, d.y1, d.z1, AIR);
}

function fillBox(w: VoxelWorld, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: number) {
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    if (w.inside(x, y, z)) w.data[w.idx(x, y, z)] = m;
}
