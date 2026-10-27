// Elements as data: fire, water and lava (docs/design/ELEMENTS.md, docs/architecture/ELEMENTS.md §9).
// They live in their own layer of the world (`VoxelWorld.elem`, one byte per voxel, encoded below),
// never in the block data, so a cell holding an element is air to everything that asks `solid()`.
//
// Element byte: bits 6–7 kind (1 water, 2 lava, 3 fire), bit 5 "falling" (fluids), bits 0–3 level
// (1–8). A fluid at level 8 that is not falling is a SOURCE; fire at level 8 is eternal.

import { pal, type PalToken } from './palette';

export const EL_NONE = 0;
export const EL_WATER = 1;
export const EL_LAVA = 2;
export const EL_FIRE = 3;
export type ElementKey = 'water' | 'lava' | 'fire';

/** A source (fluids, not falling) or an eternal flame (fire): never changes on its own. */
export const SOURCE = 8;
/** Fire left on a block that just caught (it burns out a level every FIRE_DECAY seconds). */
export const CATCH_LEVEL = 6;

export interface ElementDef {
  id: number;
  key: ElementKey;
  name: string;
  /** What it stands for (docs/design/ELEMENTS.md §1, the art's meaning test). */
  concept: string;
  /** Fluids flow: `drop` levels lost per sideways step (reach = 8 / drop), every `every` ticks (10 Hz). */
  fluid?: { drop: number; every: number };
  /** Damage points per hit to an actor touching it (8 = a heart); 0 = harmless. */
  harm: number;
  /** Walking speed inside it, feet in (1 = unchanged). */
  wade: number;
  /** Head inside: you lose your footing and swim. */
  swim: boolean;
  /** Head inside drains breath (you can drown). */
  breath: boolean;
  /** Draws full-bright (it makes light; water only reflects it). */
  emissive: boolean;
  /** Ramp tokens: deep, base, hi, core. */
  ramp: [PalToken, PalToken, PalToken, PalToken];
  /** [base, dark, hi] as numbers, for particles. */
  colors: [number, number, number];
  /** Fog while the eye is inside it. */
  fog?: { color: PalToken; far: number };
}

type Def = Omit<ElementDef, 'colors'>;
const DEFS: Def[] = [
  {
    id: EL_WATER, key: 'water', name: 'Water', concept: 'emotion: shallow feelings slow you, deep ones take your footing',
    fluid: { drop: 1, every: 1 }, harm: 0, wade: 0.6, swim: true, breath: true, emissive: false,
    ramp: ['el.water.fog', 'el.water.body', 'el.water.surface', 'el.water.foam'], fog: { color: 'el.water.fog', far: 10 },
  },
  {
    id: EL_LAVA, key: 'lava', name: 'Lava', concept: 'old pain: it burns what touches it, and emotion hardens it into a boundary',
    fluid: { drop: 2, every: 3 }, harm: 8, wade: 0.4, swim: true, breath: false, emissive: true,
    ramp: ['el.lava.crust', 'el.lava.molten', 'el.lava.hot', 'el.lava.vein'], fog: { color: 'el.lava.molten', far: 3 },
  },
  {
    id: EL_FIRE, key: 'fire', name: 'Fire', concept: 'passion and anger: it clears what no longer serves you, and spreads if you are careless',
    harm: 4, wade: 1, swim: false, breath: false, emissive: true,
    ramp: ['el.fire.deep', 'el.fire.base', 'el.fire.hi', 'el.fire.core'],
  },
];

/** Index = element id (0 is "none"). */
export const ELEMENTS: (ElementDef | null)[] = [null];
for (const d of DEFS) ELEMENTS[d.id] = { ...d, colors: [pal(d.ramp[1]), pal(d.ramp[0]), pal(d.ramp[2])] };
export const ELEMENT_BY_KEY = Object.fromEntries(DEFS.map(d => [d.key, ELEMENTS[d.id]!])) as Record<ElementKey, ElementDef>;

export const FALL_BIT = 32;
export const elemByte = (kind: number, level: number, falling = false) => (kind ? (kind << 6) | (falling ? FALL_BIT : 0) | level : 0);
export const elemKind = (b: number) => b >> 6;
export const elemLevel = (b: number) => b & 15;
export const isFalling = (b: number) => (b & FALL_BIT) !== 0;
/** A fluid source or an eternal flame. */
export const isSource = (b: number) => (b & 15) === SOURCE && !(b & FALL_BIT);
export const elemDef = (b: number) => ELEMENTS[b >> 6] ?? null;
/** Height of a fluid's surface inside its cell (0–1): sources and falling columns are 7/8 full. */
export const fluidHeight = (b: number) => (isFalling(b) || (b & 15) === SOURCE ? 0.875 : Math.max(0.12, (b & 15) / 8 * 0.875));

/** Seconds per level of a fire that is not eternal. */
export const FIRE_DECAY = 0.5;
/** Chance per tick (10 Hz) that fire or lava lights a flammable block next to it. */
export const IGNITE_CHANCE: Record<'fire' | 'lava', number> = { fire: 0.08, lava: 0.2 };
/** Blocks that may catch fire per tick, everywhere (a chain of crates burns over time, never at once). */
export const IGNITE_PER_TICK = 12;

/**
 * How a projection lives with an element (`EnemyDef.elements`, docs/architecture/ELEMENTS.md §9.3):
 * `harm` multiplies the element's damage (0 = immune), `speed` its walking speed inside it,
 * `path` whether its flow field avoids the cells, walks through them, or prefers them (it lives there).
 */
export interface ElementAffinity {
  harm: number;
  speed: number;
  path: 'avoid' | 'cross' | 'dwell';
}

export const DEFAULT_AFFINITY: Record<ElementKey, ElementAffinity> = {
  water: { harm: 0, speed: 0.6, path: 'cross' },
  lava: { harm: 1, speed: 0.4, path: 'avoid' },
  fire: { harm: 1, speed: 0.8, path: 'avoid' },
};
