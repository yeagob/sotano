// Palette part 'sky-entity' (docs/architecture/SKY.md §11), spread into PALETTE. Owned by: EN. Rulings: docs/art/sky/entity.md.
// The Spiked Entity belongs to the depths: a near-black husk (mean L* ≤ 14), spikes a step lighter, and one faint
// cold rim (L* 41, ≥ 20 over the deepstone it stands against) so it reads in the ink-black fog of silence. No gold,
// no red, no path hue: nothing of the player's is in it. Its tips catch the player's own light (light.gold) only
// while a touch bounces off; that is drawn by entity-view.ts, not stored here.

export const SKY_ENTITY_PALETTE = {
  'entity.husk.dark': '#08070C',
  'entity.husk.base': '#110F17',
  'entity.husk.hi': '#1A1722',
  'entity.spike.base': '#1E1B28',
  'entity.spike.mid': '#2A2838',
  'entity.spike.tip': '#3C3F55',
  'entity.rim': '#56607E',
} as const;
