// Palette part 'sky-totality' (docs/architecture/SKY.md §11), spread into PALETTE. Owned by: AB (strata), TT. Rulings: docs/art/sky/.

export const SKY_TOTALITY_PALETTE = {
  // Totality's strata as fog and clear colour by height (src/sky/atmosphere.ts, docs/art/sky/blocks.md):
  // the day sky (`sky.day`) deepens to cyan and violet, black in the void, a dusk of plum and rose, and
  // the Sun's pale corona at the top: the one warmth that is not the player's (docs/art/sky/README.md).
  'sky.strata.cyan': '#1F6E94',
  'sky.strata.violet': '#2C2160',
  'sky.strata.void': '#05040A',
  'sky.strata.plum': '#2A1C2C',
  'sky.strata.dawn': '#7A5A6E',
  'sky.strata.corona': '#DCC497',
} as const;
