// Hand-made room templates (see docs/DESIGN.md §7). 13×7 interior (x × z), top-down view;
// the first row is the -Z (north) side.
//
//   .  empty             P  player spawn (empty)
//   r  stone, 1 high     R  stone, 2 high
//   c  crate, 1 high     C  crates, 2 high
//   o  obsidian, 1 high  d  dirt, 1 high
//   i  iron ore          #  brick up to the ceiling

import { MAT } from './materials';

export const ROOM_W = 13;
export const ROOM_D = 7;
export const ROOM_H = 5;

export interface RoomTemplate { id: string; rows: string[] }

export const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'cruce',
    rows: [
      'c.....R.....c',
      '.............',
      '..r.......r..',
      '......P......',
      '..r.......r..',
      '.............',
      'C...o...d...C',
    ],
  },
  {
    id: 'columnas',
    rows: [
      '.............',
      '.#...c.c...#.',
      '.....ddd.....',
      '..i...P...i..',
      '.....ddd.....',
      '.#...C.C...#.',
      '.............',
    ],
  },
];

export const CELL_STACK: Record<string, { m: number; h: number }> = {
  r: { m: MAT.stone, h: 1 }, R: { m: MAT.stone, h: 2 },
  c: { m: MAT.crate, h: 1 }, C: { m: MAT.crate, h: 2 },
  o: { m: MAT.obsidian, h: 1 }, d: { m: MAT.dirt, h: 1 },
  i: { m: MAT.ore, h: 1 }, '#': { m: MAT.brick, h: ROOM_H },
};

export function validateTemplate(t: RoomTemplate): string[] {
  const errs: string[] = [];
  if (t.rows.length !== ROOM_D) errs.push(`${t.id}: ${t.rows.length} rows (expected ${ROOM_D})`);
  t.rows.forEach((r, i) => {
    if (r.length !== ROOM_W) errs.push(`${t.id}: row ${i} is ${r.length} wide (expected ${ROOM_W})`);
    for (const ch of r) if (ch !== '.' && ch !== 'P' && !CELL_STACK[ch]) errs.push(`${t.id}: unknown character "${ch}"`);
  });
  if (t.rows.join('').split('P').length !== 2) errs.push(`${t.id}: there must be exactly one P`);
  return errs;
}
