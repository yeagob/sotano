// Block materials: data, not code (see docs/DESIGN.md §5).

export interface MaterialDef {
  id: number;
  key: string;
  name: string;
  tier: number;          // 0–3; Infinity = unbreakable
  hp: number;
  armor: number;         // subtracted from damage (never below 10%, see core/damage.ts)
  flammable?: boolean;
  heavy?: boolean;
  /** Colours for the generated pixel-art texture: [base, dark, light] (hex). */
  colors: [number, number, number];
  /** Procedural texture style. */
  pattern: 'noise' | 'brick' | 'planks' | 'speckle' | 'grass' | 'cracked';
}

export const AIR = 0;

export const MATERIALS: MaterialDef[] = [
  { id: 0, key: 'air', name: 'Air', tier: 0, hp: 0, armor: 0, colors: [0, 0, 0], pattern: 'noise' },
  { id: 1, key: 'dirt', name: 'Dirt', tier: 0, hp: 3, armor: 0, colors: [0x7a5233, 0x5e3d25, 0x8f6440], pattern: 'noise' },
  { id: 2, key: 'grass', name: 'Grass', tier: 0, hp: 3, armor: 0, colors: [0x5f9a3a, 0x4a7d2c, 0x77b24a], pattern: 'grass' },
  { id: 3, key: 'brick', name: 'Dungeon brick', tier: 1, hp: 12, armor: 0.5, colors: [0x6e6157, 0x4c423b, 0x857669], pattern: 'brick' },
  { id: 4, key: 'stone', name: 'Stone', tier: 1, hp: 10, armor: 0.5, colors: [0x7d7d80, 0x606064, 0x929296], pattern: 'speckle' },
  { id: 5, key: 'deepstone', name: 'Deepstone', tier: 2, hp: 25, armor: 1.5, colors: [0x47464f, 0x34333b, 0x5a5964], pattern: 'cracked' },
  { id: 6, key: 'crate', name: 'Crate', tier: 0, hp: 4, armor: 0, flammable: true, colors: [0xa3743e, 0x7a5228, 0xbf8c4f], pattern: 'planks' },
  { id: 7, key: 'obsidian', name: 'Obsidian', tier: 3, hp: 40, armor: 3, heavy: true, colors: [0x241a33, 0x150f20, 0x3b2b55], pattern: 'speckle' },
  { id: 8, key: 'bedrock', name: 'Bedrock', tier: Infinity, hp: Infinity, armor: 0, colors: [0x2b2b2b, 0x161616, 0x484848], pattern: 'cracked' },
  { id: 9, key: 'ore', name: 'Iron ore', tier: 2, hp: 18, armor: 1, heavy: true, colors: [0x7d7d80, 0x606064, 0xd8a77a], pattern: 'speckle' },
];

export const MAT: Record<string, number> = Object.fromEntries(MATERIALS.map(m => [m.key, m.id]));

export function mat(id: number): MaterialDef { return MATERIALS[id]; }
