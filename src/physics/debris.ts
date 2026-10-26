// Loose blocks with physics (Rapier). A broken block becomes a cube that falls, tumbles,
// can be picked up and kicked, and despawns after a while (see docs/DESIGN.md §5).

import RAPIER from '@dimforge/rapier3d-compat';
import type { VoxelWorld } from '../world/world';

export const DEBRIS_SIZE = 0.72;          // loose cube edge length
export const DEBRIS_LIFETIME = 90;        // seconds until it despawns
export const DEBRIS_BLINK = 10;           // blinks for the last seconds

export interface Debris {
  id: number;
  material: number;
  body: RAPIER.RigidBody;
  age: number;
  /** Cannot be picked up or kicked until this runs out (so you don't grab what you just kicked). */
  cooldown: number;
}

export async function initPhysics() { await RAPIER.init(); }

export class DebrisSystem {
  readonly world: RAPIER.World;
  readonly items: Debris[] = [];
  private terrain: RAPIER.Collider;
  private nextId = 1;
  private acc = 0;
  static readonly STEP = 1 / 60;

  constructor(voxels: VoxelWorld, readonly max: number) {
    this.world = new RAPIER.World({ x: 0, y: -22, z: 0 });
    this.world.timestep = DebrisSystem.STEP;
    // the whole world as a single voxel collider (it is small in M0)
    const coords: number[] = [];
    for (let z = 0; z < voxels.sz; z++) for (let y = 0; y < voxels.sy; y++) for (let x = 0; x < voxels.sx; x++)
      if (voxels.solid(x, y, z)) coords.push(x, y, z);
    const desc = RAPIER.ColliderDesc.voxels(new Int32Array(coords), { x: 1, y: 1, z: 1 }).setFriction(0.9);
    this.terrain = this.world.createCollider(desc);
  }

  /** Keeps the terrain collider in sync and wakes anything resting nearby. */
  setVoxel(x: number, y: number, z: number, filled: boolean) {
    this.terrain.setVoxel(x, y, z, filled);
    for (const d of this.items) {
      const p = d.body.translation();
      if (Math.abs(p.x - x - 0.5) < 2 && Math.abs(p.y - y - 0.5) < 2 && Math.abs(p.z - z - 0.5) < 2) d.body.wakeUp();
    }
  }

  spawn(material: number, x: number, y: number, z: number, vx = 0, vy = 0, vz = 0): Debris {
    if (this.items.length >= this.max) this.remove(this.oldest());
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(x, y, z)
        .setLinvel(vx, vy, vz)
        .setAngvel({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 6, z: (Math.random() - 0.5) * 6 })
        .setLinearDamping(0.15).setAngularDamping(0.4)
        .setCcdEnabled(true),
    );
    const h = DEBRIS_SIZE / 2;
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(h, h, h).setDensity(1.5).setFriction(0.8).setRestitution(0.15),
      body,
    );
    const d: Debris = { id: this.nextId++, material, body, age: 0, cooldown: 0.25 };
    this.items.push(d);
    return d;
  }

  remove(d: Debris | undefined) {
    if (!d) return;
    const i = this.items.indexOf(d);
    if (i >= 0) this.items.splice(i, 1);
    this.world.removeRigidBody(d.body);
  }

  private oldest() { return this.items.reduce((a, b) => (b.age > a.age ? b : a), this.items[0]); }

  update(dt: number) {
    this.acc = Math.min(this.acc + dt, DebrisSystem.STEP * 4);
    while (this.acc >= DebrisSystem.STEP) { this.world.step(); this.acc -= DebrisSystem.STEP; }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const d = this.items[i];
      d.age += dt;
      d.cooldown -= dt;
      const p = d.body.translation();
      if (d.age > DEBRIS_LIFETIME || p.y < -20) this.remove(d);
    }
  }

  /** Whether it is visible this frame (blinks near the end of its life). */
  visible(d: Debris, time: number) {
    const left = DEBRIS_LIFETIME - d.age;
    return left > DEBRIS_BLINK || Math.floor(time * (left < 3 ? 12 : 5)) % 2 === 0;
  }

  /** Pushes out cubes that overlap a freshly placed block. */
  clearCell(x: number, y: number, z: number) {
    for (const d of this.items) {
      const p = d.body.translation();
      if (Math.abs(p.x - x - 0.5) < 0.86 && Math.abs(p.y - y - 0.5) < 0.86 && Math.abs(p.z - z - 0.5) < 0.86) {
        d.body.setTranslation({ x: p.x, y: y + 1 + DEBRIS_SIZE / 2 + 0.02, z: p.z }, true);
      }
    }
  }
}
