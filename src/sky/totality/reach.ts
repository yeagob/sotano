// The reach envelope of the triple jump, on physics/jump.ts's flight (docs/architecture/SKY.md §8, §9).
// Pure: the numbers at base stats. A rise is stated by its band, never by a share of a vacuous test.

import { AIR_CONTROL, flight } from '../../physics/jump';

/** The horizontal gap a hop may have, as a share of its reach (SKY.md §8: 0.8 · reach). */
export const MARGIN = 0.8;
/** Climb hops rise this many blocks (the third jump by height alone). */
export const CLIMB_RISE: readonly [number, number] = [4, 10];
/** Rest hops rise this many blocks (the first two jumps reach them). */
export const REST_RISE: readonly [number, number] = [0, 3];

/** Horizontal reach of the 1× → 2× → 8× sequence for a rise `dy`, the third jump at full air control; undefined out of reach. */
export const reach = (dy: number): number | undefined => flight(dy, 3, 1);

/** The first two jumps only, with the base air control: defined for dy < 3.78, undefined (no reach) above. */
export const reach2 = (dy: number): number | undefined => flight(dy, 2, AIR_CONTROL);

/** The widest gap a hop of this kind and rise may have: 0.8 of its reach (a rest hop: of reach2, the stricter one). */
export function maxGap(kind: 'climb' | 'rest', dy: number): number | undefined {
  const r = kind === 'climb' ? reach(dy) : reach2(dy);
  return r === undefined ? undefined : MARGIN * r;
}
