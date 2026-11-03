// Law 3.9, tower detection (docs/architecture/SKY.md §4). Stub (K0): L1 builds it.

import type { Body } from '../../physics/voxel-collide';
import type { SkyWorldApi, Tower, TowerUnder } from '../types';

/** Feet this many blocks above the formula ground on a placed cell make a tower. */
export const TOWER_HEIGHT = 3;
/** A tower within this many blocks of a deity's height is knocked down. */
export const TOWER_REACH = 2;

export const towerUnder: TowerUnder = (_world: SkyWorldApi, _body: Body): Tower | null => null;
