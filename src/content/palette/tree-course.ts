// Palette part 'tree-course', spread into PALETTE (docs/art/DECISIONS.md §14.7). The blocks of the six branch courses
// of the giant tree (issue #329): world matter, unlit (OKL ≤ 0.85, low chroma), never warm light, life, the attack's
// red or a path hue. Each mechanic has its own block, so a platform says what it does before you step on it.

export const TREE_COURSE_PALETTE = {
  // Raft wood: grey, weathered planks, the platforms that move (sideways and up and down), "like a boat".
  'mat.raftwood.outline': '#1A1814', 'mat.raftwood.dark': '#47423A', 'mat.raftwood.base': '#857C6C', 'mat.raftwood.hi': '#AFA591',
  // Dry leaves: brown, brittle, the platforms that give way a while after you step on them.
  'mat.dryleaf.outline': '#1C140C', 'mat.dryleaf.dark': '#3F2D1A', 'mat.dryleaf.base': '#7A5A34', 'mat.dryleaf.hi': '#A0804F',
  // Pale bough and shade bough: the two sides of the alternating pairs, told apart by value (light against dark).
  'mat.palebough.outline': '#2A261E', 'mat.palebough.dark': '#6E6550', 'mat.palebough.base': '#B5A988', 'mat.palebough.hi': '#D9CFB2',
  'mat.shadebough.outline': '#0D0B0E', 'mat.shadebough.dark': '#211C24', 'mat.shadebough.base': '#3E3444', 'mat.shadebough.hi': '#5E5266',
  // Breath leaves: pale sage, the platforms that come and go on a rhythm, like a breath.
  'mat.breathleaf.outline': '#121A16', 'mat.breathleaf.dark': '#34473C', 'mat.breathleaf.base': '#6F8C78', 'mat.breathleaf.hi': '#A3BCA6',
} as const;
