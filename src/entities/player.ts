// First-person player: a 0.6 × 1.8 box against the grid, like Minecraft.
// Movement reads stats every frame; jumping and landing go through the game's events
// (via `PlayerHooks`) so items can change them.

import * as THREE from 'three';
import type { Input } from '../input/input';
import { moveBody, type Body } from '../physics/voxel-collide';
import type { Stats } from '../core/stats';
import type { Actor, ActorId, Faction } from './actors';

export const EYE = 1.62;
const WALK = 4.6, GRAVITY = 28, JUMP_V = 8.4, AIR_CONTROL = 0.35;

export interface PlayerHooks {
  /** Asked before jumping with the stat-based velocity; return the velocity to use, or null to cancel. */
  jump(velocity: number): number | null;
  /** Touched the ground after falling at `fallSpeed` blocks/s. */
  land(fallSpeed: number): void;
}

/** The player: an actor like any projection (docs/architecture/ACTORS.md), plus input, a hand and counters. */
export class Player implements Actor {
  /** Set by the game at the start of each run (the first actor registered). */
  id: ActorId = 0;
  readonly kind = 'player' as const;
  readonly def = 'player';
  faction: Faction = 'self';
  readonly halfHearts = true as const;
  tags = new Set<string>();
  room = -1;
  readonly spawning = 0;
  get alive() { return !this.dead; }
  set alive(v: boolean) { this.dead = !v; }
  body: Body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: false };
  yaw = 0; pitch = 0;
  /** Blocks in your hand, bottom to top (materials). The top one is placed/thrown first. */
  hand: number[] = [];
  keys = 0;
  bombs = 1;
  /** Health in half-hearts (max = 2 × the maxHearts stat). */
  hp = 6;
  /** Seconds of invulnerability left after a hit. */
  invulnT = 0;
  dead = false;
  fireCooldown = 0;
  /** Distance walked on the ground (drives camera and hand bobbing). */
  walkPhase = 0;
  /** Direction the player is trying to move this frame (unit or zero), for contact checks. */
  wishX = 0; wishZ = 0;
  private jumpBuffer = 0;
  private coyote = 0;

  get top() { return this.hand.length ? this.hand[this.hand.length - 1] : 0; }

  spawnAt(x: number, y: number, z: number) {
    Object.assign(this.body, { x, y, z, vx: 0, vy: 0, vz: 0 });
  }

  get eye() { return new THREE.Vector3(this.body.x, this.body.y + EYE, this.body.z); }

  get forward() {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  update(dt: number, input: Input, stats: Stats, solid: (x: number, y: number, z: number) => boolean, hooks: PlayerHooks) {
    this.yaw -= input.lookDX * input.sensitivity;
    this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch - input.lookDY * input.sensitivity));

    const f = input.axis(['KeyS', 'ArrowDown'], ['KeyW', 'ArrowUp']);
    const s = input.axis(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']);
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = -sin * f + cos * s, wz = -cos * f - sin * s;
    const l = Math.hypot(wx, wz);
    if (l > 1) { wx /= l; wz /= l; }
    this.wishX = wx; this.wishZ = wz;
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
      const v = hooks.jump(JUMP_V * Math.sqrt(stats.jump));
      if (v !== null) b.vy = v;
      this.jumpBuffer = 0; this.coyote = 0;
    }
    b.vy = Math.max(b.vy - GRAVITY * dt, -40);
    const wasGround = b.onGround, fall = -b.vy;
    moveBody(solid, b, dt);
    if (b.onGround && !wasGround && fall > 2) hooks.land(fall);
    if (b.onGround) this.walkPhase += Math.hypot(b.vx, b.vz) * dt;
    this.fireCooldown -= dt;
    this.invulnT = Math.max(0, this.invulnT - dt);
  }
}
