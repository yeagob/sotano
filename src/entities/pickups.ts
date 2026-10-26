// Things you collect by walking into them: keys, items on pedestals, and the trapdoor.
// They only know where they are and what they look like; the game decides what touching
// them does (so items can hook into it).

import * as THREE from 'three';

export type PickupKind = 'key' | 'item' | 'trapdoor';

export interface Pickup {
  kind: PickupKind;
  x: number; y: number; z: number;   // world position of the visual's base
  room: number;
  /** Item id for pedestals (null = empty pedestal). */
  item: string | null;
  taken: boolean;
  obj: THREE.Object3D;
}

const KEY_GOLD = 0xf2c84b;

function keyMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: KEY_GOLD, emissive: 0x4a3505 });
  const box = (w: number, h: number, d: number, x: number, y: number) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, 0);
    g.add(b);
  };
  // ring, shaft and teeth, built from cubes like everything else
  box(0.32, 0.08, 0.08, 0, 0.36); box(0.32, 0.08, 0.08, 0, 0.12);
  box(0.08, 0.32, 0.08, -0.12, 0.24); box(0.08, 0.32, 0.08, 0.12, 0.24);
  box(0.08, 0.5, 0.08, 0, -0.17);
  box(0.14, 0.07, 0.08, 0.1, -0.3); box(0.1, 0.07, 0.08, 0.08, -0.16);
  return g;
}

function gemMesh(color: number): THREE.Object3D {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.26, 0),
    new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.45), flatShading: true }),
  );
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  g.add(gem, halo);
  return g;
}

function trapdoorMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.6), new THREE.MeshLambertMaterial({ color: 0x3a2a1c }));
  const hole = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.07, 1.3), new THREE.MeshBasicMaterial({ color: 0x050403 }));
  hole.position.y = 0.005;
  g.add(frame, hole);
  return g;
}

export class Pickups {
  readonly list: Pickup[] = [];
  private group = new THREE.Group();
  private time = 0;

  constructor(private scene: THREE.Scene) { scene.add(this.group); }

  dispose() { this.scene.remove(this.group); }

  add(kind: PickupKind, x: number, y: number, z: number, room: number, item: string | null = null, color = 0xffffff): Pickup {
    const obj = kind === 'key' ? keyMesh() : kind === 'item' ? gemMesh(color) : trapdoorMesh();
    obj.position.set(x, y, z);
    if (kind === 'item' && !item) obj.visible = false;
    this.group.add(obj);
    const p: Pickup = { kind, x, y, z, room, item, taken: false, obj };
    this.list.push(p);
    return p;
  }

  take(p: Pickup) {
    p.taken = true;
    if (p.kind === 'item') { p.item = null; p.obj.visible = false; }
    else this.group.remove(p.obj);
  }

  update(dt: number) {
    this.time += dt;
    for (const p of this.list) {
      if (p.taken || p.kind === 'trapdoor') continue;
      p.obj.rotation.y = this.time * 1.6;
      p.obj.position.y = p.y + 0.55 + Math.sin(this.time * 2.2 + p.x) * 0.08;
    }
  }
}
