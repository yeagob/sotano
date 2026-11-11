// Where a reward lands when it is dispensed (issue #156): away from the player, never toward them, on
// ground that can hold it. Pure geometry: the caller supplies what the world holds at a cell, so every
// reward source (chests, creatures, projections, presences, bosses, crates, items) shares one rule
// while keeping its own table and trigger.

/** Horizontal step, in blocks, of the path check: short enough that no unit cell along the throw is skipped. */
export const EJECT_STEP = 0.1;
/** A reward is never launched closer than this to facing the player: a quarter turn either side of straight away. */
export const EJECT_ARC = Math.PI / 2;
/** Offsets tried around the wanted direction, nearest first, alternating sides. */
const FAN = [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.2, -1.2, 1.5, -1.5];
/** How far below its landing spot a reward still finds ground (a shaft deeper than this is not clear). */
const REST_DEPTH = 3;

export interface Point2 { x: number; z: number }

/** What the world holds at a cell (integer coordinates, as the world's solids and elements are). */
export interface Ground {
  solid(x: number, y: number, z: number): boolean;
  element(x: number, y: number, z: number): boolean;
}

/** Wraps an angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** The direction straight away from the player, through `from`. */
export function awayAngle(from: Point2, player: Point2): number {
  return Math.atan2(from.z - player.z, from.x - player.x);
}

/** The horizontal distance a reward covers in its throw: its speed times the time its lift and gravity keep it up. */
export function throwReach(speed: number, lift: number, gravity: number): number {
  return speed * (2 * lift / gravity);
}

/** A cell a reward can pass through at its height `fy` (its feet): no solid and no element there or one above. */
export function passable(g: Ground, fx: number, fy: number, fz: number): boolean {
  return !g.solid(fx, fy, fz) && !g.solid(fx, fy + 1, fz) && !g.element(fx, fy, fz);
}

/**
 * A cell where a reward comes to rest: passable, with ground within REST_DEPTH blocks below and no element on
 * the way down. A shaft with no floor near enough is not restable: the reward would fall through it.
 */
export function restable(g: Ground, fx: number, fy: number, fz: number): boolean {
  if (!passable(g, fx, fy, fz)) return false;
  for (let d = 0; d <= REST_DEPTH; d++) {
    const y = fy - d;
    if (g.element(fx, y, fz)) return false;
    if (g.solid(fx, y - 1, fz)) return true;
  }
  return false;
}

/**
 * Whether a throw from `from` along `angle`, `reach` blocks long, is clear: every cell it crosses, sampled every
 * EJECT_STEP, is passable at height `fy`, and the landing cell is restable. A thin wall or a shaft edge the throw
 * crosses fails the throw even when the landing spot itself is clear.
 */
export function throwClear(from: Point2, angle: number, reach: number, g: Ground, fy: number): boolean {
  const n = Math.max(1, Math.ceil(reach / EJECT_STEP));
  for (let k = 1; k <= n; k++) {
    const d = reach * k / n;
    const fx = Math.floor(from.x + Math.cos(angle) * d), fz = Math.floor(from.z + Math.sin(angle) * d);
    if (k < n ? !passable(g, fx, fy, fz) : !restable(g, fx, fy, fz)) return false;
  }
  return true;
}

/**
 * The launch angle of a reward dispensed at `from`, thrown `reach` blocks. It starts at straight away from the
 * player, turned by `offset` (a spread for several rewards from one source), and fans out to the nearest angle
 * whose throw is clear (`throwClear`). Never closer than EJECT_ARC to facing the player. When no throw is clear
 * it returns straight away: the reward bounces off whatever stands there and lands wherever it can.
 */
export function ejectAngle(from: Point2, player: Point2, g: Ground, fy: number, reach: number, offset = 0): number {
  const away = awayAngle(from, player);
  for (const d of FAN) {
    const a = away + offset + d;
    if (Math.abs(wrapAngle(a - away)) > EJECT_ARC) continue;
    if (throwClear(from, a, reach, g, fy)) return a;
  }
  return away;
}
