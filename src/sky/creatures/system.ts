// SkyCreatures: every deity and minion of the realm, and their touch provider (docs/architecture/SKY.md §5.2).
// Deities (C0) and minions (C1) are built here. Only the creatures of the player's floor move: the others are
// parked (hidden, not updated). Nothing here sets alive to false (law 3.7).

import type * as THREE from 'three';
import type { Polarity } from '../../combat/polarity';
import type { DamageKind } from '../../core/damage';
import type {
  CreatureDeps, DeityDef, FloorIndex, MinionDef, Place, SkyActor, SkyCreaturesApi, SkyFloorPlan, SkyHitMarksApi,
  SkyHost, TouchTarget, Vec3,
} from '../types';
import { HitMarks } from '../render/hit-marks';
import { CreatureView, HOLDER } from '../render/creature-view';
import { Deity } from './deity';
import { Minion } from './minion';

interface DeityEntry {
  deity: Deity;
  actor: SkyActor;
  def: DeityDef;
  marks: SkyHitMarksApi;
  /** Hits the marks already show. */
  seen: number;
}

interface MinionEntry {
  minion: Minion;
  actor: SkyActor;
  def: MinionDef;
  floor: number;
}

/** A minion whose model gives no size yet (the K0 stubs) still gets a body a touch can find. Provisional. */
const MINION_HW = 0.35;
const MINION_H = 0.9;

export class SkyCreatures implements SkyCreaturesApi {
  onWon: ((d: SkyActor, floor: FloorIndex) => void) | null = null;
  private view: CreatureView;
  private deities: DeityEntry[] = [];
  private byId = new Map<number, DeityEntry>();
  private minions: MinionEntry[] = [];
  private minionById = new Map<number, MinionEntry>();
  private seq = 0;

  constructor(private root: THREE.Group, private host: SkyHost, private deps: CreatureDeps) {
    this.view = new CreatureView(root);
  }

  /** A deity at its plan's seat, levitating `hover` over it (or standing on it). Wild, with no hits. */
  spawnDeity(def: DeityDef, plan: SkyFloorPlan): SkyActor {
    const seat = plan.seat;
    const hover = def.hover ?? 0;
    const actor: SkyActor = {
      id: this.deps.actors.newId(),
      kind: 'sky',
      def: def.animal,
      role: 'deity',
      animal: def.animal,
      faction: 'neutral',
      // Unused: a sky creature's health never reaches zero (law 3.7); the touch router never sends it damage.
      hp: 1,
      body: {
        x: seat.x + 0.5, y: seat.y + hover, z: seat.z + 0.5,
        vx: 0, vy: 0, vz: 0, hw: def.model.hw, h: def.model.h, onGround: def.hover === null,
      },
      tags: new Set(),
      room: -1,
      alive: true,
      spawning: 0,
      side: 'wild',
      state: 'Idle',
      t: 0,
      hits: 0,
      parked: false,
    };
    this.deps.actors.register(actor, 'sky');
    this.view.add(actor, def.model);
    const holder = this.view.parts(actor.id)?.get(HOLDER) ?? this.root;
    const deity = new Deity(actor, def, plan, this.deps, this.host, this.host.fork('sky', 'floor', plan.index, 'creature', this.seq++));
    const entry: DeityEntry = { deity, actor, def, marks: new HitMarks(holder, def.hits), seen: 0 };
    deity.onWon = d => this.onWon?.(d, def.floor);
    this.deities.push(entry);
    this.byId.set(actor.id, entry);
    return actor;
  }

  /** A wild minion at a place of its plan, showing its spawn warning first (Minion's Spawning). */
  spawnMinion(def: MinionDef, plan: SkyFloorPlan, at: Place): SkyActor {
    const actor: SkyActor = {
      id: this.deps.actors.newId(),
      kind: 'sky',
      def: def.animal,
      role: 'minion',
      animal: def.animal,
      faction: 'neutral',
      // Unused: a sky creature's health never reaches zero (law 3.7).
      hp: 1,
      body: {
        x: at.x + 0.5, y: at.y, z: at.z + 0.5,
        vx: 0, vy: 0, vz: 0, hw: def.model.hw || MINION_HW, h: def.model.h || MINION_H, onGround: true,
      },
      tags: new Set(),
      room: -1,
      alive: true,
      spawning: 0,
      side: 'wild',
      state: 'Spawning',
      t: 0,
      hits: 0,
      parked: false,
    };
    this.deps.actors.register(actor, 'sky');
    this.view.add(actor, def.model);
    const minion = new Minion(actor, def, plan, this.deps, this.host, this.host.fork('sky', 'floor', plan.index, 'creature', this.seq++));
    const entry: MinionEntry = { minion, actor, def, floor: plan.index };
    this.minions.push(entry);
    this.minionById.set(actor.id, entry);
    return actor;
  }

  owns(id: number): boolean {
    return this.byId.has(id) || this.minionById.has(id);
  }

  /** Every actor that can be touched now: unparked, and not still materialising. */
  private touchable(): SkyActor[] {
    const out: SkyActor[] = [];
    for (const e of this.deities) if (!e.actor.parked) out.push(e.actor);
    for (const e of this.minions) if (!e.actor.parked && e.actor.spawning <= 0) out.push(e.actor);
    return out;
  }

  /** The creature whose box, grown by `r`, holds the point; the nearest one. −1 for none. */
  at(x: number, y: number, z: number, r: number): number {
    let best = -1;
    let bestD = Infinity;
    for (const a of this.touchable()) {
      const b = a.body;
      const dx = x - b.x, dz = z - b.z;
      if (Math.abs(dx) > b.hw + r || Math.abs(dz) > b.hw + r) continue;
      if (y < b.y - r || y > b.y + b.h + r) continue;
      const dy = y - (b.y + b.h / 2);
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestD) { bestD = d; best = a.id; }
    }
    return best;
  }

  targets(): readonly TouchTarget[] {
    const out: TouchTarget[] = [];
    for (const a of this.touchable()) {
      const b = a.body;
      out.push({ id: a.id, x: b.x, y: b.y, z: b.z, hw: b.hw, h: b.h });
    }
    return out;
  }

  /** A touch on a creature: a warm positive one may count a hit (and leaves a gold mark); anything else puffs or does nothing. */
  touch(id: number, polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind) {
    const m = this.minionById.get(id);
    if (m) {
      m.minion.touch(polarity, warm, p, kind);
      return;
    }
    const e = this.byId.get(id);
    if (!e) return;
    e.deity.touch(polarity, warm, p, kind);
    const a = e.actor;
    if (a.hits > e.seen) {
      e.marks.add({ x: p.x - a.body.x, y: p.y - a.body.y, z: p.z - a.body.z });
      e.seen = a.hits;
    }
  }

  /** Only the creatures of `floor` move; the others are parked (hidden, not updated) until the player comes back. */
  update(dt: number, floor: number) {
    for (const e of this.deities) {
      const on = e.def.floor === floor;
      e.actor.parked = !on;
      if (!on) continue;
      e.deity.update(dt);
      const parts = this.view.parts(e.actor.id);
      if (parts) e.def.model.progress(parts, e.actor.hits / e.def.hits);
    }
    for (const m of this.minions) {
      const on = m.floor === floor;
      m.actor.parked = !on;
      if (!on) continue;
      const deity = this.deities.find(e => e.def.floor === m.floor)?.deity ?? null;
      const others = this.minions.filter(o => o.floor === m.floor && o !== m).map(o => o.actor);
      m.minion.update(dt, deity, others);
      const parts = this.view.parts(m.actor.id);
      if (parts) m.def.model.react(parts, m.actor.hits / Math.max(1, m.def.hitsToTurn));
    }
    this.view.update(dt, this.all());
  }

  /** The minions of floor `floor`, parked or not: what its spawner counts against `max` and `wildMax`. */
  minionsOn(floor: number): SkyActor[] {
    const out: SkyActor[] = [];
    for (const m of this.minions) if (m.floor === floor) out.push(m.actor);
    return out;
  }

  all(): readonly SkyActor[] {
    return [...this.deities.map(e => e.actor), ...this.minions.map(e => e.actor)];
  }

  dispose() {
    for (const e of this.deities) {
      e.marks.dispose();
      this.deps.actors.remove(e.actor.id);
    }
    for (const m of this.minions) {
      m.minion.dispose();
      this.deps.actors.remove(m.actor.id);
    }
    this.view.dispose();
    this.deities = [];
    this.byId.clear();
    this.minions = [];
    this.minionById.clear();
  }
}
