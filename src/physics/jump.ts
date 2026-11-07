// The jump's numbers in one pure place (docs/architecture/SKY.md §8, §9): the player moves
// with them, and the sky's generators measure their gaps with them, so the two never drift.
// No three.js, no state: plain numbers and closed-form ballistics.

/** Walking speed at moveSpeed 1, blocks/s. */
export const WALK = 4.6;
/** Gravity, blocks/s². */
export const GRAVITY = 28;
/** Take-off speed of a ground jump at jump 1, blocks/s (apex 8.4² / 56 = 1.26 blocks). */
export const JUMP_V = 8.4;
/** How fast the body turns toward the wished velocity in the air (1 on the ground). */
export const AIR_CONTROL = 0.35;
/** Seconds after leaving an edge in which a jump still counts as a ground jump. */
export const COYOTE = 0.1;
/** Seconds a jump press is remembered before landing. */
export const JUMP_BUFFER = 0.12;
/** Height multipliers of the ground jump and the air jumps, in order (SKY.md §9). */
export const LADDER: readonly number[] = [1, 2, 8];

/** Take-off speed of the k-th jump of a sequence (0 = the ground jump) for a `jump` stat. */
export function velocity(k: number, jump = 1): number {
  return JUMP_V * Math.sqrt(jump * LADDER[k]);
}

/** How high the k-th jump alone rises from where it is pressed (v² / 2g). */
export function apex(k: number, jump = 1): number {
  const v = velocity(k, jump);
  return (v * v) / (2 * GRAVITY);
}

/** How high the first n jumps rise in all, each air jump pressed at the previous one's apex. */
export function rise(n: number, jump = 1): number {
  let h = 0;
  for (let k = 0; k < n; k++) h += apex(k, jump);
  return h;
}

export interface FlightOptions {
  /** The `jump` stat (default 1). */
  jump?: number;
  /** The `moveSpeed` stat (default 1). */
  moveSpeed?: number;
  /** Horizontal speed at take-off as a share of the full walking speed (default 1, a running take-off). */
  start?: number;
}

/**
 * How far a sequence of `jumps` carries horizontally for a rise `dy`: the ground jump, then each
 * air jump pressed at the previous apex, landing on the way down at `dy` above the take-off.
 * Holding forward the whole time; the horizontal speed eases toward the walking speed with the
 * air control of the moment (`AIR_CONTROL` for every jump but the last, `airControl` for the last),
 * the same exponential blend the player uses. Undefined when the sequence never rises to `dy`.
 * With a running take-off (`start` 1) the speed is already full, so air control changes nothing.
 */
export function flight(dy: number, jumps: number, airControl = AIR_CONTROL, opts: FlightOptions = {}): number | undefined {
  const { jump = 1, moveSpeed = 1, start = 1 } = opts;
  if (jumps < 1 || jumps > LADDER.length) return undefined;
  const top = rise(jumps, jump);
  if (dy >= top - 1e-9) return undefined;
  const w = WALK * moveSpeed;
  let vx = w * start, x = 0;
  // carry the horizontal speed through a span of `t` seconds with control `k`
  const span = (t: number, k: number) => {
    const r = 14 * k;
    if (r <= 0) { x += vx * t; return; }
    const e = Math.exp(-r * t);
    x += w * t + ((vx - w) * (1 - e)) / r;
    vx = w + (vx - w) * e;
  };
  for (let k = 0; k < jumps; k++) {
    const last = k === jumps - 1;
    const up = velocity(k, jump) / GRAVITY;
    if (!last) { span(up, AIR_CONTROL); continue; }
    const down = Math.sqrt((2 * (top - dy)) / GRAVITY);
    span(up + down, airControl);
  }
  return x;
}
