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
  /** A breakthrough is a seed: a dark husk with an ember crack and a white-hot heart. */
  seed: {
    rows: [
      '...oooo...',
      '.oohhbboo.',
      '.ohhbebbo.',
      'ohbbbebbdo',
      'obeeccbbdo',
      'obbbccebdo',
      'obbbbebddo',
      '.obbbebdo.',
      '.ooddddoo.',
      '...oooo...',
    ],
    palette: { o: 'ink.void', b: 'mat.seed.base', h: 'mat.seed.hi', d: 'mat.seed.dark', e: 'light.ember', c: 'light.core' },
  },
  /** A key with an eye in its bow: an insight. */
  key: {
    rows: [
      '.oooooo...',
      'oggggggo..',
      'ogkcckgo..',
      'oggggsgo..',
      '.oosgoo...',
      '...ogo....',
      '...oggo...',
      '...ogo....',
      '...oggo...',
      '...ooo....',
    ],
    palette: { o: 'ink.void', g: 'light.gold', s: 'brass.base', k: 'ink.void', c: 'light.core' },
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
} satisfies Record<string, HudIcon>;
