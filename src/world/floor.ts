// The dungeon: ten floors stacked in one voxel world, carved from floor plans and room templates.
// See docs/architecture/ROOMS.md (rooms, doors), docs/architecture/LEVELS.md (the thirteen levels)
// and docs/architecture/ENTITIES.md §2 (stacking). What each floor is: src/content/levels.ts.
//
// Vertical layout (y), floor k = 0 (the roots, top) … 9 (the frozen bottom), each on a 16-block band:
//
//  168–427    open sky: you can build up to SKY_LIMIT blocks above the grass (the tree, L5)
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

import { placePresences, type RoomPresence } from '../content/presences';
import { SANCTUARY_RADIUS } from '../content/presences/boundary';
import { AIR, MAT } from '../content/materials';
import { EL_FIRE, EL_LAVA, EL_WATER, SOURCE } from '../content/elements';
import { FIRST_FLOOR, LAST_FLOOR, level, LEVELS } from '../content/levels';
import { CELL_ELEMENT, CELL_PLUG, CELL_STACK, TUTORIAL_CELLS, cellAt, ceilingAt, DECOR_CHARS, homeAt, ROCK, ROOM_D, ROOM_H, ROOM_W, templateDims, type RoomTemplate } from '../content/rooms';
import { CHEST_LOCK, ITEM_IN_CHEST, ROOM_CHEST } from '../content/tables/chests';
import { ROCK_THEME, type RockTheme } from '../content/tables/floors';
import { CHALLENGE_ROOM, DECOR_SLOTS, REINFORCE, ROOM_MOOD, type RoomMood } from '../content/tables/rooms';
import { hash3, type Rng, type RunRandom } from '../core/rng';
import { DEFAULT_PLAN, generatePlan, OPPOSITE, sizeOf, TREE_ENTRY, TUTORIAL_LAYOUT, treeCell, treePlan, tutorialPlan, type FloorPlan, type PlanRoom, type RoomType, type Side } from './floorplan';
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
export const SKY_LIMIT = 260;
export const WORLD_SIZE = { sx: MARGIN * 2 + 2 + GRID * PITCH_X, sy: SURFACE_Y + 1 + SKY_LIMIT, sz: MARGIN * 2 + 2 + GRID * PITCH_Z };
/** Global room id = levelIndex(floor) × ROOM_ID_STRIDE + room index in that floor's plan; doors
 *  likewise. Always positive (tree floors below 0 will fit too). */
export const ROOM_ID_STRIDE = 100;
export const levelIndex = (floor: number) => floor + 4;

/** The band above floor 0: the dirt, the grass and the open sky (the tree, later). */
export const SURFACE = -1;

/** The floors that hold a laboratory: one alembic in one normal room each (potions BREWING-RULES §1). */
export const LABORATORY_FLOORS = [2, 4, 6, 8];

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
  /** Interior corner (inclusive) in world blocks of its whole space, and the floor height. */
  x0: number; y0: number; z0: number;
  /** Interior corner of its home cell (the room on the map): its doors, its centre, its tablets. */
  hx: number; hz: number;
  /** Interior height in blocks (ROOM_H unless the template asks for more; vaults rise above it). */
  height: number;
  /** Interior width (x) and depth (z) in blocks of its space: 13 × 7 for one cell, up to 28 × 16. */
  w: number; d: number;
  /** Which tiles of that box are room (1) and which the rock keeps (0), row by row. */
  open: Uint8Array;
  template: string;
  flipX: boolean; flipZ: boolean;
  /** Rolled per room: biases decor slots; 'reinforced' hardens obstacles inside. */
  mood: RoomMood;
  doors: Partial<Record<Side, number>>;
  /** Enemy ids that will spawn on the first visit (normal rooms). */
  enemies: string[];
  /** A Presence that lives here (the Gardener on floor 0, a Listener on the Tree floors). */
  presence?: RoomPresence;
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
  boss: string | null;
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
  bombs: { room: number; x: number; y: number; z: number }[];
  /** Where the hole to the next floor opens (boss room), if there is a next floor. */
  hole: { room: number; x: number; z: number; size: number; yTop: number; yBottom: number } | null;
  /** Under the last floor: the chamber of silence (L4), or null. */
  silence: { x0: number; z0: number; x1: number; z1: number; y0: number; y1: number } | null;
  /** The laboratory's alembic: two blocks side by side, from this anchor tile to the one at x + 1. Laboratory floors only, or null. */
  laboratory: { room: number; x: number; y: number; z: number } | null;
  /** The room (plan index) whose space holds each grid cell, -1 for rock: rooms may spread into
   *  empty cells around their own, which the map never shows (docs/architecture/LEVELS.md §10). */
  space: Int16Array;
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
    if (lv.tutorial) {
      plan = tutorialPlan();
    } else if (lv.kind === 'tree') {
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
    for (const r of plan.rooms) if (r.type === 'treasure' || r.type === 'vault' || r.type === 'boss') {
      const cell = lv.tutorial ? TUTORIAL_CELLS[TUTORIAL_LAYOUT[r.gz][r.gx]] : undefined;
      slots.push({ key: String(roomGid(k, r.id)), pool: lv.tutorial ? 'treasure' : r.type, maxQuality: cell ? cell.maxQuality : lv.maxQuality });
    }
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
  // the laboratory's room is drawn from the floor's own fork, before any room is carved
  const labRng = rr.fork('floor', k, 'laboratory');
  const normalRooms = plan.rooms.filter(p => p.type === 'normal');
  const labRoom = LABORATORY_FLOORS.includes(k) && !lv.tutorial && normalRooms.length ? labRng.pick(normalRooms).id : -1;
  let laboratory: FloorResult['laboratory'] = null;
  const labTiles: { x: number; y: number; z: number; room: number }[] = [];

  // 0. every room's template and flips, and the space it takes: the empty cells are shared out first
  //    from the plan and the floor's own fork, so a room's choice never depends on another room's
  const allot = allotSpace(plan, rr.fork('floor', k, 'space'));
  const space = new Int16Array(plan.grid);
  const fitted = new Map<number, { t: RoomTemplate; flipX: boolean; flipZ: boolean; layout: Rng }>();
  for (const pr of plan.rooms) {
    const layout = rr.fork('floor', k, 'room', pr.id, 'layout');
    const mirror = (t: RoomTemplate) => t.mirror !== false && pr.type !== 'start';
    const cell = lv.tutorial ? TUTORIAL_CELLS[TUTORIAL_LAYOUT[pr.gz][pr.gx]] : undefined;
    const fits = (t: RoomTemplate) => flipsThatFit(t, pr, allot, plan.w, plan.h, mirror(t)).length > 0;
    const fixed = cell && opt.templates.find(q => q.id === cell.template);
    const t = fixed || pickTemplate(opt.templates, pr.type, k, layout, pr.size, fits, lv.bigRooms);
    const flips = flipsThatFit(t, pr, allot, plan.w, plan.h, mirror(t));
    const [flipX, flipZ] = fixed ? [false, !!cell!.flipZ] : flips.length ? flips[layout.int(0, flips.length - 1)] : [false, false];
    for (const [cx, cz] of spaceCells(t, pr, flipX, flipZ)) space[cx + cz * plan.w] = pr.id;
    fitted.set(pr.id, { t, flipX, flipZ, layout });
  }
  const pal = { wall: MAT[lv.palette.wall], floor: MAT[lv.palette.floor], trim: MAT[lv.palette.trim] };

  // 1. room shells and interiors
  for (const pr of plan.rooms) {
    const { t, flipX, flipZ, layout } = fitted.get(pr.id)!;
    const [hx, hz] = roomOrigin(pr.gx, pr.gz);
    const [oc, or] = homeAt(t, flipX, flipZ);
    const x0 = hx - oc, z0 = hz - or;
    const [RW, RD] = templateDims(t);
    const height = t.height ?? ROOM_H;
    const open = (col: number, row: number) => col >= 0 && row >= 0 && col < RW && row < RD && cellAt(t, col, row, flipX, flipZ) !== ROCK;
    // the shell hugs the open tiles: two blocks of wall around each of them, the rock beyond untouched
    for (let row = -2; row < RD + 2; row++) for (let col = -2; col < RW + 2; col++) {
      if (open(col, row)) continue;
      let near = false;
      for (let dz = -2; dz <= 2 && !near; dz++) for (let dx = -2; dx <= 2 && !near; dx++) near = open(col + dx, row + dz);
      if (near) fillBox(w, x0 + col, y0 - 2, z0 + row, x0 + col, y0 + height + 1, z0 + row, pal.wall);
    }
    const fights = pr.type === 'normal' || pr.type === 'path';
    const mood: RoomMood = fights ? ROOM_MOOD.roll(layout, { floor: k })! : 'normal';
    const chestRng = rr.fork('floor', k, 'room', pr.id, 'chest');
    let openTiles = 0;
    const openMask = new Uint8Array(RW * RD);
    for (let row = 0; row < RD; row++) for (let col = 0; col < RW; col++) {
      const ch = cellAt(t, col, row, flipX, flipZ);
      if (ch === ROCK) continue;
      openTiles++;
      openMask[col + row * RW] = 1;
      const x = x0 + col, z = z0 + row;
      // the height above ROOM_H, shaped into a vault or a dome
      const top = y1 + ceilingRise(t.ceiling ?? 'flat', height - ROOM_H, col, row, RW, RD);
      fillBox(w, x, y0 - 2, z, x, y0 - 1, z, pal.floor);
      fillBox(w, x, y0, z, x, top, z, AIR);
      fillBox(w, x, top + 1, z, x, y0 + height + 1, z, pal.wall);
      const s = CELL_STACK[ch];
      if (s) {
        // built pieces take the floor's palette: '#' and a plug's upper wall are walls, the rest trim
        const built = (m: number, wall: boolean) => (m === MAT.brick ? (wall ? pal.wall : pal.trim) : m);
        const harden = (m: number) => (mood === 'reinforced' ? hardened(m) : m);
        const m = harden(built(s.m, ch === '#'));
        // '#' reaches the ceiling (whatever its height); 'X' stops two blocks under it
        const n = ch === '#' ? top - y0 + 1 : ch === 'X' ? top - y0 - 1 : s.h;
        for (let h = 0; h < n; h++) w.data[w.idx(x, y0 + h, z)] = m;
        // a plug's wall goes on above its dirt
        const plug = CELL_PLUG[ch];
        if (plug) for (let h = s.h; h < top - y0 + 1 - plug.under; h++) w.data[w.idx(x, y0 + h, z)] = harden(built(plug.m, true));
      }
      const el = CELL_ELEMENT[ch];
      if (el) carveElement(w, x, y0, z, el, !!lv.frozen, pal.floor);
      for (const layer of t.layers ?? []) {
        const lc = cellAt({ ...t, rows: layer.rows }, col, row, flipX, flipZ), ly = y0 + layer.y;
        const ls = CELL_STACK[lc];
        if (ls) {
          const m = ls.m === MAT.brick ? pal.trim : ls.m;
          w.data[w.idx(x, ly, z)] = mood === 'reinforced' ? hardened(m) : m;
        }
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
        const inChest = !boss && !lv.tutorial && chestRng.chance(ITEM_IN_CHEST);
        w.data[w.idx(x, y0, z)] = inChest ? MAT.chest : MAT.pedestal;
        if (inChest) chests.push({ room: gid(pr.id), x, y: y0, z, keys: CHEST_LOCK.roll(chestRng, { floor: k })!, item });
        pedestals.push({ room: gid(pr.id), x, y: y0 + 1, z, item, boss, chest: inChest });
      }
      if (ch === 'K') keySpots.push({ room: gid(pr.id), x, y: y0, z });
      if (ch === 'H') holeAt = [x, y0, z];
    }
    if (pr.type === 'vault' && !lv.tutorial) {
      let spots = freeSpots(t, flipX, flipZ);
      const ring = (c: number, r: number) => Math.max(Math.abs(c - (ROOM_W - 1) / 2), Math.abs(r - (ROOM_D - 1) / 2)) === SANCTUARY_RADIUS;
      for (const [c, r] of spots) if (ring(c, r)) w.data[w.idx(x0 + c, y0, z0 + r)] = MAT.pedestal;
      spots = spots.filter(([c, r]) => !ring(c, r));
      for (let i = 0; i < 2 && spots.length; i++) {
        const [col, row] = chestRng.pick(spots);
        w.data[w.idx(x0 + col, y0, z0 + row)] = MAT.chest;
        chests.push({ room: gid(pr.id), x: x0 + col, y: y0, z: z0 + row, keys: CHEST_LOCK.roll(chestRng, { floor: k })!, item: null });
        spots = spots.filter(([c, r]) => c !== col || r !== row);
      }
    }
    if (pr.type === 'normal') {
      // a free-standing chest in many rooms; the rest of the open tiles stay free for keys
      let spots = freeSpots(t, flipX, flipZ);
      for (const [c, r] of spots) labTiles.push({ x: x0 + c, y: y0, z: z0 + r, room: gid(pr.id) });
      const labPairs = spots.filter(([c, r]) => spots.some(([c2, r2]) => c2 === c + 1 && r2 === r));
      if (pr.id === labRoom && labPairs.length) {
        const [col, row] = labRng.pick(labPairs);
        w.data[w.idx(x0 + col, y0, z0 + row)] = MAT.alembic;
        w.data[w.idx(x0 + col + 1, y0, z0 + row)] = MAT.alembic;
        laboratory = { room: gid(pr.id), x: x0 + col, y: y0, z: z0 + row };
        spots = spots.filter(([c, r]) => r !== row || (c !== col && c !== col + 1));
      }
      if (spots.length && !lv.tutorial && chestRng.chance(ROOM_CHEST)) {
        const [col, row] = chestRng.pick(spots);
        w.data[w.idx(x0 + col, y0, z0 + row)] = MAT.chest;
        chests.push({ room: gid(pr.id), x: x0 + col, y: y0, z: z0 + row, keys: CHEST_LOCK.roll(chestRng, { floor: k })!, item: null });
        spots = spots.filter(([c, r]) => c !== col || r !== row);
      }
      freeByRoom.set(gid(pr.id), spots.map(([c, r]) => [x0 + c, z0 + r]));
    }
    rooms.push({
      id: gid(pr.id), floor: k, type: pr.type, gx: pr.gx, gz: pr.gz, x0, y0, z0, hx, hz, height, w: RW, d: RD, open: openMask, template: t.id, flipX, flipZ, mood, doors: {},
      // the tutorial floor is peaceful: no roster at all
      // a bigger room holds more of them (the roster budget grows with its open floor, a cell at a time)
      enemies: fights && !lv.tutorial ? opt.enemies.pick(rr.fork('floor', k, 'room', pr.id, 'roster'), k, Math.max(1, Math.round(openTiles / (ROOM_W * ROOM_D)))) : [],
      presence: pr.type === 'vault' && !lv.tutorial ? 'boundary' : undefined,
    });
  }

  placePresences(rooms, k, rr.fork('floor', k, 'presence'));

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
            x0: a.hx + ROOM_W, x1: a.hx + ROOM_W + 1, y0, y1: dy1, z0: a.hz + 2, z1: a.hz + 4 }
        : { id, rooms: [a.id, b.id], kind, locked: kind === 'vault', axis: 'z',
            x0: a.hx + 5, x1: a.hx + 7, y0, y1: dy1, z0: a.hz + ROOM_D, z1: a.hz + ROOM_D + 1 };
      carveDoorway(w, spec);
      doors.push(spec);
      a.doors[side] = id;
      b.doors[OPPOSITE[side]] = id;
    }
  }

  // 2b. every wall around a locked door is made of obsidian: very hard to break, never impossible
  for (const d of doors) if (d.locked) for (const id of d.rooms) {
    const rm = rooms.find(r => r.id === id)!;
    if (rm.type === 'vault') hardenShell(w, rm, [pal.wall, pal.floor]);
  }

  // 3. a key in a normal room if there is a locked door (prefer K spots)
  const keys: FloorResult['keys'] = [];
  const bombs: FloorResult['bombs'] = [];
  if (doors.some(d => d.locked)) {
    const normal = new Set(rooms.filter(rm => rm.type === 'normal').map(rm => rm.id));
    const spots = keySpots.filter(s => normal.has(s.room));
    if (spots.length) keys.push(keyRng.pick(spots));
    else {
      const rm = keyRng.pick(rooms.filter(x => x.type === 'normal'));
      keys.push({ room: rm.id, x: rm.hx + 6, y: y0, z: rm.hz + 3 });
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
  if (lv.tutorial) {
    const lootRng = rr.fork('floor', k, 'loot');
    const lootRooms = [...freeByRoom.keys()].filter(id => freeByRoom.get(id)!.length);
    for (const kind of ['key', 'bomb'] as const) {
      if (!lootRooms.length) continue;
      const room = lootRng.pick(lootRooms), spots = freeByRoom.get(room)!;
      const [x, z] = lootRng.pick(spots);
      (kind === 'key' ? keys : bombs).push({ room, x, y: y0, z });
      if (spots.length > 1) spots.splice(spots.findIndex(([sx, sz]) => sx === x && sz === z), 1);
    }
  }

  // 4. where the hole to the next floor will open: the boss room's H (its 2×2 shaft lands in
  //    the next floor's start room, which is generated under it)
  let hole: FloorResult['hole'] = null;
  let silence: FloorResult['silence'] = null;
  if (k === LAST_FLOOR) {
    // below the frozen bottom: silence, a sealed chamber on the bedrock under the last way down
    // (air y 1–4, a roof of rock at 5 under the floor's own slab, docs/architecture/LEVELS.md §8)
    const boss = rooms.find(rm => rm.type === 'boss')!;
    const [hx, , hz] = holeAt ?? [boss.hx + 6, y0, boss.hz + 3];
    silence = { x0: boss.x0, z0: boss.z0, x1: boss.x0 + boss.w - 1, z1: boss.z0 + boss.d - 1, y0: 1, y1: 4 };
    fillBox(w, silence.x0, 1, silence.z0, silence.x1, 4, silence.z1, AIR);
    hole = { room: boss.id, x: hx, z: hz, size: 2, yTop: y0 - 1, yBottom: 1 };
  }
  if (k < LAST_FLOOR) {
    const boss = rooms.find(rm => rm.type === 'boss')!;
    const [hx, , hz] = holeAt ?? [boss.hx + 6, y0, boss.hz + 3];
    // the great pit: a wide crown opens a 4×4 shaft centred on its own cell (it lands on the
    // centre of the start room below, whose templates keep that clear)
    const [bsx, bsz] = sizeOf(plan.rooms[boss.id % ROOM_ID_STRIDE]);
    const great = bsx * bsz > 1;
    hole = great
      ? { room: boss.id, x: hx - 1, z: hz - 1, size: 4, yTop: y0 - 1, yBottom: floorY(k + 1) + ROOM_H }
      : { room: boss.id, x: hx, z: hz, size: 2, yTop: y0 - 1, yBottom: floorY(k + 1) + ROOM_H };
  }

  for (const rm of rooms) markRoomDirty(w, rm);
  if (labRoom >= 0 && !laboratory) {
    const onOther = (t: { x: number; z: number }) =>
      keys.some(k => k.x === t.x && k.z === t.z) || bombs.some(b => b.x === t.x && b.z === t.z) || (spawn[0] === t.x + 0.5 && spawn[2] === t.z + 0.5);
    const free = labTiles.filter(t => w.get(t.x, t.y, t.z) === AIR && !onOther(t));
    const pairs = free.filter(t => free.some(u => u.x === t.x + 1 && u.z === t.z && u.y === t.y && u.room === t.room));
    if (pairs.length) {
      const t = labRng.pick(pairs);
      w.data[w.idx(t.x, t.y, t.z)] = MAT.alembic;
      w.data[w.idx(t.x + 1, t.y, t.z)] = MAT.alembic;
      laboratory = { room: t.room, x: t.x, y: t.y, z: t.z };
    }
  }
  return { floor: k, boss: null, plan, rooms, doors, spawn, pedestals, chests, keys, bombs, hole, silence, laboratory, space };
}

/**
 * A room's shell and interior from its template, at interior corner (x0, y0, z0): the brick shell,
 * the air, stacks, element cells, layers and the decor slots (rolled from `layout` in row order).
 * Returns the marker tiles (P, T, K, H) in row order, in world blocks; the caller decides what
 * they hold. Shared by the floor generator and the sandbox (docs/architecture/SANDBOX.md).
 */
export function carveInterior(w: VoxelWorld, t: RoomTemplate, x0: number, y0: number, z0: number, flipX: boolean, flipZ: boolean, mood: RoomMood, layout: Rng, k: number): { ch: string; x: number; z: number }[] {
  const RW = t.rows[0].length, RD = t.rows.length;
  const x1 = x0 + RW - 1, z1 = z0 + RD - 1, y1 = y0 + ROOM_H - 1;
  const height = t.height ?? ROOM_H;
  const frozen = !!level(k).frozen;
  const markers: { ch: string; x: number; z: number }[] = [];
  fillBox(w, x0 - 2, y0 - 2, z0 - 2, x1 + 2, y0 + height + 1, z1 + 2, MAT.brick);
  fillBox(w, x0, y0, z0, x1, y1, z1, AIR);
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
      // a plug's wall goes on above its dirt
      const plug = CELL_PLUG[ch];
      if (plug) for (let h = s.h; h < top - y0 + 1 - plug.under; h++) w.data[w.idx(x, y0 + h, z)] = mood === 'reinforced' ? hardened(plug.m) : plug.m;
    }
    const el = CELL_ELEMENT[ch];
    if (el) carveElement(w, x, y0, z, el, frozen);
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
    if ('PTKH'.includes(ch)) markers.push({ ch, x, z });
  }
  return markers;
}

/** Is (x, z) on the room's open floor plan (inside its box and not rock)? */
export function inRoomSpace(rm: RoomInfo, x: number, z: number): boolean {
  const c = Math.floor(x) - rm.x0, r = Math.floor(z) - rm.z0;
  return c >= 0 && r >= 0 && c < rm.w && r < rm.d && rm.open[c + r * rm.w] === 1;
}

/** The shell of a room (its two-block walls, floor and ceiling) turned from its palette into obsidian. */
function hardenShell(w: VoxelWorld, rm: RoomInfo, shell: number[]) {
  const x1 = rm.x0 + rm.w - 1, z1 = rm.z0 + rm.d - 1, top = rm.y0 + rm.height - 1;
  for (let z = rm.z0 - 2; z <= z1 + 2; z++) for (let y = rm.y0 - 2; y <= top + 2; y++) for (let x = rm.x0 - 2; x <= x1 + 2; x++) {
    if (x >= rm.x0 && x <= x1 && z >= rm.z0 && z <= z1 && y >= rm.y0 && y <= top) continue;
    if (!w.inside(x, y, z)) continue;
    const i = w.idx(x, y, z);
    if (shell.includes(w.data[i])) w.data[i] = MAT.obsidian;
  }
}

/** Ground tiles (col, row, after flips) where a chest or a key may lie: plain floor with clear air above,
 *  away from the home cell's door approaches, the centre where projections materialise, and the markers. */
export function freeSpots(t: RoomTemplate, flipX: boolean, flipZ: boolean): [number, number][] {
  const spots: [number, number][] = [];
  const [W, D] = templateDims(t), [oc, or] = homeAt(t, flipX, flipZ);
  const ground = (c: number, r: number) => cellAt(t, c, r, flipX, flipZ);
  for (let row = 0; row < D; row++) for (let col = 0; col < W; col++) {
    if (ground(col, row) !== '.') continue;
    const hc = col - oc, hr = row - or;
    const inHome = hc >= 0 && hr >= 0 && hc < ROOM_W && hr < ROOM_D;
    const approach = inHome && ((hr >= 2 && hr <= 4 && (hc <= 2 || hc >= ROOM_W - 3)) || (hc >= 5 && hc <= 7 && (hr <= 2 || hr >= ROOM_D - 3)));
    if (approach || (Math.abs(hc - 6) <= 1 && Math.abs(hr - 3) <= 1)) continue;
    let ok = true;
    for (let dz = -1; dz <= 1 && ok; dz++) for (let dx = -1; dx <= 1 && ok; dx++) {
      const c = col + dx, r = row + dz;
      if (c >= 0 && r >= 0 && c < W && r < D && 'PTKH'.includes(ground(c, r))) ok = false;
    }
    for (const layer of t.layers ?? []) if (ok && cellAt({ ...t, rows: layer.rows }, col, row, flipX, flipZ) !== '.') ok = false;
    if (ok) spots.push([col, row]);
  }
  return spots;
}

/** The grid cells a template takes when its home cell is `pr`'s, with these flips. */
export function spaceCells(t: RoomTemplate, pr: PlanRoom, flipX: boolean, flipZ: boolean): [number, number][] {
  const [sx, sz] = t.size ?? [1, 1], [hx, hz] = t.home ?? [0, 0];
  const ex = flipX ? sx - 1 - hx : hx, ez = flipZ ? sz - 1 - hz : hz;
  const cells: [number, number][] = [];
  for (let dz = 0; dz < sz; dz++) for (let dx = 0; dx < sx; dx++) cells.push([pr.gx - ex + dx, pr.gz - ez + dz]);
  return cells;
}

/** The flips with which a template's space fits around `pr`: every cell but its home allotted to it. */
function flipsThatFit(t: RoomTemplate, pr: PlanRoom, allot: Int16Array, gw: number, gh: number, mirror: boolean): [boolean, boolean][] {
  const all: [boolean, boolean][] = mirror ? [[false, false], [true, false], [false, true], [true, true]] : [[false, false]];
  return all.filter(([fx, fz]) => spaceCells(t, pr, fx, fz).every(([x, z]) =>
    (x === pr.gx && z === pr.gz) || (x >= 0 && z >= 0 && x < gw && z < gh && allot[x + z * gw] === pr.id)));
}

/**
 * Which room may spread into each empty cell of a floor (docs/architecture/LEVELS.md §10.1), from the
 * plan and the floor's `space` fork only: a preset footprint takes its cells; then every empty cell
 * beside a room goes to one of them; then every empty cell beside a cell given away goes to that
 * room too (so a room can grow two cells long, or round a corner). Rooms only take what fits them.
 */
export function allotSpace(plan: FloorPlan, rng: Rng): Int16Array {
  const { w, h } = plan;
  const own = new Int16Array(plan.grid);
  for (const r of plan.rooms) if (r.size) {
    const [sx, sz] = r.size;
    for (let dz = 0; dz < sz; dz++) for (let dx = 0; dx < sx; dx++) {
      const x = r.gx + dx, z = r.gz + dz;
      if (x < w && z < h && own[x + z * w] === -1) own[x + z * w] = r.id;
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const was = new Int16Array(own);
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
      if (was[x + z * w] !== -1) continue;
      const by = new Set<number>();
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue;
        const o = was[nx + nz * w], home = plan.grid[nx + nz * w] >= 0;
        if (o >= 0 && (pass === 0 ? home : !home)) by.add(o);
      }
      if (by.size) own[x + z * w] = [...by][rng.int(0, by.size - 1)];
    }
  }
  return own;
}

/** Opens the shaft (2×2, or 4×4 for the great pit) from a boss room floor down into the start room below. */
export function openHole(w: VoxelWorld, hole: NonNullable<FloorResult['hole']>) {
  for (let y = hole.yBottom; y <= hole.yTop; y++)
    for (let dz = 0; dz < hole.size; dz++) for (let dx = 0; dx < hole.size; dx++) w.set(hole.x + dx, y, hole.z + dz, AIR);
}

/** Interior size in blocks of a footprint of [cells east, cells south]: the walls between its
 *  cells become floor too (13 + 2 + 13 = 28, 43 for three; 7 + 2 + 7 = 16, 25 for three). */
export function roomDims([sx, sz]: [number, number]): [number, number] {
  return [ROOM_W * sx + 2 * (sx - 1), ROOM_D * sz + 2 * (sz - 1)];
}

function markRoomDirty(w: VoxelWorld, rm: RoomInfo) {
  for (let x = rm.x0 - 2; x <= rm.x0 + rm.w + 2; x += 8)
    for (let z = rm.z0 - 2; z <= rm.z0 + rm.d + 2; z += 8)
      for (let y = rm.y0 - 4; y <= rm.y0 + rm.height + 2; y += 4) if (w.inside(x, y, z)) { w.markDirty(x, y, z); w.markElemDirty(x, y, z); }
}

/** Extra blocks of air above ROOM_H at a tile, for a ceiling of `rise` extra blocks (`ceilingAt`). */
export const ceilingRise = ceilingAt;

const EL_ID = { water: EL_WATER, lava: EL_LAVA, fire: EL_FIRE } as const;
const elemByteOf = (kind: number) => (kind << 6) | SOURCE;

/** A pool (dug `depth` blocks into the floor and filled with a source), a dry dip, or an eternal
 *  flame on the floor. Pools 2 deep get a brick lining under them. */
function carveElement(w: VoxelWorld, x: number, y0: number, z: number, el: { el: 'water' | 'lava' | 'fire' | null; depth: number }, frozen = false, lining: number = MAT.brick) {
  for (let d = 1; d <= el.depth; d++) {
    const i = w.idx(x, y0 - d, z);
    // the ninth circle is frozen: its pools are ice (solid, slippery, breakable), never water
    // (only its surface: the water stays liquid under the ice, review levels L4–L6 point 9)
    if (frozen && el.el === 'water' && d === 1) { w.data[i] = MAT.ice; w.elem[i] = 0; continue; }
    w.data[i] = AIR;
    w.elem[i] = el.el && el.el !== 'fire' ? elemByteOf(EL_ID[el.el]) : 0;
  }
  if (el.depth >= 2) w.data[w.idx(x, y0 - el.depth - 1, z)] = lining;
  if (el.el === 'fire') w.elem[w.idx(x, y0, z)] = elemByteOf(EL_FIRE);
}

/** `own`: only the templates made for this floor (the tutorial uses its own rooms throughout).
 *  `size`: a footprint decided with the plan (the great pit's crown); only templates of that size fit it.
 *  `fits`: does a template's space fit around the room? Templates bigger than a cell weigh `big` times more. */
function pickTemplate(templates: readonly RoomTemplate[], type: RoomType, floor: number, rng: Rng, size: [number, number] | undefined, fits: (t: RoomTemplate) => boolean, big = 1): RoomTemplate {
  const cells = (t: RoomTemplate) => (t.size ?? [1, 1])[0] * (t.size ?? [1, 1])[1];
  const sized = (t: RoomTemplate) => (size ? (t.size ?? [1, 1])[0] === size[0] && (t.size ?? [1, 1])[1] === size[1] : true);
  const ofType = templates.filter(t => t.types.includes(type) && sized(t));
  const allowed = ofType.filter(t => !t.floors || (floor >= t.floors[0] && floor <= t.floors[1]));
  // a floor with no template of its own for this type borrows any (never a missing room)
  const pool = allowed.length ? allowed : ofType;
  const options = pool.filter(fits).length ? pool.filter(fits) : ofType.filter(t => cells(t) === 1);
  if (!options.length) throw new Error(`no room template for type "${type}"`);
  const weight = (t: RoomTemplate) => (t.weight ?? 1) * (cells(t) > 1 ? big : 1);
  const total = options.reduce((s, t) => s + weight(t), 0);
  let r = rng.next() * total;
  for (const t of options) { r -= weight(t); if (r <= 0) return t; }
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
