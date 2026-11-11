// Things you collect by walking into them: keys (insights), bombs (breakthroughs), hearts,
// and items on pedestals. They only know where they are and what they look like; the game
// decides what touching them does (through `pickupCollect` / the inventory).
// Floor pickups fall until they rest on something solid (a vertical settle, no physics engine).

import * as THREE from 'three';
import type { PickupKind } from '../game/events';
import type { ItemDef } from '../items/types';
import type { PartDef } from '../content/parts';
import { carriedDef, type Flask } from '../content/potions';
import { pal } from '../content/palette';
import { HEART_FX, HEART_PICKUP, type HeartKind } from '../content/heart-art';
import { glowTexture, iconTexture } from '../render/icons';
import { breatheSeed, buildSeed, disposeSeed, type SeedModel } from '../render/seed-model';

export type PickupType = PickupKind | 'item' | 'part' | 'flask';

export interface Pickup {
  type: PickupType;
  x: number; y: number; z: number;   // base position (bottom of the visual)
  vx: number; vy: number; vz: number;
  flying: boolean;
  room: number;
  /** Pedestal item (null = empty pedestal). */
  item: ItemDef | null;
  /** The part a projection left (type 'part') or the flask a laboratory brewed (type 'flask'). */
  carried: PartDef | Flask | null;
  heart: HeartKind;
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

/** Downward acceleration of falling pickups, blocks per second squared. */
export const PICKUP_GRAVITY = 22;

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
  const m = buildSeed();
  m.root.userData.seed = m;
  return m.root;
}

interface HeartAssets { geo: THREE.BoxGeometry; mats: Map<string, THREE.Material>; glow: THREE.SpriteMaterial | null }
const heartAssets = new Map<HeartKind, HeartAssets>();

/** One geometry and one material per colour of each heart kind, shared by every pickup of that kind. */
function heartAssetsOf(kind: HeartKind): HeartAssets {
  let a = heartAssets.get(kind);
  if (a) return a;
  const art = HEART_PICKUP[kind];
  const w = Math.max(...art.rows.map(r => r.length)), c = 0.4 / w;
  const mats = new Map<string, THREE.Material>();
  for (const k of new Set(art.rows.join('').replace(/\./g, ''))) {
    if (!art.palette[k]) continue;
    mats.set(k, art.lit.includes(k)
      ? new THREE.MeshBasicMaterial({ color: pal(art.palette[k]) })
      : new THREE.MeshLambertMaterial({ color: pal(art.palette[k]), emissive: pal(art.emissive) }));
  }
  const glow = kind === 'red' ? null : new THREE.SpriteMaterial({ map: glowTexture(), color: pal(HEART_FX[kind]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 });
  a = { geo: new THREE.BoxGeometry(c, c, 0.1), mats, glow };
  heartAssets.set(kind, a);
  return a;
}

function heartMesh(kind: HeartKind = 'red'): THREE.Object3D {
  const g = new THREE.Group();
  const art = HEART_PICKUP[kind];
  const { geo, mats, glow } = heartAssetsOf(kind);
  const w = Math.max(...art.rows.map(r => r.length)), c = 0.4 / w, top = 0.36;
  art.rows.forEach((r, j) => [...r].forEach((ch, i) => {
    const m = mats.get(ch);
    if (!m) return;
    const cube = new THREE.Mesh(geo, m);
    cube.position.set((i - (w - 1) / 2) * c, top - j * c, 0);
    g.add(cube);
  }));
  if (glow) {
    const s = new THREE.Sprite(glow);
    s.scale.set(0.9, 0.9, 1);
    s.position.y = top - (art.rows.length - 1) * c / 2;
    s.name = 'glow';
    g.add(s);
  }
  return g;
}

function partMesh(def: Pick<PartDef, 'id' | 'icon'>): THREE.Object3D {
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
export function pickupMesh(type: PickupKind, heart: HeartKind = 'red'): THREE.Object3D {
  return type === 'key' ? keyMesh() : type === 'bomb' ? bombMesh() : heartMesh(heart);
}

export class Pickups {
  readonly list: Pickup[] = [];
  private group = new THREE.Group();
  private time = 0;
  heartKind: ((y: number) => HeartKind) | null = null;

  constructor(private scene: THREE.Object3D) { scene.add(this.group); }

  dispose() { this.scene.remove(this.group); }

  add(type: PickupType, x: number, y: number, z: number, room: number, item: ItemDef | null = null, delay = 0, carried: PartDef | Flask | null = null, heart?: HeartKind): Pickup {
    const kind: HeartKind = type === 'heart' ? heart ?? this.heartKind?.(y) ?? 'red' : 'red';
    const obj = type === 'key' ? keyMesh() : type === 'bomb' ? bombMesh() : type === 'heart' ? heartMesh(kind) : (type === 'part' || type === 'flask') && carried ? partMesh(carriedDef(carried)) : pedestalItem(item);
    obj.position.set(x, y, z);
    this.group.add(obj);
    const p: Pickup = { type, x, y, z, vx: 0, vy: type === 'item' ? 0 : 3, vz: 0, flying: false, room, item, carried, heart: kind, taken: false, delay, age: 0, obj };
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
    const seed = p.obj.userData.seed as SeedModel | undefined;
    if (seed) disposeSeed(seed);
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
          p.vy -= PICKUP_GRAVITY * dt;
          let ny = p.y + p.vy * dt;
          if (p.vy < 0 && solid(Math.floor(p.x), Math.floor(ny), Math.floor(p.z))) { ny = Math.floor(ny) + 1; p.vy = 0; }
          p.y = ny;
          if (p.y < -10) { this.take(p); continue; }
        } else if (p.flying) { p.flying = false; p.vx = 0; p.vz = 0; }
      }
      const seed = p.obj.userData.seed as SeedModel | undefined;
      if (seed) breatheSeed(seed, this.time + p.x);
      p.obj.rotation.y = this.time * (p.type === 'heart' && p.heart === 'star' ? 3.2 : 1.6) + p.x;
      if (p.type === 'heart' && p.age >= POP_IN && (p.heart === 'blood' || p.heart === 'berserker')) {
        const hz = p.heart === 'blood' ? 0.7 : 1.4;
        const beat = Math.max(0, Math.sin(this.time * Math.PI * 2 * hz + p.x)) ** 6;
        p.obj.scale.setScalar(1 + beat * (p.heart === 'blood' ? 0.14 : 0.22));
      }
      const bob = Math.sin(this.time * 2.2 + p.x) * (p.type === 'item' ? 0.08 : 0.04);
      p.obj.position.set(p.x, p.y + (p.type === 'item' ? 0.55 : p.type === 'part' || p.type === 'flask' ? 0.3 : 0.12) + bob, p.z);
      if (p.type === 'item') {
        p.obj.rotation.y = 0;
        const glow = p.obj.getObjectByName('glow') as THREE.Sprite | undefined;
        if (glow) { const k = 1.25 + Math.sin(this.time * 3) * 0.1; glow.scale.set(k, k, 1); }
      }
    }
  }
}
