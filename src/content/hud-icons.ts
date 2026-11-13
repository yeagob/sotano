// HUD glyphs as pixel strings (docs/art/DECISIONS.md §10.2): hearts, the bomb seed and the
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
  /** A blue heart: the red heart's shape in ultramarine; once spent it does not come back. */
  heartBlue: { rows: HEART_ROWS, palette: { o: 'ink.void', f: 'heart.blue.base', h: 'bone.paper', d: 'heart.blue.dark' } },
  /** A black heart: the red heart's shape in soot-black; once spent it does not come back (issue #154). */
  heartBlack: { rows: HEART_ROWS, palette: { o: 'ink.void', f: 'heart.black.base', h: 'bone.paper', d: 'heart.black.dark' } },
  /** A stone heart: warm grey with a gold crack of kintsugi, light coming through the stone. */
  heartStone: {
    rows: [
      '.ooo...ooo.',
      'ohhfo.offfo',
      'ohfffoffffo',
      'ofgffcffffo',
      'offggffgfdo',
      '.offfggfdo.',
      '..offgfdo..',
      '...ofgdo...',
      '....odo....',
      '.....o.....',
    ],
    palette: { o: 'ink.void', f: 'heart.stone.base', h: 'heart.stone.hi', d: 'heart.stone.dark', g: 'light.gold', c: 'light.core' },
  },
  /** A blood heart: a crimson heart with a red heart inside it, the one that keeps beating. */
  heartBlood: {
    rows: [
      '.ooo...ooo.',
      'offfo.offfo',
      'ofhffoffffo',
      'offrrfrrffo',
      'offrrrrrfdo',
      '.offrrrfdo.',
      '..offrfdo..',
      '...offdo...',
      '....odo....',
      '.....o.....',
    ],
    palette: { o: 'ink.void', f: 'heart.blood.base', h: 'life.heart', r: 'life.heart', d: 'life.dark' },
  },
  /** A star heart: gold, with a five-pointed star of white light at its centre (a filled star, never a pentagram). */
  heartStar: {
    rows: [
      '.ooo...ooo.',
      'ohhfo.offfo',
      'ohfffoffffo',
      'offffsffffo',
      'offsssssfdo',
      '.offsssfdo.',
      '..ofsfsdo..',
      '...offdo...',
      '....odo....',
      '.....o.....',
    ],
    palette: { o: 'ink.void', f: 'light.ember', h: 'light.gold', s: 'light.core', d: 'light.dusk' },
  },
  /** A berserker heart: obsidian with a white-hot core, its rim and veins already burning. */
  heartBerserker: {
    rows: [
      '.eee...eee.',
      'ebgbe.ebbbe',
      'egbebebebbe',
      'ebbbyyybbbe',
      'eeeyycyyeee',
      '.ebbyyybbe.',
      '..ebebebe..',
      '...ebbbe...',
      '....ebe....',
      '.....e.....',
    ],
    palette: { e: 'heart.berserker.ember', b: 'mat.obsidian.dark', g: 'mat.obsidian.hi', y: 'light.hot', c: 'light.core' },
  },
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
  touchDrink: {
    rows: [
      '............',
      '....oooo....',
      '.....oo.....',
      '.....oo.....',
      '....oggo....',
      '...ogllgo...',
      '..ogllllgo..',
      '..ogllllgo..',
      '..ogllllgo..',
      '...oggggo...',
      '....oooo....',
      '............',
    ],
    palette: { o: 'ink.void', g: 'bone.paper', l: 'living.glow' },
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
