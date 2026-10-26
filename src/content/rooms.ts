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
//   H  where the hole to the next floor opens (boss rooms)
//   ?  decor slot: maybe a crate         ~  decor slot: maybe dirt, stone or ore
//   !  decor slot: ore or obsidian       (slots are rolled per room, biased by its mood:
//                                         src/content/tables/rooms.ts)

import type { RoomType } from '../world/floorplan';
import { MAT } from './materials';

export const ROOM_W = 13;
export const ROOM_D = 7;
export const ROOM_H = 5;

export interface RoomTemplate {
  id: string;
  types: RoomType[];
  /** Relative chance among templates of the same type (default 1). */
  weight?: number;
  /** May the generator mirror it on X and/or Z? (default true) */
  mirror?: boolean;
  rows: string[];
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
      '.R.........R.',
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
      '..R.......R..',
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
];

/** Solid stacks per character: material and height in blocks. */
export const CELL_STACK: Record<string, { m: number; h: number }> = {
  r: { m: MAT.stone, h: 1 }, R: { m: MAT.stone, h: 2 },
  c: { m: MAT.crate, h: 1 }, C: { m: MAT.crate, h: 2 },
  o: { m: MAT.obsidian, h: 1 }, d: { m: MAT.dirt, h: 1 },
  i: { m: MAT.ore, h: 1 }, '#': { m: MAT.brick, h: ROOM_H },
};

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

const REQUIRED: Partial<Record<RoomType, string>> = { start: 'P', treasure: 'T', vault: 'T', boss: 'H' };

export function validateTemplate(t: RoomTemplate): string[] {
  const errs: string[] = [];
  if (t.rows.length !== ROOM_D) errs.push(`${t.id}: ${t.rows.length} rows (expected ${ROOM_D})`);
  t.rows.forEach((r, i) => {
    if (r.length !== ROOM_W) errs.push(`${t.id}: row ${i} is ${r.length} wide (expected ${ROOM_W})`);
    for (const ch of r) if (!MARKERS.has(ch) && !CELL_STACK[ch] && !DECOR_CHARS.has(ch)) errs.push(`${t.id}: unknown character "${ch}"`);
  });
  for (const [side, tiles] of Object.entries(DOOR_APPROACH)) {
    for (const [c, r] of tiles) {
      const ch = t.rows[r]?.[c];
      if (ch !== undefined && !MARKERS.has(ch)) errs.push(`${t.id}: tile ${c},${r} in front of the ${side} door is blocked ("${ch}")`);
    }
  }
  const all = t.rows.join('');
  for (const type of t.types) {
    const need = REQUIRED[type];
    if (need && !all.includes(need)) errs.push(`${t.id}: ${type} rooms need a "${need}"`);
  }
  if ((all.match(/[PTH]/g) ?? []).length > 1) errs.push(`${t.id}: at most one of P, T, H`);
  const walk = (c: number, r: number) => MARKERS.has(t.rows[r]?.[c] ?? '#');
  // the pedestal must be reachable from at least one side (the item is taken by walking up to it)
  t.rows.forEach((r, ri) => {
    const c = r.indexOf('T');
    if (c >= 0 && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dr]) => walk(c + dc, ri + dr)))
      errs.push(`${t.id}: the pedestal can't be reached from any side`);
  });
  // projections materialise on the centre tile of normal rooms
  if (t.types.includes('normal') && !walk(6, 3)) errs.push(`${t.id}: the centre tile (6,3) must be walkable (projections spawn there)`);
  // the 2×2 shaft: from the H tile in boss rooms, onto the P tile in start rooms
  for (const mark of ['H', 'P']) t.rows.forEach((r, ri) => {
    const c = r.indexOf(mark);
    if (c >= 0 && ![[0, 0], [1, 0], [0, 1], [1, 1]].every(([dc, dr]) => walk(c + dc, ri + dr)))
      errs.push(`${t.id}: the 2×2 shaft tiles at "${mark}" must be clear`);
  });
  return errs;
}

/** Template cell after optional mirroring. */
export function cellAt(t: RoomTemplate, col: number, row: number, flipX: boolean, flipZ: boolean): string {
  const c = flipX ? ROOM_W - 1 - col : col;
  const r = flipZ ? ROOM_D - 1 - row : row;
  return t.rows[r][c];
}
