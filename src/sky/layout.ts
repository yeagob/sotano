// The realm's layout: the tree, the five floors and Totality as one list of shapes (docs/architecture/SKY.md §7.1).
// The tree's shapes come first, so the floors and Totality are drawn over them (last shape wins); the climbs through
// the ways up come after the floors, so their shafts cut the next floor's blocks.

import type { Fork, SkyPlans } from './types';
import { buildTotality } from './totality/chain';
import { buildSkyTree, CROWN_Y, floorPlans, SKY_AXIS } from './floors/tree';
import { buildIndex } from './world/shape-index';

/** Draws only from fork('sky', …) paths. */
export function buildSkyLayout(fork: Fork): SkyPlans {
  const floors = floorPlans(fork);
  const tree = buildSkyTree(fork('sky', 'tree'), floors);
  const totality = buildTotality(fork, { x: SKY_AXIS.x, y: CROWN_Y, z: SKY_AXIS.z });
  const layout = buildIndex([...tree.shapes, ...floors.flatMap(f => f.shapes), ...tree.climbs, ...totality.shapes]);
  return { layout, tree, floors, totality };
}
