// The enemy system: projections materialise at the centre of their room, move with the room's
// flow field, stay leashed to their room, throw projectiles and dissolve when beaten.
// Rules and numbers come from the definitions (src/content/enemies); every outcome that items
// could care about goes back to the game through `EnemyHost`, which emits the events.

import { fx } from '../core/fx';
import * as THREE from 'three';
import { ROOM_D, ROOM_W } from '../content/rooms';
import { FlowField, type RoomArea } from '../enemies/flowfield';
import type { Enemy, EnemyCtx, EnemyDef } from '../enemies/types';
import { boxHits, moveBody } from '../physics/voxel-collide';

const GRAVITY = 26;
export const SPAWN_TIME = 0.9;
const PROJECTILE_GRAVITY = 14;

type Solid = (x: number, y: number, z: number) => boolean;

export interface EnemyHost {
  solid: Solid;
  worldVersion(): number;
  player(): { x: number; y: number; z: number; hw: number; h: number };
  room(id: number): RoomArea;
  /** The player and this enemy are touching (the game emits `enemyContact`). */
  contact(e: Enemy): void;
  /** A projectile reached the player. `thrower` is the uid of the enemy that threw it. */
  projectileHit(damage: number, thrower: number): void;
  /** A projectile hit a block: return true if it broke it (soft blocks only). */
  projectileBlock(x: number, y: number, z: number): boolean;
  burst(e: Enemy, radius: number): void;
  died(e: Enemy): void;
  particles(x: number, y: number, z: number, color: number, n: number, speed: number, size: number): void;
}

interface Projectile { x: number; y: number; z: number; vx: number; vy: number; vz: number; age: number; damage: number; thrower: number }

interface View { group: THREE.Group; parts: Map<string, THREE.Object3D[]>; mats: THREE.MeshLambertMaterial[] }

export class Enemies {
  readonly list: Enemy[] = [];
  private views = new Map<number, View>();
  private flows = new Map<number, FlowField>();
  private projectiles: Projectile[] = [];
  private projMesh: THREE.InstancedMesh;
  private group = new THREE.Group();
  private m = new THREE.Matrix4();
  private nextUid = 1;
  private time = 0;

  constructor(private scene: THREE.Scene, private host: EnemyHost) {
    scene.add(this.group);
    this.projMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.22, 0.22),
      new THREE.MeshBasicMaterial({ color: 0xe9e2d6 }), 64);
    this.projMesh.frustumCulled = false;
    this.projMesh.count = 0;
    scene.add(this.projMesh);
  }

  dispose() {
    this.scene.remove(this.group);
    this.scene.remove(this.projMesh);
  }

  newUid() { return this.nextUid++; }

  /** Creates an enemy (already approved by `enemySpawn`). It materialises over SPAWN_TIME. */
  spawn(def: EnemyDef, uid: number, room: number, x: number, y: number, z: number, hp: number, speed: number, contactDamage: number, tags: Set<string>) {
    const e: Enemy = {
      uid, def, room, hp, maxHp: hp, speed, contactDamage, tags,
      body: { x, y, z, vx: 0, vy: 0, vz: 0, hw: def.size[0], h: def.size[1], onGround: false },
      spawning: SPAWN_TIME, state: 'move', timer: 1 + (uid % 3) * 0.4, wishX: 0, wishZ: 0, flash: 0, pulse: 0, alive: true,
    };
    this.list.push(e);
    this.views.set(uid, this.buildView(def));
    return e;
  }

  get(uid: number) { return this.list.find(e => e.uid === uid && e.alive); }

  /** Enemies of a room that are still alive (wherever they wandered). */
  aliveIn(room: number) { return this.list.filter(e => e.alive && e.room === room).length; }

  /** Uid of a hittable enemy touching the sphere, or -1. */
  at(x: number, y: number, z: number, r: number): number {
    for (const e of this.list) {
      if (!e.alive || e.spawning > 0) continue;
      const b = e.body;
      if (Math.abs(x - b.x) < b.hw + r && Math.abs(z - b.z) < b.hw + r && y > b.y - r && y < b.y + b.h + r) return e.uid;
    }
    return -1;
  }

  /** Applies damage already approved by `enemyDamage`; returns true if it dissolved. */
  hurt(e: Enemy, amount: number, kx: number, kz: number) {
    e.hp -= amount;
    e.flash = 0.15;
    e.body.vx += kx; e.body.vz += kz;
    if (e.hp <= 0) { this.kill(e); return true; }
    return false;
  }

  kill(e: Enemy) {
    if (!e.alive) return;
    e.alive = false;
    const b = e.body;
    // dissolve into the cubes it was made of
    for (const p of e.def.model) this.host.particles(b.x + p.pos[0], b.y + p.pos[1], b.z + p.pos[2], p.color, 3, 3, 0.12);
    const v = this.views.get(e.uid);
    if (v) { this.group.remove(v.group); this.views.delete(e.uid); }
    this.host.died(e);
  }

  update(dt: number) {
    this.time += dt;
    const host = this.host, pl = host.player();
    const ctx: EnemyCtx = {
      dt,
      player: pl,
      dist: e => Math.hypot(pl.x - e.body.x, pl.z - e.body.z),
      towardPlayer: e => this.toward(e, pl.x, pl.z),
      shootAt: (e, x, y, z) => this.shoot(e, x, y, z),
      burst: (e, r) => host.burst(e, r),
      kill: e => this.kill(e),
    };
    for (const e of this.list) {
      if (!e.alive) continue;
      const b = e.body;
      if (e.spawning > 0) {
        // materialising: cubes converge on the spot, harmless and unhittable
        e.spawning -= dt;
        if (fx.random() < 0.6) {
          const a = fx.random() * Math.PI * 2, r = 1.2 + fx.random();
          host.particles(b.x + Math.cos(a) * r, b.y + 0.2 + fx.random() * 1.4, b.z + Math.sin(a) * r, e.def.model[0].color, 1, 0.6, 0.08);
        }
        if (e.spawning <= 0) {
          // step off the spawn spot so a queue of spawns doesn't stack
          const a = (e.uid * 2.39996) % (Math.PI * 2);
          b.vx = Math.cos(a) * 2.5; b.vz = Math.sin(a) * 2.5;
        }
        this.draw(e);
        continue;
      }
      e.def.behaviour.update(e, ctx);
      // leash: an enemy that wandered out of its room heads back to the centre
      const rm = host.room(e.room);
      const inside = b.x > rm.x0 - 0.5 && b.x < rm.x0 + ROOM_W + 0.5 && b.z > rm.z0 - 0.5 && b.z < rm.z0 + ROOM_D + 0.5;
      if (!inside) {
        const dx = rm.x0 + ROOM_W / 2 - b.x, dz = rm.z0 + ROOM_D / 2 - b.z, l = Math.hypot(dx, dz) || 1;
        e.wishX = dx / l; e.wishZ = dz / l;
      }
      const blend = 1 - Math.exp(-(b.onGround ? 10 : 2) * dt);
      b.vx += (e.wishX * e.speed - b.vx) * blend;
      b.vz += (e.wishZ * e.speed - b.vz) * blend;
      b.vy = Math.max(b.vy - GRAVITY * dt, -30);
      const wantX = b.vx, wantZ = b.vz;
      moveBody(host.solid, b, dt);
      // blocked while walking: hop up one block if there is room
      if (b.onGround && (Math.abs(wantX) > 0.3 && b.vx === 0 || Math.abs(wantZ) > 0.3 && b.vz === 0)) {
        const fx = b.x + Math.sign(wantX) * (b.hw + 0.2), fz = b.z + Math.sign(wantZ) * (b.hw + 0.2);
        if (!boxHits(host.solid, fx, b.y + 1.05, fz, b.hw, b.h)) b.vy = 7.6;
      }
      if (b.y < -10) { this.kill(e); continue; }
      // touching the player
      if (Math.abs(pl.x - b.x) < pl.hw + b.hw && Math.abs(pl.z - b.z) < pl.hw + b.hw && pl.y < b.y + b.h && pl.y + pl.h > b.y)
        host.contact(e);
      e.flash = Math.max(0, e.flash - dt);
      this.draw(e);
    }
    this.updateProjectiles(dt, pl);
    // forget the dead
    for (let i = this.list.length - 1; i >= 0; i--) if (!this.list[i].alive) this.list.splice(i, 1);
  }

  /** Flow-field direction inside the enemy's room; straight line otherwise. */
  private toward(e: Enemy, tx: number, tz: number): [number, number] {
    const b = e.body;
    let f = this.flows.get(e.room);
    if (!f) { f = new FlowField(this.host.room(e.room)); this.flows.set(e.room, f); }
    f.update(this.host.solid, tx, tz, this.host.worldVersion());
    const d = f.direction(b.x, b.z);
    if (d) return d;
    const dx = tx - b.x, dz = tz - b.z, l = Math.hypot(dx, dz) || 1;
    return [dx / l, dz / l];
  }

  /** A lobbed projectile that lands on the target point. */
  private shoot(e: Enemy, tx: number, ty: number, tz: number) {
    const b = e.body;
    const sx = b.x, sy = b.y + b.h * 0.75, sz = b.z;
    const dx = tx - sx, dz = tz - sz, d = Math.hypot(dx, dz);
    const t = Math.max(0.5, d / 9);
    this.projectiles.push({
      x: sx, y: sy, z: sz, vx: dx / t, vz: dz / t, vy: (ty - sy + 0.5 * PROJECTILE_GRAVITY * t * t) / t, age: 0, damage: 1, thrower: e.uid,
    });
    if (this.projectiles.length > 64) this.projectiles.shift();
  }

  private updateProjectiles(dt: number, pl: { x: number; y: number; z: number; hw: number; h: number }) {
    let n = 0;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      p.vy -= PROJECTILE_GRAVITY * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      let dead = p.age > 5;
      if (Math.abs(p.x - pl.x) < pl.hw + 0.12 && Math.abs(p.z - pl.z) < pl.hw + 0.12 && p.y > pl.y && p.y < pl.y + pl.h) {
        this.host.projectileHit(p.damage, p.thrower);
        dead = true;
      } else if (this.host.solid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) {
        this.host.projectileBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
        this.host.particles(p.x, p.y, p.z, 0xe9e2d6, 6, 2, 0.06);
        dead = true;
      }
      if (dead) { this.projectiles.splice(i, 1); continue; }
    }
    for (const p of this.projectiles) {
      this.m.makeRotationY(p.age * 8).setPosition(p.x, p.y, p.z);
      this.projMesh.setMatrixAt(n++, this.m);
    }
    this.projMesh.count = n;
    this.projMesh.instanceMatrix.needsUpdate = true;
  }

  // ───────────────────────── visuals ─────────────────────────

  private buildView(def: EnemyDef): View {
    const group = new THREE.Group();
    const parts = new Map<string, THREE.Object3D[]>();
    const mats: THREE.MeshLambertMaterial[] = [];
    for (const p of def.model) {
      const mat = p.glow ? new THREE.MeshBasicMaterial({ color: p.color }) : new THREE.MeshLambertMaterial({ color: p.color });
      if (!p.glow) mats.push(mat as THREE.MeshLambertMaterial);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...p.size), mat);
      mesh.position.set(...p.pos);
      if (p.tilt) mesh.rotation.x = p.tilt;
      group.add(mesh);
      if (p.name) parts.set(p.name, [...(parts.get(p.name) ?? []), mesh]);
    }
    this.group.add(group);
    return { group, parts, mats };
  }

  private draw(e: Enemy) {
    const v = this.views.get(e.uid);
    if (!v) return;
    const b = e.body;
    v.group.position.set(b.x, b.y, b.z);
    // face the player
    const pl = this.host.player();
    v.group.rotation.y = Math.atan2(pl.x - b.x, pl.z - b.z);
    // materialise: grow from nothing with a wobble
    const grow = e.spawning > 0 ? Math.max(0.05, 1 - e.spawning / SPAWN_TIME) : 1;
    const pulse = 1 + e.pulse * 0.35;
    v.group.scale.set(grow * pulse, grow * (1 + e.pulse * 0.2), grow * pulse);
    // walk cycle on named limbs
    const walk = Math.sin(this.time * 9 + e.uid) * Math.min(1, Math.hypot(b.vx, b.vz) / 2) * 0.5;
    for (const l of v.parts.get('legL') ?? []) l.rotation.x = walk;
    for (const l of v.parts.get('legR') ?? []) l.rotation.x = -walk;
    for (const l of v.parts.get('armL') ?? []) l.rotation.x = -walk * 0.6;
    for (const l of v.parts.get('armR') ?? []) l.rotation.x = walk * 0.6;
    // hit flash and Panic's colour shift
    for (const m of v.mats) {
      // white on hit; otherwise a red heat that builds as it winds up or swells
      if (e.flash > 0) m.emissive.setRGB(0.9, 0.9, 0.9);
      else m.emissive.setRGB(e.pulse * 0.75, e.pulse * 0.06, 0);
    }
  }
}
