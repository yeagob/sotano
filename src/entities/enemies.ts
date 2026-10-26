// The enemy system: projections materialise at the centre of their room, move with the room's
// flow field, stay leashed to their room, throw projectiles and dissolve when beaten.
// Rules and numbers come from the definitions (src/content/enemies); every outcome that items
// could care about goes back to the game through `EnemyHost`, which emits the events.

import { fx } from '../core/fx';
import * as THREE from 'three';
import { ROOM_D, ROOM_W } from '../content/rooms';
import { FlowField, type RoomArea } from '../enemies/flowfield';
import type { Enemy, EnemyCtx, EnemyDef, TargetView } from '../enemies/types';
import { hostile, type Actor } from './actors';
import { boxHits, moveBody } from '../physics/voxel-collide';

const GRAVITY = 26;
export const SPAWN_TIME = 0.9;
const PROJECTILE_GRAVITY = 14;
/** Seconds between target choices, and how much closer (blocks) a new target must be to switch. */
const RETARGET = 0.25;
const RETARGET_MARGIN = 1.5;

type Solid = (x: number, y: number, z: number) => boolean;

export interface EnemyHost {
  solid: Solid;
  worldVersion(): number;
  /** Every actor (the player and projections, any side). */
  actors(): Iterable<Actor>;
  actor(id: number): Actor | undefined;
  room(id: number): RoomArea;
  /** This enemy touches an actor it is hostile to (the game emits `contact`, rate-limited). */
  contact(e: Enemy, target: Actor): void;
  /** A projectile reached an actor hostile to its thrower (`thrower` is the thrower's actor id). */
  projectileHit(target: Actor, damage: number, thrower: number): void;
  /** A projectile hit a block: return true if it broke it (soft blocks only). */
  projectileBlock(x: number, y: number, z: number): boolean;
  burst(e: Enemy, radius: number): void;
  died(e: Enemy): void;
  particles(x: number, y: number, z: number, color: number, n: number, speed: number, size: number): void;
}

interface Projectile { x: number; y: number; z: number; vx: number; vy: number; vz: number; age: number; damage: number; thrower: number; faction: Actor['faction'] }

interface View { group: THREE.Group; parts: Map<string, THREE.Object3D[]>; mats: THREE.MeshLambertMaterial[] }

export class Enemies {
  readonly list: Enemy[] = [];
  private views = new Map<number, View>();
  private flows = new Map<string, FlowField>();
  private lastDt = 0;
  private projectiles: Projectile[] = [];
  private projMesh: THREE.InstancedMesh;
  private group = new THREE.Group();
  private m = new THREE.Matrix4();
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

  /** Creates an enemy (already approved by `enemySpawn`). It materialises over SPAWN_TIME. */
  spawn(def: EnemyDef, id: number, room: number, x: number, y: number, z: number, hp: number, speed: number, contactDamage: number, tags: Set<string>) {
    const e: Enemy = {
      id, kind: 'projection', def: def.id, spec: def, faction: 'projection', room, hp, maxHp: hp, speed, contactDamage, tags,
      body: { x, y, z, vx: 0, vy: 0, vz: 0, hw: def.size[0], h: def.size[1], onGround: false },
      spawning: SPAWN_TIME, targetId: -1, retarget: 0, state: 'move', timer: 1 + (id % 3) * 0.4, wishX: 0, wishZ: 0, flash: 0, pulse: 0, alive: true,
    };
    this.list.push(e);
    this.views.set(id, this.buildView(def));
    return e;
  }

  get(id: number) { return this.list.find(e => e.id === id && e.alive); }

  /** Projections of a room that keep its doors shut: alive and still hostile (allies don't count). */
  blockingIn(room: number) { return this.list.filter(e => e.alive && e.room === room && e.faction === 'projection').length; }

  /** Id of a hittable enemy touching the sphere (and passing `filter`), or -1. */
  at(x: number, y: number, z: number, r: number, filter?: (e: Enemy) => boolean): number {
    for (const e of this.list) {
      if (!e.alive || e.spawning > 0 || (filter && !filter(e))) continue;
      const b = e.body;
      if (Math.abs(x - b.x) < b.hw + r && Math.abs(z - b.z) < b.hw + r && y > b.y - r && y < b.y + b.h + r) return e.id;
    }
    return -1;
  }

  /** Applies damage already approved by `actorDamage`; returns true if it dissolved. */
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
    for (const p of e.spec.model) this.host.particles(b.x + p.pos[0], b.y + p.pos[1], b.z + p.pos[2], p.color, 3, 3, 0.12);
    const v = this.views.get(e.id);
    if (v) { this.group.remove(v.group); this.views.delete(e.id); }
    this.host.died(e);
  }

  update(dt: number) {
    this.time += dt;
    this.lastDt = dt;
    const host = this.host;
    const actors = [...host.actors()];
    const ctx: EnemyCtx = {
      dt,
      target: e => this.target(e, actors),
      dist: (e, t) => Math.hypot(t.x - e.body.x, t.z - e.body.z),
      toward: (e, t) => this.toward(e, t),
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
          host.particles(b.x + Math.cos(a) * r, b.y + 0.2 + fx.random() * 1.4, b.z + Math.sin(a) * r, e.spec.model[0].color, 1, 0.6, 0.08);
        }
        if (e.spawning <= 0) {
          // step off the spawn spot so a queue of spawns doesn't stack
          const a = (e.id * 2.39996) % (Math.PI * 2);
          b.vx = Math.cos(a) * 2.5; b.vz = Math.sin(a) * 2.5;
        }
        this.draw(e);
        continue;
      }
      e.spec.behaviour.update(e, ctx);
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
      // touching actors it is hostile to (the game rate-limits each pair)
      for (const a of actors) {
        if (a === e || !a.alive || a.spawning > 0 || !hostile(e.faction, a.faction)) continue;
        const o = a.body;
        if (Math.abs(o.x - b.x) < o.hw + b.hw && Math.abs(o.z - b.z) < o.hw + b.hw && o.y < b.y + b.h && o.y + o.h > b.y) host.contact(e, a);
      }
      e.flash = Math.max(0, e.flash - dt);
      this.draw(e);
    }
    this.updateProjectiles(dt, actors);
    // forget the dead
    for (let i = this.list.length - 1; i >= 0; i--) if (!this.list[i].alive) this.list.splice(i, 1);
  }

  /**
   * The nearest live actor hostile to `e`, preferring its own room. Chosen at 4 Hz, and only
   * switched for one at least RETARGET_MARGIN blocks closer, so equidistant targets don't jitter.
   */
  private target(e: Enemy, actors: Actor[]): TargetView | null {
    const valid = (a: Actor | undefined) => !!a && a.alive && a.spawning <= 0 && hostile(e.faction, a.faction);
    const cost = (a: Actor) => Math.hypot(a.body.x - e.body.x, a.body.z - e.body.z) + (a.room === e.room ? 0 : 20);
    let cur = e.targetId >= 0 ? this.host.actor(e.targetId) : undefined;
    if (!valid(cur)) { cur = undefined; e.targetId = -1; e.retarget = 0; }
    e.retarget -= this.lastDt;
    if (e.retarget <= 0) {
      e.retarget = RETARGET;
      let best: Actor | undefined, bestCost = Infinity;
      for (const a of actors) {
        if (a === e || !valid(a)) continue;
        const c = cost(a);
        if (c < bestCost) { best = a; bestCost = c; }
      }
      if (best && (!cur || bestCost < cost(cur) - RETARGET_MARGIN)) { cur = best; e.targetId = best.id; }
    }
    return cur ? { id: cur.id, x: cur.body.x, y: cur.body.y, z: cur.body.z } : null;
  }

  /** Flow-field direction inside the enemy's room (one field per room and target); straight line otherwise. */
  private toward(e: Enemy, t: TargetView): [number, number] {
    const b = e.body, tx = t.x, tz = t.z;
    const key = `${e.room}:${t.id}`;
    let f = this.flows.get(key);
    if (!f) {
      if (this.flows.size > 128) this.flows.clear(); // fields are tiny; just drop stale ones now and then
      f = new FlowField(this.host.room(e.room));
      this.flows.set(key, f);
    }
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
      x: sx, y: sy, z: sz, vx: dx / t, vz: dz / t, vy: (ty - sy + 0.5 * PROJECTILE_GRAVITY * t * t) / t, age: 0, damage: 4, thrower: e.id, faction: e.faction,
    });
    if (this.projectiles.length > 64) this.projectiles.shift();
  }

  private updateProjectiles(dt: number, actors: Actor[]) {
    let n = 0;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      p.vy -= PROJECTILE_GRAVITY * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      let dead = p.age > 5;
      // the first actor hostile to the thrower's side that it touches
      const hit = actors.find(a => a.alive && a.spawning <= 0 && a.id !== p.thrower && hostile(p.faction, a.faction)
        && Math.abs(p.x - a.body.x) < a.body.hw + 0.12 && Math.abs(p.z - a.body.z) < a.body.hw + 0.12 && p.y > a.body.y && p.y < a.body.y + a.body.h);
      if (hit) {
        this.host.projectileHit(hit, p.damage, p.thrower);
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
    const v = this.views.get(e.id);
    if (!v) return;
    const b = e.body;
    v.group.position.set(b.x, b.y, b.z);
    // face its target (or keep the last heading)
    const t = e.targetId >= 0 ? this.host.actor(e.targetId) : undefined;
    if (t) v.group.rotation.y = Math.atan2(t.body.x - b.x, t.body.z - b.z);
    // materialise: grow from nothing with a wobble
    const grow = e.spawning > 0 ? Math.max(0.05, 1 - e.spawning / SPAWN_TIME) : 1;
    const pulse = 1 + e.pulse * 0.35;
    v.group.scale.set(grow * pulse, grow * (1 + e.pulse * 0.2), grow * pulse);
    // walk cycle on named limbs
    const walk = Math.sin(this.time * 9 + e.id) * Math.min(1, Math.hypot(b.vx, b.vz) / 2) * 0.5;
    for (const l of v.parts.get('legL') ?? []) l.rotation.x = walk;
    for (const l of v.parts.get('legR') ?? []) l.rotation.x = -walk;
    for (const l of v.parts.get('armL') ?? []) l.rotation.x = -walk * 0.6;
    for (const l of v.parts.get('armR') ?? []) l.rotation.x = walk * 0.6;
    // hit flash and Panic's colour shift
    for (const m of v.mats) {
      // white on hit; otherwise a red heat that builds as it winds up or swells.
      // Allies (part of the self) glow a steady warm gold.
      if (e.flash > 0) m.emissive.setRGB(0.9, 0.9, 0.9);
      else if (e.faction === 'self') m.emissive.setRGB(0.32 + e.pulse * 0.4, 0.24, 0.05);
      else m.emissive.setRGB(e.pulse * 0.75, e.pulse * 0.06, 0);
    }
  }
}
