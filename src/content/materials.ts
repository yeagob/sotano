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
  pattern: 'clumps' | 'grass' | 'leaves' | 'brick' | 'plates' | 'strata' | 'planks' | 'bark' | 'rootbark' | 'platebark' | 'facets' | 'cobble' | 'earth' | 'rubble' | 'ashlar' | 'slate' | 'nuggets' | 'frame' | 'pedestal' | 'seed' | 'chest' | 'chestopen'
    // the sky's own (docs/art/sky/blocks.md)
    | 'cloud' | 'mist' | 'heartwood' | 'branch' | 'skyleaf' | 'bamboo' | 'moss' | 'fence' | 'resin' | 'tektite' | 'glass' | 'seal';
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
  // the giant tree (issue #12)
  rootbark: R('mat.rootbark'), oldbark: R('mat.oldbark'), bough: R('mat.bough'), leaf: R('mat.leaf'), youngleaf: R('mat.youngleaf'),
  // the sky (palette part sky-blocks)
  cloud: R('mat.cloud'), skywood: R('mat.skywood'), heartwood: R('mat.heartwood'), skyleaf: R('mat.skyleaf'),
  bamboo: R('mat.bamboo'), moss: R('mat.moss'), palestone: R('mat.palestone'), fencewood: R('mat.fencewood'),
  mist: R('mat.mist'), starresin: R('mat.starresin'), meteorglass: R('mat.meteorglass'), solarglass: R('mat.solarglass'),
  sunseal: R('mat.sunseal'),
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
  // a bomb: only ever exists as a loose cube with a fuse
  { id: 14, key: 'bomb', name: 'Bomb', tier: 0, hp: 1, armor: 0, ramp: 'seed', accent: 'light.ember', pattern: 'seed', concept: 'a bomb waiting to happen' },
  // chests: unbreakable (nothing digs, burns or blasts them); only keys, or just walking up, open them
  { id: 15, key: 'chest', name: 'Chest', tier: Infinity, hp: Infinity, armor: 0, ramp: 'crate', accent: 'brass.base', pattern: 'chest', model: true, concept: 'what you keep shut until you are ready' },
  { id: 16, key: 'chestopen', name: 'Open chest', tier: Infinity, hp: Infinity, armor: 0, ramp: 'crate', accent: 'light.gold', pattern: 'chestopen', model: true, concept: 'what was kept, given' },
  // the ninth circle and the tree (docs/architecture/LEVELS.md §8)
  { id: 17, key: 'ice', name: 'Ice', tier: 1, hp: 6, armor: 0, slippery: true, ramp: 'ice', pattern: 'facets', concept: 'a feeling frozen still' },
  { id: 18, key: 'log', name: 'Living wood', tier: 1, hp: 14, armor: 0.5, flammable: true, ramp: 'crate', accent: 'mat.grass.dark', pattern: 'bark', concept: 'the tree that holds the world' },
  { id: 19, key: 'leaves', name: 'Leaves', tier: 0, hp: 2, armor: 0, flammable: true, ramp: 'leaf', pattern: 'leaves', concept: 'what grows when you rise' },
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
  // the kitchen (docs/design/built/laboratory): unbreakable, drawn by a model, placeholder until the art branch
  { id: 29, key: 'kitchen', name: 'Kitchen', tier: Infinity, hp: Infinity, armor: 0, ramp: 'brass', accent: 'light.gold', pattern: 'pedestal', model: true, concept: 'the fire where what a pattern left is cooked into a meal' },
  // the sky realm (docs/architecture/SKY.md §11, docs/art/sky/blocks.md): as tough as brick so breaking feels
  // the same, none flammable; heartwood and the sun seal are unbreakable
  { id: 30, key: 'cloud', name: 'Cloud', tier: 1, hp: 12, armor: 0.5, ramp: 'cloud', pattern: 'cloud', concept: 'what holds you up once you stop holding on' },
  { id: 31, key: 'skywood', name: 'Sky wood', tier: 1, hp: 12, armor: 0.5, ramp: 'skywood', pattern: 'branch', concept: 'a branch reaching for the light' },
  { id: 32, key: 'heartwood', name: 'Heartwood', tier: Infinity, hp: Infinity, armor: 0, ramp: 'heartwood', pattern: 'heartwood', concept: 'the heart of the tree: what in you does not break' },
  { id: 33, key: 'skyleaf', name: 'Sky leaf', tier: 1, hp: 12, armor: 0.5, ramp: 'skyleaf', pattern: 'skyleaf', concept: 'what grows high, where the light is' },
  { id: 34, key: 'bamboo', name: 'Bamboo', tier: 1, hp: 12, armor: 0.5, ramp: 'bamboo', pattern: 'bamboo', concept: 'what bends and does not break, and keeps rising' },
  { id: 35, key: 'moss', name: 'Moss', tier: 1, hp: 12, armor: 0.5, ramp: 'moss', pattern: 'moss', concept: 'the patience that softens every fall' },
  { id: 36, key: 'palestone', name: 'Pale stone', tier: 1, hp: 12, armor: 0.5, ramp: 'palestone', pattern: 'plates', concept: 'old ground warmed by the sun' },
  { id: 37, key: 'fencewood', name: 'Fence wood', tier: 1, hp: 12, armor: 0.5, ramp: 'fencewood', pattern: 'fence', concept: 'a boundary kept with care' },
  { id: 38, key: 'mist', name: 'Mist', tier: 1, hp: 12, armor: 0.5, ramp: 'mist', pattern: 'mist', concept: 'a step that holds only while you trust it' },
  { id: 39, key: 'starresin', name: 'Star resin', tier: 1, hp: 12, armor: 0.5, ramp: 'starresin', accent: 'bone.paper', pattern: 'resin', concept: 'starlight held still long enough to stand on' },
  { id: 40, key: 'meteorglass', name: 'Meteor glass', tier: 1, hp: 12, armor: 0.5, ramp: 'meteorglass', pattern: 'tektite', concept: 'what fell burning and came out clear' },
  { id: 41, key: 'solarglass', name: 'Solar glass', tier: 1, hp: 12, armor: 0.5, ramp: 'solarglass', pattern: 'glass', concept: 'what the heat of the Sun made clear' },
  { id: 42, key: 'sunseal', name: 'Sun seal', tier: Infinity, hp: Infinity, armor: 0, ramp: 'sunseal', pattern: 'seal', concept: 'the Sun, not open yet' },
  // the giant tree's own wood and leaves (docs/design/built/levels/giant-tree/BARK.md, issue #12): as tough
  // as living wood (or leaves), and they burn like it; only the look changes with height
  { id: 43, key: 'bough', name: 'Bough', tier: 1, hp: 14, armor: 0.5, flammable: true, ramp: 'bough', pattern: 'branch', concept: 'what you reach out with, toward the others' },
  { id: 44, key: 'rootbark', name: 'Root bark', tier: 1, hp: 14, armor: 0.5, flammable: true, ramp: 'rootbark', accent: 'mat.grass.dark', pattern: 'rootbark', concept: 'what holds on below, where it all began' },
  { id: 45, key: 'oldbark', name: 'Old bark', tier: 1, hp: 14, armor: 0.5, flammable: true, ramp: 'oldbark', accent: 'limestone.base', pattern: 'platebark', concept: 'what the years weathered and did not break' },
  { id: 46, key: 'youngleaf', name: 'Young leaves', tier: 0, hp: 2, armor: 0, flammable: true, ramp: 'youngleaf', pattern: 'leaves', concept: 'what is new in you, still soft' },
];

export const MATERIALS: MaterialDef[] = DEFS.map(d => {
  const ramp = RAMPS[d.ramp];
  return { ...d, ramp, colors: [pal(ramp[2]), pal(ramp[1]), pal(ramp[3])] };
});

export const MAT: Record<string, number> = Object.fromEntries(MATERIALS.map(m => [m.key, m.id]));

export const MODEL_DRAWN = Uint8Array.from({ length: 256 }, (_, i) => (MATERIALS[i]?.model ? 1 : 0));

export function mat(id: number): MaterialDef { return MATERIALS[id]; }
