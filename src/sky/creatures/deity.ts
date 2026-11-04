// The deity framework: the machine, stages, positive hits, levitation, teleport, won (docs/architecture/SKY.md §5.3).
// A deity is data (its DeityDef) run by this one machine. Attacks never take health: they go through
// ctx.hinder, and a negative touch only puffs. Nothing here sets a deity's alive flag (law 3.7).

import type { Polarity } from '../../combat/polarity';
import type { DamageKind } from '../../core/damage';
import type { Rng } from '../../core/rng';
import { HINDRANCES } from '../hindrances';
import {
  MIN_TELEGRAPH, type AttackDef, type CreatureDeps, type CustomState, type DeityApi, type DeityCtx, type DeityDef,
  type HindranceId, type HindranceParams, type Place, type PositiveHit, type SkyActor, type SkyFloorPlan, type SkyHost,
  type Stage, type TelegraphSpec, type Vec3,
} from '../types';

export { TELEGRAPH, MIN_TELEGRAPH } from '../types';
/** Seconds of the Hurt overlay after a counted hit. */
export const HURT = 0.3;
/** Seconds of Rallying at a stage change. */
export const RALLY = 2;
/** Teleport far never lands within this distance of the player. */
export const TELEPORT_MIN = 12;
/** Levitation: the bob of 0.15 at 0.5 Hz (SKY.md §5.3). The drift round the home is provisional. */
export const BOB = 0.15;
export const BOB_HZ = 0.5;
export const DRIFT_RADIUS = 1;
/** Radians a second. */
export const DRIFT_RATE = 0.1;
/** Watching ends when the player is this many sights away (hysteresis, so it does not flicker at the edge). */
const LOSE = 1.5;
/** Horizontal speed below which the player counts as standing still. */
const STILL_SPEED = 0.05;
/** Two states beyond the six of CoreState: Teleporting (provisional, koala and horse) and Won (the player's ally). */
export const TELEPORTING = 'Teleporting';
export const WON = 'Won';

/** stage = min(2, ⌊3·hits / target⌋). */
export const stageOf = (hits: number, target: number): Stage => Math.min(2, Math.floor(3 * hits / target)) as Stage;

/** The first rule that names an aim, or null (the elephant's Memory). Attacks call it. */
export function aimOf(ctx: DeityCtx): Vec3 | null {
  for (const r of ctx.def.rules ?? []) {
    const p = r.aim?.(ctx);
    if (p) return p;
  }
  return null;
}

/** The product of the rules' reach factors for one attack (facing the lion's roar: 0.5). */
export function reachOf(ctx: DeityCtx, attack: AttackDef): number {
  let f = 1;
  for (const r of ctx.def.rules ?? []) f *= r.scale?.(ctx, attack) ?? 1;
  return f;
}

/** One state's behaviour, the same shape for the core states and the custom ones. */
interface Rec {
  enter?(): void;
  tick?(dt: number): void;
  exit?(): void;
  next(): string | null;
}

export class Deity implements DeityApi {
  /** The telegraph being shown now (the animal's files read it to pose the body). */
  telegraphing: TelegraphSpec | null = null;
  /** False while the animal's files move the body themselves (the horse's leap, the tower knock). */
  anchored = true;
  onWon: ((d: SkyActor) => void) | null = null;

  private level: Stage = 0;
  private wonFlag = false;
  /** The underlying state. actor.state shows Hurt while the overlay is up. */
  private core = 'Idle';
  /** Seconds in the underlying state. */
  private t = 0;
  private hurtLeft = 0;
  private clock = 0;
  private stillFor = 0;
  private restLeft = 0;
  private pendingRally = false;
  private attack: AttackDef | null = null;
  private lastAttack: string | null = null;
  private acted = false;
  private home: Vec3;
  private used = new Set<string>();
  private customs = new Map<string, CustomState>();
  private replacing = new Map<string, CustomState>();
  private ctx: DeityCtx;
  private coreRecs: Record<string, Rec>;

  constructor(
    readonly actor: SkyActor,
    readonly def: DeityDef,
    private plan: SkyFloorPlan,
    private deps: CreatureDeps,
    private host: SkyHost,
    rng: Rng,
  ) {
    for (const s of def.states ?? []) {
      this.customs.set(s.name, s);
      if (s.replaces) this.replacing.set(s.replaces, s);
    }
    this.home = { x: plan.seat.x + 0.5, y: plan.seat.y, z: plan.seat.z + 0.5 };
    const self = this;
    this.ctx = {
      host,
      deity: actor,
      def,
      plan,
      rng,
      get stage() { return self.level; },
      get minions() { return self.minionsOfFloor(); },
      hinder: <K extends HindranceId>(id: K, p: HindranceParams[K], source?: number) =>
        deps.runner.start(HINDRANCES[id], p, MIN_TELEGRAPH, source ?? actor.id),
      go: name => self.go(name),
      still: () => self.stillFor,
      distance: () => self.distanceToPlayer(),
      far: min => self.farPlace(min),
    };
    this.coreRecs = {
      Idle: { next: () => (this.inSight() ? 'Watching' : null) },
      Watching: {
        enter: () => { this.restLeft = def.rest[this.level] + this.delays(); },
        tick: dt => { this.restLeft -= dt; },
        next: () => {
          if (this.distanceToPlayer() > def.sight * LOSE) return 'Idle';
          if (this.restLeft > 0 || !this.inSight()) return null;
          this.attack = this.choose();
          return this.attack ? 'Attacking' : null;
        },
      },
      Attacking: {
        enter: () => {
          const a = this.attack;
          if (!a) return;
          this.acted = false;
          this.lastAttack = a.id;
          this.telegraphing = a.telegraph;
          const b = actor.body;
          host.cue(a.telegraph.cue, b.x, b.y + b.h, b.z);
        },
        tick: () => {
          if (!this.acted && this.attack && this.t >= this.telegraphLength()) {
            this.acted = true;
            this.attack.act(this.ctx);
          }
        },
        next: () => (!this.attack ? 'Watching' : this.acted ? 'Recovering' : null),
        exit: () => { this.telegraphing = null; this.attack = null; },
      },
      Recovering: {
        next: () => {
          if (this.t < def.recover) return null;
          if (this.pendingRally) { this.pendingRally = false; return 'Rallying'; }
          return 'Watching';
        },
      },
      Rallying: { next: () => (this.t >= RALLY ? 'Watching' : null) },
      [TELEPORTING]: {
        enter: () => {
          const b = actor.body;
          this.telegraphing = { tell: 'body', pose: 'fade', cue: 'core.shimmer' };
          host.fx('shimmer', b.x, b.y + b.h / 2, b.z);
          host.cue('core.shimmer', b.x, b.y + b.h / 2, b.z);
        },
        next: () => {
          if (this.t < this.telegraphLength()) return null;
          const to = this.farPlace(TELEPORT_MIN);
          if (to) this.placeAt(to);
          return 'Watching';
        },
        exit: () => { this.telegraphing = null; },
      },
      [WON]: {
        enter: () => {
          def.won.play(this.ctx);
          if (def.won.toast) host.toast(def.won.toast);
          if (def.won.gift) host.gift(def.won.gift, plan.seat.x + 0.5, plan.seat.y, plan.seat.z + 0.5);
          this.onWon?.(actor);
        },
        next: () => null,
      },
    };
    this.placeBody(0);
    this.enterState(this.resolve('Idle'));
    this.sync();
  }

  get stage(): Stage { return this.level; }
  get won(): boolean { return this.wonFlag; }

  update(dt: number) {
    const p = this.host.player().body;
    const moving = Math.hypot(p.vx, p.vz) > STILL_SPEED || !p.onGround;
    this.stillFor = moving ? 0 : this.stillFor + dt;
    this.clock += dt;
    this.t += dt;
    if (this.hurtLeft > 0) this.hurtLeft = Math.max(0, this.hurtLeft - dt);
    for (const r of this.def.rules ?? []) r.tick?.(this.ctx, dt);
    // A tick may already have moved the machine (an attack's act that goes to Teleporting): then its next is not asked.
    const from = this.core;
    this.recOf(from).tick?.(dt);
    if (this.core === from) {
      const next = this.recOf(from).next();
      if (next !== null) this.go(next);
    }
    this.placeBody(dt);
    this.sync();
  }

  /** A warm positive touch adds hits. A beam's cold repeat ticks add nothing. A negative touch only puffs (law 3.3). */
  touch(polarity: Polarity, warm: boolean, p: Vec3, _kind: DamageKind) {
    if (polarity === 'negative') { this.deps.puff.at(p); return; }
    if (this.wonFlag || !warm) return;
    if (this.def.guard?.(this.actor, this.ctx)) { this.deps.puff.at(p); return; }
    // The touch carries no weapon id here; R2 may pass one later (only a rule's worth reads it).
    const hit: PositiveHit = { x: p.x, y: p.y, z: p.z, cell: -1, actor: this.actor.id, weapon: 'intent', warm };
    this.actor.hits = Math.min(this.def.hits, this.actor.hits + this.worth(hit));
    this.host.fx('gold', p.x, p.y, p.z);
    this.host.cue('core.gold', p.x, p.y, p.z);
    this.hurtLeft = HURT;
    if (this.actor.hits >= this.def.hits) {
      this.win();
    } else {
      const s = stageOf(this.actor.hits, this.def.hits);
      if (s > this.level) {
        this.level = s;
        // A telegraph on show is never cancelled: the rally waits for its recovery.
        if (this.core === 'Attacking' || this.core === TELEPORTING) this.pendingRally = true;
        else this.go('Rallying');
      }
    }
    this.sync();
  }

  /** Won: the deity becomes the player's ally, its outcome plays, and onWon fires once (the floor's way up opens). */
  private win() {
    this.wonFlag = true;
    this.pendingRally = false;
    this.hurtLeft = 0;
    this.actor.side = 'ally';
    this.actor.faction = 'self';
    this.go(WON);
  }

  private worth(hit: PositiveHit): number {
    for (const r of this.def.rules ?? []) {
      const w = r.worth?.(this.ctx, hit);
      if (w !== undefined) return w;
    }
    return 1;
  }

  private delays(): number {
    let s = 0;
    for (const r of this.def.rules ?? []) s += r.delay?.(this.ctx) ?? 0;
    return s;
  }

  private telegraphLength(): number {
    return Math.max(MIN_TELEGRAPH, this.def.telegraph);
  }

  private inSight(): boolean {
    return this.distanceToPlayer() <= this.def.sight;
  }

  private distanceToPlayer(): number {
    const p = this.host.player().body;
    return Math.hypot(p.x - this.actor.body.x, p.z - this.actor.body.z);
  }

  /** An attack of the current stage, never the last one again while another is available. */
  private choose(): AttackDef | null {
    const ok = this.def.attacks.filter(a => a.stage <= this.level);
    if (ok.length === 0) return null;
    const fresh = ok.filter(a => a.id !== this.lastAttack);
    const pool = fresh.length > 0 ? fresh : ok;
    return pool[this.ctx.rng.int(0, pool.length - 1)];
  }

  /** The plan's place farthest from the player, when it is at least `min` away; otherwise null. */
  private farPlace(min: number): Place | null {
    const p = this.host.player().body;
    let best: Place | null = null;
    let bestD = -1;
    for (const place of this.plan.graph.places) {
      const d = Math.hypot(place.x + 0.5 - p.x, place.z + 0.5 - p.z);
      if (d > bestD) { bestD = d; best = place; }
    }
    return best && bestD >= min ? best : null;
  }

  private placeAt(to: Place) {
    this.home = { x: to.x + 0.5, y: to.y, z: to.z + 0.5 };
    const b = this.actor.body;
    b.x = this.home.x;
    b.z = this.home.z;
    b.y = to.y + (this.def.hover ?? 0);
    this.host.fx('shimmer', b.x, b.y + b.h / 2, b.z);
  }

  /** Levitation: a bob and a slow drift round the home. A walking deity (hover null) stays where its files put it. */
  private placeBody(_dt: number) {
    if (!this.anchored || this.def.hover === null) return;
    const a = this.clock * DRIFT_RATE;
    const b = this.actor.body;
    b.x = this.home.x + DRIFT_RADIUS * Math.cos(a);
    b.z = this.home.z + DRIFT_RADIUS * Math.sin(a);
    b.y = this.home.y + this.def.hover + BOB * Math.sin(2 * Math.PI * BOB_HZ * this.clock);
    b.vx = 0; b.vy = 0; b.vz = 0;
  }

  /** The minions of this deity's floor: the sky actors of its animal with the minion role. */
  private minionsOfFloor(): SkyActor[] {
    const out: SkyActor[] = [];
    for (const a of this.deps.actors?.all() ?? []) {
      if (a.kind !== 'sky') continue;
      const s = a as SkyActor;
      if (s.role === 'minion' && s.animal === this.def.animal) out.push(s);
    }
    return out;
  }

  /** The custom state that replaces a core name now, if any (a `once` one only the first time). */
  private resolve(name: string): string {
    const c = this.replacing.get(name);
    if (c && !(c.once && this.used.has(c.name))) return c.name;
    return name;
  }

  private recOf(name: string): Rec {
    const c = this.customs.get(name);
    if (c) {
      const ctx = this.ctx;
      return {
        enter: c.enter ? () => c.enter?.(ctx) : undefined,
        tick: c.tick ? dt => c.tick?.(ctx, dt) : undefined,
        exit: c.exit ? () => c.exit?.(ctx) : undefined,
        next: () => c.next(ctx),
      };
    }
    return this.coreRecs[name] ?? { next: () => null };
  }

  private go(name: string) {
    if (name === TELEPORTING && !this.def.teleport) return;
    this.recOf(this.core).exit?.();
    this.enterState(this.resolve(name));
    this.sync();
  }

  private enterState(name: string) {
    if (this.customs.has(name)) this.used.add(name);
    this.core = name;
    this.t = 0;
    this.recOf(name).enter?.();
  }

  private sync() {
    this.actor.state = this.hurtLeft > 0 && !this.wonFlag ? 'Hurt' : this.core;
    this.actor.t = this.t;
  }
}
