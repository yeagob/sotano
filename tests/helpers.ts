// Builds a whole run's structure exactly like Game.newRun does, without three.js or the DOM.

import { ENEMY_BUDGET } from '../src/content/enemies';
import { ITEMS } from '../src/content/items';
import { ROOM_TEMPLATES } from '../src/content/rooms';
import { RunRandom } from '../src/core/rng';
import { ItemPools } from '../src/items/pool';
import { carveFloor, createDungeonWorld, FIRST_FLOOR, FLOORS, pedestalSlots, planDungeon } from '../src/world/floor';

export function buildRun(root: number, floors = FLOORS, beforeCarve?: (rr: RunRandom, pools: ItemPools) => void) {
  const rr = new RunRandom(root);
  const dungeon = planDungeon(rr);
  const pools = new ItemPools(ITEMS);
  pools.reserve(pedestalSlots(dungeon), rr.fork('reserve'));
  const w = createDungeonWorld(rr, dungeon);
  beforeCarve?.(rr, pools);
  const result = [];
  // `floors` floors from the top (the roots, floor 0)
  for (let k = FIRST_FLOOR; k < FIRST_FLOOR + floors; k++) {
    result.push(carveFloor(w, rr, k, dungeon.plans[k], {
      templates: ROOM_TEMPLATES,
      pedestalItem: room => pools.reservedFor(String(room)) ?? null,
      enemies: ENEMY_BUDGET,
    }));
  }
  return { rr, dungeon, pools, w, floors: result };
}

/** A compact, comparable summary of a run's structure. */
export function signature(run: ReturnType<typeof buildRun>) {
  return JSON.stringify(run.floors.map(f => ({
    rooms: f.rooms.map(r => [r.id, r.type, r.gx, r.gz, r.template, r.flipX, r.flipZ, r.mood, r.enemies.join('/')]),
    pedestals: f.pedestals.map(p => [p.room, p.item]),
    keys: f.keys.map(k => [k.x, k.z]),
  })));
}
