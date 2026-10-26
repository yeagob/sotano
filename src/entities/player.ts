// First-person player: a 0.6 × 1.8 box against the grid, like Minecraft.

import * as THREE from 'three';
import type { Input } from '../input/input';
import { moveBody, type Body } from '../physics/voxel-collide';
import type { Stats } from '../core/stats';

export const EYE = 1.62;
const WALK = 4.6, GRAVITY = 28, JUMP_V = 8.4, AIR_CONTROL = 0.35;

export class Player {
  body: Body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: false };
  yaw = 0; pitch = 0;
  /** Material of the block in your hand (0 = none). */
  held = 0;
  fireCooldown = 0;
  /** Distance walked on the ground (drives camera and hand bobbing). */
  walkPhase = 0;
  private jumpBuffer = 0;
  private coyote = 0;

  spawnAt(x: number, y: number, z: number) {
    Object.assign(this.body, { x, y, z, vx: 0, vy: 0, vz: 0 });
  }

  get eye() { return new THREE.Vector3(this.body.x, this.body.y + EYE, this.body.z); }

  get forward() {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  update(dt: number, input: Input, stats: Stats, solid: (x: number, y: number, z: number) => boolean) {
    this.yaw -= input.lookDX * input.sensitivity;
    this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch - input.lookDY * input.sensitivity));

    const f = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
    const s = input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']);
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = -sin * f + cos * s, wz = -cos * f - sin * s;
    const l = Math.hypot(wx, wz);
    if (l > 1) { wx /= l; wz /= l; }
    const speed = WALK * stats.moveSpeed;
    const b = this.body;
    const k = b.onGround ? 1 : AIR_CONTROL;
    const blend = 1 - Math.exp(-14 * k * dt);
    b.vx += (wx * speed - b.vx) * blend;
    b.vz += (wz * speed - b.vz) * blend;

    // jump with a little leeway (coyote time and input buffer)
    if (input.pressed.has('Space')) this.jumpBuffer = 0.12;
    this.jumpBuffer -= dt;
    this.coyote = b.onGround ? 0.1 : this.coyote - dt;
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      b.vy = JUMP_V * Math.sqrt(stats.jump);
      this.jumpBuffer = 0; this.coyote = 0;
    }
    b.vy = Math.max(b.vy - GRAVITY * dt, -40);
    moveBody(solid, b, dt);
    if (b.onGround) this.walkPhase += Math.hypot(b.vx, b.vz) * dt;
    this.fireCooldown -= dt;
  }
}
