
import * as THREE from 'three';
import { pal } from '../content/palette';
import { hostile, type Actor, type Faction } from '../entities/actors';
import { fx } from '../core/fx';

export type FieldEffect = 'slow' | 'mute' | 'sting';

export type Shape =
  | { kind: 'line'; x0: number; z0: number; x1: number; z1: number; y: number; width: number }
  | { kind: 'ring'; x: number; y: number; z: number; r: number; grow: number; width: number; height: number }
  | { kind: 'field'; x: number; y: number; z: number; r: number; effect: FieldEffect }
  | { kind: 'pull'; x: number; y: number; z: number; r: number; force: number }
  | { kind: 'sweep'; axis: 'x' | 'z'; from: number; to: number; speed: number; across: [number, number]; y: number; height: number; width: number };

export interface Strike {
  lead: number;
  live: number;
  damage: number;
  shape: Shape;
}

interface Hazard extends Strike {
  owner: number;
  faction: Faction;
  cause: string;
  t: number;
  started: boolean;
  hit: Set<number>;
  tick: number;
}

export interface HazardHost {
  actors(): Iterable<Actor>;
  hurt(target: Actor, damage: number, cause: string, owner: number): void;
  affect(target: Actor, effect: FieldEffect, seconds: number): void;
  push(target: Actor, vx: number, vz: number): void;
  live(shape: Shape): void;
  /** Cosmetic cube particles (the dust and sparks along a live attack). */
  particles(x: number, y: number, z: number, color: number, n: number, speed: number, size: number): void;
}

const MARK = 0.09;
const CAPACITY = 2400;
const DASH = 0.5;
const RING_SEGMENTS = 24;
const RING_SEGMENTS_MAX = 120;
/** Size of a live attack's marks against a telegraph's. */
const LIVE_SCALE = 1.8;
const FIELD_DOTS = 16;
const PULL_MOTES = 10;

const COLD_DIM = new THREE.Color(pal('cold.dim'));
const COLD_WHITE = new THREE.Color(pal('cold.white'));
const DIM = pal('cold.dim'), WHITE = pal('cold.white'), BODY = pal('cold.body');
/** Particles a live attack sheds per frame, and the chance per frame that a telegraph sheds a mote. */
const LIVE_SPARKS = 3;
const TELL_MOTE = 0.35;

export class Hazards {
  private list: Hazard[] = [];
  private mesh: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private time = 0;

  constructor(private scene: THREE.Scene, private host: HazardHost) {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(MARK, MARK, MARK), new THREE.MeshBasicMaterial(), CAPACITY);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }

  add(owner: number, faction: Faction, cause: string, s: Strike) {
    this.list.push({ ...s, owner, faction, cause, t: 0, started: false, hit: new Set(), tick: 0 });
  }

  /** Attacks on the field (telegraphed or live). */
  get size() { return this.list.length; }

  countOf(owner: number) {
    let n = 0;
    for (const h of this.list) if (h.owner === owner) n++;
    return n;
  }

  clear(owner: number) {
    this.list = this.list.filter(h => h.owner !== owner);
  }

  update(dt: number) {
    this.time += dt;
    const actors = [...this.host.actors()];
    for (let i = this.list.length - 1; i >= 0; i--) {
      const h = this.list[i];
      h.t += dt;
      const live = h.t - h.lead;
      if (live < 0) { if (fx.random() < TELL_MOTE) this.mote(h.shape, h.lead > 0 ? h.t / h.lead : 1); continue; }
      if (h.shape.kind === 'field' || h.shape.kind === 'pull') {
        if (!h.started) { h.started = true; this.host.live(h.shape); }
        if (live > h.live) { this.list.splice(i, 1); continue; }
        this.continuous(h, dt, actors);
        continue;
      }
      if (!h.started) { h.started = true; this.host.live(h.shape); }
      if (live > h.live) { this.list.splice(i, 1); continue; }
      if (h.damage > 0) this.sparks(h.shape, live);
      this.strike(h, live, actors);
    }
    this.draw();
  }

  /** A telegraph sheds a rising cold mote somewhere on its shape, brighter as it comes due (`k` 0 → 1). */
  private mote(s: Shape, k: number) {
    const [x, y, z] = this.pointOn(s, 0, true);
    this.host.particles(x, y + 0.1, z, k > 0.7 ? WHITE : DIM, 1, 0.6, 0.05);
  }

  /** A live attack throws dust and sparks along its front, so it reads as force, not as dots. */
  private sparks(s: Shape, live: number) {
    for (let k = 0; k < LIVE_SPARKS; k++) {
      const [x, y, z] = this.pointOn(s, live, false);
      this.host.particles(x, y + 0.15, z, k === 0 ? WHITE : k === 1 ? BODY : DIM, 1, 2.2, 0.07);
    }
  }

  /** A random point on a shape: on its front once live, anywhere on its reach while it is a telegraph. */
  private pointOn(s: Shape, live: number, tell: boolean): [number, number, number] {
    const u = fx.random();
    switch (s.kind) {
      case 'line': return [s.x0 + (s.x1 - s.x0) * u, s.y, s.z0 + (s.z1 - s.z0) * u];
      case 'ring': {
        const r = tell ? s.r + (s.grow > 0 ? fx.random() * s.grow * 0.5 : 0) : s.r + s.grow * live, a = u * Math.PI * 2;
        return [s.x + Math.cos(a) * r, s.y, s.z + Math.sin(a) * r];
      }
      case 'sweep': {
        const at = tell ? s.from : sweepAt(s, live), across = s.across[0] + (s.across[1] - s.across[0]) * u, h = fx.random() * s.height;
        return s.axis === 'x' ? [at, s.y + h, across] : [across, s.y + h, at];
      }
      default: { const a = u * Math.PI * 2, r = fx.random() * s.r; return [s.x + Math.cos(a) * r, s.y, s.z + Math.sin(a) * r]; }
    }
  }

  private foes(h: Hazard, actors: Actor[]) {
    return actors.filter(a => a.alive && a.spawning <= 0 && a.id !== h.owner && hostile(h.faction, a.faction));
  }

  private strike(h: Hazard, live: number, actors: Actor[]) {
    const s = h.shape;
    for (const a of this.foes(h, actors)) {
      if (h.hit.has(a.id)) continue;
      const b = a.body;
      let inside = false;
      if (s.kind === 'line') {
        inside = distanceToSegment(b.x, b.z, s.x0, s.z0, s.x1, s.z1) < s.width + b.hw && b.y < s.y + 1.5 && b.y + b.h > s.y - 0.2;
      } else if (s.kind === 'ring') {
        const r = s.r + s.grow * live, d = Math.hypot(b.x - s.x, b.z - s.z);
        inside = Math.abs(d - r) < s.width + b.hw && b.y < s.y + s.height && b.y + b.h > s.y - 0.2;
      } else if (s.kind === 'sweep') {
        const at = sweepAt(s, live), coord = s.axis === 'x' ? b.x : b.z, along = s.axis === 'x' ? b.z : b.x;
        inside = Math.abs(coord - at) < s.width + b.hw && along > s.across[0] - b.hw && along < s.across[1] + b.hw
          && b.y < s.y + s.height && b.y + b.h > s.y;
      }
      if (inside) { h.hit.add(a.id); this.host.hurt(a, h.damage, h.cause, h.owner); }
    }
  }

  private continuous(h: Hazard, dt: number, actors: Actor[]) {
    const s = h.shape;
    if (s.kind !== 'field' && s.kind !== 'pull') return;
    h.tick -= dt;
    const tick = h.tick <= 0;
    if (tick) h.tick = 1;
    for (const a of this.foes(h, actors)) {
      const b = a.body, dx = s.x - b.x, dz = s.z - b.z, d = Math.hypot(dx, dz);
      if (d > s.r + b.hw || b.y > s.y + 2 || b.y + b.h < s.y - 1) continue;
      if (s.kind === 'pull') {
        const k = s.force * dt / Math.max(0.5, d);
        this.host.push(a, dx * k, dz * k);
      } else if (s.effect === 'sting') {
        if (tick) this.host.hurt(a, h.damage, h.cause, h.owner);
      } else {
        this.host.affect(a, s.effect, 0.4);
      }
    }
  }

  private draw() {
    let n = 0;
    const put = (x: number, y: number, z: number, live: boolean) => {
      if (n >= CAPACITY) return;
      // a live attack's marks are twice as big: the warning is a dashed line, the blow a solid one
      const k = live ? LIVE_SCALE : 1;
      this.m.makeScale(k, k, k).setPosition(x, y, z);
      this.mesh.setMatrixAt(n, this.m);
      this.mesh.setColorAt(n, live ? COLD_WHITE : COLD_DIM);
      n++;
    };
    for (const h of this.list) {
      const s = h.shape, live = h.t >= h.lead;
      if (s.kind === 'line') {
        const dx = s.x1 - s.x0, dz = s.z1 - s.z0, len = Math.hypot(dx, dz);
        for (let d = 0; d <= len; d += DASH) put(s.x0 + dx * d / len, s.y + 0.1, s.z0 + dz * d / len, live);
      } else if (s.kind === 'ring') {
        const r = live ? s.r + s.grow * (h.t - h.lead) : s.r;
        const ring = (r: number, on: boolean) => {
          const n = Math.min(RING_SEGMENTS_MAX, Math.max(RING_SEGMENTS, Math.round(r * 2 * Math.PI / DASH)));
          for (let k = 0; k < n; k++) {
            const a = k / n * Math.PI * 2, x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r;
            put(x, s.y + 0.1, z, on);
            // a live ring stands as a low wall up to its height: what you must clear to jump it
            if (on && k % 2 === 0) put(x, s.y + Math.min(s.height, 1.2) * 0.7, z, on);
          }
        };
        ring(r, live);
        // a growing ring shows how far it will reach while it is still a warning
        if (!live && s.grow > 0) ring(s.r + s.grow * h.live, false);
      } else if (s.kind === 'field') {
        for (let k = 0; k < FIELD_DOTS; k++) {
          const a = k / FIELD_DOTS * Math.PI * 2 + this.time * 0.6;
          put(s.x + Math.cos(a) * s.r, s.y + 0.1 + 0.1 * Math.sin(this.time * 3 + k), s.z + Math.sin(a) * s.r, live);
        }
      } else if (s.kind === 'pull') {
        for (let k = 0; k < PULL_MOTES; k++) {
          const u = ((this.time * 0.8 + k / PULL_MOTES) % 1), r = s.r * (1 - u), a = k * 2.4;
          put(s.x + Math.cos(a) * r, s.y + 0.2, s.z + Math.sin(a) * r, live);
        }
      } else if (s.kind === 'sweep') {
        const at = sweepAt(s, Math.max(0, h.t - h.lead)), [a0, a1] = s.across;
        for (let y = 0; y < s.height; y += 0.5) for (let u = a0; u <= a1; u += 0.5) {
          if (s.axis === 'x') put(at, s.y + y, u, live); else put(u, s.y + y, at, live);
        }
      }
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

export function shapePoint(s: Shape): [number, number, number] {
  switch (s.kind) {
    case 'line': return [(s.x0 + s.x1) / 2, s.y, (s.z0 + s.z1) / 2];
    case 'sweep': return s.axis === 'x' ? [s.from, s.y, (s.across[0] + s.across[1]) / 2] : [(s.across[0] + s.across[1]) / 2, s.y, s.from];
    default: return [s.x, s.y, s.z];
  }
}

export function sweepAt(s: Extract<Shape, { kind: 'sweep' }>, t: number): number {
  const at = s.from + Math.sign(s.to - s.from) * s.speed * t;
  return s.to >= s.from ? Math.min(s.to, at) : Math.max(s.to, at);
}

export function distanceToSegment(px: number, pz: number, x0: number, z0: number, x1: number, z1: number): number {
  const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - x0) * dx + (pz - z0) * dz) / l2)) : 0;
  return Math.hypot(px - (x0 + dx * t), pz - (z0 + dz * t));
}
