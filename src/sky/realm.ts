// The swap between the dungeon's systems and the sky's (docs/architecture/SKY.md §2.1). Stub (K0): R1 builds it.

import type * as THREE from 'three';
import type { RealmHost, RealmSet, SwapRealm } from './types';

/** Returns the new stash: the set that was active. */
export const swapRealm: SwapRealm = (_host: RealmHost, stash: RealmSet, _dungeonRoot: THREE.Group, _skyRoot: THREE.Group) => stash;
