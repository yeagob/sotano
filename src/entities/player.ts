// First-person player: a 0.6 × 1.8 box against the grid, like Minecraft.
// Movement reads stats every frame; jumping and landing go through the game's events
// (via `PlayerHooks`) so items can change them.

import * as THREE from 'three';
import type { Input } from '../input/input';
import { moveBody, type Body } from '../physics/voxel-collide';
import type { Stats } from '../core/stats';
import type { ElementDef } from '../content/elements';
import type { PartDef } from '../content/parts';
import type { Actor, ActorId, Faction } from './actors';

export const EYE = 1.62;
const WALK = 4.6, GRAVITY = 28, JUMP_V = 8.4, AIR_CONTROL = 0.35;
const SLOW_FACTOR = 0.5;
/** Swimming (head under a fluid): gravity × SWIM_G, sinking capped, Space swims up. Wading: jump × WADE_JUMP. */
const ICE_GRIP = 0.12;
const SWIM_G = 0.2, SINK = 1.5, SWIM_UP = 3.4, SWIM_OUT = 5.2, WADE_JUMP = 0.7, SWIM_CONTROL = 0.5;

/** What the hand holds: a block (its material) or a part a projection left (DESIGN §6). */
export type Carried = number | PartDef;

/** What the player's body is in this frame (docs/design/ELEMENTS.md §2: wade with your feet in, swim with your head under). */
export interface PlayerMedium { feet: ElementDef | null; head: ElementDef | null; slippery?: boolean }

export interface PlayerHooks {
  /** Asked before jumping with the stat-based velocity; return the velocity to use, or null to cancel. */
  jump(velocity: number): number | null;
  /** Touched the ground after falling at `fallSpeed` blocks/s. */
  land(fallSpeed: number, x: number, y: number, z: number): void;
  /** The head hit a ceiling while rising at `speed` blocks/s; returns the upward speed to keep. */
  bump(speed: number): number;
}

/** The player: an actor like any projection (docs/architecture/ACTORS.md), plus input, a hand and counters. */
export class Player implements Actor {
  /** Set by the game at the start of each run (the first actor registered). */
  id: ActorId = 0;
  readonly kind = 'player' as const;
  readonly def = 'player';
  faction: Faction = 'self';
  tags = new Set<string>();
  room = -1;
  readonly spawning = 0;
  get alive() { return !this.dead; }
  set alive(v: boolean) { this.dead = !v; }
  body: Body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: false };
  yaw = 0; pitch = 0;
  /** What your hand holds, bottom to top. The top one is placed or thrown first. */
  hand: Carried[] = [];
  keys = 0;
  bombs = 1;
  /** Health in damage points (max = HEART × the maxHearts stat; the HUD draws quarter hearts). */
  hp = 24;
  /** Seconds of invulnerability left after a hit. */
  invulnT = 0;
  slowT = 0;
  muteT = 0;
  dead = false;
  fireCooldown = 0;
  /** Distance walked on the ground (drives camera and hand bobbing). */
  walkPhase = 0;
  /** Seconds of breath left (refills at the surface; the game drains it under water). */
  breath = 8;
  /** Falling from heaven: gravity is gentle until the first landing, which never hurts. */
  float = false;
  /** Swimming this frame (head under a fluid you can swim in). */
  swimming = false;
  /** Direction the player is trying to move this frame (unit or zero), for contact checks. */
  wishX = 0; wishZ = 0;
  private jumpBuffer = 0;
  private coyote = 0;

  /** The material of the top block: 0 when the hand is empty or its top is a part. */
  get top() { const c = this.hand.at(-1); return typeof c === 'number' ? c : 0; }

  spawnAt(x: number, y: number, z: number) {
    Object.assign(this.body, { x, y, z, vx: 0, vy: 0, vz: 0 });
  }

  get eye() { return new THREE.Vector3(this.body.x, this.body.y + EYE, this.body.z); }

  get forward() {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  update(dt: number, input: Input, stats: Stats, solid: (x: number, y: number, z: number) => boolean, hooks: PlayerHooks,
    medium: PlayerMedium = { feet: null, head: null }) {
    this.yaw -= input.lookDX * input.sensitivity;
    this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch - input.lookDY * input.sensitivity));

    const { x: s, y: f } = input.move;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = -sin * f + cos * s, wz = -cos * f - sin * s;
    const l = Math.hypot(wx, wz);
    if (l > 1) { wx /= l; wz /= l; }
    this.wishX = wx; this.wishZ = wz;
    const fluid = medium.feet?.fluid ? medium.feet : null;
    const swim = !!medium.head?.swim;
    this.swimming = swim;
    this.slowT = Math.max(0, this.slowT - dt);
    this.muteT = Math.max(0, this.muteT - dt);
    const speed = WALK * stats.moveSpeed * (fluid ? fluid.wade : 1) * (this.slowT > 0 ? SLOW_FACTOR : 1);
    const b = this.body;
    // on ice you keep sliding: far less grip to start, turn or stop
    const k = swim ? SWIM_CONTROL : b.onGround ? (medium.slippery ? ICE_GRIP : 1) : AIR_CONTROL;
    const blend = 1 - Math.exp(-14 * k * dt);
    b.vx += (wx * speed - b.vx) * blend;
    b.vz += (wz * speed - b.vz) * blend;

    // jump with a little leeway (coyote time and input buffer)
    if (input.hit('jump')) this.jumpBuffer = 0.12;
    this.jumpBuffer -= dt;
    this.coyote = b.onGround ? 0.1 : this.coyote - dt;
    if (swim) {
      // you lose your footing: you sink slowly, and holding Space swims up (and out at the edge)
      this.jumpBuffer = 0;
      b.vy = Math.max(b.vy - GRAVITY * SWIM_G * dt, -SINK);
      if (input.held('jump')) b.vy += (SWIM_UP * Math.sqrt(stats.jump) - b.vy) * (1 - Math.exp(-6 * dt));
    } else if (fluid?.swim && !b.onGround && input.held('jump')) {
      // treading at the surface: Space lifts you out over the edge, like climbing onto a jetty
      b.vy = Math.max(b.vy - GRAVITY * dt, SWIM_OUT * Math.sqrt(stats.jump));
    } else {
      if (this.jumpBuffer > 0 && this.coyote > 0) {
        const v = hooks.jump(JUMP_V * Math.sqrt(stats.jump) * (fluid ? Math.sqrt(WADE_JUMP) : 1));
        if (v !== null) b.vy = v;
        this.jumpBuffer = 0; this.coyote = 0;
      }
      b.vy = Math.max(b.vy - GRAVITY * (this.float ? 0.15 : 1) * dt, this.float ? -6 : fluid ? -SINK * 4 : -40);
    }
    const wasGround = b.onGround, fall = -b.vy, rise = b.vy;
    moveBody(solid, b, dt);
    if (b.onGround && this.float) this.float = false;
    else if (b.onGround && !wasGround && fall > 2) hooks.land(fall, b.x, b.y, b.z);
    if (rise > 0 && b.vy === 0 && !b.onGround) b.vy = hooks.bump(rise);
    if (b.onGround) this.walkPhase += Math.hypot(b.vx, b.vz) * dt;
    this.fireCooldown -= dt;
    this.invulnT = Math.max(0, this.invulnT - dt);
  }
}
