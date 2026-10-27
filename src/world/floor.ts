// The dungeon: ten floors stacked in one voxel world, carved from floor plans and room templates.
// See docs/architecture/ROOMS.md (rooms, doors), docs/architecture/LEVELS.md (the thirteen levels)
// and docs/architecture/ENTITIES.md §2 (stacking). What each floor is: src/content/levels.ts.
//
// Vertical layout (y), floor k = 0 (the roots, top) … 9 (the frozen bottom), each on a 16-block band:
//
//  168–267    open sky: you can build up to SKY_LIMIT blocks above the grass (the tree, L5)
//  167        grass (surface, open sky above)
//  159–166    dirt
//  152–156    floor 0 interiors   (ceiling 157–158, brick floor 150–151)
//  136–140    floor 1 interiors
//   …         one band of 16 per floor
//    8–12     floor 9 interiors
//    1–5      deepstone and obsidian (silence, L4)
//    0        bedrock
//
// Rocks between floors get harder with depth (each level's `strata`). Each floor is a 7×7 grid of rooms on a 15×9 pitch
// (13×7 interior + 2-block shared walls). The next floor's start room sits right under the
// boss room above, and a 2×2 shaft joins them when the boss room opens.

import { AIR, MAT } from '../content/materials';
import { EL_FIRE, EL_LAVA, EL_WATER, SOURCE } from '../content/elements';
import { FIRST_FLOOR, LAST_FLOOR, level, LEVELS } from '../content/levels';
import { CELL_ELEMENT, CELL_STACK, TUTORIAL_ORDER, cellAt, DECOR_CHARS, ROOM_D, ROOM_H, ROOM_W, type CeilingShape, type RoomTemplate } from '../content/rooms';
import { CHEST_LOCK, ITEM_IN_CHEST, ROOM_CHEST } from '../content/tables/chests';
import { ROCK_THEME, type RockTheme } from '../content/tables/floors';
import { CHALLENGE_ROOM, DECOR_SLOTS, REINFORCE, ROOM_MOOD, type RoomMood } from '../content/tables/rooms';
import { hash3, type Rng, type RunRandom } from '../core/rng';
import { DEFAULT_PLAN, generatePlan, growFootprint, OPPOSITE, sizeOf, TREE_ENTRY, treeCell, treePlan, type FloorPlan, type RoomType, type Side } from './floorplan';
import { VoxelWorld } from './world';

/** How many floors go down (0 … LAST_FLOOR). */
export const FLOORS = LEVELS.length;
export { FIRST_FLOOR, LAST_FLOOR };
export const BAND = 16;
export const PITCH_X = ROOM_W + 2;   // 15
export const PITCH_Z = ROOM_D + 2;   // 9
export const MARGIN = 6;             // solid rock around the whole floor
export const GRID = 7;
export const DOOR_H = 3;
export const SURFACE_Y = floorY(FIRST_FLOOR) + 15; // 167
/** How many blocks of open sky sit above the grass (the build limit). It is depth 0 to anything that
 *  asks how deep you are (`depthOf`), and the band `SURFACE` to the structure (`bandOf`). */
export const SKY_LIMIT = 100;
export const WORLD_SIZE = { sx: MARGIN * 2 + 2 + GRID * PITCH_X, sy: SURFACE_Y + 1 + SKY_LIMIT, sz: MARGIN * 2 + 2 + GRID * PITCH_Z };
/** Global room id = levelIndex(floor) × ROOM_ID_STRIDE + room index in that floor's plan; doors
 *  likewise. Always positive (tree floors below 0 will fit too). */
export const ROOM_ID_STRIDE = 100;
export const levelIndex = (floor: number) => floor + 4;

/** The band above floor 0: the dirt, the grass and the open sky (the tree, later). */
export const SURFACE = -1;

/** First air layer inside the rooms of floor k (0 = the roots, at the top). */
export function floorY(k: number) { return 8 + (LAST_FLOOR - k) * BAND; }

/** Which floor's band a height belongs to (0–9), or SURFACE above floor 0's band. */
export function bandOf(y: number): number {
  const k = LAST_FLOOR - Math.floor((y - 6) / BAND);
  return k < FIRST_FLOOR ? SURFACE : Math.min(LAST_FLOOR, k);
}

/** How deep a height is for anything that asks (items, the HUD): the surface counts as 0. */
export function depthOf(y: number): number { return Math.max(FIRST_FLOOR, bandOf(y)); }

export type DoorKind = 'normal' | 'treasure' | 'boss' | 'vault' | 'challenge';

export interface RoomInfo {
  /** Global id (levelIndex(floor) × ROOM_ID_STRIDE + index). */
  id: number;
  floor: number;
  type: RoomType;
  gx: number; gz: number;
  /** Interior corner (inclusive) in world blocks, and the floor height. */
  x0: number; y0: number; z0: number;
  /** Interior height in blocks (ROOM_H unless the template asks for more; vaults rise above it). */
  height: number;
  /** Interior width (x) and depth (z) in blocks: 13 × 7 for one cell, 28 or 16 for a bigger footprint. */
  w: number; d: number;
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

/** An unbreakable chest block (docs/design/CHESTS.md). Opening it spends `keys` keys (0 = free). */
export interface ChestSpec {
  room: number; x: number; y: number; z: number;
  keys: number;
  /** The practice reserved for it when it stands where a pedestal would (null: it holds loot rolled when opened). */
  item: string | null;
}

export interface FloorResult {
  floor: number;
  plan: FloorPlan;
  rooms: RoomInfo[];
  doors: DoorSpec[];
  spawn: [number, number, number];
  /** Pedestal items are drawn at carve time so a seed always gives the same items.
   *  `boss`: the boss room's pedestal, whose practice only appears once the boss is overcome.
   *  `chest`: the practice is shut in a chest (listed in `chests`) instead of floating in the open. */
  pedestals: { room: number; x: number; y: number; z: number; item: string | null; boss: boolean; chest: boolean }[];
  chests: ChestSpec[];
  keys: { room: number; x: number; y: number; z: number }[];
  /** Where the hole to the next floor opens (boss room), if there is a next floor. */
  hole: { room: number; x: number; z: number; size: number; yTop: number; yBottom: number } | null;
  /** Under the last floor: the chamber of silence (L4), or null. */
  silence: { x0: number; z0: number; x1: number; z1: number; y0: number; y1: number } | null;
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
  plans: FloorPlan[];          // index = floor (0 … LAST_FLOOR)
  themes: RockTheme[];         // index = floor
}

export function planDungeon(rr: RunRandom): DungeonPlan {
  const plans: FloorPlan[] = [], themes: RockTheme[] = [];
  for (let k = FIRST_FLOOR; k <= LAST_FLOOR; k++) {
    const above = plans[k - 1];
    const boss = above?.rooms.find(r => r.type === 'boss');
    const lv = level(k);
    const below = LEVELS[k + 1];
    let plan: FloorPlan;
    if (lv.kind === 'tree') {
      // Tree floors alternate north–south so each crown lies over the next kingdom
      // the last Tree floor ends in the great pit (a wide crown over a 4×4 shaft)
      plan = treePlan(treeIndex(k) % 2 === 1, lv.vaults, below?.kind !== 'tree');
    } else if (below?.kind === 'tree') {
      // the floor above the first Tree floor grows from its way down, right over the kingdom
      plan = generatePlan(rr.fork('plan', k, lv.kind), { ...DEFAULT_PLAN, ...lv.plan }, treeCell(TREE_ENTRY, treeIndex(k + 1) % 2 === 1), true);
    } else {
      plan = generatePlan(rr.fork('plan', k, lv.kind), { ...DEFAULT_PLAN, ...lv.plan }, boss ? [boss.gx, boss.gz] : undefined);
    }
    // deep floors keep no vault (the catalogue of practices must last the run): it stays a quiet room
    if (!lv.vaults) for (const r of plan.rooms) if (r.type === 'vault') r.type = 'normal';
    // deeper random floors grow bigger rooms: a normal room spreads into an empty cell east or south
    if (lv.grow > 0) {
      const g = rr.fork('plan', k, 'grow');
      for (const r of plan.rooms) {
        if (r.type !== 'normal' || !g.chance(lv.grow)) continue;
        const dirs: [number, number][] = g.chance(0.5) ? [[2, 1], [1, 2]] : [[1, 2], [2, 1]];
        for (const size of dirs) if (growFootprint(plan, r, size)) break;
      }
    }
    // hostile floors may keep a challenge room, a dead end when there is one, never next to the start
    if (!lv.tutorial) {
      const ch = rr.fork('plan', k, 'challenge');
      if (CHALLENGE_ROOM.roll(ch, { floor: k })) {
        const start = plan.rooms[plan.start];
        const ok = plan.rooms.filter(r => r.type === 'normal' && sizeOf(r)[0] * sizeOf(r)[1] === 1 && !Object.values(start.links).includes(r.id));
        const dead = ok.filter(r => Object.keys(r.links).length === 1);
        const pool = dead.length ? dead : ok;
        if (pool.length) pool[ch.int(0, pool.length - 1)].type = 'challenge';
      }
    }
    plans.push(plan);
    themes.push(ROCK_THEME.roll(rr.fork('floor', k, 'theme'), { floor: k })!);
  }
  return { plans, themes };
}

/** Which Tree floor this is, counting from the first (0, 1, 2…): odd ones are mirrored. */
const treeIndex = (k: number) => k - LEVELS.findIndex(l => l.kind === 'tree');

/** Global id of room `index` on `floor`. */
export const roomGid = (floor: number, index: number) => levelIndex(floor) * ROOM_ID_STRIDE + index;

export interface PedestalSlot { key: string; pool: 'treasure' | 'vault' | 'boss'; maxQuality?: number }

/** Rooms whose pedestal gets a practice reserved at run start, in (floor, room) order, and the
 *  pool each draws from (docs/architecture/RNG.md §3.4). Boss rooms hold the boss's practice; on
 *  the tutorial floor there is no boss (its last room is only the way down) and every pedestal
 *  holds a gentle practice from the treasure pool (owner: quality 1–3). */
export function pedestalSlots(dungeon: DungeonPlan): PedestalSlot[] {
  const slots: PedestalSlot[] = [];
  dungeon.plans.forEach((plan, k) => {
    const lv = level(k);
    for (const r of plan.rooms) if (r.type === 'treasure' || r.type === 'vault' || r.type === 'boss')
      slots.push({ key: String(roomGid(k, r.id)), pool: lv.tutorial ? 'treasure' : r.type, maxQuality: lv.maxQuality });
  });
  return slots;
}

export function createDungeonWorld(rr: RunRandom, dungeon: DungeonPlan): VoxelWorld {
  const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
  fillRock(w, [rr.fork('rock', 0).u32(), rr.fork('rock', 1).u32()], dungeon.themes);
  return w;
}

/** Enemy roster per room: what can appear and how many, by floor. */
export interface EnemyBudget { pick(rng: Rng, floor: number, cells?: number): string[] }

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
  const gid = (i: number) => roomGid(k, i);
  const lv = level(k);

  const rooms: RoomInfo[] = [];
  const doors: DoorSpec[] = [];
  const pedestals: FloorResult['pedestals'] = [];
  const keySpots: FloorResult['keys'] = [];
  const chests: ChestSpec[] = [];
  const freeByRoom = new Map<number, [number, number][]>();   // world (x, z) of tiles where a chest or a key may lie
  let spawn: [number, number, number] = [0, y0, 0];
  let holeAt: [number, number, number] | null = null;

  // the tutorial teaches in order: its normal rooms, by steps from the start, get the lessons in turn
  const lessonRank = new Map(plan.rooms.filter(r => r.type === 'normal').sort((a, b) => a.dist - b.dist || a.id - b.id).map((r, i) => [r.id, i]));

  // 1. room shells and interiors
  for (const pr of plan.rooms) {
    const [x0, z0] = roomOrigin(pr.gx, pr.gz);
    const size = sizeOf(pr), [RW, RD] = roomDims(size);
    const x1 = x0 + RW - 1, z1 = z0 + RD - 1;
    const layout = rr.fork('floor', k, 'room', pr.id, 'layout');
    let t = pickTemplate(opt.templates, pr.type, k, layout, !!lv.tutorial, size);
    if (lv.tutorial && pr.type === 'normal') {
      const lesson = TUTORIAL_ORDER[(lessonRank.get(pr.id) ?? 0) % TUTORIAL_ORDER.length];
      t = opt.templates.find(q => q.lesson === lesson && q.types.includes('normal')) ?? t;
    }
    const height = t.height ?? ROOM_H;
    fillBox(w, x0 - 2, y0 - 2, z0 - 2, x1 + 2, y0 + height + 1, z1 + 2, MAT.brick);
    fillBox(w, x0, y0, z0, x1, y1, z1, AIR);
    const mirror = t.mirror !== false && pr.type !== 'start';
    const flipX = mirror && layout.chance(0.5), flipZ = mirror && layout.chance(0.5);
    const fights = pr.type === 'normal' || pr.type === 'path';
    const mood: RoomMood = fights ? ROOM_MOOD.roll(layout, { floor: k })! : 'normal';
    const chestRng = rr.fork('floor', k, 'room', pr.id, 'chest');
    for (let row = 0; row < RD; row++) for (let col = 0; col < RW; col++) {
      const ch = cellAt(t, col, row, flipX, flipZ);
      const x = x0 + col, z = z0 + row;
      // the height above ROOM_H, shaped into a vault or a dome
      const top = y1 + ceilingRise(t.ceiling ?? 'flat', height - ROOM_H, col, row, RW, RD);
      for (let y = y1 + 1; y <= top; y++) w.data[w.idx(x, y, z)] = AIR;
      const s = CELL_STACK[ch];
      if (s) {
        const m = mood === 'reinforced' ? hardened(s.m) : s.m;
        // '#' reaches the ceiling (whatever its height); 'X' stops two blocks under it
        const n = ch === '#' ? top - y0 + 1 : ch === 'X' ? top - y0 - 1 : s.h;
        for (let h = 0; h < n; h++) w.data[w.idx(x, y0 + h, z)] = m;
      }
      const el = CELL_ELEMENT[ch];
      if (el) carveElement(w, x, y0, z, el, !!lv.frozen);
      for (const layer of t.layers ?? []) {
        const lc = cellAt({ ...t, rows: layer.rows }, col, row, flipX, flipZ), ly = y0 + layer.y;
        const ls = CELL_STACK[lc];
        if (ls) w.data[w.idx(x, ly, z)] = mood === 'reinforced' ? hardened(ls.m) : ls.m;
        else if (lc === 'f') w.elem[w.idx(x, ly, z)] = elemByteOf(EL_FIRE);
      }
      if (DECOR_CHARS.has(ch)) {
        // decor slot: rolled in row order from the room's own layout fork
        const key = DECOR_SLOTS[mood][ch as '?' | '~' | '!'].roll(layout, { floor: k });
        if (key) w.data[w.idx(x, y0, z)] = MAT[key];
      }
      if (ch === 'P') spawn = [x + 0.5, y0, z + 0.5];
      if (ch === 'T') {
        const boss = pr.type === 'boss' && !lv.tutorial;
        const item = opt.pedestalItem(gid(pr.id));
        // the boss's practice is earned, never locked away; most others wait in a chest
        const inChest = !boss && chestRng.chance(ITEM_IN_CHEST);
        w.data[w.idx(x, y0, z)] = inChest ? MAT.chest : MAT.pedestal;
        if (inChest) chests.push({ room: gid(pr.id), x, y: y0, z, keys: CHEST_LOCK.roll(chestRng, { floor: k })!, item });
        pedestals.push({ room: gid(pr.id), x, y: y0 + 1, z, item, boss, chest: inChest });
      }
      if (ch === 'K') keySpots.push({ room: gid(pr.id), x, y: y0, z });
      if (ch === 'H') holeAt = [x, y0, z];
    }
    if (pr.type === 'normal') {
      // a free-standing chest in many rooms; the rest of the open tiles stay free for keys
      let spots = freeSpots(t, flipX, flipZ);
      if (spots.length && chestRng.chance(ROOM_CHEST)) {
        const [col, row] = chestRng.pick(spots);
        w.data[w.idx(x0 + col, y0, z0 + row)] = MAT.chest;
        chests.push({ room: gid(pr.id), x: x0 + col, y: y0, z: z0 + row, keys: CHEST_LOCK.roll(chestRng, { floor: k })!, item: null });
        spots = spots.filter(([c, r]) => c !== col || r !== row);
      }
      freeByRoom.set(gid(pr.id), spots.map(([c, r]) => [x0 + c, z0 + r]));
    }
    rooms.push({
      id: gid(pr.id), floor: k, type: pr.type, gx: pr.gx, gz: pr.gz, x0, y0, z0, height, w: RW, d: RD, template: t.id, flipX, flipZ, mood, doors: {},
      // the tutorial floor is peaceful: no roster at all
      // a bigger room holds more of them (the roster budget grows with its cells)
      enemies: fights && !lv.tutorial ? opt.enemies.pick(rr.fork('floor', k, 'room', pr.id, 'roster'), k, size[0] * size[1]) : [],
    });
  }

  // 2. doorways between linked rooms (each pair once: only east and south links)
  for (const pr of plan.rooms) {
    for (const side of ['E', 'S'] as Side[]) {
      const other = pr.links[side];
      if (other === undefined) continue;
      const a = rooms[pr.id], b = rooms[other];
      const special = [a.type, b.type].find(t => t === 'treasure' || t === 'boss' || t === 'vault' || t === 'challenge');
      // on the tutorial floor every door is open: no padlock, and the way down is a plain door
      let kind: DoorKind = (special as DoorKind) ?? 'normal';
      if (lv.tutorial && kind === 'boss') kind = 'normal';
      if (lv.tutorial && kind === 'vault') kind = 'treasure';
      const id = gid(doors.length);
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

  // 2b. every wall around a locked door is made of obsidian: very hard to break, never impossible
  for (const d of doors) if (d.locked) for (const id of d.rooms) {
    const rm = rooms.find(r => r.id === id)!;
    if (rm.type === 'vault') hardenShell(w, rm);
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
  // 3b. keys for the chests: about three for every four the floor's chests ask (the rest come out of
  //     chests themselves, or from clearing rooms), left on open tiles of normal rooms
  const chestKeys = Math.ceil(0.75 * chests.reduce((s, c) => s + c.keys, 0));
  const extraRng = rr.fork('floor', k, 'chestkeys');
  const homes = [...freeByRoom.keys()].filter(id => freeByRoom.get(id)!.length);
  for (let i = 0; i < chestKeys && homes.length; i++) {
    const room = extraRng.pick(homes), spots = freeByRoom.get(room)!;
    const [x, z] = extraRng.pick(spots);
    keys.push({ room, x, y: y0, z });
    if (spots.length > 1) spots.splice(spots.findIndex(([sx, sz]) => sx === x && sz === z), 1);
  }

  // 4. where the hole to the next floor will open: the boss room's H (its 2×2 shaft lands in
  //    the next floor's start room, which is generated under it)
  let hole: FloorResult['hole'] = null;
  let silence: FloorResult['silence'] = null;
  if (k === LAST_FLOOR) {
    // below the frozen bottom: silence, a sealed chamber on the bedrock under the last way down
    // (air y 1–4, a roof of rock at 5 under the floor's own slab, docs/architecture/LEVELS.md §8)
    const boss = rooms.find(rm => rm.type === 'boss')!;
    const [hx, , hz] = holeAt ?? [boss.x0 + 6, y0, boss.z0 + 3];
    silence = { x0: boss.x0, z0: boss.z0, x1: boss.x0 + boss.w - 1, z1: boss.z0 + boss.d - 1, y0: 1, y1: 4 };
    fillBox(w, silence.x0, 1, silence.z0, silence.x1, 4, silence.z1, AIR);
    hole = { room: boss.id, x: hx, z: hz, size: 2, yTop: y0 - 1, yBottom: 1 };
  }
  if (k < LAST_FLOOR) {
    const boss = rooms.find(rm => rm.type === 'boss')!;
    const [hx, , hz] = holeAt ?? [boss.x0 + 6, y0, boss.z0 + 3];
    // the great pit: a wide crown opens a 4×4 shaft centred on its own cell (it lands on the
    // centre of the start room below, whose templates keep that clear)
    const great = boss.w > ROOM_W || boss.d > ROOM_D;
    hole = great
      ? { room: boss.id, x: hx - 1, z: hz - 1, size: 4, yTop: y0 - 1, yBottom: floorY(k + 1) + ROOM_H }
      : { room: boss.id, x: hx, z: hz, size: 2, yTop: y0 - 1, yBottom: floorY(k + 1) + ROOM_H };
  }

  for (const rm of rooms) markRoomDirty(w, rm);
  return { floor: k, plan, rooms, doors, spawn, pedestals, chests, keys, hole, silence };
}

/** The shell of a room (its two-block walls, floor and ceiling) turned from brick into obsidian. */
function hardenShell(w: VoxelWorld, rm: RoomInfo) {
  const x1 = rm.x0 + rm.w - 1, z1 = rm.z0 + rm.d - 1, top = rm.y0 + rm.height - 1;
  for (let z = rm.z0 - 2; z <= z1 + 2; z++) for (let y = rm.y0 - 2; y <= top + 2; y++) for (let x = rm.x0 - 2; x <= x1 + 2; x++) {
    if (x >= rm.x0 && x <= x1 && z >= rm.z0 && z <= z1 && y >= rm.y0 && y <= top) continue;
    if (!w.inside(x, y, z)) continue;
    const i = w.idx(x, y, z);
    if (w.data[i] === MAT.brick) w.data[i] = MAT.obsidian;
  }
}

/** Ground tiles (col, row, after flips) where a chest or a key may lie: plain floor with clear air above,
 *  away from the door approaches, the centre where projections materialise, and the markers. */
export function freeSpots(t: RoomTemplate, flipX: boolean, flipZ: boolean): [number, number][] {
  const spots: [number, number][] = [];
  const ground = (c: number, r: number) => cellAt(t, c, r, flipX, flipZ);
  for (let row = 0; row < ROOM_D; row++) for (let col = 0; col < ROOM_W; col++) {
    if (ground(col, row) !== '.') continue;
    const approach = (row >= 2 && row <= 4 && (col <= 2 || col >= ROOM_W - 3)) || (col >= 5 && col <= 7 && (row <= 2 || row >= ROOM_D - 3));
    if (approach || (Math.abs(col - 6) <= 1 && Math.abs(row - 3) <= 1)) continue;
    let ok = true;
    for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) {
      const c = col + dx, r = row + dz;
      if (c >= 0 && r >= 0 && c < ROOM_W && r < ROOM_D && 'PTKH'.includes(ground(c, r))) ok = false;
    }
    for (const layer of t.layers ?? []) if (ok && cellAt({ ...t, rows: layer.rows }, col, row, flipX, flipZ) !== '.') ok = false;
    if (ok) spots.push([col, row]);
  }
  return spots;
}

/** Opens the shaft (2×2, or 4×4 for the great pit) from a boss room floor down into the start room below. */
export function openHole(w: VoxelWorld, hole: NonNullable<FloorResult['hole']>) {
  for (let y = hole.yBottom; y <= hole.yTop; y++)
    for (let dz = 0; dz < hole.size; dz++) for (let dx = 0; dx < hole.size; dx++) w.set(hole.x + dx, y, hole.z + dz, AIR);
}

/** Interior size in blocks of a footprint of [cells east, cells south]: the walls between its
 *  cells become floor too (13 + 2 + 13 = 28; 7 + 2 + 7 = 16). */
export function roomDims([sx, sz]: [number, number]): [number, number] {
  return [ROOM_W * sx + 2 * (sx - 1), ROOM_D * sz + 2 * (sz - 1)];
}

function markRoomDirty(w: VoxelWorld, rm: RoomInfo) {
  for (let x = rm.x0 - 2; x <= rm.x0 + rm.w + 2; x += 8)
    for (let z = rm.z0 - 2; z <= rm.z0 + rm.d + 2; z += 8)
      for (let y = rm.y0 - 4; y <= rm.y0 + rm.height + 2; y += 4) if (w.inside(x, y, z)) { w.markDirty(x, y, z); w.markElemDirty(x, y, z); }
}

/** Extra blocks of air above ROOM_H at a tile, for a ceiling of `rise` extra blocks. */
export function ceilingRise(shape: CeilingShape, rise: number, col: number, row: number, w = ROOM_W, d = ROOM_D): number {
  if (rise <= 0) return 0;
  const u = (col + 0.5 - w / 2) / (w / 2), v = (row + 0.5 - d / 2) / (d / 2);
  const p = shape === 'flat' ? 1
    : shape === 'vault-x' ? Math.sqrt(Math.max(0, 1 - v * v))
    : shape === 'vault-z' ? Math.sqrt(Math.max(0, 1 - u * u))
    : Math.sqrt(Math.max(0, 1 - Math.min(1, u * u + v * v)));
  return Math.round(rise * p);
}

const EL_ID = { water: EL_WATER, lava: EL_LAVA, fire: EL_FIRE } as const;
const elemByteOf = (kind: number) => (kind << 6) | SOURCE;

/** A pool (dug `depth` blocks into the floor and filled with a source), a dry dip, or an eternal
 *  flame on the floor. Pools 2 deep get a brick lining under them. */
function carveElement(w: VoxelWorld, x: number, y0: number, z: number, el: { el: 'water' | 'lava' | 'fire' | null; depth: number }, frozen = false) {
  for (let d = 1; d <= el.depth; d++) {
    const i = w.idx(x, y0 - d, z);
    // the ninth circle is frozen: its pools are ice (solid, slippery, breakable), never water
    // (only its surface: the water stays liquid under the ice, review levels L4–L6 point 9)
    if (frozen && el.el === 'water' && d === 1) { w.data[i] = MAT.ice; w.elem[i] = 0; continue; }
    w.data[i] = AIR;
    w.elem[i] = el.el && el.el !== 'fire' ? elemByteOf(EL_ID[el.el]) : 0;
  }
  if (el.depth >= 2) w.data[w.idx(x, y0 - el.depth - 1, z)] = MAT.brick;
  if (el.el === 'fire') w.elem[w.idx(x, y0, z)] = elemByteOf(EL_FIRE);
}

/** `own`: only the templates made for this floor (the tutorial uses its own rooms throughout).
 *  `size`: the room's footprint; only templates of that size fit it. */
function pickTemplate(templates: readonly RoomTemplate[], type: RoomType, floor: number, rng: Rng, own = false, size: [number, number] = [1, 1]): RoomTemplate {
  const fits = (t: RoomTemplate) => (t.size ?? [1, 1])[0] === size[0] && (t.size ?? [1, 1])[1] === size[1];
  const ofType = templates.filter(t => t.types.includes(type) && fits(t));
  const allowed = ofType.filter(t => !t.floors || (floor >= t.floors[0] && floor <= t.floors[1]));
  const mine = allowed.filter(t => t.floors);
  const here = own && mine.length ? mine : allowed;
  // a floor with no template of its own for this type borrows any (never a missing room)
  const options = here.length ? here : ofType;
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
  // the sky above the grass is left as it was created: air
  for (let z = 0; z < w.sz; z++) for (let y = 0; y <= SURFACE_Y; y++) for (let x = 0; x < w.sx; x++) {
    let m: number;
    const band = bandOf(y);
    if (y === 0) m = MAT.bedrock;
    else if (y === SURFACE_Y) m = MAT.grass;
    else if (band === SURFACE) m = MAT.dirt;
    else if (y <= 5) m = n(x >> 1, y >> 1, z >> 1, 0) < 0.12 ? MAT.obsidian : MAT.deepstone;
    else {
      // each floor's band from its level's strata, nudged by the run's rock theme for that floor:
      // the roots are mostly soil, the middle floors stone and deepstone, the bottom obsidian
      const v = n(x >> 1, y >> 1, z >> 1, 1);
      const s = level(band).strata, t = themes[band];
      const obs = s.obsidian + t.hard * 0.1, deep = obs + s.deep + t.hard * 0.4, dirt = deep + s.pockets + t.pockets * (1 - s.deep);
      m = v < obs ? MAT.obsidian : v < deep ? MAT.deepstone : v < dirt ? MAT.dirt : MAT.stone;
      if (v > 1 - (s.ore + t.ore) / 2) m = MAT.ore;
    }
    if (y < SURFACE_Y && (x === 0 || z === 0 || x === w.sx - 1 || z === w.sz - 1)) m = MAT.bedrock;
    w.data[w.idx(x, y, z)] = m;
  }
  // only the surface is meshed now (the grass you see from the sky); floors are marked when they
  // are carved, and digging marks what it opens (review levels.md point 9)
  for (let x = 0; x < w.sx; x += 8) for (let z = 0; z < w.sz; z += 8) for (let y = SURFACE_Y - 2; y <= SURFACE_Y + 1; y++) w.markDirty(x, y, z);
}

/** The frame material of each kind of door (the game also chips its dust from this ramp). */
export const DOOR_FRAME: Record<DoorKind, number> = {
  normal: MAT.frame, treasure: MAT.goldframe, boss: MAT.bossframe, vault: MAT.goldframe,
  // a challenge room: the obsidian of old patterns, like the boss's (its own look is an art follow-up)
  challenge: MAT.bossframe,
};

/** Frame the doorway (one block around it, through the whole wall) and carve the opening. */
function carveDoorway(w: VoxelWorld, d: DoorSpec) {
  const f = DOOR_FRAME[d.kind];
  if (d.axis === 'x') fillBox(w, d.x0, d.y0, d.z0 - 1, d.x1, d.y1 + 1, d.z1 + 1, f);
  else fillBox(w, d.x0 - 1, d.y0, d.z0, d.x1 + 1, d.y1 + 1, d.z1, f);
  fillBox(w, d.x0, d.y0, d.z0, d.x1, d.y1, d.z1, AIR);
}

/** Fills a box with a material; it also clears the element layer (a carved wall holds no water). */
function fillBox(w: VoxelWorld, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: number) {
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
    if (w.inside(x, y, z)) { const i = w.idx(x, y, z); w.data[i] = m; w.elem[i] = 0; }
}
