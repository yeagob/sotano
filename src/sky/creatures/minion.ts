// The minion framework: rules, turning, ally helps, the stuck guard, the spawner (docs/architecture/SKY.md §5.4,
// docs/design/not-built/sky/minions/README.md). A minion is data (its MinionDef) run by this one machine:
//
//   Spawning (its warning at the spawn point) → Wild or Asleep → (Reacting after each positive hit) → Ally
//   Wild or Asleep → Calm when its deity is won (an attitude change; allies stay allies)
//   any moving state → Returning (the stuck guard) → Fading → Spawning again at home
//
// A wild minion runs its def's rules in order, the first that acts wins the tick; an ally runs its helps' rules
// the same way and, near its deity, adds hits on the floor's timer up to the floor's cap. A negative touch only
// puffs (law 3.3), an ally never turns back, and nothing here sets alive to false (law 3.7). Nothing a minion
// does hurts: a rule that hinders starts a hindrance, which shows the floor's full telegraph first.

import type { Polarity } from '../../combat/polarity';
import type { DamageKind } from '../../core/damage';
import type { Rng } from '../../core/rng';
import { nearest } from '../floors/graph';
import { HINDRANCES } from '../hindrances';
import {
  TELEGRAPH, type CreatureDeps, type DeityApi, type Gait, type HindranceId, type HindranceParams, type MinionApi,
  type MinionCtx, type MinionDef, type MinionRule, type Place, type SkyActor, type SkyFloorPlan, type SkyHost, type Vec3,
} from '../types';
import { arrived } from './gaits';

/** Seconds without reaching its graph target before the stuck guard acts. */
export const STUCK = 6;
/** Seconds of the soft reaction to a positive hit (the minion does nothing else meanwhile). */
export const REACT = 0.6;
/** Seconds a stuck minion takes to fade out before it comes back at home. */
export const FADE = 1;
/** The shortest warning a minion shows before it appears, even when its def asks for none (law 3.6). */
export const MIN_WARNING = 0.5;
/** An ally this close to its deity (horizontally, and within its height) counts as helping it. */
export const HELP_RANGE = 3;
/** Seconds between the motes of a spawn warning. */
const OMEN_EVERY = 0.25;

export const SPAWNING = 'Spawning';
export const WILD = 'Wild';
export const ASLEEP = 'Asleep';
export const REACTING = 'Reacting';
export const ALLY = 'Ally';
export const CALM = 'Calm';
export const RETURNING = 'Returning';
export const FADING = 'Fading';

/** Every minion machine by its actor, so one minion's rule can move or send another (a clear help). */
const BY_ACTOR = new WeakMap<SkyActor, Minion>();
/** Hits the allies of each deity have added on its floor (the cap is the floor's). */
const HELPED = new WeakMap<DeityApi, number>();

/** Hits the allies have added to a deity so far. */
export const helpedHits = (d: DeityApi): number => HELPED.get(d) ?? 0;

export class Minion implements MinionApi {
  readonly ctx: MinionCtx;
  private dt = 0;
  private deity: DeityApi | null = null;
  private others: readonly SkyActor[] = [];
  /** Where it spawned: the stuck guard brings it back here. */
  private home: Place | null;
  private left = 0;
  private omen = 0;
  /** The graph target it is walking to, and for how long it has not reached it. */
  private target: number | null = null;
  private targetFor = 0;
  private back: Place | null = null;
  private helpT = 0;
  private owners = new Set<number>();

  constructor(
    readonly actor: SkyActor,
    readonly def: MinionDef,
    private plan: SkyFloorPlan,
    private deps: CreatureDeps,
    private host: SkyHost,
    rng: Rng,
  ) {
    const b = actor.body;
    this.home = actor.body ? nearest(plan.graph, b.x, b.y, b.z) : null;
    const self = this;
    this.ctx = {
      host, def, plan, rng,
      get deity() { return self.deity?.actor ?? null; },
      get others() { return self.others; },
      hinder: <K extends HindranceId>(id: K, p: HindranceParams[K], source?: number) =>
        deps.runner.start(HINDRANCES[id], p, TELEGRAPH[plan.index - 1] ?? TELEGRAPH[0], source ?? actor.id),
      moveTo: (m, to, gait) => self.moveTo(m, to, gait),
      protect: (cells, owner) => { self.owners.add(owner); deps.effects.protect(cells, owner); },
      release: owner => { self.owners.delete(owner); deps.effects.release(owner); },
      go: (m, state) => {
        const other = m === actor ? self : BY_ACTOR.get(m);
        other?.go(state);
      },
    };
    BY_ACTOR.set(actor, this);
    this.enterSpawning();
  }

  update(dt: number, deity: DeityApi | null, others: readonly SkyActor[]) {
    const a = this.actor;
    if (!a.body) return;
    this.dt = dt;
    this.deity = deity;
    this.others = others;
    a.t += dt;
    switch (a.state) {
      case SPAWNING: return this.spawning(dt);
      case FADING: return this.fading(dt);
      case REACTING:
        this.left -= dt;
        if (this.left <= 0) this.go(WILD);
        return;
      case RETURNING: return this.returning(dt);
      case ALLY: return this.ally(dt);
      case CALM: return;
      default:
        // a wild minion follows its deity's change of heart (minions README §3, provisional)
        if (deity?.won) { this.go(CALM); return; }
        this.runRules(this.def.rules);
    }
  }

  /** A warm positive touch counts toward turning; a negative one only puffs (law 3.3). */
  touch(polarity: Polarity, warm: boolean, p: Vec3, _kind: DamageKind) {
    if (polarity === 'negative') { this.deps.puff.at(p); return; }
    const a = this.actor;
    if (!warm || a.state === SPAWNING || a.state === FADING) return;
    this.host.fx('gold', p.x, p.y, p.z);
    this.host.cue('core.gold', p.x, p.y, p.z);
    if (a.side === 'ally') return;
    a.hits = Math.min(this.def.hitsToTurn, a.hits + 1);
    if (a.hits >= this.def.hitsToTurn) this.turn();
    else this.go(REACTING);
  }

  /** Ends everything the minion holds: its protected cells. The system calls it when the minion leaves for good. */
  dispose() {
    for (const o of this.owners) this.deps.effects.release(o);
    this.owners.clear();
    BY_ACTOR.delete(this.actor);
  }

  /** Changes the machine's state. A wild minion turns only by positive hits, so 'Ally' here is refused. */
  go(state: string) {
    const a = this.actor;
    if (state === ALLY && a.side !== 'ally') return;
    if (a.side === 'ally' && (state === WILD || state === ASLEEP || state === CALM)) state = ALLY;
    if (state === REACTING) this.left = REACT;
    if (state === FADING) this.left = FADE;
    if (state === SPAWNING) { this.enterSpawning(); return; }
    a.state = state;
    a.t = 0;
  }

  /** Moves `m` with its own gait (or `gait`); true once it is there. The stuck guard watches this minion's own moves. */
  private moveTo(m: SkyActor, to: Place, gait?: Gait): boolean {
    const mover = m === this.actor ? this : BY_ACTOR.get(m);
    const g = gait ?? mover?.def.gait ?? this.def.gait;
    const there = g.step(m, mover?.ctx ?? this.ctx, to, this.dt);
    if (m !== this.actor) return there;
    if (this.target !== to.id) { this.target = to.id; this.targetFor = 0; }
    if (there) { this.targetFor = 0; return true; }
    this.targetFor += this.dt;
    if (this.targetFor >= STUCK && this.actor.state !== RETURNING) this.stuck();
    return false;
  }

  private runRules(rules: readonly MinionRule[]) {
    for (const r of rules) if (r(this.actor, this.ctx)) return;
  }

  private ally(dt: number) {
    for (const h of this.def.ally) if (h.rule(this.actor, this.ctx)) break;
    const d = this.deity;
    if (!d || d.won || !this.def.ally.some(h => h.kind === 'help')) return;
    const at = d.def.ally;
    const b = this.actor.body, db = d.actor.body;
    if (Math.hypot(b.x - db.x, b.z - db.z) > HELP_RANGE || Math.abs(b.y - db.y) > db.h + HELP_RANGE) { this.helpT = 0; return; }
    this.helpT += dt;
    if (at.every <= 0 || this.helpT < at.every) return;
    this.helpT -= at.every;
    const p = { x: db.x, y: db.y + db.h / 2, z: db.z };
    if (at.calm) {
      // the horse's floor: an ally brings calm, never hits
      this.host.fx('motes', p.x, p.y, p.z, 4);
      return;
    }
    const added = helpedHits(d);
    if (added >= at.cap) return;
    HELPED.set(d, added + 1);
    d.touch('positive', true, p, 'intent');
  }

  private turn() {
    const a = this.actor;
    a.side = 'ally';
    a.faction = 'self';
    const b = a.body;
    this.host.fx('gold', b.x, b.y + b.h / 2, b.z, 8);
    this.host.cue('core.gold', b.x, b.y + b.h, b.z);
    // it stops hindering: a warning of its own that has not landed yet is withdrawn
    for (const r of this.deps.runner.active()) if (r.source === a.id && r.phase === 'telegraph') this.deps.runner.stop(r.run);
    this.target = null;
    this.targetFor = 0;
    this.go(ALLY);
  }

  /** The stuck guard: walk back to the nearest graph node; if that fails too, fade out and come back at home. */
  private stuck() {
    const b = this.actor.body;
    const back = nearest(this.plan.graph, b.x, b.y, b.z);
    this.targetFor = 0;
    if (!back || this.target === back.id) { this.go(FADING); return; }
    this.back = back;
    this.go(RETURNING);
  }

  private returning(dt: number) {
    const to = this.back;
    if (!to) { this.go(FADING); return; }
    const there = to && (arrived(this.actor, to) || this.def.gait.step(this.actor, this.ctx, to, dt));
    this.targetFor += dt;
    if (there) {
      this.back = null;
      this.target = null;
      this.targetFor = 0;
      this.go(this.actor.side === 'ally' ? ALLY : WILD);
    } else if (this.targetFor >= STUCK) {
      this.back = null;
      this.go(FADING);
    }
  }

  private fading(dt: number) {
    const b = this.actor.body;
    this.left -= dt;
    this.omen -= dt;
    if (this.omen <= 0) { this.omen += OMEN_EVERY; this.host.fx('puff', b.x, b.y + b.h / 2, b.z, 3); }
    if (this.left > 0) return;
    const home = this.home;
    if (home) {
      b.x = home.x + 0.5; b.y = home.y; b.z = home.z + 0.5;
      b.vx = 0; b.vy = 0; b.vz = 0;
    }
    this.target = null;
    this.targetFor = 0;
    this.enterSpawning();
  }

  private enterSpawning() {
    const a = this.actor;
    this.left = Math.max(MIN_WARNING, this.def.spawn.warning);
    this.omen = 0;
    a.state = SPAWNING;
    a.t = 0;
    a.spawning = this.left;
    if (a.body) this.host.cue('core.shimmer', a.body.x, a.body.y, a.body.z);
  }

  private spawning(dt: number) {
    const a = this.actor, b = a.body;
    this.left -= dt;
    this.omen -= dt;
    a.spawning = Math.max(0, this.left);
    if (this.omen <= 0) { this.omen += OMEN_EVERY; this.host.fx('motes', b.x, b.y + 0.5, b.z, 3); }
    if (this.left > 0) return;
    a.spawning = 0;
    this.go(a.side === 'ally' ? ALLY : this.def.spawn.asleep ? ASLEEP : WILD);
  }
}

/**
 * Keeps a floor's minions at their count: one more every `spawn.every` seconds while the floor has fewer than
 * `max` minions and fewer than `wildMax` wild ones. Each comes at one of the plan's spawn places, chosen with the
 * floor's fork, and shows its own warning there (Minion's Spawning).
 *
 * With `opening`, the floor is filled first (the koala's floor "begins with three clusters", KOALA B5; provisional
 * for the other four): the first minion comes on the first update, and the next ones one warning apart, each at the
 * next spawn place in turn, until the floor holds `wildMax` wild ones (or `max` in all). Then the timer above runs.
 */
export class MinionSpawner {
  private clock = 0;
  private opening: boolean;
  private next = 0;

  constructor(
    private def: MinionDef,
    private plan: SkyFloorPlan,
    private rng: Rng,
    private spawn: (at: Place) => SkyActor,
    private living: () => readonly SkyActor[],
    opening = false,
  ) {
    this.opening = opening;
    if (opening) this.clock = Infinity;
  }

  /** True while the floor is still being filled for the first time. */
  get filling(): boolean { return this.opening; }

  update(dt: number) {
    const all = this.living();
    const wild = all.filter(a => a.side === 'wild').length;
    if (all.length >= this.def.max || wild >= this.def.wildMax || this.plan.spawns.length === 0) {
      this.opening = false;
      this.clock = 0;
      return;
    }
    this.clock += dt;
    if (this.opening) {
      if (this.clock < Math.max(MIN_WARNING, this.def.spawn.warning)) return;
      this.clock = 0;
      this.spawn(this.plan.spawns[this.next++ % this.plan.spawns.length]);
      return;
    }
    if (this.clock < this.def.spawn.every) return;
    this.clock = 0;
    this.spawn(this.plan.spawns[this.rng.int(0, this.plan.spawns.length - 1)]);
  }
}
