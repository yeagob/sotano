// Intentions (the player's projectiles): fly straight for `flight` seconds, then fall under
// gravity (see docs/DESIGN.md §4).

import * as THREE from 'three';
import type { Stats } from '../core/stats';
import type { IntentSpec } from '../game/events';
import { raycastVoxels, type VoxelHit } from '../physics/raycast';
import { DEBRIS_SIZE, type Debris } from '../physics/debris';

export function intentFromStats(s: Stats): IntentSpec {
  return {
    damage: s.damage,
    mining: s.mining,
    speed: 16 * s.shotSpeed,
    flight: 0.5 * s.range,
    gravity: 22 * s.gravity,
    radius: 0.12 * s.size,
    pierce: 0,
    color: 0x9fd3ff,
  };
}

interface Intent { spec: IntentSpec; pos: THREE.Vector3; vel: THREE.Vector3; age: number; hitDebris: Set<number> }

export interface IntentHooks {
  solid(x: number, y: number, z: number): boolean;
  /** Returns true if the block broke. */
  hitBlock(hit: VoxelHit, intent: IntentSpec): boolean;
  /** Is the block soft (tier 0), and therefore something `pierce` can go through? */
  soft(x: number, y: number, z: number): boolean;
  debris(): readonly Debris[];
  splash(p: THREE.Vector3, color: number, big: boolean): void;
}

export class Intents {
  private list: Intent[] = [];
  private mesh: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private c = new THREE.Color();

  constructor(scene: THREE.Scene, private hooks: IntentHooks, private max = 200) {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85 });
    this.mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    scene.add(this.mesh);
  }

  get count() { return this.list.length; }

  fire(spec: IntentSpec, from: THREE.Vector3, dir: THREE.Vector3, inherit: THREE.Vector3) {
    if (this.list.length >= this.max) this.list.shift();
    const vel = dir.clone().normalize().multiplyScalar(spec.speed).addScaledVector(inherit, 0.5);
    this.list.push({ spec, pos: from.clone(), vel, age: 0, hitDebris: new Set() });
  }

  update(dt: number) {
    const h = this.hooks;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      t.age += dt;
      if (t.age > t.spec.flight) t.vel.y -= t.spec.gravity * dt;
      const step = t.vel.clone().multiplyScalar(dt);
      const dist = step.length();
      let dead = false;

      // against loose cubes: push them
      for (const d of h.debris()) {
        if (t.hitDebris.has(d.id)) continue;
        const p = d.body.translation();
        const r = DEBRIS_SIZE / 2 + t.spec.radius;
        if (Math.abs(p.x - t.pos.x) < r && Math.abs(p.y - t.pos.y) < r && Math.abs(p.z - t.pos.z) < r) {
          const imp = t.vel.clone().normalize().multiplyScalar(0.25 + t.spec.damage * 0.06);
          d.body.applyImpulseAtPoint(imp, { x: t.pos.x, y: t.pos.y, z: t.pos.z }, true);
          t.hitDebris.add(d.id);
          h.splash(t.pos, t.spec.color, false);
          dead = true;
          break;
        }
      }

      // against the world (piercing through soft blocks)
      if (!dead) {
        const hit = raycastVoxels(h.solid, t.pos.x, t.pos.y, t.pos.z, step.x, step.y, step.z, dist);
        if (hit) {
          const hitPos = t.pos.clone().addScaledVector(step, dist ? hit.t / dist : 0);
          const soft = h.soft(hit.x, hit.y, hit.z);
          const broke = h.hitBlock(hit, t.spec);
          h.splash(hitPos, t.spec.color, broke);
          if (broke && soft && t.spec.pierce > 0) { t.spec = { ...t.spec, pierce: t.spec.pierce - 1 }; t.pos.copy(hitPos); }
          else dead = true;
        } else t.pos.add(step);
      }
      if (dead || t.age > 6) this.list.splice(i, 1);
    }
    this.draw();
  }

  private draw() {
    let n = 0;
    for (const t of this.list) {
      const r = t.spec.radius;
      this.m.makeScale(r, r, r).setPosition(t.pos);
      this.mesh.setMatrixAt(n, this.m);
      this.mesh.setColorAt(n, this.c.setHex(t.spec.color));
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
