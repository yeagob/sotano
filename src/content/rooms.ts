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
//   X  an obsidian wall up to two blocks under the ceiling (climb over it with blocks you place)
//   =  a dry pit, 2 deep (too deep to climb out of without a block)
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
  /** The lesson this room teaches on the tutorial floor (`lesson.<key>` texts). */
  lesson?: string;
  /** A second lesson, carved on the south tablet instead of repeating the first. */
  lesson2?: string;
  /** Footprint in grid cells [east, south] (default [1, 1]): 28 × 7 for [2, 1], 13 × 16 for [1, 2].
   *  Its doors are those of its first cell (north-west); bigger templates are never mirrored. */
  size?: [number, number];
}

/** A template's size in blocks (columns, rows). */
export const templateDims = (t: RoomTemplate): [number, number] => {
  const [sx, sz] = t.size ?? [1, 1];
  return [ROOM_W * sx + 2 * (sx - 1), ROOM_D * sz + 2 * (sz - 1)];
};

/** The door approaches a template can have: a big room's doors are those of its first cell. */
export function doorApproach(t: RoomTemplate): Partial<Record<'N' | 'S' | 'E' | 'W', [number, number][]>> {
  const [sx, sz] = t.size ?? [1, 1];
  const out: Partial<Record<'N' | 'S' | 'E' | 'W', [number, number][]>> = { N: DOOR_APPROACH.N, W: DOOR_APPROACH.W };
  if (sz === 1) out.S = DOOR_APPROACH.S;
  if (sx === 1) out.E = DOOR_APPROACH.E;
  return out;
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
    id: 'pillars', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'crates', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'quarry', types: ['normal'], floors: [1, 4], rows: [
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
    // brick walls from wall to wall shut the north and south doors off: dig through
    id: 'split', types: ['normal'], floors: [1, 5], weight: 3, rows: [
      '.............',
      '#####DDD#####',
      '.............',
      '.............',
      '.............',
      '#####DDD#####',
      '.............',
    ],
  },
  {
    id: 'storeroom', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'garden', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'rubble', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'veins', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'checker', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'ring', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'colonnade', types: ['normal'], floors: [1, 4], rows: [
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
    id: 'cistern', floors: [1, 6], types: ['normal'], height: 8, ceiling: 'vault-x', rows: [
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
    id: 'terraces', floors: [1, 5], types: ['normal'], height: 8, rows: [
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
    id: 'font', floors: [1, 5], types: ['normal'], height: 8, ceiling: 'dome', rows: [
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
    id: 'crossing', floors: [1, 5], types: ['normal'], height: 7, ceiling: 'vault-z', rows: [
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
  // ── the roots (floor 0): the tutorial, one lesson per room, in the order they are reached ──
  // Door approaches: rows 0/6 columns 5–7 (north, south) and columns 0/12 rows 2–4 (west, east).
  // A room "needs building" when walking alone can't join them (walkParts): trenches three wide
  // between columns, walls between rows.
  {
    id: 'roots-hall', types: ['start'], floors: [0, 0], lesson: 'move', rows: [
      'd...........d',
      '.~.........~.',
      '.............',
      '......P......',
      '.............',
      '.~.........~.',
      'd...........d',
    ],
  },
  {
    // a wall of brick between you and the south door: break through it
    id: 'roots-dig', types: ['normal'], floors: [0, 0], lesson: 'intent', lesson2: 'polarity', weight: 3, rows: [
      '.............',
      '.............',
      '.....d.d.....',
      '......K......',
      '.............',
      '#####DDD#####',
      '.............',
    ],
  },
  {
    // a step two blocks high on each side: break a block, pick it up, place it, climb
    id: 'roots-step', types: ['normal'], floors: [0, 0], lesson: 'step', weight: 3, rows: [
      '.d.2.....2.d.',
      '...2.....2...',
      '...2.....2...',
      '...2..K..2...',
      '...2.....2...',
      '...2.....2...',
      '.d.2.....2.d.',
    ],
  },
  {
    // a trench too wide to jump and too deep to climb: drop in and build your way out
    id: 'roots-pit', types: ['normal'], floors: [0, 0], lesson: 'pit', weight: 3, rows: [
      'd.===...===.d',
      '..===...===..',
      '..===...===..',
      '..===.K.===..',
      '..===...===..',
      '..===...===..',
      'd.===...===.d',
    ],
  },
  {
    // a wide trench: bridge it, one block at a time, placed against the edge in front of you
    id: 'roots-bridge', types: ['normal'], floors: [0, 0], lesson: 'bridge', weight: 3, height: 6, rows: [
      '.====...====.',
      '.====.d.====.',
      '.====...====.',
      '.====.K.====.',
      '.====...====.',
      '.====.d.====.',
      '.====...====.',
    ],
  },
  {
    // crates in the way: kick them aside or shoot them
    id: 'roots-crates', types: ['normal'], floors: [0, 0], lesson: 'kick', rows: [
      '..c.c...c.c..',
      '.c.c.c.c.c.c.',
      '..c.c...c.c..',
      '......K......',
      '..c.c...c.c..',
      '.c.c.c.c.c.c.',
      '..c.c...c.c..',
    ],
  },
  {
    // walls of obsidian: too hard to dig with intentions; a breakthrough opens them (or climb them)
    id: 'roots-seal', types: ['normal'], floors: [0, 0], lesson: 'bomb', weight: 3, height: 6, rows: [
      '...X.....X...',
      '.d.X.....X.d.',
      '...E.....E...',
      '...E..K..E...',
      '...E.....E...',
      '.d.X.....X.d.',
      '...X.....X...',
    ],
  },
  {
    // shallow pools to wade through, and soil to build with
    id: 'roots-spring', types: ['vault'], floors: [0, 0], lesson: 'water', height: 7, ceiling: 'dome', rows: [
      'dww.......wwd',
      'ww.........ww',
      '.....www.....',
      '....w.T.w....',
      '.....www.....',
      'ww.........ww',
      'dww.......wwd',
    ],
  },
  {
    id: 'roots-gift', types: ['treasure'], floors: [0, 0], lesson: 'practice', height: 6, ceiling: 'vault-x', rows: [
      '.............',
      '..d.......d..',
      '....1...1....',
      '......T......',
      '....1...1....',
      '..d.......d..',
      '.............',
    ],
  },
  {
    id: 'roots-door', types: ['boss'], floors: [0, 0], lesson: 'down', height: 7, ceiling: 'dome', rows: [
      '.............',
      '..d...T...d..',
      '.............',
      '......H......',
      '.............',
      '..d.......d..',
      '.............',
    ],
  },
  // ── paths of the Tree (floors 1–5): corridors between emanations, most of them built across ──
  {
    // two dry trenches cut the path: east and west are islands until you bridge them
    id: 'path-trench', types: ['path', 'normal'], floors: [1, 9], weight: 3, rows: [
      '.d===...===d.',
      '..===...===..',
      '..===...===..',
      '..===.K.===..',
      '..===...===..',
      '..===...===..',
      '.d===...===d.',
    ],
  },
  {
    // obsidian walls shut the north and south doors off: over them, or through them with a breakthrough
    id: 'path-wall', types: ['path', 'normal'], floors: [1, 9], weight: 3, height: 7, rows: [
      '.d.........d.',
      'XXXXXEEEXXXXX',
      '.............',
      '......K......',
      '.............',
      'XXXXXEEEXXXXX',
      '.d.........d.',
    ],
  },
  {
    // a brick bridge over lava, broken in the middle: finish it
    id: 'path-span', types: ['path', 'normal'], floors: [3, 9], weight: 3, height: 7, ceiling: 'vault-z', rows: [
      '.LLLL...LLLL.',
      '.LLLL...LLLL.',
      '.LLLL...LLLL.',
      '.1LLL.K.LLL1.',
      '.LLLL...LLLL.',
      '.LLLL...LLLL.',
      '.LLLL...LLLL.',
    ],
    layers: [{ y: 1, rows: ['.............', '.............', '.............', '..bb.....bb..', '.............', '.............', '.............'] }],
  },
  {
    // a ford of deep water: swim it, or build stepping stones
    id: 'path-ford', types: ['path'], floors: [1, 9], height: 6, rows: [
      '.............',
      '.WWW.WWW.WWW.',
      '.WWW.WWW.WWW.',
      '.WWW..K..WWW.',
      '.WWW.WWW.WWW.',
      '.WWW.WWW.WWW.',
      '.............',
    ],
  },
  {
    // stepping stones over embers: a lava crossing to the east and the west
    id: 'path-coals', types: ['path', 'normal'], floors: [3, 9], weight: 3, rows: [
      '.LLL.....LLL.',
      '.LLL.r.r.LLL.',
      '.LLL.....LLL.',
      '.LLL..K..LLL.',
      '.LLL.....LLL.',
      '.LLL.r.r.LLL.',
      '.LLL.....LLL.',
    ],
  },
  {
    // brick bulwarks three high at either side: build a step to get over, or dig through
    id: 'bulwarks', types: ['normal'], floors: [1, 4], weight: 3, height: 6, rows: [
      '.d.3.....3.d.',
      '...3.....3...',
      '...3.....3...',
      '...3..K..3...',
      '...3.....3...',
      '...3.....3...',
      '.d.3.....3.d.',
    ],
  },
  {
    // a sunken nave: the middle lies two blocks down; the north and south doors stand on ledges
    // you reach only by building back up
    id: 'nave', types: ['normal', 'path'], floors: [1, 5], weight: 3, height: 7, ceiling: 'vault-z', rows: [
      '.r.........r.',
      '#===========#',
      '.===========.',
      '......K......',
      '.===========.',
      '#===========#',
      '.r.........r.',
    ],
  },
  {
    // the gates of the walled city: obsidian walls shut the north and south away, a trench the east;
    // only the west is open, so every other way out is built
    id: 'gates', types: ['normal'], floors: [4, 9], weight: 3, height: 7, ceiling: 'vault-x', rows: [
      '.r.........rd',
      'XXXXXEEEXXXXX',
      '........===..',
      '......K.===..',
      '........===..',
      'XXXXXEEEXXXXX',
      '.r.........r.',
    ],
  },
  // ── big rooms (L3): footprints of two cells; their doors are those of their first cell ──
  {
    // the great pit (floor 5): the crown spreads east into a hall of still water and braziers; its
    // middle opens a 4×4 shaft into the next layer of the world
    id: 'abyss', types: ['boss'], floors: [5, 5], size: [2, 1], mirror: false, height: 8, ceiling: 'vault-x', rows: [
      '...............WW.........WW',
      '.r.........r...W...2...2...W',
      '............................',
      '......H.............T.......',
      '............................',
      '.r.........r...W...2...2...W',
      '...............WW.........WW',
    ],
    layers: [{ y: 2, rows: [
      '............................',
      '...................f...f....',
      '............................',
      '............................',
      '............................',
      '...................f...f....',
      '............................',
    ] }],
  },
  {
    // an antechamber split by a river of lava: the doors are walled off north and south, and the
    // key may wait across the river
    id: 'antechamber', types: ['normal'], floors: [6, 9], size: [2, 1], mirror: false, weight: 3, height: 7, rows: [
      '.r.........r.LLL..d......d..',
      'XXXXXXXXXXXXXLLL............',
      '.............LLL....rr......',
      '......K......LLL.....K......',
      '.............LLL....rr......',
      'XXXXXXXXXXXXXLLL............',
      '.r.........r.LLL..d......d..',
    ],
  },
  {
    // the giants' well: trenches cut the west and east doors off, and below an obsidian wall a ring
    // of pits guards whatever lies at the bottom
    id: 'giants-well', types: ['normal'], floors: [7, 9], size: [1, 2], mirror: false, weight: 3, height: 8, ceiling: 'dome', rows: [
      '.d===...===d.',
      '..===...===..',
      '..===...===..',
      '..===.K.===..',
      '..===...===..',
      '..===...===..',
      '.............',
      'XXXXXEEEXXXXX',
      '.............',
      '.d.========..',
      '...=......=..',
      '...=..K...=..',
      '...=......=..',
      '...========..',
      '.r.........r.',
      '.............',
    ],
  },
  // ── challenge rooms: three waves every time you enter (any hostile floor) ──
  {
    // an open ring with four low walls to hide behind
    id: 'gauntlet', types: ['challenge'], floors: [1, 9], height: 6, ceiling: 'dome', rows: [
      '.............',
      '..R.......R..',
      '....r...r....',
      '......K......',
      '....r...r....',
      '..R.......R..',
      '.............',
    ],
  },
  {
    // a pit in the middle: projections that fall in come back out; you can too, with a block
    id: 'colosseum', types: ['challenge'], floors: [1, 9], height: 7, ceiling: 'vault-x', rows: [
      '.r.........r.',
      '....=====....',
      '...==...==...',
      '...=..K..=...',
      '...==...==...',
      '....=====....',
      '.r.........r.',
    ],
  },
  // ── the circles (floors 1–9): themed rooms that ask to be built across ──
  {
    // limbo: grey ledges over dry trenches, nothing to hurt you, nowhere to stand still
    id: 'limbo', types: ['normal'], floors: [1, 2], weight: 3, height: 6, rows: [
      '.r===...===r.',
      '..===.r.===..',
      '..===...===..',
      '..===.K.===..',
      '..===...===..',
      '..===.r.===..',
      '.r===...===r.',
    ],
  },
  {
    // the winds: walls tall as the room, a gallery high above; the way across is up there
    id: 'gale', types: ['normal'], floors: [2, 3], weight: 3, height: 8, ceiling: 'vault-x', rows: [
      '.d.X.....X.d.',
      '...X.....X...',
      '...E.....E...',
      '...E..K..E...',
      '...E.....E...',
      '...X.....X...',
      '.d.X.....X.d.',
    ],
    layers: [{
      y: 4, rows: [
        '.............',
        '.............',
        '.............',
        '.............',
        '.............',
        '.............',
        '.............',
      ],
    }],
  },
  {
    // the rain: shallow water everywhere, walls of crates to burn or break
    id: 'downpour', types: ['normal'], floors: [3, 4], weight: 3, rows: [
      'w.w.w...w.w.w',
      'CCCCCCCCCCCCC',
      '.w.w.w.w.w.w.',
      '..w...K...w..',
      '.w.w.w.w.w.w.',
      'CCCCCCCCCCCCC',
      'w.w.w...w.w.w',
    ],
  },
  {
    // the weights: heavy walls quarter the room; every way out goes over them
    id: 'weights', types: ['normal'], floors: [4, 5], weight: 3, height: 7, rows: [
      '.d.........d.',
      'XXXXXEEEXXXXX',
      '..X.......X..',
      '..X...K...X..',
      '..X.......X..',
      'XXXXXEEEXXXXX',
      '.d.........d.',
    ],
  },
  {
    // the marsh: deep water and lava side by side, kept apart by obsidian; break it and emotion
    // turns the lava's edge to stone
    id: 'marsh', types: ['normal'], floors: [5, 6], height: 7, ceiling: 'dome', rows: [
      '.............',
      '.WWWW.o.LLLL.',
      '.WWWW.o.LLLL.',
      '.WWWW.K.LLLL.',
      '.WWWW.o.LLLL.',
      '.WWWW.o.LLLL.',
      '.............',
    ],
  },
  {
    // the tombs: rows of open graves of flame, and tomb walls between you and the north and south doors
    id: 'tombs', types: ['normal'], floors: [6, 7], weight: 3, height: 6, ceiling: 'vault-z', rows: [
      '.r.........r.',
      'XXXXXEEEXXXXX',
      '.f.f.f.f.f.f.',
      '......K......',
      '.f.f.f.f.f.f.',
      'XXXXXEEEXXXXX',
      '.r.........r.',
    ],
  },
  {
    // the river: two bands of lava from wall to wall; bridge them
    id: 'river', types: ['normal'], floors: [7, 8], weight: 3, height: 7, rows: [
      '.rLLL...LLLr.',
      '..LLL...LLL..',
      '..LLL...LLL..',
      '..LLL.K.LLL..',
      '..LLL...LLL..',
      '..LLL...LLL..',
      '.rLLL...LLLr.',
    ],
  },
  {
    // the ditches: trench after trench; one-block ledges between them
    id: 'ditches', types: ['normal'], floors: [8, 9], weight: 3, height: 6, rows: [
      '.===r....===.',
      '.===.===.===.',
      '.===.===.===.',
      '.===..K..===.',
      '.===.===.===.',
      '.===.===.===.',
      '.===.....===.',
    ],
  },
  {
    // the cold bottom: deep, still water walled in by obsidian (ice comes later)
    id: 'cocytus', types: ['normal'], floors: [9, 9], weight: 3, height: 8, ceiling: 'dome', rows: [
      'WWr.......rWW',
      'XXXXXEEEXXXXX',
      '.WWWW...WWWW.',
      '.WWW..K..WWW.',
      '.WWWW...WWWW.',
      'XXXXXEEEXXXXX',
      'WW.........WW',
    ],
  },
  {
    // a practice on an island in lava: the bridge to it is yours
    id: 'islet', types: ['treasure'], floors: [3, 9], height: 7, ceiling: 'dome', rows: [
      '.............',
      '.LLLLLLLLLLL.',
      '.LLL.....LLL.',
      '.LLL..T..LLL.',
      '.LLL.....LLL.',
      '.LLLLLLLLLLL.',
      '.............',
    ],
  },
];

/** The tutorial's lessons for its normal rooms, in the order the rooms are reached (owner: the
 *  roots teach how to play; building comes early and keeps coming). */
export const TUTORIAL_ORDER = ['intent', 'step', 'kick', 'pit', 'bridge', 'bomb'] as const;

/** Solid stacks per character: material and height in blocks. */
export const CELL_STACK: Record<string, { m: number; h: number }> = {
  r: { m: MAT.stone, h: 1 }, R: { m: MAT.stone, h: 2 },
  c: { m: MAT.crate, h: 1 }, C: { m: MAT.crate, h: 2 },
  o: { m: MAT.obsidian, h: 1 }, d: { m: MAT.dirt, h: 1 },
  i: { m: MAT.ore, h: 1 }, '#': { m: MAT.brick, h: ROOM_H },
  b: { m: MAT.brick, h: 1 },
  // X: obsidian up to two blocks under the ceiling; its real height is set when the room is carved
  X: { m: MAT.obsidian, h: ROOM_H - 2 },
  // D and E: a door-shaped plug of dirt (three blocks) set in a '#' or an 'X' wall, so a wall that
  // seals the room still shows where a door would be and gives way to the softest material
  D: { m: MAT.dirt, h: 3 }, E: { m: MAT.dirt, h: 3 },
  1: { m: MAT.brick, h: 1 }, 2: { m: MAT.brick, h: 2 }, 3: { m: MAT.brick, h: 3 }, 4: { m: MAT.brick, h: 4 },
};

/** What stands above a plug's dirt: its wall's material, and how many blocks it stops under the ceiling. */
export const CELL_PLUG: Record<string, { m: number; under: number }> = {
  D: { m: MAT.brick, under: 0 }, E: { m: MAT.obsidian, under: 2 },
};

/** Element cells (docs/architecture/ELEMENTS.md §9): `depth` blocks dug below the floor and filled
 *  with a source, or an eternal flame standing on the floor (depth 0). `_` digs a dry dip. */
export const CELL_ELEMENT: Record<string, { el: 'water' | 'lava' | 'fire' | null; depth: number }> = {
  w: { el: 'water', depth: 1 }, W: { el: 'water', depth: 2 }, '=': { el: null, depth: 2 },
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
  const [TW, TD] = templateDims(t);
  if ((t.size ?? [1, 1]).some(n => n !== 1 && n !== 2) || (t.size?.[0] === 2 && t.size?.[1] === 2)) errs.push(`${t.id}: size must be [1, 1], [2, 1] or [1, 2]`);
  if (t.size && (t.size[0] > 1 || t.size[1] > 1) && t.mirror !== false) errs.push(`${t.id}: a big template must set mirror: false (its doors are on its first cell)`);
  if (t.rows.length !== TD) errs.push(`${t.id}: ${t.rows.length} rows (expected ${TD})`);
  t.rows.forEach((r, i) => {
    if (r.length !== TW) errs.push(`${t.id}: row ${i} is ${r.length} wide (expected ${TW})`);
    for (const ch of r) if (!MARKERS.has(ch) && !CELL_STACK[ch] && !DECOR_CHARS.has(ch) && !CELL_ELEMENT[ch]) errs.push(`${t.id}: unknown character "${ch}"`);
  });
  for (const [side, tiles] of Object.entries(doorApproach(t))) {
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
  if ((t.types.includes('normal') || t.types.includes('path') || t.types.includes('challenge')) && !walk(6, 3)) errs.push(`${t.id}: the centre tile (6,3) must be walkable (projections spawn there)`);
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
  // the shaft lands on P and opens at H: both at the centre, which every flip keeps in place
  for (const mark of ['P', 'H']) t.rows.forEach((row, r) => { const c = row.indexOf(mark); if (c >= 0 && (c !== 6 || r !== 3)) errs.push(`${t.id}: "${mark}" must be at the centre (6,3)`); });
  // building puzzles never trap: you land in a start room you can walk out of, and the projections
  // materialise where they can reach at least one door
  if (t.rows.length === TD && t.rows.every(r => r.length === TW)) {
    const parts = walkParts(t);
    // a puzzle you solve by building carries its own material: soft blocks you can break and carry
    // (the room's brick walls work too, but a puzzle shouldn't send you digging into them)
    if (needsBuilding(t) && !/[dDEcCrRb1-4?~#i]/.test(t.rows.join('') + (t.layers ?? []).map(l => l.rows.join('')).join('')))
      errs.push(`${t.id}: it needs building but holds nothing to build with`);
    if (t.types.includes('start') && new Set(parts.values()).size > 1) errs.push(`${t.id}: a start room must never need building`);
    // the great pit opens 4×4 around a wide crown's H: keep that clear too
    if (t.types.includes('boss') && t.size) for (let r = 2; r <= 5; r++) for (let c = 5; c <= 8; c++)
      if (!MARKERS.has(t.rows[r]?.[c] ?? '#') || t.rows[r][c] === 'T') errs.push(`${t.id}: the great pit's 4×4 shaft (columns 5–8, rows 2–5) must be clear`);
    // the great pit's 4×4 shaft lands on the centre of a start room: keep it clear
    if (t.types.includes('start')) for (let r = 2; r <= 5; r++) for (let c = 5; c <= 8; c++)
      if (!MARKERS.has(t.rows[r]?.[c] ?? '#')) errs.push(`${t.id}: the start room's 4×4 centre (columns 5–8, rows 2–5) must be clear for the great pit`);
    const centre = parts.get('centre');
    if (centre !== undefined && !['N', 'S', 'E', 'W'].some(d => parts.get(d) === centre)) errs.push(`${t.id}: the centre must reach at least one door on foot (projections spawn there)`);
  }
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
    const [LW, LD] = templateDims(t);
    if (layer.rows.length !== LD || layer.rows.some(r => r.length !== LW)) errs.push(`${t.id}: layer ${li} must be ${LD} rows of ${LW}`);
    for (const ch of layer.rows.join('')) if (!LAYER_CHARS.has(ch)) errs.push(`${t.id}: layer ${li} can't use "${ch}"`);
    check(layer.rows, where);
    const clear = (c: number, r: number) => at(layer.rows, c, r) === '.';
    // doorways are 3 high: layers under that height keep the approach tiles free
    if (layer.y < DOOR_HEIGHT) for (const [side, tiles] of Object.entries(doorApproach(t))) for (const [c, r] of tiles!)
      if (!clear(c, r)) errs.push(`${t.id}: layer ${li} blocks the ${side} door at ${c},${r}`);
    // the spawn column, the pedestal (its practice floats above it) and the shaft stay open all the way up
    if ((t.types.includes('normal') || t.types.includes('path')) && layer.y < DOOR_HEIGHT && !clear(6, 3)) errs.push(`${t.id}: layer ${li} covers the centre tile (projections spawn there)`);
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
  const c = flipX ? t.rows[0].length - 1 - col : col;
  const r = flipZ ? t.rows.length - 1 - row : row;
  return t.rows[r][c];
}

// ───────────────────────── reachability: does a room need building? ─────────────────────────

/** Standing levels (blocks above the floor) on one tile, walking only; empty = you can't stand there. */
function standLevels(t: RoomTemplate, col: number, row: number): number[] {
  const h = t.height ?? ROOM_H;
  const ch = t.rows[row][col];
  let ground: number | null;
  const el = CELL_ELEMENT[ch];
  if (ch === '#') ground = null;
  else if (ch === 'X') ground = h - 2;
  // shallow water: you wade on its bottom; deep water: you swim at the surface and can climb out
  else if (el) ground = el.el === 'lava' || el.el === 'fire' ? null : el.el === 'water' ? (el.depth === 1 ? -1 : 0) : -el.depth;
  else if (CELL_STACK[ch]) ground = CELL_STACK[ch].h;
  else if (DECOR_CHARS.has(ch) || ch === 'T') ground = 1;
  else ground = 0;
  const out: number[] = [];
  const tops = (t.layers ?? []).filter(l => l.rows[row]?.[col] && l.rows[row][col] !== '.' && l.rows[row][col] !== 'f').map(l => l.y + 1);
  // the ground counts if there is headroom under the lowest layer block above it
  if (ground !== null && (tops.length === 0 || Math.min(...tops) - 1 - ground >= 2)) out.push(ground);
  for (const y of tops) if (y <= h - 2) out.push(y);
  return out;
}

/**
 * Which parts of a room can reach each other on foot (docs/architecture/LEVELS.md §5.2): steps of up
 * to one block, any drop, and jumps over gaps of up to two tiles to the same height or lower. Fire
 * and lava block; water is swum. Returns the part id of every key tile (door approaches, the
 * centre, markers); a room **needs building** when they are not all in one part.
 */
export function walkParts(t: RoomTemplate): Map<string, number> {
  const [W, D] = [t.rows[0].length, t.rows.length];
  const levels: number[][][] = [];
  for (let r = 0; r < D; r++) { levels.push([]); for (let c = 0; c < W; c++) levels[r].push(standLevels(t, c, r)); }
  const id = (c: number, r: number, i: number) => `${c},${r},${i}`;
  const part = new Map<string, number>();
  let next = 0;
  const maxAt = (c: number, r: number) => (levels[r]?.[c]?.length ? Math.max(...levels[r][c]) : (t.rows[r]?.[c] === '#' ? Infinity : -Infinity));
  for (let r0 = 0; r0 < D; r0++) for (let c0 = 0; c0 < W; c0++) levels[r0][c0].forEach((_, i0) => {
    if (part.has(id(c0, r0, i0))) return;
    const p = next++;
    const q: [number, number, number][] = [[c0, r0, i0]];
    part.set(id(c0, r0, i0), p);
    while (q.length) {
      const [c, r, i] = q.pop()!;
      const a = levels[r][c][i];
      // jumps clear a gap of one tile; two is too marginal to count on (review L2 point 4)
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let dist = 1; dist <= 2; dist++) {
        const nc = c + dc * dist, nr = r + dr * dist;
        if (nc < 0 || nr < 0 || nc >= W || nr >= D) break;
        // a jump (dist 2–3) needs nothing in the way taller than a step
        if (dist > 1) {
          let clear = true;
          for (let k = 1; k < dist; k++) if (maxAt(c + dc * k, r + dr * k) > a + 1) clear = false;
          if (!clear) break;
        }
        levels[nr][nc].forEach((b, j) => {
          const ok = dist === 1 ? b - a <= 1 : b <= a;
          if (!ok || part.has(id(nc, nr, j))) return;
          part.set(id(nc, nr, j), p);
          q.push([nc, nr, j]);
        });
      }
    }
  });
  // key tiles: the middle of each door approach, the centre, and the markers
  const keys = new Map<string, number>();
  const at = (name: string, c: number, r: number) => {
    const ls = levels[r][c];
    if (!ls.length) return;
    keys.set(name, part.get(id(c, r, ls.indexOf(Math.min(...ls))))!);
  };
  for (const [side, tiles] of Object.entries(doorApproach(t))) tiles!.forEach(([c, r], i) => at(i === 1 ? side : `${side}${i}`, c, r));
  if (t.types.includes('normal') || t.types.includes('path')) at('centre', 6, 3);
  t.rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'P' || ch === 'H' || ch === 'K') at(ch, c, r); }));
  // the pedestal is taken from a tile beside it: the best-placed side counts
  t.rows.forEach((row, r) => { const c = row.indexOf('T'); if (c >= 0) for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (levels[r + dr]?.[c + dc]?.length) { at('T', c + dc, r + dr); break; } });
  return keys;
}

/** True when walking alone can't join every key tile of the room: you have to break and place. */
export function needsBuilding(t: RoomTemplate): boolean {
  return new Set(walkParts(t).values()).size > 1;
}

/** A template as carved with these flips (rows and layers mirrored), for checks on real rooms. */
export function flipped(t: RoomTemplate, flipX: boolean, flipZ: boolean): RoomTemplate {
  if (!flipX && !flipZ) return t;
  const flipRows = (rows: string[]) => rows.map((_, r) => [...rows[0]].map((__, c) => cellAt({ ...t, rows }, c, r, flipX, flipZ)).join(''));
  return { ...t, rows: flipRows(t.rows), layers: t.layers?.map(l => ({ ...l, rows: flipRows(l.rows) })) };
}

const partsMemo = new Map<string, Map<string, number>>();

/**
 * Does this carved room need building between the doors it really has (and its centre)? The walk
 * check of the template as carved (its flips), restricted to the sides that got a door
 * (docs/architecture/LEVELS.md §7.3). Memoized per template and flips.
 */
export function needsBuildingIn(t: RoomTemplate, flipX: boolean, flipZ: boolean, sides: readonly string[]): boolean {
  const key = `${t.id}|${+flipX}|${+flipZ}`;
  let parts = partsMemo.get(key);
  if (!parts) partsMemo.set(key, parts = walkParts(flipped(t, flipX, flipZ)));
  const ids = new Set<number>();
  for (const [name, part] of parts) {
    const side = name.replace(/[0-9]$/, '');
    if ((side === 'N' || side === 'S' || side === 'E' || side === 'W') && !sides.includes(side)) continue;
    ids.add(part);
  }
  return ids.size > 1;
}
