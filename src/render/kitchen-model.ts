import * as THREE from 'three';
import { pal } from '../content/palette';

/** The kitchen over its one tile, origin at the tile's lower corner. PLACEHOLDER: one box, until art/station-split lands (the left half of the old alembic model). */
export function buildKitchenModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'kitchen';
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshLambertMaterial({ color: pal('copper.base') }));
  m.position.set(0.5, 0.4, 0.5);
  root.add(m);
  return root;
}
