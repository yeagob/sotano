// Hand-made room templates. The floor generator picks one per room by type and may mirror it.
// Format and rules: docs/ROOMS.md.
//
// 13×7 interior (x × z), top-down, first row = north (-Z). Doors sit in the middle of each wall,
// so the three tiles in front of every door must stay walkable (the validator checks it).
//
//   .  empty                  P  player spawn (start rooms)
//   r  stone, 1 high          R  stone, 2 high
//   c  crate, 1 high          C  crates, 2 high
//   o  obsidian, 1 high       d  dirt, 1 high
//   i  iron ore, 1 high       #  brick up to the ceiling
//   T  item pedestal          K  key spot (where the floor's key may appear)
//   H  where the hole to the next floor opens (boss rooms; their T is the boss's practice,
//      revealed when the boss is overcome)
//   ?  decor slot: maybe a crate         ~  decor slot: maybe dirt, stone or ore
//   !  decor slot: ore or obsidian       (slots are rolled per room, biased by its mood:
//                                         src/content/tables/rooms.ts)
//   b  brick, 1 high                     1–4  a built terrace (brick) of that height
//   w  water, 1 deep (dug into the floor: you wade)     W  water, 2 deep (you swim)
//   l  lava, 1 deep                      L  lava, 2 deep
//   f  an eternal flame on the floor     _  a dip, 1 deep
//
// Height (docs/design/LEVELS.md, the sotano-levels skill): `height` raises the interior up to
// MAX_ROOM_H, `ceiling` shapes the extra height into a vault or a dome, and `layers` add grids of
// blocks above the floor (bridges, balconies, galleries). A room never reaches the floor above or
// below: the validator caps height and depth so rock always remains between bands.

import type { RoomType } from '../world/floorplan';
import { MAT } from './materials';

export const ROOM_W = 13;
export const ROOM_D = 7;
export const ROOM_H = 5;
/** Tallest interior a template may ask for, and the deepest a pool or pit digs below the floor.
 *  With 16-block bands and 2-block brick shells this leaves 3 layers of rock between floors. */
export const MAX_ROOM_H = 8;
export const MAX_PIT = 2;

export type CeilingShape = 'flat' | 'vault-x' | 'vault-z' | 'dome';

/** Extra blocks a grid at height `y` above the floor (1 = right on top of the floor blocks). */
export interface TemplateLayer { y: number; rows: string[] }

export interface RoomTemplate {
  id: string;
  types: RoomType[];
  /** Relative chance among templates of the same type (default 1). */
  weight?: number;
  /** May the generator mirror it on X and/or Z? (default true) */
  mirror?: boolean;
  rows: string[];
  /** The floors it may appear on, [first, last] (default: every floor). Hazards stay off the
   *  tutorial floor (0); lava begins on the third circle (docs/design/LEVELS.md). */
  floors?: [number, number];
  /** Interior height in blocks, ROOM_H (default) to MAX_ROOM_H. */
  height?: number;
  /** How the height above ROOM_H is shaped (default 'flat'): a barrel vault running along X or Z, or a dome. */
  ceiling?: CeilingShape;
  /** Grids of single blocks above the floor: bridges, balconies, galleries. */
  layers?: TemplateLayer[];
}

export const ROOM_TEMPLATES: RoomTemplate[] = [
  // ── start ──
  {
    id: 'entrance', types: ['start'], rows: [
      'c...........c',
      '.............',
      '.............',
      '......P......',
      '.............',
      '.............',
      'c...........c',
    ],
  },
  {
    id: 'hall', types: ['start'], rows: [
      '?...........?',
      '.............',
      '.~.........~.',
      '......P......',
      '.~.........~.',
      '.............',
      '?...........?',
    ],
  },
  // ── normal ──
  {
    id: 'pillars', types: ['normal'], rows: [
      '.............',
      '..R.......R..',
      '.............',
      '.....r.r.....',
      '.............',
      '..R.......R..',
      '.............',
    ],
  },
  {
    id: 'crates', types: ['normal'], rows: [
      'cc.........cc',
      'c...........c',
      '.....ddd.....',
      '....d.K.d....',
      '.....ddd.....',
      'c...........c',
      'cc.........cc',
    ],
  },
  {
    id: 'quarry', types: ['normal'], rows: [
      '.............',
      '.ii.......oo.',
      '.iRR.....Roo.',
      '..R...K...R..',
      '.dRR.....RRd.',
      '.dd.......dd.',
      '.............',
    ],
  },
  {
    id: 'split', types: ['normal'], rows: [
      '.............',
      '.............',
      '..####.####..',
      '.............',
      '..####.####..',
      '.............',
      '.............',
    ],
  },
  {
    id: 'storeroom', types: ['normal'], rows: [
      '.............',
      '.c.c.c.c.c.c.',
      '.............',
      '.C....K....C.',
      '.............',
      '.c.c.c.c.c.c.',
      '.............',
    ],
  },
  {
    id: 'garden', types: ['normal'], rows: [
      '.?.~.....~.?.',
      '..~?.....?~..',
      '.....!.!.....',
      '.~....K....~.',
      '.....!.!.....',
      '..~?.....?~..',
      '.?.~.....~.?.',
    ],
  },
  {
    id: 'rubble', types: ['normal'], rows: [
      '??.~.....~.??',
      '?~~.......~~?',
      '.~..R...R..~.',
      '...?.....?...',
      '.~..R...R..~.',
      '?~~.......~~?',
      '??.~.....~.??',
    ],
  },
  {
    id: 'veins', types: ['normal'], rows: [
      '!...........!',
      '.!!.~...~.!!.',
      '...~.....~...',
      '.#.........#.',
      '...~.....~...',
      '.!!.~...~.!!.',
      '!...........!',
    ],
  },
  {
    id: 'checker', types: ['normal'], rows: [
      '.?.?.....?.?.',
      '?.?.?.?.?.?.?',
      '.?.?.?.?.?.?.',
      '..?.?...?.?..',
      '.?.?.?.?.?.?.',
      '?.?.?.?.?.?.?',
      '.?.?.....?.?.',
    ],
  },
  {
    id: 'ring', types: ['normal'], rows: [
      '.............',
      '..~~~~.~~~~..',
      '.~.........~.',
      '.~...R.R...~.',
      '.~.........~.',
      '..~~~~.~~~~..',
      '.............',
    ],
  },
  {
    id: 'colonnade', types: ['normal'], rows: [
      '.#.?.....?.#.',
      '.#.........#.',
      '...C.....C...',
      '..!...K...!..',
      '...C.....C...',
      '.#.........#.',
      '.#.?.....?.#.',
    ],
  },
  // ── treasure ──
  {
    id: 'shrine', types: ['treasure'], rows: [
      '.............',
      '.............',
      '....o...o....',
      '......T......',
      '....o...o....',
      '.............',
      '.............',
    ],
  },
  {
    id: 'altar', types: ['treasure'], rows: [
      'R...........R',
      '.............',
      '.....r.r.....',
      '......T......',
      '.....r.r.....',
      '.............',
      'R...........R',
    ],
  },
  {
    id: 'nook', types: ['treasure'], rows: [
      '.............',
      '..!.......!..',
      '....~...~....',
      '......T......',
      '....~...~....',
      '..!.......!..',
      '.............',
    ],
  },
  // ── boss ──
  {
    id: 'arena', types: ['boss'], rows: [
      '.............',
      '.R....T....R.',
      '.............',
      '......H......',
      '.............',
      '.R.........R.',
      '.............',
    ],
  },
  {
    id: 'pit', types: ['boss'], rows: [
      '.?.........?.',
      '..R...T...R..',
      '....r...r....',
      '......H......',
      '....r...r....',
      '..R.......R..',
      '.?.........?.',
    ],
  },
  // ── vault ──
  {
    id: 'cache', types: ['vault'], rows: [
      'C...........C',
      '.............',
      '..c.......c..',
      '......T......',
      '..c.......c..',
      '.............',
      'C...........C',
    ],
  },
  // ── element rooms: water, fire and lava as the protagonists (docs/design/LEVELS.md §4) ──
  {
    // a flooded hall under a barrel vault: deep water on both sides of a causeway, a gallery on
    // each side over the water, reached by brick steps in the corners
    id: 'cistern', floors: [1, 9], types: ['normal'], height: 8, ceiling: 'vault-x', rows: [
      '12.........21',
      '.WWWW...WWWW.',
      '.WWWW...WWWW.',
      '.WWWW.K.WWWW.',
      '.WWWW...WWWW.',
      '.WWWW...WWWW.',
      '12.........21',
    ],
    layers: [{
      y: 2, rows: [
        '..bbb...bbb..',
        '..bbb...bbb..',
        '.............',
        '.............',
        '.............',
        '..bbb...bbb..',
        '..bbb...bbb..',
      ],
    }],
  },
  {
    // a hall of eternal flames in rows: the way through is between them; crates wait in the
    // corners, close enough to kick into the fire
    id: 'hearth', floors: [2, 9], types: ['normal'], height: 6, ceiling: 'vault-z', rows: [
      'C...........C',
      '..f.f...f.f..',
      '.............',
      '..f..r.r..f..',
      '.............',
      '..f.f...f.f..',
      'C...........C',
    ],
  },
  {
    // an island ringed by a lava moat, four ways across, under a dome
    id: 'moat', floors: [3, 9], types: ['normal'], height: 7, ceiling: 'dome', rows: [
      '.............',
      '.LLLLL.LLLLL.',
      '.L.........L.',
      '...o..K..o...',
      '.L.........L.',
      '.LLLLL.LLLLL.',
      '.............',
    ],
  },
  {
    // water and lava kept apart by a single wall of obsidian: break it (or flood it) and
    // emotion meets old pain
    id: 'steam', floors: [3, 9], types: ['normal'], height: 6, rows: [
      '.............',
      '.wwww.o.LLLL.',
      '.wwww.o.LLLL.',
      '.............',
      '.wwww.o.LLLL.',
      '.wwww.o.LLLL.',
      '.............',
    ],
  },
  {
    // an amphitheatre: brick tiers climb into the four corners around a ring of shallow water;
    // flames burn on the top tier
    id: 'terraces', floors: [1, 9], types: ['normal'], height: 8, rows: [
      '4321.....1234',
      '321.......123',
      '.1...www...1.',
      '....ww.ww....',
      '.1...www...1.',
      '321.......123',
      '4321.....1234',
    ],
    layers: [{
      y: 4, rows: [
        'f...........f',
        '.............',
        '.............',
        '.............',
        '.............',
        '.............',
        'f...........f',
      ],
    }],
  },
  {
    // a cross of shallow water under a dome, braziers burning on four pillars
    id: 'font', floors: [1, 9], types: ['normal'], height: 8, ceiling: 'dome', rows: [
      '.............',
      '..2...w...2..',
      '......w......',
      '.wwww...wwww.',
      '......w......',
      '..2...w...2..',
      '.............',
    ],
    layers: [{
      y: 2, rows: [
        '.............',
        '..f.......f..',
        '.............',
        '.............',
        '.............',
        '..f.......f..',
        '.............',
      ],
    }],
  },
  {
    // a bridge over a flooded floor: deep water from wall to wall, a brick bridge one step up
    // with stairs at both ends, and a dry centre where the projections gather
    id: 'crossing', floors: [1, 9], types: ['normal'], height: 7, ceiling: 'vault-z', rows: [
      '.............',
      '.WWWWW.WWWWW.',
      '.WWWW...WWWW.',
      '..1WW.K.WW1..',
      '.WWWW...WWWW.',
      '.WWWWW.WWWWW.',
      '.............',
    ],
    layers: [{
      y: 1, rows: [
        '.............',
        '.............',
        '.............',
        '...bb...bb...',
        '.............',
        '.............',
        '.............',
      ],
    }],
  },
  // ── element treasure, vault, boss and start rooms ──
  {
    // the practice waits on an island of dry stone inside a ring of shallow water
    id: 'spring', types: ['treasure'], height: 7, ceiling: 'dome', rows: [
      '.............',
      '...wwwwwww...',
      '..ww.....ww..',
      '..w...T...w..',
      '..ww.....ww..',
      '...wwwwwww...',
      '.............',
    ],
  },
  {
    // a kept room: braziers on four pillars, lava in the corners, the practice in the middle
    id: 'reliquary', floors: [3, 9], types: ['vault'], height: 7, ceiling: 'vault-x', rows: [
      'll.........ll',
      'l..2.....2..l',
      '.............',
      '......T......',
      '.............',
      'l..2.....2..l',
      'll.........ll',
    ],
    layers: [{
      y: 2, rows: [
        '.............',
        '...f.....f...',
        '.............',
        '.............',
        '.............',
        '...f.....f...',
        '.............',
      ],
    }],
  },
  {
    // the boss's room as a caldera: lava pools around the arena, braziers on pillars
    id: 'caldera', floors: [3, 9], types: ['boss'], height: 8, ceiling: 'dome', rows: [
      'LLL.......LLL',
      'LL.2..T..2.LL',
      '.............',
      '......H......',
      '.............',
      'LL.2.....2.LL',
      'LLL.......LLL',
    ],
    layers: [{
      y: 2, rows: [
        '.............',
        '...f.....f...',
        '.............',
        '.............',
        '.............',
        '...f.....f...',
        '.............',
      ],
    }],
  },
  {
    // a gentle start: shallow pools to learn wading, under a high vault
    id: 'well', types: ['start'], height: 7, ceiling: 'vault-x', rows: [
      'ww.........ww',
      'w...........w',
      '.............',
      '......P......',
      '.............',
      'w...........w',
      'ww.........ww',
    ],
  },
];

/** Solid stacks per character: material and height in blocks. */
export const CELL_STACK: Record<string, { m: number; h: number }> = {
  r: { m: MAT.stone, h: 1 }, R: { m: MAT.stone, h: 2 },
  c: { m: MAT.crate, h: 1 }, C: { m: MAT.crate, h: 2 },
  o: { m: MAT.obsidian, h: 1 }, d: { m: MAT.dirt, h: 1 },
  i: { m: MAT.ore, h: 1 }, '#': { m: MAT.brick, h: ROOM_H },
  b: { m: MAT.brick, h: 1 },
  1: { m: MAT.brick, h: 1 }, 2: { m: MAT.brick, h: 2 }, 3: { m: MAT.brick, h: 3 }, 4: { m: MAT.brick, h: 4 },
};

/** Element cells (docs/architecture/ELEMENTS.md §9): `depth` blocks dug below the floor and filled
 *  with a source, or an eternal flame standing on the floor (depth 0). `_` digs a dry dip. */
export const CELL_ELEMENT: Record<string, { el: 'water' | 'lava' | 'fire' | null; depth: number }> = {
  w: { el: 'water', depth: 1 }, W: { el: 'water', depth: 2 },
  l: { el: 'lava', depth: 1 }, L: { el: 'lava', depth: 2 },
  f: { el: 'fire', depth: 0 }, _: { el: null, depth: 1 },
};

/** Characters a layer may use: single blocks, a flame, or nothing. */
export const LAYER_CHARS = new Set(['.', 'r', 'c', 'o', 'd', 'i', 'b', 'f']);

/** Characters that mark something but leave the tile walkable. */
export const MARKERS = new Set(['.', 'P', 'K', 'T', 'H']);

/** Decor slots, rolled per room (src/content/tables/rooms.ts). Treated as solid by every rule. */
export const DECOR_CHARS = new Set(['?', '~', '!']);

/** Tiles in front of each door, as [col, row]. They must stay walkable. */
export const DOOR_APPROACH: Record<'N' | 'S' | 'E' | 'W', [number, number][]> = {
  N: [[5, 0], [6, 0], [7, 0]],
  S: [[5, 6], [6, 6], [7, 6]],
  W: [[0, 2], [0, 3], [0, 4]],
  E: [[12, 2], [12, 3], [12, 4]],
};

const REQUIRED: Partial<Record<RoomType, string[]>> = { start: ['P'], treasure: ['T'], vault: ['T'], boss: ['H', 'T'] };

export function validateTemplate(t: RoomTemplate): string[] {
  const errs: string[] = [];
  if (t.rows.length !== ROOM_D) errs.push(`${t.id}: ${t.rows.length} rows (expected ${ROOM_D})`);
  t.rows.forEach((r, i) => {
    if (r.length !== ROOM_W) errs.push(`${t.id}: row ${i} is ${r.length} wide (expected ${ROOM_W})`);
    for (const ch of r) if (!MARKERS.has(ch) && !CELL_STACK[ch] && !DECOR_CHARS.has(ch) && !CELL_ELEMENT[ch]) errs.push(`${t.id}: unknown character "${ch}"`);
  });
  for (const [side, tiles] of Object.entries(DOOR_APPROACH)) {
    for (const [c, r] of tiles) {
      const ch = t.rows[r]?.[c];
      if (ch !== undefined && !MARKERS.has(ch)) errs.push(`${t.id}: tile ${c},${r} in front of the ${side} door is blocked ("${ch}")`);
    }
  }
  const all = t.rows.join('');
  for (const type of t.types) {
    for (const need of REQUIRED[type] ?? []) if (!all.includes(need)) errs.push(`${t.id}: ${type} rooms need a "${need}"`);
  }
  for (const mark of ['P', 'T', 'H']) if (all.split(mark).length > 2) errs.push(`${t.id}: at most one "${mark}"`);
  if (all.includes('P') && (all.includes('T') || all.includes('H'))) errs.push(`${t.id}: a start room can't hold a pedestal or the hole`);
  const walk = (c: number, r: number) => MARKERS.has(t.rows[r]?.[c] ?? '#');
  // the pedestal must be reachable from at least one side (the item is taken by walking up to it)
  t.rows.forEach((r, ri) => {
    const c = r.indexOf('T');
    if (c >= 0 && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => walk(c + dc, ri + dr)))
      errs.push(`${t.id}: the pedestal can't be reached from any side`);
  });
  // projections materialise on the centre tile of normal rooms
  if (t.types.includes('normal') && !walk(6, 3)) errs.push(`${t.id}: the centre tile (6,3) must be walkable (projections spawn there)`);
  // the 2×2 shaft: from the H tile in boss rooms, onto the P tile in start rooms. It is carved at
  // +1 on each world axis, so a mirrored template reaches the other way in template space.
  const flips = t.mirror === false ? [[1, 1]] : [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  const shaft = (c: number, r: number) => flips.flatMap(([sx, sz]) => [[0, 0], [sx, 0], [0, sz], [sx, sz]].map(([dc, dr]) => [c + dc, r + dr]));
  const shaftTiles: number[][] = [];
  for (const mark of ['H', 'P']) t.rows.forEach((r, ri) => {
    const c = r.indexOf(mark);
    if (c < 0) return;
    // start rooms are never mirrored
    const tiles = mark === 'P' ? [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dc, dr]) => [c + dc, ri + dr]) : shaft(c, ri);
    shaftTiles.push(...tiles);
    if (!tiles.every(([x, z]) => walk(x, z))) errs.push(`${t.id}: the 2×2 shaft tiles at "${mark}" must be clear`);
    // the boss's pedestal never stands on the shaft (it would hang over the hole)
    if (mark === 'H' && tiles.some(([x, z]) => t.rows[z]?.[x] === 'T')) errs.push(`${t.id}: the pedestal can't stand on the 2×2 shaft`);
  });
  errs.push(...validateVolume(t, shaftTiles));
  return errs;
}

/**
 * The rules for height and elements (docs/design/LEVELS.md): rooms stay inside their band, layers
 * never block a doorway, the spawn column, the pedestal or the shaft, and nothing reacts on load
 * (water next to lava, a flame next to something that burns).
 */
function validateVolume(t: RoomTemplate, shaftTiles: number[][]): string[] {
  const errs: string[] = [];
  const h = t.height ?? ROOM_H;
  if (t.floors && !(t.floors[0] <= t.floors[1] && t.floors[0] >= 0)) errs.push(`${t.id}: floors ${t.floors.join('–')} is not a range`);
  // the tutorial floor is a friend: no fire, no lava, no deep water there
  if (!t.floors || t.floors[0] === 0) for (const ch of 'lLfW') if (t.rows.join('').includes(ch) || (t.layers ?? []).some(l => l.rows.join('').includes(ch)))
    errs.push(`${t.id}: "${ch}" can hurt: keep it off the tutorial floor (floors from 1)`);
  if (!Number.isInteger(h) || h < ROOM_H || h > MAX_ROOM_H) errs.push(`${t.id}: height ${h} (must be ${ROOM_H}–${MAX_ROOM_H}: rooms never reach the floor above)`);
  if (t.ceiling && t.ceiling !== 'flat' && h === ROOM_H) errs.push(`${t.id}: a ${t.ceiling} ceiling needs a height above ${ROOM_H}`);
  for (const ch of t.rows.join('')) if (CELL_ELEMENT[ch] && CELL_ELEMENT[ch].depth > MAX_PIT) errs.push(`${t.id}: "${ch}" digs deeper than ${MAX_PIT}`);
  // what reacts the moment the room is carved
  const at = (rows: string[], c: number, r: number) => rows[r]?.[c] ?? '#';
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const burns = new Set(['c', 'C', '?']);
  const check = (rows: string[], where: string) => rows.forEach((row, r) => [...row].forEach((ch, c) => {
    const el = CELL_ELEMENT[ch]?.el;
    for (const [dc, dr] of N4) {
      const n = at(rows, c + dc, r + dr), nel = CELL_ELEMENT[n]?.el;
      if (el === 'water' && nel === 'lava') errs.push(`${t.id}: water next to lava at ${c},${r}${where} (they would react on load)`);
      if (el === 'fire' && burns.has(n)) errs.push(`${t.id}: a flame next to something that burns at ${c},${r}${where}`);
    }
  }));
  check(t.rows, '');
  const seen = new Set<number>();
  for (const [li, layer] of (t.layers ?? []).entries()) {
    const where = ` (layer ${li})`;
    if (!Number.isInteger(layer.y) || layer.y < 1 || layer.y > h - 3) errs.push(`${t.id}: layer ${li} at y ${layer.y} (must be 1–${h - 3}: two blocks of headroom above it)`);
    if (seen.has(layer.y)) errs.push(`${t.id}: two layers at y ${layer.y}`);
    seen.add(layer.y);
    if (layer.rows.length !== ROOM_D || layer.rows.some(r => r.length !== ROOM_W)) errs.push(`${t.id}: layer ${li} must be ${ROOM_D} rows of ${ROOM_W}`);
    for (const ch of layer.rows.join('')) if (!LAYER_CHARS.has(ch)) errs.push(`${t.id}: layer ${li} can't use "${ch}"`);
    check(layer.rows, where);
    const clear = (c: number, r: number) => at(layer.rows, c, r) === '.';
    // doorways are 3 high: layers under that height keep the approach tiles free
    if (layer.y < DOOR_HEIGHT) for (const [side, tiles] of Object.entries(DOOR_APPROACH)) for (const [c, r] of tiles)
      if (!clear(c, r)) errs.push(`${t.id}: layer ${li} blocks the ${side} door at ${c},${r}`);
    // the spawn column, the pedestal (its practice floats above it) and the shaft stay open all the way up
    if (t.types.includes('normal') && layer.y < DOOR_HEIGHT && !clear(6, 3)) errs.push(`${t.id}: layer ${li} covers the centre tile (projections spawn there)`);
    t.rows.forEach((row, r) => { const c = row.indexOf('T'); if (c >= 0 && layer.y <= 3 && !clear(c, r)) errs.push(`${t.id}: layer ${li} covers the pedestal`); });
    for (const [c, r] of shaftTiles) if (!clear(c, r)) errs.push(`${t.id}: layer ${li} blocks the 2×2 shaft at ${c},${r}`);
    // a layer block must stand on something or span between supports: no floating single blocks
    layer.rows.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '.' || ch === 'f') return;
      const below = layer.y === 1 ? t.rows[r][c] : '.';
      const held = CELL_STACK[below] || N4.some(([dc, dr]) => at(layer.rows, c + dc, r + dr) !== '.' && at(layer.rows, c + dc, r + dr) !== '#');
      if (!held) errs.push(`${t.id}: layer ${li} has a lone floating block at ${c},${r}`);
    }));
    // a flame on a layer burns on top of a terrace that reaches it (a brazier on a pillar)
    layer.rows.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === 'f' && CELL_STACK[t.rows[r][c]]?.h !== layer.y) errs.push(`${t.id}: layer ${li} flame at ${c},${r} needs a terrace ${layer.y} high under it`);
    }));
  }
  return errs;
}

/** Doorways are this many blocks high (src/world/floor.ts DOOR_H). */
const DOOR_HEIGHT = 3;

/** Template cell after optional mirroring. */
export function cellAt(t: RoomTemplate, col: number, row: number, flipX: boolean, flipZ: boolean): string {
  const c = flipX ? ROOM_W - 1 - col : col;
  const r = flipZ ? ROOM_D - 1 - row : row;
  return t.rows[r][c];
}
