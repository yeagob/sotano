// The creatures of the roots (docs/architecture/LEVELS.md §8, L6): peaceful lives of the place, not
// projections. They wander, keep you company and never fight; nothing hurts them (faction
// `neutral`). They are spawned as ambient life when the roots load, outside every room's roster,
// so they never seal a door, never count for clearing a room and never pay a reward.

import type { Rng } from '../../core/rng';
import type { EnemyDef } from '../../enemies/types';
import type { FloorResult } from '../../world/floor';
import wonder from './wonder';

export const CREATURES: readonly EnemyDef[] = [wonder];
export const CREATURE_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(CREATURES.map(c => [c.id, c]));

/** Where the roots' creatures start: two to four Wonders in the floor's normal rooms, from its own fork. */
export function ambientCreatures(f: FloorResult, rng: Rng): { def: string; room: number; x: number; y: number; z: number }[] {
  if (f.floor !== 0) return [];
  const rooms = f.rooms.filter(r => r.type === 'normal' || r.type === 'start');
  const out: { def: string; room: number; x: number; y: number; z: number }[] = [];
  const n = 2 + rng.int(0, 2);
  for (let i = 0; i < n && rooms.length; i++) {
    const r = rng.pick(rooms);
    out.push({ def: 'wonder', room: r.id, x: r.x0 + 6.5 + rng.range(-3, 3), y: r.y0 + 1.5, z: r.z0 + 3.5 + rng.range(-1.5, 1.5) });
  }
  return out;
}
