// The sandbox (docs/architecture/SANDBOX.md): one sealed room built from a scenario, inside the real
// dungeon's rock, so every system of the game runs on it unchanged. A developer tool: English only,
// like the debug readout. Headless (no three.js, no DOM): tests build scenarios with it too.
//
// Coordinates in a scenario are room-local [col, h, row]: col 0 … w-1 west to east, row 0 … d-1
// north to south, h 0 the first air layer above the floor (negative h digs into it).

import { EL_FIRE, EL_LAVA, EL_WATER, SOURCE, type ElementKey } from '../content/elements';
import { ITEM_BY_ID } from '../content/items';
import { LAST_FLOOR } from '../content/levels';
import { AIR, MAT } from '../content/materials';
import { ROOM_H, ROOM_TEMPLATES, type CeilingShape, type RoomTemplate, type TemplateLayer } from '../content/rooms';
import type { RoomMood } from '../content/tables/rooms';
import { ENEMY_BY_ID } from '../content/enemies';
import { CREATURE_BY_ID } from '../content/creatures';
import type { RunRandom } from '../core/rng';
import { carveInterior, cellOf, floorY, GRID, roomGid, roomOrigin, type FloorResult, type RoomInfo } from '../world/floor';
import type { FloorPlan } from '../world/floorplan';
import type { VoxelWorld } from '../world/world';

export type Vec3 = [number, number, number];
/** A box of cells, both corners inclusive. */
export type Box = [number, number, number, number, number, number];

export type Placement =
  | { at: Vec3 | Box; block: string }
  | { at: Vec3 | Box; element: ElementKey; level?: number }
  | { at: Vec3 | Box; clear: true };

/** One step of a lab script, run before tick `t` (0 = before the first tick), after the report of tick `t`. */
export type Action = { t: number } & (
  | Placement
  | { do: 'damage'; at: Vec3; amount: number; kind?: 'intent' | 'explosion' | 'crush' | 'fire' }
  | { do: 'break'; at: Vec3 }
  | { do: 'explode'; at: Vec3; radius?: number; damage?: number }
  | { do: 'cube'; block: string; at: Vec3; v?: Vec3 }
  | { do: 'bomb'; at: Vec3; fuse?: number }
  | { do: 'spawn'; def: string; at: Vec3; faction?: 'projection' | 'self' }
  | { do: 'give'; item: string }
  | { do: 'lose'; item: string }
  | { do: 'tp'; at: Vec3 }
  | { do: 'look'; at: Vec3 }
  | { do: 'fire'; ticks?: number }
  | { do: 'key'; code: string }
  | { do: 'use' }
  | { do: 'hand'; blocks: string[] }
);

export interface Scenario {
  id: string;
  /** What it checks, one line. */
  note?: string;
  /** The floor whose band, rock and rules the room takes (frozen pools, fog). Default 1. */
  floor?: number;
  /** Root seed of everything random (rock, decor slots, items, drops, cosmetic fx). Default 1. */
  seed?: number;
  /** A room template id from src/content/rooms.ts; `rows`, `height`, `ceiling`, `layers` override it. */
  template?: string;
  /** Rows in the template legend (docs/architecture/ROOMS.md), any width × depth. */
  rows?: string[];
  height?: number;
  ceiling?: CeilingShape;
  layers?: TemplateLayer[];
  flipX?: boolean; flipZ?: boolean;
  mood?: RoomMood;
  /** Material of the room's two-block shell (walls, floor, ceiling). Default brick. */
  shell?: string;
  /** Blocks and elements placed after the template, in order. */
  place?: Placement[];
  /** What a pedestal (T) holds. */
  pedestal?: string;
  items?: string[];
  hand?: string[];
  enemies?: { def: string; at: Vec3; faction?: 'projection' | 'self' }[];
  /** Where the player stands (room-local). Default: the template's P, else the centre. */
  player?: Vec3;
  /** The player cannot be hurt. Default false (the lab), true in the creative room. */
  god?: boolean;
  /** Lab: ticks to run (60 per second), the ticks to report on, and the script. */
  ticks?: number;
  report?: number[];
  actions?: Action[];
  /** Lab: heights (room-local h) drawn top-down in the report, and the ticks they are drawn at. Default [0] at the last tick. */
  view?: number[];
  maps?: number[];
}

/** The grid cell the sandbox room sits in (room ids and the minimap use it). */
const CELL: [number, number] = [2, 2];
const ELEMENT_ID: Record<ElementKey, number> = { water: EL_WATER, lava: EL_LAVA, fire: EL_FIRE };

export interface SandboxRoom {
  floor: FloorResult;
  room: RoomInfo;
  template: RoomTemplate;
  /** World position of room-local [0, 0, 0]. */
  origin: Vec3;
  /** Pedestal tops (world cells) and key spots (world cells). */
  pedestals: Vec3[];
  keys: Vec3[];
}

/** Every problem with a scenario (unknown ids, sizes out of range), empty when it is valid. */
export function validateScenario(s: Scenario): string[] {
  const errs: string[] = [];
  const mats = (keys: string[] | undefined, what: string) => { for (const k of keys ?? []) if (MAT[k] === undefined) errs.push(`${s.id}: unknown block "${k}" in ${what}`); };
  if (s.template && !ROOM_TEMPLATES.some(t => t.id === s.template)) errs.push(`${s.id}: unknown template "${s.template}"`);
  if (!s.template && !s.rows) errs.push(`${s.id}: needs a template or rows`);
  if (s.floor !== undefined && (s.floor < 0 || s.floor > LAST_FLOOR)) errs.push(`${s.id}: floor ${s.floor} out of 0…${LAST_FLOOR}`);
  if (s.rows) {
    const [w, d] = [s.rows[0]?.length ?? 0, s.rows.length];
    if (s.rows.some(r => r.length !== w)) errs.push(`${s.id}: rows of different widths`);
    if (w < 3 || d < 3 || w > 28 || d > 16) errs.push(`${s.id}: ${w} × ${d} is outside 3 × 3 … 28 × 16`);
  }
  if (s.height !== undefined && (s.height < 3 || s.height > 8)) errs.push(`${s.id}: height ${s.height} outside 3…8`);
  mats(s.shell ? [s.shell] : [], 'shell');
  mats(s.hand, 'hand');
  const places = [...(s.place ?? []), ...(s.actions ?? []).filter((a): a is Action & Placement => !('do' in a))];
  mats(places.flatMap(p => 'block' in p ? [p.block] : []), 'place');
  for (const a of s.actions ?? []) if ('do' in a) {
    if ((a.do === 'cube') && MAT[a.block] === undefined) errs.push(`${s.id}: unknown block "${a.block}" at t ${a.t}`);
    if (a.do === 'hand') mats(a.blocks, `hand at t ${a.t}`);
    if ((a.do === 'give' || a.do === 'lose') && !ITEM_BY_ID.has(a.item)) errs.push(`${s.id}: unknown item "${a.item}" at t ${a.t}`);
    if (a.do === 'spawn' && !ENEMY_BY_ID.has(a.def) && !CREATURE_BY_ID.has(a.def)) errs.push(`${s.id}: unknown projection "${a.def}" at t ${a.t}`);
  }
  for (const id of s.items ?? []) if (!ITEM_BY_ID.has(id)) errs.push(`${s.id}: unknown item "${id}"`);
  if (s.pedestal && !ITEM_BY_ID.has(s.pedestal)) errs.push(`${s.id}: unknown pedestal item "${s.pedestal}"`);
  for (const e of s.enemies ?? []) if (!ENEMY_BY_ID.has(e.def) && !CREATURE_BY_ID.has(e.def)) errs.push(`${s.id}: unknown projection "${e.def}"`);
  return errs;
}

/** The template a scenario carves: its own rows, or a catalogue template with overrides. */
export function scenarioTemplate(s: Scenario): RoomTemplate {
  const base = s.template ? ROOM_TEMPLATES.find(t => t.id === s.template) : undefined;
  if (s.template && !base) throw new Error(`sandbox: unknown template "${s.template}"`);
  const rows = s.rows ?? base!.rows;
  return {
    id: s.template ?? `sandbox:${s.id}`,
    types: ['normal'],
    rows,
    height: s.height ?? base?.height,
    ceiling: s.ceiling ?? base?.ceiling,
    layers: s.layers ?? base?.layers,
    lesson: s.rows ? undefined : base?.lesson,
    size: s.rows ? undefined : base?.size,
  };
}

/** Room-local cells of a point or a box. */
export function cells(at: Vec3 | Box): Vec3[] {
  if (at.length === 3) return [at];
  const out: Vec3[] = [];
  const [x0, y0, z0, x1, y1, z1] = at;
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) out.push([x, y, z]);
  return out;
}

/** Applies one placement to the world (room-local cells). Elements are sources unless `level` says otherwise. */
export function applyPlacement(w: VoxelWorld, origin: Vec3, p: Placement) {
  for (const [x, y, z] of cells(p.at)) {
    const wx = origin[0] + x, wy = origin[1] + y, wz = origin[2] + z;
    if ('block' in p) w.set(wx, wy, wz, MAT[p.block]);
    else if ('element' in p) { w.set(wx, wy, wz, AIR); w.setElem(wx, wy, wz, ELEMENT_ID[p.element], p.level ?? SOURCE); }
    else { w.set(wx, wy, wz, AIR); w.setElem(wx, wy, wz, 0, 0); }
  }
}

/**
 * Carves the scenario's room into a world that already holds the run's rock (createDungeonWorld):
 * the room sits on floor `floor`'s band, sealed (no doors), with its template, shell and placements.
 */
export function carveSandbox(w: VoxelWorld, rr: RunRandom, s: Scenario): SandboxRoom {
  const errs = validateScenario(s);
  if (errs.length) throw new Error(errs.join('\n'));
  const k = s.floor ?? 1;
  const t = scenarioTemplate(s);
  const width = t.rows[0].length, depth = t.rows.length;
  const [x0, z0] = roomOrigin(CELL[0], CELL[1]);
  const y0 = floorY(k);
  const flipX = !!s.flipX, flipZ = !!s.flipZ;
  const markers = carveInterior(w, t, x0, y0, z0, flipX, flipZ, s.mood ?? 'normal', rr.fork('sandbox', 'layout'), k);
  const height = t.height ?? ROOM_H;
  if (s.shell && s.shell !== 'brick') {
    for (let z = z0 - 2; z <= z0 + depth + 1; z++) for (let y = y0 - 2; y <= y0 + height + 1; y++) for (let x = x0 - 2; x <= x0 + width + 1; x++) {
      const inside = x >= x0 && x < x0 + width && z >= z0 && z < z0 + depth && y >= y0 && y < y0 + height;
      if (!inside && w.inside(x, y, z) && w.data[w.idx(x, y, z)] === MAT.brick) w.data[w.idx(x, y, z)] = MAT[s.shell];
    }
  }
  const origin: Vec3 = [x0, y0, z0];
  for (const p of s.place ?? []) applyPlacement(w, origin, p);
  const pedestals: Vec3[] = [], keys: Vec3[] = [];
  let spawn: Vec3 = [x0 + width / 2, y0, z0 + depth / 2];
  for (const m of markers) {
    if (m.ch === 'P') spawn = [m.x + 0.5, y0, m.z + 0.5];
    if (m.ch === 'T') { w.data[w.idx(m.x, y0, m.z)] = MAT.pedestal; pedestals.push([m.x, y0 + 1, m.z]); }
    if (m.ch === 'K') keys.push([m.x, y0, m.z]);
  }
  if (s.player) spawn = [x0 + s.player[0] + 0.5, y0 + s.player[1], z0 + s.player[2] + 0.5];
  const id = roomGid(k, 0);
  const room: RoomInfo = {
    id, floor: k, type: 'normal', gx: CELL[0], gz: CELL[1], x0, y0, z0, height, w: width, d: depth,
    template: t.id, flipX, flipZ, mood: s.mood ?? 'normal', doors: {}, enemies: [],
    hx: x0, hz: z0, open: new Uint8Array(width * depth).fill(1),
  };
  for (let x = x0 - 2; x <= x0 + width + 2; x += 8) for (let z = z0 - 2; z <= z0 + depth + 2; z += 8)
    for (let y = y0 - 4; y <= y0 + height + 2; y += 4) if (w.inside(x, y, z)) { w.markDirty(x, y, z); w.markElemDirty(x, y, z); }
  const grid = new Int16Array(GRID * GRID).fill(-1);
  const [gx1, gz1] = cellOf(x0 + width - 1, z0 + depth - 1);
  for (let gz = CELL[1]; gz <= gz1; gz++) for (let gx = CELL[0]; gx <= gx1; gx++) grid[gx + gz * GRID] = 0;
  const plan: FloorPlan = { w: GRID, h: GRID, rooms: [{ id: 0, gx: CELL[0], gz: CELL[1], type: 'normal', dist: 0, links: {} }], grid, start: 0 };
  const floor: FloorResult = {
    floor: k, boss: null, plan, rooms: [room], doors: [], spawn, chests: [], hole: null, silence: null,
    pedestals: pedestals.map(([x, y, z]) => ({ room: id, x, y, z, item: s.pedestal ?? null, boss: false, chest: false })),
    keys: keys.map(([x, y, z]) => ({ room: id, x, y, z })),
    space: Int16Array.from(grid),
  };
  return { floor, room, template: t, origin, pedestals, keys };
}
