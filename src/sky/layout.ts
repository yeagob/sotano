// The realm's layout: the tree, the five floors and Totality as one list of shapes (docs/architecture/SKY.md §7.1). Stub (K0): TR builds it.

import type { Fork, SkyPlans } from './types';
import { buildTotality } from './totality/chain';
import { buildSkyTree } from './floors/tree';

/** Draws only from fork('sky', …) paths. */
export function buildSkyLayout(fork: Fork): SkyPlans {
  const tree = buildSkyTree(fork('sky', 'tree'));
  return {
    layout: { shapes: [], index: new Map(), tagAt: () => 0 },
    tree,
    floors: [],
    totality: buildTotality(fork, { x: tree.deck.x, y: tree.deck.y, z: tree.deck.z }),
  };
}
