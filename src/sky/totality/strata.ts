// Totality's three strata above the crown (docs/architecture/SKY.md §8): the thinned air, the void and
// the solar approach. Pure: the bands, the materials of their platforms and the platform sizes by height.

import { MAT } from '../../content/materials';
import type { Stratum } from '../types';

/** Bands are [y0, y1): a height belongs to the band whose y0 it reaches and whose y1 it is below. */
export const STRATA: readonly Stratum[] = [
  { id: 0, name: 'lower', y0: 221, y1: 420, materials: [MAT.skyleaf, MAT.starresin, MAT.palestone], sizes: [3, 2] },
  { id: 1, name: 'mid', y0: 420, y1: 700, materials: [MAT.meteorglass, MAT.starresin], sizes: [2] },
  { id: 2, name: 'upper', y0: 700, y1: 980, materials: [MAT.solarglass], sizes: [2, 1] },
];

/** The stratum a height is in, null outside Totality. */
export function stratumAt(y: number): Stratum | null {
  for (const s of STRATA) if (y >= s.y0 && y < s.y1) return s;
  return null;
}

/** A platform's side at a height: `sizes` low to high, the first half of the band the first size. */
export function sizeAt(s: Stratum, y: number): number {
  const t = (y - s.y0) / (s.y1 - s.y0);
  return s.sizes[Math.min(s.sizes.length - 1, Math.max(0, Math.floor(t * s.sizes.length)))];
}
