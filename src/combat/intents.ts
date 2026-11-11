// Intentions (the player's projectiles): fly straight for `flight` seconds, then fall under
// gravity (see docs/DESIGN.md §4).

import * as THREE from 'three';
import { pal } from '../content/palette';
import { BASE_STATS, type Stats } from '../core/stats';
import type { IntentSpec } from '../game/events';
import { raycastVoxels, type VoxelHit } from '../physics/raycast';
import type { Polarity } from './polarity';

export function intentFromStats(s: Stats, polarity: Polarity): IntentSpec {
  return {
    damage: s.damage,
    polarity,
    mining: s.mining,
    knock: 0.46,
    speed: 16 * s.shotSpeed,
    flight: 0.5 * s.range,
    gravity: 22 * s.gravity,
    radius: 0.12 * s.size,
    pierce: 0,
    pierceTier: 0,
    phase: 0,
    volley: 1,
    bounces: 0,
    homing: 0,
    // the shell; items may tint it. A negative intention is your light charred: an ash shell (never
    // cold, which is the projections'); its core and halo dim in draw() (docs/art/DECISIONS.md §7.1)
    color: polarity === 'negative' ? pal('ink.ash') : pal('light.gold'),
    tags: new Set(),
  };
}

/** Blocks: how far an intention that phases moves into a block it has just hit. */
const PHASE_NUDGE = 1e-3;
const AIM_EVERY = 0.15;
const AIM_RANGE = 6;
const BOUNCE_KEEP = 0.75;
export const VOLLEY_SHARE = 0.6;
const VOLLEY_SPREAD = 0.12;
const UP = new THREE.Vector3(0, 1, 0);
const NO_NORMAL = new THREE.Vector3();

const MIRROR_CALM = 0.25;

interface Intent { spec: IntentSpec; pos: THREE.Vector3; vel: THREE.Vector3; age: number; phased: [number, number, number] | null; aim: THREE.Vector3 | null; aimT: number; calm: [number, number] | null }

/** Polarity (BESTIARY §1.1): both stay round, warm and yours; the negative one is darker, never cold. */
const CORE_POSITIVE = new THREE.Color(pal('light.core'));
const CORE_NEGATIVE = new THREE.Color(pal('light.ember'));
/** The negative halo's strength relative to the positive one (additive, so colour × strength). */
const HALO_NEGATIVE = 0.6;
/** The untinted shell, and the trail an untinted intention leaves (DECISIONS §7.1: no path, trail ember). */
const DEFAULT_SHELL = pal('light.gold');
const DEFAULT_SHELL_NEGATIVE = pal('ink.ash');
const TRAIL_POSITIVE = pal('light.ember');
const TRAIL_NEGATIVE = pal('ink.ash');

/** How an intention's power shows (issue #111, docs/art/DECISIONS.md §7.1.1). Size, halo and trail
 *  grow with damage and with the effects it carries, so power reads without colour. */
export interface IntentLook {
  /** Damage steps above base: log2(damage / base damage), clamped to [POWER_MIN, POWER_MAX]. */
  power: number;
  /** Effects the intention carries: pierce, phase, bounce, homing, volley and item tags (capped). */
  effects: number;
  /** Shell radius in metres. */
  radius: number;
  /** Halo radius as a multiple of the shell radius. */
  halo: number;
  /** Halo strength (additive colour scale; the negative one is HALO_NEGATIVE of it). */
  glow: number;
  /** Trail ghosts drawn behind the intention. */
  ghosts: number;
}

export const POWER_MIN = -1;
export const POWER_MAX = 4;
export const EFFECTS_MAX = 4;
export const GHOSTS_MAX = 8;
/** Seconds of flight between two trail ghosts. */
const GHOST_DT = 0.014;
/** The largest an intention may draw, whatever its damage and size (a bead, never a ball). */
const RADIUS_MAX = 0.42;

export function intentLook(spec: IntentSpec, baseDamage = BASE_STATS.damage): IntentLook {
  const ratio = Math.max(1e-3, spec.damage) / baseDamage;
  const power = Math.min(POWER_MAX, Math.max(POWER_MIN, Math.log2(ratio)));
  const effects = Math.min(EFFECTS_MAX,
    (spec.pierce > 0 ? 1 : 0) + (spec.phase > 0 ? 1 : 0) + (spec.bounces > 0 ? 1 : 0)
    + (spec.homing > 0 ? 1 : 0) + (spec.volley > 1 ? 1 : 0) + spec.tags.size);
  return {
    power,
    effects,
    // every doubling of damage is a visible step in size (+18 %), halo (+0.5 radii, +30 % glow)
    // and trail (+1 ghost); each effect widens the halo and lengthens the trail by one more
    radius: Math.min(RADIUS_MAX, spec.radius * (1 + 0.18 * power)),
    halo: 2.4 + 0.5 * power + 0.25 * effects,
    glow: Math.max(0.5, 1 + 0.3 * power + 0.1 * effects),
    ghosts: Math.min(GHOSTS_MAX, Math.max(1, Math.round(2 + power + effects))),
  };
}

/** The fire button's power (0..1) for the loaded intention: the same damage steps as the look. */
export function intentPowerLevel(damage: number, baseDamage = BASE_STATS.damage): number {
  const p = Math.log2(Math.max(1e-3, damage) / baseDamage);
  return Math.min(1, Math.max(0, p / POWER_MAX));
}

export interface IntentHooks {
  solid(x: number, y: number, z: number): boolean;
  /** Returns true if the block broke. */
  hitBlock(hit: VoxelHit, intent: IntentSpec): boolean;
  /** Tier of the block (pierce only works up to `pierceTier`). */
  tier(x: number, y: number, z: number): number;
  /** Index of a loose cube touching this sphere, or -1. */
  debrisAt(x: number, y: number, z: number, r: number): number;
  /** Something hit a loose cube with this velocity. */
  hitDebris(i: number, vel: THREE.Vector3, intent: IntentSpec): void;
  /** Actor id of an enemy this intention meets at this sphere, or -1 (allies let positive ones pass when healthy). */
  enemyAt(x: number, y: number, z: number, r: number, polarity: Polarity): number;
  hitEnemy(id: number, vel: THREE.Vector3, intent: IntentSpec): void;
  /** The axis a mirror reflects along, or null for anything that is not a mirror. */
  mirrorAxis?(id: number): 'x' | 'z' | null;
  /** An intention is at this point: presences hear it (silence on negative, lift on positive). */
  touched?(x: number, y: number, z: number, polarity: Polarity): void;
  splash(p: THREE.Vector3, color: number, big: boolean): void;
  /** The element at a point ('water' slows an intention, 'lava' puts it out), or null. */
  elementAt?(x: number, y: number, z: number): 'water' | 'lava' | 'fire' | null;
  /** An intention went out in lava (effects only). */
  quenched?(p: THREE.Vector3): void;
  hit(kind: 'actor' | 'cube' | 'block', target: number, p: THREE.Vector3, n: THREE.Vector3, v: THREE.Vector3, spec: IntentSpec): void;
  nearestBlock(p: THREE.Vector3, r: number): THREE.Vector3 | null;
}

export class Intents {
  private list: Intent[] = [];
  private mesh: THREE.InstancedMesh;
  /** A bead of light (docs/art/DECISIONS.md §7.1): white-hot core, gold shell, an ember halo. */
  private core: THREE.InstancedMesh;
  private halo: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private c = new THREE.Color();
  private g = new THREE.Vector3();

  constructor(scene: THREE.Scene, private hooks: IntentHooks, private max = 200) {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const inst = (mat: THREE.Material, cap = max) => {
      const m = new THREE.InstancedMesh(geo, mat, cap);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      m.count = 0;
      scene.add(m);
      return m;
    };
    // core and halo take a per-instance colour so polarity costs no extra draw call
    this.core = inst(new THREE.MeshBasicMaterial());
    this.core.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    // the shell mesh also draws the trail ghosts (one draw call, DECISIONS §7.1)
    this.mesh = inst(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.6, depthWrite: false }), max * (1 + GHOSTS_MAX));
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * (1 + GHOSTS_MAX) * 3), 3);
    this.halo = inst(new THREE.MeshBasicMaterial({ color: pal('light.ember'), transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.halo.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
  }

  get count() { return this.list.length; }

  /** Drops every intention in flight and hides its meshes (a passage between worlds). */
  clear() {
    this.list = [];
    this.draw();
  }

  fire(spec: IntentSpec, from: THREE.Vector3, dir: THREE.Vector3, inherit: THREE.Vector3) {
    const n = Math.max(1, Math.round(spec.volley));
    for (let k = 0; k < n; k++) {
      if (k === 0) { this.push(spec, from, dir, inherit); continue; }
      const turn = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * VOLLEY_SPREAD;
      const share = { ...spec, damage: spec.damage * VOLLEY_SHARE, mining: spec.mining * VOLLEY_SHARE, tags: new Set(spec.tags) };
      this.push(share, from, dir.clone().applyAxisAngle(UP, turn), inherit);
    }
  }

  private push(spec: IntentSpec, from: THREE.Vector3, dir: THREE.Vector3, inherit: THREE.Vector3) {
    if (this.list.length >= this.max) this.list.shift();
    const vel = dir.clone().normalize().multiplyScalar(spec.speed).addScaledVector(inherit, 0.5);
    this.list.push({ spec, pos: from.clone(), vel, age: 0, phased: null, aim: null, aimT: 0, calm: null });
  }

  within(test: (p: THREE.Vector3) => boolean): number {
    let n = 0;
    for (const t of this.list) if (test(t.pos)) n++;
    return n;
  }

  private steer(t: Intent, dt: number) {
    t.aimT -= dt;
    if (t.aimT <= 0) { t.aimT = AIM_EVERY; t.aim = this.hooks.nearestBlock(t.pos, AIM_RANGE); }
    if (!t.aim) return;
    const want = t.aim.clone().sub(t.pos);
    if (want.lengthSq() < 1e-6) return;
    const speed = t.vel.length();
    want.normalize().multiplyScalar(speed);
    t.vel.lerp(want, 1 - Math.exp(-t.spec.homing * dt));
  }

  update(dt: number) {
    const h = this.hooks;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      t.age += dt;
      if (t.age > t.spec.flight) t.vel.y -= t.spec.gravity * dt;
      if (t.spec.homing > 0) this.steer(t, dt);
      // water drags an intention (it keeps going, slower); lava puts it out
      const el = h.elementAt?.(t.pos.x, t.pos.y, t.pos.z) ?? null;
      if (el === 'water') t.vel.multiplyScalar(Math.exp(-2.5 * dt));
      else if (el === 'lava') { h.quenched?.(t.pos); this.list.splice(i, 1); continue; }
      const step = t.vel.clone().multiplyScalar(dt);
      const dist = step.length();
      let dead = false;

      // against loose cubes: push them
      // against projections: damage and knock them back
      h.touched?.(t.pos.x, t.pos.y, t.pos.z, t.spec.polarity);
      const seen = h.enemyAt(t.pos.x, t.pos.y, t.pos.z, t.spec.radius, t.spec.polarity);
      const foe = seen >= 0 && t.calm && t.calm[0] === seen && t.age < t.calm[1] ? -1 : seen;
      if (foe >= 0) {
        const axis = h.mirrorAxis?.(foe) ?? null;
        h.hitEnemy(foe, t.vel, t.spec);
        h.splash(t.pos, t.spec.color, true);
        h.hit('actor', foe, t.pos, NO_NORMAL, t.vel, t.spec);
        if (axis) {
          if (axis === 'x') t.vel.x = -t.vel.x; else t.vel.z = -t.vel.z;
          t.calm = [foe, t.age + MIRROR_CALM];
          continue;
        }
        this.list.splice(i, 1);
        continue;
      }
      const cube = h.debrisAt(t.pos.x, t.pos.y, t.pos.z, t.spec.radius);
      if (cube >= 0) {
        h.hitDebris(cube, t.vel, t.spec);
        h.splash(t.pos, t.spec.color, false);
        h.hit('cube', cube, t.pos, NO_NORMAL, t.vel, t.spec);
        dead = true;
      }

      // against the world: piercing through soft blocks, or phasing through any block
      if (!dead) {
        const ph = t.phased;
        if (ph && (Math.floor(t.pos.x) !== ph[0] || Math.floor(t.pos.y) !== ph[1] || Math.floor(t.pos.z) !== ph[2])) t.phased = null;
        const origin = t.pos.clone();
        let left = dist;
        while (!dead) {
          const skip = t.phased;
          const hit = raycastVoxels(
            (x, y, z) => !(skip && skip[0] === x && skip[1] === y && skip[2] === z) && h.solid(x, y, z),
            origin.x, origin.y, origin.z, step.x, step.y, step.z, left,
          );
          if (!hit) { t.pos.copy(origin).addScaledVector(step, dist ? left / dist : 0); break; }
          const hitPos = origin.clone().addScaledVector(step, dist ? hit.t / dist : 0);
          const pierceable = h.tier(hit.x, hit.y, hit.z) <= t.spec.pierceTier;
          const broke = h.hitBlock(hit, t.spec);
          h.splash(hitPos, t.spec.color, broke);
          const normal = new THREE.Vector3(hit.nx, hit.ny, hit.nz);
          h.hit('block', -1, hitPos, normal, t.vel, t.spec);
          if (t.spec.phase > 0) {
            t.spec = { ...t.spec, phase: t.spec.phase - 1 };
            t.phased = [hit.x, hit.y, hit.z];
            // step just inside the block, so the cell it left is never found again on its face
            origin.copy(hitPos).addScaledVector(step, dist ? PHASE_NUDGE / dist : 0);
            left -= hit.t + PHASE_NUDGE;
            t.pos.copy(origin);
            if (left <= 0) break;
          } else if (broke && pierceable && t.spec.pierce > 0) {
            t.spec = { ...t.spec, pierce: t.spec.pierce - 1 };
            t.pos.copy(hitPos);
            break;
          } else if (!broke && t.spec.bounces > 0) {
            const along = t.vel.dot(normal);
            t.vel.addScaledVector(normal, -2 * along).multiplyScalar(BOUNCE_KEEP);
            t.spec = { ...t.spec, bounces: t.spec.bounces - 1 };
            t.pos.copy(hitPos).addScaledVector(normal, PHASE_NUDGE);
            break;
          } else dead = true;
        }
      }
      if (dead || t.age > 6) this.list.splice(i, 1);
    }
    this.draw();
  }

  /** The look of every intention in flight, in the order drawn (for tests and the gallery). */
  looks(): IntentLook[] { return this.list.map(t => intentLook(t.spec)); }

  private draw() {
    let n = 0, s = 0;
    for (const t of this.list) {
      const look = intentLook(t.spec);
      const r = look.radius;
      const neg = t.spec.polarity === 'negative';
      this.m.makeScale(r, r, r).setPosition(t.pos);
      this.mesh.setMatrixAt(s, this.m);
      this.mesh.setColorAt(s++, this.c.setHex(t.spec.color));
      // the trail: ghosts back along the flight, shrinking 0.8 → 0.2; never further back than it has flown.
      // An untinted intention trails ember (positive) or ash (negative); a tinted one trails its tint.
      const trail = t.spec.color === DEFAULT_SHELL || t.spec.color === DEFAULT_SHELL_NEGATIVE ? (neg ? TRAIL_NEGATIVE : TRAIL_POSITIVE) : t.spec.color;
      for (let k = 1; k <= look.ghosts; k++) {
        const back = Math.min(k * GHOST_DT, t.age);
        if (back <= 0) break;
        const f = 0.8 - 0.6 * (k - 1) / Math.max(1, look.ghosts - 1);
        this.g.copy(t.pos).addScaledVector(t.vel, -back);
        this.m.makeScale(r * f, r * f, r * f).setPosition(this.g);
        this.mesh.setMatrixAt(s, this.m);
        this.mesh.setColorAt(s++, this.c.setHex(trail));
      }
      // polarity is carried by the core and the halo, so an item that tints the shell never hides it:
      // positive is white-hot in a full ember halo; negative is a banked ember in a dimmer one
      this.m.makeScale(r * 0.55, r * 0.55, r * 0.55).setPosition(t.pos);
      this.core.setMatrixAt(n, this.m);
      this.core.setColorAt(n, neg ? CORE_NEGATIVE : CORE_POSITIVE);
      const h = r * look.halo;
      this.m.makeScale(h, h, h).setPosition(t.pos);
      this.halo.setMatrixAt(n, this.m);
      this.halo.setColorAt(n, this.c.setScalar(look.glow * (neg ? HALO_NEGATIVE : 1)));
      n++;
    }
    this.mesh.count = s;
    for (const m of [this.core, this.halo]) m.count = n;
    for (const m of [this.mesh, this.core, this.halo]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
}
