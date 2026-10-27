// Cube particles (intention splashes and block chips) in a single InstancedMesh.

import { fx } from '../core/fx';
import * as THREE from 'three';

interface P { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; s: number; calm?: boolean }

export class Particles {
  private list: P[] = [];
  private mesh: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private c = new THREE.Color();

  constructor(scene: THREE.Scene, private max = 600) {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.colors = new Float32Array(max * 3);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(this.colors, 3);
  }
  private colors: Float32Array;
  private rgb: number[] = [];

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

  update(dt: number) {
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
}

/** Splits `n` matter chips over a ramp's [base, dark, hi]: 50 %, 30 %, 20 % (DECISIONS §7.3). */
export function rampSplit(n: number): [number, number, number] {
  const base = Math.round(n * 0.5), dark = Math.round(n * 0.3);
  return [base, dark, Math.max(0, n - base - dark)];
}
