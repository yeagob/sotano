import * as THREE from 'three';
import { type PalToken } from '../content/palette';
import {
  VoxelGrid, voxelGeometry, STONE, stoneCourse, ironFace, hash, lambert, mesh,
  DIRS, UP, DOWN, NX, PZ,
} from './alembic-model';

// The kitchen station: the left half of the former two-tile alembic, kept as it was. A stone
// hearth (athanor) with its fire mouth on +Z, the banked coals on an iron grate, the iron flue at
// the back-left and the iron seat on the hob where the pot stands.
//
// Footprint: x in [0, 1], z in [0, 1], y in [0, 1.25]; the origin is the tile's lower corner.
// Named children (optional): hearth-coals (shown at rest), hearth-glow (hidden; show it and hide
// the coals while cooking). Geometry and materials are owned by the group: dispose by traversal.

type Kind = 'stone' | 'iron' | 'ironHi' | 'coal';
const layerOf = (k: Kind) => (k === 'coal' ? 'coal' : 'solid');
const NONE = new Set<string>();
type Grid = VoxelGrid<Kind>;

const inMouth = (x: number, y: number, z: number) => x >= 5 && x <= 10 && y >= 2 && y <= 7 && z >= 9 && z <= 13;

function carve(): Grid {
  const g: Grid = new VoxelGrid<Kind>();
  g.box(1, 15, 0, 2, 1, 15, 'stone');             // footing
  g.box(2, 14, 2, 9, 2, 14, 'stone');             // body
  g.box(1, 15, 9, 10, 1, 15, 'stone');            // cornice, one texel proud
  g.box(2, 14, 10, 11, 2, 14, 'stone');           // the hob
  g.box(5, 11, 2, 7, 9, 14, null);                // the fire mouth on +Z
  g.box(6, 10, 7, 8, 9, 14, null);
  g.box(4, 12, 8, 9, 13, 15, 'iron');             // iron lintel over the arch
  g.box(5, 11, 2, 3, 9, 13, 'coal');              // the banked coal bed
  for (let x = 5; x < 11; x += 2) g.box(x, x + 1, 3, 4, 9, 13, 'iron'); // the grate
  g.box(4, 12, 1, 2, 14, 15, 'iron');             // iron sill
  g.set(4, 8, 14, 'ironHi'); g.set(11, 8, 14, 'ironHi'); // rivets
  g.box(6, 10, 4, 6, 2, 3, null);                 // a vent on the back
  g.box(2, 4, 11, 18, 2, 4, 'iron');              // the flue with a cap
  g.box(1, 5, 18, 19, 1, 5, 'iron');
  g.box(2, 4, 19, 20, 2, 4, 'ironHi');
  g.ring(8, 8, 11, 2.2, 3.9, 'iron');             // the iron seat on the hob
  return g;
}

function stone(x: number, y: number, z: number, d: number): PalToken {
  const [o, dk, b, h] = STONE;
  if (d === DOWN) return o;
  if (inMouth(x + DIRS[d][0], y + DIRS[d][1], z + DIRS[d][2])) return (x + y + z) % 3 === 0 ? dk : o; // soot
  if (d === UP) {
    if (y === 9) return (x + z) % 7 === 0 ? b : h;
    if (y === 10) return x % 4 === 0 || z % 6 === 0 ? dk : b;
    return h;
  }
  if (y <= 1) return y === 1 ? (((d === PZ || d === NX ? x : z) + 2) % 7 === 0 ? o : b) : dk;
  if (y === 9) return h;
  if (y === 10) return b;
  return stoneCourse(x, y, z, d, 2);
}

function paint(k: Kind, x: number, y: number, z: number, d: number): PalToken {
  switch (k) {
    case 'stone': return stone(x, y, z, d);
    case 'iron': return ironFace(x, y, z, d, d === PZ || d === NX);
    case 'ironHi': return d === DOWN ? 'iron.base' : 'iron.hi';
    case 'coal': {
      const h = hash(x, y, z);
      return h < 0.3 ? 'el.ember.dead' : h < 0.6 ? 'mat.bedrock.hi' : h < 0.85 ? 'mat.bedrock.base' : 'el.smoke';
    }
  }
}

function glow(_k: Kind, x: number, y: number, z: number, d: number): PalToken {
  if (d === DOWN) return 'light.dusk';
  const h = hash(x, y, z);
  return h < 0.25 ? 'light.hot' : h < 0.7 ? 'light.ember' : 'light.dusk';
}

/** The kitchen's hearth on one tile, origin at the tile's lower corner. */
export function buildKitchenModel(): THREE.Group {
  const g = carve();
  const root = new THREE.Group();
  root.name = 'kitchen';
  mesh(root, 'kitchen-body', voxelGeometry(g, 'solid', layerOf, NONE, paint), lambert());
  mesh(root, 'hearth-coals', voxelGeometry(g, 'coal', layerOf, NONE, paint), lambert());
  const lit = mesh(root, 'hearth-glow', voxelGeometry(g, 'coal', layerOf, NONE, glow), new THREE.MeshBasicMaterial({ vertexColors: true }));
  lit.visible = false;
  return root;
}
