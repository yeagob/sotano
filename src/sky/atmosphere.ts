// Fog and clear colour by place and height: the deck, the halls, Totality's strata (docs/architecture/SKY.md §11).
// Pure: palette tokens in, numbers out. The rulings and the measured numbers: docs/art/sky/blocks.md.
//
// - deck: the day sky (`sky.day`) over a pale haze; nothing is dark up here.
// - hall: the dusk inside the trunk, lit by the knot windows; darker in the first hall, airier as the
//   floors rise (variety by height, issue #12). Fog far always clears the hall's diagonal (DECISIONS G1).
// - void: the open air beside the trunk, from the deck's haze to the clear day sky at the crown.
// - totality: the strata by height: pale day blue → cyan → violet → black with stars → plum and rose
//   dusk → the Sun's pale corona (the one warmth that is not the player's, docs/art/sky/README.md).

import { pal, type PalToken } from '../content/palette';
import { STRATA } from './totality/strata';
import type { AtmosphereSample, SkyPlace } from './types';

/** One stop of a vertical gradient. Between stops everything eases (smoothstep), so no height has a seam. */
export interface AtmosphereKey { y: number; fog: PalToken; clear: PalToken; near: number; far: number; stars: number }

/** The deck's air at any height. */
export const DECK: AtmosphereKey = { y: 32, fog: 'sky.deck.haze', clear: 'sky.day', near: 40, far: 150, stars: 0 };

/** The halls of SKY.md §7.1, floors 1–5: ground, top and radius (the floor's B6 radius + 3). */
export const HALLS: readonly { floor: number; y0: number; y1: number; radius: number }[] = [
  { floor: 1, y0: 36, y1: 67, radius: 23 },
  { floor: 2, y0: 71, y1: 106, radius: 25 },
  { floor: 3, y0: 110, y1: 147, radius: 27 },
  { floor: 4, y0: 151, y1: 190, radius: 29 },
  { floor: 5, y0: 194, y1: 217, radius: 33 },
];

/** Fog far of a hall: its diagonal across and up, plus 8 (DECISIONS G1 asks for diagonal + 6). */
export const hallFar = (h: (typeof HALLS)[number]) => Math.ceil(Math.hypot(2 * h.radius, h.y1 - h.y0)) + 8;

const [LOWER, MID, UPPER] = STRATA;

/** The open air beside the trunk, deck to crown. */
export const VOID: readonly AtmosphereKey[] = [
  DECK,
  { y: LOWER.y0, fog: 'sky.day', clear: 'sky.day', near: 50, far: 180, stars: 0 },
];

/** Totality's strata, bottom to top. Stars come out over the violet, fill the void and fade in the dusk. */
export const TOTALITY: readonly AtmosphereKey[] = [
  { y: LOWER.y0, fog: 'sky.day', clear: 'sky.day', near: 50, far: 180, stars: 0 },
  { y: LOWER.y0 + 100, fog: 'sky.strata.cyan', clear: 'sky.strata.cyan', near: 60, far: 200, stars: 0 },
  { y: MID.y0, fog: 'sky.strata.violet', clear: 'sky.strata.violet', near: 70, far: 230, stars: 0.5 },
  { y: MID.y0 + 60, fog: 'sky.strata.void', clear: 'sky.strata.void', near: 80, far: 260, stars: 1 },
  { y: UPPER.y0 - 50, fog: 'sky.strata.void', clear: 'sky.strata.void', near: 80, far: 260, stars: 1 },
  { y: UPPER.y0, fog: 'sky.strata.plum', clear: 'sky.strata.plum', near: 70, far: 240, stars: 0.7 },
  { y: UPPER.y0 + 100, fog: 'sky.strata.dawn', clear: 'sky.strata.dawn', near: 50, far: 190, stars: 0.1 },
  { y: UPPER.y1 - 60, fog: 'sky.strata.corona', clear: 'sky.strata.corona', near: 30, far: 140, stars: 0 },
];

const HALL_NEAR = 8;

/** Two palette colours mixed per channel (sRGB, like the game's fog lerps). */
export function mixColour(a: number, b: number, t: number): number {
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function sampleKeys(keys: readonly AtmosphereKey[], y: number): AtmosphereSample {
  let i = 0;
  while (i < keys.length - 1 && y > keys[i + 1].y) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const t = b === a || y <= a.y ? 0 : y >= b.y ? 1 : ease((y - a.y) / (b.y - a.y));
  return {
    fog: mixColour(pal(a.fog), pal(b.fog), t),
    clear: mixColour(pal(a.clear), pal(b.clear), t),
    near: lerp(a.near, b.near, t),
    far: lerp(a.far, b.far, t),
    stars: lerp(a.stars, b.stars, t),
  };
}

/** The hall a height belongs to: the one whose band holds it, or the nearest below. */
export function hallAt(y: number): (typeof HALLS)[number] {
  let h = HALLS[0];
  for (const c of HALLS) if (y >= c.y0) h = c;
  return h;
}

function hall(y: number): AtmosphereSample {
  const first = HALLS[0], last = HALLS[HALLS.length - 1];
  const t = Math.min(1, Math.max(0, (y - first.y0) / (last.y1 - first.y0)));
  const c = mixColour(pal('sky.hall.low'), pal('sky.hall.high'), t);
  return { fog: c, clear: c, near: HALL_NEAR, far: hallFar(hallAt(y)), stars: 0 };
}

/** The fog and clear colour (0xRRGGBB), the fog's near and far, and how much of the stars shows (0 → 1). */
export function atmosphereAt(place: SkyPlace, y: number): AtmosphereSample {
  switch (place) {
    case 'deck': return sampleKeys([DECK], y);
    case 'hall': return hall(y);
    case 'void': return sampleKeys(VOID, y);
    case 'totality': return sampleKeys(TOTALITY, y);
  }
}
