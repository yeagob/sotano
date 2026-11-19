// Palette part 'deep-matter', spread into PALETTE (docs/art/DECISIONS.md §6.7). The presences' materials
// (D13, issue #149/#228): the Gardener's living root and cave moss, and the veins of the zones' ores that the
// Cartographer charts with. Root and moss are world matter (OKL ≤ 0.62, chroma ≤ 0.06); the ore veins are
// bridge materials like copper (§3.7): found metal, never emissive, never gold, red, cold or a path hue.

export const DEEP_MATTER_PALETTE = {
  // Living root: pale fibrous strands over dark soil (outline, dark = the soil; base, hi = the strands).
  'mat.root.outline': '#17110C', 'mat.root.dark': '#2C2219', 'mat.root.base': '#7A6A54', 'mat.root.hi': '#928263',
  // Cave moss: low, damp blue-green mats, darker than the sky's olive moss.
  'mat.cavemoss.outline': '#0F1713', 'mat.cavemoss.dark': '#1B2920', 'mat.cavemoss.base': '#2B4031', 'mat.cavemoss.hi': '#4A6143',
  // The ores' veins (dark, base, hi), one metal per zone. Iron (Zone I) keeps the copper tokens.
  'ore.verdigris.dark': '#2A5249', 'ore.verdigris.base': '#4A8571', 'ore.verdigris.hi': '#80B69C',
  'ore.tin.dark': '#8A857B', 'ore.tin.base': '#B0AA9D', 'ore.tin.hi': '#CCC5B5',
  'ore.quicksilver.dark': '#4E5052', 'ore.quicksilver.base': '#8E9090', 'ore.quicksilver.hi': '#BABBB7',
  'ore.lead.dark': '#202228', 'ore.lead.base': '#363941', 'ore.lead.hi': '#94969A',
} as const;
