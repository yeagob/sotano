// The bestiary: projections of patterns that block intention (docs/design/STORY.md §4).
// To add one: create a file next to this one, list it here and give it weight in
// src/content/tables/enemies.ts.

import type { EnemyDef } from '../../enemies/types';
import type { Rng } from '../../core/rng';
import { QUIET_ROOM, ROSTER } from '../tables/enemies';
import critic from './critic';
import doubt from './doubt';
import panic from './panic';

export const ENEMIES: readonly EnemyDef[] = [doubt, critic, panic];
export const ENEMY_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(ENEMIES.map(e => [e.id, e]));

/**
 * A normal room's roster on floor k (structure: rolled at carve time from the room's own fork).
 * Budget 2 + floor (at most 8 until the deep floors are tuned, docs/architecture/LEVELS.md L4), spent on enemies drawn from the ROSTER table that fit the remaining budget.
 */
export const ENEMY_BUDGET = {
  pick(rng: Rng, floor: number): string[] {
    if (QUIET_ROOM.roll(rng, { floor })) return [];
    let budget = Math.min(2 + floor, 8);
    const out: string[] = [];
    for (let guard = 0; guard < 12 && budget > 0; guard++) {
      const id = ROSTER.roll(rng, { floor });
      const def = id ? ENEMY_BY_ID.get(id) : undefined;
      if (!def || def.minFloor > floor) continue;
      if (def.cost > budget) { if (budget < 1) break; continue; }
      out.push(def.id);
      budget -= def.cost;
    }
    return out.slice(0, 5);
  },
};
