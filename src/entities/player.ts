// First-person player: a 0.6 × 1.8 box against the grid, like Minecraft.
// Movement reads stats every frame; jumping and landing go through the game's events
// (via `PlayerHooks`) so items can change them.

import * as THREE from 'three';
import type { Input } from '../input/input';
import { moveBody, type Body } from '../physics/voxel-collide';
import { WALK, GRAVITY, JUMP_V, AIR_CONTROL, COYOTE, JUMP_BUFFER, LADDER } from '../physics/jump';
import type { Stats } from '../core/stats';
import type { ElementDef } from '../content/elements';
import type { PartDef } from '../content/parts';
import type { Flask } from '../content/potions';
import type { Actor, ActorId, Faction } from './actors';
import type { BloodRegen, HeartLayer } from './hearts';

export const EYE = 1.62;
const SLOW_FACTOR = 0.5;
/** Swimming (head under a fluid): gravity × SWIM_G, sinking capped, Space swims up. Wading: jump × WADE_JUMP. */
const ICE_GRIP = 0.12;
const SWIM_G = 0.2, SINK = 1.5, SWIM_UP = 3.4, SWIM_OUT = 5.2, WADE_JUMP = 0.7, SWIM_CONTROL = 0.5;
/** An air jump is refused when ground lies this close below the feet: the press waits in the buffer
 *  and becomes a ground jump on landing (SKY.md §9). */
export const AIR_JUMP_CLEARANCE = 0.6;
/** No jump rises higher than this, whatever the practices (SKY.md §9: the third jump's cap). */
export const APEX_CAP = 16;
/** How fast an external push fades, per second: on the ground, on ice, and in the air or water. */
const PUSH_DRAG = 8, PUSH_DRAG_ICE = 1, PUSH_DRAG_AIR = 2;

/** What the hand holds: a block (its material), a part a projection left (DESIGN §6), or a flask brewed in a laboratory. */
export type Carried = number | PartDef | Flask;

/** What the player's body is in this frame (docs/design/ELEMENTS.md §2: wade with your feet in, swim with your head under). */
export interface PlayerMedium { feet: ElementDef | null; head: ElementDef | null; slippery?: boolean }

/** Options of one `Player.update` call. */
export interface PlayerUpdateOptions {
  /** The effective `jump` stat is never below this (the sky passes 1: practices only make it easier, SKY.md §2.5). */
  minJump?: number;
}

/** A point the body is carried to (`Player.carry`). */
export interface PlayerPoint { x: number; y: number; z: number }

export interface PlayerHooks {
  /** Asked before jumping with the stat-based velocity; return the velocity to use, or null to cancel.
   *  `air` is the jump's step in the air: 0 on the ground (or within the coyote time), 1 for the first
   *  air jump, 2 for the second (SKY.md §9). */
  jump(velocity: number, air: number): number | null;
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
  /** What your hand holds, bottom to top. The active one is placed, thrown, drunk or fed first. */
  hand: Carried[] = [];
  /** The slot the player chose in the hand; -1 means the top (the newest carry). Choosing never moves an item. */
  activeSlot = -1;
  keys = 0;
  bombs = 1;
  /** Health in damage points (max = HEART × the maxHearts stat; the HUD draws quarter hearts). */
  hp = 24;
  layers: HeartLayer[] = [];
  starT = 0;
  blood: BloodRegen | null = null;
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
  /** Seconds the body is held in place (SKY.md §6): move and jump input are ignored; looking and shooting are not. */
  heldT = 0;
  /** Air jumps made since the last landing: the `airJumps` stat minus this is what is left, and the next
   *  one climbs to step `airStep + 1` of the ladder. Landing sets it back to 0. */
  airStep = 0;
  private jumpBuffer = 0;
  private coyote = 0;
  /** An external push, blocks/s, laid over the walk and fading on its own (a vertical push goes straight to `vy`). */
  private pushX = 0; private pushZ = 0;
  /** The current carry: the body eases from `from` to `to` over `s` seconds. */
  private carrying: { from: PlayerPoint; to: PlayerPoint; s: number; t: number } | null = null;

  /** The slot of the active carried item, or -1 when the hand is empty. */
  get activeIndex(): number {
    const n = this.hand.length;
    if (n === 0) return -1;
    return this.activeSlot >= 0 && this.activeSlot < n ? this.activeSlot : n - 1;
  }

  /** The carried item the next use targets (place, throw, drink, the alembic, the kitchen). */
  get active(): Carried | undefined { const i = this.activeIndex; return i < 0 ? undefined : this.hand[i]; }

  /** The material of the active block: 0 when the hand is empty or its active item is a part. */
  get top() { const c = this.active; return typeof c === 'number' ? c : 0; }

  /** Chooses a carried item by its slot; a slot out of the hand is ignored. */
  select(slot: number) { if (slot >= 0 && slot < this.hand.length) this.activeSlot = slot; }

  /** Steps the choice through the hand, wrapping round. */
  cycle(step: 1 | -1) {
    const n = this.hand.length;
    if (n) this.select((this.activeIndex + step + n) % n);
  }

  /** A new carry goes on top and becomes the choice again. */
  gain(c: Carried) { this.hand.push(c); this.activeSlot = -1; }

  /**
   * Takes one carried item out of the hand (a placement, a throw, a gift, a toll). The choice stays on
   * the same item: an item leaving before it moves the choice down one slot with it. Only losing the
   * active item itself sends the choice back to the last valid slot, the top.
   */
  removeAt(i: number): Carried | undefined {
    if (i < 0 || i >= this.hand.length) return undefined;
    const active = this.activeIndex;
    const [c] = this.hand.splice(i, 1);
    if (i === active) this.activeSlot = -1;
    else if (i < active) this.activeSlot = active - 1;
    return c;
  }

  /** Takes the active carried item out of the hand; the choice goes back to the top. */
  takeActive(): Carried | undefined {
    const i = this.activeIndex;
    return i < 0 ? undefined : this.removeAt(i);
  }

  /**
   * Puts the body at a point, still, and drops every motion in progress: a carry, a push, a hold, the
   * jump buffer, the coyote time and the air jumps spent. The Player lives across travel and runs, so
   * whatever moved it before must not move it after (a carry would drag it, a hold would keep it).
   * `float` stays: travel to heaven sets it just before. Timed states (slow, mute) belong to the run:
   * `clearStates` drops them when a run begins.
   */
  spawnAt(x: number, y: number, z: number) {
    Object.assign(this.body, { x, y, z, vx: 0, vy: 0, vz: 0 });
    this.carrying = null;
    this.pushX = this.pushZ = 0;
    this.heldT = 0;
    this.airStep = 0;
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.wishX = this.wishZ = 0;
  }

  /** A new run: no slow, no mute, no fall from heaven carried over from the last one. */
  clearStates() {
    this.slowT = 0;
    this.muteT = 0;
    this.float = false;
  }

  /**
   * An external push (a hindrance: knockback, a gust). `vx`, `vz` add to a velocity of their own that is
   * laid over the walk after its blend and fades (fast on the ground, slowly in the air, stopped by a wall);
   * `vy` adds to the vertical speed, which gravity takes back. A steady force calls it every frame with
   * `acceleration · dt`.
   */
  push(vx: number, vy: number, vz: number) {
    if (!Number.isFinite(vx + vy + vz) || this.carrying) return;
    this.pushX += vx; this.pushZ += vz;
    this.body.vx += vx; this.body.vz += vz;
    this.body.vy += vy;
  }

  /** Hold the body for `s` seconds (paralysis): no walking or jumping; looking and shooting stay. The longer hold wins. */
  hold(s: number) {
    if (s > 0) this.heldT = Math.max(this.heldT, s);
  }

  /** Carry the body to `to` over `s` seconds (a trunk, a lifting gust): input is held while it moves, gravity waits. */
  carry(to: PlayerPoint, s: number) {
    const b = this.body;
    this.carrying = { from: { x: b.x, y: b.y, z: b.z }, to: { x: to.x, y: to.y, z: to.z }, s: Math.max(1e-3, s), t: 0 };
    this.pushX = this.pushZ = 0;
  }

  /** Being carried this frame. */
  get carried() { return this.carrying !== null; }

  get eye() { return new THREE.Vector3(this.body.x, this.body.y + EYE, this.body.z); }

  get forward() {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  update(dt: number, input: Input, stats: Stats, solid: (x: number, y: number, z: number) => boolean, hooks: PlayerHooks,
    medium: PlayerMedium = { feet: null, head: null }, opts: PlayerUpdateOptions = {}) {
    this.yaw -= input.lookDX * input.sensitivity;
    this.pitch = Math.max(-1.55, Math.min(1.55, this.pitch - input.lookDY * input.sensitivity));
    this.slowT = Math.max(0, this.slowT - dt);
    this.muteT = Math.max(0, this.muteT - dt);
    this.heldT = Math.max(0, this.heldT - dt);
    const b = this.body;
    if (this.carrying) this.carryStep(dt, solid);
    else this.walk(dt, input, stats, Math.max(stats.jump, opts.minJump ?? -Infinity), solid, hooks, medium);
    if (b.onGround) this.walkPhase += Math.hypot(b.vx, b.vz) * dt;
    this.fireCooldown -= dt;
    this.invulnT = Math.max(0, this.invulnT - dt);
  }

  /** One frame of a carry: the body eases toward the point (smoothstep) and stops against blocks. */
  private carryStep(dt: number, solid: (x: number, y: number, z: number) => boolean) {
    const c = this.carrying!, b = this.body;
    this.wishX = this.wishZ = 0;
    this.jumpBuffer = 0;
    c.t = Math.min(c.s, c.t + dt);
    const u = c.t / c.s, e = u * u * (3 - 2 * u);
    if (dt > 0) {
      b.vx = (c.from.x + (c.to.x - c.from.x) * e - b.x) / dt;
      b.vy = (c.from.y + (c.to.y - c.from.y) * e - b.y) / dt;
      b.vz = (c.from.z + (c.to.z - c.from.z) * e - b.z) / dt;
      moveBody(solid, b, dt);
    }
    if (c.t >= c.s) {
      this.carrying = null;
      b.vx = b.vy = b.vz = 0;
    }
  }

  private walk(dt: number, input: Input, stats: Stats, jumpStat: number, solid: (x: number, y: number, z: number) => boolean,
    hooks: PlayerHooks, medium: PlayerMedium) {
    const held = this.heldT > 0;
    const { x: s, y: f } = held ? { x: 0, y: 0 } : input.move;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = -sin * f + cos * s, wz = -cos * f - sin * s;
    const l = Math.hypot(wx, wz);
    if (l > 1) { wx /= l; wz /= l; }
    this.wishX = wx; this.wishZ = wz;
    const fluid = medium.feet?.fluid ? medium.feet : null;
    const swim = !!medium.head?.swim;
    this.swimming = swim;
    const speed = WALK * stats.moveSpeed * (fluid ? fluid.wade : 1) * (this.slowT > 0 ? SLOW_FACTOR : 1);
    const b = this.body;
    if (b.onGround) this.airStep = 0;
    // the third jump of the ladder steers fully in the air, and adds no forward speed (SKY.md §9)
    const air = this.airStep >= LADDER.length - 1 ? 1 : AIR_CONTROL;
    // on ice you keep sliding: far less grip to start, turn or stop
    const k = swim ? SWIM_CONTROL : b.onGround ? (medium.slippery ? ICE_GRIP : 1) : air;
    const blend = 1 - Math.exp(-14 * k * dt);
    // the walk blends its own velocity; an external push is laid over it afterwards and fades on its own
    const ownX = b.vx - this.pushX, ownZ = b.vz - this.pushZ;
    if (this.pushX !== 0 || this.pushZ !== 0) {
      const fade = Math.exp(-(b.onGround && !swim ? (medium.slippery ? PUSH_DRAG_ICE : PUSH_DRAG) : PUSH_DRAG_AIR) * dt);
      this.pushX = Math.abs(this.pushX * fade) < 1e-3 ? 0 : this.pushX * fade;
      this.pushZ = Math.abs(this.pushZ * fade) < 1e-3 ? 0 : this.pushZ * fade;
    }
    b.vx = ownX + (wx * speed - ownX) * blend + this.pushX;
    b.vz = ownZ + (wz * speed - ownZ) * blend + this.pushZ;

    // jump with a little leeway (coyote time and input buffer)
    if (held) this.jumpBuffer = 0;
    else if (input.hit('jump')) this.jumpBuffer = JUMP_BUFFER;
    this.jumpBuffer -= dt;
    this.coyote = b.onGround ? COYOTE : this.coyote - dt;
    if (swim) {
      // you lose your footing: you sink slowly, and holding Space swims up (and out at the edge)
      this.jumpBuffer = 0;
      b.vy = Math.max(b.vy - GRAVITY * SWIM_G * dt, -SINK);
      if (!held && input.held('jump')) b.vy += (SWIM_UP * Math.sqrt(jumpStat) - b.vy) * (1 - Math.exp(-6 * dt));
    } else if (fluid?.swim && !b.onGround && !held && input.held('jump')) {
      // treading at the surface: Space lifts you out over the edge, like climbing onto a jetty
      b.vy = Math.max(b.vy - GRAVITY * dt, SWIM_OUT * Math.sqrt(jumpStat));
    } else {
      if (this.jumpBuffer > 0 && this.coyote > 0) {
        const v = hooks.jump(capped(JUMP_V * Math.sqrt(jumpStat) * (fluid ? Math.sqrt(WADE_JUMP) : 1)), 0);
        if (v !== null) b.vy = v;
        this.jumpBuffer = 0; this.coyote = 0;
      } else if (this.jumpBuffer > 0 && this.airStep < Math.floor(stats.airJumps) && !this.float && !this.groundNear(solid)) {
        // an air jump: the next step on the ladder (2×, then 8× the height of a ground jump)
        const step = Math.min(this.airStep + 1, LADDER.length - 1);
        this.airStep++;
        const v = hooks.jump(capped(JUMP_V * Math.sqrt(jumpStat * LADDER[step])), this.airStep);
        if (v !== null) b.vy = v;
        this.jumpBuffer = 0;
      }
      b.vy = Math.max(b.vy - GRAVITY * (this.float ? 0.15 : 1) * dt, this.float ? -6 : fluid ? -SINK * 4 : -40);
    }
    const wasGround = b.onGround, fall = -b.vy, rise = b.vy, pvx = b.vx, pvz = b.vz;
    moveBody(solid, b, dt);
    // a wall stops the push too
    if (pvx !== 0 && b.vx === 0) this.pushX = 0;
    if (pvz !== 0 && b.vz === 0) this.pushZ = 0;
    if (b.onGround && this.float) this.float = false;
    else if (b.onGround && !wasGround && fall > 2) hooks.land(fall, b.x, b.y, b.z);
    if (rise > 0 && b.vy === 0 && !b.onGround) b.vy = hooks.bump(rise);
  }

  /** Solid ground within `AIR_JUMP_CLEARANCE` below the feet (any cell under the body's footprint). */
  private groundNear(solid: (x: number, y: number, z: number) => boolean): boolean {
    const b = this.body, e = 1e-4;
    const x0 = Math.floor(b.x - b.hw + e), x1 = Math.floor(b.x + b.hw - e);
    const z0 = Math.floor(b.z - b.hw + e), z1 = Math.floor(b.z + b.hw - e);
    const y0 = Math.floor(b.y - AIR_JUMP_CLEARANCE), y1 = Math.floor(b.y - e);
    for (let y = y1; y >= y0; y--) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++)
      if (solid(x, y, z)) return true;
    return false;
  }
}

/** The take-off speed that rises exactly `APEX_CAP` blocks: no jump leaves faster. */
const V_CAP = Math.sqrt(2 * GRAVITY * APEX_CAP);
function capped(v: number): number { return Math.min(v, V_CAP); }
