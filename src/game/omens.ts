// Omens and waves: how a projection announces itself before it exists (docs/design/BESTIARY.md §2).
// Pure rules only: where a spawn may happen and how a room's roster splits into waves. The game
// draws the particles, plays the spatial sound and spawns the projection when the omen breaches.

import type { Rng } from '../core/rng';

/** Seconds of gathering motes before the crack, then the breach that lets the projection out. */
export const OMEN_GATHER = 1.0;
export const OMEN_BREACH = 0.2;
/** Projections per wave at most (BESTIARY §2.4: a wave is one clear announcement, not a flood). */
export const WAVE_SIZE = 3;
/** A spawn point is never closer than this to a door (BESTIARY §2.2, rule 1). */
export const DOOR_CLEARANCE = 3;
/** A spawn point is preferably this far from the player (BESTIARY §2.2, rule 2). */
export const PLAYER_CLEARANCE = 3.5;

export interface Cell { x: number; z: number }

export interface Omen {
  def: string;
  room: number;
  x: number; y: number; z: number;
  /** Seconds since the omen opened. */
  t: number;
  breached: boolean;
}

/** Splits a roster into waves of at most `size` projections, keeping its order. */
export function splitWaves(roster: readonly string[], size = WAVE_SIZE): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < roster.length; i += size) out.push(roster.slice(i, i + size));
  return out;
}

const dist = (a: Cell, b: Cell) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * Picks one spawn cell from the room's standable cells, seeded through `rng`:
 * never within DOOR_CLEARANCE of a door; preferably PLAYER_CLEARANCE away from the player.
 * When no cell is far enough from the player, the farthest one is used. Returns null only when
 * no cell is clear of the doors at all.
 */
export function pickSpawnCell(cells: readonly Cell[], doors: readonly Cell[], player: Cell, rng: Rng): Cell | null {
  const clear = cells.filter(c => doors.every(d => dist(c, d) >= DOOR_CLEARANCE));
  if (clear.length === 0) return null;
  const far = clear.filter(c => dist(c, player) >= PLAYER_CLEARANCE);
  if (far.length > 0) return rng.pick(far);
  let best = clear[0];
  for (const c of clear) if (dist(c, player) > dist(best, player)) best = c;
  return best;
}
