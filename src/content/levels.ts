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
  plan: { minRooms: number; maxRooms: number };
  /** Chance that a normal room grows into a bigger footprint (2×1 or 1×2), random floors only. */
  grow: number;
  /** Rock in its band: share of deepstone (`deep`) and obsidian, dirt pockets, ore veins. */
  strata: { deep: number; obsidian: number; pockets: number; ore: number };
}

const L = (floor: number, key: string, kind: LevelKind, rock: LevelDef['rock'], strata: LevelDef['strata'], extra: Partial<LevelDef> = {}): LevelDef => ({
  floor, key, kind, rock, fog: `fog.${rock}` as PalToken, vaults: floor <= 5, plan: { minRooms: 8, maxRooms: 11 }, grow: 0, strata, ...extra,
});

/** Underground floors, top to bottom. */
export const LEVELS: readonly LevelDef[] = [
  L(0, 'roots', 'roots', 'f1', { deep: 0, obsidian: 0, pockets: 0.45, ore: 0.04 },
    { tutorial: true, maxQuality: 3, plan: { minRooms: 10, maxRooms: 11 } }),
  L(1, 'circle1', 'tree', 'f1', { deep: 0.05, obsidian: 0, pockets: 0.15, ore: 0.07 }, { circle: 1 }),
  L(2, 'circle2', 'tree', 'f1', { deep: 0.15, obsidian: 0, pockets: 0.1, ore: 0.08 }, { circle: 2 }),
  L(3, 'circle3', 'tree', 'f2', { deep: 0.3, obsidian: 0.02, pockets: 0.06, ore: 0.08 }, { circle: 3 }),
  L(4, 'circle4', 'tree', 'f2', { deep: 0.45, obsidian: 0.04, pockets: 0.04, ore: 0.09 }, { circle: 4 }),
  L(5, 'circle5', 'tree', 'f3', { deep: 0.6, obsidian: 0.06, pockets: 0.02, ore: 0.1 }, { circle: 5 }),
  L(6, 'circle6', 'random', 'f3', { deep: 0.75, obsidian: 0.1, pockets: 0, ore: 0.1 }, { circle: 6, grow: 0.35 }),
  L(7, 'circle7', 'random', 'f4', { deep: 0.85, obsidian: 0.15, pockets: 0, ore: 0.11 }, { circle: 7, grow: 0.4 }),
  L(8, 'circle8', 'random', 'f4', { deep: 0.9, obsidian: 0.22, pockets: 0, ore: 0.12 }, { circle: 8, grow: 0.45 }),
  L(9, 'circle9', 'random', 'f4', { deep: 0.9, obsidian: 0.3, pockets: 0, ore: 0.12 }, { circle: 9, grow: 0.5 }),
];

export const FIRST_FLOOR = 0;
export const LAST_FLOOR = LEVELS.length - 1;

export function level(floor: number): LevelDef {
  return LEVELS[Math.max(FIRST_FLOOR, Math.min(LAST_FLOOR, floor))];
}
