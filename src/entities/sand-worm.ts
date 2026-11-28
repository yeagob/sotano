// The great worm of the deep desert (issue #354, docs/design/built/levels/worm-desert/WORM.md). One creature, not a
// projection: it cannot be hurt or killed, only calmed. Pure rules, no Game and no THREE, so the tests drive it.
//
// The worm is a chain of box segments that follow the head's trail (follow the leader). It swims through the sand
// as a drawn body: it never writes a block while it moves, so the mesher never sees it. The only blocks it touches are
// the crack line it breaks before it leaps (CRACK_CELLS cells, one at a time).
//
//   hidden ── the player stands in the basin ──▶ telegraph (the ground cracks in a line toward the leap point)
//   telegraph ──▶ breach (the head leaps out of the sand toward the player, the body arches behind it)
//   breach ──▶ cruise (the back swims over the sand: a platform the width of the body)
//   cruise ──▶ dive (no rider for CRUISE_S, or after the reward) ──▶ hidden, or gone once it has given its gift
//
// Riding: while the body touches the back it is carried with it. Positive intentions that hit the head, fired while
// the rider stands on the head, calm it; at TAME_HITS it is tame and the rider steers it from the head, inside the
// basin only. Negative intentions do nothing at all. Stepping off a tame worm onto the ground is the dismount.

import { WORM_STEER_R } from '../world/worm-desert';

export const WORM = {
  /** Half the body's width and height: a diameter of 16 blocks (owner: 15 to 20). */
  radius: 8,
  segments: 12,
  /** Blocks between two segment centres along the spine, and the plates' length: contiguous, so no joint to fall into. */
  segLen: 9,
  plate: 9,
  /** Blocks of back over the sand while it swims. */
  backRise: 3,
  /** The travelling wave of the plates: blocks of rise, radians between neighbours, radians a second. */
  waveAmp: 1.5, wavePhase: 0.9, waveRate: 1.4,
  /** Swimming speed, untamed and tame (blocks a second), and the turn rate (radians a second). */
  speed: 6, tameSpeed: 8, turn: 0.12,
  /** The telegraph: seconds, cracked cells, blocks between two cracks, how far from the player the leap starts. */
  telegraphS: 4.5, crackCells: 12, crackStep: 2, emergeDist: 24,
  /** The leap: seconds, how far it carries the head, blocks of arch over the sand. */
  breachS: 2.6, breachLen: 44, breachPeak: 18,
  /** Seconds of swimming with no rider before it dives, seconds under the sand before the next telegraph. */
  cruiseS: 40, restS: 8,
  /** Dive speed (blocks a second down). */
  diveRate: 3,
  /** Positive intentions on the head that calm it (owner: "enough"). */
  tameHits: 12,
  /** Half hearts the leaping head takes from a body it meets (a warning blow, never a kill from full health). */
  strike: 2,
  /** How far a step may be from the back's top and still land on it (blocks), and the band over it that still counts. */
  land: 0.6, over: 0.05,
} as const;

/**
 * Riding is new verbs on existing controls (sotano-controls §2.1: a new meaning in context, never a new button), as a
 * Minecraft mount: climb on by landing on the back; walk and jump along it; cast good intentions (switch polarity if
 * needed) from the head; once it is tame, move steers it and jump steps off. Every one is mapped on keyboard and mouse,
 * gamepad and touch (tests/sand-worm.test.ts reads them in BINDINGS).
 */
export const RIDE_CONTROLS = { climb: ['move', 'jump'], calm: ['cast', 'polarity'], steer: ['move', 'look'], dismount: ['jump'] } as const;

export type WormState = 'hidden' | 'telegraph' | 'breach' | 'cruise' | 'dive' | 'gone';

/** A segment's spine point, heading (unit, toward the head) and the top of its plate. 0 is the head. */
export interface WormSegment { x: number; y: number; z: number; hx: number; hz: number; top: number }

/** The body the worm carries and holds up (the player's: feet at y). */
export interface WormBody { x: number; y: number; z: number; vx: number; vy: number; vz: number; hw: number; h: number; onGround: boolean }

/** What the worm needs of the world. */
export interface WormHost {
  /** The feet height on the ground at a column (the top of its highest block, +1). */
  ground(x: number, z: number): number;
  /** One draw in [0, 1) from the worm's own stream (the run's `worm` fork). */
  random(): number;
  /** The ground cracks at a column: the game breaks its top block if it is sand. */
  crack(x: number, z: number, index: number): void;
}

/** What one step of the rider check found. */
export type RideEvent = 'none' | 'mounted' | 'dismounted';

interface Rider { seg: number; u: number; w: number }
interface Point { x: number; y: number; z: number }

const TRAIL_STEP = 1;

export class SandWorm {
  state: WormState = 'hidden';
  /** Seconds in the current state. */
  t = 0;
  clock = 0;
  /** Positive intentions the head took from a rider (TAME_HITS calms it). */
  warmth = 0;
  tamed = false;
  /** The tame worm has carried its rider: stepping off now is the dismount. */
  private rodeTame = false;
  /** The dismount was paid: the worm leaves for good this run. */
  rewarded = false;
  rider: Rider | null = null;
  /** Rest before the next telegraph. */
  private rest = 2;
  /** The trail: the head first, then points TRAIL_STEP apart. */
  private trail: Point[] = [];
  private heading = 0;
  private target: [number, number] | null = null;
  private steerTo: number | null = null;
  /** The crack line: cells in breaking order (the last one is the leap point), and the leap's direction. */
  crackLine: [number, number][] = [];
  cracked = 0;
  emerge: [number, number] = [0, 0];
  dir: [number, number] = [0, 1];
  private struck = false;
  private segs: WormSegment[] = [];
  /** Which way the body last met the edge of the basin: steering pressed outward against it (toasts, tests). */
  heldAtEdge = false;

  constructor(private readonly host: WormHost, readonly cx: number, readonly cz: number) {}

  get length(): number { return WORM.segments * WORM.segLen; }
  get visible(): boolean { return this.state === 'breach' || this.state === 'cruise' || this.state === 'dive'; }
  get seated(): boolean { return this.tamed && this.rider?.seg === 0; }
  get segments(): readonly WormSegment[] { return this.segs; }
  get head(): Point { return this.trail[0] ?? { x: this.cx, y: 0, z: this.cz }; }

  /** Distance of a column from the basin's centre. */
  private fromCentre(x: number, z: number) { return Math.hypot(x - this.cx, z - this.cz); }

  /** The spine height that puts the back BACK_RISE over the ground. */
  private swimY(x: number, z: number) { return this.host.ground(x, z) + WORM.backRise - WORM.radius; }
  /** The spine height with the whole body under the sand. */
  private underY(x: number, z: number) { return this.host.ground(x, z) - WORM.radius * 2 - 4; }

  /**
   * One step. `body` is the player's (null when the player is not in this world); `inDesert`: its feet stand in the
   * basin. Returns whether the head met the body during the leap this step (the game deals the blow).
   */
  update(dt: number, body: WormBody | null, inDesert: boolean): boolean {
    this.clock += dt;
    this.t += dt;
    let hit = false;
    switch (this.state) {
      case 'hidden':
        this.rest -= dt;
        if (!this.rewarded && body && inDesert && body.onGround && this.rest <= 0) this.startTelegraph(body);
        break;
      case 'telegraph': {
        const due = Math.min(this.crackLine.length, Math.floor(this.t / (WORM.telegraphS * 0.85) * this.crackLine.length));
        while (this.cracked < due) { const [x, z] = this.crackLine[this.cracked]; this.host.crack(x, z, this.cracked); this.cracked++; }
        if (this.t >= WORM.telegraphS) this.startBreach();
        break;
      }
      case 'breach': {
        const k = Math.min(1, this.t / WORM.breachS);
        const x = this.emerge[0] + this.dir[0] * WORM.breachLen * k, z = this.emerge[1] + this.dir[1] * WORM.breachLen * k;
        const y = this.underY(x, z) + (this.swimY(x, z) - this.underY(x, z)) * k + WORM.breachPeak * Math.sin(Math.PI * k);
        this.moveHead(x, y, z);
        if (body && !this.struck && !this.rider) {
          const h = this.head, d = Math.hypot(body.x - h.x, body.y + body.h / 2 - h.y, body.z - h.z);
          if (d < WORM.radius + 1) { this.struck = true; hit = true; }
        }
        if (k >= 1) this.enter('cruise');
        break;
      }
      case 'cruise': {
        this.swim(dt);
        if (this.rewarded || (!this.rider && this.t >= WORM.cruiseS)) this.enter('dive');
        break;
      }
      case 'dive': {
        const h = this.head, speed = this.tamed ? WORM.tameSpeed : WORM.speed;
        const x = h.x + Math.cos(this.heading) * speed * dt, z = h.z + Math.sin(this.heading) * speed * dt;
        this.moveHead(x, Math.max(this.underY(x, z) - this.length, h.y - WORM.diveRate * dt * 3), z);
        const tail = this.segs[this.segs.length - 1];
        if (tail && tail.top < this.host.ground(tail.x, tail.z) - 2) {
          this.rider = null;
          this.enter(this.rewarded ? 'gone' : 'hidden');
          this.rest = WORM.restS;
        }
        break;
      }
      default: break;
    }
    this.layout();
    return hit;
  }

  private enter(s: WormState) { this.state = s; this.t = 0; }

  private startTelegraph(body: WormBody) {
    let a = this.host.random() * Math.PI * 2;
    let dx = Math.cos(a), dz = Math.sin(a);
    // the leap point and the whole leap stay in the basin: else the worm leaps from the centre's side
    const ex = body.x - dx * WORM.emergeDist, ez = body.z - dz * WORM.emergeDist;
    const line = WORM.crackCells * WORM.crackStep;
    const far = (px: number, pz: number) => this.fromCentre(px, pz) > WORM_STEER_R;
    if (far(ex, ez) || far(ex - dx * line, ez - dz * line) || far(body.x + dx * (WORM.breachLen - WORM.emergeDist), body.z + dz * (WORM.breachLen - WORM.emergeDist))) {
      const l = this.fromCentre(body.x, body.z) || 1;
      dx = (body.x - this.cx) / l; dz = (body.z - this.cz) / l;
      if (l < 1) { dx = 1; dz = 0; }
      a = Math.atan2(dz, dx);
    }
    this.dir = [dx, dz];
    this.heading = a;
    this.emerge = [body.x - dx * WORM.emergeDist, body.z - dz * WORM.emergeDist];
    // the cracks run toward the leap point: the first is the farthest behind it, the last is the point itself
    this.crackLine = [];
    for (let i = WORM.crackCells - 1; i >= 0; i--)
      this.crackLine.push([Math.floor(this.emerge[0] - dx * i * WORM.crackStep), Math.floor(this.emerge[1] - dz * i * WORM.crackStep)]);
    this.cracked = 0;
    this.struck = false;
    this.enter('telegraph');
  }

  private startBreach() {
    const [ex, ez] = this.emerge, [dx, dz] = this.dir;
    // the whole body waits under the sand behind the leap point, along the crack line
    this.trail = [];
    for (let s = 0; s <= this.length + WORM.segLen; s += TRAIL_STEP) {
      const x = ex - dx * s, z = ez - dz * s;
      this.trail.push({ x, y: this.underY(x, z), z });
    }
    this.heading = Math.atan2(dz, dx);
    this.enter('breach');
  }

  /** The rider's wish while seated on a tame worm: a world direction (x, z), or null to keep the heading. */
  steer(dx: number, dz: number) {
    this.steerTo = Math.hypot(dx, dz) > 0.2 ? Math.atan2(dz, dx) : null;
  }

  private swim(dt: number) {
    const h = this.head;
    let want = this.heading;
    if (this.tamed && this.seated) {
      if (this.steerTo !== null) want = this.steerTo;
    } else {
      if (!this.target || Math.hypot(this.target[0] - h.x, this.target[1] - h.z) < 14) {
        const a = this.host.random() * Math.PI * 2, r = Math.sqrt(this.host.random()) * WORM_STEER_R * 0.6;
        this.target = [this.cx + Math.cos(a) * r, this.cz + Math.sin(a) * r];
      }
      want = Math.atan2(this.target[1] - h.z, this.target[0] - h.x);
    }
    want = this.confine(h.x, h.z, want);
    const diff = Math.atan2(Math.sin(want - this.heading), Math.cos(want - this.heading));
    this.heading += Math.max(-WORM.turn * dt, Math.min(WORM.turn * dt, diff));
    const speed = this.tamed ? WORM.tameSpeed : WORM.speed;
    let x = h.x + Math.cos(this.heading) * speed * dt, z = h.z + Math.sin(this.heading) * speed * dt;
    // never out of the basin: the head is held on the steering circle
    const r = this.fromCentre(x, z);
    if (r > WORM_STEER_R) { x = this.cx + (x - this.cx) * WORM_STEER_R / r; z = this.cz + (z - this.cz) * WORM_STEER_R / r; }
    const y = h.y + (this.swimY(x, z) - h.y) * Math.min(1, dt * 2);
    this.moveHead(x, y, z);
  }

  /**
   * The steering limit (owner: only inside the desert). Near the edge a heading with an outward part loses it, and
   * past the edge it turns inward, so neither the rider nor the worm's own wandering ever takes it out.
   */
  confine(x: number, z: number, want: number): number {
    const r = this.fromCentre(x, z);
    this.heldAtEdge = false;
    if (r < WORM_STEER_R - 30 || r === 0) return want;
    const ux = (x - this.cx) / r, uz = (z - this.cz) / r;
    let wx = Math.cos(want), wz = Math.sin(want);
    const out = wx * ux + wz * uz;
    if (out <= 0) return want;
    this.heldAtEdge = true;
    // drop the outward part (follow the rim), and lean inward the closer it is to the edge
    const lean = Math.max(0, Math.min(1, (r - (WORM_STEER_R - 30)) / 30));
    wx -= ux * out * (1 + lean); wz -= uz * out * (1 + lean);
    if (Math.hypot(wx, wz) < 1e-3) { wx = -uz; wz = ux; }
    return Math.atan2(wz, wx);
  }

  private moveHead(x: number, y: number, z: number) {
    if (!this.trail.length) this.trail.push({ x, y, z });
    const head = this.trail[0];
    head.x = x; head.y = y; head.z = z;
    // lay fixed points TRAIL_STEP apart behind the head as it moves on
    for (;;) {
      const p = this.trail[1];
      if (!p) { this.trail.push({ x, y, z }); break; }
      const d = Math.hypot(x - p.x, y - p.y, z - p.z);
      if (!(d >= TRAIL_STEP * 2)) break;
      const k = TRAIL_STEP / d;
      this.trail.splice(1, 0, { x: p.x + (x - p.x) * k, y: p.y + (y - p.y) * k, z: p.z + (z - p.z) * k });
    }
    const keep = Math.ceil((this.length + WORM.segLen * 2) / TRAIL_STEP) + 2;
    if (this.trail.length > keep) this.trail.length = keep;
  }

  /** The point at arc length `s` behind the head along the trail. */
  private along(s: number): Point {
    let left = s;
    for (let i = 0; i + 1 < this.trail.length; i++) {
      const a = this.trail[i], b = this.trail[i + 1], d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      if (left <= d && d > 0) { const k = left / d; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k }; }
      left -= d;
    }
    return { ...(this.trail[this.trail.length - 1] ?? this.head) };
  }

  /** Places the segments on the trail (called after every step). */
  private layout() {
    this.segs = [];
    if (!this.visible || !this.trail.length) return;
    for (let k = 0; k < WORM.segments; k++) {
      const s = k * WORM.segLen, c = this.along(s), f = this.along(Math.max(0, s - 1)), b = this.along(s + 1);
      let hx = f.x - b.x, hz = f.z - b.z;
      const l = Math.hypot(hx, hz);
      if (l < 1e-6) { hx = Math.cos(this.heading); hz = Math.sin(this.heading); } else { hx /= l; hz /= l; }
      const wave = WORM.waveAmp * Math.sin(WORM.waveRate * this.clock - k * WORM.wavePhase);
      this.segs.push({ x: c.x, y: c.y, z: c.z, hx, hz, top: c.y + WORM.radius + wave });
    }
  }

  /** A point in a segment's frame: along its heading (u) and across it (w). */
  private local(s: WormSegment, x: number, z: number): [number, number] {
    const dx = x - s.x, dz = z - s.z;
    return [dx * s.hx + dz * s.hz, -dx * s.hz + dz * s.hx];
  }

  private world(s: WormSegment, u: number, w: number): [number, number] {
    return [s.x + s.hx * u - s.hz * w, s.z + s.hz * u + s.hx * w];
  }

  /** The segment whose body holds the point, or -1 (the intentions' test). */
  segmentAt(x: number, y: number, z: number, r = 0): number {
    for (let k = 0; k < this.segs.length; k++) {
      const s = this.segs[k], [u, w] = this.local(s, x, z);
      if (Math.abs(u) <= WORM.plate / 2 + r && Math.abs(w) <= WORM.radius + r && y <= s.top + r && y >= s.y - WORM.radius - r) return k;
    }
    return -1;
  }

  /**
   * Before the body moves: a body that stood on the back is carried with it (its place on its plate moves with the
   * plate), and a seated rider is held on the head. Returns false when it carried nothing.
   */
  carry(b: WormBody): boolean {
    const r = this.rider, s = r ? this.segs[r.seg] : undefined;
    if (!r || !s) return false;
    const [x, z] = this.world(s, r.u, r.w);
    b.x = x; b.z = z;
    if (b.vy <= 0) b.y = s.top;
    return true;
  }

  /**
   * After the body moved: does it stand on the back? Lands it on the highest plate under its feet, stops it against
   * a plate that rises above its step (the jump from segment to segment), and keeps a seated rider in place unless it
   * jumped. `jumped`: the rider pressed jump this frame. Returns what changed.
   */
  support(b: WormBody, jumped: boolean): RideEvent {
    const was = this.rider;
    if (was && this.seated && jumped) return this.dismountTo(b);
    if (!this.visible) {
      this.rider = null;
      return this.leftTame(b);
    }
    let best = -1, bestTop = -Infinity, pushed = false;
    for (let k = 0; k < this.segs.length; k++) {
      const s = this.segs[k], [u, w] = this.local(s, b.x, b.z);
      if (Math.abs(u) > WORM.plate / 2 + b.hw || Math.abs(w) > WORM.radius + b.hw) continue;
      const gap = s.top - b.y;
      if (gap > WORM.land) {
        // a plate higher than a step: a wall at its end (the body is pushed back out along the spine)
        if (!pushed && b.y + b.h > s.y - WORM.radius && b.y < s.top) {
          pushed = true;
          // out by the shorter way: the plate's end (along the spine) or its flank (across it)
          const endIn = WORM.plate / 2 + b.hw - Math.abs(u), sideIn = WORM.radius + b.hw - Math.abs(w);
          const byEnd = endIn <= sideIn;
          const su = Math.sign(u || 1), sw = Math.sign(w || 1);
          [b.x, b.z] = byEnd ? this.world(s, (WORM.plate / 2 + b.hw + 1e-3) * su, w) : this.world(s, u, (WORM.radius + b.hw + 1e-3) * sw);
          const ax = byEnd ? s.hx : -s.hz, az = byEnd ? s.hz : s.hx, sg = byEnd ? su : sw;
          const v = b.vx * ax + b.vz * az;
          if (v * sg < 0) { b.vx -= ax * v; b.vz -= az * v; }
        }
        continue;
      }
      if (gap >= -WORM.over - (b.vy <= 0 ? Math.max(0, -b.vy) * 0.05 : 0) && b.vy <= 0 && (s.top > bestTop || k === was?.seg) && best !== was?.seg) { best = k; bestTop = s.top; }
    }
    if (best < 0) {
      this.rider = null;
      return this.leftTame(b);
    }
    const s = this.segs[best], [u, w] = this.local(s, b.x, b.z);
    b.y = s.top; b.vy = 0; b.onGround = true;
    this.rider = { seg: best, u, w };
    if (this.tamed) this.rodeTame = true;
    if (this.seated && was?.seg === 0) {
      // seated on a tame head: the body stays where it sat (move steers instead of walking)
      [b.x, b.z] = this.world(s, was.u, was.w);
      this.rider = { seg: 0, u: was.u, w: was.w };
    }
    return was ? 'none' : 'mounted';
  }

  /** The body left the back: the dismount when the worm was tame and carried it, and the body stands on the ground. */
  private leftTame(b: WormBody): RideEvent {
    if (this.rodeTame && !this.rewarded && b.onGround) return this.reward();
    return 'none';
  }

  private reward(): RideEvent {
    this.rewarded = true;
    this.rodeTame = false;
    this.rider = null;
    if (this.state === 'cruise') this.enter('dive');
    return 'dismounted';
  }

  /** A seated rider jumps off: set down beside the head on the sand, like stepping off a mount. */
  private dismountTo(b: WormBody): RideEvent {
    const s = this.segs[0];
    const side = (this.rider?.w ?? 0) >= 0 ? 1 : -1;
    const [x, z] = this.world(s, 0, side * (WORM.radius + 3));
    b.x = x; b.z = z; b.y = this.host.ground(x, z);
    b.vx = b.vy = b.vz = 0; b.onGround = true;
    this.rider = null;
    return this.rodeTame ? this.reward() : 'none';
  }

  /**
   * An intention touches the worm. Returns true when it met the body (it ends there). Only a positive one on the head,
   * from a rider standing on the head, counts; a negative one does nothing at all. Returns 'calm' for a counted hit and
   * 'tame' for the hit that tames it.
   */
  intention(x: number, y: number, z: number, positive: boolean): 'miss' | 'nothing' | 'calm' | 'tame' {
    if (!this.visible) return 'miss';
    const k = this.segmentAt(x, y, z, 0.3);
    if (k < 0) return 'miss';
    if (!positive || k !== 0 || this.rider?.seg !== 0 || this.tamed) return 'nothing';
    this.warmth++;
    if (this.warmth >= WORM.tameHits) { this.tamed = true; return 'tame'; }
    return 'calm';
  }
}
