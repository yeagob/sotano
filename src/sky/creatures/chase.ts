import { HINDRANCES } from '../hindrances';
import {
  TELEGRAPH, type ChaseSpec, type CreatureDeps, type DeityDef, type HindranceId, type HindranceParams, type SkyActor,
  type SkyFloorPlan, type SkyHost, type Vec3,
} from '../types';

export const DIVE_OVER = 2.4;
export const RISE = 1.2;
export const DODGE_RISE = 1.5;
export const EDGE = 3;
export const CEILING = 2;
export const LEAD = 1;

export interface ChaseCounts {
  dodges: number;
  dives: number;
  landed: number;
  retreats: number;
}

export interface ChaseView {
  readonly core: string;
  readonly restLeft: number;
  cutRest(s: number): void;
}

type Phase = 'free' | 'dive' | 'rise';

export class Chaser {
  readonly counts: ChaseCounts = { dodges: 0, dives: 0, landed: 0, retreats: 0 };
  private angle: number;
  private turn = 1;
  private coolLeft = 0;
  private dashLeft = 0;
  private bump = 0;
  private dodgeTo: Vec3 | null = null;
  private diveClock = 0;
  private phase: Phase = 'free';
  private phaseLeft = 0;
  private spot: Vec3 | null = null;
  private run = -1;
  private readonly spec: ChaseSpec;
  private readonly tell: number;
  private readonly box: { x0: number; x1: number; z0: number; z1: number };
  private readonly hover: number;

  constructor(
    private readonly actor: SkyActor,
    def: DeityDef,
    private readonly plan: SkyFloorPlan,
    private readonly deps: CreatureDeps,
    private readonly host: SkyHost,
    readonly home: Vec3,
  ) {
    this.spec = def.chase!;
    this.hover = def.hover ?? 0;
    this.tell = TELEGRAPH[plan.index - 1] ?? TELEGRAPH[0];
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const p of plan.graph.places) {
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x + 1);
      z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z + 1);
    }
    if (!Number.isFinite(x0)) { x0 = plan.seat.x - 8; x1 = plan.seat.x + 8; z0 = plan.seat.z - 8; z1 = plan.seat.z + 8; }
    this.box = { x0: x0 - EDGE, x1: x1 + EDGE, z0: z0 - EDGE, z1: z1 + EDGE };
    this.angle = Math.atan2(home.z - (plan.seat.z + 0.5), home.x - (plan.seat.x + 0.5));
  }

  get diving(): boolean { return this.phase === 'dive'; }
  get busy(): boolean { return this.phase !== 'free'; }

  hit(view: ChaseView) {
    if (this.coolLeft > 0 || this.phase === 'dive') return;
    const s = this.spec;
    this.coolLeft = s.cool;
    this.turn = -this.turn;
    this.angle += this.turn * s.dodge / Math.max(1, s.keep);
    this.dashLeft = s.dodge / Math.max(1e-3, s.dash) + 0.2;
    this.bump = DODGE_RISE;
    this.counts.dodges++;
    const p = this.host.player().body, h = this.home;
    const ux = h.x - p.x, uz = h.z - p.z, l = Math.hypot(ux, uz) || 1;
    this.dodgeTo = this.clamp({ x: h.x - (uz / l) * s.dodge * this.turn, y: h.y + DODGE_RISE, z: h.z + (ux / l) * s.dodge * this.turn });
    view.cutRest(s.counter);
    const b = this.actor.body;
    this.host.fx('puff', b.x, b.y + b.h / 2, b.z, 6);
    this.host.cue(s.cue, b.x, b.y + b.h, b.z);
  }

  tick(dt: number, view: ChaseView, free: boolean) {
    const s = this.spec;
    this.coolLeft = Math.max(0, this.coolLeft - dt);
    this.dashLeft = Math.max(0, this.dashLeft - dt);
    this.bump = Math.max(0, this.bump - dt * DODGE_RISE);
    if (this.dodgeTo && this.phase !== 'dive') {
      this.approach(this.dodgeTo, s.dash * dt);
      if (this.dashLeft <= 0) this.dodgeTo = null;
      if (this.phase === 'rise') { this.phaseLeft -= dt; if (this.phaseLeft <= 0) { this.phase = 'free'; this.spot = null; } }
      return;
    }
    if (this.phase !== 'free') { this.stepPhase(dt); return; }
    if (!free) return;
    const p = this.host.player().body;
    const dx = this.home.x - p.x, dz = this.home.z - p.z, d = Math.hypot(dx, dz);
    if (d > 1e-3) {
      const want = Math.atan2(dz, dx);
      let diff = want - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.angle += diff * Math.min(1, dt * 0.5);
    }
    this.angle += this.turn * s.orbit * dt;
    const close = d < s.near;
    if (close) this.counts.retreats += dt;
    const goal = this.clamp({
      x: p.x + Math.cos(this.angle) * s.keep,
      y: p.y + s.lift + this.bump,
      z: p.z + Math.sin(this.angle) * s.keep,
    });
    const speed = close || this.dashLeft > 0 ? s.dash : s.speed;
    this.approach(goal, speed * dt);
    this.diveClock += dt;
    const open = view.core === 'Recovering' || (view.core === 'Watching' && view.restLeft > 0.3);
    if (open && this.diveClock >= s.dive.every) this.startDive();
  }

  end() {
    if (this.run >= 0) this.deps.runner.stop(this.run);
    this.run = -1;
    this.dodgeTo = null;
    this.phase = 'free';
    this.spot = null;
  }

  private startDive() {
    const s = this.spec, dv = s.dive, p = this.host.player().body;
    this.diveClock = 0;
    this.phase = 'dive';
    this.phaseLeft = this.tell;
    const lead = this.tell * LEAD;
    this.spot = { x: p.x + p.vx * lead, y: p.y, z: p.z + p.vz * lead };
    this.counts.dives++;
    const at = this.spot;
    this.run = this.start(at);
    const b = this.actor.body;
    this.host.cue(dv.cue, b.x, b.y + b.h, b.z);
  }

  private start(at: Vec3): number {
    const dv = this.spec.dive, b = this.actor.body;
    const go = <K extends HindranceId>(id: K, p: HindranceParams[K]) => this.deps.runner.start(HINDRANCES[id], p, this.tell, this.actor.id);
    const feet = { x: at.x, y: Math.floor(at.y + 1e-3), z: at.z };
    if (dv.kind === 'push') return go('knockback', { from: feet, shape: 'ring', radius: dv.radius, strength: dv.strength });
    if (dv.kind === 'hold') return go('paralysis', { from: feet, speed: 8, radius: dv.radius, hold: dv.strength });
    if (dv.kind === 'pull') {
      const ux = b.x - at.x, uz = b.z - at.z, l = Math.hypot(ux, uz) || 1;
      const dir = { x: ux / l, y: 0, z: uz / l };
      const from = { x: at.x - dir.x * dv.radius, y: feet.y, z: at.z - dir.z * dv.radius };
      return go('knockback', { from, shape: 'cone', dir, radius: dv.radius * 2, strength: dv.strength });
    }
    return go('dense-ground', { cells: this.groundCells(at, dv.radius), seconds: dv.strength, slow: dv.slow ?? 0.5 });
  }

  private groundCells(at: Vec3, r: number): number[] {
    const w = this.host.world(), out: number[] = [];
    const y = Math.floor(at.y + 1e-3) - 1;
    const n = Math.ceil(r);
    for (let dz = -n; dz <= n; dz++) for (let dx = -n; dx <= n; dx++) {
      if (dx * dx + dz * dz > r * r) continue;
      const x = Math.floor(at.x) + dx, z = Math.floor(at.z) + dz;
      if (w.solid(x, y, z)) out.push(w.idx(x, y, z));
    }
    return out;
  }

  private stepPhase(dt: number) {
    this.phaseLeft -= dt;
    const s = this.spec;
    if (this.phase === 'dive' && this.spot) {
      const to = this.clamp({ x: this.spot.x, y: this.spot.y + DIVE_OVER, z: this.spot.z });
      const d = Math.hypot(to.x - this.home.x, to.y - this.home.y, to.z - this.home.z);
      this.approach(to, Math.max(s.dash * dt, d * Math.min(1, dt / Math.max(dt, this.phaseLeft))));
      if (this.phaseLeft <= 0) {
        this.counts.landed++;
        this.phase = 'rise';
        this.phaseLeft = RISE;
        this.run = -1;
        const b = this.actor.body;
        this.host.fx('puff', b.x, b.y, b.z, 8);
      }
      return;
    }
    const p = this.host.player().body;
    const up = this.clamp({ x: this.home.x, y: p.y + s.lift, z: this.home.z });
    this.approach(up, s.dash * dt);
    if (this.phaseLeft <= 0) { this.phase = 'free'; this.spot = null; }
  }

  private approach(to: Vec3, step: number) {
    const h = this.home;
    const dx = to.x - h.x, dy = to.y - h.y, dz = to.z - h.z, d = Math.hypot(dx, dy, dz);
    const k = d > 1e-9 ? Math.min(1, step / d) : 1;
    h.x += dx * k; h.y += dy * k; h.z += dz * k;
  }

  private clamp(v: Vec3): Vec3 {
    const b = this.box, top = this.plan.y1 - this.actor.body.h - CEILING;
    const out = {
      x: Math.min(b.x1, Math.max(b.x0, v.x)),
      y: Math.max(this.plan.y0, Math.min(top, v.y)),
      z: Math.min(b.z1, Math.max(b.z0, v.z)),
    };
    while (out.y < top && this.blocked(out)) out.y += 1;
    return out;
  }

  private blocked(v: Vec3): boolean {
    const w = this.host.world(), a = this.actor.body, lift = this.hover;
    const x = Math.floor(v.x), z = Math.floor(v.z);
    for (let y = Math.floor(v.y + lift); y <= Math.floor(v.y + lift + a.h); y++) if (w.solid(x, y, z)) return true;
    return false;
  }
}
