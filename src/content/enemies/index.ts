// The bestiary: projections of patterns that block intention (docs/design/STORY.md §4).
// To add one: create a file next to this one and list it here.

import type { EnemyDef } from '../../enemies/types';
import type { Rng } from '../../core/rng';
import critic from './critic';
import doubt from './doubt';
import panic from './panic';

export const ENEMIES: readonly EnemyDef[] = [doubt, critic, panic];
export const ENEMY_BY_ID: ReadonlyMap<string, EnemyDef> = new Map(ENEMIES.map(e => [e.id, e]));

/** What spawns in a normal room on floor k: a budget of 2 + k, spent on random affordable enemies. */
export const ENEMY_BUDGET = {
  pick(rng: Rng, floor: number): string[] {
    // one room in five is quiet: a breather between fights
    if (rng.chance(0.2)) return [];
    let budget = 2 + floor;
    const out: string[] = [];
    for (let guard = 0; guard < 12 && budget > 0; guard++) {
      const options = ENEMIES.filter(e => e.minFloor <= floor && e.cost <= budget);
      if (!options.length) break;
      const e = rng.pick(options);
      out.push(e.id);
      budget -= e.cost;
    }
    return out.slice(0, 5);
  },
};
