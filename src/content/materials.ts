// Block materials: data, not code (see docs/DESIGN.md §5). Colours are palette ramps
// (docs/art/DECISIONS.md §6.2); the atlas paints each pattern from them.

import { pal, type PalToken } from './palette';

export interface MaterialDef {
  id: number;
  key: string;
  name: string;
  tier: number;          // 0–3; Infinity = unbreakable
  hp: number;
  armor: number;         // subtracted from damage (never below 10%, see core/damage.ts)
  flammable?: boolean;
  /** You slide on it (less grip underfoot). */
  slippery?: boolean;
  heavy?: boolean;
  /** The material's ramp (docs/art/DECISIONS.md §6.2): outline, dark, base, hi. Light from the top-left. */
  ramp: [PalToken, PalToken, PalToken, PalToken];
  /** One optional accent (≤ 8 px of the tile). */
  accent?: PalToken;
  /** [base, dark, hi] as numbers, for particles and anything that needs a plain colour. */
  colors: [number, number, number];
  /** Shape grammar of its 16×16 tile (src/render/atlas.ts): shapes, never noise. */
  pattern: 'clumps' | 'grass' | 'leaves' | 'brick' | 'plates' | 'strata' | 'planks' | 'bark' | 'facets' | 'cobble' | 'earth' | 'rubble' | 'ashlar' | 'slate' | 'nuggets' | 'frame' | 'pedestal' | 'seed' | 'chest' | 'chestopen';
  /** What it stands for (the art's meaning test). */
  concept?: string;
  model?: boolean;
}

export const AIR = 0;

type Def = Omit<MaterialDef, 'colors' | 'ramp'> & { ramp: string };
const R = (prefix: string): [PalToken, PalToken, PalToken, PalToken] =>
  (['outline', 'dark', 'base', 'hi'] as const).map(k => `${prefix}.${k}` as PalToken) as [PalToken, PalToken, PalToken, PalToken];
const RAMPS: Record<string, [PalToken, PalToken, PalToken, PalToken]> = {
  dirt: R('mat.dirt'), grass: R('mat.grass'), stone: R('mat.stone'), deepstone: R('mat.deepstone'), crate: R('mat.crate'),
  obsidian: R('mat.obsidian'), bedrock: R('mat.bedrock'), rock: R('rock.f1'),
  loam: R('mat.loam'), flagstone: R('mat.flagstone'), rubble: R('mat.rubble'), wetbrick: R('mat.wetbrick'),
  ashlar: R('mat.ashlar'), slate: R('mat.slate'), darkbrick: R('mat.darkbrick'),
  brass: ['ink.line', 'brass.dark', 'brass.base', 'brass.hi'],
  limestone: ['ink.ash', 'limestone.dark', 'limestone.base', 'limestone.hi'],
  seed: ['ink.void', 'mat.seed.dark', 'mat.seed.base', 'mat.seed.hi'],
  air: ['ink.void', 'ink.void', 'ink.void', 'ink.void'],
  // ice is water held still: the water's own tokens, never the projections' cold
  ice: ['el.water.fog', 'el.water.body', 'el.water.surface', 'el.water.foam'],
};

const DEFS: Def[] = [
  { id: 0, key: 'air', name: 'Air', tier: 0, hp: 0, armor: 0, ramp: 'air', pattern: 'clumps' },
  { id: 1, key: 'dirt', name: 'Dirt', tier: 0, hp: 3, armor: 0, ramp: 'dirt', accent: 'limestone.dark', pattern: 'clumps', concept: 'a passing excuse' },
  { id: 2, key: 'grass', name: 'Grass', tier: 0, hp: 3, armor: 0, ramp: 'grass', pattern: 'grass', concept: 'surface life' },
  { id: 3, key: 'brick', name: 'Dungeon brick', tier: 1, hp: 12, armor: 0.5, ramp: 'rock', pattern: 'brick', concept: 'a habit' },
  { id: 4, key: 'stone', name: 'Stone', tier: 1, hp: 10, armor: 0.5, ramp: 'stone', pattern: 'plates', concept: 'what was always there' },
  { id: 5, key: 'deepstone', name: 'Deepstone', tier: 2, hp: 25, armor: 1.5, ramp: 'deepstone', pattern: 'strata', concept: 'an old fear' },
  { id: 6, key: 'crate', name: 'Crate', tier: 0, hp: 4, armor: 0, flammable: true, ramp: 'crate', accent: 'iron.base', pattern: 'planks', concept: 'what you stored and never opened' },
  { id: 7, key: 'obsidian', name: 'Obsidian', tier: 3, hp: 40, armor: 3, heavy: true, ramp: 'obsidian', accent: 'mat.obsidian.accent', pattern: 'facets', concept: 'a core belief' },
  { id: 8, key: 'bedrock', name: 'Bedrock', tier: Infinity, hp: Infinity, armor: 0, ramp: 'bedrock', pattern: 'cobble', concept: 'the floor of the world' },
  { id: 9, key: 'ore', name: 'Iron ore', tier: 2, hp: 18, armor: 1, heavy: true, ramp: 'stone', accent: 'copper.base', pattern: 'nuggets', concept: 'value hidden in the rock' },
  // door frames: one tier tougher than walls, telling what lies behind the door
  { id: 10, key: 'frame', name: 'Door frame', tier: 2, hp: 30, armor: 1.5, ramp: 'rock', pattern: 'frame', concept: 'a threshold' },
  { id: 11, key: 'goldframe', name: 'Brass frame', tier: 2, hp: 30, armor: 1.5, ramp: 'brass', pattern: 'frame', concept: 'a threshold to something kept' },
  { id: 12, key: 'bossframe', name: 'Obsidian frame', tier: 2, hp: 30, armor: 1.5, ramp: 'obsidian', accent: 'captive.ember', pattern: 'frame', concept: 'the oldest pattern, holding its light' },
  { id: 13, key: 'pedestal', name: 'Pedestal', tier: 3, hp: 60, armor: 3, ramp: 'limestone', pattern: 'pedestal', concept: 'where a practice waits' },
  // a bomb ('breakthrough' in the story): only ever exists as a loose cube with a fuse
  { id: 14, key: 'bomb', name: 'Breakthrough', tier: 0, hp: 1, armor: 0, ramp: 'seed', accent: 'light.ember', pattern: 'seed', concept: 'a breakthrough waiting to happen' },
  // chests: unbreakable (nothing digs, burns or blasts them); only keys, or just walking up, open them
  { id: 15, key: 'chest', name: 'Chest', tier: Infinity, hp: Infinity, armor: 0, ramp: 'crate', accent: 'brass.base', pattern: 'chest', model: true, concept: 'what you keep shut until you are ready' },
  { id: 16, key: 'chestopen', name: 'Open chest', tier: Infinity, hp: Infinity, armor: 0, ramp: 'crate', accent: 'light.gold', pattern: 'chestopen', model: true, concept: 'what was kept, given' },
  // the ninth circle and the tree (docs/architecture/LEVELS.md §8)
  { id: 17, key: 'ice', name: 'Ice', tier: 1, hp: 6, armor: 0, slippery: true, ramp: 'ice', pattern: 'facets', concept: 'a feeling frozen still' },
  { id: 18, key: 'log', name: 'Living wood', tier: 1, hp: 14, armor: 0.5, flammable: true, ramp: 'crate', accent: 'mat.grass.dark', pattern: 'bark', concept: 'the tree that holds the world' },
  { id: 19, key: 'leaves', name: 'Leaves', tier: 0, hp: 2, armor: 0, flammable: true, ramp: 'grass', pattern: 'leaves', concept: 'what grows when you rise' },
  { id: 20, key: 'starstone', name: 'Star stone', tier: 3, hp: 60, armor: 3, ramp: 'limestone', accent: 'bone.paper', pattern: 'cobble', concept: 'a fixed point to steer by' },
  // each floor builds its rooms from its own palette (src/content/levels.ts, DECISIONS §6.5), as tough as brick
  { id: 21, key: 'loam', name: 'Packed earth', tier: 1, hp: 12, armor: 0.5, ramp: 'loam', accent: 'limestone.base', pattern: 'earth', concept: 'the ground you were raised on' },
  { id: 22, key: 'flagstone', name: 'Flagstone', tier: 1, hp: 12, armor: 0.5, ramp: 'flagstone', pattern: 'plates', concept: 'a path worn by repetition' },
  { id: 23, key: 'rubble', name: 'Rubble masonry', tier: 1, hp: 12, armor: 0.5, ramp: 'rubble', pattern: 'rubble', concept: 'what the winds tore down, piled up again' },
  { id: 24, key: 'wetbrick', name: 'Wet brick', tier: 1, hp: 12, armor: 0.5, ramp: 'wetbrick', pattern: 'brick', concept: 'a habit soaked in feeling' },
  { id: 25, key: 'ashlar', name: 'Ashlar', tier: 1, hp: 12, armor: 0.5, ramp: 'ashlar', pattern: 'ashlar', concept: 'a burden cut into blocks' },
  { id: 26, key: 'slate', name: 'Slate', tier: 1, hp: 12, armor: 0.5, ramp: 'slate', pattern: 'slate', concept: 'layers of what was never said' },
  { id: 27, key: 'darkbrick', name: 'Dark brick', tier: 1, hp: 12, armor: 0.5, ramp: 'darkbrick', pattern: 'brick', concept: 'a habit gone dark' },
  // the laboratory's alembic (docs/design/not-built/practices/potions): unbreakable, placeholder look until sotano-art
  { id: 28, key: 'alembic', name: 'Alembic', tier: Infinity, hp: Infinity, armor: 0, ramp: 'brass', accent: 'light.gold', pattern: 'pedestal', model: true, concept: 'the vessel where what a pattern left is brewed' },
];

export const MATERIALS: MaterialDef[] = DEFS.map(d => {
  const ramp = RAMPS[d.ramp];
  return { ...d, ramp, colors: [pal(ramp[2]), pal(ramp[1]), pal(ramp[3])] };
});

export const MAT: Record<string, number> = Object.fromEntries(MATERIALS.map(m => [m.key, m.id]));

export const MODEL_DRAWN = Uint8Array.from({ length: 256 }, (_, i) => (MATERIALS[i]?.model ? 1 : 0));

export function mat(id: number): MaterialDef { return MATERIALS[id]; }
