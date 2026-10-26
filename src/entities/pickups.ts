// Things you collect by walking into them: keys (insights), bombs (breakthroughs), hearts,
// and items on pedestals. They only know where they are and what they look like; the game
// decides what touching them does (through `pickupCollect` / the inventory).
// Floor pickups fall until they rest on something solid (a vertical settle, no physics engine).

import * as THREE from 'three';
import type { PickupKind } from '../game/events';
import type { ItemDef } from '../items/types';
import { glowTexture, iconTexture } from '../render/icons';

export type PickupType = PickupKind | 'item';

export interface Pickup {
  type: PickupType;
  x: number; y: number; z: number;   // base position (bottom of the visual)
  vy: number;
  room: number;
  /** Pedestal item (null = empty pedestal). */
  item: ItemDef | null;
  taken: boolean;
  /** Can't be collected yet (just dropped). */
  delay: number;
  obj: THREE.Object3D;
}

type Solid = (x: number, y: number, z: number) => boolean;

function box(g: THREE.Group, m: THREE.Material, w: number, h: number, d: number, x: number, y: number, z = 0) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  g.add(b);
}

function keyMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0xf2c84b, emissive: 0x4a3505 });
  const eye = new THREE.MeshBasicMaterial({ color: 0x9fd3ff });
  // a key built from cubes, with an "eye" in the bow: an insight
  box(g, m, 0.32, 0.08, 0.08, 0, 0.36); box(g, m, 0.32, 0.08, 0.08, 0, 0.12);
  box(g, m, 0.08, 0.32, 0.08, -0.12, 0.24); box(g, m, 0.08, 0.32, 0.08, 0.12, 0.24);
  box(g, eye, 0.1, 0.1, 0.1, 0, 0.24);
  box(g, m, 0.08, 0.5, 0.08, 0, -0.17);
  box(g, m, 0.14, 0.07, 0.08, 0.1, -0.3); box(g, m, 0.1, 0.07, 0.08, 0.08, -0.16);
  return g;
}

function bombMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const shell = new THREE.MeshLambertMaterial({ color: 0x2a2233, emissive: 0x120c18 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffb347 });
  box(g, shell, 0.34, 0.34, 0.34, 0, 0.17);
  box(g, glow, 0.36, 0.06, 0.06, 0, 0.2);
  box(g, glow, 0.06, 0.06, 0.36, 0, 0.12);
  box(g, glow, 0.06, 0.14, 0.06, 0, 0.4);
  return g;
}

function heartMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0xe0303c, emissive: 0x3a0508 });
  // a pixel heart, 5 columns × 4 rows of small cubes
  const rows = ['.X.X.', 'XXXXX', '.XXX.', '..X..'];
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'X') box(g, m, 0.08, 0.08, 0.1, (i - 2) * 0.08, 0.36 - j * 0.08); }));
  return g;
}

function pedestalItem(def: ItemDef | null): THREE.Object3D {
  const g = new THREE.Group();
  if (!def) return g;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: def.color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
  glow.scale.set(1.3, 1.3, 1);
  glow.name = 'glow';
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(def), transparent: true }));
  icon.scale.set(0.62, 0.62, 1);
  icon.name = 'icon';
  g.add(glow, icon);
  return g;
}

export class Pickups {
  readonly list: Pickup[] = [];
  private group = new THREE.Group();
  private time = 0;

  constructor(private scene: THREE.Scene) { scene.add(this.group); }

  dispose() { this.scene.remove(this.group); }

  add(type: PickupType, x: number, y: number, z: number, room: number, item: ItemDef | null = null, delay = 0): Pickup {
    const obj = type === 'key' ? keyMesh() : type === 'bomb' ? bombMesh() : type === 'heart' ? heartMesh() : pedestalItem(item);
    obj.position.set(x, y, z);
    this.group.add(obj);
    const p: Pickup = { type, x, y, z, vy: type === 'item' ? 0 : 3, room, item, taken: false, delay, obj };
    this.list.push(p);
    return p;
  }

  take(p: Pickup) {
    p.taken = true;
    this.group.remove(p.obj);
  }

  update(dt: number, solid: Solid) {
    this.time += dt;
    for (const p of this.list) {
      if (p.taken) continue;
      p.delay = Math.max(0, p.delay - dt);
      if (p.type !== 'item') {
        // fall until resting on something solid (re-checked every frame: the floor may break)
        const below = solid(Math.floor(p.x), Math.floor(p.y - 0.01), Math.floor(p.z));
        if (!below || p.vy > 0) {
          p.vy -= 22 * dt;
          let ny = p.y + p.vy * dt;
          if (p.vy < 0 && solid(Math.floor(p.x), Math.floor(ny), Math.floor(p.z))) { ny = Math.floor(ny) + 1; p.vy = 0; }
          p.y = ny;
          if (p.y < -10) { this.take(p); continue; }
        }
      }
      p.obj.rotation.y = this.time * 1.6 + p.x;
      const bob = Math.sin(this.time * 2.2 + p.x) * (p.type === 'item' ? 0.08 : 0.04);
      p.obj.position.set(p.x, p.y + (p.type === 'item' ? 0.55 : 0.12) + bob, p.z);
      if (p.type === 'item') {
        p.obj.rotation.y = 0;
        const glow = p.obj.getObjectByName('glow') as THREE.Sprite | undefined;
        if (glow) { const k = 1.25 + Math.sin(this.time * 3) * 0.1; glow.scale.set(k, k, 1); }
      }
    }
  }
}
