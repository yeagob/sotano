// HUD glyphs as pixel strings (docs/art/DECISIONS.md §10.2): hearts, the breakthrough seed and the
// key with an eye. Drawn by `hudIconUrl` from palette tokens; no SVG, no hex.

import type { PalToken } from './palette';

export interface HudIcon { rows: string[]; palette: Record<string, PalToken> }

const HEART_ROWS = [
  '.ooo...ooo.',
  'offfo.offfo',
  'ofhffoffffo',
  'offfffffffo',
  'offfffffffo',
  '.offfffffo.',
  '..offffdo..',
  '...offdo...',
  '....odo....',
  '.....o.....',
];

export const HUD_ICONS = {
  /** A full heart: life is the only red. */
  heart: { rows: HEART_ROWS, palette: { o: 'ink.void', f: 'life.heart', h: 'bone.paper', d: 'life.dark' } },
  /** An empty container. */
  heartEmpty: { rows: HEART_ROWS, palette: { o: 'ink.void', f: 'life.empty', h: 'life.rim', d: 'life.rim' } },
  seed: {
    rows: [
      '....oo....',
      '...ohbo...',
      '..ohbeso..',
      '.ohbbesbo.',
      '.ohbecsbo.',
      'ohbbccsbdo',
      'obbbcesbdo',
      '.obbesbdo.',
      '..odesdo..',
      '...oooo...',
    ],
    palette: { o: 'ink.void', b: 'mat.seed.base', h: 'mat.seed.hi', d: 'mat.seed.dark', e: 'light.ember', s: 'light.dusk', c: 'light.core' },
  },
  /** A key with an eye in its bow: an insight. */
  key: {
    rows: [
      '...oooooo...',
      '..ohhggggo..',
      '.ohggooggso.',
      '.ohgohhogso.',
      '.oggsoogsso.',
      '..ogggggso..',
      '...oggsso...',
      '....ogsooo..',
      '....ogggggo.',
      '....ogsooo..',
      '....ogsggo..',
      '....oooooo..',
    ],
    palette: { o: 'ink.void', g: 'light.gold', h: 'light.core', s: 'brass.base' },
  },
  /** A breath: a bubble of air, the foam of the water with a glint (never red: it is not life). */
  bubble: {
    rows: [
      '..oooo..',
      '.offffo.',
      'ofhhfffo',
      'ofhffffo',
      'offffsfo',
      'offfssfo',
      '.offffo.',
      '..oooo..',
    ],
    palette: { o: 'el.water.body', f: 'el.water.surface', h: 'el.water.foam', s: 'el.water.body' },
  },
  /** A breath used up: an empty ring. */
  bubbleEmpty: {
    rows: [
      '..oooo..',
      '.o....o.',
      'o......o',
      'o......o',
      'o......o',
      'o......o',
      '.o....o.',
      '..oooo..',
    ],
    palette: { o: 'el.water.body' },
  },
  touchCast: {
    rows: [
      '....oooo....',
      '..oohhhhoo..',
      '.ohcchhhhgo.',
      '.ohcchhhggo.',
      'ohhhhhhgggeo',
      'ohhhhhggggeo',
      'ohhhhggggeeo',
      'oghhgggggeeo',
      '.oggggggeeo.',
      '.ogggggeeeo.',
      '..ooeeeeoo..',
      '....oooo....',
    ],
    palette: { o: 'ink.void', c: 'light.core', h: 'light.hot', g: 'light.gold', e: 'light.ember' },
  },
  touchJump: {
    rows: [
      '.....oo.....',
      '....opdo....',
      '...oppddo...',
      '..opppdddo..',
      '.oppppddddo.',
      'opppppdddddo',
      'ooooppddoooo',
      '...oppddo...',
      '...oppddo...',
      '...oppddo...',
      '...offffo...',
      '...oooooo...',
    ],
    palette: { o: 'ink.void', p: 'bone.paper', d: 'bone.dim', f: 'bone.faded' },
  },
  touchThrow: {
    rows: [
      '............',
      '............',
      '.....ooooooo',
      '.ooooohhhhho',
      '.offoobbbbdo',
      'oooooobbbbdo',
      'offfoobbbbdo',
      'oooooobbbbdo',
      '.offoobbbbdo',
      '.ooooooooooo',
      '............',
      '............',
    ],
    palette: { o: 'ink.void', f: 'bone.dim', h: 'mat.crate.hi', b: 'mat.crate.base', d: 'mat.crate.dark' },
  },
  touchInventory: {
    rows: [
      'oooooooooooo',
      'oppppooppppo',
      'opkkdoopkkdo',
      'opkkdoopkkdo',
      'oddddooddddo',
      'oooooooooooo',
      'oooooooooooo',
      'oppppooppppo',
      'opkkdoopkkdo',
      'opkkdoopkkdo',
      'oddddooddddo',
      'oooooooooooo',
    ],
    palette: { o: 'ink.void', p: 'bone.paper', d: 'bone.dim', k: 'ink.ash' },
  },
} satisfies Record<string, HudIcon>;
