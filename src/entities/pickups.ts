// Things you collect by walking into them: keys (insights), bombs (breakthroughs), hearts,
// and items on pedestals. They only know where they are and what they look like; the game
// decides what touching them does (through `pickupCollect` / the inventory).
// Floor pickups fall until they rest on something solid (a vertical settle, no physics engine).

import * as THREE from 'three';
import type { PickupKind } from '../game/events';
import type { ItemDef } from '../items/types';
import type { PartDef } from '../content/parts';
import { pal } from '../content/palette';
import { glowTexture, iconTexture } from '../render/icons';

export type PickupType = PickupKind | 'item' | 'part';

export interface Pickup {
  type: PickupType;
  x: number; y: number; z: number;   // base position (bottom of the visual)
  vx: number; vy: number; vz: number;
  flying: boolean;
  room: number;
  /** Pedestal item (null = empty pedestal). */
  item: ItemDef | null;
  /** The part a projection left (type 'part'). */
  part: PartDef | null;
  taken: boolean;
  /** Can't be collected yet (just dropped). */
  delay: number;
  /** Seconds since it appeared (drives the pop-in). */
  age: number;
  obj: THREE.Object3D;
}

type Solid = (x: number, y: number, z: number) => boolean;

/** Seconds a pickup takes to grow into view. */
const POP_IN = 0.45;

function box(g: THREE.Group, m: THREE.Material, w: number, h: number, d: number, x: number, y: number, z = 0) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  g.add(b);
}

function keyMesh(): THREE.Object3D {
  const g = new THREE.Group();
  // a key with an eye (an insight): gold body, brass shade, a white-hot eye (docs/art/DECISIONS.md §10.2)
  const m = new THREE.MeshLambertMaterial({ color: pal('light.gold'), emissive: pal('brass.dark') });
  const eye = new THREE.MeshBasicMaterial({ color: pal('light.core') });
  box(g, m, 0.32, 0.08, 0.08, 0, 0.36); box(g, m, 0.32, 0.08, 0.08, 0, 0.12);
  box(g, m, 0.08, 0.32, 0.08, -0.12, 0.24); box(g, m, 0.08, 0.32, 0.08, 0.12, 0.24);
  box(g, eye, 0.1, 0.1, 0.1, 0, 0.24);
  box(g, m, 0.08, 0.5, 0.08, 0, -0.17);
  box(g, m, 0.14, 0.07, 0.08, 0.1, -0.3); box(g, m, 0.1, 0.07, 0.08, 0.08, -0.16);
  return g;
}

function bombMesh(): THREE.Object3D {
  const g = new THREE.Group();
  // a breakthrough is a seed, never a cartoon bomb: a dark husk split by ember cracks, a white-hot heart
  const shell = new THREE.MeshLambertMaterial({ color: pal('mat.seed.base'), emissive: pal('ink.void') });
  const ember = new THREE.MeshBasicMaterial({ color: pal('light.ember') });
  const heart = new THREE.MeshBasicMaterial({ color: pal('light.core') });
  box(g, shell, 0.3, 0.34, 0.3, 0, 0.17);
  box(g, shell, 0.22, 0.08, 0.22, 0, 0.38);
  box(g, ember, 0.32, 0.04, 0.04, 0, 0.22);
  box(g, ember, 0.04, 0.2, 0.32, 0.02, 0.16);
  box(g, heart, 0.08, 0.08, 0.32, 0, 0.17);
  return g;
}

function heartMesh(): THREE.Object3D {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: pal('life.heart'), emissive: pal('life.dark') });
  // a pixel heart, 5 columns × 4 rows of small cubes
  const rows = ['.X.X.', 'XXXXX', '.XXX.', '..X..'];
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'X') box(g, m, 0.08, 0.08, 0.1, (i - 2) * 0.08, 0.36 - j * 0.08); }));
  return g;
}

function partMesh(def: PartDef): THREE.Object3D {
  const g = new THREE.Group();
  const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTexture(def), transparent: true }));
  icon.scale.set(0.5, 0.5, 1);
  icon.name = 'icon';
  g.add(icon);
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

/** The mesh of a key, bomb (seed) or heart, as the game draws it (the gallery uses it too). */
export function pickupMesh(type: PickupKind): THREE.Object3D {
  return type === 'key' ? keyMesh() : type === 'bomb' ? bombMesh() : heartMesh();
}

export class Pickups {
  readonly list: Pickup[] = [];
  private group = new THREE.Group();
  private time = 0;

  constructor(private scene: THREE.Scene) { scene.add(this.group); }

  dispose() { this.scene.remove(this.group); }

  add(type: PickupType, x: number, y: number, z: number, room: number, item: ItemDef | null = null, delay = 0, part: PartDef | null = null): Pickup {
    const obj = type === 'key' ? keyMesh() : type === 'bomb' ? bombMesh() : type === 'heart' ? heartMesh() : type === 'part' && part ? partMesh(part) : pedestalItem(item);
    obj.position.set(x, y, z);
    this.group.add(obj);
    const p: Pickup = { type, x, y, z, vx: 0, vy: type === 'item' ? 0 : 3, vz: 0, flying: false, room, item, part, taken: false, delay, age: 0, obj };
    obj.scale.setScalar(0.001);
    this.list.push(p);
    return p;
  }

  launch(p: Pickup, vx: number, vy: number, vz: number) {
    p.vx = vx; p.vy = vy; p.vz = vz;
    p.flying = true;
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
      if (p.age < POP_IN) {
        // pop in: grow with a small overshoot (ease-out-back)
        p.age = Math.min(POP_IN, p.age + dt);
        const k = p.age / POP_IN - 1;
        p.obj.scale.setScalar(Math.max(0.001, 1 + 2.2 * k * k * k + 1.2 * k * k));
      }
      if (p.flying && (p.vx || p.vz)) {
        const nx = p.x + p.vx * dt, nz = p.z + p.vz * dt, cy = Math.floor(p.y + 0.05);
        if (solid(Math.floor(nx), cy, Math.floor(p.z))) p.vx *= -0.3; else p.x = nx;
        if (solid(Math.floor(p.x), cy, Math.floor(nz))) p.vz *= -0.3; else p.z = nz;
      }
      if (p.type !== 'item' || p.flying) {
        // fall until resting on something solid (re-checked every frame: the floor may break)
        const below = solid(Math.floor(p.x), Math.floor(p.y - 0.01), Math.floor(p.z));
        if (!below || p.vy > 0) {
          p.vy -= 22 * dt;
          let ny = p.y + p.vy * dt;
          if (p.vy < 0 && solid(Math.floor(p.x), Math.floor(ny), Math.floor(p.z))) { ny = Math.floor(ny) + 1; p.vy = 0; }
          p.y = ny;
          if (p.y < -10) { this.take(p); continue; }
        } else if (p.flying) { p.flying = false; p.vx = 0; p.vz = 0; }
      }
      p.obj.rotation.y = this.time * 1.6 + p.x;
      const bob = Math.sin(this.time * 2.2 + p.x) * (p.type === 'item' ? 0.08 : 0.04);
      p.obj.position.set(p.x, p.y + (p.type === 'item' ? 0.55 : p.type === 'part' ? 0.3 : 0.12) + bob, p.z);
      if (p.type === 'item') {
        p.obj.rotation.y = 0;
        const glow = p.obj.getObjectByName('glow') as THREE.Sprite | undefined;
        if (glow) { const k = 1.25 + Math.sin(this.time * 3) * 0.1; glow.scale.set(k, k, 1); }
      }
    }
  }
}
