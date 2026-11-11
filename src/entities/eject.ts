// Where a reward lands when it is dispensed (issue #156): away from the player, never toward them, on
// ground that can hold it. Pure geometry: the caller supplies the world's answer for a landing spot, so
// every reward source (chests, creatures, projections, presences, bosses, crates, items) shares one rule
// while keeping its own table and trigger.

/** Horizontal reach in blocks a reward must find clear ground at, along its launch direction. */
export const EJECT_REACH = 1.5;
/** A reward is never launched closer than this to facing the player: a quarter turn either side of straight away. */
export const EJECT_ARC = Math.PI / 2;
/** Offsets tried around the wanted direction, nearest first, alternating sides. */
const FAN = [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2, 1.5, -1.5];

export interface Point2 { x: number; z: number }

/** Wraps an angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** The direction straight away from the player, through `from`. */
export function awayAngle(from: Point2, player: Point2): number {
  return Math.atan2(from.z - player.z, from.x - player.x);
}

/**
 * The launch angle of a reward dispensed at `from`. It starts at straight away from the player, turned by
 * `offset` (a spread for several rewards from one source), and fans out to the nearest angle whose landing
 * spot, EJECT_REACH away, is `clear`. Never closer than EJECT_ARC to facing the player. When no spot is clear
 * it returns straight away: the reward bounces off whatever stands there and lands wherever it can.
 */
export function ejectAngle(from: Point2, player: Point2, clear: (x: number, z: number) => boolean, offset = 0): number {
  const away = awayAngle(from, player);
  for (const d of FAN) {
    const a = away + offset + d;
    if (Math.abs(wrapAngle(a - away)) > EJECT_ARC) continue;
    if (clear(from.x + Math.cos(a) * EJECT_REACH, from.z + Math.sin(a) * EJECT_REACH)) return a;
  }
  return away;
}
