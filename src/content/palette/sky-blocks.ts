// Palette part 'sky-blocks' (docs/architecture/SKY.md §11), spread into PALETTE. Owned by: AB. Rulings: docs/art/sky/.
// The sky's thirteen materials (outline, dark, base, hi: DECISIONS §6.1) and the air of the deck and the
// halls. Sky matter is pale and never red, never cold, never gold, never emissive (docs/art/sky/README.md).

export const SKY_BLOCKS_PALETTE = {
  // Matter of the tree and the floors (docs/art/sky/blocks.md).
  'mat.cloud.outline': '#A29D94', 'mat.cloud.dark': '#C6C2B9', 'mat.cloud.base': '#E2DFD7', 'mat.cloud.hi': '#EBE7DE',
  'mat.skywood.outline': '#3F372F', 'mat.skywood.dark': '#665C50', 'mat.skywood.base': '#8F8372', 'mat.skywood.hi': '#AFA390',
  'mat.heartwood.outline': '#22150D', 'mat.heartwood.dark': '#3B2416', 'mat.heartwood.base': '#563621', 'mat.heartwood.hi': '#744B2E',
  'mat.skyleaf.outline': '#253629', 'mat.skyleaf.dark': '#3E5947', 'mat.skyleaf.base': '#5F806C', 'mat.skyleaf.hi': '#84A491',
  'mat.bamboo.outline': '#4A4A24', 'mat.bamboo.dark': '#77773C', 'mat.bamboo.base': '#A9A866', 'mat.bamboo.hi': '#C9C68C',
  'mat.moss.outline': '#232B17', 'mat.moss.dark': '#38432A', 'mat.moss.base': '#4E5C38', 'mat.moss.hi': '#677650',
  'mat.palestone.outline': '#6A6150', 'mat.palestone.dark': '#958A75', 'mat.palestone.base': '#B8AC94', 'mat.palestone.hi': '#D2C8B2',
  'mat.fencewood.outline': '#2B2621', 'mat.fencewood.dark': '#48423A', 'mat.fencewood.base': '#675F55', 'mat.fencewood.hi': '#877D71',
  'mat.mist.outline': '#7E7C77', 'mat.mist.dark': '#97958F', 'mat.mist.base': '#B0AEA8', 'mat.mist.hi': '#C4C2BC',
  // Totality's matter: resin low, meteor glass in the void, solar glass and the seal near the Sun.
  'mat.starresin.outline': '#3A564F', 'mat.starresin.dark': '#5B7F76', 'mat.starresin.base': '#84A89D', 'mat.starresin.hi': '#AACABF',
  'mat.meteorglass.outline': '#0F1A12', 'mat.meteorglass.dark': '#1E3424', 'mat.meteorglass.base': '#2F4E36', 'mat.meteorglass.hi': '#4B7452',
  'mat.solarglass.outline': '#5E4A30', 'mat.solarglass.dark': '#8C7450', 'mat.solarglass.base': '#B49A70', 'mat.solarglass.hi': '#D8C49C',
  'mat.sunseal.outline': '#7A6440', 'mat.sunseal.dark': '#C8B385', 'mat.sunseal.base': '#F3EEE2', 'mat.sunseal.hi': '#F8F3E8',

  // The air (src/sky/atmosphere.ts): the deck's haze under the day sky, the halls' dusk lit by the knot
  // windows, darker in the first hall and airier as the floors rise.
  'sky.deck.haze': '#C6DCEA',
  'sky.hall.low': '#241C17',
  'sky.hall.high': '#3E3A33',
} as const;
