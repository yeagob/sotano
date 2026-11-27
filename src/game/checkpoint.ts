// The run's checkpoint (Waymark, docs/design/built/practices/will/WAYMARK.md): the place the player last knew
// themselves. The rules are pure, so the game and the tests share them.

import type { FloorResult } from '../world/floor';

/** Every checkpoint item carries this tag: the checkpoint lasts while one is held. */
export const CHECKPOINT_TAG = 'checkpoint';
/** Seconds of invulnerability after a revive. */
export const REVIVE_INVULN_S = 2.5;
/** Projections closer than this (blocks) to the checkpoint are pushed away when the player returns. */
export const REVIVE_SHOVE_RADIUS = 4;
/** How far (blocks) the search for a free standing cell reaches. */
export const STANDING_REACH = 6;

export interface Spot { x: number; y: number; z: number }

/**
 * The nearest cell where a body fits: its feet and head cells free. A cell with solid ground under the feet is
 * preferred; without one within reach, any free cell will do. `(x, y, z)` is the feet position. Returns the
 * centre of the cell's floor, or null when nothing free is in reach.
 */
export function standingSpot(solid: (x: number, y: number, z: number) => boolean, x: number, y: number, z: number, reach = STANDING_REACH): Spot | null {
  const fx = Math.floor(x), fy = Math.floor(y + 0.001), fz = Math.floor(z);
  const free = (cx: number, cy: number, cz: number) => !solid(cx, cy, cz) && !solid(cx, cy + 1, cz);
  const levels = [0, 1, -1, 2, -2, 3, -3];
  for (const needGround of [true, false]) {
    for (let r = 0; r <= reach; r++) {
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        for (const dy of levels) {
          const cx = fx + dx, cy = fy + dy, cz = fz + dz;
          if (!free(cx, cy, cz)) continue;
          if (needGround && !solid(cx, cy - 1, cz)) continue;
          return { x: cx + 0.5, y: cy, z: cz + 0.5 };
        }
      }
    }
  }
  return null;
}

/** A floor's arrival point (its spawn, a feet position) as a spot. */
export const arrivalOf = (spawn: readonly [number, number, number]): Spot => ({ x: spawn[0], y: spawn[1], z: spawn[2] });

/** The rooms whose doors must open after the player is moved: every live room but the one the player now stands in. */
export function releasedRooms(live: readonly number[], here: number | null): number[] {
  return live.filter(id => id !== here);
}

export function arrivalYaw(f: Pick<FloorResult, 'spawn' | 'rooms' | 'doors'>): number {
  const start = f.rooms.find(r => r.type === 'start'), way = f.rooms.find(r => r.type === 'boss');
  const door = start && way ? f.doors.find(d => d.rooms.includes(start.id) && d.rooms.includes(way.id)) : undefined;
  if (!door) return 0;
  const dx = (door.x0 + door.x1 + 1) / 2 - f.spawn[0], dz = (door.z0 + door.z1 + 1) / 2 - f.spawn[2];
  return Math.atan2(-dx, -dz);
}
