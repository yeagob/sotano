// Cube particles (intention splashes and block chips) in a single InstancedMesh.

import { fx } from '../core/fx';
import * as THREE from 'three';
import { pal } from '../content/palette';
import { HEART_PICKUP } from '../content/heart-art';

interface P { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; s: number; calm?: boolean }

export interface HeartCell { i: number; j: number; shade: number }

export function heartCells(): HeartCell[] {
  const art = HEART_PICKUP.red;
  const base = new THREE.Color(pal(art.palette.f));
  const cells: HeartCell[] = [];
  art.rows.forEach((r, j) => [...r].forEach((ch, i) => {
    const token = art.palette[ch];
    if (!token) return;
    const c = new THREE.Color(pal(token));
    cells.push({ i, j, shade: Math.min(1, (c.r + c.g + c.b) / (base.r + base.g + base.b)) });
  }));
  return cells;
}

export function heartGeometry(): THREE.BufferGeometry {
  const rows = HEART_PICKUP.red.rows;
  const w = Math.max(...rows.map(r => r.length)), h = rows.length, c = 1 / w;
  const parts = heartCells().map(({ i, j, shade }) => {
    const g = new THREE.BoxGeometry(c, c, c).toNonIndexed();
    g.translate((i - (w - 1) / 2) * c, ((h - 1) / 2 - j) * c, 0);
    const n = g.getAttribute('position').count;
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(shade), 3));
    return g;
  });
  const total = parts.reduce((k, g) => k + g.getAttribute('position').count, 0);
  const pos = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let at = 0;
  for (const g of parts) {
    pos.set(g.getAttribute('position').array as Float32Array, at);
    col.set(g.getAttribute('color').array as Float32Array, at);
    at += g.getAttribute('position').count * 3;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return out;
}

export class Particles {
  private list: P[] = [];
  private mesh: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private c = new THREE.Color();
  private heartList: P[] = [];
  private heartRgb: number[] = [];
  private heartMesh: THREE.InstancedMesh;
  private heartColors: Float32Array;
  private q = new THREE.Quaternion();
  private up = new THREE.Vector3(0, 1, 0);
  private v = new THREE.Vector3();
  private k = new THREE.Vector3();

  constructor(scene: THREE.Scene, private max = 600, private maxHearts = 120) {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.colors = new Float32Array(max * 3);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(this.colors, 3);
    this.heartMesh = new THREE.InstancedMesh(heartGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true }), maxHearts);
    this.heartMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.heartMesh.frustumCulled = false;
    this.heartMesh.count = 0;
    scene.add(this.heartMesh);
    this.heartColors = new Float32Array(maxHearts * 3);
    this.heartMesh.instanceColor = new THREE.InstancedBufferAttribute(this.heartColors, 3);
  }
  private colors: Float32Array;
  private rgb: number[] = [];

  get heartCount() { return this.heartList.length; }

  /** Drops every mote (a passage between worlds). */
  clear() {
    this.list = [];
    this.rgb = [];
    this.mesh.count = 0;
    this.heartList = [];
    this.heartRgb = [];
    this.heartMesh.count = 0;
  }

  hearts(x: number, y: number, z: number, color: number, n: number, radius = 0.5, size = 0.2) {
    for (let i = 0; i < n; i++) {
      if (this.heartList.length >= this.maxHearts) { this.heartList.shift(); this.heartRgb.shift(); }
      const a = (i / n + fx.random() * 0.3) * Math.PI * 2, out = 0.3 + fx.random() * 0.4;
      const life = 0.8 + fx.random() * 0.5;
      this.heartList.push({
        x: x + Math.cos(a) * radius, y: y + (fx.random() - 0.5) * radius * 0.6, z: z + Math.sin(a) * radius,
        vx: Math.cos(a) * out, vy: 0.9 + fx.random() * 0.6, vz: Math.sin(a) * out,
        life, max: life, s: size * (0.8 + fx.random() * 0.4), calm: true,
      });
      this.heartRgb.push(color);
    }
  }

  /** A burst of cubes from a point. `calm` motes feel no gravity (light, not matter: DECISIONS §7.3). */
  burst(x: number, y: number, z: number, color: number, n: number, speed = 3, size = 0.08, calm = false) {
    for (let i = 0; i < n; i++) {
      if (this.list.length >= this.max) { this.list.shift(); this.rgb.shift(); }
      const life = 0.35 + fx.random() * 0.4;
      this.list.push({
        x, y, z,
        vx: (fx.random() - 0.5) * 2 * speed, vy: fx.random() * speed * 1.2, vz: (fx.random() - 0.5) * 2 * speed,
        life, max: life, s: size * (0.6 + fx.random() * 0.8), calm,
      });
      this.rgb.push(color);
    }
  }

  /**
   * Motes that drift in from a ring around a point and arrive there when `life` runs out (an omen
   * gathering). `floor` is the height of the ground under the point: no mote starts below floor + 0.1.
   */
  gather(x: number, y: number, z: number, color: number, n: number, radius: number, life: number, size = 0.05, floor = -Infinity) {
    for (let i = 0; i < n; i++) {
      if (this.list.length >= this.max) { this.list.shift(); this.rgb.shift(); }
      const a = fx.random() * Math.PI * 2;
      const sx = x + Math.cos(a) * radius, sy = Math.max(floor + 0.1, y + (fx.random() - 0.5) * radius), sz = z + Math.sin(a) * radius;
      this.list.push({
        x: sx, y: sy, z: sz,
        vx: (x - sx) / life, vy: (y - sy) / life, vz: (z - sz) / life,
        life, max: life, s: size * (0.6 + fx.random() * 0.8), calm: true,
      });
      this.rgb.push(color);
    }
  }

  /** Matter chips in a material's ramp, split 50 % base, 30 % dark, 20 % hi (DECISIONS §7.3). */
  burstRamp(x: number, y: number, z: number, colors: readonly [number, number, number], n: number, speed = 3, size = 0.08) {
    const counts = rampSplit(n);
    for (let k = 0; k < 3; k++) if (counts[k] > 0) this.burst(x, y, z, colors[k], counts[k], speed, size);
  }

  update(dt: number, eye?: { x: number; z: number }) {
    this.updateHearts(dt, eye);
    let n = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); this.rgb.splice(i, 1); continue; }
      if (!p.calm) p.vy -= 18 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    }
    for (let i = 0; i < this.list.length; i++) {
      const p = this.list[i];
      const s = p.s * Math.min(1, p.life / p.max * 2);
      this.m.makeScale(s, s, s).setPosition(p.x, p.y, p.z);
      this.mesh.setMatrixAt(n, this.m);
      this.c.setHex(this.rgb[i]);
      this.colors[n * 3] = this.c.r; this.colors[n * 3 + 1] = this.c.g; this.colors[n * 3 + 2] = this.c.b;
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor!.needsUpdate = true;
  }

  private updateHearts(dt: number, eye?: { x: number; z: number }) {
    for (let i = this.heartList.length - 1; i >= 0; i--) {
      const p = this.heartList[i];
      p.life -= dt;
      if (p.life <= 0) { this.heartList.splice(i, 1); this.heartRgb.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    }
    for (let i = 0; i < this.heartList.length; i++) {
      const p = this.heartList[i];
      const s = p.s * Math.min(1, p.life / p.max * 3);
      const yaw = eye ? Math.atan2(eye.x - p.x, eye.z - p.z) : 0;
      this.q.setFromAxisAngle(this.up, yaw);
      this.m.compose(this.v.set(p.x, p.y, p.z), this.q, this.k.set(s, s, s));
      this.heartMesh.setMatrixAt(i, this.m);
      this.c.setHex(this.heartRgb[i]);
      this.heartColors[i * 3] = this.c.r; this.heartColors[i * 3 + 1] = this.c.g; this.heartColors[i * 3 + 2] = this.c.b;
    }
    this.heartMesh.count = this.heartList.length;
    this.heartMesh.instanceMatrix.needsUpdate = true;
    this.heartMesh.instanceColor!.needsUpdate = true;
  }
}

/** Splits `n` matter chips over a ramp's [base, dark, hi]: 50 %, 30 %, 20 % (DECISIONS §7.3). */
export function rampSplit(n: number): [number, number, number] {
  const base = Math.round(n * 0.5), dark = Math.round(n * 0.3);
  return [base, dark, Math.max(0, n - base - dark)];
}
