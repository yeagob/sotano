// Weapons that replace the intention, Isaac-style (docs/architecture/WEAPONS.md): the blade of
// Cut Ties with Toxic Relationships, the charged beam of Remember Breathing, and the great cut of both together. They only act
// through the host (the game), so every block and actor they touch goes through the shared
// damage pipeline and its events. No randomness: particles go through the host (core/fx).

import * as THREE from 'three';
import { pal } from '../content/palette';
import type { Stats } from '../core/stats';
import type { Formation, IntentSpec, WeaponId } from '../game/events';
import { raycastVoxels } from '../physics/raycast';
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
const BEAM_WIDTH = 0.09;
/** Strands (Rule of Three, Spiral Growth) are thinner than the beam; the halo is wider than the core. */
const STRAND_WIDTH = 0.6;
const HALO_WIDTH = 1.9;
/** A ray hits a projection whose body lies within its half-width plus this many blocks. */
const BEAM_PAD = 0.35;
/** A spiral strand (Spiral Growth alone) circles its beam at this radius, one turn per block. */
const BEAM_HELIX_R = 0.3;

/** One cast ray: where it starts, where it points (before homing), and the share of the shot it carries. */
export interface BeamRay { origin: THREE.Vector3; dir: THREE.Vector3; share: number }
/** What a beam takes from its shot at release (frozen): the fan, the strands, the homing and the hands. */
export interface BeamShape {
  readonly volley: number;
  readonly formation?: Formation;
  readonly homing: number;
  readonly homingTarget: 'block' | 'projection';
  readonly twin: boolean;
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

/** A ray as drawn: from `from` along `dir` for `len` blocks. A helix strand is drawn as the shared helix. */
interface Seg { from: THREE.Vector3; dir: THREE.Vector3; len: number; strand: boolean; helix: { phase: number; spin: number } | null }
/** A pool slot: the core and halo of one ray. A helix strand shows the shared helix (clipped per ray) instead of a tube. */
interface Slot { core: THREE.Mesh; halo: THREE.Mesh; coreHelix: THREE.BufferGeometry; haloHelix: THREE.BufferGeometry }

/** The helix a spiral strand traces: BEAM_HELIX_R around +z, one turn per block, from 0 to BEAM_REACH. */
class Helix extends THREE.Curve<THREE.Vector3> {
  constructor() { super(); }
  getPoint(t: number, out: THREE.Vector3 = new THREE.Vector3()) {
    const a = t * BEAM_REACH * Math.PI * 2;
    return out.set(BEAM_HELIX_R * Math.cos(a), BEAM_HELIX_R * Math.sin(a), t * BEAM_REACH);
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

/** Both hands, at most BEAM_MAX_RAYS rays each. */
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
    const coreSrc = helixGeometry(strandR), haloSrc = helixGeometry(strandR * HALO_WIDTH);
    this.helixSrc = [coreSrc, haloSrc];
    for (let i = 0; i < BEAM_SLOTS; i++) {
      const core = new THREE.Mesh(this.cylinder, this.coreMat), halo = new THREE.Mesh(this.cylinder, this.haloMat);
      core.frustumCulled = halo.frustumCulled = false;
      core.visible = halo.visible = false;
      scene.add(core, halo);
      this.slots.push({ core, halo, coreHelix: sharedView(coreSrc), haloHelix: sharedView(haloSrc) });
    }
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
    });
    this.hand = this.host.castHand?.() ?? 1;
    this.firing = BEAM_TIME;
    this.tick = 0;
    this.ticksLeft = BEAM_TICKS;
    this.segs = [[], []];
    this.host.swingHands();
    this.host.sound('beam');
  }

  /**
   * One tick: the hand of this tick (the two hands alternate with Bilateral Stimulation) casts its rays. Each ray is
   * homed, raycast, burns or answers the block it reaches, hits what its strip crosses and clears what it crosses.
   */
  private doTick(i: number) {
    const eye = this.host.eye(), f = this.host.forward();
    const elapsed = i * BEAM_TICK;
    const side = this.shape.twin ? (i % 2 ? -this.hand : this.hand) : 1;
    const crosshair = raycastVoxels((x, y, z) => this.host.solid(x, y, z), eye.x, eye.y, eye.z, f.x, f.y, f.z, BEAM_REACH);
    const aim = eye.clone().addScaledVector(f, crosshair ? crosshair.t : BEAM_REACH);
    const targets = this.host.targets();
    const rays = beamRays(this.shape, eye, f, aim, elapsed, side);
    const segs: Seg[] = [];
    let tip: THREE.Vector3 | null = null;
    const formation = this.shape.formation;
    for (let r = 0; r < rays.length; r++) {
      const ray = rays[r];
      const dir = this.homed(ray.origin, ray.dir, targets);
      const hit = raycastVoxels((x, y, z) => this.host.solid(x, y, z), ray.origin.x, ray.origin.y, ray.origin.z, dir.x, dir.y, dir.z, this.spec.reach);
      const len = hit ? hit.t : this.spec.reach;
      const end = ray.origin.clone().addScaledVector(dir, len);
      if (hit) {
        if (this.host.breakable(hit.x, hit.y, hit.z)) this.host.burn(hit.x, hit.y, hit.z, this.spec.mining * ray.share, 'beam');
        else this.host.answer(hit.x, hit.y, hit.z);
      }
      for (const t of targets) {
        if (segDist(new THREE.Vector3(t.x, t.y + t.h / 2, t.z), ray.origin, end) > t.hw + BEAM_PAD) continue;
        this.host.hit(t.id, this.spec.damage * ray.share, dir.x, dir.z, 'beam');
      }
      this.host.clearProjectiles((x, y, z) => segDist(new THREE.Vector3(x, y, z), ray.origin, end) < 0.5);
      this.host.clearCubes((x, y, z) => segDist(new THREE.Vector3(x, y, z), ray.origin, end) < 0.6);
      // a spiral strand's helix is centred on its beam: the strand's offset at this tick is taken back out
      let from = ray.origin, helix: Seg['helix'] = null;
      if (formation && formation.spiral && !formation.triad) {
        const o = strandOrbit(formation, BEAM_TIME, r % 3), off = new THREE.Vector3();
        orbitOffset(o, ray.dir, elapsed, off);
        from = ray.origin.clone().sub(off);
        helix = { phase: o.phase, spin: o.spin };
      }
      segs.push({ from, dir, len, strand: !!formation, helix });
      tip ??= end;
    }
    const hand = side > 0 ? 0 : 1;
    this.segs[hand] = segs;
    if (tip) this.host.particles(tip.x, tip.y, tip.z, pal('light.hot'), 5, 3, 0.08);
    this.host.shake(0.06);
  }

  /**
   * Homing (Eye Contact toward a projection, Dowsing toward a block): the ray turns by 1 - e^(-homing × tick) toward
   * its target. Stateless: each tick turns the base direction afresh, so the result depends on the tick alone.
   */
  private homed(origin: THREE.Vector3, dir: THREE.Vector3, targets: WeaponTarget[]): THREE.Vector3 {
    const h = this.shape.homing;
    if (!(h > 0)) return dir;
    let want: THREE.Vector3 | null = null;
    if (this.shape.homingTarget === 'projection') {
      let bd = Infinity, bid = Infinity;
      const cos = Math.cos(BEAM_CONE);
      for (const t of targets) {
        const p = new THREE.Vector3(t.x, t.y + t.h / 2, t.z), v = p.clone().sub(origin), d = v.length();
        if (d < 1e-6 || d > BEAM_PROJECTION_RANGE || v.dot(dir) / d < cos) continue;
        if (d < bd || (d === bd && t.id < bid)) { bd = d; bid = t.id; want = p; }
      }
    } else {
      const b = this.host.nearestBlock(origin.x, origin.y, origin.z, BEAM_BLOCK_RANGE);
      if (b) want = new THREE.Vector3(b.x, b.y, b.z);
    }
    if (!want) return dir;
    const to = want.sub(origin).normalize();
    return dir.clone().lerp(to, 1 - Math.exp(-h * BEAM_TICK)).normalize();
  }

  /** Draws the rays of both hands at constant brightness: only the width breathes. */
  private draw() {
    const t = BEAM_TIME - this.firing;
    const w = BEAM_WIDTH + Math.sin(t * 9) * 0.015;
    let n = 0;
    for (const list of this.segs) for (const seg of list) {
      if (n >= this.slots.length) break;
      this.place(this.slots[n++], seg, t, w);
    }
    for (; n < this.slots.length; n++) this.hide(this.slots[n]);
  }

  private place(slot: Slot, seg: Seg, elapsed: number, w: number) {
    const width = seg.strand ? w * STRAND_WIDTH : w;
    const ahead = this.tmp.copy(seg.from).add(seg.dir);
    const meshes: [THREE.Mesh, number, THREE.BufferGeometry][] = [[slot.core, 1, slot.coreHelix], [slot.halo, HALO_WIDTH, slot.haloHelix]];
    for (const [m, k, view] of meshes) {
      m.position.copy(seg.from);
      m.lookAt(ahead);
      if (seg.helix) {
        m.geometry = view;
        m.scale.set(1, 1, 1);
        m.rotateZ(seg.helix.phase + seg.helix.spin * elapsed);
        // the helix is clipped where the ray ends
        const count = view.index ? view.index.count : 0;
        const used = Math.floor((count * Math.min(1, seg.len / BEAM_REACH)) / 3) * 3;
        view.setDrawRange(0, used);
      } else {
        m.geometry = this.cylinder;
        m.scale.set(width * k, width * k, seg.len);
      }
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
