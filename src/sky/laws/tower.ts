// Law 3.9, tower detection (docs/architecture/SKY.md §4, docs/design/not-built/sky/README.md §3.9).
// A tower is the player standing on a placed cell with their feet TOWER_HEIGHT or more blocks above
// the formula ground under their column (the highest formula-solid cell at or below the support).
// A staircase of single placed steps counts as much as a stack. Formula routes never count: their
// cells are not placed. Pure: reads the world's formula and exceptions, no three.js.

import type { Body } from '../../physics/voxel-collide';
import { AIR } from '../../content/materials';
import { ExceptionKind, type Cell, type SkyWorldApi, type Tower, type TowerUnder } from '../types';

/** Feet this many blocks above the formula ground on a placed cell make a tower. */
export const TOWER_HEIGHT = 3;
/** A tower within this many blocks of a deity's height is knocked down. */
export const TOWER_REACH = 2;
/** Blocks searched down the column for the formula ground. The scan is bounded to this window below
 *  the support, never the whole column. A column with no formula ground in the window is measured
 *  from the window's floor: `height` is then a lower bound, far above TOWER_HEIGHT, so the detection
 *  still holds (the true ground is lower, so the tower is taller). */
const MAX_SCAN = 96;
/** Tolerance for feet that stand a float's breath above or below a whole block. */
const EPS = 1e-3;

export const towerUnder: TowerUnder = (world: SkyWorldApi, body: Body): Tower | null => {
  if (!body.onGround) return null;
  const x = Math.floor(body.x), z = Math.floor(body.z);
  const feet = Math.floor(body.y + EPS);            // the cell the feet are in
  const support = feet - 1;                          // the cell they stand on
  if (support < 0 || !world.inside(x, support, z)) return null;
  if (world.kindAt(world.idx(x, support, z)) !== ExceptionKind.Placed) return null;

  // The formula ground under the column: the highest formula-solid cell at or below the support.
  const low = Math.max(0, support - MAX_SCAN + 1);
  let ground = support;
  while (ground >= low && world.base(x, ground, z) === AIR) ground--;
  const height = body.y - (ground + 1);
  if (height < TOWER_HEIGHT - EPS) return null;

  // The placed cells under the player, top down, up to the first cell that is not placed.
  const cells: number[] = [];
  for (let y = support; y >= 0 && world.kindAt(world.idx(x, y, z)) === ExceptionKind.Placed; y--) {
    cells.push(world.idx(x, y, z));
  }
  const at: Cell = [x, feet, z];
  return { cells, height, at };
};
