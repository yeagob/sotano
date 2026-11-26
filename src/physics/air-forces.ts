// The forces that act on the player's body while it is in the air (docs/architecture/ENTITIES.md, "Forces in the air"): a list of
// sources (the wind above the crown is one) and a list of filters that may change or cancel a source's force (a
// practice's shield, such as the Lion's, is meant to be one). Pure: no three.js, no game state.

/** A horizontal acceleration, blocks/s². */
export interface AirVec { x: number; z: number }

/** What a source is asked each frame: where the feet are, and the body's own air control force this frame. */
export interface AirQuery {
  x: number; y: number; z: number;
  /** The player's own air movement force this frame, blocks/s²: how hard the walk can pull the body in the air
   *  (`airControlForce` in `src/entities/player.ts`). A source may scale itself by it, as the wind does. */
  control: number;
}

/** A source of force in the air. `at` returns its acceleration for this query, or null where it does not act. */
export interface AirForce {
  readonly id: string;
  at(q: AirQuery): AirVec | null;
}

/** Changes a source's force before it is summed: return the force to keep (scaled or turned), or null to cancel it. */
export type AirFilter = (source: string, force: AirVec, q: AirQuery) => AirVec | null;

/** The air's sources and filters. The body asks `total` once per frame, only while it is airborne. */
export class AirForces {
  private sources: AirForce[] = [];
  private filters = new Map<string, AirFilter>();

  /** Adds a source; a source with the same id replaces the old one. */
  add(source: AirForce) {
    this.remove(source.id);
    this.sources.push(source);
  }

  remove(id: string) { this.sources = this.sources.filter(s => s.id !== id); }

  /** Adds a filter under a name (a practice's id); the same name replaces it. Returns a function that removes it. */
  filter(name: string, fn: AirFilter): () => void {
    this.filters.set(name, fn);
    return () => { if (this.filters.get(name) === fn) this.filters.delete(name); };
  }

  /** The force of one source after every filter, or null when it does not act or a filter cancels it. */
  forceOf(id: string, q: AirQuery): AirVec | null {
    const s = this.sources.find(src => src.id === id);
    return s ? this.filtered(s, q) : null;
  }

  /** The sum of every source's filtered force, written into `out`. */
  total(q: AirQuery, out: AirVec = { x: 0, z: 0 }): AirVec {
    out.x = 0; out.z = 0;
    for (const s of this.sources) {
      const f = this.filtered(s, q);
      if (f) { out.x += f.x; out.z += f.z; }
    }
    return out;
  }

  private filtered(s: AirForce, q: AirQuery): AirVec | null {
    let f = s.at(q);
    for (const fn of this.filters.values()) {
      if (!f) return null;
      f = fn(s.id, f, q);
    }
    return f && Number.isFinite(f.x + f.z) ? f : null;
  }
}
