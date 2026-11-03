// SkyCreatures: every deity and minion of the realm, and their touch provider (docs/architecture/SKY.md §5.2).
// Deities are built here (C0); minions are C1's and still refuse to spawn. Only the creatures of the player's
// floor move: the others are parked (hidden, not updated). Nothing here sets alive to false (law 3.7).

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

interface DeityEntry {
  deity: Deity;
  actor: SkyActor;
  def: DeityDef;
  marks: SkyHitMarksApi;
  /** Hits the marks already show. */
  seen: number;
}

export class SkyCreatures implements SkyCreaturesApi {
  onWon: ((d: SkyActor, floor: FloorIndex) => void) | null = null;
  private view: CreatureView;
  private deities: DeityEntry[] = [];
  private byId = new Map<number, DeityEntry>();
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

  spawnMinion(_def: MinionDef, _plan: SkyFloorPlan, _at: Place): SkyActor { throw new Error('SkyCreatures.spawnMinion: not built (C1)'); }

  owns(id: number): boolean {
    return this.byId.has(id);
  }

  /** The creature whose box, grown by `r`, holds the point; the nearest one. −1 for none. */
  at(x: number, y: number, z: number, r: number): number {
    let best = -1;
    let bestD = Infinity;
    for (const e of this.deities) {
      const a = e.actor;
      if (a.parked) continue;
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
    for (const e of this.deities) {
      const a = e.actor;
      if (a.parked) continue;
      const b = a.body;
      out.push({ id: a.id, x: b.x, y: b.y, z: b.z, hw: b.hw, h: b.h });
    }
    return out;
  }

  /** A touch on a creature: a warm positive one may count a hit (and leaves a gold mark); anything else puffs or does nothing. */
  touch(id: number, polarity: Polarity, warm: boolean, p: Vec3, kind: DamageKind) {
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
    this.view.update(dt, this.all());
  }

  all(): readonly SkyActor[] {
    return this.deities.map(e => e.actor);
  }

  dispose() {
    for (const e of this.deities) {
      e.marks.dispose();
      this.deps.actors.remove(e.actor.id);
    }
    this.view.dispose();
    this.deities = [];
    this.byId.clear();
  }
}
