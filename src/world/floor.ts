// The dungeon: four floors stacked in one voxel world, carved from floor plans and room templates.
// See docs/architecture/ROOMS.md (rooms, doors) and docs/architecture/ENTITIES.md §2 (stacking).
//
// Vertical layout (y), floor k = 1 (top) … 4 (bottom), each on a 16-block band:
//
//   71         grass (surface, open sky above)
//   63–70      dirt
//   56–60      floor 1 interiors   (ceiling 61–62, brick floor 54–55)
//   40–44      floor 2 interiors
//   24–28      floor 3 interiors
//    8–12      floor 4 interiors
//    1–5       deepstone and obsidian
//    0         bedrock
//
// Rocks between floors get harder with depth. Each floor is a 7×7 grid of rooms on a 15×9 pitch
// (13×7 interior + 2-block shared walls). The next floor's start room sits right under the
// boss room above, and a 2×2 shaft joins them when the boss room opens.

import { AIR, MAT } from '../content/materials';
import { CELL_STACK, cellAt, DECOR_CHARS, ROOM_D, ROOM_H, ROOM_W, type RoomTemplate } from '../content/rooms';
import { ROCK_THEME, type RockTheme } from '../content/tables/floors';
import { DECOR_SLOTS, REINFORCE, ROOM_MOOD, type RoomMood } from '../content/tables/rooms';
import { hash3, type Rng, type RunRandom } from '../core/rng';
import { generatePlan, OPPOSITE, type FloorPlan, type RoomType, type Side } from './floorplan';
import { VoxelWorld } from './world';

export const FLOORS = 4;
export const BAND = 16;
export const PITCH_X = ROOM_W + 2;   // 15
export const PITCH_Z = ROOM_D + 2;   // 9
export const MARGIN = 6;             // solid rock around the whole floor
export const GRID = 7;
export const DOOR_H = 3;
export const SURFACE_Y = floorY(1) + 15; // 71
export const WORLD_SIZE = { sx: MARGIN * 2 + 2 + GRID * PITCH_X, sy: SURFACE_Y + 1, sz: MARGIN * 2 + 2 + GRID * PITCH_Z };
/** Global room id = floor × ROOM_ID_STRIDE + room index in that floor's plan. */
export const ROOM_ID_STRIDE = 100;

/** First air layer inside the rooms of floor k (1 = top). */
export function floorY(k: number) { return 8 + (FLOORS - k) * BAND; }

/** Which floor's band a height belongs to (0 = above floor 1, i.e. the surface). */
export function bandOf(y: number): number {
  const k = FLOORS - Math.floor((y - 6) / BAND);
  return Math.max(0, Math.min(FLOORS, k));
}

export type DoorKind = 'normal' | 'treasure' | 'boss' | 'vault';

export interface RoomInfo {
  /** Global id (floor × 100 + index). */
  id: number;
  floor: number;
  type: RoomType;
  gx: number; gz: number;
  /** Interior corner (inclusive) in world blocks, and the floor height. */
  x0: number; y0: number; z0: number;
  template: string;
  flipX: boolean; flipZ: boolean;
  /** Rolled per room: biases decor slots; 'reinforced' hardens obstacles inside. */
  mood: RoomMood;
  doors: Partial<Record<Side, number>>;
  /** Enemy ids that will spawn on the first visit (normal rooms). */
  enemies: string[];
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
  floor: number;
  plan: FloorPlan;
  rooms: RoomInfo[];
  doors: DoorSpec[];
  spawn: [number, number, number];
  /** Pedestal items are drawn at carve time so a seed always gives the same items. */
  pedestals: { room: number; x: number; y: number; z: number; item: string | null }[];
  keys: { room: number; x: number; y: number; z: number }[];
  /** Where the hole to the next floor opens (boss room), if there is a next floor. */
  hole: { room: number; x: number; z: number; yTop: number; yBottom: number } | null;
}

export function roomOrigin(gx: number, gz: number): [number, number] {
  return [MARGIN + 2 + gx * PITCH_X, MARGIN + 2 + gz * PITCH_Z];
}

/** Grid cell under a world position (may be outside the plan). */
export function cellOf(x: number, z: number): [number, number] {
  return [Math.floor((x - MARGIN - 1) / PITCH_X), Math.floor((z - MARGIN - 1) / PITCH_Z)];
}

/**
 * The whole run's structure, decided when the run starts (docs/architecture/RNG.md §3):
 * every floor's plan (floor k+1 starts under floor k's boss room) and every floor's rock theme.
 * Voxels are carved later, one floor ahead, from these decisions only.
 */
export interface DungeonPlan {
  plans: FloorPlan[];          // index k-1
  themes: RockTheme[];         // index k-1
}

export function planDungeon(rr: RunRandom): DungeonPlan {
  const plans: FloorPlan[] = [], themes: RockTheme[] = [];
  for (let k = 1; k <= FLOORS; k++) {
    const above = plans[k - 2];
    const boss = above?.rooms.find(r => r.type === 'boss');
    plans.push(generatePlan(rr.fork('plan', k), undefined, boss ? [boss.gx, boss.gz] : undefined));
    themes.push(ROCK_THEME.roll(rr.fork('floor', k, 'theme'), { floor: k })!);
  }
  return { plans, themes };
}

export function createDungeonWorld(rr: RunRandom, dungeon: DungeonPlan): VoxelWorld {
  const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
  fillRock(w, [rr.fork('rock', 0).u32(), rr.fork('rock', 1).u32()], dungeon.themes);
  return w;
}

/** Enemy roster per room: what can appear and how many, by floor. */
export interface EnemyBudget { pick(rng: Rng, floor: number): string[] }

export interface CarveOptions {
  templates: readonly RoomTemplate[];
  /** The item reserved for a pedestal room at run start (global room id), or null. */
  pedestalItem(room: number): string | null;
  enemies: EnemyBudget;
}

/**
 * Carves floor k into the world from its pre-decided plan. Every room draws from its own forks
 * (`floor/k/room/i/layout` for template → flipX → flipZ → mood → decor slots row by row, and
 * `floor/k/room/i/roster`), so changing one room never changes another.
 */
export function carveFloor(w: VoxelWorld, rr: RunRandom, k: number, plan: FloorPlan, opt: CarveOptions): FloorResult {
  const y0 = floorY(k), y1 = y0 + ROOM_H - 1;
  const keyRng = rr.fork('floor', k, 'key');
  const gid = (i: number) => k * ROOM_ID_STRIDE + i;

  const rooms: RoomInfo[] = [];
  const doors: DoorSpec[] = [];
  const pedestals: FloorResult['pedestals'] = [];
  const keySpots: FloorResult['keys'] = [];
  let spawn: [number, number, number] = [0, y0, 0];
  let holeAt: [number, number, number] | null = null;

  // 1. room shells and interiors
  for (const pr of plan.rooms) {
    const [x0, z0] = roomOrigin(pr.gx, pr.gz);
    const x1 = x0 + ROOM_W - 1, z1 = z0 + ROOM_D - 1;
    fillBox(w, x0 - 2, y0 - 2, z0 - 2, x1 + 2, y1 + 2, z1 + 2, MAT.brick);
    fillBox(w, x0, y0, z0, x1, y1, z1, AIR);
    const layout = rr.fork('floor', k, 'room', pr.id, 'layout');
    const t = pickTemplate(opt.templates, pr.type, layout);
    const mirror = t.mirror !== false && pr.type !== 'start';
    const flipX = mirror && layout.chance(0.5), flipZ = mirror && layout.chance(0.5);
    const mood: RoomMood = pr.type === 'normal' ? ROOM_MOOD.roll(layout, { floor: k })! : 'normal';
    for (let row = 0; row < ROOM_D; row++) for (let col = 0; col < ROOM_W; col++) {
      const ch = cellAt(t, col, row, flipX, flipZ);
      const x = x0 + col, z = z0 + row;
      const s = CELL_STACK[ch];
      if (s) {
        const m = mood === 'reinforced' ? hardened(s.m) : s.m;
        for (let h = 0; h < s.h; h++) w.data[w.idx(x, y0 + h, z)] = m;
      }
      if (DECOR_CHARS.has(ch)) {
        // decor slot: rolled in row order from the room's own layout fork
        const key = DECOR_SLOTS[mood][ch as '?' | '~' | '!'].roll(layout, { floor: k });
        if (key) w.data[w.idx(x, y0, z)] = MAT[key];
      }
      if (ch === 'P') spawn = [x + 0.5, y0, z + 0.5];
      if (ch === 'T') {
        w.data[w.idx(x, y0, z)] = MAT.pedestal;
        pedestals.push({ room: gid(pr.id), x, y: y0 + 1, z, item: opt.pedestalItem(gid(pr.id)) });
      }
      if (ch === 'K') keySpots.push({ room: gid(pr.id), x, y: y0, z });
      if (ch === 'H') holeAt = [x, y0, z];
    }
    rooms.push({
      id: gid(pr.id), floor: k, type: pr.type, gx: pr.gx, gz: pr.gz, x0, y0, z0, template: t.id, flipX, flipZ, mood, doors: {},
      enemies: pr.type === 'normal' ? opt.enemies.pick(rr.fork('floor', k, 'room', pr.id, 'roster'), k) : [],
    });
  }

  // 2. doorways between linked rooms (each pair once: only east and south links)
  for (const pr of plan.rooms) {
    for (const side of ['E', 'S'] as Side[]) {
      const other = pr.links[side];
      if (other === undefined) continue;
      const a = rooms[pr.id], b = rooms[other];
      const special = [a.type, b.type].find(t => t === 'treasure' || t === 'boss' || t === 'vault');
      const kind: DoorKind = (special as DoorKind) ?? 'normal';
      const id = k * ROOM_ID_STRIDE + doors.length;
      const dy1 = y0 + DOOR_H - 1;
      const spec: DoorSpec = side === 'E'
        ? { id, rooms: [a.id, b.id], kind, locked: kind === 'vault', axis: 'x',
            x0: a.x0 + ROOM_W, x1: a.x0 + ROOM_W + 1, y0, y1: dy1, z0: a.z0 + 2, z1: a.z0 + 4 }
        : { id, rooms: [a.id, b.id], kind, locked: kind === 'vault', axis: 'z',
            x0: a.x0 + 5, x1: a.x0 + 7, y0, y1: dy1, z0: a.z0 + ROOM_D, z1: a.z0 + ROOM_D + 1 };
      carveDoorway(w, spec);
      doors.push(spec);
      a.doors[side] = id;
      b.doors[OPPOSITE[side]] = id;
    }
  }

  // 3. a key in a normal room if there is a locked door (prefer K spots)
  const keys: FloorResult['keys'] = [];
  if (doors.some(d => d.locked)) {
    const normal = new Set(rooms.filter(rm => rm.type === 'normal').map(rm => rm.id));
    const spots = keySpots.filter(s => normal.has(s.room));
    if (spots.length) keys.push(keyRng.pick(spots));
    else {
      const rm = keyRng.pick(rooms.filter(x => x.type === 'normal'));
      keys.push({ room: rm.id, x: rm.x0 + 6, y: y0, z: rm.z0 + 3 });
    }
  }

  // 4. where the hole to the next floor will open: the boss room's H (its 2×2 shaft lands in
  //    the next floor's start room, which is generated under it)
  let hole: FloorResult['hole'] = null;
  if (k < FLOORS) {
    const boss = rooms.find(rm => rm.type === 'boss')!;
    const [hx, , hz] = holeAt ?? [boss.x0 + 6, y0, boss.z0 + 3];
    hole = { room: boss.id, x: hx, z: hz, yTop: y0 - 1, yBottom: floorY(k + 1) + ROOM_H };
  }

  for (const rm of rooms) markRoomDirty(w, rm);
  return { floor: k, plan, rooms, doors, spawn, pedestals, keys, hole };
}

/** Opens the 2×2 shaft from a boss room floor down into the start room below. */
export function openHole(w: VoxelWorld, hole: NonNullable<FloorResult['hole']>) {
  for (let y = hole.yBottom; y <= hole.yTop; y++)
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) w.set(hole.x + dx, y, hole.z + dz, AIR);
}

function markRoomDirty(w: VoxelWorld, rm: RoomInfo) {
  for (let x = rm.x0 - 2; x <= rm.x0 + ROOM_W + 2; x += 8)
    for (let z = rm.z0 - 2; z <= rm.z0 + ROOM_D + 2; z += 8)
      for (let y = rm.y0 - 2; y <= rm.y0 + ROOM_H + 2; y += 8) if (w.inside(x, y, z)) w.markDirty(x, y, z);
}

function pickTemplate(templates: readonly RoomTemplate[], type: RoomType, rng: Rng): RoomTemplate {
  const options = templates.filter(t => t.types.includes(type));
  if (!options.length) throw new Error(`no room template for type "${type}"`);
  const total = options.reduce((s, t) => s + (t.weight ?? 1), 0);
  let r = rng.next() * total;
  for (const t of options) { r -= t.weight ?? 1; if (r <= 0) return t; }
  return options[options.length - 1];
}

/** "reinforced" rooms: soft obstacles become harder materials (interior only). */
function hardened(m: number): number {
  for (const [from, to] of Object.entries(REINFORCE)) if (m === MAT[from]) return MAT[to];
  return m;
}

/**
 * The whole column, once per run: harder rock the deeper you go, shaped by each floor's theme.
 * Two independent noise layers, each seeded from its own fork (never `seed + n`, which would
 * make nearby seeds share layers).
 */
function fillRock(w: VoxelWorld, layers: [number, number], themes: RockTheme[]) {
  const n = (x: number, y: number, z: number, layer: 0 | 1) => hash3(layers[layer], x, y, z);
  for (let z = 0; z < w.sz; z++) for (let y = 0; y < w.sy; y++) for (let x = 0; x < w.sx; x++) {
    let m: number;
    const band = bandOf(y);
    if (y === 0) m = MAT.bedrock;
    else if (y === SURFACE_Y) m = MAT.grass;
    else if (y > floorY(1) + ROOM_H + 1) m = MAT.dirt;
    else if (y <= 5) m = n(x >> 1, y >> 1, z >> 1, 0) < 0.12 ? MAT.obsidian : MAT.deepstone;
    else {
      const v = n(x >> 1, y >> 1, z >> 1, 1);
      const t = themes[Math.max(1, band) - 1];
      // floors 1–2: stone with dirt pockets; 3: stone and deepstone; 4: deepstone and obsidian
      if (band >= 4) m = v < 0.1 + t.hard * 0.3 ? MAT.obsidian : MAT.deepstone;
      else if (band === 3) m = v < 0.35 + t.hard ? MAT.deepstone : MAT.stone;
      else m = v < t.pockets ? MAT.dirt : v < t.pockets + t.hard * 0.5 ? MAT.deepstone : MAT.stone;
      if (v > 1 - t.ore) m = MAT.ore;
    }
    if (y < SURFACE_Y && (x === 0 || z === 0 || x === w.sx - 1 || z === w.sz - 1)) m = MAT.bedrock;
    w.data[w.idx(x, y, z)] = m;
  }
  w.markAllDirty();
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
