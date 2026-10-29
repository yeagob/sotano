// could care about goes back to the game through `EnemyHost`, which emits the events.

import { fx } from '../core/fx';
import * as THREE from 'three';
import { pal } from '../content/palette';
import { ROOM_D, ROOM_W } from '../content/rooms';
import { FlowField, type RoomArea } from '../enemies/flowfield';
import { Hazards, shapePoint, type FieldEffect, type HazardHost, type Shape, type Strike } from '../enemies/attacks';
import type { Enemy, EnemyCtx, EnemyDef, TargetView } from '../enemies/types';
import { hostile, type Actor } from './actors';
import { boxHits, moveBody } from '../physics/voxel-collide';

const GRAVITY = 26;
export const SPAWN_TIME = 0.9;
const LOB_GRAVITY = 14;
/** Seconds between target choices, and how much closer (blocks) a new target must be to switch. */
const RETARGET = 0.25;
const RETARGET_MARGIN = 1.5;
const FLY_GAIN = 3;
const FLY_MAX = 4;
const NO_SOLID = () => false;
/** Hostile projectiles alive at once (a boss volley is up to a few dozen). */
const MAX_PROJECTILES = 128;
/** A stone dropped from the ceiling falls under the debris gravity (physics/debris.ts). */
const DROP_GRAVITY = 26;

type Solid = (x: number, y: number, z: number) => boolean;

export interface EnemyHost {
  solid: Solid;
  worldVersion(): number;
  /** Every actor (the player and projections, any side). */
  actors(): Iterable<Actor>;
  actor(id: number): Actor | undefined;
  room(id: number): RoomArea;
  /** Elements version (flow fields rebuild when a hazard appears or goes). */
  elemVersion(): number;
  /** How `e` treats the element standing at this cell (feet), or null if there is none. */
  hazard(e: Enemy, x: number, y: number, z: number): 'avoid' | 'cross' | 'dwell' | null;
  /** This enemy touches an actor it is hostile to (the game emits `contact`, rate-limited). */
  contact(e: Enemy, target: Actor): void;
  /** A projectile reached an actor hostile to its thrower (`thrower` is the thrower's actor id). */
  projectileHit(target: Actor, damage: number, thrower: number): void;
  /** A projectile hit a block: return true if it broke it (soft blocks only). */
  projectileBlock(x: number, y: number, z: number): boolean;
  smash(e: Enemy, x: number, y: number, z: number, tier: number, damage: number): boolean;
  burst(e: Enemy, radius: number): void;
  died(e: Enemy): void;
  particles(x: number, y: number, z: number, color: number, n: number, speed: number, size: number): void;
  hurtActor(target: Actor, amount: number, cause: string, owner: number): void;
  affectActor(target: Actor, effect: FieldEffect, seconds: number): void;
  arena(e: Enemy, what: string): void;
  summon(e: Enemy, defIds: string[]): void;
  cue(kind: string, x: number, y: number, z: number): void;
  /** A heavy impact: the screen shakes by distance to the player, the floor at the point spits chips. */
  quake(x: number, y: number, z: number, power: number): void;
  /** A stone of the room falls loose from (x, y, z) (a boss's rockfall): a loose cube. */
  drop(e: Enemy, x: number, y: number, z: number): void;
}

interface Projectile { x: number; y: number; z: number; vx: number; vy: number; vz: number; age: number; damage: number; thrower: number; faction: Actor['faction']; gravity: number }

export interface View {
  group: THREE.Group; parts: Map<string, THREE.Object3D[]>; mats: THREE.MeshLambertMaterial[];
  /** Glowing parts named 'tell' or 'core', and their idle colours. */
  tells: THREE.MeshBasicMaterial[]; tellBase: THREE.Color[];
}

const TELL_HOT = new THREE.Color(pal('cold.white'));
const HURT_FLASH = new THREE.Color(pal('cold.dim')).multiplyScalar(0.5);
const ALLY_GLOW = new THREE.Color(pal('light.ember')).multiplyScalar(0.25);
/** A projection warming toward your side: your light held captive inside it (DECISIONS §2), so the
 *  dim captive ramp, never gold: gold on a living projection would read as an ally. At the highest
 *  warmth it can show (0.8) it stays under half the dimmest ally glow (docs/reviews/polarity.md). */
const WARM_GLOW = new THREE.Color(pal('captive.ember')).multiplyScalar(0.35);

export function buildModel(def: EnemyDef): View {
  const group = new THREE.Group();
  const parts = new Map<string, THREE.Object3D[]>();
  const mats: THREE.MeshLambertMaterial[] = [];
  const tells: THREE.MeshBasicMaterial[] = [];
  for (const p of def.model) {
    const mat = p.glow ? new THREE.MeshBasicMaterial({ color: p.color }) : new THREE.MeshLambertMaterial({ color: p.color });
    if (!p.glow) mats.push(mat as THREE.MeshLambertMaterial);
    else if (p.name === 'tell' || p.name === 'core') tells.push(mat as THREE.MeshBasicMaterial);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...p.size), mat);
    mesh.position.set(...p.pos);
    if (p.rot) mesh.rotation.set(...p.rot);
    else if (p.tilt) mesh.rotation.x = p.tilt;
    const parent = p.parent ? parts.get(p.parent)?.[0] : undefined;
    (parent ?? group).add(mesh);
    if (p.name) parts.set(p.name, [...(parts.get(p.name) ?? []), mesh]);
  }
  return { group, parts, mats, tells, tellBase: tells.map(m => m.color.clone()) };
}

export class Enemies {
  readonly list: Enemy[] = [];
  private views = new Map<number, View>();
  private flows = new Map<string, FlowField>();
  private lastDt = 0;
  private projectiles: Projectile[] = [];
  private projMesh: THREE.InstancedMesh;
  private group = new THREE.Group();
  private hazards: Hazards;
  private m = new THREE.Matrix4();
  private euler = new THREE.Euler();
  private time = 0;
  /** Stones on their way down from the ceiling: each becomes a loose cube `t` seconds before it lands. */
  private drops: { owner: number; x: number; y: number; z: number; t: number }[] = [];
  private boltCued = -1;

  constructor(private scene: THREE.Scene, private host: EnemyHost) {
    scene.add(this.group);
    this.projMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.22, 0.22),
      new THREE.MeshBasicMaterial({ color: pal('cold.body') }), MAX_PROJECTILES);
    this.projMesh.frustumCulled = false;
    this.projMesh.count = 0;
    scene.add(this.projMesh);
    const hazardHost: HazardHost = {
      actors: () => host.actors(),
      hurt: (t, dmg, cause, owner) => host.hurtActor(t, dmg, cause, owner),
      affect: (t, effect, seconds) => host.affectActor(t, effect, seconds),
      push: (t, vx, vz) => { t.body.vx += vx; t.body.vz += vz; },
      live: (shape: Shape) => { const [x, y, z] = shapePoint(shape); host.cue(shape.kind, x, y, z); },
      particles: (x, y, z, c, n, s, size) => host.particles(x, y, z, c, n, s, size),
    };
    this.hazards = new Hazards(scene, hazardHost);
  }

  dispose() {
    this.scene.remove(this.group);
    this.scene.remove(this.projMesh);
    this.hazards.dispose();
    this.group.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); } });
  }

  spawn(def: EnemyDef, id: number, room: number, x: number, y: number, z: number, hp: number, speed: number, contactDamage: number, tags: Set<string>) {
    const e: Enemy = {
      id, kind: 'projection', def: def.id, spec: def, faction: 'projection', room, hp, maxHp: hp, speed, contactDamage, tags,
      body: { x, y, z, vx: 0, vy: 0, vz: 0, hw: def.size[0], h: def.size[1], onGround: false },
      spawning: SPAWN_TIME, targetId: -1, retarget: 0, state: 'move', armed: true, timer: 1 + (id % 3) * 0.4, wishX: 0, wishZ: 0, flash: 0, pulse: 0, alive: true,
      elemSpeed: 1, inElement: null, elemT: 0, warmth: 0,
      hidden: false, stage: 0, hold: 0, aimX: 0, aimZ: 0, flyY: -1, ghost: false, seq: 0, clock: 0, move: -1, act: 0,
    };
    this.list.push(e);
    this.views.set(id, this.buildView(def));
    return e;
  }

  get(id: number) { return this.list.find(e => e.id === id && e.alive); }

  /** Attacks on the field and hostile projectiles in the air (the sandbox duel measures them). */
  pressure() { return { hazards: this.hazards.size, projectiles: this.projectiles.length }; }

  /** Projections of a room that keep its doors shut: alive and still hostile (allies don't count). */
  blockingIn(room: number) { return this.list.filter(e => e.alive && e.room === room && e.faction === 'projection').length; }

  /** Id of a hittable enemy touching the sphere (and passing `filter`), or -1. */
  at(x: number, y: number, z: number, r: number, filter?: (e: Enemy) => boolean): number {
    for (const e of this.list) {
      if (!e.alive || e.spawning > 0 || e.hidden || e.tags.has('shut') || (filter && !filter(e))) continue;
      const b = e.body;
      if (Math.abs(x - b.x) < b.hw + r && Math.abs(z - b.z) < b.hw + r && y > b.y - r && y < b.y + b.h + r) return e.id;
    }
    return -1;
  }

  hurt(e: Enemy, amount: number, kx: number, kz: number) {
    e.hp -= amount * (1 - (e.spec.armor ?? 0));
    e.clock = 0;
    e.flash = 0.15;
    e.body.vx += kx; e.body.vz += kz;
    if (e.hp > 0) return false;
    if (e.spec.kind === 'creature') { e.hp = 1; this.hide(e, true); return false; }
    this.kill(e);
    return true;
  }

  hideRoom(room: number, hidden: boolean) {
    for (const e of this.list) {
      if (!e.alive || e.room !== room || e.spec.kind !== 'creature') continue;
      if (!hidden) e.hp = e.maxHp;
      this.hide(e, hidden);
    }
  }

  kill(e: Enemy) {
    if (!e.alive) return;
    e.alive = false;
    const b = e.body;
    // release (docs/art/DECISIONS.md §8.6): host chips fall, light rises; no gore, no flash
    for (const p of e.spec.model.slice(0, 8)) if (!p.glow) this.host.particles(b.x + p.pos[0], b.y + p.pos[1], b.z + p.pos[2], p.color, 3, 3, 0.12);
    this.host.particles(b.x, b.y + b.h * 0.6, b.z, pal('light.gold'), 12, 1.6, 0.05);
    this.hazards.clear(e.id);
    this.drops = this.drops.filter(d => d.owner !== e.id);
    const v = this.views.get(e.id);
    if (v) {
      this.group.remove(v.group);
      // free its GPU memory: every part has its own geometry and material
      v.group.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as THREE.Material).dispose(); } });
      this.views.delete(e.id);
    }
    this.host.died(e);
  }

  hide(e: Enemy, hidden: boolean) {
    if (e.hidden === hidden) return;
    e.hidden = hidden;
    const v = this.views.get(e.id);
    if (v) v.group.visible = !hidden;
    if (hidden) this.host.particles(e.body.x, e.body.y + 0.4, e.body.z, pal('mat.dirt.base'), 6, 1.5, 0.06);
  }

  update(dt: number) {
    this.time += dt;
    this.lastDt = dt;
    const host = this.host;
    const actors = [...host.actors()];
    const ctx: EnemyCtx = {
      dt,
      target: e => this.target(e, actors),
      near: e => {
        let best: Actor | null = null, bd = Infinity;
        for (const a of actors) if (a.alive && a.faction === 'self') { const d = Math.hypot(a.body.x - e.body.x, a.body.z - e.body.z); if (d < bd) { bd = d; best = a; } }
        return best ? { id: best.id, x: best.body.x, y: best.body.y, z: best.body.z, vx: best.body.vx, vz: best.body.vz } : null;
      },
      dist: (e, t) => Math.hypot(t.x - e.body.x, t.z - e.body.z),
      toward: (e, t) => this.toward(e, t),
      shootAt: (e, x, y, z) => this.shoot(e, x, y, z),
      burst: (e, r) => host.burst(e, r),
      kill: e => this.kill(e),
      strike: (e, s: Strike) => this.hazards.add(e.id, e.faction, `enemy:${e.def}`, s),
      bolt: (e, dx, dy, dz, speed, damage) => this.bolt(e, dx, dy, dz, speed, damage),
      safe: (e, x, y, z) => this.safeCell(e, x, y, z),
      centre: e => { const rm = host.room(e.room); return [(rm.hx ?? rm.x0) + ROOM_W / 2, (rm.hz ?? rm.z0) + ROOM_D / 2]; },
      quiet: e => this.blockingIn(e.room) === 0,
      others: (e, radius, ids) => this.list.filter(o => o !== e && o.alive && o.room === e.room && ids.includes(o.def)
        && Math.hypot(o.body.x - e.body.x, o.body.z - e.body.z) < radius),
      bounds: e => { const rm = host.room(e.room); return [rm.x0, rm.z0, rm.x0 + (rm.w ?? ROOM_W) - 1, rm.z0 + (rm.d ?? ROOM_D) - 1]; },
      cue: (e, kind) => host.cue(kind, e.body.x, e.body.y, e.body.z),
      hide: (e, hidden) => this.hide(e, hidden),
      arena: (e, what) => host.arena(e, what),
      summon: (e, ids) => host.summon(e, ids),
      quake: (_e, x, y, z, power) => host.quake(x, y, z, power),
      crash: (e, dx, dz) => this.crash(e, dx, dz),
      rain: (e, x, y, z, damage) => this.rain(e, x, y, z, damage),
      rockfall: (e, x, y, z, lead, damage) => this.rockfall(e, x, y, z, lead, damage),
      fx: (x, y, z, c, n, s, size) => host.particles(x, y, z, c, n, s, size),
    };
    this.updateDrops(dt);
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
      if (e.hidden) { b.vx = 0; b.vz = 0; this.draw(e); continue; }
      if (e.hold > 0) { e.hold -= dt; e.wishX = 0; e.wishZ = 0; }
      else e.spec.behaviour.update(e, ctx);
      // leash: an enemy that wandered out of its room heads back to the centre of its home cell (a
      // room's space may be any shape, its home cell is always open)
      const rm = host.room(e.room);
      const rw = rm.w ?? ROOM_W, rd = rm.d ?? ROOM_D;
      const inside = b.x > rm.x0 - 0.5 && b.x < rm.x0 + rw + 0.5 && b.z > rm.z0 - 0.5 && b.z < rm.z0 + rd + 0.5;
      if (!inside) {
        const dx = (rm.hx ?? rm.x0) + ROOM_W / 2 - b.x, dz = (rm.hz ?? rm.z0) + ROOM_D / 2 - b.z, l = Math.hypot(dx, dz) || 1;
        e.wishX = dx / l; e.wishZ = dz / l;
      }
      const blend = 1 - Math.exp(-(b.onGround || e.flyY >= 0 ? 10 : 2) * dt);
      b.vx += (e.wishX * e.speed * e.elemSpeed - b.vx) * blend;
      b.vz += (e.wishZ * e.speed * e.elemSpeed - b.vz) * blend;
      if (e.flyY >= 0) b.vy += Math.max(-FLY_MAX, Math.min(FLY_MAX, (e.flyY - b.y) * FLY_GAIN)) - b.vy;
      else b.vy = Math.max(b.vy - GRAVITY * dt, -30);
      const wantX = b.vx, wantZ = b.vz, wasGround = b.onGround;
      const walls = e.ghost || e.flyY >= 0 ? undefined : this.avoidWalls(e);
      moveBody(e.ghost ? NO_SOLID : host.solid, b, dt, walls);
      if (e.spec.breaks && b.onGround && !wasGround) this.crackBelow(e);
      const blockedX = Math.abs(wantX) > 0.05 && b.vx === 0, blockedZ = Math.abs(wantZ) > 0.05 && b.vz === 0;
      if (b.onGround && (blockedX || blockedZ)) {
        const fx = b.x + Math.sign(wantX) * (b.hw + 0.2), fz = b.z + Math.sign(wantZ) * (b.hw + 0.2);
        if (boxHits(host.solid, fx, b.y, fz, b.hw, b.h) && !boxHits(host.solid, fx, b.y + 1.05, fz, b.hw, b.h)) b.vy = 7.6;
      }
      if (e.spec.breaks && (blockedX || blockedZ)) this.smashAhead(e, Math.sign(wantX) * +blockedX, Math.sign(wantZ) * +blockedZ, dt);
      if (b.y < -10) { this.kill(e); continue; }
      // touching actors it is hostile to (the game rate-limits each pair)
      for (const a of actors) {
        if (!e.armed) break;
        if (a === e || !a.alive || a.spawning > 0 || !hostile(e.faction, a.faction)) continue;
        const o = a.body;
        if (Math.abs(o.x - b.x) < o.hw + b.hw && Math.abs(o.z - b.z) < o.hw + b.hw && o.y < b.y + b.h && o.y + o.h > b.y) host.contact(e, a);
      }
      e.flash = Math.max(0, e.flash - dt);
      this.draw(e);
    }
    this.hazards.update(dt);
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
    return cur ? { id: cur.id, x: cur.body.x, y: cur.body.y, z: cur.body.z, vx: cur.body.vx, vz: cur.body.vz } : null;
  }

  /**
   */
  private avoidWalls(e: Enemy): Solid | undefined {
    const b = e.body;
    if (this.host.hazard(e, Math.floor(b.x), Math.floor(b.y), Math.floor(b.z)) === 'avoid') return undefined;
    return (x, y, z) => this.host.hazard(e, x, y, z) === 'avoid';
  }

  private safeCell(e: Enemy, x: number, y: number, z: number): boolean {
    const cx = Math.floor(x), cy = Math.floor(y), cz = Math.floor(z);
    return this.host.solid(cx, cy - 1, cz) && !this.host.solid(cx, cy, cz) && !this.host.solid(cx, cy + 1, cz)
      && this.host.hazard(e, cx, cy, cz) !== 'avoid';
  }

  private crackBelow(e: Enemy) {
    const b = e.body, tier = e.spec.breaks!.tier, damage = e.spec.breaks!.power;
    const x0 = Math.floor(b.x - b.hw + 0.05), x1 = Math.floor(b.x + b.hw - 0.05), z0 = Math.floor(b.z - b.hw + 0.05), z1 = Math.floor(b.z + b.hw - 0.05);
    const y = Math.floor(b.y) - 1;
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (this.host.solid(x, y, z)) this.host.smash(e, x, y, z, tier, damage);
    }
  }

  private smashAhead(e: Enemy, sx: number, sz: number, dt: number) {
    const b = e.body, tier = e.spec.breaks!.tier, damage = e.spec.breaks!.power * dt;
    const x = Math.floor(b.x + sx * (b.hw + 0.1)), z = Math.floor(b.z + sz * (b.hw + 0.1));
    for (let y = Math.floor(b.y + 0.1); y <= Math.floor(b.y + b.h - 0.1); y++) {
      if (this.host.solid(x, y, z) && this.host.smash(e, x, y, z, tier, damage)) return;
    }
  }

  /** Flow-field direction inside the enemy's room (one field per room and target); straight line otherwise. */
  private toward(e: Enemy, t: TargetView): [number, number] {
    const b = e.body, tx = t.x, tz = t.z;
    const dx = tx - b.x, dz = tz - b.z, l = Math.hypot(dx, dz) || 1;
    if (e.flyY >= 0 || e.ghost) return [dx / l, dz / l];
    // one field per room, target and kind of projection (each treats the elements its own way)
    const key = `${e.room}:${t.id}:${e.def}`;
    let f = this.flows.get(key);
    if (!f) {
      if (this.flows.size > 128) this.flows.clear(); // fields are tiny; just drop stale ones now and then
      f = new FlowField(this.host.room(e.room));
      this.flows.set(key, f);
    }
    f.update(this.host.solid, tx, tz, `${this.host.worldVersion()}:${this.host.elemVersion()}`, (x, y, z) => this.host.hazard(e, x, y, z));
    if (f.unsafe(b.x, b.z)) {
      const out = f.escape(b.x, b.z);
      if (out) return out;
    }
    const d = f.direction(b.x, b.z);
    if (d) return d;
    if (this.host.hazard(e, Math.floor(b.x + dx / l * (b.hw + 0.3)), Math.floor(b.y), Math.floor(b.z + dz / l * (b.hw + 0.3))) === 'avoid') return [0, 0];
    return [dx / l, dz / l];
  }

  /** Destroys every projectile hostile to `side` for which `inside` is true (a blade or a beam
   *  swept through it); allies' projectiles are left alone. Returns how many. */
  clearProjectiles(side: Actor['faction'], inside: (x: number, y: number, z: number) => boolean): number {
    let n = 0;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!hostile(side, p.faction) || !inside(p.x, p.y, p.z)) continue;
      this.host.particles(p.x, p.y, p.z, pal('cold.body'), 6, 2, 0.06);
      this.projectiles.splice(i, 1);
      n++;
    }
    return n;
  }

  /** A lobbed projectile that lands on the target point. */
  private shoot(e: Enemy, tx: number, ty: number, tz: number, damage = 4): number {
    const b = e.body;
    const sx = b.x, sy = b.y + b.h * 0.75, sz = b.z;
    const dx = tx - sx, dz = tz - sz, d = Math.hypot(dx, dz);
    const t = Math.max(0.5, d / 9);
    this.push({
      x: sx, y: sy, z: sz, vx: dx / t, vz: dz / t, vy: (ty - sy + 0.5 * LOB_GRAVITY * t * t) / t, age: 0, damage, thrower: e.id, faction: e.faction, gravity: LOB_GRAVITY,
    });
    return t;
  }

  /** A lob onto a point, with its landing marked on the floor for the whole flight and a splash there. */
  private rain(e: Enemy, x: number, y: number, z: number, damage: number) {
    // the drop itself is harmless: only the splash on its mark hurts, so the warning is the whole rule
    const flight = this.shoot(e, x, y + 0.3, z, 0);
    this.hazards.add(e.id, e.faction, `enemy:${e.def}`, {
      lead: flight, live: 0.2, damage, shape: { kind: 'ring', x, y, z, r: 0.3, grow: 3, width: 0.4, height: 1.2 },
    });
  }

  /** A stone from the ceiling onto (x, z): its shadow is marked for `lead` s; it comes loose when it has just time to fall. */
  rockfall(e: Enemy, x: number, y: number, z: number, lead: number, damage: number) {
    const rm = this.host.room(e.room);
    const top = rm.y0 + (rm.height ?? 6) - 0.6;
    const fall = Math.sqrt(2 * Math.max(0, top - y) / DROP_GRAVITY);
    this.hazards.add(e.id, e.faction, `enemy:${e.def}`, {
      lead, live: 0.15, damage, shape: { kind: 'ring', x, y, z, r: 0.7, grow: 0, width: 0.7, height: 2.6 },
    });
    this.drops.push({ owner: e.id, x, y: top, z, t: Math.max(0, lead - fall) });
  }

  private updateDrops(dt: number) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.t -= dt;
      if (d.t > 0) continue;
      this.drops.splice(i, 1);
      const e = this.list.find(o => o.id === d.owner && o.alive);
      if (!e) continue;
      this.host.particles(d.x, d.y, d.z, pal('cold.dim'), 6, 1.2, 0.07);
      this.host.drop(e, d.x, d.y, d.z);
    }
  }

  /** A charge meets a wall: what it can break in a slab three wide and as tall as it is, in front,
   *  goes. Only inside the room: the room's own shell (and its doors) always hold. */
  private crash(e: Enemy, dx: number, dz: number) {
    const brk = e.spec.breaks;
    if (!brk) return;
    const rm = this.host.room(e.room), x0 = rm.x0, z0 = rm.z0, x1 = rm.x0 + (rm.w ?? ROOM_W) - 1, z1 = rm.z0 + (rm.d ?? ROOM_D) - 1;
    const b = e.body, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
    for (let depth = 0.6; depth <= 1.6; depth += 1) for (let side = -1; side <= 1; side++) {
      const x = Math.floor(b.x + ux * (b.hw + depth) - uz * side), z = Math.floor(b.z + uz * (b.hw + depth) + ux * side);
      if (x < x0 || x > x1 || z < z0 || z > z1) continue;
      for (let y = Math.floor(b.y + 0.1); y <= Math.floor(b.y + b.h - 0.1); y++) {
        if (this.host.solid(x, y, z)) this.host.smash(e, x, y, z, brk.tier, 999);
      }
    }
  }

  private bolt(e: Enemy, dx: number, dy: number, dz: number, speed: number, damage: number) {
    const b = e.body, l = Math.hypot(dx, dy, dz) || 1;
    this.push({
      x: b.x, y: b.y + b.h * 0.6, z: b.z, vx: dx / l * speed, vy: dy / l * speed, vz: dz / l * speed, age: 0, damage, thrower: e.id, faction: e.faction, gravity: 0,
    });
    // a volley of bolts is one sound, not one per bolt
    if (this.time !== this.boltCued) { this.boltCued = this.time; this.host.cue('bolt', b.x, b.y, b.z); }
  }

  private push(p: Projectile) {
    this.projectiles.push({ ...p, damage: p.damage });
    if (this.projectiles.length > MAX_PROJECTILES) this.projectiles.shift();
  }

  private updateProjectiles(dt: number, actors: Actor[]) {
    let n = 0;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;
      p.vy -= p.gravity * dt;
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
        this.host.particles(p.x, p.y, p.z, pal('cold.dim'), 6, 2, 0.06);
        dead = true;
      }
      if (dead) { this.projectiles.splice(i, 1); continue; }
    }
    for (const p of this.projectiles) {
      // a cold cube tumbling on two axes (docs/art/DECISIONS.md §7.2): never round, never warm
      this.m.makeRotationFromEuler(this.euler.set(p.age * 9.4, p.age * 6.3, 0)).setPosition(p.x, p.y, p.z);
      this.projMesh.setMatrixAt(n++, this.m);
    }
    this.projMesh.count = n;
    this.projMesh.instanceMatrix.needsUpdate = true;
  }

  // ───────────────────────── visuals ─────────────────────────

  private buildView(def: EnemyDef): View {
    const v = buildModel(def);
    this.group.add(v.group);
    return v;
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
    // the hit flash is a short cold lift, never white; allies (part of the self) keep a dim warm glow.
    // The telegraph lives in the 'tell'/'core' parts, which brighten toward cold white as it winds up.
    for (const m of v.mats) {
      if (e.flash > 0) m.emissive.copy(HURT_FLASH);
      else if (e.faction === 'self') m.emissive.copy(ALLY_GLOW).multiplyScalar(0.5 + 0.5 * e.hp / e.maxHp);
      else if (e.warmth > 0) m.emissive.copy(WARM_GLOW).multiplyScalar(e.warmth);
      else m.emissive.setRGB(0, 0, 0);
    }
    v.tells.forEach((m, i) => m.color.copy(v.tellBase[i]).lerp(TELL_HOT, Math.min(1, e.pulse)));
  }
}
