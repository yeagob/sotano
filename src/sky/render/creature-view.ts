// The plush models of sky creatures, built from ModelPart through buildModel (docs/architecture/SKY.md §5.1).
// Each creature hangs in a holder group at its body's feet; the holder follows the body, and is hidden while
// the creature is parked (another floor). The holder is also a named part, so marks ride with the body.

import * as THREE from 'three';
import { buildModel } from '../../entities/enemies';
import type { EnemyDef } from '../../enemies/types';
import type { CreatureViewApi, DeityModel, MinionModel, Parts, SkyActor } from '../types';

/** The part name of a creature's holder (its feet are the holder's origin). */
export const HOLDER = '@holder';

interface Item { holder: THREE.Group; parts: Map<string, THREE.Object3D> }

export class CreatureView implements CreatureViewApi {
  private items = new Map<number, Item>();

  constructor(private root: THREE.Object3D) {}

  add(a: SkyActor, model: DeityModel | MinionModel) {
    const list = 'parts' in model ? model.parts : [...model.body, ...model.head];
    // buildModel reads only the def's model list; the rest of an EnemyDef is not used for a creature.
    const built = buildModel({ model: [...list] } as unknown as EnemyDef);
    const holder = new THREE.Group();
    holder.add(built.group);
    this.root.add(holder);
    const parts = new Map<string, THREE.Object3D>();
    for (const [name, objs] of built.parts) if (objs[0]) parts.set(name, objs[0]);
    parts.set(HOLDER, holder);
    this.items.set(a.id, { holder, parts });
  }

  remove(id: number) {
    const it = this.items.get(id);
    if (!it) return;
    this.root.remove(it.holder);
    disposeTree(it.holder);
    this.items.delete(id);
  }

  parts(id: number): Parts | null {
    return this.items.get(id)?.parts ?? null;
  }

  update(_dt: number, actors: readonly SkyActor[]) {
    for (const a of actors) {
      const it = this.items.get(a.id);
      if (!it) continue;
      const b = a.body;
      it.holder.position.set(b.x, b.y, b.z);
      it.holder.visible = !a.parked;
    }
  }

  dispose() {
    for (const id of [...this.items.keys()]) this.remove(id);
  }
}

/** Frees the geometry and the materials of a built model. */
function disposeTree(o: THREE.Object3D) {
  o.traverse(c => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    m.geometry.dispose();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) mat.dispose();
  });
}
