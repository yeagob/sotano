// One bomb (docs/architecture/ENTITIES.md, Bombs): the cube, its fuse and its polarity. The player's bombs and the
// Shadow's are lit here, the same entity with the same look and fuse; what the blast does is the game's (`explode`).

import { HALF_HEART } from '../entities/actors';
import { MAT } from '../content/materials';
import type { DebrisSystem } from '../physics/debris';

/** Seconds of a bomb's fuse before any item changes it (`bombPlace`). */
export const BOMB_FUSE = 1.8;
/** Points a bomb's blast deals to every actor in it, whatever its block damage. */
export const BLAST_ACTOR_DAMAGE = 2 * HALF_HEART;

/** What a bomb that is not the player's does when it goes off: radius, block damage at the centre, actor damage. */
export interface BombBlast { radius: number; blocks: number; damage: number; owner: number; source: string }

/** Lights a bomb cube at (x, y, z), rolling with (vx, vz). A white (love) bomb ends in a love explosion. Returns the cube. */
export function lightBomb(debris: DebrisSystem, x: number, y: number, z: number, vx: number, vz: number, fuse: number, love: boolean): number {
  const cube = debris.spawn(MAT.bomb, x, y, z, vx, 0, vz);
  debris.fuse[cube] = Math.max(0.1, fuse);
  debris.love[cube] = love ? 1 : 0;
  debris.cooldown[cube] = 0.8;
  return cube;
}
