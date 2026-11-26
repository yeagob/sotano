// The bestiary: projections of patterns that block intention (docs/design/STORY.md §4).
// To add one: create a file next to this one, list it here and give it weight in
// src/content/tables/enemies.ts.

import type { EnemyDef } from '../../enemies/types';
import type { Rng } from '../../core/rng';
import { QUIET_ROOM, ROSTER } from '../tables/enemies';
import { level } from '../levels';
import { moreEnemies } from '../../enemies/difficulty';
import critic from './critic';
import doubt from './doubt';
import panic from './panic';
import autopilot from './autopilot';
import craving from './craving';
import impulse from './impulse';
import avoidance from './avoidance';
import distraction from './distraction';
import undertow from './undertow';
import rumination from './rumination';
import scarcity from './scarcity';
import resentment from './resentment';
import gloom from './gloom';
import secondGuessing from './second-guessing';
import alarm from './alarm';
import backlog from './backlog';
import noise from './noise';
import perfectionism from './perfectionism';
import notYet from './not-yet';
import comparison from './comparison';
import hallOfMirrors from './hall-of-mirrors';
import paralysis from './paralysis';
import margin from './margin';
import tribunal from './tribunal';
import dread from './dread';
import reactivity from './reactivity';
import sulk from './sulk';
import shoulds from './shoulds';
import dogma from './dogma';
import burnout from './burnout';
import spark from './spark';
import pretence from './pretence';
import shortcut from './shortcut';
import numbness from './numbness';
import cynicism from './cynicism';
import isolation from './isolation';
import whatIf from './what-if';
import procrastination, { procrastinationB, procrastinationC } from './procrastination';
import { BOSSES } from '../bosses';

export const ENEMIES: readonly EnemyDef[] = [
  doubt, critic, panic,
  autopilot, craving, impulse, avoidance, procrastination, distraction, undertow, rumination, scarcity, resentment, gloom, secondGuessing, alarm, backlog, noise, perfectionism, notYet, comparison, hallOfMirrors, paralysis, margin, tribunal, dread, reactivity, sulk, shoulds, dogma, burnout, spark, pretence, shortcut, numbness, cynicism, isolation, whatIf,
  procrastinationB, procrastinationC,
];
export const ENEMY_BY_ID: ReadonlyMap<string, EnemyDef> = new Map([...ENEMIES, ...BOSSES].map(e => [e.id, e]));

/**
 * A normal room's roster on floor k (structure: rolled at carve time from the room's own fork).
 * Budget 2 + floor (at most 8 until the deep floors are tuned, docs/architecture/LEVELS.md L4), spent on enemies drawn from the ROSTER table that fit the remaining budget.
 */
/**
 * One wave of a challenge room: `budget` points spent on the ROSTER table, never quiet, at most
 * seven projections (structure for the floor, runtime for the wave: the caller passes the fork). Above difficulty 1
 * the same fork adds projections to the wave (`moreEnemies`), as for a normal room.
 */
export function pickWave(rng: Rng, floor: number, budget: number, difficulty = 1): string[] {
  const out: string[] = [];
  const wave = budget;
  for (let guard = 0; guard < 24 && budget > 0 && out.length < 7; guard++) {
    const id = ROSTER.roll(rng, { floor });
    const def = id ? ENEMY_BY_ID.get(id) : undefined;
    if (!def || def.minFloor > floor || def.cost > budget) continue;
    out.push(def.id);
    budget -= def.cost;
  }
  return moreEnemies(rng, floor, out, difficulty, wave, 7, ENEMY_BY_ID);
}

/** A challenge wave's budget: the floor, the wave (1–3) and how many times you have come back. */
export const waveBudget = (floor: number, wave: number, entry: number) => Math.min(3 + floor + 2 * wave + entry, 16);

/**
 * A normal room's roster. At a difficulty above 1 (#352) the same room fork goes on after the usual roster and adds
 * projections to it (`moreEnemies`, SPAWNS-AND-WAVES §1.1): the usual roster is never changed.
 */
export const ENEMY_BUDGET = {
  pick(rng: Rng, floor: number, cells = 1, difficulty = 1): string[] {
    if (QUIET_ROOM.roll(rng, { floor })) return [];
    const room = level(floor).enemyBudget * cells;
    let budget = room;
    const out: string[] = [];
    for (let guard = 0; guard < 12 && budget > 0; guard++) {
      const id = ROSTER.roll(rng, { floor });
      const def = id ? ENEMY_BY_ID.get(id) : undefined;
      if (!def || def.minFloor > floor) continue;
      if (def.cost > budget) { if (budget < 1) break; continue; }
      out.push(def.id);
      budget -= def.cost;
    }
    return moreEnemies(rng, floor, out.slice(0, 5 * cells), difficulty, room, 5 * cells, ENEMY_BY_ID);
  },
};
