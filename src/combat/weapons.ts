// Weapons that replace the intention, Isaac-style (docs/architecture/WEAPONS.md): the blade of
// Cut Ties with Toxic Relationships, the charged beam of Remember Breathing, and the great cut of both together. They only act
// through the host (the game), so every block and actor they touch goes through the shared
// damage pipeline and its events. No randomness: particles go through the host (core/fx).

import * as THREE from 'three';
import { pal } from '../content/palette';
import type { Stats } from '../core/stats';
import type { Formation, IntentSpec, WeaponId } from '../game/events';
import { raycastVoxels, type VoxelHit } from '../physics/raycast';
import { orbitOffset, strandOrbit, VOLLEY_SHARE, VOLLEY_SPREAD, HELIX_SHARE, TRIAD_SHARE } from './intents';

export interface WeaponTarget { id: number; x: number; y: number; z: number; hw: number; h: number }

export interface WeaponHost {
  stats(): Stats;
  /** The camera: eye position and the (unit) direction you look at. */
  eye(): THREE.Vector3;
  forward(): THREE.Vector3;
  /** Left button held, and nothing else (an item being held up) blocks casting. */
  casting(): boolean;
  /** The shot a beam is cast with: emits `fire` (intentFromStats) and returns its spec; null if a hook cancelled it. */
  shot(): IntentSpec | null;
  /** The hand the next cast leaves from (+1 right, -1 left); always +1 without Bilateral Stimulation. Optional. */
  castHand?(): number;
  /** Emits `strike`; null if a hook cancelled it. `intent` is the shot the stroke carries (its tags, volley and shape). */
  strike(weapon: WeaponId, damage: number, mining: number, reach: number, intent?: IntentSpec): { damage: number; mining: number; reach: number; tags: Set<string> } | null;
  /** The nearest solid block within `range` of the point (its centre), or null. */
  nearestBlock(x: number, y: number, z: number, range: number): { x: number; y: number; z: number } | null;
  solid(x: number, y: number, z: number): boolean;
  /** A world block that weapons can break (not air, not unbreakable). */
  breakable(x: number, y: number, z: number): boolean;
  /** Cut a block clean (full HP, kind 'cut'). */
  cut(x: number, y: number, z: number, source: string): void;
  /** Damage a block (kind 'beam'); true if it broke. */
  burn(x: number, y: number, z: number, amount: number, source: string): boolean;
  /** A solid block the stroke cannot break still answers it: the beam and the great cut call this
   *  where they reach one (the alembic brews at it, as it does for a shot). Most blocks ignore it. */
  answer(x: number, y: number, z: number): void;
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
const BEAM_TICKS = Math.round(BEAM_TIME / BEAM_TICK);
const BEAM_REACH = 24;
/** Most rays of one hand's cast: a fan of beams, each three strands when it has a formation. */
export const BEAM_MAX_RAYS = 24;
/** Homing: a projection within this many blocks of a ray, inside a cone of BEAM_CONE; a block within BEAM_BLOCK_RANGE. */
const BEAM_PROJECTION_RANGE = 8;
const BEAM_CONE = (25 * Math.PI) / 180;
const BEAM_BLOCK_RANGE = 6;
/** A beam leaves a hand a little below the eye, BEAM_HAND_SIDE blocks to its side (the left hand is mirrored). */
const BEAM_HAND_SIDE = 0.18;
const BEAM_HAND_DROP = 0.12;
export const BEAM_WIDTH = 0.09;
/** Strands (Rule of Three, Spiral Growth) are thinner than the beam; the halo is wider than the core. */
const STRAND_WIDTH = 0.6;
export const HALO_WIDTH = 1.9;
/** A ray hits a projection whose body lies within its half-width plus this many blocks. */
const BEAM_PAD = 0.35;
/** A spiral strand (Spiral Growth alone) circles its beam at this radius, one turn per block. */
export const BEAM_HELIX_R = 0.15;
export const BEAM_HELIX_EASE = 3;
const BEAM_STEP = 0.5;
const BEAM_AIM_EVERY = 0.15;
const BEAM_BEND = (2 * Math.PI) / 180;
const BEAM_PIECES = 384;
const BEAM_SPEED = 16;

/** One cast ray: where it starts, where it points (before homing), and the share of the shot it carries. */
export interface BeamRay { origin: THREE.Vector3; dir: THREE.Vector3; share: number }
/** What a beam takes from its shot at release (frozen): the fan, the strands, the homing and the hands. */
export interface BeamShape {
  readonly volley: number;
  readonly formation?: Formation;
  readonly homing: number;
  readonly homingTarget: 'block' | 'projection';
  readonly twin: boolean;
  readonly speed?: number;
}

/**
 * The rays of one hand's cast `elapsed` seconds after release. The hand at `side` (±1) starts a little below and to
 * its side of the eye and aims at `end`, where the eye's own ray ends (both hands meet at the crosshair). Fan: beam
 * k > 0 turns around up by ±ceil(k/2) × VOLLEY_SPREAD at VOLLEY_SHARE. Formation: each beam becomes three strands on
 * their orbits (age = elapsed). Pure: the same inputs give the same rays.
 */
export function beamRays(shape: BeamShape, eye: THREE.Vector3, forward: THREE.Vector3, end: THREE.Vector3, elapsed: number, side: number): BeamRay[] {
  const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
  const origin = eye.clone().addScaledVector(right, BEAM_HAND_SIDE * side).addScaledVector(UP, -BEAM_HAND_DROP);
  const aim = end.clone().sub(origin).normalize();
  const f = shape.formation, per = f ? 3 : 1;
  const beams = Math.min(Math.max(1, Math.round(shape.volley)), Math.floor(BEAM_MAX_RAYS / per));
  const out: BeamRay[] = [];
  for (let k = 0; k < beams; k++) {
    const turn = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * VOLLEY_SPREAD;
    const dir = k === 0 ? aim : aim.clone().applyAxisAngle(UP, turn);
    const beam = k === 0 ? 1 : VOLLEY_SHARE;
    if (!f) { out.push({ origin: origin.clone(), dir, share: beam }); continue; }
    for (let j = 0; j < 3; j++) {
      const strand = (f.triad ? TRIAD_SHARE : 1) * (f.spiral && j > 0 ? HELIX_SHARE : 1);
      const off = new THREE.Vector3();
      orbitOffset(strandOrbit(f, BEAM_TIME, j), dir, elapsed, off);
      out.push({ origin: origin.clone().add(off), dir: dir.clone(), share: beam * strand });
    }
  }
  return out;
}

export interface BeamPath { points: THREE.Vector3[]; hit: VoxelHit | null }

export function beamPath(
  origin: THREE.Vector3, dir: THREE.Vector3, reach: number, homing: number, speed: number,
  solid: (x: number, y: number, z: number) => boolean,
  aimAt: (p: THREE.Vector3, d: THREE.Vector3) => THREE.Vector3 | null,
): BeamPath {
  const d = dir.clone().normalize();
  if (!(homing > 0)) {
    const hit = raycastVoxels(solid, origin.x, origin.y, origin.z, d.x, d.y, d.z, reach);
    return { points: [origin.clone(), origin.clone().addScaledVector(d, hit ? hit.t : reach)], hit };
  }
  const v = Math.max(1e-3, speed);
  const turn = 1 - Math.exp((-homing * BEAM_STEP) / v);
  const every = BEAM_AIM_EVERY * v;
  const p = origin.clone(), points = [origin.clone()], bent = d.clone();
  let travelled = 0, sinceAim = every, want: THREE.Vector3 | null = null;
  while (travelled < reach - 1e-9) {
    if (travelled > 0) {
      if (sinceAim >= every - 1e-9) { sinceAim = 0; want = aimAt(p, d); }
      if (want) {
        const to = want.clone().sub(p);
        if (to.lengthSq() > 1e-6) {
          const nd = d.clone().lerp(to.normalize(), turn);
          if (nd.lengthSq() > 1e-9) d.copy(nd.normalize());
        }
      }
      if (d.angleTo(bent) > BEAM_BEND) { points.push(p.clone()); bent.copy(d); }
    }
    const step = Math.min(BEAM_STEP, reach - travelled);
    const hit = raycastVoxels(solid, p.x, p.y, p.z, d.x, d.y, d.z, step);
    if (hit) {
      p.addScaledVector(d, hit.t);
      points.push(p.clone());
      return { points, hit };
    }
    p.addScaledVector(d, step);
    travelled += step;
    sinceAim += step;
  }
  points.push(p.clone());
  return { points, hit: null };
}

function pathDistance(q: THREE.Vector3, points: THREE.Vector3[]): { dist: number; piece: number } {
  let dist = Infinity, piece = 0;
  for (let s = 0; s + 1 < points.length; s++) {
    const dd = segDist(q, points[s], points[s + 1]);
    if (dd < dist) { dist = dd; piece = s; }
  }
  return { dist, piece };
}

interface Seg { points: THREE.Vector3[]; strand: boolean; helix: { phase: number; spin: number } | null }
interface Slot { core: THREE.Mesh; halo: THREE.Mesh; coreHelix: THREE.BufferGeometry; haloHelix: THREE.BufferGeometry }

export function helixRadiusAt(z: number): number {
  const k = Math.min(1, Math.max(0, z / BEAM_HELIX_EASE));
  return BEAM_HELIX_R * k * k * (3 - 2 * k);
}

class Helix extends THREE.Curve<THREE.Vector3> {
  constructor() { super(); }
  getPoint(t: number, out: THREE.Vector3 = new THREE.Vector3()) {
    const z = t * BEAM_REACH, a = z * Math.PI * 2, r = helixRadiusAt(z);
    return out.set(r * Math.cos(a), r * Math.sin(a), z);
  }
}

function helixGeometry(radius: number): THREE.TubeGeometry {
  return new THREE.TubeGeometry(new Helix(), BEAM_REACH * 16, radius, 6, false);
}

/** A geometry with the buffers of `src` (shared, not copied) and a draw range of its own. */
function sharedView(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  for (const name of Object.keys(src.attributes)) g.setAttribute(name, src.getAttribute(name) as THREE.BufferAttribute);
  g.setIndex(src.getIndex());
  return g;
}

const BEAM_SLOTS = BEAM_MAX_RAYS * 2;

export class Beam implements Weapon {
  readonly id = 'beam' as const;
  private charge: Charge;
  private firing = 0;
  private tick = 0;
  private ticksLeft = 0;
  /** The hand that casts the first tick (+1 right, -1 left). */
  private hand = 1;
  private spec = { damage: 0, mining: 0, reach: BEAM_REACH };
  private shape: BeamShape = { volley: 1, homing: 0, homingTarget: 'block', twin: false };
  /** What each hand's last tick cast: index 0 the right hand (or the only hand), 1 the left. */
  private segs: Seg[][] = [[], []];
  private slots: Slot[] = [];
  private cylinder: THREE.CylinderGeometry;
  private helixSrc: THREE.TubeGeometry[];
  private coreMat: THREE.MeshBasicMaterial;
  private haloMat: THREE.MeshBasicMaterial;
  private tmp = new THREE.Vector3();

  constructor(private scene: THREE.Scene, private host: WeaponHost) {
    this.charge = new Charge(host);
    this.cylinder = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5);
    this.coreMat = glowMaterial(pal('light.core'), 0.95);
    this.haloMat = glowMaterial(pal('path.will.glow'), 0.35);
    const strandR = BEAM_WIDTH * STRAND_WIDTH;
    this.helixSrc = [helixGeometry(strandR), helixGeometry(strandR * HALO_WIDTH)];
    for (let i = 0; i < BEAM_SLOTS; i++) this.slot(i);
  }

  private slot(n: number): Slot | null {
    if (n < this.slots.length) return this.slots[n];
    if (n >= BEAM_PIECES) return null;
    const core = new THREE.Mesh(this.cylinder, this.coreMat), halo = new THREE.Mesh(this.cylinder, this.haloMat);
    core.frustumCulled = halo.frustumCulled = false;
    core.visible = halo.visible = false;
    this.scene.add(core, halo);
    const s = { core, halo, coreHelix: sharedView(this.helixSrc[0]), haloHelix: sharedView(this.helixSrc[1]) };
    this.slots.push(s);
    return s;
  }

  update(dt: number) {
    if (this.charge.update(dt, this.firing > 0)) this.release();
    if (this.firing <= 0) return;
    this.firing -= dt;
    this.tick -= dt;
    // a fixed accumulator: exactly BEAM_TICKS ticks per beam, whatever the frame rate
    while (this.tick <= 0 && this.ticksLeft > 0) {
      this.tick += BEAM_TICK;
      const i = BEAM_TICKS - this.ticksLeft;
      this.ticksLeft--;
      this.doTick(i);
    }
    if (this.ticksLeft <= 0 && this.firing < 0) this.firing = 0;
    if (this.firing <= 0) this.hideAll(); else this.draw();
  }

  /** The shot becomes a beam: `fire` first (a cancelled shot gives the charge back), then `strike`. */
  private release() {
    const shot = this.host.shot();
    if (!shot) { this.charge.refund(); return; }
    const s = this.host.stats();
    const ev = this.host.strike('beam', shot.damage, shot.mining * 2, BEAM_REACH, shot);
    if (!ev) { this.charge.refund(); return; }
    this.spec = { damage: ev.damage, mining: ev.mining, reach: ev.reach };
    this.shape = Object.freeze({
      volley: shot.volley, formation: shot.formation, homing: shot.homing, homingTarget: shot.homingTarget, twin: s.twinCast >= 1,
      speed: shot.speed,
    });
    this.hand = this.host.castHand?.() ?? 1;
    this.firing = BEAM_TIME;
    this.tick = 0;
    this.ticksLeft = BEAM_TICKS;
    this.segs = [[], []];
    this.host.swingHands();
    this.host.sound('beam');
  }

  private doTick(i: number) {
    const eye = this.host.eye(), f = this.host.forward();
    const elapsed = i * BEAM_TICK;
    const side = this.shape.twin ? (i % 2 ? -this.hand : this.hand) : 1;
    const solid = (x: number, y: number, z: number) => this.host.solid(x, y, z);
    const crosshair = raycastVoxels(solid, eye.x, eye.y, eye.z, f.x, f.y, f.z, BEAM_REACH);
    const aim = eye.clone().addScaledVector(f, crosshair ? crosshair.t : BEAM_REACH);
    const targets = this.host.targets();
    const rays = beamRays(this.shape, eye, f, aim, elapsed, side);
    const trace = (origin: THREE.Vector3, dir: THREE.Vector3) => beamPath(
      origin, dir, this.spec.reach, this.shape.homing, this.shape.speed ?? BEAM_SPEED, solid, (p, d) => this.aimAt(p, d, targets),
    );
    const paths: THREE.Vector3[][] = [];
    for (const ray of rays) {
      const path = trace(ray.origin, ray.dir);
      const pts = path.points, hit = path.hit;
      paths.push(pts);
      if (hit) {
        if (this.host.breakable(hit.x, hit.y, hit.z)) this.host.burn(hit.x, hit.y, hit.z, this.spec.mining * ray.share, 'beam');
        else this.host.answer(hit.x, hit.y, hit.z);
      }
      for (const t of targets) {
        const near = pathDistance(new THREE.Vector3(t.x, t.y + t.h / 2, t.z), pts);
        if (near.dist > t.hw + BEAM_PAD) continue;
        const along = pts[near.piece + 1].clone().sub(pts[near.piece]);
        const dir = along.lengthSq() > 1e-12 ? along.normalize() : ray.dir;
        this.host.hit(t.id, this.spec.damage * ray.share, dir.x, dir.z, 'beam');
      }
      this.host.clearProjectiles((x, y, z) => pathDistance(new THREE.Vector3(x, y, z), pts).dist < 0.5);
      this.host.clearCubes((x, y, z) => pathDistance(new THREE.Vector3(x, y, z), pts).dist < 0.6);
    }
    const segs: Seg[] = [];
    const formation = this.shape.formation;
    const spiral = !!formation && formation.spiral && !formation.triad;
    for (let r = 0; r < rays.length; r++) {
      if (!spiral) { segs.push({ points: paths[r], strand: !!formation, helix: null }); continue; }
      if (r % 3) continue;
      const off = new THREE.Vector3();
      orbitOffset(strandOrbit(formation, BEAM_TIME, 0), rays[r].dir, elapsed, off);
      const core = trace(rays[r].origin.clone().sub(off), rays[r].dir).points;
      segs.push({ points: core, strand: false, helix: null });
      for (let j = 0; j < 3; j++) {
        if (core.length > 2) { segs.push({ points: paths[r + j], strand: true, helix: null }); continue; }
        const o = strandOrbit(formation, BEAM_TIME, j);
        segs.push({ points: core, strand: true, helix: { phase: o.phase, spin: o.spin } });
      }
    }
    const hand = side > 0 ? 0 : 1;
    this.segs[hand] = segs;
    const tip = paths.length ? paths[0][paths[0].length - 1] : null;
    if (tip) this.host.particles(tip.x, tip.y, tip.z, pal('light.hot'), 5, 3, 0.08);
    this.host.shake(0.06);
  }

  private aimAt(p: THREE.Vector3, d: THREE.Vector3, targets: WeaponTarget[]): THREE.Vector3 | null {
    if (this.shape.homingTarget === 'projection') {
      let want: THREE.Vector3 | null = null, bd = Infinity, bid = Infinity;
      const cos = Math.cos(BEAM_CONE);
      for (const t of targets) {
        const q = new THREE.Vector3(t.x, t.y + t.h / 2, t.z), v = q.clone().sub(p), dist = v.length();
        if (dist < 1e-6 || dist > BEAM_PROJECTION_RANGE || v.dot(d) / dist < cos) continue;
        if (dist < bd || (dist === bd && t.id < bid)) { bd = dist; bid = t.id; want = q; }
      }
      return want;
    }
    const b = this.host.nearestBlock(p.x, p.y, p.z, BEAM_BLOCK_RANGE);
    return b ? new THREE.Vector3(b.x, b.y, b.z) : null;
  }

  /** Draws the rays of both hands at constant brightness: only the width breathes. */
  private draw() {
    const t = BEAM_TIME - this.firing;
    const w = BEAM_WIDTH + Math.sin(t * 9) * 0.015;
    let n = 0;
    for (const list of this.segs) for (const seg of list) {
      const width = seg.strand ? w * STRAND_WIDTH : w;
      if (seg.helix) {
        const slot = this.slot(n);
        if (slot) { this.placeHelix(slot, seg, t); n++; }
        continue;
      }
      for (let k = 0; k + 1 < seg.points.length; k++) {
        const slot = this.slot(n);
        if (!slot) break;
        if (this.placePiece(slot, seg.points[k], seg.points[k + 1], width)) n++;
      }
    }
    for (; n < this.slots.length; n++) this.hide(this.slots[n]);
  }

  private placePiece(slot: Slot, from: THREE.Vector3, to: THREE.Vector3, width: number): boolean {
    const len = from.distanceTo(to);
    if (len < 1e-6) return false;
    for (const [m, k] of [[slot.core, 1], [slot.halo, HALO_WIDTH]] as const) {
      m.geometry = this.cylinder;
      m.position.copy(from);
      m.lookAt(to);
      m.scale.set(width * k, width * k, len);
      m.visible = true;
    }
    return true;
  }

  private placeHelix(slot: Slot, seg: Seg, elapsed: number) {
    const from = seg.points[0], to = seg.points[seg.points.length - 1];
    const len = from.distanceTo(to);
    const ahead = len > 1e-6 ? this.tmp.copy(to) : this.tmp.copy(from).add(UP);
    const meshes: [THREE.Mesh, THREE.BufferGeometry][] = [[slot.core, slot.coreHelix], [slot.halo, slot.haloHelix]];
    for (const [m, view] of meshes) {
      m.geometry = view;
      m.position.copy(from);
      m.lookAt(ahead);
      m.scale.set(1, 1, 1);
      m.rotateZ(seg.helix!.phase - seg.helix!.spin * elapsed);
      const count = view.index ? view.index.count : 0;
      const used = Math.floor((count * Math.min(1, len / BEAM_REACH)) / 3) * 3;
      view.setDrawRange(0, used);
      m.visible = true;
    }
  }

  private hide(slot: Slot) { slot.core.visible = slot.halo.visible = false; }

  private hideAll() {
    for (const s of this.slots) this.hide(s);
  }

  dispose() {
    this.host.chargeHands(0);
    for (const s of this.slots) {
      this.scene.remove(s.core, s.halo);
      s.coreHelix.dispose();
      s.haloHelix.dispose();
    }
    for (const g of this.helixSrc) g.dispose();
    this.cylinder.dispose();
    this.coreMat.dispose();
    this.haloMat.dispose();
    this.slots = [];
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
      if (this.queued.has(key)) continue;
      if (this.host.breakable(x, y, z)) { this.queued.add(key); this.queue.push([x, y, z]); }
      else if (this.host.solid(x, y, z)) { this.queued.add(key); this.host.answer(x, y, z); }
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
