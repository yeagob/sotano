// Cube particles (intention splashes and block chips) in a single InstancedMesh.

import { fx } from '../core/fx';
import * as THREE from 'three';

interface P { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; s: number }

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

  burst(x: number, y: number, z: number, color: number, n: number, speed = 3, size = 0.08) {
    for (let i = 0; i < n; i++) {
      if (this.list.length >= this.max) { this.list.shift(); this.rgb.shift(); }
      const life = 0.35 + fx.random() * 0.4;
      this.list.push({
        x, y, z,
        vx: (fx.random() - 0.5) * 2 * speed, vy: fx.random() * speed * 1.2, vz: (fx.random() - 0.5) * 2 * speed,
        life, max: life, s: size * (0.6 + fx.random() * 0.8),
      });
      this.rgb.push(color);
    }
  }

  update(dt: number) {
    let n = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); this.rgb.splice(i, 1); continue; }
      p.vy -= 18 * dt;
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
