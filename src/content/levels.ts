// The world's levels as data (docs/design/LEVELS.md, docs/architecture/LEVELS.md). Ten floors go
// down from the roots (0) into the unconscious, Dante's nine circles in order (1–9, the ninth
// frozen); a giant tree rises above the surface (trunk, branches, leaves; milestone L5). Silence,
// below the ninth, loops back to heaven (L4). Everything that used to read "floor k of 4" reads here.

import type { PalToken } from './palette';

export type LevelKind = 'roots' | 'tree' | 'random' | 'trunk' | 'branches' | 'leaves';

export interface LevelDef {
  /** The owner's number: 0 the roots … 9 the frozen bottom. */
  floor: number;
  key: string;
  kind: LevelKind;
  /** Dante's circle (1–9). */
  circle?: number;
  /** Rock ramp and fog (art ledger §9: four ramps for now; ten floors need an art ruling). */
  rock: 'f1' | 'f2' | 'f3' | 'f4';
  fog: PalToken;
  /** The tutorial floor: no projections, doors never lock or seal, lessons in its rooms, gentle practices only. */
  tutorial?: boolean;
  /** Highest practice quality its pedestals may hold (default: any). */
  maxQuality?: number;
  /** Does its plan keep a locked vault (a third dead end)? Deep floors don't, so the catalogue of
   *  practices lasts the whole run (review levels.md point 4). */
  vaults: boolean;
  /** Rooms in its plan. */
  plan: { minRooms: number; maxRooms: number; bossBlock?: boolean };
  /** How much more often templates bigger than one cell are chosen where they fit (× their weight). */
  bigRooms: number;
  /** What its rooms are built from (material keys): the walls and ceiling, the floor under the
   *  interior, and the trim (the `#`, `b` and `1`–`4` pieces of a template). */
  palette: { wall: string; floor: string; trim: string };
  /** Points a normal room spends on projections (a bigger room spends more per cell). */
  enemyBudget: number;
  /** The ninth circle: the water the templates carve is ice. */
  frozen?: boolean;
  /** Rock in its band: share of deepstone (`deep`) and obsidian, dirt pockets, ore veins. */
  strata: { deep: number; obsidian: number; pockets: number; ore: number };
  lava?: { layer: number; pockets: number; reach: number };
  /** The material key of its ore veins and ore blocks: the ore of its zone (ZONES). */
  ore: string;
  /** Share of its rock that is a living root, and a tuft of cave moss: what the Gardener asks for (GARDENER.md). */
  garden: { root: number; moss: number };
}

/** The five zones of the depths, each with its own ore (docs/design/built/levels/floors/README.md, owner ruling D13 on
 *  2026-11-19): the planetary metals of the old alchemists, iron for the roots and Zone I down to lead at the bottom. */
export const ZONES: readonly { zone: number; floors: readonly [number, number]; ore: string }[] = [
  { zone: 1, floors: [1, 2], ore: 'ore' },
  { zone: 2, floors: [3, 4], ore: 'copperore' },
  { zone: 3, floors: [5, 6], ore: 'tinore' },
  { zone: 4, floors: [7, 8], ore: 'quicksilverore' },
  { zone: 5, floors: [9, 9], ore: 'leadore' },
];

/** The zone of a floor (1 to 5), or 0 for the roots. */
export function zoneOf(floor: number): number {
  return ZONES.find(z => floor >= z.floors[0] && floor <= z.floors[1])?.zone ?? 0;
}

/** The ore key of a floor: its zone's ore, iron on the roots. */
export function oreOf(floor: number): string {
  return ZONES.find(z => floor >= z.floors[0] && floor <= z.floors[1])?.ore ?? 'ore';
}

/** The Gardener's root and moss in the rock: most near the surface, never none, so a Gardener on any floor can be
 *  answered from the floor it stands on. */
const gardenOf = (floor: number) => {
  const share = floor === 0 ? 0.03 : floor <= 2 ? 0.02 : floor <= 4 ? 0.015 : floor <= 6 ? 0.01 : 0.008;
  return { root: share, moss: share };
};

const L = (floor: number, key: string, kind: LevelKind, rock: LevelDef['rock'], strata: LevelDef['strata'], extra: Partial<LevelDef> = {}): LevelDef => ({
  floor, key, kind, rock, ore: oreOf(floor), garden: gardenOf(floor), fog: `fog.${rock}` as PalToken, vaults: floor <= 5, plan: { minRooms: 8, maxRooms: 11 }, bigRooms: 1, palette: { wall: 'brick', floor: 'flagstone', trim: 'brick' }, enemyBudget: Math.min(2 + Math.ceil(floor * 0.8), 9), strata, ...extra,
});

/** Underground floors, top to bottom. */
export const LEVELS: readonly LevelDef[] = [
  L(0, 'roots', 'roots', 'f1', { deep: 0, obsidian: 0, pockets: 0.45, ore: 0.04 },
    { tutorial: true, palette: { wall: 'loam', floor: 'loam', trim: 'flagstone' } }),
  L(1, 'circle1', 'tree', 'f1', { deep: 0.05, obsidian: 0, pockets: 0.15, ore: 0.07 }, { circle: 1, bigRooms: 1.5, palette: { wall: 'brick', floor: 'flagstone', trim: 'brick' } }),
  L(2, 'circle2', 'tree', 'f1', { deep: 0.15, obsidian: 0, pockets: 0.1, ore: 0.08 }, { circle: 2, bigRooms: 2, palette: { wall: 'rubble', floor: 'rubble', trim: 'brick' } }),
  L(3, 'circle3', 'tree', 'f2', { deep: 0.3, obsidian: 0.02, pockets: 0.06, ore: 0.08 }, { circle: 3, bigRooms: 2.5, palette: { wall: 'wetbrick', floor: 'ashlar', trim: 'wetbrick' } }),
  L(4, 'circle4', 'tree', 'f2', { deep: 0.45, obsidian: 0.04, pockets: 0.04, ore: 0.09 }, { circle: 4, bigRooms: 3, palette: { wall: 'ashlar', floor: 'wetbrick', trim: 'ashlar' } }),
  L(5, 'circle5', 'tree', 'f3', { deep: 0.6, obsidian: 0.06, pockets: 0.02, ore: 0.1 }, { circle: 5, bigRooms: 3, lava: { layer: 0, pockets: 1, reach: 1 }, palette: { wall: 'slate', floor: 'darkbrick', trim: 'slate' } }),
  L(6, 'circle6', 'random', 'f3', { deep: 0.75, obsidian: 0.1, pockets: 0, ore: 0.1 }, { circle: 6, bigRooms: 3, lava: { layer: 0.25, pockets: 2, reach: 2 }, palette: { wall: 'darkbrick', floor: 'slate', trim: 'darkbrick' } }),
  L(7, 'circle7', 'random', 'f4', { deep: 0.85, obsidian: 0.15, pockets: 0, ore: 0.11 }, { circle: 7, bigRooms: 3.5, lava: { layer: 0.5, pockets: 3, reach: 2 }, palette: { wall: 'darkbrick', floor: 'darkbrick', trim: 'slate' } }),
  L(8, 'circle8', 'random', 'f4', { deep: 0.9, obsidian: 0.22, pockets: 0, ore: 0.12 }, { circle: 8, bigRooms: 4, lava: { layer: 1, pockets: 4, reach: 3 }, palette: { wall: 'darkbrick', floor: 'slate', trim: 'slate' } }),
  L(9, 'circle9', 'random', 'f4', { deep: 0.9, obsidian: 0.3, pockets: 0, ore: 0.12 }, { circle: 9, bigRooms: 4, frozen: true, plan: { minRooms: 8, maxRooms: 11, bossBlock: true }, palette: { wall: 'darkbrick', floor: 'ashlar', trim: 'ashlar' } }),
];

export const FIRST_FLOOR = 0;
export const LAST_FLOOR = LEVELS.length - 1;

export function level(floor: number): LevelDef {
  return LEVELS[Math.max(FIRST_FLOOR, Math.min(LAST_FLOOR, floor))];
}

export const PRACTICE_TOLL_FROM = 5;

export interface Toll { count: number; practices: boolean }

export function tollOf(floor: number): Toll | null {
  if (floor < FIRST_FLOOR || floor >= LAST_FLOOR) return null;
  return floor < PRACTICE_TOLL_FROM
    ? { count: floor + 1, practices: false }
    : { count: floor - PRACTICE_TOLL_FROM + 1, practices: true };
}
