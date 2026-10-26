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
//   H  trapdoor to the next floor (boss rooms)

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
      '.............',
      '.....rTr.....',
      '.............',
      '.............',
      'R...........R',
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
    for (const ch of r) if (!MARKERS.has(ch) && !CELL_STACK[ch]) errs.push(`${t.id}: unknown character "${ch}"`);
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
  return errs;
}

/** Template cell after optional mirroring. */
export function cellAt(t: RoomTemplate, col: number, row: number, flipX: boolean, flipZ: boolean): string {
  const c = flipX ? ROOM_W - 1 - col : col;
  const r = flipZ ? ROOM_D - 1 - row : row;
  return t.rows[r][c];
}
