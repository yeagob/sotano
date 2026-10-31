// Weapons that replace the intention, Isaac-style (docs/architecture/WEAPONS.md): the blade of
// Cut Ties with Toxic Relationships, the charged beam of Remember Breathing, and the great cut of both together. They only act
// through the host (the game), so every block and actor they touch goes through the shared
// damage pipeline and its events. No randomness: particles go through the host (core/fx).

import * as THREE from 'three';
import { pal } from '../content/palette';
import type { Stats } from '../core/stats';
import type { WeaponId } from '../game/events';
import { raycastVoxels } from '../physics/raycast';

export interface WeaponTarget { id: number; x: number; y: number; z: number; hw: number; h: number }

export interface WeaponHost {
  stats(): Stats;
  /** The camera: eye position and the (unit) direction you look at. */
  eye(): THREE.Vector3;
  forward(): THREE.Vector3;
  /** Left button held, and nothing else (an item being held up) blocks casting. */
  casting(): boolean;
  /** Emits `strike`; null if a hook cancelled it. */
  strike(weapon: WeaponId, damage: number, mining: number, reach: number): { damage: number; mining: number; reach: number; tags: Set<string> } | null;
  solid(x: number, y: number, z: number): boolean;
  /** A world block that weapons can break (not air, not unbreakable). */
  breakable(x: number, y: number, z: number): boolean;
  /** Cut a block clean (full HP, kind 'cut'). */
  cut(x: number, y: number, z: number, source: string): void;
  /** Damage a block (kind 'beam'); true if it broke. */
  burn(x: number, y: number, z: number, amount: number, source: string): boolean;
  /** Projections hostile to the player, alive and materialised. */
  targets(): WeaponTarget[];
  hit(id: number, damage: number, kx: number, kz: number, source: string): void;
  clearProjectiles(inside: (x: number, y: number, z: number) => boolean): void;
  /** Destroys the loose cubes for which `inside` is true (bombs in reach go off): a strike never
   *  leaves the rubble it made standing in the way. */
  clearCubes(inside: (x: number, y: number, z: number) => boolean): void;
  /** Like `clearCubes`, but each cube is shown cut in two along the stroke (`along` runs down the
   *  blade's path, `across` is the normal of the cut plane). */
  sliceCubes(inside: (x: number, y: number, z: number) => boolean, along: THREE.Vector3, across: THREE.Vector3): void;
  particles(x: number, y: number, z: number, color: number, n: number, speed: number, size: number): void;
  shake(seconds: number): void;
  /** Hands: a casting push, and the glow of a charge (0 → 1). */
  swingHands(): void;
  chargeHands(k: number): void;
  sound(name: 'swish' | 'charged' | 'beam' | 'greatcut'): void;
}

export interface Weapon {
  readonly id: WeaponId;
  update(dt: number): void;
  dispose(): void;
}

const UP = new THREE.Vector3(0, 1, 0);

/** Seconds to charge the beam and the great cut: fire-rate items charge faster, like Brimstone. */
export const chargeTime = (s: Stats) => Math.min(2, Math.max(0.35, 2.7 / s.fireRate));

/** Distance from point p to the segment a→b. */
function segDist(p: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) {
  const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / (ab.lengthSq() || 1)));
  return p.distanceTo(a.clone().addScaledVector(ab, t));
}

function glowMaterial(color: number, opacity: number) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  });
}

// ───────────────────────── Cut Ties with Toxic Relationships: the blade ─────────────────────────

/** Half-angle of the blade's cone. */
const BLADE_HALF_ANGLE = (55 * Math.PI) / 180;
const BLADE_SHOW = 0.18;
const SLASH_TILT = 0.45;
/** Reach caps, so `size` items grow the weapons without making a single strike unbounded. */
export const BLADE_MAX_REACH = 6;
export const GREATCUT_MAX_REACH = 18;

export class Blade implements Weapon {
  readonly id = 'blade' as const;
  private cooldown = 0;
  private shown = 0;
  private arc: THREE.Mesh;
  private side = 1;

  constructor(private scene: THREE.Scene, private host: WeaponHost) {
    // a crescent of light lying in the plane of the swing
    const geo = new THREE.RingGeometry(0.55, 1, 28, 1, Math.PI / 2 - BLADE_HALF_ANGLE, BLADE_HALF_ANGLE * 2);
    geo.rotateX(-Math.PI / 2);
    this.arc = new THREE.Mesh(geo, glowMaterial(pal('light.hot'), 0.8));
    this.arc.visible = false;
    scene.add(this.arc);
  }

  update(dt: number) {
    this.cooldown -= dt;
    if (this.shown > 0) {
      this.shown = Math.max(0, this.shown - dt);
      const k = this.shown / BLADE_SHOW;
      (this.arc.material as THREE.MeshBasicMaterial).opacity = 0.8 * k;
      this.arc.rotateY(this.side * dt * 5);
      this.arc.visible = this.shown > 0;
    }
    if (this.cooldown <= 0 && this.host.casting()) this.swing();
  }

  private swing() {
    const s = this.host.stats();
    const ev = this.host.strike('blade', s.damage * 3, s.mining, Math.min(BLADE_MAX_REACH, 2.5 * s.size));
    this.cooldown = 1 / (s.fireRate * 0.8);
    if (!ev) return;
    const eye = this.host.eye(), f = this.host.forward(), r = ev.reach, cos = Math.cos(BLADE_HALF_ANGLE);
    const inCone = (x: number, y: number, z: number, pad: number) => {
      const dx = x - eye.x, dy = y - eye.y, dz = z - eye.z, d = Math.hypot(dx, dy, dz);
      if (d > r + pad) return false;
      return d < 0.6 + pad || (dx * f.x + dy * f.y + dz * f.z) / d >= cos;
    };
    // every breakable block in the cone is cut loose
    const ri = Math.ceil(r);
    for (let z = Math.floor(eye.z) - ri; z <= Math.floor(eye.z) + ri; z++)
      for (let y = Math.floor(eye.y) - ri; y <= Math.floor(eye.y) + ri; y++)
        for (let x = Math.floor(eye.x) - ri; x <= Math.floor(eye.x) + ri; x++)
          if (inCone(x + 0.5, y + 0.5, z + 0.5, 0) && this.host.breakable(x, y, z)) this.host.cut(x, y, z, 'blade');
    for (const t of this.host.targets()) {
      if (!inCone(t.x, t.y + t.h / 2, t.z, t.hw)) continue;
      const l = Math.hypot(t.x - eye.x, t.z - eye.z) || 1;
      this.host.hit(t.id, ev.damage, (t.x - eye.x) / l, (t.z - eye.z) / l, 'blade');
    }
    this.host.clearProjectiles((x, y, z) => inCone(x, y, z, 0.2));
    // the stroke runs across the aim, tilted like a diagonal slash; the cut halves leave perpendicular to it
    const right = new THREE.Vector3().crossVectors(f, UP).normalize();
    const along = right.clone().multiplyScalar(Math.cos(SLASH_TILT)).addScaledVector(UP, -this.side * Math.sin(SLASH_TILT)).normalize();
    this.host.sliceCubes((x, y, z) => inCone(x, y, z, 0.2), along, new THREE.Vector3().crossVectors(f, along).normalize());
    // the visual: a crescent from one side to the other, alternating
    this.side = -this.side;
    this.arc.position.copy(eye).addScaledVector(UP, -0.25);
    this.arc.lookAt(eye.clone().add(f));
    this.arc.rotateY(Math.PI);
    this.arc.rotateZ(this.side * 0.25);
    this.arc.scale.setScalar(r);
    this.arc.visible = true;
    this.shown = BLADE_SHOW;
    this.host.swingHands();
    this.host.sound('swish');
  }

  dispose() { this.scene.remove(this.arc); this.arc.geometry.dispose(); }
}

// ───────────────────────── charge (shared by the beam and the great cut) ─────────────────────────

class Charge {
  k = 0;
  private full = false;
  constructor(private host: WeaponHost, private slower = 1) {}

  /** A cancelled strike gives the charge back. */
  refund() { this.k = 1; this.full = true; }

  /** Returns true on the frame the button is released with a full charge. */
  update(dt: number, busy: boolean): boolean {
    if (!busy && this.host.casting()) {
      this.k = Math.min(1, this.k + dt / (chargeTime(this.host.stats()) * this.slower));
      if (this.k >= 1 && !this.full) { this.full = true; this.host.sound('charged'); }
      this.host.chargeHands(this.k);
      return false;
    }
    const release = this.k >= 1;
    this.k = 0; this.full = false;
    this.host.chargeHands(0);
    return release;
  }
}

// ───────────────────────── Remember Breathing: the beam ─────────────────────────

const BEAM_TIME = 1;
const BEAM_TICK = 0.1;
const BEAM_REACH = 24;

export class Beam implements Weapon {
  readonly id = 'beam' as const;
  private charge: Charge;
  private firing = 0;
  private tick = 0;
  private ticksLeft = 0;
  private spec = { damage: 0, mining: 0, reach: BEAM_REACH };
  private core: THREE.Mesh;
  private halo: THREE.Mesh;
  private end = new THREE.Vector3();

  constructor(private scene: THREE.Scene, private host: WeaponHost) {
    this.charge = new Charge(host);
    const geo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5);
    this.core = new THREE.Mesh(geo, glowMaterial(pal('light.core'), 0.95));
    this.halo = new THREE.Mesh(geo, glowMaterial(pal('path.will.glow'), 0.35));
    this.core.visible = this.halo.visible = false;
    scene.add(this.core, this.halo);
  }

  update(dt: number) {
    if (this.charge.update(dt, this.firing > 0)) this.release();
    if (this.firing <= 0) return;
    this.firing -= dt;
    this.tick -= dt;
    // a fixed accumulator: exactly BEAM_TIME / BEAM_TICK ticks per beam, whatever the frame rate
    while (this.tick <= 0 && this.ticksLeft > 0) { this.tick += BEAM_TICK; this.ticksLeft--; this.doTick(); }
    if (this.ticksLeft <= 0 && this.firing < 0) this.firing = 0;
    this.draw();
    if (this.firing <= 0) this.core.visible = this.halo.visible = false;
  }

  private release() {
    const s = this.host.stats();
    const ev = this.host.strike('beam', s.damage, s.mining * 2, BEAM_REACH);
    if (!ev) { this.charge.refund(); return; }
    this.spec = ev;
    this.firing = BEAM_TIME;
    this.tick = 0;
    this.ticksLeft = Math.round(BEAM_TIME / BEAM_TICK);
    this.host.swingHands();
    this.host.sound('beam');
  }

  /** One tick: the beam reaches the first solid block, burns it, and hits everything on its way. */
  private doTick() {
    const eye = this.host.eye(), f = this.host.forward();
    const hit = raycastVoxels((x, y, z) => this.host.solid(x, y, z), eye.x, eye.y, eye.z, f.x, f.y, f.z, this.spec.reach);
    const len = hit ? hit.t : this.spec.reach;
    this.end.copy(eye).addScaledVector(f, len);
    if (hit && this.host.breakable(hit.x, hit.y, hit.z)) this.host.burn(hit.x, hit.y, hit.z, this.spec.mining, 'beam');
    for (const t of this.host.targets()) {
      if (segDist(new THREE.Vector3(t.x, t.y + t.h / 2, t.z), eye, this.end) > t.hw + 0.35) continue;
      this.host.hit(t.id, this.spec.damage, f.x, f.z, 'beam');
    }
    this.host.clearProjectiles((x, y, z) => segDist(new THREE.Vector3(x, y, z), eye, this.end) < 0.5);
    this.host.clearCubes((x, y, z) => segDist(new THREE.Vector3(x, y, z), eye, this.end) < 0.6);
    this.host.particles(this.end.x, this.end.y, this.end.z, pal('light.hot'), 5, 3, 0.08);
    this.host.shake(0.06);
  }

  private draw() {
    const eye = this.host.eye(), f = this.host.forward();
    // from the right hand, a little below the eye, to where the beam ends
    const right = new THREE.Vector3().crossVectors(f, UP).normalize();
    const from = eye.clone().addScaledVector(right, 0.2).addScaledVector(UP, -0.2).addScaledVector(f, 0.7);
    const len = Math.max(0.1, from.distanceTo(this.end));
    // the width breathes; the light never flickers
    const w = 0.09 + Math.sin((BEAM_TIME - this.firing) * 9) * 0.015;
    for (const [m, k] of [[this.core, 1], [this.halo, 1.9]] as const) {
      m.position.copy(from);
      m.lookAt(this.end);
      m.scale.set(w * k, w * k, len);
      m.visible = true;
    }
  }

  dispose() {
    this.host.chargeHands(0);
    this.scene.remove(this.core, this.halo);
    this.core.geometry.dispose();
  }
}

// ───────────────────────── One Clear Cut: the giant blade ─────────────────────────

const SWEEP_TIME = 0.45;
const SWEEP_ARC = (140 * Math.PI) / 180;
/** Block cuts per frame; the rest of the arc waits for the next frames. */
const CUTS_PER_FRAME = 60;

export class GreatCut implements Weapon {
  readonly id = 'greatcut' as const;
  private charge: Charge;
  private t = -1;
  private angle = 0;
  private spec = { damage: 0, mining: 0, reach: 9 };
  private hitIds = new Set<number>();
  private queue: [number, number, number][] = [];
  private queued = new Set<string>();
  private blade: THREE.Mesh;
  private halo: THREE.Mesh;
  private yaw0 = 0;
  private pitch0 = 0;

  constructor(private scene: THREE.Scene, private host: WeaponHost) {
    this.charge = new Charge(host, 1.2);
    const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0, -0.5);
    this.blade = new THREE.Mesh(geo, glowMaterial(pal('light.core'), 0.95));
    this.halo = new THREE.Mesh(geo, glowMaterial(pal('path.mind.glow'), 0.4));
    this.blade.visible = this.halo.visible = false;
    scene.add(this.blade, this.halo);
  }

  update(dt: number) {
    if (this.charge.update(dt, this.t >= 0)) this.release();
    this.cutQueued();
    if (this.t < 0) return;
    const a0 = this.angle;
    this.t += dt;
    const k = Math.min(1, this.t / SWEEP_TIME);
    // ease-in-out across the arc, right to left
    this.angle = SWEEP_ARC / 2 - SWEEP_ARC * (k * k * (3 - 2 * k));
    for (let a = a0; a >= this.angle; a -= 0.04) this.sweepAt(a);
    this.sweepAt(this.angle);
    this.draw();
    if (k >= 1) { this.t = -1; this.blade.visible = this.halo.visible = false; }
  }

  private dir(a: number) {
    const cp = Math.cos(this.pitch0);
    const yaw = this.yaw0 + a;
    return new THREE.Vector3(-Math.sin(yaw) * cp, Math.sin(this.pitch0), -Math.cos(yaw) * cp);
  }

  private release() {
    const s = this.host.stats();
    const ev = this.host.strike('greatcut', s.damage * 4, s.mining, Math.min(GREATCUT_MAX_REACH, 9 * s.size));
    if (!ev) { this.charge.refund(); return; }
    this.spec = ev;
    const f = this.host.forward();
    this.yaw0 = Math.atan2(-f.x, -f.z);
    this.pitch0 = Math.asin(Math.max(-1, Math.min(1, f.y)));
    this.t = 0;
    this.angle = SWEEP_ARC / 2;
    this.hitIds.clear();
    this.host.swingHands();
    this.host.shake(0.4);
    this.host.sound('greatcut');
  }

  /** Everything the blade crosses at angle `a`: blocks (three layers thick), projections, projectiles. */
  private sweepAt(a: number) {
    const eye = this.host.eye(), d = this.dir(a);
    const side = new THREE.Vector3().crossVectors(d, UP).normalize();
    const up = new THREE.Vector3().crossVectors(side, d).normalize();
    for (let r = 0.8; r <= this.spec.reach; r += 0.5) for (const v of [-0.6, 0, 0.6]) {
      const p = eye.clone().addScaledVector(d, r).addScaledVector(up, v);
      const x = Math.floor(p.x), y = Math.floor(p.y), z = Math.floor(p.z), key = `${x},${y},${z}`;
      if (this.queued.has(key) || !this.host.breakable(x, y, z)) continue;
      this.queued.add(key);
      this.queue.push([x, y, z]);
    }
    const tip = eye.clone().addScaledVector(d, this.spec.reach);
    for (const t of this.host.targets()) {
      if (this.hitIds.has(t.id) || segDist(new THREE.Vector3(t.x, t.y + t.h / 2, t.z), eye, tip) > t.hw + 0.6) continue;
      this.hitIds.add(t.id);
      this.host.hit(t.id, this.spec.damage, d.x, d.z, 'greatcut');
    }
    this.host.clearProjectiles((x, y, z) => segDist(new THREE.Vector3(x, y, z), eye, tip) < 0.8);
    this.host.clearCubes((x, y, z) => segDist(new THREE.Vector3(x, y, z), eye, tip) < 0.9);
  }

  private cutQueued() {
    for (let n = 0; n < CUTS_PER_FRAME && this.queue.length; n++) {
      const [x, y, z] = this.queue.shift()!;
      if (this.host.breakable(x, y, z)) this.host.cut(x, y, z, 'greatcut');
    }
    if (!this.queue.length && this.t < 0) this.queued.clear();
  }

  private draw() {
    const eye = this.host.eye(), d = this.dir(this.angle);
    const from = eye.clone().addScaledVector(UP, -0.45);
    const w = 0.2 * Math.max(1, this.spec.reach / 9);
    for (const [m, k] of [[this.blade, 1], [this.halo, 1.8]] as const) {
      m.position.copy(from);
      m.lookAt(from.clone().add(d));
      m.rotateY(Math.PI);
      // a long edge seen from just above: narrow across, a little thicker up and down
      m.scale.set(w * k, w * 0.5 * k, this.spec.reach);
      m.visible = true;
    }
  }

  dispose() {
    this.host.chargeHands(0);
    this.scene.remove(this.blade, this.halo);
    this.blade.geometry.dispose();
  }
}

export function createWeapon(id: WeaponId, scene: THREE.Scene, host: WeaponHost): Weapon | null {
  if (id === 'blade') return new Blade(scene, host);
  if (id === 'beam') return new Beam(scene, host);
  if (id === 'greatcut') return new GreatCut(scene, host);
  return null; // 'intent': the game's own shot
}
